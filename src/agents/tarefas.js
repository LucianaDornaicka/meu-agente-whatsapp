import {
  adicionarTarefaNaPlanilha,
  lerTarefasDaPlanilha,
  lerCategoriasDaPlanilha,
  lerTarefasPorCategoria,
} from '../services/googleSheets.js';

export const estados = {};

export async function agenteTarefas(mensagem, remetente) {
  const texto = mensagem.toLowerCase().trim();

  if (!estados[remetente]) {
    estados[remetente] = { etapa: "menu" };
    return {
      sucesso: true,
      resposta: `📋 *Assistente de Tarefas*\n\nDigite o número da opção desejada:\n\n1️⃣  Criar nova tarefa\n2️⃣  Ver todas as suas tarefas\n3️⃣  Ver categorias existentes\n4️⃣  Ver tarefas por categoria\n\nA qualquer momento, digite *0* para sair.`
    };
  }

  const estado = estados[remetente];
  let resultado;

  switch (estado.etapa) {
    case "menu":
      switch (texto) {
        case "1":
          estado.etapa = "pedir_categoria";
          resultado = { sucesso: true, resposta: "📂 Qual a categoria da tarefa? (Ex: Mercado, Trabalho)" };
          break;
        case "2": {
          const tarefas = await lerTarefasDaPlanilha(remetente);
          if (!tarefas || tarefas.length === 0) {
            resultado = { sucesso: true, resposta: "📭 Você ainda não tem nenhuma tarefa cadastrada." };
          } else {
            let listaFormatada = "📋 *Suas tarefas:*\n\n";
            tarefas.forEach((t, i) => { listaFormatada += `${i + 1}. [${t.categoria}] ${t.descricao}\n`; });
            resultado = { sucesso: true, resposta: listaFormatada };
          }
          delete estados[remetente];
          break;
        }
        case "3": {
          const categorias = await lerCategoriasDaPlanilha(remetente);
          if (!categorias || categorias.length === 0) {
            resultado = { sucesso: true, resposta: "📭 Nenhuma categoria encontrada." };
          } else {
            resultado = { sucesso: true, resposta: "📂 *Categorias existentes:*\n\n- " + categorias.join("\n- ") };
          }
          delete estados[remetente];
          break;
        }
        case "4":
          estado.etapa = "pedir_categoria_consulta";
          resultado = { sucesso: true, resposta: "📂 Qual categoria você deseja consultar?" };
          break;
        default:
          resultado = { sucesso: false, resposta: "❌ Opção inválida. Por favor, digite apenas o número de 1 a 4." };
          break;
      }
      break;

    case "pedir_categoria":
      estado.categoria = texto;
      estado.etapa = "pedir_descricao";
      resultado = { sucesso: true, resposta: "📝 Ótimo! Agora, qual a descrição da tarefa?" };
      break;

    case "pedir_descricao":
      estado.descricao = texto;
      await adicionarTarefaNaPlanilha({
        usuario: remetente,
        categoria: estado.categoria,
        descricao: estado.descricao
      });
      resultado = { sucesso: true, resposta: `✅ Tarefa "${estado.descricao}" adicionada na categoria "${estado.categoria}".` };
      delete estados[remetente];
      break;

    case "pedir_categoria_consulta": {
      const categoriaConsultada = texto;
      const tarefas = await lerTarefasPorCategoria(remetente, categoriaConsultada);
      if (!tarefas || tarefas.length === 0) {
        resultado = { sucesso: true, resposta: `📭 Nenhuma tarefa encontrada na categoria "${categoriaConsultada}".` };
      } else {
        let listaFormatada = `📂 *Tarefas da categoria "${categoriaConsultada}":*\n\n`;
        tarefas.forEach((t, i) => { listaFormatada += `${i + 1}. ${t.descricao}\n`; });
        resultado = { sucesso: true, resposta: listaFormatada };
      }
      delete estados[remetente];
      break;
    }

    default:
      delete estados[remetente];
      resultado = { sucesso: false, resposta: "🤔 Ocorreu um erro no fluxo. Vamos recomeçar. Digite *tarefa*." };
      break;
  }

  return resultado;
}
