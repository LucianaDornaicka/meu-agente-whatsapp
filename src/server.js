import express from "express";
import { handle } from "./agents/orchestrator.js";

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Teste no navegador
app.get("/", (req, res) => {
  res.send("Servidor funcionando 🚀");
});

// Webhook do WhatsApp
app.post("/webhook/whatsapp", async (req, res) => {

  console.log("Mensagem recebida:");
  console.log(req.body);

  const mensagem = req.body.Body;
  const remetente = req.body.From;

  if (mensagem && remetente) {
    await handle(mensagem, remetente);
  }

  res.send("OK");
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});