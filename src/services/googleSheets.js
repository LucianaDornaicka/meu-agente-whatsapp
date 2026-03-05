import { google } from 'googleapis';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env (essencial para rodar localmente)
dotenv.config();

// --- INÍCIO DO DEBUG ---
console.log('--- DEBUG GOOGLE SHEETS ---');
console.log('SPREADSHEET_ID:', process.env.SPREADSHEET_ID);
console.log('GOOGLE_SERVICE_ACCOUNT existe?', !!process.env.GOOGLE_SERVICE_ACCOUNT);
// --- FIM DO DEBUG ---

// =================================================================
// 1. CONFIGURAÇÃO E AUTENTICAÇÃO
// =================================================================

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || 'COLE_O_ID_DA_SUA_PLANILHA_AQUI';

/**
 * Configura e retorna um cliente JWT autenticado para a API do Google.
 * @returns {Promise<import('google-auth-library').JWT>}
 */
async function getGoogleAuth() {
  // Pega as credenciais da variável de ambiente.
  const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT;

  if (!serviceAccount) {
    console.error('ERRO: A variável de ambiente GOOGLE_SERVICE_ACCOUNT não foi definida.');
    throw new Error('Credenciais da conta de serviço não encontradas.');
  }

  let credentials;
  try {
    // O Render armazena a variável como uma string, então precisamos fazer o parse.
    credentials = JSON.parse(serviceAccount);
  } catch (error) {
    console.error('ERRO: Falha ao fazer o parse do JSON da GOOGLE_SERVICE_ACCOUNT.', error);
    throw new Error('Formato inválido das credenciais da conta de serviço.');
  }

  // A chave privada vem com '\n' literais que precisam ser substituídos por quebras de linha reais.
  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
  }

  const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
   );

  return auth;
}

/**
 * Retorna uma instância autenticada da API do Google Sheets.
 * @returns {Promise<import('googleapis').sheets_v4.Sheets>}
 */
async function getSheetsService() {
  const auth = await getGoogleAuth();
  return google.sheets({ version: 'v4', auth });
}


// =================================================================
// 2. FUNÇÕES DE MANIPULAÇÃO DA PLANILHA
// =================================================================

/**
 * Adiciona uma nova tarefa na planilha "Tarefas".
 * @param {{categoria: string, descricao: string}} tarefa - O objeto da tarefa.
 */
export async function adicionarTarefaNaPlanilha(tarefa) {
  try {
    const sheets = await getSheetsService();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tarefas!A:C', // Adiciona na primeira linha vazia das colunas A, B, C
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[tarefa.categoria, tarefa.descricao, new Date().toISOString()]],
      },
    });
    console.log('Tarefa adicionada com sucesso na planilha.');
  } catch (error) {
    console.error('Erro ao adicionar tarefa na planilha:', error);
    // Re-lança o erro para que a camada superior (agente) possa tratá-lo.
    throw error;
  }
}

/**
 * Lê todas as tarefas da planilha.
 * @returns {Promise<Array<{categoria: string, descricao: string}>>}
 */
export async function lerTarefasDaPlanilha() {
  try {
    const sheets = await getSheetsService();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tarefas!A:B', // Lê as colunas Categoria e Descrição
    });

    const rows = response.data.values;
    if (rows && rows.length > 1) { // Ignora o cabeçalho
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

/**
 * Lê todas as categorias únicas da coluna A.
 * @returns {Promise<string[]>}
 */
export async function lerCategoriasDaPlanilha() {
  try {
    const sheets = await getSheetsService();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tarefas!A2:A', // Começa da segunda linha para ignorar o cabeçalho
    });

    const rows = response.data.values;
    if (rows) {
      // Usa um Set para pegar apenas valores únicos e depois converte para array.
      const categoriasUnicas = [...new Set(rows.flat())];
      return categoriasUnicas;
    }
    return [];
  } catch (error) {
    console.error('Erro ao ler categorias da planilha:', error);
    throw error;
  }
}

/**
 * Lê tarefas de uma categoria específica.
 * @param {string} categoria - A categoria para filtrar.
 * @returns {Promise<Array<{categoria: string, descricao: string}>>}
 */
export async function lerTarefasPorCategoria(categoria) {
  try {
    const todasAsTarefas = await lerTarefasDaPlanilha();
    // Filtra as tarefas pela categoria (ignorando maiúsculas/minúsculas)
    return todasAsTarefas.filter(
      t => t.categoria.toLowerCase() === categoria.toLowerCase()
    );
  } catch (error) {
    console.error(`Erro ao ler tarefas da categoria "${categoria}":`, error);
    throw error;
  }
}
