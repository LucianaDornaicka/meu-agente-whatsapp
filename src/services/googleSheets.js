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

async function proximoId(sheets) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Tarefas!A:A',
  });
  const rows = response.data.values || [];
  const numeros = rows
    .map(r => parseInt(r[0]))
    .filter(n => !isNaN(n));
  return numeros.length > 0 ? Math.max(...numeros) + 1 : 1;
}

export async function adicionarTarefaNaPlanilha({ usuario, categoria, descricao }) {
  try {
    const sheets = await getSheetsService();
    const id = await proximoId(sheets);
    const agora = new Date().toISOString();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tarefas!A:F',
      valueInputOption: 'USER_ENTERED',
      resource: { values: [[id, usuario, categoria, descricao, 'Pendente', agora]] },
    });
    console.log('Tarefa adicionada com sucesso.');
  } catch (error) {
    console.error('Erro ao adicionar tarefa:', error);
    throw error;
  }
}

export async function lerTarefasDaPlanilha(usuario) {
  try {
    const sheets = await getSheetsService();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tarefas!A:F',
    });
    const rows = response.data.values || [];
    return rows
      .filter(row => row[1] === usuario && row[0] && !isNaN(parseInt(row[0])))
      .map(row => ({ id: row[0], usuario: row[1], categoria: row[2], descricao: row[3], concluida: row[4], data: row[5] }));
  } catch (error) {
    console.error('Erro ao ler tarefas:', error);
    throw error;
  }
}

export async function lerCategoriasDaPlanilha(usuario) {
  try {
    const sheets = await getSheetsService();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tarefas!B:C',
    });
    const rows = response.data.values || [];
    const categorias = [...new Set(
      rows
        .filter(row => row[0] === usuario && row[1])
        .map(row => row[1])
    )];
    return categorias;
  } catch (error) {
    console.error('Erro ao ler categorias:', error);
    throw error;
  }
}

export async function lerTarefasPorCategoria(usuario, categoria) {
  try {
    const sheets = await getSheetsService();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tarefas!A:F',
    });
    const rows = response.data.values || [];
    return rows
      .filter(row => row[1] === usuario && row[2]?.toLowerCase() === categoria.toLowerCase() && !isNaN(parseInt(row[0])))
      .map(row => ({ id: row[0], categoria: row[2], descricao: row[3], concluida: row[4] }));
  } catch (error) {
    console.error('Erro ao ler tarefas por categoria:', error);
    throw error;
  }
}

// ── Estudos ──────────────────────────────────────────────────────────────────

async function proximoIdEstudo(sheets) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Estudo!A:A',
  });
  const rows = response.data.values || [];
  const numeros = rows.map(r => parseInt(r[0])).filter(n => !isNaN(n));
  return numeros.length > 0 ? Math.max(...numeros) + 1 : 1;
}

export async function adicionarEstudo({ usuario, materia, topico }) {
  try {
    const sheets = await getSheetsService();
    const id = await proximoIdEstudo(sheets);
    const agora = new Date().toISOString();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Estudo!A:G',
      valueInputOption: 'USER_ENTERED',
      resource: { values: [[id, usuario, materia, topico, 'Pendente', agora, '']] },
    });
  } catch (error) {
    console.error('Erro ao adicionar estudo:', error);
    throw error;
  }
}

export async function lerEstudos(usuario) {
  try {
    const sheets = await getSheetsService();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Estudo!A:G',
    });
    const rows = response.data.values || [];
    return rows
      .filter(row => row[1] === usuario && !isNaN(parseInt(row[0])))
      .map(row => ({ id: row[0], materia: row[2], topico: row[3], status: row[4] || 'Pendente', dataCriacao: row[5], dataConclusao: row[6] }));
  } catch (error) {
    console.error('Erro ao ler estudos:', error);
    throw error;
  }
}

export async function lerMateriasPorUsuario(usuario) {
  try {
    const sheets = await getSheetsService();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Estudo!B:C',
    });
    const rows = response.data.values || [];
    const materias = [...new Set(
      rows.filter(row => row[0] === usuario && row[1]).map(row => row[1])
    )];
    return materias;
  } catch (error) {
    console.error('Erro ao ler matérias:', error);
    throw error;
  }
}

export async function lerTopicosDeMateria(usuario, materia) {
  try {
    const sheets = await getSheetsService();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Estudo!A:G',
    });
    const rows = response.data.values || [];
    return rows
      .filter(row => row[1] === usuario && row[2]?.toLowerCase() === materia.toLowerCase() && !isNaN(parseInt(row[0])))
      .map((row, i) => ({ seq: i + 1, id: row[0], topico: row[3], status: row[4] || 'Pendente' }));
  } catch (error) {
    console.error('Erro ao ler tópicos:', error);
    throw error;
  }
}

export { getSheetsService as getSheets };

export async function marcarEstudoConcluido(id) {
  try {
    const sheets = await getSheetsService();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Estudo!A:G',
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === String(id));
    if (rowIndex === -1) return false;
    const agora = new Date().toISOString();
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Estudo!E${rowIndex + 1}:G${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [['Concluído', rows[rowIndex][5] || agora, agora]] },
    });
    return true;
  } catch (error) {
    console.error('Erro ao marcar estudo como concluído:', error);
    throw error;
  }
}
