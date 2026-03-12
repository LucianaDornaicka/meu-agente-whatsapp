import { google } from 'googleapis';
import { existsSync, readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

export const estadosEstudo = {};

const STUDY_SPREADSHEET_ID = process.env.STUDY_SPREADSHEET_ID;

const BIBLE_CODES = {
  'gênesis':'GEN','genesis':'GEN','êxodo':'EXO','exodo':'EXO','levítico':'LEV','levitico':'LEV',
  'números':'NUM','numeros':'NUM','deuteronômio':'DEU','deuteronomio':'DEU','josué':'JOS','josue':'JOS',
  'juízes':'JDG','juizes':'JDG','rute':'RUT',
  '1 samuel':'1SA','1samuel':'1SA','2 samuel':'2SA','2samuel':'2SA',
  '1 reis':'1KI','1reis':'1KI','2 reis':'2KI','2reis':'2KI',
  '1 crônicas':'1CH','1cronicas':'1CH','1 cronicas':'1CH',
  '2 crônicas':'2CH','2cronicas':'2CH','2 cronicas':'2CH',
  'esdras':'EZR','neemias':'NEH','ester':'EST','jó':'JOB','jo':'JOB','job':'JOB',
  'salmos':'PSA','salmo':'PSA','provérbios':'PRO','proverbios':'PRO','eclesiastes':'ECC',
  'cantares':'SNG','cântico':'SNG','cantico':'SNG',
  'isaías':'ISA','isaias':'ISA','jeremias':'JER','lamentações':'LAM','lamentacoes':'LAM',
  'ezequiel':'EZK','daniel':'DAN','oséias':'HOS','oseias':'HOS','joel':'JOL',
  'amós':'AMO','amos':'AMO','obadias':'OBA','jonas':'JON','miquéias':'MIC','miqueias':'MIC',
  'naum':'NAM','habacuque':'HAB','sofonias':'ZEP','ageu':'HAG','zacarias':'ZEC','malaquias':'MAL',
  'mateus':'MAT','marcos':'MRK','lucas':'LUK','joão':'JHN','joao':'JHN','atos':'ACT',
  'romanos':'ROM',
  '1 coríntios':'1CO','1corintios':'1CO','1 corintios':'1CO',
  '2 coríntios':'2CO','2corintios':'2CO','2 corintios':'2CO',
  'gálatas':'GAL','galatas':'GAL','efésios':'EPH','efesios':'EPH','filipenses':'PHP',
  'colossenses':'COL',
  '1 tessalonicenses':'1TH','1tessalonicenses':'1TH',
  '2 tessalonicenses':'2TH','2tessalonicenses':'2TH',
  '1 timóteo':'1TI','1timoteo':'1TI','1 timoteo':'1TI',
  '2 timóteo':'2TI','2timoteo':'2TI','2 timoteo':'2TI',
  'tito':'TIT','filemom':'PHM','hebreus':'HEB','tiago':'JAS',
  '1 pedro':'1PE','1pedro':'1PE','2 pedro':'2PE','2pedro':'2PE',
  '1 joão':'1JN','1joao':'1JN','1 joao':'1JN',
  '2 joão':'2JN','2joao':'2JN','2 joao':'2JN',
  '3 joão':'3JN','3joao':'3JN','3 joao':'3JN',
  'judas':'JUD','apocalipse':'REV',
};

function bibleComLink(livro, capitulo) {
  const code = BIBLE_CODES[livro.toLowerCase()];
  if (code) return `https://www.bible.com/bible/211/${code}.${capitulo}.NVI`;
  return `https://www.bible.com/search/bible?q=${encodeURIComponent(`${livro} ${capitulo}`)}`;
}

function yt(query) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

async function getSheetsService() {
  let credentials;
  const secretPath = '/etc/secrets/serviceAccount.json';
  if (existsSync(secretPath)) {
    credentials = JSON.parse(readFileSync(secretPath, 'utf8'));
  } else {
    const sa = process.env.GOOGLE_SERVICE_ACCOUNT;
    if (!sa) throw new Error('Credenciais não encontradas.');
    credentials = JSON.parse(sa);
  }
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key.includes('\\n')
        ? credentials.private_key.replace(/\\n/g, '\n')
        : credentials.private_key,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

async function buscarCronograma() {
  const sheets = await getSheetsService();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: STUDY_SPREADSHEET_ID,
    range: "'Plano de Leitura 365 Dias'!B3:E",
  });
  const rows = response.data.values || [];
  // B=índice 0 (Livro), C=índice 1 (Capítulo), D=índice 2 (Dia), E=índice 3 (Status)
  return rows
    .filter(row => row[0] && row[1] && (!row[3] || row[3].trim() === ''))
    .slice(0, 5);
}

