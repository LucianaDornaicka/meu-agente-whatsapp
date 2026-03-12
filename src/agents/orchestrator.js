import { sendMessage } from '../services/twilio.js';
import { agenteAgenda, estados as estadosAgenda } from './agenda_.js';
import { agenteTarefas, estados as estadosTarefas } from './tarefas.js';
import { agenteFinanceiro, estados as estadosFinanceiro } from './financeiro.js';
import { agenteLembretes, estados as estadosLembretes } from './lembretes.js';
import { agenteMedicos, estadosMedicos } from './medicos.js';
import { agenteIngles } from './ingles.js';
import { agenteCardapio, estadosCardapio } from './cardapio.js';
import { agenteCasa, estadosCasa } from './organizacaoCasa.js';
import { agenteEstudo, estadosEstudo } from './estudo.js';
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
      for (const [r, e] of Object.entries(dados.estudo || {})) estadosEstudo[r] = e;
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
    estudo: estadosEstudo,
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
      delete estadosCasa[remetente]; delete estadosEstudo[remetente];
      salvarEstados();
      resultado = { sucesso: true, resposta: "✅ Fluxo cancelado.\n\nDigite o nome ou a letra:\n*agenda* / *A* → agenda\n*cardápio* / *B* → cardápio\n*casa* / *C* → casa\n*estudo* / *D* → estudos bíblicos\n*$* / *E* → financeiro\n*ing* / *F* → inglês\n*lembrete* / *G* → lembretes\n*médico* / *H* → médicos\n*tarefa* / *I* → tarefas" };
    }
    else if (estadosMedicos[remetente] || texto === "médico" || texto === "medico" || texto === "med" || texto === "médicos" || texto === "medicos" || texto === "h") {
      resultado = await agenteMedicos(mensagem, remetente);
      salvarEstados();
    }
    else if (estadosCardapio[remetente] || texto === "cardápio" || texto === "cardapio" || texto === "b") {
      resultado = await agenteCardapio(mensagem, remetente);
      salvarEstados();
    }
    else if (estadosCasa[remetente] || texto === "casa" || texto === "c") {
      resultado = await agenteCasa(mensagem, remetente);
      salvarEstados();
    }
    else if (estadosEstudo[remetente] || texto === "estudo" || texto === "estudos" || texto === "d") {
      resultado = await agenteEstudo(mensagem, remetente);
      salvarEstados();
    }
    else if (texto === "ing" || texto === "en" || texto === "inglês" || texto === "ingles" || texto === "f") {
      resultado = await agenteIngles(mensagem, remetente);
    }
    else if (texto === "tarefa" || texto === "tarefas" || texto === "i") {
      delete estadosAgenda[remetente]; delete estadosTarefas[remetente];
      delete estadosFinanceiro[remetente]; delete estadosLembretes[remetente];
      delete estadosMedicos[remetente]; delete estadosCardapio[remetente];
      delete estadosCasa[remetente]; delete estadosEstudo[remetente];
      salvarEstados();
      resultado = await agenteTarefas(mensagem, remetente);
      salvarEstados();
    }
    else if (texto.includes("agenda") || texto === "a") {
      delete estadosAgenda[remetente]; delete estadosTarefas[remetente];
      delete estadosFinanceiro[remetente]; delete estadosLembretes[remetente];
      delete estadosMedicos[remetente]; delete estadosCardapio[remetente];
      delete estadosCasa[remetente]; delete estadosEstudo[remetente];
      salvarEstados();
      resultado = await agenteAgenda(mensagem, remetente);
      salvarEstados();
    }
    else if (texto === "$" || texto === "e") {
      delete estadosAgenda[remetente]; delete estadosTarefas[remetente];
      delete estadosFinanceiro[remetente]; delete estadosLembretes[remetente];
      delete estadosMedicos[remetente]; delete estadosCardapio[remetente];
      delete estadosCasa[remetente]; delete estadosEstudo[remetente];
      salvarEstados();
      resultado = await agenteFinanceiro(mensagem, remetente);
      salvarEstados();
    }
    else if (texto === "lembrete" || texto === "lembretes" || texto === "g") {
      delete estadosAgenda[remetente]; delete estadosTarefas[remetente];
      delete estadosFinanceiro[remetente]; delete estadosLembretes[remetente];
      delete estadosMedicos[remetente]; delete estadosCardapio[remetente];
      delete estadosCasa[remetente]; delete estadosEstudo[remetente];
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
      resultado = { sucesso: false, resposta: `❌ Comando não reconhecido.\n\nDigite o nome ou a letra:\n*agenda* / *A* → agenda\n*cardápio* / *B* → cardápio\n*casa* / *C* → casa\n*estudo* / *D* → estudos bíblicos\n*$* / *E* → financeiro\n*ing* / *F* → inglês\n*lembrete* / *G* → lembretes\n*médico* / *H* → médicos\n*tarefa* / *I* → tarefas` };
    }
  } catch (erro) {
    console.error("Erro no orchestrator:", erro);
    resultado = { sucesso: false, resposta: "⚠️ Ocorreu um erro ao processar sua solicitação." };
  }

  if (resultado && resultado.resposta) {
    await sendMessage(remetente, resultado.resposta);
  }
}
