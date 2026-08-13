import dotenv from 'dotenv';
dotenv.config();

import './server.js';

import { enviarResumoDiario } from "./services/resumoAgenda.js";
import { lembreteVencimentoAmanha, lembreteVencimentoHoje } from "./services/lembreteVencimento.js";
import { dispararLembretes } from "./services/dispararLembretes.js";
import { enviarCardapioDiario } from "./agents/cardapio.js";
import { enviarTarefasCasa } from "./agents/organizacaoCasa.js";
import { sendMessage } from "./services/twilio.js";
import { resetarGastosMensal } from "./services/googleControleGastos.js";

const DESTINATARIO = process.env.MEU_NUMERO_WHATSAPP;

function agendarDiario(horaBrasiliaH, minutos, callback, nome) {
  const horaUTC = horaBrasiliaH + 3;
  function calcularMs() {
    const agora = new Date();
    const proxima = new Date();
    proxima.setUTCHours(horaUTC, minutos, 0, 0);
    if (proxima <= agora) proxima.setDate(proxima.getDate() + 1);
    return proxima - agora;
  }
  const ms = calcularMs();
  console.log(`[${nome}] Próxima execução em ${Math.round(ms / 60000)} min.`);
  setTimeout(() => {
    callback();
    setInterval(callback, 24 * 60 * 60 * 1000);
  }, ms);
}

// Agenda uma execução mensal (todo dia `diaDoMes`, num horário fixo de Brasília).
// Recalcula o próximo disparo a cada execução, pois os meses têm durações diferentes.
function agendarMensal(diaDoMes, horaBrasiliaH, minutos, callback, nome) {
  const horaUTC = horaBrasiliaH + 3;
  function calcularMs() {
    const agora = new Date();
    const proxima = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), diaDoMes, horaUTC, minutos, 0, 0));
    if (proxima <= agora) proxima.setUTCMonth(proxima.getUTCMonth() + 1);
    return proxima - agora;
  }
  function agendarProxima() {
    const ms = calcularMs();
    console.log(`[${nome}] Próxima execução em ${Math.round(ms / 60000)} min.`);
    setTimeout(() => {
      callback();
      agendarProxima();
    }, ms);
  }
  agendarProxima();
}

// Resumo diário de agenda: 21h Brasília
agendarDiario(21, 0, enviarResumoDiario, 'Resumo Agenda');

// Lembrete financeiro (dia anterior): 20h Brasília
agendarDiario(20, 0, lembreteVencimentoAmanha, 'Vencimento Amanhã');

// Lembrete financeiro (reforço no dia): 20h Brasília
agendarDiario(20, 0, lembreteVencimentoHoje, 'Vencimento Hoje');

// Cardápio do dia seguinte: 21h Brasília
agendarDiario(21, 0, () => enviarCardapioDiario(sendMessage, DESTINATARIO), 'Cardápio Diário');

// Tarefas de casa do dia seguinte: 21h Brasília
agendarDiario(21, 0, () => enviarTarefasCasa(sendMessage, DESTINATARIO), 'Tarefas Casa');

// Disparador de lembretes personalizados: a cada 5 minutos
setInterval(dispararLembretes, 5 * 60 * 1000);
setTimeout(dispararLembretes, 30 * 1000);

// Reinício mensal do Controle de Gastos: todo dia 1º, 00h05 Brasília
agendarMensal(1, 0, 5, () => {
  resetarGastosMensal().catch(erro => console.error('Erro ao reiniciar Controle de Gastos:', erro));
}, 'Reset Controle de Gastos');
