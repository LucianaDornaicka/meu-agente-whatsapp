import { sendMessage } from '../services/twilio.js';
import { agenteAgenda, estados as estadosAgenda } from './agenda_.js';
import { agenteTarefas, estados as estadosTarefas } from './tarefas.js';

// Objeto para manter o estado de cada remetente
export const estados = {};

export async function handle(mensagem, remetente) {
  const texto = mensagem?.toLowerCase().trim() || "";
  let resultado;

  try {
    // ===============================
    // COMANDO GLOBAL: REINICIAR
    // ===============================
    if (texto === "tarefa" || texto === "tarefas") {
      delete estadosTarefas[remetente];
      delete estadosAgenda[remetente]; // Garante que saia de qualquer fluxo
      resultado = await agenteTarefas(mensagem, remetente);
    }
    // ===============================
    // INICIAR AGENDA
    // ===============================
    else if (texto.includes("agenda")) {
        delete estadosTarefas[remetente];
        delete estadosAgenda[remetente];
        resultado = await agenteAgenda(mensagem, remetente);
    }
    // ===============================
    // FLUXO ATIVO: TAREFAS
    // ===============================
    else if (estadosTarefas[remetente]) {
      resultado = await agenteTarefas(mensagem, remetente);
    }
    // ===============================
    // FLUXO ATIVO: AGENDA
    // ===============================
    else if (estadosAgenda[remetente]) {
      resultado = await agenteAgenda(mensagem, remetente);
    }
    // ===============================
    // COMANDO DESCONHECIDO
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
