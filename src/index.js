import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { handle } from "./agents/orchestrator.js";
import { verificarVencimentos } from "./services/lembreteVencimento.js";

const app = express();
const PORT = process.env.PORT || 3000;

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

// Cron: verifica vencimentos todo dia às 9h (horário de Brasília = 12h UTC)
function agendarLembretes() {
  const agora = new Date();
  const proximaExecucao = new Date();
  proximaExecucao.setUTCHours(12, 0, 0, 0);
  if (proximaExecucao <= agora) {
    proximaExecucao.setDate(proximaExecucao.getDate() + 1);
  }
  const msAteProxima = proximaExecucao - agora;
  console.log(`Próximo lembrete de vencimento em ${Math.round(msAteProxima / 60000)} minutos.`);
  setTimeout(() => {
    verificarVencimentos();
    setInterval(verificarVencimentos, 24 * 60 * 60 * 1000);
  }, msAteProxima);
}

agendarLembretes();

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
