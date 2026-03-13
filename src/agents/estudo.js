import { getSheets } from '../services/googleSheets.js';

export const estadosEstudo = {};

const STUDY_SPREADSHEET_ID = process.env.STUDY_SPREADSHEET_ID;
const SHEET_LINK = 'https://docs.google.com/spreadsheets/d/1Ioba9L8BF-oS8RIDxc8gow1HUzJV5Slu3iX-LaGHcW0/edit';

// IDs de álbuns no Spotify por livro (Bíblia Falada – A Mensagem)
// 'jó' (com acento) = Jó (JOB) | 'jo' (sem acento) = João (Evangelho)
// Amós, Obadias, Naum, Sofonias e Judas não têm álbum → fallback de busca
const SPOTIFY_ALBUMS = {
  // ANTIGO TESTAMENTO
  'gênesis':'4COk30f1B1EECjqi66HGZ6','genesis':'4COk30f1B1EECjqi66HGZ6','gn':'4COk30f1B1EECjqi66HGZ6',
  'êxodo':'6fWfOMAiYDuFKF1ylevRxS','exodo':'6fWfOMAiYDuFKF1ylevRxS','ex':'6fWfOMAiYDuFKF1ylevRxS',
  'levítico':'1pFIhhNbP3Rjc86iPGkNEf','levitico':'1pFIhhNbP3Rjc86iPGkNEf','lv':'1pFIhhNbP3Rjc86iPGkNEf',
  'números':'0kDKaU4MAKkLrT5GUhBppT','numeros':'0kDKaU4MAKkLrT5GUhBppT','nm':'0kDKaU4MAKkLrT5GUhBppT',
  'deuteronômio':'7A2JefHH6LRXSYdZvfvEnT','deuteronomio':'7A2JefHH6LRXSYdZvfvEnT','dt':'7A2JefHH6LRXSYdZvfvEnT',
  'josué':'1dSiDcc2hQbvm7iY06u5IQ','josue':'1dSiDcc2hQbvm7iY06u5IQ','js':'1dSiDcc2hQbvm7iY06u5IQ',
  'juízes':'0LDrfGaRxXCJeBTbarroHQ','juizes':'0LDrfGaRxXCJeBTbarroHQ','jz':'0LDrfGaRxXCJeBTbarroHQ',
  'rute':'5c0KGHpIuD7BkEU4mEu82k','rt':'5c0KGHpIuD7BkEU4mEu82k',
  '1 samuel':'5drDPCxBXEvDYPYJnszLIx','1samuel':'5drDPCxBXEvDYPYJnszLIx','1sm':'5drDPCxBXEvDYPYJnszLIx',
  '2 samuel':'5WVpe4xIgjZRzMud3ZUMPc','2samuel':'5WVpe4xIgjZRzMud3ZUMPc','2sm':'5WVpe4xIgjZRzMud3ZUMPc',
  '1 reis':'2Sdp0viKdkqmlJsjEhwkPb','1reis':'2Sdp0viKdkqmlJsjEhwkPb','1rs':'2Sdp0viKdkqmlJsjEhwkPb',
  '2 reis':'7d7CHUCXgVnEX6TaMxILQb','2reis':'7d7CHUCXgVnEX6TaMxILQb','2rs':'7d7CHUCXgVnEX6TaMxILQb',
  '1 crônicas':'1Zt0bDugkqBBw42KsniOnP','1 cronicas':'1Zt0bDugkqBBw42KsniOnP','1cr':'1Zt0bDugkqBBw42KsniOnP',
  '2 crônicas':'54dVbqxAfc43UCWsQVyc2z','2 cronicas':'54dVbqxAfc43UCWsQVyc2z','2cr':'54dVbqxAfc43UCWsQVyc2z',
  'esdras':'0uElqlyZwUPptl04mGDxt5','ed':'0uElqlyZwUPptl04mGDxt5',
  'neemias':'3EY7cEmmmOw8zfmlm9sPRN','ne':'3EY7cEmmmOw8zfmlm9sPRN',
  'ester':'12BXOD6TfhBwXZS9vIbAT2','et':'12BXOD6TfhBwXZS9vIbAT2',
  'jó':'73zSJJ7BQhKyQ3lOpPnBsf','job':'73zSJJ7BQhKyQ3lOpPnBsf', // ← COM ACENTO = Jó (JOB)
  'salmos':'6bzuQx4IMqVqHaFlsqLeNi','sl':'6bzuQx4IMqVqHaFlsqLeNi',
  'provérbios':'30Pt5ojZjsXbYzaMM6tm9F','proverbios':'30Pt5ojZjsXbYzaMM6tm9F','pv':'30Pt5ojZjsXbYzaMM6tm9F',
  'eclesiastes':'1k6fOgx6TSAfQDNrJYo9rb','ec':'1k6fOgx6TSAfQDNrJYo9rb',
  'cânticos':'3mBq8yDWW9mdXVHTyCRUDR','canticos':'3mBq8yDWW9mdXVHTyCRUDR','ct':'3mBq8yDWW9mdXVHTyCRUDR',
  'isaías':'1GASrF8WHcAIoUY6nWXbLN','isaias':'1GASrF8WHcAIoUY6nWXbLN','is':'1GASrF8WHcAIoUY6nWXbLN',
  'jeremias':'5y8kG2UEbyoIICNvsxLdcf','jr':'5y8kG2UEbyoIICNvsxLdcf',
  'lamentações':'6nUbzpxwW6TXZoSRwFSQn9','lamentacoes':'6nUbzpxwW6TXZoSRwFSQn9','lm':'6nUbzpxwW6TXZoSRwFSQn9',
  'ezequiel':'39RSbDQ0lfJ1Ox94Wk9Qbq','ez':'39RSbDQ0lfJ1Ox94Wk9Qbq',
  'daniel':'5scAswx77z3q5C8h9sSTd0','dn':'5scAswx77z3q5C8h9sSTd0',
  'oséias':'0Kt3hVOWrWzl5zWP4CU5sI','oseias':'0Kt3hVOWrWzl5zWP4CU5sI','os':'0Kt3hVOWrWzl5zWP4CU5sI',
  'jonas':'6DnofUfJQCI2beMRyREiyx','jn':'6DnofUfJQCI2beMRyREiyx',
  'miquéias':'7eUe52VwuuL8ex1nF1KZnp','miqueias':'7eUe52VwuuL8ex1nF1KZnp','mq':'7eUe52VwuuL8ex1nF1KZnp',
  'habacuque':'2Q10ATMUnbMAO0ML4QapfC','hc':'2Q10ATMUnbMAO0ML4QapfC',
  'ageu':'65csol0zvE4ZPUMb20HMdI','ag':'65csol0zvE4ZPUMb20HMdI',
  'zacarias':'7roBJNzCvXFLZoIQCXPN4m','zc':'7roBJNzCvXFLZoIQCXPN4m',
  'malaquias':'4GAWcOT7jV6soNczPvUtv6','ml':'4GAWcOT7jV6soNczPvUtv6',
  // NOVO TESTAMENTO
  'mateus':'4mQOxaG8HRFuNPd0i09JbE','mt':'4mQOxaG8HRFuNPd0i09JbE',
  'marcos':'0NwneT64ZuzSDVBjzmZtyf','mc':'0NwneT64ZuzSDVBjzmZtyf',
  'lucas':'5PxlFQuzBsrj5Ht1FcdI38','lc':'5PxlFQuzBsrj5Ht1FcdI38',
  'joão':'4CCaCZjJolWgtSERElPAeo','joao':'4CCaCZjJolWgtSERElPAeo','jo':'4CCaCZjJolWgtSERElPAeo', // ← SEM ACENTO = João
  'atos':'1rKLWaOyskn9fXsuAJDWNy','at':'1rKLWaOyskn9fXsuAJDWNy',
  'romanos':'46ZPluApRsSb3LZagvNBr9','rm':'46ZPluApRsSb3LZagvNBr9',
  '1 coríntios':'5G5JEQxswLRXRFgIlGMyAv','1 corintios':'5G5JEQxswLRXRFgIlGMyAv','1co':'5G5JEQxswLRXRFgIlGMyAv',
  '2 coríntios':'1ODki1scmpF2nDdgHuEAUj','2 corintios':'1ODki1scmpF2nDdgHuEAUj','2co':'1ODki1scmpF2nDdgHuEAUj',
  'gálatas':'3bLnRHQ0FXqsr8nLebpeKJ','galatas':'3bLnRHQ0FXqsr8nLebpeKJ','gl':'3bLnRHQ0FXqsr8nLebpeKJ',
  'efésios':'0WhgD7BMjTJExpYUMKL1lp','efesios':'0WhgD7BMjTJExpYUMKL1lp','ef':'0WhgD7BMjTJExpYUMKL1lp',
  'filipenses':'3BwspLR5HIHE2rcvPqjbYc','fp':'3BwspLR5HIHE2rcvPqjbYc',
  'colossenses':'6nrrN2wfse8FvVbHEPKAQV','cl':'6nrrN2wfse8FvVbHEPKAQV',
  '1 tessalonicenses':'023bb9SmoxZtfmsbUrz3WK','1ts':'023bb9SmoxZtfmsbUrz3WK',
  '2 tessalonicenses':'60sLLAcmOzvVgypbef4hVl','2ts':'60sLLAcmOzvVgypbef4hVl',
  '1 timóteo':'6aOHvDwF4wsUWQyzdAZrPw','1 timoteo':'6aOHvDwF4wsUWQyzdAZrPw','1tm':'6aOHvDwF4wsUWQyzdAZrPw',
  '2 timóteo':'2oLfRU6fWLI0aLtXqAoold','2 timoteo':'2oLfRU6fWLI0aLtXqAoold','2tm':'2oLfRU6fWLI0aLtXqAoold',
  'tito':'2iUdozAxZoUS1CCAr1zSym','tt':'2iUdozAxZoUS1CCAr1zSym',
  'filemom':'4umWdNZh63KacTDIV1NusR','fm':'4umWdNZh63KacTDIV1NusR',
  'hebreus':'2OhUK4K4vAN3viveoXKABR','hb':'2OhUK4K4vAN3viveoXKABR',
  'tiago':'1BRzoDKa12yPdWNGEEGj1o','tg':'1BRzoDKa12yPdWNGEEGj1o',
  '1 pedro':'3skshPyPwQ0FEYItSce5c9','1pedro':'3skshPyPwQ0FEYItSce5c9','1pe':'3skshPyPwQ0FEYItSce5c9',
  '2 pedro':'1mAJxSkCOxQFDFgduQHRJS','2pedro':'1mAJxSkCOxQFDFgduQHRJS','2pe':'1mAJxSkCOxQFDFgduQHRJS',
  '1 joão':'0OvnL2mhXkOY4JfyERIAmA','1 joao':'0OvnL2mhXkOY4JfyERIAmA','1jo':'0OvnL2mhXkOY4JfyERIAmA',
  '2 joão':'3IbFQHN6AdBndK2lZYB1Vg','2 joao':'3IbFQHN6AdBndK2lZYB1Vg','2jo':'3IbFQHN6AdBndK2lZYB1Vg',
  '3 joão':'55dSzuezVLx6t7As7byXN2','3 joao':'55dSzuezVLx6t7As7byXN2','3jo':'55dSzuezVLx6t7As7byXN2',
  'apocalipse':'0Wldpi4kzmHIwWgjDMsO17','ap':'0Wldpi4kzmHIwWgjDMsO17',
  // Sem álbum: Amós, Obadias, Joel, Naum, Sofonias, Judas → fallback de busca
};

