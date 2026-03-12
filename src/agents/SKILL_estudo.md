# Skill: Agente de Estudos Bíblicos

## Objetivo
Reescrever COMPLETAMENTE o arquivo `src/agents/estudo.js` como um agente de estudos BÍBLICOS.
NÃO criar agente de estudos genérico. NÃO criar opções de adicionar tópico, ver planos ou progresso de matéria.

## Menu principal
Quando o usuário digitar "estudo", mostrar EXATAMENTE este menu:

📖 *Assistente de Estudos Bíblicos*

Digite o número da opção:
1️⃣ Cronograma
2️⃣ Áudio e Livro
3️⃣ Livro Comentado

## Opção 1 — Cronograma
- Busca na planilha Google Sheets usando process.env.STUDY_SPREADSHEET_ID
- Aba: "Plano de Leitura 365 Dias"
- Colunas: B=Livro, C=Capítulo, D=Dia, E=Status (dados a partir da linha 3)
- Mostra os próximos 5 itens onde a coluna E (Status) está VAZIA (não estudados ainda)
- Formato da resposta:
  📅 *Próximas leituras:*
  • Dia [D] — [Livro] [Capítulo]

## Opção 2 — Áudio e Livro
- Pergunta: "Qual livro e capítulo? (ex: Gênesis 4)"
- Usuário responde com livro e número do capítulo
- Retorna EXATAMENTE 2 links:
  1. 🎧 *Áudio NVI:* https://www.youtube.com/results?search_query=biblia+nvi+narrada+[LIVRO]+capitulo+[CAPITULO]
  2. 📖 *Leitura:* https://www.bible.com/pt/bible/1608/[ABREVIACAO].[CAPITULO].NVI
- Usar tabela de abreviações dos livros bíblicos para o link do Bible.com (GEN, EXO, LEV, NUM, DEU, JOS, JDG, RUT, 1SA, 2SA, 1KI, 2KI, 1CH, 2CH, EZR, NEH, EST, JOB, PSA, PRO, ECC, SNG, ISA, JER, LAM, EZK, DAN, HOS, JOL, AMO, OBA, JON, MIC, NAM, HAB, ZEP, HAG, ZEC, MAL, MAT, MRK, LUK, JHN, ACT, ROM, 1CO, 2CO, GAL, EPH, PHP, COL, 1TH, 2TH, 1TI, 2TI, TIT, PHM, HEB, JAS, 1PE, 2PE, 1JN, 2JN, 3JN, JUD, REV )

## Opção 3 — Livro Comentado
- Pergunta: "Qual livro e capítulo? (ex: Gênesis 47)"
- Usuário responde com livro e número do capítulo
- Retorna EXATAMENTE 2 links de busca no YouTube:
  1. 🎬 *Paulo Own 1CPD:* https://www.youtube.com/results?search_query=paulo+own+1cpd+[LIVRO]+[CAPITULO]
  2. 🎬 *Ed René Kivitz:* https://www.youtube.com/results?search_query=ed+rene+kivitz+[LIVRO]+[CAPITULO]

## Padrão de código
- Usar ES Modules (import/export )
- Seguir o padrão de estados de conversa do arquivo agenda_js.js (userStates)
- Usar getSheets() do googleSheets.js para acessar a planilha
- Tratar erros com try/catch
- Exportar: export async function agenteEstudo(mensagem, remetente)

## Integração no orchestrator.js
- Import: import { agenteEstudo } from './estudo.js';
- Condição: se texto for "estudo", chamar agenteEstudo()
