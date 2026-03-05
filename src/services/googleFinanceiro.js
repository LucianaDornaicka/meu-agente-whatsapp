import { google } from 'googleapis';
import { existsSync, readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const SPREADSHEET_ID = process.env.FINANCIAL_SPREADSHEET_ID;

const MESES = {
  JAN: { valor: 'E', status: 'F' },
  FEV: { valor: 'G', status: 'H' },
  MAR: { valor: 'I', status: 'J' },
  ABR: { valor: 'K', status: 'L' },
  MAI: { valor: 'M', status: 'N' },
  JUN: { valor: 'O', status: 'P' },
  JUL: { valor: 'Q', status: 'R' },
  AGO: { valor: 'S', status: 'T' },
  SET: { valor: 'U', status: 'V' },
  OUT: { valor: 'W', status: 'X' },
  NOV: { valor: 'Y', status: 'Z' },
  DEZ: { valor: 'AA', status: 'AB' },
};

export const ITENS = [
  'ACADEMIA',
  'ÁGUA',
  'CLARO',
  'CONDOMÍNIO',
  'DISNEY',
  'FRETADO',
  'GÁS',
  'INVESTIR',
  'IPTU',
  'LUMIAR',
  'LUZ',
  'CONSÓRCIO',
  'PATINS',
  'SEM PARAR',
  'VIOLÃO',
];

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
  } );
}

async function getSheetsService() {
  const auth = await getGoogleAuth();
  return google.sheets({ version: 'v4', auth });
}

export async function preencherGasto(itemNome, mes, valor) {
  const sheets = await getSheetsService();
  const mesConfig = MESES[mes.toUpperCase()];
  if (!mesConfig) throw new Error(`Mês inválido: ${mes}`);

  // Busca a linha do item pelo nome na coluna C
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Pagamentos!C3:C17',
  });
  const rows = response.data.values || [];
  const linhaIndex = rows.findIndex(row => row[0]?.toUpperCase() === itemNome.toUpperCase());
  if (linhaIndex === -1) throw new Error(`Item não encontrado: ${itemNome}`);
  const linha = linhaIndex + 3;

  const valorFormatado = `R$${valor.replace('.', ',')}`;
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource: {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `Pagamentos!${mesConfig.valor}${linha}`, values: [[valorFormatado]] },
        { range: `Pagamentos!${mesConfig.status}${linha}`, values: [['Pago']] },
      ],
    },
  });
}

export async function lerItensPorVencimento(dia) {
  const sheets = await getSheetsService();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Pagamentos!B3:C17',
  });
  const rows = response.data.values || [];
  return rows.filter(row => parseInt(row[0]) === dia).map(row => row[1]);
}
