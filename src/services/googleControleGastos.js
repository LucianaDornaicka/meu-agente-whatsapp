import { google } from 'googleapis';
import { existsSync, readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const SPREADSHEET_ID = process.env.CONTROLE_GASTOS_SPREADSHEET_ID;
const ABA = 'Controle de Gastos';
const PRIMEIRA_LINHA = 5;
const ULTIMA_LINHA = 26;

async function getGoogleAuth() {
   let credentials;
   const secretPath = '/etc/secrets/serviceAccount.json';
   if (existsSync(secretPath)) {
        credentials = JSON.parse(readFileSync(secretPath, 'utf8'));
   } else {
        const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT;
        if (!serviceAccount) throw new Error('Credenciais não encontradas.');
        credentials = JSON.parse(serviceAccount);
   }
   return new google.auth.GoogleAuth({
        credentials: {
               client_email: credentials.client_email,
               private_key: credentials.private_key.includes('\\n')
                 ? credentials.private_key.replace(/\\n/g, '\n')
                        : credentials.private_key,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
   });
}

async function getSheetsService() {
   const auth = await getGoogleAuth();
   return google.sheets({ version: 'v4', auth });
}

// Converte valores da planilha para número, aceitando tanto números "puros"
// quanto texto digitado no formato brasileiro (ex: "R$ 1.000", "R$ 50,30").
function parseValor(valor) {
   if (valor === undefined || valor === null || valor === '') return 0;
   if (typeof valor === 'number') return valor;

  const limpo = String(valor).replace(/[^\d,.-]/g, '').trim();
   if (!limpo) return 0;

  // Se tem vírgula, ela é o separador decimal e pontos são milhar (ex: "1.234,56").
  // Se não tem vírgula, pontos seguidos de exatamente 3 dígitos são milhar (ex: "1.000").
  const normalizado = limpo.includes(',')
     ? limpo.replace(/\./g, '').replace(',', '.')
       : limpo.replace(/\.(?=\d{3}(\D|$))/g, '');

  const numero = parseFloat(normalizado);
   return isNaN(numero) ? 0 : numero;
}

// Lê os 22 itens (nome, categoria, limite e gasto acumulado do mês) direto da planilha.
export async function lerItensControleGastos() {
   if (!SPREADSHEET_ID) throw new Error('CONTROLE_GASTOS_SPREADSHEET_ID não configurado.');

  const sheets = await getSheetsService();
   const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${ABA}!A${PRIMEIRA_LINHA}:E${ULTIMA_LINHA}`,
        valueRenderOption: 'UNFORMATTED_VALUE',
   });
   const rows = response.data.values || [];

  return rows
     .map((row, i) => {
            const [nome, custoVida, lazer, conhecimento, gastoAcumulado] = row;
            let categoria = null;
            let limite = 0;

                if (custoVida !== undefined && custoVida !== '') { categoria = 'Custo de Vida'; limite = parseValor(custoVida); }
            else if (lazer !== undefined && lazer !== '') { categoria = 'Lazer'; limite = parseValor(lazer); }
            else if (conhecimento !== undefined && conhecimento !== '') { categoria = 'Conhecimento'; limite = parseValor(conhecimento); }

                return {
                         linha: PRIMEIRA_LINHA + i,
                         nome,
                         categoria,
                         limite,
                         gastoAcumulado: parseValor(gastoAcumulado),
                };
     })
     .filter(item => item.nome);
}

export async function buscarItemControleGastos(nome) {
   const itens = await lerItensControleGastos();
   return itens.find(item => item.nome?.toString().toUpperCase() === nome.toUpperCase());
}

// Soma um novo gasto ao acumulado do item na planilha e retorna o item atualizado.
export async function registrarGastoControle(nome, valor) {
   const item = await buscarItemControleGastos(nome);
   if (!item) throw new Error(`Item não encontrado: ${nome}`);

  const sheets = await getSheetsService();
   const novoAcumulado = item.gastoAcumulado + Number(valor);

  await sheets.spreadsheets.values.update({
       spreadsheetId: SPREADSHEET_ID,
       range: `${ABA}!E${item.linha}`,
       valueInputOption: 'USER_ENTERED',
       resource: { values: [[novoAcumulado]] },
  });

  return {
       ...item,
       gastoAcumulado: novoAcumulado,
       disponivel: item.limite - novoAcumulado,
  };
}

// Reinício mensal: zera o gasto acumulado de todos os itens.
export async function resetarGastosMensal() {
   if (!SPREADSHEET_ID) throw new Error('CONTROLE_GASTOS_SPREADSHEET_ID não configurado.');

  const sheets = await getSheetsService();
   const zeros = Array.from({ length: ULTIMA_LINHA - PRIMEIRA_LINHA + 1 }, () => [0]);
   await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${ABA}!E${PRIMEIRA_LINHA}:E${ULTIMA_LINHA}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: zeros },
   });
   console.log('[Controle de Gastos] Gasto acumulado reiniciado para o novo mês.');
}
