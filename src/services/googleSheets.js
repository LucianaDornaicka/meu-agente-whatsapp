import fs from 'fs';
import { google } from 'googleapis';

// 🔐 Lê o arquivo da raiz do projeto
const serviceAccount = JSON.parse(
  process.env.GOOGLE_SERVICE_ACCOUNT
);

const auth = new google.auth.JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// 📄 Configuração da planilha
const SPREADSHEET_ID = '1czu4cuVPrFsPhMpD4e2uoyiqRK2P70NNr0fBIxKkmvs';
const RANGE = 'Tarefas!A:F';


// ===============================
// ➕ ADICIONAR TAREFA
// ===============================
export async function adicionarTarefa(usuario, categoria, descricao) {

  await auth.authorize();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Tarefas!A4:A',
  });

  const linhas = response.data.values || [];
  const nextId = linhas.length + 1;

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [[
        nextId,
        usuario,
        categoria,
        descricao,
        'Pendente',
        new Date().toISOString()
      ]]
    }
  });

  return true;
}


// ===============================
// 📋 LISTAR TAREFAS
// ===============================
export async function listarTarefas(usuario) {

  await auth.authorize();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Tarefas!A4:F',
  });

  const rows = response.data.values || [];

  return rows
    .filter(row => row[1] === usuario)
    .map(row => ({
      id: row[0],
      categoria: row[2],
      descricao: row[3],
      status: row[4]
    }));
}


// ===============================
// ✅ CONCLUIR TAREFA
// ===============================
export async function concluirTarefa(id) {

  await auth.authorize();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Tarefas!A4:F',
  });

  const rows = response.data.values || [];

  const linhaIndex = rows.findIndex(row => row[0] == id);

  if (linhaIndex === -1) return false;

  const linhaReal = linhaIndex + 4;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Tarefas!E${linhaReal}`,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [['Executada']]
    }
  });

  return true;
}


// ===============================
// 📂 LISTAR POR CATEGORIA
// ===============================
export async function listarPorCategoria(usuario, categoria) {

  await auth.authorize();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Tarefas!A4:F',
  });

  const rows = response.data.values || [];

  return rows.filter(row =>
    row[1] === usuario &&
    row[2]?.toLowerCase() === categoria.toLowerCase()
  );
}


// ===============================
// 📋 LISTAR CATEGORIAS
// ===============================
export async function listarCategorias(usuario) {

  await auth.authorize();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Tarefas!C4:C',
  });

  const rows = response.data.values || [];

  return [
    ...new Set(rows.map(r => r[0]).filter(Boolean))
  ];
}