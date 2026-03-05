import { sendMessage } from '../services/twilio.js';
import { agenteAgenda, estados as estadosAgenda } from './agenda_.js';
import { agenteTarefas, estados as estadosTarefas } from './tarefas.js';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const STATE_FILE = '/tmp/bot_estados.json';

function carregarEstados( ) {
  if (existsSync(STATE_FILE)) {
    try {
      const dados = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
      // Restaura os estados nos agentes
      for (const [remetente, estado] of Object.entries(dados.tarefas || {})) {
        estadosTarefas[remetente] = estado;
      }
      for (const [remetente, estado] of Object.entries(dados.agenda || {})) {
        estadosAgenda[remetente] = estado;
      }
    } catch {}
  }
}

function salvarEstados() {
  writeFileSync(STATE_FILE, JSON.stringify({
    tarefas: estadosTarefas,
    agenda: estadosAgenda
  }), 'utf8');
}

// Carrega estados ao iniciar
carregarEstados();

export async function handle(mensagem, remetente) {
  // Recarrega estados a cada mensagem (garante consistência)
  carregarEstados();

  const texto = mensagem?.toLowerCase().trim() || "";
  let resultado;

  try {
    if (texto === "0" || texto === "cancelar") {
      delete estadosAgenda[remetente];
      delete estadosTarefas[remetente];
      salvarEstados();
      resultado = { sucesso: true, resposta: "✅ Ok, fluxo cancelado. Digite *tarefa* ou *agenda* para começar." };
    }
    else if (texto === "tarefa" || texto === "tarefas") {
      delete estadosAgenda[remetente];
      delete estadosTarefas[remetente];
      salvarEstados();
      resultado = await agenteTarefas(mensagem, remetente);
      salvarEstados();
    }
    else if (texto.includes("agenda")) {
      delete estadosAgenda[remetente];
      delete estadosTarefas[remetente];
      salvarEstados();
      resultado = await agenteAgenda(mensagem, remetente);
      salvarEstados();
    }
    else if (estadosTarefas[remetente]) {
      resultado = await agenteTarefas(mensagem, remetente);
      salvarEstados();
    }
    else if (estadosAgenda[remetente]) {
      resultado = await agenteAgenda(mensagem, remetente);
      salvarEstados();
    }
    else {
      resultado = {
        sucesso: false,
        resposta: `❌ Comando não reconhecido.\n\nDigite:\n*tarefa* → para abrir tarefas\n*agenda* → para ver compromissos`
      };
    }
  } catch (erro) {
    console.error("Erro no orchestrator:", erro);
    resultado = { sucesso: false, resposta: "⚠️ Ocorreu um erro ao processar sua solicitação." };
  }

  if (resultado && resultado.resposta) {
    await sendMessage(remetente, resultado.resposta);
  }
}
