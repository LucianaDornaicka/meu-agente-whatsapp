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

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || process.env.GOOGLE_SPREADSHEET_ID;


const SHEET = 'Ingles';

export async function agenteIngles(mensagem, remetente) {
  const texto = mensagem?.toLowerCase().trim() || '';
  if (texto === 'ing' || texto === 'en' || texto === 'inglês' || texto === 'ingles') {
    const resultado = await buscarProgressoIngles();
    return { sucesso: true, resposta: resultado };
  }
  return null;
}

async function buscarProgressoIngles() {
  try {
    const sheets = await getSheets();

    const linksResp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!D2:D3`,


    });
    const links = linksResp.data.values || [];
    const linkCurso = links[0]?.[0] || 'https://curso.mairovergara.com/dashboard';
    const linkAnki = links[1]?.[0] || 'https://ankiweb.net/decks';

    const dadosResp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A5:G`,


    } );
    const linhas = (dadosResp.data.values || []).filter(l => l[0]);
    const ultimas = linhas.slice(-3);

    let msg = `📚 *Assistente de Inglês*\n\n`;
    msg += `🔗 *Curso:* ${linkCurso}\n`;
    msg += `🃏 *Anki:* ${linkAnki}\n\n`;

    if (ultimas.length === 0) {
      msg += `📖 Nenhuma lição registrada ainda.`;
    } else {
      msg += `📖 *Últimas lições:*\n`;
      for (const linha of ultimas) {
        const [id, modulo, licao, link, anki, audio, data] = linha;
        msg += `\n• Módulo ${modulo || '-'}, Lição ${licao || '-'}`;
        if (data) msg += ` — ${data}`;
        if (link) msg += `\n  🔗 ${link}`;
      }
    }
    return msg;
  } catch (error) {
    console.error('Erro ao buscar inglês:', error.message);
    return '❌ Erro ao buscar dados de inglês.';
  }
}
