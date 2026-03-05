import { adicionarEventoNaAgenda, listarEventosDoDia } from '../services/googleCalendar.js';

// Objeto para gerenciar o estado da conversa para cada usuário
export const estados = {};

/**
 * Converte data e hora do formato brasileiro para o formato ISO 8601.
 * Ex: '12/03/2026' e '14:00' -> '2026-03-12T14:00:00-03:00'
 */
function converterParaISO(data, hora) {
  const [dia, mes, ano] = data.split('/');
  const [h, min] = hora.split(':');
  // Formato: YYYY-MM-DDTHH:mm:ss-03:00 (Fuso de São Paulo)
  return `${ano}-${mes}-${dia}T${h.padStart(2, '0')}:${min.padStart(2, '0')}:00-03:00`;
}

/**
 * Agente para gerenciar o fluxo de agendamento.
 */
export async function agenteAgenda(mensagem, remetente) {
  const texto = mensagem.trim(); // Não converter para minúsculas para pegar nomes/títulos
  const estado = estados[remetente];

  // --- Início do Fluxo ---
  if (!estado) {
    estados[remetente] = { etapa: "menu" };
    return {
      sucesso: true,
      resposta: `🗓️ *Assistente de Agenda*\n\nO que você gostaria de fazer?\n\n1️⃣  Adicionar um novo compromisso\n2️⃣  Ver os compromissos de um dia\n\nA qualquer momento, digite *0* para sair.`
    };
  }

  // --- Máquina de Estados ---
  let resultado;

  switch (estado.etapa) {
    case "menu":
      if (texto === "1") {
        estado.etapa = "pedir_data";
        resultado = { sucesso: true, resposta: "Qual a data do compromisso? (formato DD/MM/AAAA)" };
      } else if (texto === "2") {
        estado.etapa = "pedir_data_consulta";
        resultado = { sucesso: true, resposta: "Qual data você quer consultar? (formato DD/MM/AAAA)" };
      } else {
        resultado = { sucesso: false, resposta: "Opção inválida. Por favor, escolha 1 ou 2." };
      }
      break;

    // --- FLUXO DE CRIAÇÃO DE COMPROMISSO ---
    case "pedir_data":
      // Validação simples de data
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
        resultado = { sucesso: false, resposta: "Formato de data inválido. Por favor, use DD/MM/AAAA." };
        break;
      }
      estado.data = texto;
      estado.etapa = "pedir_hora_inicio";
      resultado = { sucesso: true, resposta: "Qual o horário de início? (formato HH:MM)" };
      break;

    case "pedir_hora_inicio":
      if (!/^\d{2}:\d{2}$/.test(texto)) {
        resultado = { sucesso: false, resposta: "Formato de hora inválido. Por favor, use HH:MM." };
        break;
      }
      estado.horaInicio = texto;
      estado.etapa = "pedir_hora_fim";
      resultado = { sucesso: true, resposta: "Qual o horário de término? (formato HH:MM)" };
      break;

    case "pedir_hora_fim":
      if (!/^\d{2}:\d{2}$/.test(texto)) {
        resultado = { sucesso: false, resposta: "Formato de hora inválido. Por favor, use HH:MM." };
        break;
      }
      estado.horaFim = texto;
      estado.etapa = "pedir_titulo";
      resultado = { sucesso: true, resposta: "Qual o título do compromisso?" };
      break;

    case "pedir_titulo":
      estado.titulo = texto;
      estado.etapa = "confirmar_criacao";
      resultado = {
        sucesso: true,
        resposta: `Confirma o agendamento?\n\n*Título:* ${estado.titulo}\n*Data:* ${estado.data}\n*Início:* ${estado.horaInicio}\n*Fim:* ${estado.horaFim}\n\nDigite *sim* para confirmar ou *não* para cancelar.`
      };
      break;

    case "confirmar_criacao":
      if (texto.toLowerCase() === 'sim') {
        try {
          await adicionarEventoNaAgenda({
            summary: estado.titulo,
            description: 'Criado pelo Assistente WhatsApp',
            startDateTime: converterParaISO(estado.data, estado.horaInicio),
            endDateTime: converterParaISO(estado.data, estado.horaFim),
          });
          resultado = { sucesso: true, resposta: `✅ Compromisso \"${estado.titulo}\" agendado com sucesso!` };
        } catch (error) {
          console.error("Erro ao criar evento no agente:", error);
          resultado = { sucesso: false, resposta: "Desculpe, não consegui criar o evento no Google Calendar. Tente novamente." };
        }
        delete estados[remetente];
      } else if (texto.toLowerCase() === 'não') {
        resultado = { sucesso: true, resposta: "Agendamento cancelado." };
        delete estados[remetente];
      } else {
        resultado = { sucesso: false, resposta: "Resposta inválida. Por favor, digite 'sim' ou 'não'." };
      }
      break;

    // --- FLUXO DE CONSULTA DE COMPROMISSO ---
    case "pedir_data_consulta": {
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
        resultado = { sucesso: false, resposta: "Formato de data inválido. Use DD/MM/AAAA." };
        break;
      }
      const [dia, mes, ano] = texto.split('/');
      const dataFormatada = `${ano}-${mes}-${dia}`;
      
      try {
        const eventos = await listarEventosDoDia(dataFormatada);
        if (eventos.length === 0) {
          resultado = { sucesso: true, resposta: `Nenhum evento encontrado para ${texto}.` };
        } else {
          let listaFormatada = `*Compromissos para ${texto}:*\n\n`;
          eventos.forEach(evento => {
            const inicio = new Date(evento.start.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            listaFormatada += `- ${inicio}: ${evento.summary}\n`;
          });
          resultado = { sucesso: true, resposta: listaFormatada };
        }
      } catch (error) {
        console.error("Erro ao buscar eventos no agente:", error);
        resultado = { sucesso: false, resposta: "Desculpe, não consegui consultar os eventos. Tente novamente." };
      }
      
      delete estados[remetente];
      break;
    }

    default:
      delete estados[remetente];
      resultado = { sucesso: false, resposta: "Ocorreu um erro, vamos recomeçar. Digite 'agenda'." };
      break;
  }

  return resultado;
}
