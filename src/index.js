import 'dotenv/config';
import express from 'express';
import { handle } from "./agents/orchestrator.js";

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

  // Responde imediatamente
  res.set("Content-Type", "text/xml");
  res.send("<Response></Response>");

  // Processa depois com proteção
  try {
    handle(mensagem, remetente);
  } catch (err) {
    console.error("Erro no handle:", err);
  }
});
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});