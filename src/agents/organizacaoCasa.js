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
const SHEET = 'Organização Casa';

const JS_DIA_PARA_COL = [null, 2, 3, 4, 5, 6, 7];
const NOMES_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const estadosCasa = {};

function getLinkPlanilha() {
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit#gid=0`;
}

function getAmanhaEmBrasilia( ) {
  const agora = new Date();
  const brasilia = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
  brasilia.setDate(brasilia.getDate() + 1);
  return brasilia;
}

export async function agenteCasa(mensagem, remetente) {
  const texto = mensagem?.toLowerCase().trim() || '';
  const estado = estadosCasa[remetente];

  if (texto === 'casa') {
    estadosCasa[remetente] = { etapa: 'menu' };
    return {
      sucesso: true,
      resposta: `🏠 *Organização Casa*\n\nDigite o número da opção:\n\n1️⃣ Link da planilha\n2️⃣ Tarefas de amanhã\n\n0️⃣ Cancelar`,
    };
  }

  if (!estado) return null;

  if (estado.etapa === 'menu') {
    if (texto === '1') {
      delete estadosCasa[remetente];
      return { sucesso: true, resposta: `🔗 *Organização Casa:*\n${getLinkPlanilha()}` };
    }
    if (texto === '2') {
      delete estadosCasa[remetente];
      const tarefas = await buscarTarefasAmanha();
      return { sucesso: true, resposta: tarefas };
    }
    if (texto === '0') {
      delete estadosCasa[remetente];
      return { sucesso: true, resposta: '✅ Cancelado.' };
    }
    return { sucesso: false, resposta: 'Digite 1, 2 ou 0.' };
  }

  return null;
}

export async function enviarTarefasCasa(sendMessage, destinatario) {
  try {
    const msg = await buscarTarefasAmanha();
    await sendMessage(destinatario, msg);
  } catch (error) {
    console.error('Erro ao enviar tarefas da casa:', error.message);
  }
}

async function buscarTarefasAmanha() {
  const amanha = getAmanhaEmBrasilia();
  const diaSemana = amanha.getDay();

  if (diaSemana === 0) {
    return `🏠 Amanhã é domingo — sem tarefas de casa programadas!`;
  }

  const colIndex = JS_DIA_PARA_COL[diaSemana];
  const nomeDia = NOMES_DIAS[diaSemana];
  const ehSexta = diaSemana === 5;

  const sheets = await getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A5:H`,
  });

  const linhas = response.data.values || [];
  const tarefasAmanha = linhas
    .filter(l => l[colIndex]?.toLowerCase() === 'sim')
    .map(l => l[1])
    .filter(Boolean);

  if (tarefasAmanha.length === 0) {
    return `🏠 Nenhuma tarefa de casa para amanhã (${nomeDia}).`;
  }

  let msg = `🏠 *Tarefas de casa de amanhã (${nomeDia})*\n\n`;
  tarefasAmanha.forEach(t => { msg += `• ${t}\n`; });

  if (ehSexta) {
    msg += `\n📋 Atualize o cardápio da semana:\n${getLinkPlanilha()}`;
  }

  return msg.trim();
}
