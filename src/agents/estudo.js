import { getSheets } from '../services/googleSheets.js';

export const estadosEstudo = {};

const STUDY_SPREADSHEET_ID = process.env.STUDY_SPREADSHEET_ID;
const SHEET_LINK = 'https://docs.google.com/spreadsheets/d/1Ioba9L8BF-oS8RIDxc8gow1HUzJV5Slu3iX-LaGHcW0/edit';

// Playlists específicas por livro (Bíblia Falada – A Mensagem)
const SPOTIFY_PLAYLISTS = {
  'gênesis': 'https://open.spotify.com/playlist/7epqnxKViWlEAJ1yQFAgmq',
  'genesis': 'https://open.spotify.com/playlist/7epqnxKViWlEAJ1yQFAgmq',
};

function getSpotifyLink(livro) {
  const key = livro.toLowerCase();
  if (SPOTIFY_PLAYLISTS[key]) return SPOTIFY_PLAYLISTS[key];
  return `https://open.spotify.com/search/biblia%20falada%20${encodeURIComponent(livro)}`;
}

// Abreviações para bibliaonline.com.br (minúsculas)
const ABBR_BIBLIAONLINE = {
  'gênesis':'gn','genesis':'gn','êxodo':'ex','exodo':'ex','levítico':'lv','levitico':'lv',
  'números':'nm','numeros':'nm','deuteronômio':'dt','deuteronomio':'dt','josué':'js','josue':'js',
  'juízes':'jz','juizes':'jz','rute':'rt',
  '1 samuel':'1sm','1samuel':'1sm','2 samuel':'2sm','2samuel':'2sm',
  '1 reis':'1rs','1reis':'1rs','2 reis':'2rs','2reis':'2rs',
  '1 crônicas':'1cr','1cronicas':'1cr','1 cronicas':'1cr',
  '2 crônicas':'2cr','2cronicas':'2cr','2 cronicas':'2cr',
  'esdras':'ed','neemias':'ne','ester':'et','jó':'jo','job':'jo',
  'salmos':'sl','salmo':'sl','provérbios':'pv','proverbios':'pv','eclesiastes':'ec',
  'cantares':'ct','cântico':'ct','cantico':'ct',
  'isaías':'is','isaias':'is','jeremias':'jr','lamentações':'lm','lamentacoes':'lm',
  'ezequiel':'ez','daniel':'dn','oséias':'os','oseias':'os','joel':'jl',
  'amós':'am','amos':'am','obadias':'ob','jonas':'jn','miquéias':'mq','miqueias':'mq',
  'naum':'na','habacuque':'hc','sofonias':'sf','ageu':'ag','zacarias':'zc','malaquias':'ml',
  'mateus':'mt','marcos':'mc','lucas':'lc','joão':'jo','joao':'jo','atos':'at',
  'romanos':'rm',
  '1 coríntios':'1co','1corintios':'1co','1 corintios':'1co',
  '2 coríntios':'2co','2corintios':'2co','2 corintios':'2co',
  'gálatas':'gl','galatas':'gl','efésios':'ef','efesios':'ef','filipenses':'fp',
  'colossenses':'cl',
  '1 tessalonicenses':'1ts','1tessalonicenses':'1ts',
  '2 tessalonicenses':'2ts','2tessalonicenses':'2ts',
  '1 timóteo':'1tm','1timoteo':'1tm','1 timoteo':'1tm',
  '2 timóteo':'2tm','2timoteo':'2tm','2 timoteo':'2tm',
  'tito':'tt','filemom':'fm','hebreus':'hb','tiago':'tg',
  '1 pedro':'1pe','1pedro':'1pe','2 pedro':'2pe','2pedro':'2pe',
  '1 joão':'1jo','1joao':'1jo','1 joao':'1jo',
  '2 joão':'2jo','2joao':'2jo','2 joao':'2jo',
  '3 joão':'3jo','3joao':'3jo','3 joao':'3jo',
  'judas':'jd','apocalipse':'ap',
};

