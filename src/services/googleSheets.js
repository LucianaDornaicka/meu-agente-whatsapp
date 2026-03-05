import { google } from 'googleapis';
import { existsSync, readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

async function getGoogleAuth() {
  let credentials;

  const secretPath = '/etc/secrets/serviceAccount.json';

  if (existsSync(secretPath)) {
    const raw = readFileSync(secretPath, 'utf8');
    credentials = JSON.parse(raw);
    console.log('EMAIL:', credentials.client_email);
    console.log('KEY_START:', credentials.private_key.substring(0, 50));
  } else {
    const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT;
    if (!serviceAccount) throw new Error('Credenciais não encontradas.');
    credentials = JSON.parse(serviceAccount);
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key.includes('\\n')
        ? credentials.private_key.replace(/\\n/g, '\n')
        : credentials.private_key,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  } );

  return auth;
}

async function getSheetsService() {
  const auth = await getGoogleAuth();
  return google.sheets({ version: 'v4', auth });
}

export async function adicionarTarefaNaPlanilha({ categoria, descricao }) {
  try {
    const sheets = await getSheetsService();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tarefas!A:B',
      valueInputOption: 'USER_ENTERED',
      resource: { values: [[categoria, descricao]] },
    });
    console.log('Tarefa adicionada com sucesso.');
  } catch (error) {
    console.error('Erro ao adicionar tarefa:', error);
    throw error;
  }
}

export async function lerTarefasDaPlanilha() {
  try {
    const sheets = await getSheetsService();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tarefas!A:B',
    });
    const rows = response.data.values || [];
    return rows.map(row => ({ categoria: row[0], descricao: row[1] }));
  } catch (error) {
    console.error('Erro ao ler tarefas:', error);
    throw error;
  }
}

export async function lerCategoriasDaPlanilha() {
  try {
    const sheets = await getSheetsService();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tarefas!A:A',
    });
    const rows = response.data.values || [];
    const categorias = [...new Set(rows.map(row => row[0]).filter(Boolean))];
    return categorias;
  } catch (error) {
    console.error('Erro ao ler categorias:', error);
    throw error;
  }
}

export async function lerTarefasPorCategoria(categoria) {
  try {
    const sheets = await getSheetsService();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tarefas!A:B',
    });
    const rows = response.data.values || [];
    return rows
      .filter(row => row[0]?.toLowerCase() === categoria.toLowerCase())
      .map(row => ({ categoria: row[0], descricao: row[1] }));
  } catch (error) {
    console.error('Erro ao ler tarefas por categoria:', error);
    throw error;
  }
}
