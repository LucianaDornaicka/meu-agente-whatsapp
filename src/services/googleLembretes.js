import { google } from 'googleapis';
import { existsSync, readFileSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const ABA = 'Lembretes';

async function getGoogleAuth() {
  let credentials;
  const secretPath = '/etc/secrets/serviceAccount.json';
  if (existsSync(secretPath)) {
    credentials = JSON.parse(readFileSync(secretPath, 'utf8'));
  } else {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  }
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key.includes('\\n') ? credentials.private_key.replace(/\\n/g, '\n') : credentials.private_key,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  } );
}

async function getSheetsService() {
  return google.sheets({ version: 'v4', auth: await getGoogleAuth() });
}

async function proximoId(sheets) {
  const r = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${ABA}!A4:A` });
  const nums = (r.data.values || []).map(row => parseInt(row[0])).filter(n => !isNaN(n));
  return nums.length > 0 ? Math.max(...nums) + 1 : 1;
}

function calcularProximoDisparo(data, hora) {
  try {
    const [dia, mes, ano] = data.split('/').map(Number);
    const [h, m] = hora ? hora.split(':').map(Number) : [9, 0];
    const dt = new Date(ano, mes - 1, dia, h, m);
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
  } catch { return data; }
}

export async function adicionarLembrete({ descricao, data, hora, recorrencia }) {
  const sheets = await getSheetsService();
  const id = await proximoId(sheets);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${ABA}!A4:G`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [[id, descricao, data, hora || 'sem hora', recorrencia, 'ativo', calcularProximoDisparo(data, hora)]] },
    
  });
  return id;
}

export async function lerLembretesAtivos() {
  const sheets = await getSheetsService();
  const r = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${ABA}!A4:G` });
  return (r.data.values || [])
    .filter(row => row[5] === 'ativo' && !isNaN(parseInt(row[0])))
    .map(row => ({ id: parseInt(row[0]), descricao: row[1], data: row[2], hora: row[3], recorrencia: row[4], status: row[5], proximoDisparo: row[6] }));
}

export async function atualizarStatusLembrete(id, novoStatus, novoProximoDisparo) {
  const sheets = await getSheetsService();
  const r = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${ABA}!A4:G` });
  const idx = (r.data.values || []).findIndex(row => parseInt(row[0]) === id);
  if (idx === -1) return;
  const linha = idx + 4;
  const data = [{ range: `${ABA}!F${linha}`, values: [[novoStatus]] }];
  if (novoProximoDisparo) data.push({ range: `${ABA}!G${linha}`, values: [[novoProximoDisparo]] });
  await sheets.spreadsheets.values.batchUpdate({ spreadsheetId: SPREADSHEET_ID, resource: { valueInputOption: 'USER_ENTERED', data } });
}
