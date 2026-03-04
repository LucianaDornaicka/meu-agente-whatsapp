import {
  adicionarTarefa,
  listarTarefas,
  concluirTarefa,
  listarCategorias,
  listarPorCategoria
} from '../services/googleSheets.js';

export const estadosTarefas = {};

export async function agenteTarefas(mensagem, remetente) {

  const texto = mensagem.toLowerCase().trim();

  // 🔄 Reiniciar fluxo
  if (
    texto === "cancelar" ||
    texto === "menu" ||
    texto === "reiniciar" ||
    texto === "recomeçar"
  ) {
    delete estadosTarefas[remetente];

    return {
      sucesso: true,
      resposta: "🔄 Fluxo reiniciado. Digite *tarefa* para começar novamente."
    };
  }

  // ===============================
  // INICIAR MENU
  // ===============================
  if (texto.includes("tarefa") && !estadosTarefas[remetente]) {

    estadosTarefas[remetente] = { etapa: "menu" };

    return {
      sucesso: true,
      resposta:
`📋 Assistente de Tarefas

Digite o número da opção:

1️⃣ Criar tarefa
2️⃣ Ver suas tarefas
3️⃣ Ver quais categorias existem
4️⃣ Ver tarefas por categoria
0️⃣ Recomeçar`
    };
  }

  // ===============================
  // FLUXO CONVERSACIONAL
  // ===============================
  if (estadosTarefas[remetente]) {

    const estado = estadosTarefas[remetente];

    // ===============================
    // MENU
    // ===============================
    if (estado.etapa === "menu") {

      if (texto === "0") {
        delete estadosTarefas[remetente];
        return {
          sucesso: true,
          resposta: "🔄 Fluxo reiniciado. Digite *tarefa* para começar novamente."
        };
      }

      if (texto === "1") {
        estado.etapa = "categoria";
        return {
          sucesso: true,
          resposta: "📂 Qual a categoria da tarefa?"
        };
      }

      if (texto === "2") {

        delete estadosTarefas[remetente];

        const tarefas = await listarTarefas(remetente);

        if (!tarefas.length) {
          return {
            sucesso: true,
            resposta: "📭 Você não tem tarefas cadastradas."
          };
        }

        let resposta = "📋 Suas tarefas:\n\n";

        tarefas.forEach((tarefa, index) => {
          const status = tarefa.concluida ? "✅" : "⬜";
          resposta += `${index + 1}. ${status} [${tarefa.categoria}] ${tarefa.descricao}\n`;
        });

        return {
          sucesso: true,
          resposta
        };
      }

      if (texto === "3") {

        delete estadosTarefas[remetente];

        const categorias = await listarCategorias(remetente);

        if (!categorias.length) {
          return {
            sucesso: true,
            resposta: "📭 Você ainda não tem categorias."
          };
        }

        return {
          sucesso: true,
          resposta: "📂 Categorias existentes:\n\n" + categorias.join("\n")
        };
      }

      if (texto === "4") {
        estado.etapa = "categoriaConsulta";
        return {
          sucesso: true,
          resposta: "📂 Qual categoria deseja consultar?"
        };
      }

      return {
        sucesso: false,
        resposta: "❌ Digite apenas 1, 2, 3 ou 4."
      };
    }

    // ===============================
    // CONSULTAR POR CATEGORIA
    // ===============================
    if (estado.etapa === "categoriaConsulta") {

      delete estadosTarefas[remetente];

      const tarefas = await listarPorCategoria(remetente, texto);

      if (!tarefas.length) {
        return {
          sucesso: true,
          resposta: `📭 Nenhuma tarefa encontrada na categoria "${texto}".`
        };
      }

      let resposta = `📂 Tarefas da categoria "${texto}":\n\n`;

      tarefas.forEach(t => {
        const status =
          t[4] === "Executada" || t[4] === true || t[4] === "TRUE"
            ? "✅"
            : "⬜";

        resposta += `${status} ${t[3]}\n`;
      });

      return { sucesso: true, resposta };
    }

    // ===============================
    // CRIAR TAREFA
    // ===============================
    if (estado.etapa === "categoria") {
      estado.categoria = texto;
      estado.etapa = "descricao";

      return {
        sucesso: true,
        resposta: "📝 Qual a descrição da tarefa?"
      };
    }

    if (estado.etapa === "descricao") {

      await adicionarTarefa(remetente, estado.categoria, texto);

      delete estadosTarefas[remetente];

      return {
        sucesso: true,
        resposta: `✅ Tarefa adicionada na categoria "${estado.categoria}"`
      };
    }
  }

  // ===============================
  // CONCLUIR TAREFA
  // ===============================
  if (texto.includes("concluir")) {

    const match = texto.match(/\d+/);

    if (!match) {
      return {
        sucesso: false,
        resposta: "❌ Informe o número da tarefa. Ex: concluir 3"
      };
    }

    const id = match[0];

    const ok = await concluirTarefa(id);

    if (!ok) {
      return {
        sucesso: false,
        resposta: "❌ Tarefa não encontrada."
      };
    }

    return {
      sucesso: true,
      resposta: "✅ Tarefa marcada como Executada."
    };
  }

  return {
    sucesso: false,
    resposta: "❌ Não entendi o comando de tarefas."
  };
}