import { criarEventoNoCalendario, gerarLinkParaDia } from '../services/googleCalendar.js';
import { parse, format, isValid } from 'date-fns';

// Exporta o objeto de estados para o orquestrador
export const estados = {};

/**
 * Agente responsável pelo fluxo de gerenciamento da Agenda.
 */
export async function agenteAgenda(mensagem, remetente ) {
  const texto = mensagem.toLowerCase().trim();

  // --- Comando Global para Cancelar ---
  if (texto === "cancelar") {
    delete estados[remetente];
    return { sucesso: true, resposta: "Ok, fluxo da agenda cancelado." };
  }

  // --- Início do Fluxo ---
  if (!estados[remetente]) {
    estados[remetente] = { etapa: "menu" };
    return {
      sucesso: true,
      resposta: `🗓️ *Assistente de Agenda*

O que você gostaria de fazer?

1️⃣  Adicionar um novo compromisso
2️⃣  Editar os compromissos de um dia

A qualquer momento, digite *cancelar* para sair.`
    };
  }

  // --- Máquina de Estados da Conversa ---
  const estado = estados[remetente];
  let resultado;

  switch (estado.etapa) {

    // --- ETAPA: MENU PRINCIPAL ---
    case "menu":
      if (texto === "1") {
        estado.etapa = "pedir_titulo";
        resultado = { sucesso: true, resposta: "Qual o título do compromisso?" };
      } else if (texto === "2") {
        estado.etapa = "pedir_dia_edicao";
        resultado = { sucesso: true, resposta: "Qual dia você quer editar? (Ex: 25/12)" };
      } else {
        resultado = { sucesso: false, resposta: "❌ Opção inválida. Por favor, digite 1 ou 2." };
      }
      break;

    // --- FLUXO: ADICIONAR COMPROMISSO ---
    case "pedir_titulo":
      estado.titulo = mensagem; // Salva o título com maiúsculas/minúsculas originais
      estado.etapa = "pedir_data_hora";
      resultado = { sucesso: true, resposta: "Para qual dia e hora? (Ex: amanhã às 15:30, ou 25/12 às 10:00)" };
      break;

    case "pedir_data_hora":
      // (Esta parte é complexa, vamos simplificar por enquanto)
      // Simulação: vamos assumir que o evento é para agora.
      const agora = new Date();
      const daquiUmaHora = new Date(agora.getTime() + 60 * 60 * 1000);

      const novoEvento = await criarEventoNoCalendario({
        summary: estado.titulo,
        start: { dateTime: agora.toISOString(), timeZone: 'America/Sao_Paulo' },
        end: { dateTime: daquiUmaHora.toISOString(), timeZone: 'America/Sao_Paulo' },
      });

      // Salva o link correto no estado
      estado.linkDoEvento = novoEvento.htmlLink;
      estado.etapa = "confirmar_link";
      resultado = {
        sucesso: true,
        resposta: `✅ Evento "${estado.titulo}" criado com sucesso!

Deseja receber o link para editar e convidar participantes?

1️⃣ Sim
2️⃣ Não`
      };
      break;

    case "confirmar_link":
      if (texto === "1" || texto === "sim") {
        resultado = { sucesso: true, resposta: `🔗 Aqui está o link para editar seu evento:\n\n${estado.linkDoEvento}` };
      } else {
        resultado = { sucesso: true, resposta: "Ok, compromisso agendado!" };
      }
      delete estados[remetente]; // Finaliza o fluxo
      break;

    // --- FLUXO: EDITAR DIA ---
    case "pedir_dia_edicao":
      // Tenta entender a data que o usuário enviou (Ex: 25/12)
      const dataParseada = parse(texto, 'dd/MM', new Date());
      
      if (!isValid(dataParseada)) {
        resultado = { sucesso: false, resposta: "❌ Data inválida. Por favor, envie no formato dia/mês (Ex: 25/12)." };
      } else {
        const linkDoDia = gerarLinkParaDia(dataParseada);
        resultado = { sucesso: true, resposta: `🗓️ Aqui está o link para ver e editar todos os compromissos do dia ${format(dataParseada, 'dd/MM')}:\n\n${linkDoDia}` };
        delete estados[remetente]; // Finaliza o fluxo
      }
      break;

    // --- Fallback ---
    default:
      delete estados[remetente];
      resultado = { sucesso: false, resposta: "🤔 Algo deu errado. Vamos recomeçar. Digite *agenda*." };
      break;
  }

  return resultado;
}
