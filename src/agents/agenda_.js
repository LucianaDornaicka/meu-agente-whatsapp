import { criarEventoNoCalendario, gerarLinkParaDia } from '../services/googleCalendar.js';
import { parse, format, isValid } from 'date-fns';

// Exporta o objeto de estados para o orquestrador
export const estados = {};

/**
 * Agente responsável pelo fluxo de gerenciamento da Agenda.
 */
export async function agenteAgenda(mensagem, remetente) {
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
      resultado = { sucesso: true, resposta: "Para qual dia e hora? (Ex: 13/03 21:00 ou 13/03 21:00 às 23:00)" };
      break;

    case "pedir_data_hora":
      // Tentativa de extrair data e horários da mensagem do usuário
      // Versão melhorada que aceita "21:00" ou "21h00" ou "21h"
const matches = texto.match(/(\d{2}\/\d{2})\s*(\d{1,2})[h:](\d{2})?(?:\s*às\s*(\d{1,2})[h:]?(\d{2})?)?/);


      if (!matches) {
        resultado = { sucesso: false, resposta: "❌ Formato de data/hora não reconhecido. Tente '13/03 21:00' ou '13/03 21:00 às 23:00'." };
        break;
      }

      // Extrai os pedaços da data e hora da expressão regular
      const [, dataStr, inicioHoras, inicioMinutos = '00', fimHoras, fimMinutos = '00'] = matches;

      // Monta as strings de hora completas (ex: "21:00")
      const horaInicioStr = `${inicioHoras}:${inicioMinutos || '00'}`;
      const horaFimStr = fimHoras ? `${fimHoras}:${fimMinutos || '00'}` : null;

      // Valida a data (ex: 13/03)
      const dataBase = parse(dataStr, 'dd/MM', new Date());
      if (!isValid(dataBase)) {
        resultado = { sucesso: false, resposta: "❌ Data inválida. Use o formato dia/mês (Ex: 13/03)." };
        break;
      }

      // Cria o objeto Date completo para o início do evento
      const [hInicio, mInicio] = horaInicioStr.split(':');
      const dataHoraInicio = new Date(dataBase);
      dataHoraInicio.setHours(parseInt(hInicio), parseInt(mInicio), 0, 0);


            // Cria o objeto Date completo para o fim do evento
            let dataHoraFim;
            if (horaFimStr) {
              // Se o usuário especificou uma hora de fim (ex: ... às 22h)
              const [hFim, mFim] = horaFimStr.split(':');
              dataHoraFim = new Date(dataBase);
              dataHoraFim.setHours(parseInt(hFim), parseInt(mFim), 0, 0);
            } else {
              // Se não, o evento dura 1 hora por padrão
              dataHoraFim = new Date(dataHoraInicio.getTime() + 60 * 60 * 1000);
            }
      

      if (!isValid(dataHoraInicio) || !isValid(dataHoraFim) || dataHoraFim <= dataHoraInicio) {
          resultado = { sucesso: false, resposta: "❌ Hora inválida. Verifique os horários e tente novamente." };
          break;
      }

      try {
        const novoEvento = await criarEventoNoCalendario({
          summary: estado.titulo,
          start: { dateTime: dataHoraInicio.toISOString(), timeZone: 'America/Sao_Paulo' },
          end: { dateTime: dataHoraFim.toISOString(), timeZone: 'America/Sao_Paulo' },
        });

        estado.linkDoEvento = novoEvento.htmlLink;
        estado.etapa = "confirmar_link";
        resultado = {
          sucesso: true,
          resposta: `✅ Evento "${estado.titulo}" criado para ${format(dataHoraInicio, 'dd/MM/yyyy')} das ${format(dataHoraInicio, 'HH:mm')} às ${format(dataHoraFim, 'HH:mm')}.

Deseja receber o link para editar e convidar participantes?

1️⃣ Sim
2️⃣ Não`
        };
      } catch (err) {
        console.error("Erro ao tentar criar evento no Google:", err);
        resultado = { sucesso: false, resposta: "⚠️ Ocorreu um erro ao tentar agendar no Google Calendar. Tente novamente." };
        delete estados[remetente];
      }
      break;

    case "confirmar_link":
      if (texto === "1" || texto === "sim") {
        resultado = { sucesso: true, resposta: `🔗 Aqui está o link para editar seu evento:\n\n${estado.linkDoEvento}` };
      } else {
        resultado = { sucesso: true, resposta: "Ok, compromisso agendado!" };
      }
      delete estados[remetente];
      break;

    // --- FLUXO: EDITAR DIA ---
    case "pedir_dia_edicao":
      const dataParseada = parse(texto, 'dd/MM', new Date());
      
      if (!isValid(dataParseada)) {
        resultado = { sucesso: false, resposta: "❌ Data inválida. Por favor, envie no formato dia/mês (Ex: 25/12)." };
      } else {
        const linkDoDia = gerarLinkParaDia(dataParseada);
        resultado = { sucesso: true, resposta: `🗓️ Aqui está o link para ver e editar todos os compromissos do dia ${format(dataParseada, 'dd/MM')}:\n\n${linkDoDia}` };
        delete estados[remetente];
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
