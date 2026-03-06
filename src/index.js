import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { handle } from "./agents/orchestrator.js";
import { enviarResumoDiario } from "./services/resumoAgenda.js";
import { lembreteVencimentoAmanha, lembreteVencimentoHoje } from "./services/lembreteVencimento.js";
import { dispararLembretes } from "./services/dispararLembretes.js";
import { enviarCardapioDiario } from "./agents/cardapio.js";
import { enviarTarefasCasa } from "./agents/organizacaoCasa.js";
import { sendMessage } from "./services/twilio.js";

const app = express();
const PORT = process.env.PORT || 3000;
const DESTINATARIO = process.env.MEU_NUMERO_WHATSAPP;

app.use(express.urlencoded({ extended: false }));

app.post("/teste", (req, res) => {
  console.log("Teste chegou!");
  res.send("OK");
});

app.post("/webhook/whatsapp", (req, res) => {
  console.log("Mensagem recebida:");
  console.log(req.body);
  const mensagem = req.body?.Body;
  const remetente = req.body?.From;
  res.set("Content-Type", "text/xml");
  res.send("<Response></Response>");
  try {
    handle(mensagem, remetente);
  } catch (err) {
    console.error("Erro no handle:", err);
  }
});

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

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
