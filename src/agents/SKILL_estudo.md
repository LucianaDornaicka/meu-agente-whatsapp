# Skill: Agente de Estudos Bíblicos

## Objetivo
Reescrever COMPLETAMENTE o arquivo `src/agents/estudo.js` com as correções abaixo.

## Menu principal
Quando o usuário digitar "estudo", mostrar EXATAMENTE este menu:

📖 *Estudos Bíblicos*

Escolha uma opção:
1️⃣ Cronograma
2️⃣ Áudio e Livro
3️⃣ Livro Comentado

Digite 0 para sair.

## Opção 1 — Cronograma
- Busca na planilha Google Sheets usando process.env.STUDY_SPREADSHEET_ID
- Aba: "Plano de Leitura 365 Dias"
- Colunas: B=Livro, C=Capítulo, D=Dia, E=Status (dados a partir da linha 3)
- Mostra os próximos 5 itens onde a coluna E (Status) está VAZIA
- Após mostrar o cronograma, inclui também o link da planilha para edição:
  📋 *Editar cronograma:* https://docs.google.com/spreadsheets/d/1Ioba9L8BF-oS8RIDxc8gow1HUzJV5Slu3iX-LaGHcW0/edit
- Formato da resposta:
  📅 *Próximas leituras:*
  1. *Gênesis* cap. 1 — Dia 1
  2. *Gênesis* cap. 2 — Dia 1
  ...
  📋 *Editar cronograma:* [link]

## Opção 2 — Áudio e Livro
- IMPORTANTE: NÃO perguntar livro e capítulo em mensagens separadas
- Perguntar em UMA ÚNICA mensagem: "Qual livro e capítulo? (Ex: Gênesis 2, Salmos 23, João 3 )"
- Usuário responde com livro e capítulo JUNTOS em uma só mensagem (ex: "Gênesis 2")
- Retorna EXATAMENTE 3 links:
  1. 📖 *Bíblia escrita (NVI):* https://www.bibliaonline.com.br/nvi/[abreviacao]/[capitulo]
     Exemplo para Gênesis 2: https://www.bibliaonline.com.br/nvi/gn/2
  2. 🎧 *Bíblia Falada (A Mensagem ):* https://open.spotify.com/playlist/7epqnxKViWlEAJ1yQFAgmq
     (link fixo do Spotify — usuário procura o livro lá )
  3. 🎧 *Bíblia NVI (áudio):* https://www.bible.com/pt/bible/129/[ABREVIACAO].[CAPITULO].NVI
     Exemplo para Gênesis 2: https://www.bible.com/pt/bible/129/GEN.2.NVI

- Tabela de abreviações para bibliaonline.com.br (minúsculas ):
  Gênesis=gn, Êxodo=ex, Levítico=lv, Números=nm, Deuteronômio=dt, Josué=js, Juízes=jz,
  Rute=rt, 1Samuel=1sm, 2Samuel=2sm, 1Reis=1rs, 2Reis=2rs, 1Crônicas=1cr, 2Crônicas=2cr,
  Esdras=ed, Neemias=ne, Ester=et, Jó=jó, Salmos=sl, Provérbios=pv, Eclesiastes=ec,
  Cantares=ct, Isaías=is, Jeremias=jr, Lamentações=lm, Ezequiel=ez, Daniel=dn, Oséias=os,
  Joel=jl, Amós=am, Obadias=ob, Jonas=jn, Miquéias=mq, Naum=na, Habacuque=hc, Sofonias=sf,
  Ageu=ag, Zacarias=zc, Malaquias=ml, Mateus=mt, Marcos=mc, Lucas=lc, João=jo, Atos=at,
  Romanos=rm, 1Coríntios=1co, 2Coríntios=2co, Gálatas=gl, Efésios=ef, Filipenses=fp,
  Colossenses=cl, 1Tessalonicenses=1ts, 2Tessalonicenses=2ts, 1Timóteo=1tm, 2Timóteo=2tm,
  Tito=tt, Filemom=fm, Hebreus=hb, Tiago=tg, 1Pedro=1pe, 2Pedro=2pe, 1João=1jo,
  2João=2jo, 3João=3jo, Judas=jd, Apocalipse=ap

- Tabela de abreviações para bible.com (maiúsculas):
  Gênesis=GEN, Êxodo=EXO, Levítico=LEV, Números=NUM, Deuteronômio=DEU, Josué=JOS,
  Juízes=JDG, Rute=RUT, 1Samuel=1SA, 2Samuel=2SA, 1Reis=1KI, 2Reis=2KI,
  1Crônicas=1CH, 2Crônicas=2CH, Esdras=EZR, Neemias=NEH, Ester=EST, Jó=JOB,
  Salmos=PSA, Provérbios=PRO, Eclesiastes=ECC, Cantares=SNG, Isaías=ISA,
  Jeremias=JER, Lamentações=LAM, Ezequiel=EZK, Daniel=DAN, Oséias=HOS, Joel=JOL,
  Amós=AMO, Obadias=OBA, Jonas=JON, Miquéias=MIC, Naum=NAM, Habacuque=HAB,
  Sofonias=ZEP, Ageu=HAG, Zacarias=ZEC, Malaquias=MAL, Mateus=MAT, Marcos=MRK,
  Lucas=LUK, João=JHN, Atos=ACT, Romanos=ROM, 1Coríntios=1CO, 2Coríntios=2CO,
  Gálatas=GAL, Efésios=EPH, Filipenses=PHP, Colossenses=COL, 1Tessalonicenses=1TH,
  2Tessalonicenses=2TH, 1Timóteo=1TI, 2Timóteo=2TI, Tito=TIT, Filemom=PHM,
  Hebreus=HEB, Tiago=JAS, 1Pedro=1PE, 2Pedro=2PE, 1João=1JN, 2João=2JN,
  3João=3JN, Judas=JUD, Apocalipse=REV

## Opção 3 — Livro Comentado
- IMPORTANTE: NÃO perguntar livro e capítulo em mensagens separadas
- Perguntar em UMA ÚNICA mensagem: "Qual livro e capítulo? (Ex: Gênesis 47, Salmos 23)"
- Usuário responde com livro e capítulo JUNTOS (ex: "Gênesis 47")
- Retorna EXATAMENTE 2 links de busca no YouTube:
  1. 🎬 *Paulo Own 1CPD:* https://www.youtube.com/results?search_query=paulo+own+1cpd+[LIVRO]+[CAPITULO]
  2. 🎬 *Ed René Kivitz:* https://www.youtube.com/results?search_query=ed+rene+kivitz+[LIVRO]+[CAPITULO]

## Padrão de código
- Usar ES Modules (import/export )
- Seguir o padrão de estados de conversa do arquivo agenda_js.js (userStates)
- Usar getSheets() do googleSheets.js para acessar a planilha
- Tratar erros com try/catch
- Exportar: export async function agenteEstudo(mensagem, remetente)

