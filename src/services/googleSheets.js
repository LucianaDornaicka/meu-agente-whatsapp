import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

async function getGoogleAuth() {
  const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT;

  if (!serviceAccount) {
    throw new Error('Credenciais da conta de serviço não encontradas.');
  }

  let credentials;
  try {
    credentials = JSON.parse(serviceAccount);
  } catch (error) {
    throw new Error('Formato inválido das credenciais da conta de serviço.');
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

export async function adicionarTarefaNaPlanilha(tarefa) {
  try {
    const sheets = await getSheetsService();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tarefas!A:C',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[tarefa.categoria, tarefa.descricao, new Date().toISOString()]],
      },
    });
    console.log('Tarefa adicionada com sucesso na planilha.');
  } catch (error) {
    console.error('Erro ao adicionar tarefa na planilha:', error);
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

    const rows = response.data.values;
    if (rows && rows.length > 1) {
      return rows.slice(1).map(row => ({
        categoria: row[0],
        descricao: row[1],
      }));
    }
    return [];
  } catch (error) {
    console.error('Erro ao ler tarefas da planilha:', error);
    throw error;
  }
}

export async function lerCategoriasDaPlanilha() {
  try {
    const sheets = await getSheetsService();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tarefas!A2:A',
    });

    const rows = response.data.values;
    if (rows) {
      const categoriasUnicas = [...new Set(rows.flat())];
      return categoriasUnicas;
    }
    return [];
  } catch (error) {
    console.error('Erro ao ler categorias da planilha:', error);
    throw error;
  }
}

export async function lerTarefasPorCategoria(categoria) {
  try {
    const todasAsTarefas = await lerTarefasDaPlanilha();
    return todasAsTarefas.filter(
      t => t.categoria.toLowerCase() === categoria.toLowerCase()
    );
  } catch (error) {
    console.error(`Erro ao ler tarefas da categoria "${categoria}":`, error);
    throw error;
  }
}
