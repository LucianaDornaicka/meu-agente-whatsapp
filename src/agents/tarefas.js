import {
  adicionarTarefaNaPlanilha,
  lerTarefasDaPlanilha,
  lerCategoriasDaPlanilha,
  lerTarefasPorCategoria,
} from '../services/googleSheets.js';

// Exporta o objeto de estados para que o orquestrador possa gerenciá-lo.
// O nome "estadosTarefas" é crucial para o orquestrador diferenciar os fluxos.
export const estados = {}; // O orquestrador vai renomear para estadosTarefas

/**
 * Agente responsável por todo o fluxo de gerenciamento de tarefas.
 */
export async function agenteTarefas(mensagem, remetente) {
  const texto = mensagem.toLowerCase().trim();

  // O comando de sair "0" ou "cancelar" é tratado globalmente pelo orquestrador.
  // Não precisamos mais tratá-lo aqui.

  // --------------------------------------------------------------------------
  // 2. INÍCIO DO FLUXO
  // --------------------------------------------------------------------------

  // Se o usuário digita "tarefa" e não está em um fluxo, inicia o menu.
  if (!estados[remetente]) {
    estados[remetente] = { etapa: "menu" };
    return {
      sucesso: true,
      resposta: `📋 *Assistente de Tarefas*

Digite o número da opção desejada:

1️⃣  Criar nova tarefa
2️⃣  Ver todas as suas tarefas
3️⃣  Ver categorias existentes
4️⃣  Ver tarefas por categoria

A qualquer momento, digite *0* para sair.`
    };
  }

  // --------------------------------------------------------------------------
  // 3. MÁQUINA DE ESTADOS DA CONVERSA
  // --------------------------------------------------------------------------

  const estado = estados[remetente];
  let resultado;

  switch (estado.etapa) {

    // --- ETAPA: MENU PRINCIPAL ---
    case "menu":
      switch (texto) {
        case "1":
          estado.etapa = "pedir_categoria";
          resultado = { sucesso: true, resposta: "📂 Qual a categoria da tarefa? (Ex: Mercado, Trabalho)" };
          break;

        case "2": {
          const tarefas = await lerTarefasDaPlanilha();
          if (!tarefas || tarefas.length === 0) {
            resultado = { sucesso: true, resposta: "📭 Você ainda não tem nenhuma tarefa cadastrada." };
          } else {
            let listaFormatada = "📋 *Suas tarefas:*\n\n";
            tarefas.forEach((t, i) => {
              listaFormatada += `${i + 1}. [${t.categoria}] ${t.descricao}\n`;
            });
            resultado = { sucesso: true, resposta: listaFormatada };
          }
          delete estados[remetente]; // Finaliza o fluxo
          break;
        }

        case "3": {
          const categorias = await lerCategoriasDaPlanilha();
          if (!categorias || categorias.length === 0) {
            resultado = { sucesso: true, resposta: "📭 Nenhuma categoria encontrada." };
          } else {
            resultado = { sucesso: true, resposta: "📂 *Categorias existentes:*\n\n- " + categorias.join("\n- ") };
          }
          delete estados[remetente]; // Finaliza o fluxo
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

    // --- ETAPA: CRIAR TAREFA (CATEGORIA) ---
    case "pedir_categoria":
      estado.categoria = texto;
      estado.etapa = "pedir_descricao";
      resultado = { sucesso: true, resposta: "📝 Ótimo! Agora, qual a descrição da tarefa?" };
      break;

    // --- ETAPA: CRIAR TAREFA (DESCRIÇÃO) ---
    case "pedir_descricao":
      estado.descricao = texto;
      await adicionarTarefaNaPlanilha({
        categoria: estado.categoria,
        descricao: estado.descricao
      });
      resultado = { sucesso: true, resposta: `✅ Tarefa "${estado.descricao}" adicionada na categoria "${estado.categoria}".` };
      delete estados[remetente];
      break;

    // --- ETAPA: CONSULTAR TAREFA (CATEGORIA) ---
    case "pedir_categoria_consulta": {
      const categoriaConsultada = texto;
      const tarefas = await lerTarefasPorCategoria(categoriaConsultada);
      if (!tarefas || tarefas.length === 0) {
        resultado = { sucesso: true, resposta: `📭 Nenhuma tarefa encontrada na categoria "${categoriaConsultada}".` };
      } else {
        let listaFormatada = `📂 *Tarefas da categoria "${categoriaConsultada}":*\n\n`;
        tarefas.forEach((t, i) => {
          listaFormatada += `${i + 1}. ${t.descricao}\n`;
        });
        resultado = { sucesso: true, resposta: listaFormatada };
      }
      delete estados[remetente];
      break;
    }

    // --- ETAPA PADRÃO (Fallback) ---
    default:
      delete estados[remetente];
      resultado = { sucesso: false, resposta: "🤔 Ocorreu um erro no fluxo. Vamos recomeçar. Digite *tarefa*." };
      break;
  }

  return resultado;
}
