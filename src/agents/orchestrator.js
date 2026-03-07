import { sendMessage } from '../services/twilio.js';
import { agenteAgenda, estados as estadosAgenda } from './agenda_.js';
import { agenteTarefas, estados as estadosTarefas } from './tarefas.js';
import { agenteFinanceiro, estados as estadosFinanceiro } from './financeiro.js';
import { agenteLembretes, estados as estadosLembretes } from './lembretes.js';
import { agenteMedicos, estadosMedicos } from './medicos.js';
import { agenteIngles } from './ingles.js';
import { agenteCardapio, estadosCardapio } from './cardapio.js';
import { agenteCasa, estadosCasa } from './organizacaoCasa.js';
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
      for (const [r, e] of Object.entries(dados.medicos || {})) estadosMedicos[r] = e;
      for (const [r, e] of Object.entries(dados.cardapio || {})) estadosCardapio[r] = e;
      for (const [r, e] of Object.entries(dados.casa || {})) estadosCasa[r] = e;
    } catch {}
  }
}

function salvarEstados() {
  writeFileSync(STATE_FILE, JSON.stringify({
    tarefas: estadosTarefas,
    agenda: estadosAgenda,
    financeiro: estadosFinanceiro,
    lembretes: estadosLembretes,
    medicos: estadosMedicos,
    cardapio: estadosCardapio,
    casa: estadosCasa,
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
      delete estadosMedicos[remetente]; delete estadosCardapio[remetente];
      delete estadosCasa[remetente];
      salvarEstados();
      resultado = { sucesso: true, resposta: "✅ Fluxo cancelado.\n\nDigite:\n*tarefa* → tarefas\n*agenda* → agenda\n*$* → financeiro\n*lembrete* → lembretes\n*médico* → médicos\n*ing* → inglês\n*cardápio* → cardápio\n*casa* → organização casa" };
    }
    else if (estadosMedicos[remetente] || texto === "médico" || texto === "medico" || texto === "med" || texto === "médicos" || texto === "medicos") {
      resultado = await agenteMedicos(mensagem, remetente);
      salvarEstados();
    }
    else if (estadosCardapio[remetente] || texto === "cardápio" || texto === "cardapio") {
      resultado = await agenteCardapio(mensagem, remetente);
      salvarEstados();
    }
    else if (estadosCasa[remetente] || texto === "casa") {
      resultado = await agenteCasa(mensagem, remetente);
      salvarEstados();
    }
    else if (texto === "ing" || texto === "en" || texto === "inglês" || texto === "ingles") {
      resultado = await agenteIngles(mensagem, remetente);
    }
    else if (texto === "tarefa" || texto === "tarefas") {
      delete estadosAgenda[remetente]; delete estadosTarefas[remetente];
      delete estadosFinanceiro[remetente]; delete estadosLembretes[remetente];
      delete estadosMedicos[remetente]; delete estadosCardapio[remetente];
      delete estadosCasa[remetente];
      salvarEstados();
      resultado = await agenteTarefas(mensagem, remetente);
      salvarEstados();
    }
    else if (texto.includes("agenda")) {
      delete estadosAgenda[remetente]; delete estadosTarefas[remetente];
      delete estadosFinanceiro[remetente]; delete estadosLembretes[remetente];
      delete estadosMedicos[remetente]; delete estadosCardapio[remetente];
      delete estadosCasa[remetente];
      salvarEstados();
      resultado = await agenteAgenda(mensagem, remetente);
      salvarEstados();
    }
    else if (texto === "$") {
      delete estadosAgenda[remetente]; delete estadosTarefas[remetente];
      delete estadosFinanceiro[remetente]; delete estadosLembretes[remetente];
      delete estadosMedicos[remetente]; delete estadosCardapio[remetente];
      delete estadosCasa[remetente];
      salvarEstados();
      resultado = await agenteFinanceiro(mensagem, remetente);
      salvarEstados();
    }
    else if (texto === "lembrete" || texto === "lembretes") {
      delete estadosAgenda[remetente]; delete estadosTarefas[remetente];
      delete estadosFinanceiro[remetente]; delete estadosLembretes[remetente];
      delete estadosMedicos[remetente]; delete estadosCardapio[remetente];
      delete estadosCasa[remetente];
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
      resultado = { sucesso: false, resposta: `❌ Comando não reconhecido.\n\nDigite:\n*tarefa* → tarefas\n*agenda* → agenda\n*$* → financeiro\n*lembrete* → lembretes\n*médico* → médicos\n*ing* → inglês\n*cardápio* → cardápio\n*casa* → organização casa` };
    }
  } catch (erro) {
    console.error("Erro no orchestrator:", erro);
    resultado = { sucesso: false, resposta: "⚠️ Ocorreu um erro ao processar sua solicitação." };
  }

  if (resultado && resultado.resposta) {
    await sendMessage(remetente, resultado.resposta);
  }
}
