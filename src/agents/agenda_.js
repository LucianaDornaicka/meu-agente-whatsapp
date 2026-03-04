import { criarEvento } from '../services/googleCalendar.js';

export const estados = {};

export async function agenteAgenda(mensagem, remetente) {

    console.log("[Agenda] Processando mensagem:", mensagem);
    console.log("ESTADOS ATUAIS:", estados); // 👈 ADICIONE AQUI
  
    try {

    const texto = mensagem.toLowerCase().trim();

    // ===============================
    // MENU
    // ===============================

    if (texto === "agenda") {

      estados[remetente] = { etapa: "menu" };

      return {
        sucesso: true,
        resposta:
`📅 Assistente de Agenda

Digite o número da opção:

1️⃣ Adicionar compromisso
2️⃣ Alterar compromisso
3️⃣ Excluir compromisso`
      };
    }

    // ===============================
    // FLUXO CONVERSACIONAL
    // ===============================

    if (estados[remetente]) {

      const estado = estados[remetente];

      // MENU OPÇÃO
      if (estado.etapa === "menu") {

        if (mensagem === "1") {
          estado.etapa = "dia";

          return {
            sucesso: true,
            resposta: "📅 Informe no formato DIA/MÊS. Ex: 13/03"
          };
        }

        delete estados[remetente];

        return {
          sucesso: false,
          resposta: "❌ Digite apenas 1, 2 ou 3."
        };
      }

      // DIA
      if (estado.etapa === "dia") {

        const match = texto.match(/^(\d{1,2})\/(\d{1,2})$/);

        if (!match) {
          return {
            sucesso: false,
            resposta: "❌ Informe no formato DIA/MÊS. Ex: 13/03"
          };
        }

        estado.dia = parseInt(match[1]);
        estado.mes = parseInt(match[2]) - 1;
        estado.etapa = "hora_inicio";

        return {
          sucesso: true,
          resposta: "⏰ Horário de início? (apenas hora, ex: 14)"
        };
      }

      // HORA INÍCIO
      if (estado.etapa === "hora_inicio") {

        estado.horaInicio = parseInt(texto);
        estado.etapa = "hora_fim";

        return {
          sucesso: true,
          resposta: "⏰ Horário de fim? (apenas hora)"
        };
      }

      // HORA FIM
      if (estado.etapa === "hora_fim") {

        estado.horaFim = parseInt(texto);
        estado.etapa = "titulo";

        return {
          sucesso: true,
          resposta: "📝 Qual o título do compromisso?"
        };
      }

      // TÍTULO (CRIA O EVENTO AQUI)
      if (estado.etapa === "titulo") {

        estado.titulo = mensagem;

        const ano = new Date().getFullYear();

        const inicio = new Date(
          ano,
          estado.mes,
          estado.dia,
          estado.horaInicio,
          0
        );

        const fim = new Date(
          ano,
          estado.mes,
          estado.dia,
          estado.horaFim,
          0
        );

        const eventoCriado = await criarEvento({
          summary: estado.titulo,
          description: "Criado via Assistente WhatsApp",
          startDateTime: inicio.toISOString(),
          endDateTime: fim.toISOString()
        });

        estado.eventoLink = eventoCriado.htmlLink;
        estado.etapa = "link";

        return {
          sucesso: true,
          resposta:
`✅ Evento "${estado.titulo}" criado com sucesso!

📎 Deseja receber o link para convidar participantes?

1️⃣ Sim
2️⃣ Não`
        };
      }

      // LINK
      if (estado.etapa === "link") {

        const link = estado.eventoLink;

        delete estados[remetente];

        if (mensagem === "1") {
          return {
            sucesso: true,
            resposta:
`🔗 Link para editar e convidar participantes:
${link}`
          };
        }

        return {
          sucesso: true,
          resposta: "✅ Perfeito! Seu evento já está na agenda."
        };
      }
    }

    return {
      sucesso: false,
      resposta: "❌ Não entendi o comando de agenda."
    };

  } catch (error) {

    console.error("[Agenda] Erro:", error);

    return {
      sucesso: false,
      resposta: "❌ Ocorreu um erro."
    };
  }
}