import { adicionarEventoNaAgenda, listarEventosDoDia } from '../services/googleCalendar.js';

export const estados = {};

function converterParaISO(data, hora) {
  const [dia, mes, ano] = data.split('/');
  const [h, min] = hora.split(':');
  return `${ano}-${mes}-${dia}T${h.padStart(2, '0')}:${min.padStart(2, '0')}:00-03:00`;
}

export async function agenteAgenda(mensagem, remetente) {
  const texto = mensagem.trim();
  const estado = estados[remetente];

  if (!estado) {
    estados[remetente] = { etapa: "menu" };
    return {
      sucesso: true,
      resposta: `🗓️ *Assistente de Agenda*\n\nO que você gostaria de fazer?\n\n1️⃣  Adicionar um novo compromisso\n2️⃣  Ver os compromissos de um dia\n3️⃣  Abrir a agenda de um dia para editar\n\nA qualquer momento, digite *0* para sair.`
    };
  }

  let resultado;

  switch (estado.etapa) {
    case "menu":
      if (texto === "1") {
        estado.etapa = "pedir_data";
        resultado = { sucesso: true, resposta: "Qual a data do compromisso? (formato DD/MM/AAAA)" };
      } else if (texto === "2") {
        estado.etapa = "pedir_data_consulta";
        resultado = { sucesso: true, resposta: "Qual data você quer consultar? (formato DD/MM/AAAA)" };
      } else if (texto === "3") {
        estado.etapa = "pedir_data_link";
        resultado = { sucesso: true, resposta: "Qual data você quer abrir? (formato DD/MM/AAAA)" };
      } else {
        resultado = { sucesso: false, resposta: "Opção inválida. Por favor, escolha 1, 2 ou 3." };
      }
      break;

    case "pedir_data":
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
          const [d, m, a] = estado.data.split('/');
          const link = `https://calendar.google.com/calendar/r/day/${a}/${m}/${d}`;
          resultado = { sucesso: true, resposta: `✅ Compromisso "${estado.titulo}" agendado!\n\n🔗 Abra para editar: ${link}` };
        } catch (error ) {
          console.error("Erro ao criar evento no agente:", error);
          resultado = { sucesso: false, resposta: "Desculpe, não consegui criar o evento. Tente novamente." };
        }
        delete estados[remetente];
      } else if (texto.toLowerCase() === 'não') {
        resultado = { sucesso: true, resposta: "Agendamento cancelado." };
        delete estados[remetente];
      } else {
        resultado = { sucesso: false, resposta: "Resposta inválida. Digite 'sim' ou 'não'." };
      }
      break;

    case "pedir_data_consulta": {
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
        resultado = { sucesso: false, resposta: "Formato de data inválido. Use DD/MM/AAAA." };
        break;
      }
      const [dia2, mes2, ano2] = texto.split('/');
      const dataFormatada2 = `${ano2}-${mes2}-${dia2}`;
      const link2 = `https://calendar.google.com/calendar/r/day/${ano2}/${mes2}/${dia2}`;
      try {
        const eventos = await listarEventosDoDia(dataFormatada2 );
        if (eventos.length === 0) {
          resultado = { sucesso: true, resposta: `Nenhum evento encontrado para ${texto}.\n\n🔗 Abra sua agenda: ${link2}` };
        } else {
          let lista = `*Compromissos para ${texto}:*\n\n`;
          eventos.forEach(evento => {
            const inicio = new Date(evento.start.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            lista += `- ${inicio}: ${evento.summary}\n`;
          });
          lista += `\n🔗 Abra para editar: ${link2}`;
          resultado = { sucesso: true, resposta: lista };
        }
      } catch (error) {
        console.error("Erro ao buscar eventos:", error);
        resultado = { sucesso: false, resposta: "Não consegui consultar os eventos. Tente novamente." };
      }
      delete estados[remetente];
      break;
    }

    case "pedir_data_link": {
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
        resultado = { sucesso: false, resposta: "Formato de data inválido. Use DD/MM/AAAA." };
        break;
      }
      const [dia3, mes3, ano3] = texto.split('/');
      const link3 = `https://calendar.google.com/calendar/r/day/${ano3}/${mes3}/${dia3}`;
      resultado = { sucesso: true, resposta: `🔗 Sua agenda para ${texto}:\n${link3}` };
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
