import {
  adicionarEstudo,
  lerMateriasPorUsuario,
  lerTopicosDeMateria,
  marcarEstudoConcluido,
} from '../services/googleSheets.js';

export const estadosEstudo = {};

export async function agenteEstudo(mensagem, remetente) {
  const texto = mensagem.trim();
  const tl = texto.toLowerCase();

  if (!estadosEstudo[remetente]) {
    estadosEstudo[remetente] = { etapa: 'menu' };
    return {
      sucesso: true,
      resposta: `📚 *Plano de Estudos*\n\nDigite o número da opção:\n\n1️⃣  Adicionar tópico\n2️⃣  Ver meus planos\n3️⃣  Marcar tópico como concluído\n4️⃣  Ver progresso de uma matéria\n\nA qualquer momento, digite *0* para sair.`,
    };
  }

  const estado = estadosEstudo[remetente];
  let resultado;

  switch (estado.etapa) {
    case 'menu':
      switch (tl) {
        case '1':
          estado.etapa = 'pedir_materia_nova';
          resultado = { sucesso: true, resposta: '📖 Qual a matéria ou nome do plano?\n(Ex: JavaScript, Matemática, Inglês)' };
          break;

        case '2': {
          const materias = await lerMateriasPorUsuario(remetente);
          if (!materias || materias.length === 0) {
            resultado = { sucesso: true, resposta: '📭 Você ainda não tem nenhum plano de estudo.' };
          } else {
            let msg = '📚 *Seus planos de estudo:*\n\n';
            for (const mat of materias) {
              const topicos = await lerTopicosDeMateria(remetente, mat);
              const total = topicos.length;
              const concluidos = topicos.filter(t => t.status === 'Concluído').length;
              msg += `*${mat}* – ${concluidos}/${total} tópicos concluídos\n`;
            }
            resultado = { sucesso: true, resposta: msg.trim() };
          }
          delete estadosEstudo[remetente];
          break;
        }

        case '3': {
          const materias = await lerMateriasPorUsuario(remetente);
          if (!materias || materias.length === 0) {
            resultado = { sucesso: true, resposta: '📭 Nenhuma matéria encontrada.' };
            delete estadosEstudo[remetente];
            break;
          }
          estado.materias = materias;
          estado.etapa = 'escolher_materia_concluir';
          let listaMat = '📖 Qual a matéria?\n\n';
          materias.forEach((m, i) => { listaMat += `${i + 1}. ${m}\n`; });
          resultado = { sucesso: true, resposta: listaMat.trim() };
          break;
        }

        case '4': {
          const materias = await lerMateriasPorUsuario(remetente);
          if (!materias || materias.length === 0) {
            resultado = { sucesso: true, resposta: '📭 Nenhuma matéria encontrada.' };
            delete estadosEstudo[remetente];
            break;
          }
          estado.materias = materias;
          estado.etapa = 'escolher_materia_progresso';
          let listaProg = '📊 Qual a matéria?\n\n';
          materias.forEach((m, i) => { listaProg += `${i + 1}. ${m}\n`; });
          resultado = { sucesso: true, resposta: listaProg.trim() };
          break;
        }

        default:
          resultado = { sucesso: false, resposta: '❌ Opção inválida. Digite 1, 2, 3 ou 4.' };
          break;
      }
      break;

    // ── Adicionar tópico ─────────────────────────────────────────────────────
    case 'pedir_materia_nova':
      estado.materia = texto;
      estado.etapa = 'pedir_topico';
      resultado = { sucesso: true, resposta: `✏️ Qual o tópico a estudar?\n(Ex: Closures, Funções de alta ordem)` };
      break;

    case 'pedir_topico':
      estado.topico = texto;
      estado.etapa = 'confirmar_adicionar';
      resultado = {
        sucesso: true,
        resposta: `Confirma?\n\n📖 *Matéria:* ${estado.materia}\n📝 *Tópico:* ${estado.topico}\n\nDigite *sim* ou *não*.`,
      };
      break;

    case 'confirmar_adicionar':
      if (tl === 'sim') {
        await adicionarEstudo({ usuario: remetente, materia: estado.materia, topico: estado.topico });
        resultado = { sucesso: true, resposta: `✅ Tópico *"${estado.topico}"* adicionado à matéria *"${estado.materia}"*!` };
      } else if (tl === 'não' || tl === 'nao') {
        resultado = { sucesso: true, resposta: '❌ Adição cancelada.' };
      } else {
        resultado = { sucesso: false, resposta: 'Resposta inválida. Digite *sim* ou *não*.' };
        break;
      }
      delete estadosEstudo[remetente];
      break;

    // ── Marcar concluído ─────────────────────────────────────────────────────
    case 'escolher_materia_concluir': {
      const idx = parseInt(tl) - 1;
      if (isNaN(idx) || idx < 0 || idx >= estado.materias.length) {
        resultado = { sucesso: false, resposta: `❌ Opção inválida. Digite um número de 1 a ${estado.materias.length}.` };
        break;
      }
      estado.materia = estado.materias[idx];
      const topicos = await lerTopicosDeMateria(remetente, estado.materia);
      const pendentes = topicos.filter(t => t.status !== 'Concluído');
      if (pendentes.length === 0) {
        resultado = { sucesso: true, resposta: `🎉 Todos os tópicos de *"${estado.materia}"* já estão concluídos!` };
        delete estadosEstudo[remetente];
        break;
      }
      estado.topicos = pendentes;
      estado.etapa = 'escolher_topico_concluir';
      let listaTop = `📝 Qual tópico de *${estado.materia}* concluir?\n\n`;
      pendentes.forEach(t => { listaTop += `${t.seq}. ${t.topico}\n`; });
      resultado = { sucesso: true, resposta: listaTop.trim() };
      break;
    }

    case 'escolher_topico_concluir': {
      const numSeq = parseInt(tl);
      const topico = estado.topicos.find(t => t.seq === numSeq);
      if (!topico) {
        resultado = { sucesso: false, resposta: '❌ Número inválido. Escolha um tópico da lista.' };
        break;
      }
      const ok = await marcarEstudoConcluido(topico.id);
      resultado = ok
        ? { sucesso: true, resposta: `✅ Tópico *"${topico.topico}"* marcado como concluído!` }
        : { sucesso: false, resposta: '⚠️ Não foi possível atualizar. Tente novamente.' };
      delete estadosEstudo[remetente];
      break;
    }

    // ── Ver progresso ────────────────────────────────────────────────────────
    case 'escolher_materia_progresso': {
      const idx = parseInt(tl) - 1;
      if (isNaN(idx) || idx < 0 || idx >= estado.materias.length) {
        resultado = { sucesso: false, resposta: `❌ Opção inválida. Digite um número de 1 a ${estado.materias.length}.` };
        break;
      }
      const materia = estado.materias[idx];
      const topicos = await lerTopicosDeMateria(remetente, materia);
      if (topicos.length === 0) {
        resultado = { sucesso: true, resposta: `📭 Nenhum tópico encontrado para *"${materia}"*.` };
        delete estadosEstudo[remetente];
        break;
      }
      const concluidos = topicos.filter(t => t.status === 'Concluído');
      const pendentes = topicos.filter(t => t.status !== 'Concluído');
      const pct = Math.round((concluidos.length / topicos.length) * 100);
      const barras = Math.round(pct / 10);
      const barra = '█'.repeat(barras) + '░'.repeat(10 - barras);

      let msg = `📊 *Progresso – ${materia}*\n\n${barra} ${pct}%\n${concluidos.length}/${topicos.length} tópicos concluídos\n`;
      if (pendentes.length > 0) {
        msg += `\n*Pendentes:*\n`;
        pendentes.forEach(t => { msg += `⬜ ${t.topico}\n`; });
      }
      if (concluidos.length > 0) {
        msg += `\n*Concluídos:*\n`;
        concluidos.forEach(t => { msg += `✅ ${t.topico}\n`; });
      }
      resultado = { sucesso: true, resposta: msg.trim() };
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