// Abreviações para bible.com (maiúsculas)
const ABBR_BIBLECOM = {
  'gênesis':'GEN','genesis':'GEN','êxodo':'EXO','exodo':'EXO','levítico':'LEV','levitico':'LEV',
  'números':'NUM','numeros':'NUM','deuteronômio':'DEU','deuteronomio':'DEU','josué':'JOS','josue':'JOS',
  'juízes':'JDG','juizes':'JDG','rute':'RUT',
  '1 samuel':'1SA','1samuel':'1SA','2 samuel':'2SA','2samuel':'2SA',
  '1 reis':'1KI','1reis':'1KI','2 reis':'2KI','2reis':'2KI',
  '1 crônicas':'1CH','1cronicas':'1CH','1 cronicas':'1CH',
  '2 crônicas':'2CH','2cronicas':'2CH','2 cronicas':'2CH',
  'esdras':'EZR','neemias':'NEH','ester':'EST','jó':'JOB','job':'JOB',
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

/**
 * Extrai livro e capítulo de uma mensagem como "Gênesis 2" ou "1 Samuel 10".
 * O último token numérico é o capítulo; o restante é o livro.
 */
function parseLivroCapitulo(texto) {
  const partes = texto.trim().split(/\s+/);
  if (partes.length < 2) return null;
  const capitulo = partes[partes.length - 1];
  if (!/^\d+$/.test(capitulo)) return null;
  const livro = partes.slice(0, -1).join(' ');
  return { livro, capitulo };
}

async function buscarCronograma() {
  const sheets = await getSheets();
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

const MENU = `📖 *Estudos Bíblicos*\n\nEscolha uma opção:\n\n1️⃣ Cronograma\n2️⃣ Áudio e Livro\n3️⃣ Livro Comentado\n\nDigite 0 para sair.`;

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
    case 'menu': {
      switch (tl) {
        case '1': {
          try {
            const itens = await buscarCronograma();
            if (!itens.length) {
              resultado = { sucesso: true, resposta: '🎉 Nenhum item pendente no cronograma!' };
            } else {
              let msg = '📅 *Próximas leituras:*\n\n';
              itens.forEach((row, i) => {
                const dia = row[2] ? ` — Dia ${row[2]}` : '';
                msg += `${i + 1}. *${row[0]}* cap. ${row[1]}${dia}\n`;
              });
              msg += `\n📋 *Editar cronograma:* ${SHEET_LINK}`;
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
          estado.etapa = 'audio';
          resultado = { sucesso: true, resposta: 'Qual livro e capítulo? (Ex: Gênesis 2, Salmos 23, João 3 )' };
          break;

        case '3':
          estado.etapa = 'comentado';
          resultado = { sucesso: true, resposta: 'Qual livro e capítulo? (Ex: Gênesis 47, Salmos 23)' };
          break;

        default:
          resultado = { sucesso: false, resposta: '❌ Opção inválida. Digite 1, 2 ou 3.' };
          break;
      }
      break;
    }

    // ── Opção 2 — Áudio e Livro ───────────────────────────────────────────────
    case 'audio': {
      const parsed = parseLivroCapitulo(texto);
      if (!parsed) {
        resultado = { sucesso: false, resposta: '❌ Formato inválido. Envie livro e capítulo juntos.\nEx: Gênesis 2' };
        break;
      }
      const { livro, capitulo } = parsed;
      const key = livro.toLowerCase();
      const abrevBO = ABBR_BIBLIAONLINE[key];
      const abrevBC = ABBR_BIBLECOM[key];
      const linkBO = abrevBO
        ? `https://www.bibliaonline.com.br/nvi/${abrevBO}/${capitulo}`
        : `https://www.bibliaonline.com.br/nvi`;
      const linkBC = abrevBC
        ? `https://www.bible.com/pt/bible/129/${abrevBC}.${capitulo}.NVI`
        : `https://www.bible.com/pt/bible/129`;
      const spotifyLink = getSpotifyLink(livro);
      resultado = {
        sucesso: true,
        resposta:
          `📖 *Bíblia escrita (NVI):* ${linkBO}\n\n` +
          `🎧 *Bíblia Falada (A Mensagem):* ${spotifyLink}\n\n` +
          `🎧 *Bíblia NVI (áudio):* ${linkBC}`,
      };
      delete estadosEstudo[remetente];
      break;
    }

    // ── Opção 3 — Livro Comentado ─────────────────────────────────────────────
    case 'comentado': {
      const parsed = parseLivroCapitulo(texto);
      if (!parsed) {
        resultado = { sucesso: false, resposta: '❌ Formato inválido. Envie livro e capítulo juntos.\nEx: Gênesis 47' };
        break;
      }
      const { livro, capitulo } = parsed;
      const q1 = encodeURIComponent(`paulo own 1cpd ${livro} ${capitulo}`);
      const q2 = encodeURIComponent(`ed rene kivitz ${livro} ${capitulo}`);
      resultado = {
        sucesso: true,
        resposta:
          `🎬 *Paulo Own 1CPD:* https://www.youtube.com/results?search_query=${q1}\n\n` +
          `🎬 *Ed René Kivitz:* https://www.youtube.com/results?search_query=${q2}`,
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
