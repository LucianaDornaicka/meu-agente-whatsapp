import { sendMessage } from '../services/twilio.js';
import { agenteAgenda, estados as estadosAgenda } from './agenda_.js';
import { agenteTarefas, estados as estadosTarefas } from './tarefas.js';
import { agenteFinanceiro, estados as estadosFinanceiro } from './financeiro.js';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const STATE_FILE = '/tmp/bot_estados.json';

function carregarEstados() {
  if (existsSync(STATE_FILE)) {
    try {
      const dados = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
      for (const [remetente, estado] of Object.entries(dados.tarefas || {})) {
        estadosTarefas[remetente] = estado;
      }
      for (const [remetente, estado] of Object.entries(dados.agenda || {})) {
        estadosAgenda[remetente] = estado;
      }
      for (const [remetente, estado] of Object.entries(dados.financeiro || {})) {
        estadosFinanceiro[remetente] = estado;
      }
    } catch {}
  }
}

function salvarEstados() {
  writeFileSync(STATE_FILE, JSON.stringify({
    tarefas: estadosTarefas,
    agenda: estadosAgenda,
    financeiro: estadosFinanceiro,
  }), 'utf8');
}

carregarEstados();

export async function handle(mensagem, remetente) {
  carregarEstados();
  const texto = mensagem?.toLowerCase().trim() || "";
  let resultado;

  try {
    if (texto === "0" || texto === "cancelar") {
      delete estadosAgenda[remetente];
      delete estadosTarefas[remetente];
      delete estadosFinanceiro[remetente];
      salvarEstados();
      resultado = { sucesso: true, resposta: "✅ Ok, fluxo cancelado. Digite *tarefa*, *agenda* ou *$* para começar." };
    }
    else if (texto === "tarefa" || texto === "tarefas") {
      delete estadosAgenda[remetente];
      delete estadosTarefas[remetente];
      delete estadosFinanceiro[remetente];
      salvarEstados();
      resultado = await agenteTarefas(mensagem, remetente);
      salvarEstados();
    }
    else if (texto.includes("agenda")) {
      delete estadosAgenda[remetente];
      delete estadosTarefas[remetente];
      delete estadosFinanceiro[remetente];
      salvarEstados();
      resultado = await agenteAgenda(mensagem, remetente);
      salvarEstados();
    }
    else if (texto === "$") {
      delete estadosAgenda[remetente];
      delete estadosTarefas[remetente];
      delete estadosFinanceiro[remetente];
      salvarEstados();
      resultado = await agenteFinanceiro(mensagem, remetente);
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
    else if (estadosFinanceiro[remetente]) {
      resultado = await agenteFinanceiro(mensagem, remetente);
      salvarEstados();
    }
    else {
      resultado = {
        sucesso: false,
        resposta: `❌ Comando não reconhecido.\n\nDigite:\n*tarefa* → tarefas\n*agenda* → compromissos\n*$* → financeiro`
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
