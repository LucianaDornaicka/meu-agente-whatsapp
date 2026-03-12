# Skill: Agente de Estudos Bíblicos — CORREÇÕES

## Correção 1 — Menu de letras no orchestrator.js
O menu de ajuda deve usar EXATAMENTE estas letras em ordem alfabética:
A - Agenda
C - Cardápio
K - Casa
E - Estudo
F - Financeiro
I - Inglês
L - Lembrete
M - Médico
T - Tarefa

O orchestrator.js deve aceitar tanto a letra quanto a palavra:

- A ou agenda → agenda
- C ou cardápio → cardápio
- K ou casa → casa
- E ou estudo → estudo
- F ou financeiro ou $ → financeiro
- I ou ing ou inglês → inglês
- L ou lembrete → lembrete
- M ou médico → médico
- T ou tarefa → tarefa


O orchestrator.js deve aceitar tanto a letra quanto a palavra:
- A ou agenda → agenda
- C ou cardápio → cardápio
- K ou casa → casa
- E ou estudo → estudo
- F ou financeiro ou $ → financeiro
- I ou ing ou inglês → inglês
- L ou lembrete → lembrete
- M ou médico → médico
- T ou tarefa → tarefa

## Correção 2 — Opção 2 do estudo.js (Áudio e Livro)
Substituir o link fixo do Spotify por um link dinâmico por livro.

Cada livro tem uma playlist específica no Spotify da Bíblia Falada (A Mensagem).
Usar esta tabela de links do Spotify por livro:
- Gênesis: https://open.spotify.com/playlist/7epqnxKViWlEAJ1yQFAgmq
- Para os demais livros: montar busca no Spotify: https://open.spotify.com/search/biblia%20falada%20[LIVRO]

O link da Bíblia NVI (bible.com ) deve usar a tabela CORRETA de abreviações abaixo.

## Correção 3 — Tabela de abreviações CORRETA para todos os livros

### Para bibliaonline.com.br (minúsculas, sem acento):
Gênesis=gn, Êxodo=ex, Levítico=lv, Números=nm, Deuteronômio=dt,
Josué=js, Juízes=jz, Rute=rt, 1Samuel=1sm, 2Samuel=2sm,
1Reis=1rs, 2Reis=2rs, 1Crônicas=1cr, 2Crônicas=2cr,
Esdras=ed, Neemias=ne, Ester=et, Jó=jo, Salmos=sl,
Provérbios=pv, Eclesiastes=ec, Cânticos=ct, Isaías=is,
Jeremias=jr, Lamentações=lm, Ezequiel=ez, Daniel=dn,
Oséias=os, Joel=jl, Amós=am, Obadias=ob, Jonas=jn,
Miquéias=mq, Naum=na, Habacuque=hc, Sofonias=sf,
Ageu=ag, Zacarias=zc, Malaquias=ml,
Mateus=mt, Marcos=mc, Lucas=lc, João=jo, Atos=at,
Romanos=rm, 1Coríntios=1co, 2Coríntios=2co, Gálatas=gl,
Efésios=ef, Filipenses=fp, Colossenses=cl,
1Tessalonicenses=1ts, 2Tessalonicenses=2ts,
1Timóteo=1tm, 2Timóteo=2tm, Tito=tt, Filemom=fm,
Hebreus=hb, Tiago=tg, 1Pedro=1pe, 2Pedro=2pe,
1João=1jo, 2João=2jo, 3João=3jo, Judas=jd, Apocalipse=ap

ATENÇÃO: Jó = jo (não confundir com João = jo no NT)
Para diferenciar: se o usuário digitar "Jó" usar jo, se digitar "João" usar jo também
(o bibliaonline diferencia pelo contexto do livro)

### Para bible.com (maiúsculas):
Gênesis=GEN, Êxodo=EXO, Levítico=LEV, Números=NUM, Deuteronômio=DEU,
Josué=JOS, Juízes=JDG, Rute=RUT, 1Samuel=1SA, 2Samuel=2SA,
1Reis=1KI, 2Reis=2KI, 1Crônicas=1CH, 2Crônicas=2CH,
Esdras=EZR, Neemias=NEH, Ester=EST, Jó=JOB, Salmos=PSA,
Provérbios=PRO, Eclesiastes=ECC, Cânticos=SNG, Isaías=ISA,
Jeremias=JER, Lamentações=LAM, Ezequiel=EZK, Daniel=DAN,
Oséias=HOS, Joel=JOL, Amós=AMO, Obadias=OBA, Jonas=JON,
Miquéias=MIC, Naum=NAM, Habacuque=HAB, Sofonias=ZEP,
Ageu=HAG, Zacarias=ZEC, Malaquias=MAL,
Mateus=MAT, Marcos=MRK, Lucas=LUK, João=JHN, Atos=ACT,
Romanos=ROM, 1Coríntios=1CO, 2Coríntios=2CO, Gálatas=GAL,
Efésios=EPH, Filipenses=PHP, Colossenses=COL,
1Tessalonicenses=1TH, 2Tessalonicenses=2TH,
1Timóteo=1TI, 2Timóteo=2TI, Tito=TIT, Filemom=PHM,
Hebreus=HEB, Tiago=JAS, 1Pedro=1PE, 2Pedro=2PE,
1João=1JN, 2João=2JN, 3João=3JN, Judas=JUD, Apocalipse=REV

ATENÇÃO CRÍTICA: Jó=JOB (não JHN que é João)
