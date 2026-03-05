import { sendMessage } from '../services/twilio.js';
import { agenteAgenda, estados as estadosAgenda } from './agenda_.js';
import { agenteTarefas, estados as estadosTarefas } from './tarefas.js';
import { agenteFinanceiro, estados as estadosFinanceiro } from './financeiro.js';
import { agenteLembretes, estados as estadosLembretes } from './lembretes.js';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const STATE_FILE = '/tmp/bot_estados.json';

function carregarEstados() {
  if (existsSync(STATE_FILE)) {
    try {
      const dados = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
      for (const [r, e] of Object.entries(dados.tarefas || {})) estadosTarefas[r] = e;
      for (const [r, e] of Object.entries(dados.agenda || {})) estadosAgenda[r] = e;
      for (const [r, e] of Object.entries(dados.financeiro || {})) estadosFinanceiro[r] = e;
      for (const [r, e] of Object.entries(dados.lembretes || {})) estadosLembretes[r] = e;
    } catch {}
  }
}

function salvarEstados() {
  writeFileSync(STATE_FILE, JSON.stringify({
    tarefas: estadosTarefas,
    agenda: estadosAgenda,
    financeiro: estadosFinanceiro,
    lembretes: estadosLembretes,
  }), 'utf8');
}

carregarEstados();

export async function handle(mensagem, remetente) {
  carregarEstados();
  const texto = mensagem?.toLowerCase().trim() || "";
  let resultado;

  try {
    if (texto === "0" || texto === "cancelar") {
      delete estadosAgenda[remetente]; delete estadosTarefas[remetente];
      delete estadosFinanceiro[remetente]; delete estadosLembretes[remetente];
      salvarEstados();
      resultado = { sucesso: true, resposta: "✅ Fluxo cancelado.\n\nDigite:\n*tarefa* → tarefas\n*agenda* → agenda\n*$* → financeiro\n*lembrete* → lembretes" };
    }
    else if (texto === "tarefa" || texto === "tarefas") {
      delete estadosAgenda[remetente]; delete estadosTarefas[remetente];
      delete estadosFinanceiro[remetente]; delete estadosLembretes[remetente];
      salvarEstados();
      resultado = await agenteTarefas(mensagem, remetente);
      salvarEstados();
    }
    else if (texto.includes("agenda")) {
      delete estadosAgenda[remetente]; delete estadosTarefas[remetente];
      delete estadosFinanceiro[remetente]; delete estadosLembretes[remetente];
      salvarEstados();
      resultado = await agenteAgenda(mensagem, remetente);
      salvarEstados();
    }
    else if (texto === "$") {
      delete estadosAgenda[remetente]; delete estadosTarefas[remetente];
      delete estadosFinanceiro[remetente]; delete estadosLembretes[remetente];
      salvarEstados();
      resultado = await agenteFinanceiro(mensagem, remetente);
      salvarEstados();
    }
    else if (texto === "lembrete" || texto === "lembretes") {
      delete estadosAgenda[remetente]; delete estadosTarefas[remetente];
      delete estadosFinanceiro[remetente]; delete estadosLembretes[remetente];
      salvarEstados();
      resultado = await agenteLembretes(mensagem, remetente);
      salvarEstados();
    }
    else if (estadosTarefas[remetente]) {
      resultado = await agenteTarefas(mensagem, remetente); salvarEstados();
    }
    else if (estadosAgenda[remetente]) {
      resultado = await agenteAgenda(mensagem, remetente); salvarEstados();
    }
    else if (estadosFinanceiro[remetente]) {
      resultado = await agenteFinanceiro(mensagem, remetente); salvarEstados();
    }
    else if (estadosLembretes[remetente]) {
      resultado = await agenteLembretes(mensagem, remetente); salvarEstados();
    }
    else {
      resultado = { sucesso: false, resposta: `❌ Comando não reconhecido.\n\nDigite:\n*tarefa* → tarefas\n*agenda* → agenda\n*$* → financeiro\n*lembrete* → lembretes` };
    }
  } catch (erro) {
    console.error("Erro no orchestrator:", erro);
    resultado = { sucesso: false, resposta: "⚠️ Ocorreu um erro ao processar sua solicitação." };
  }

  if (resultado && resultado.resposta) {
    await sendMessage(remetente, resultado.resposta);
  }
}
