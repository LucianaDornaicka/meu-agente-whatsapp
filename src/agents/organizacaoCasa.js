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

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const SHEET = 'Organização Casa';

const JS_DIA_PARA_COL = [null, 2, 3, 4, 5, 6, 7];
const NOMES_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function getLinkPlanilha() {
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit#gid=0`;
}

export async function enviarTarefasCasa(sendMessage, destinatario ) {
  try {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const diaSemana = amanha.getDay();

    if (diaSemana === 0) {
      await sendMessage(destinatario, `🏠 Amanhã é domingo — sem tarefas de casa programadas!`);
      return;
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
      await sendMessage(destinatario, `🏠 Nenhuma tarefa de casa para amanhã (${nomeDia}).`);
      return;
    }

    let msg = `🏠 *Tarefas de casa de amanhã (${nomeDia})*\n\n`;
    tarefasAmanha.forEach(t => { msg += `• ${t}\n`; });

    if (ehSexta) {
      msg += `\n📋 Atualize o cardápio da semana:\n${getLinkPlanilha()}`;
    }

    await sendMessage(destinatario, msg.trim());
  } catch (error) {
    console.error('Erro ao enviar tarefas da casa:', error.message);
  }
}
