import { sendMessage } from '../services/twilio.js';
import { agenteAgenda, estados } from './agenda_.js';
import { agenteTarefas, estadosTarefas } from './tarefas.js';

export async function handle(mensagem, remetente) {

  console.log("Handle iniciado com mensagem:", mensagem);

  const texto = mensagem?.toLowerCase().trim() || "";
  let resultado;

  // ===============================
  // 🗂 AGENTE DE TAREFAS
  // ===============================
  if (texto.includes("tarefa")) {

    // 🔄 sempre limpa qualquer fluxo anterior
    delete estadosTarefas[remetente];

    resultado = await agenteTarefas(mensagem, remetente);
  }
  else if (estadosTarefas[remetente]) {
    resultado = await agenteTarefas(mensagem, remetente);
  }

  // ===============================
  // 📅 AGENTE DE AGENDA
  // ===============================
  else if (
    estados[remetente] !== undefined ||
    texto.includes("agenda") ||
    texto.includes("reuni") ||
    texto.includes("compromisso") ||
    texto.includes("tenho") ||
    texto.includes("quais") ||
    texto.includes("cancelar") ||
    texto.includes("listar") ||
    texto.includes("@") ||
    texto.includes("agendar") ||
    texto.includes("criar") ||
    texto.includes("marcar")
  ) {
    resultado = await agenteAgenda(mensagem, remetente);
  }

  // ===============================
  // FALLBACK
  // ===============================
  else {
    resultado = {
      sucesso: true,
      resposta: "🤖 Estou funcionando! Mas esse tipo de solicitação ainda não foi implementado."
    };
  }

  await sendMessage(remetente, resultado.resposta);

  console.log(`[Orquestrador] Resposta enviada para ${remetente}: ${resultado.resposta}`);
}