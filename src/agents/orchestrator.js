import { sendMessage } from '../services/twilio.js';
// Importa os agentes e seus respectivos objetos de estado
import { agenteAgenda, estados as estadosAgenda } from './agenda_.js';
import { agenteTarefas, estados as estadosTarefas } from './tarefas.js';

export async function handle(mensagem, remetente) {
  const texto = mensagem?.toLowerCase().trim() || "";
  let resultado;

  try {
    // ===============================
    // 1. COMANDO GLOBAL "SAIR" (PRIORIDADE MÁXIMA)
    // ===============================
    if (texto === "0" || texto === "cancelar") {
      delete estadosAgenda[remetente];
      delete estadosTarefas[remetente];
      resultado = { sucesso: true, resposta: "✅ Ok, fluxo cancelado. Digite *tarefa* ou *agenda* para começar." };
    }
    // ===============================
    // 2. INICIAR/REINICIAR FLUXOS
    // ===============================
    else if (texto === "tarefa" || texto === "tarefas") {
      // Limpa ambos os estados para garantir um início limpo
      delete estadosAgenda[remetente];
      delete estadosTarefas[remetente];
      resultado = await agenteTarefas(mensagem, remetente);
    }
    else if (texto.includes("agenda")) {
      // Limpa ambos os estados para garantir um início limpo
      delete estadosAgenda[remetente];
      delete estadosTarefas[remetente];
      resultado = await agenteAgenda(mensagem, remetente);
    }
    // ===============================
    // 3. CONTINUAR FLUXOS ATIVOS
    // ===============================
    else if (estadosTarefas[remetente]) {
      resultado = await agenteTarefas(mensagem, remetente);
    }
    else if (estadosAgenda[remetente]) {
      resultado = await agenteAgenda(mensagem, remetente);
    }
    // ===============================
    // 4. COMANDO DESCONHECIDO (NENHUM FLUXO ATIVO)
    // ===============================
    else {
      resultado = {
        sucesso: false,
        resposta: `❌ Comando não reconhecido.

Digite:
*tarefa* → para abrir tarefas
*agenda* → para ver compromissos`
      };
    }
  } catch (erro) {
    console.error("Erro no orchestrator:", erro);
    resultado = {
      sucesso: false,
      resposta: "⚠️ Ocorreu um erro ao processar sua solicitação."
    };
  }

  // Envia a resposta apenas se houver uma.
  if (resultado && resultado.resposta) {
    await sendMessage(remetente, resultado.resposta);
  }
}