const MENU = `📖 *Estudos Bíblicos*\n\nEscolha uma opção:\n\n1️⃣  Cronograma\n2️⃣  Áudio e Livro\n3️⃣  Livro Comentado\n\nDigite *0* para sair.`;

export async function agenteEstudo(mensagem, remetente) {
  const texto = mensagem.trim();
  const tl = texto.toLowerCase();

  if (!estadosEstudo[remetente]) {
    estadosEstudo[remetente] = { etapa: 'menu' };
    return { sucesso: true, resposta: MENU };
  }

  const estado = estadosEstudo[remetente];
  let resultado;

  switch (estado.etapa) {
    case 'menu':
      switch (tl) {
        case '1': {
          try {
            const itens = await buscarCronograma();
            if (!itens.length) {
              resultado = { sucesso: true, resposta: '🎉 Nenhum item pendente no cronograma!' };
            } else {
              let msg = '📅 *Próximos no Cronograma:*\n\n';
              itens.forEach((row, i) => {
                const livro = row[0];
                const cap = row[1];
                const dia = row[2] ? ` — Dia ${row[2]}` : '';
                msg += `${i + 1}. *${livro}* cap. ${cap}${dia}\n`;
              });
              resultado = { sucesso: true, resposta: msg.trim() };
            }
          } catch (e) {
            console.error('Erro ao buscar cronograma:', e);
            resultado = { sucesso: false, resposta: '⚠️ Erro ao acessar o cronograma.' };
          }
          delete estadosEstudo[remetente];
          break;
        }

        case '2':
          estado.etapa = 'audio_livro';
          resultado = { sucesso: true, resposta: '📖 Qual o livro?\n(Ex: Gênesis, Salmos, João)' };
          break;

        case '3':
          estado.etapa = 'comentado_livro';
          resultado = { sucesso: true, resposta: '📖 Qual o livro?\n(Ex: Gênesis, Salmos, João)' };
          break;

        default:
          resultado = { sucesso: false, resposta: '❌ Opção inválida. Digite 1, 2 ou 3.' };
          break;
      }
      break;

    // ── Áudio e Livro ────────────────────────────────────────────────────────
    case 'audio_livro':
      estado.livro = texto;
      estado.etapa = 'audio_capitulo';
      resultado = { sucesso: true, resposta: '🔢 Qual o capítulo?' };
      break;

    case 'audio_capitulo': {
      const { livro } = estado;
      const cap = texto;
      resultado = {
        sucesso: true,
        resposta:
          `🎧 *${livro} ${cap} — NVI*\n\n` +
          `▶️ *Áudio:*\n${yt(`biblia nvi narrada ${livro} capitulo ${cap}`)}\n\n` +
          `📖 *Leitura:*\n${bibleComLink(livro, cap)}`,
      };
      delete estadosEstudo[remetente];
      break;
    }

    // ── Livro Comentado ──────────────────────────────────────────────────────
    case 'comentado_livro':
      estado.livro = texto;
      estado.etapa = 'comentado_capitulo';
      resultado = { sucesso: true, resposta: '🔢 Qual o capítulo?' };
      break;

    case 'comentado_capitulo': {
      const { livro } = estado;
      const cap = texto;
      resultado = {
        sucesso: true,
        resposta:
          `🎙️ *${livro} ${cap} — Comentado*\n\n` +
          `▶️ *Paulo Own (1CPD):*\n${yt(`paulo own 1cpd ${livro} ${cap}`)}\n\n` +
          `▶️ *Ed René Kivitz:*\n${yt(`ed rene kivitz ${livro} ${cap}`)}`,
      };
      delete estadosEstudo[remetente];
      break;
    }

    default:
      delete estadosEstudo[remetente];
      resultado = { sucesso: false, resposta: '🤔 Erro no fluxo. Digite *estudo* para recomeçar.' };
      break;
  }

  return resultado;
}