function getSpotifyLink(livroInput) {
  const key = livroInput.trim().toLowerCase();
  const albumId = SPOTIFY_ALBUMS[key];
  if (albumId) return `https://open.spotify.com/album/${albumId}`;
  return `https://open.spotify.com/search/b%C3%ADblia%20falada%20${encodeURIComponent(livroInput.trim())}`;
}

// Abreviações para bibliaonline.com.br (slug raw — será passado por encodeURIComponent)
// ATENÇÃO: 'jó' (com acento) → slug 'jó' → URL j%C3%B3 | 'jo'/'joão' → slug 'jo'
const ABBR_BIBLIAONLINE = {
  // Antigo Testamento
  'gênesis':'gn','genesis':'gn','gn':'gn',
  'êxodo':'ex','exodo':'ex','ex':'ex',
  'levítico':'lv','levitico':'lv','lv':'lv',
  'números':'nm','numeros':'nm','nm':'nm',
  'deuteronômio':'dt','deuteronomio':'dt','dt':'dt',
  'josué':'js','josue':'js','js':'js',
  'juízes':'jz','juizes':'jz','jz':'jz',
  'rute':'rt','rt':'rt',
  '1 samuel':'1sm','1samuel':'1sm','1sm':'1sm',
  '2 samuel':'2sm','2samuel':'2sm','2sm':'2sm',
  '1 reis':'1rs','1reis':'1rs','1rs':'1rs',
  '2 reis':'2rs','2reis':'2rs','2rs':'2rs',
  '1 crônicas':'1cr','1 cronicas':'1cr','1cronicas':'1cr','1cr':'1cr',
  '2 crônicas':'2cr','2 cronicas':'2cr','2cronicas':'2cr','2cr':'2cr',
  'esdras':'ed','ed':'ed',
  'neemias':'ne','ne':'ne',
  'ester':'et','et':'et',
  'jó':'jó','job':'jó',                        // ← slug 'jó' → j%C3%B3 na URL
  'salmos':'sl','salmo':'sl','sl':'sl',
  'provérbios':'pv','proverbios':'pv','pv':'pv',
  'eclesiastes':'ec','ec':'ec',
  'cânticos':'ct','canticos':'ct','cântico':'ct','cantico':'ct','cantares':'ct','ct':'ct',
  'isaías':'is','isaias':'is','is':'is',
  'jeremias':'jr','jr':'jr',
  'lamentações':'lm','lamentacoes':'lm','lm':'lm',
  'ezequiel':'ez','ez':'ez',
  'daniel':'dn','dn':'dn',
  'oséias':'os','oseias':'os','os':'os',
  'joel':'jl','jl':'jl',
  'amós':'am','amos':'am','am':'am',
  'obadias':'ob','ob':'ob',
  'jonas':'jn','jn':'jn',                      // ← Jonas = jn (diferente de João = jo)
  'miquéias':'mq','miqueias':'mq','mq':'mq',
  'naum':'na','na':'na',
  'habacuque':'hc','hc':'hc',
  'sofonias':'sf','sf':'sf',
  'ageu':'ag','ag':'ag',
  'zacarias':'zc','zc':'zc',
  'malaquias':'ml','ml':'ml',
  // Novo Testamento
  'mateus':'mt','mt':'mt',
  'marcos':'mc','mc':'mc',
  'lucas':'lc','lc':'lc',
  'joão':'jo','joao':'jo','jo':'jo',           // ← João = jo (diferente de Jó = jó)
  'atos':'at','at':'at',
  'romanos':'rm','rm':'rm',
  '1 coríntios':'1co','1 corintios':'1co','1coríntios':'1co','1corintios':'1co','1co':'1co',
  '2 coríntios':'2co','2 corintios':'2co','2coríntios':'2co','2corintios':'2co','2co':'2co',
  'gálatas':'gl','galatas':'gl','gl':'gl',
  'efésios':'ef','efesios':'ef','ef':'ef',
  'filipenses':'fp','fp':'fp',
  'colossenses':'cl','cl':'cl',
  '1 tessalonicenses':'1ts','1tessalonicenses':'1ts','1ts':'1ts',
  '2 tessalonicenses':'2ts','2tessalonicenses':'2ts','2ts':'2ts',
  '1 timóteo':'1tm','1 timoteo':'1tm','1timóteo':'1tm','1timoteo':'1tm','1tm':'1tm',
  '2 timóteo':'2tm','2 timoteo':'2tm','2timóteo':'2tm','2timoteo':'2tm','2tm':'2tm',
  'tito':'tt','tt':'tt',
  'filemom':'fm','fm':'fm',
  'hebreus':'hb','hb':'hb',
  'tiago':'tg','tg':'tg',
  '1 pedro':'1pe','1pedro':'1pe','1pe':'1pe',
  '2 pedro':'2pe','2pedro':'2pe','2pe':'2pe',
  '1 joão':'1jo','1 joao':'1jo','1joão':'1jo','1joao':'1jo','1jo':'1jo',
  '2 joão':'2jo','2 joao':'2jo','2joão':'2jo','2joao':'2jo','2jo':'2jo',
  '3 joão':'3jo','3 joao':'3jo','3joão':'3jo','3joao':'3jo','3jo':'3jo',
  'judas':'jd','jd':'jd',
  'apocalipse':'ap','ap':'ap',
};

