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
const SHEET = 'Médicos';

export const estadosMedicos = {};

export async function agenteMedicos(mensagem, remetente) {
  const texto = mensagem?.toLowerCase().trim() || '';
  const estado = estadosMedicos[remetente];

  if (texto === 'médico' || texto === 'medico' || texto === 'med' || texto === 'médicos' || texto === 'medicos') {

    estadosMedicos[remetente] = { etapa: 'menu' };
    return {
      sucesso: true,
      resposta: `🏥 *Médicos*\n\nDigite o número da opção:\n\n1️⃣ Ver lista de médicos\n2️⃣ Incluir novo médico\n\n0️⃣ Cancelar`,
    };
  }

  if (!estado) return null;

  if (estado.etapa === 'menu') {
    if (texto === '1') {
      const lista = await listarMedicos();
      delete estadosMedicos[remetente];
      return { sucesso: true, resposta: lista };
    }
    if (texto === '2') {
      estadosMedicos[remetente] = { etapa: 'nome' };
      return { sucesso: true, resposta: '👨‍⚕️ *Incluir médico*\n\nDigite o *nome* do médico:' };
    }
    if (texto === '0') {
      delete estadosMedicos[remetente];
      return { sucesso: true, resposta: '✅ Cancelado.' };
    }
    return { sucesso: false, resposta: 'Digite 1, 2 ou 0.' };
  }

  if (estado.etapa === 'nome') {
    estadosMedicos[remetente] = { ...estado, etapa: 'especialidade', nome: mensagem.trim() };
    return { sucesso: true, resposta: '🩺 Digite a *especialidade*:' };
  }

  if (estado.etapa === 'especialidade') {
    estadosMedicos[remetente] = { ...estado, etapa: 'contato', especialidade: mensagem.trim() };
    return { sucesso: true, resposta: '📞 Digite o *contato* (telefone):' };
  }

  if (estado.etapa === 'contato') {
    estadosMedicos[remetente] = { ...estado, etapa: 'endereco', contato: mensagem.trim() };
    return { sucesso: true, resposta: '📍 Digite o *endereço* (ou "pular" para deixar em branco):' };
  }

  if (estado.etapa === 'endereco') {
    const endereco = texto === 'pular' ? '' : mensagem.trim();
    await incluirMedico(estado.nome, estado.especialidade, estado.contato, endereco);
    delete estadosMedicos[remetente];
    return { sucesso: true, resposta: `✅ Médico *${estado.nome}* incluído com sucesso!` };
  }

  return null;
}

async function listarMedicos() {
  const sheets = await getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A4:E`,
  });
  const linhas = response.data.values || [];
  if (linhas.length === 0) return '🏥 Nenhum médico cadastrado ainda.';
  let msg = '🏥 *Lista de Médicos*\n\n';
  for (const linha of linhas) {
    const [id, nome, especialidade, contato, endereco] = linha;
    if (!nome) continue;
    msg += `👨‍⚕️ *${nome}*\n`;
    msg += `   Especialidade: ${especialidade || '-'}\n`;
    msg += `   Contato: ${contato || '-'}\n`;
    if (endereco) msg += `   Endereço: ${endereco}\n`;
    msg += '\n';
  }
  return msg.trim();
}

async function incluirMedico(nome, especialidade, contato, endereco) {
  const sheets = await getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A4:A`,
  });
  const linhas = response.data.values || [];
  const nextId = linhas.length + 1;
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A4`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [[nextId, nome, especialidade, contato, endereco]] },
  });
}
