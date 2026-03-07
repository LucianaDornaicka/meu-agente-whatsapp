import { google } from 'googleapis';
import { existsSync, readFileSync } from 'fs';

async function getAuth() {
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
  } );
}

async function getSheets() {
  const auth = await getAuth();
  return google.sheets({ version: 'v4', auth });
}

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET = 'Cardápio';

export const estadosCardapio = {};

const DIAS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];
const JS_DIA_PARA_PLANILHA = [6, 0, 1, 2, 3, 4, 5];

function getLinkCardapio() {
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit#gid=0`;
}

function getAmanhaEmBrasilia( ) {
  const agora = new Date();
  // UTC-3 = Brasília
  const brasilia = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
  brasilia.setDate(brasilia.getDate() + 1);
  return brasilia;
}

export async function agenteCardapio(mensagem, remetente) {
  const texto = mensagem?.toLowerCase().trim() || '';
  const estado = estadosCardapio[remetente];

  if (texto === 'cardápio' || texto === 'cardapio') {
    estadosCardapio[remetente] = { etapa: 'menu' };
    return {
      sucesso: true,
      resposta: `🍽️ *Cardápio*\n\nDigite o número da opção:\n\n1️⃣ Link da planilha\n2️⃣ Lista de compras\n\n0️⃣ Cancelar`,
    };
  }

  if (!estado) return null;

  if (estado.etapa === 'menu') {
    if (texto === '1') {
      delete estadosCardapio[remetente];
      return { sucesso: true, resposta: `🔗 *Cardápio:*\n${getLinkCardapio()}` };
    }
    if (texto === '2') {
      delete estadosCardapio[remetente];
      const lista = await buscarListaCompras();
      return { sucesso: true, resposta: lista };
    }
    if (texto === '0') {
      delete estadosCardapio[remetente];
      return { sucesso: true, resposta: '✅ Cancelado.' };
    }
    return { sucesso: false, resposta: 'Digite 1, 2 ou 0.' };
  }

  return null;
}

export async function enviarCardapioDiario(sendMessage, destinatario) {
  try {
    const amanha = getAmanhaEmBrasilia();
    const diaSemana = amanha.getDay();
    const indiceDia = JS_DIA_PARA_PLANILHA[diaSemana];
    const nomeDia = DIAS[indiceDia];

    const sheets = await getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A5:F11`,
    });

    const linhas = response.data.values || [];
    const linhaDia = linhas.find(l => l[1]?.toUpperCase() === nomeDia);

    if (!linhaDia) {
      await sendMessage(destinatario, `🍽️ Não encontrei o cardápio de ${nomeDia}.`);
      return;
    }

    const [, dia, almoco, lanche, jantar, sobremesa] = linhaDia;
    let msg = `🍽️ *Cardápio de amanhã (${nomeDia})*\n\n`;
    if (almoco) msg += `🥗 Almoço: ${almoco}\n`;
    if (lanche) msg += `🥪 Lanche Liz: ${lanche}\n`;
    if (jantar) msg += `🌙 Jantar: ${jantar}\n`;
    if (sobremesa) msg += `🍎 Sobremesa: ${sobremesa}\n`;

    await sendMessage(destinatario, msg.trim());
  } catch (error) {
    console.error('Erro ao enviar cardápio diário:', error.message);
  }
}

async function buscarListaCompras() {
  try {
    const sheets = await getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A13:D`,
    });

    const linhas = response.data.values || [];
    if (linhas.length === 0) return '🛒 Lista de compras vazia.';

    const dados = linhas.slice(1).filter(l => l.some(c => c));
    if (dados.length === 0) return '🛒 Lista de compras vazia.';

    let msg = `🛒 *Lista de Compras*\n\n`;
    const categorias = ['🥩 Proteína', '🥦 Hortifruti', '🏪 Mercado', '📍 Outro Lugar'];
    for (let col = 0; col < 4; col++) {
      const itens = dados.map(l => l[col]).filter(Boolean);
      if (itens.length > 0) {
        msg += `*${categorias[col]}:*\n`;
        itens.forEach(item => { msg += `• ${item}\n`; });
        msg += '\n';
      }
    }
    return msg.trim();
  } catch (error) {
    console.error('Erro ao buscar lista de compras:', error.message);
    return '❌ Erro ao buscar lista de compras.';
  }
}
