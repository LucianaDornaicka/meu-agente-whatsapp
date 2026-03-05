import { google } from 'googleapis';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env (essencial para rodar localmente)
dotenv.config();

// =================================================================================
// 1. CONFIGURAÇÃO E AUTENTICAÇÃO
// =================================================================================

// ID da sua planilha. Pegue da URL do Google Sheets.
const SPREADSHEET_ID = '1czu4cuVPrFsPhMpD4e2uoyiqRK2P70NNr0fBIxKkmvs';

// Nome da aba/página onde as tarefas estão.
const SHEET_NAME = 'Tarefas'; // Mude se o nome da sua aba for diferente

// Escopos de permissão. Define o que a API pode fazer.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

let sheets; // Instância da API do Google Sheets

try {
  const credsString = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!credsString ) {
    throw new Error("A variável de ambiente GOOGLE_SERVICE_ACCOUNT não foi definida.");
  }

  const credenciais = JSON.parse(credsString);

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credenciais.client_email,
      private_key: credenciais.private_key.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  });

  sheets = google.sheets({ version: 'v4', auth });
  console.log("Autenticação com Google Sheets realizada com sucesso.");

} catch (error) {
  console.error("ERRO CRÍTICO NA AUTENTICAÇÃO DO GOOGLE:", error.message);
  throw new Error("Falha ao inicializar a autenticação do Google Sheets.");
}

// =================================================================================
// 2. FUNÇÕES EXPORTADAS (AÇÕES DA PLANILHA)
// =================================================================================

/**
 * Adiciona uma nova linha na planilha de tarefas.
 * @param {object} tarefa - Objeto com { categoria, descricao }.
 */
export async function adicionarTarefaNaPlanilha(tarefa) {
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:C`, // Escreve nas colunas A, B e C
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [tarefa.categoria, tarefa.descricao, new Date().toISOString()] // Categoria, Descrição, Data
        ],
      },
    });
  } catch (err) {
    console.error('Erro ao adicionar tarefa na planilha:', err.message);
    throw new Error('Falha ao se comunicar com a API do Google Sheets.');
  }
}

/**
 * Lê todas as tarefas da planilha, ignorando o cabeçalho.
 * @returns {Promise<Array<object>>} Uma lista de objetos de tarefa.
 */
export async function lerTarefasDaPlanilha() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:B`, // Lê as colunas A (Categoria) e B (Descrição)
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) return []; // Se só tem cabeçalho ou está vazia

    // Pula a primeira linha (cabeçalho) e mapeia o resto para objetos
    return rows.slice(1).map(row => ({
      categoria: row[0] || 'Sem Categoria',
      descricao: row[1] || 'Sem Descrição',
    }));
  } catch (err) {
    console.error('Erro ao ler tarefas da planilha:', err.message);
    throw new Error('Falha ao ler dados da planilha.');
  }
}

/**
 * Lê todas as categorias únicas da coluna A.
 * @returns {Promise<Array<string>>} Uma lista de categorias únicas.
 */
export async function lerCategoriasDaPlanilha() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:A`, // Lê apenas a coluna de categorias
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) return [];

    // Usa um Set para garantir categorias únicas e ignora o cabeçalho
    const categoriasUnicas = [...new Set(rows.slice(1).flat())];
    return categoriasUnicas.filter(cat => cat); // Remove valores vazios
  } catch (err) {
    console.error('Erro ao ler categorias da planilha:', err.message);
    throw new Error('Falha ao ler dados da planilha.');
  }
}

/**
 * Filtra as tarefas por uma categoria específica.
 * @param {string} categoria - A categoria para filtrar.
 * @returns {Promise<Array<object>>} Uma lista de tarefas filtradas.
 */
export async function lerTarefasPorCategoria(categoria) {
  try {
    const todasAsTarefas = await lerTarefasDaPlanilha(); // Reutiliza a função principal
    if (!todasAsTarefas || todasAsTarefas.length === 0) return [];

    // Filtra as tarefas pela categoria (ignorando maiúsculas/minúsculas)
    return todasAsTarefas.filter(tarefa =>
      tarefa.categoria.toLowerCase() === categoria.toLowerCase()
    );
  } catch (err) {
    console.error(`Erro ao filtrar tarefas por categoria "${categoria}":`, err.message);
    throw new Error('Falha ao filtrar tarefas.');
  }
}