// Abreviações para bible.com (maiúsculas)
// ATENÇÃO: 'jó' (com acento) → JOB | 'jo'/'joão' → JHN
const ABBR_BIBLECOM = {
  // Antigo Testamento
  'gênesis':'GEN','genesis':'GEN','gn':'GEN',
  'êxodo':'EXO','exodo':'EXO','ex':'EXO',
  'levítico':'LEV','levitico':'LEV','lv':'LEV',
  'números':'NUM','numeros':'NUM','nm':'NUM',
  'deuteronômio':'DEU','deuteronomio':'DEU','dt':'DEU',
  'josué':'JOS','josue':'JOS','js':'JOS',
  'juízes':'JDG','juizes':'JDG','jz':'JDG',
  'rute':'RUT','rt':'RUT',
  '1 samuel':'1SA','1samuel':'1SA','1sm':'1SA',
  '2 samuel':'2SA','2samuel':'2SA','2sm':'2SA',
  '1 reis':'1KI','1reis':'1KI','1rs':'1KI',
  '2 reis':'2KI','2reis':'2KI','2rs':'2KI',
  '1 crônicas':'1CH','1 cronicas':'1CH','1cronicas':'1CH','1cr':'1CH',
  '2 crônicas':'2CH','2 cronicas':'2CH','2cronicas':'2CH','2cr':'2CH',
  'esdras':'EZR','ed':'EZR',
  'neemias':'NEH','ne':'NEH',
  'ester':'EST','et':'EST',
  'jó':'JOB','job':'JOB',                      // ← Jó = JOB (não JHN)
  'salmos':'PSA','salmo':'PSA','sl':'PSA',
  'provérbios':'PRO','proverbios':'PRO','pv':'PRO',
  'eclesiastes':'ECC','ec':'ECC',
  'cânticos':'SNG','canticos':'SNG','cântico':'SNG','cantico':'SNG','cantares':'SNG','ct':'SNG',
  'isaías':'ISA','isaias':'ISA','is':'ISA',
  'jeremias':'JER','jr':'JER',
  'lamentações':'LAM','lamentacoes':'LAM','lm':'LAM',
  'ezequiel':'EZK','ez':'EZK',
  'daniel':'DAN','dn':'DAN',
  'oséias':'HOS','oseias':'HOS','os':'HOS',
  'joel':'JOL','jl':'JOL',
  'amós':'AMO','amos':'AMO','am':'AMO',
  'obadias':'OBA','ob':'OBA',
  'jonas':'JON','jn':'JON',                    // ← Jonas = JON
  'miquéias':'MIC','miqueias':'MIC','mq':'MIC',
  'naum':'NAM','na':'NAM',
  'habacuque':'HAB','hc':'HAB',
  'sofonias':'ZEP','sf':'ZEP',
  'ageu':'HAG','ag':'HAG',
  'zacarias':'ZEC','zc':'ZEC',
  'malaquias':'MAL','ml':'MAL',
  // Novo Testamento
  'mateus':'MAT','mt':'MAT',
  'marcos':'MRK','mc':'MRK',
  'lucas':'LUK','lc':'LUK',
  'joão':'JHN','joao':'JHN','jo':'JHN',        // ← João = JHN (não JOB)
  'atos':'ACT','at':'ACT',
  'romanos':'ROM','rm':'ROM',
  '1 coríntios':'1CO','1 corintios':'1CO','1coríntios':'1CO','1corintios':'1CO','1co':'1CO',
  '2 coríntios':'2CO','2 corintios':'2CO','2coríntios':'2CO','2corintios':'2CO','2co':'2CO',
  'gálatas':'GAL','galatas':'GAL','gl':'GAL',
  'efésios':'EPH','efesios':'EPH','ef':'EPH',
  'filipenses':'PHP','fp':'PHP',
  'colossenses':'COL','cl':'COL',
  '1 tessalonicenses':'1TH','1tessalonicenses':'1TH','1ts':'1TH',
  '2 tessalonicenses':'2TH','2tessalonicenses':'2TH','2ts':'2TH',
  '1 timóteo':'1TI','1 timoteo':'1TI','1timóteo':'1TI','1timoteo':'1TI','1tm':'1TI',
  '2 timóteo':'2TI','2 timoteo':'2TI','2timóteo':'2TI','2timoteo':'2TI','2tm':'2TI',
  'tito':'TIT','tt':'TIT',
  'filemom':'PHM','fm':'PHM',
  'hebreus':'HEB','hb':'HEB',
  'tiago':'JAS','tg':'JAS',
  '1 pedro':'1PE','1pedro':'1PE','1pe':'1PE',
  '2 pedro':'2PE','2pedro':'2PE','2pe':'2PE',
  '1 joão':'1JN','1 joao':'1JN','1joão':'1JN','1joao':'1JN','1jo':'1JN',
  '2 joão':'2JN','2 joao':'2JN','2joão':'2JN','2joao':'2JN','2jo':'2JN',
  '3 joão':'3JN','3 joao':'3JN','3joão':'3JN','3joao':'3JN','3jo':'3JN',
  'judas':'JUD','jd':'JUD',
  'apocalipse':'REV','ap':'REV',
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
        ? `https://www.bibliaonline.com.br/nvi/${encodeURIComponent(abrevBO)}/${capitulo}`
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
