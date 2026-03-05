import { adicionarEventoNaAgenda, listarEventosDoDia } from '../services/googleCalendar.js';

export const estados = {};

const MESES = { jan:'01',fev:'02',mar:'03',abr:'04',mai:'05',jun:'06',jul:'07',ago:'08',set:'09',out:'10',nov:'11',dez:'12' };

function parsearData(texto) {
  // Formato: "6 mar 26" ou "6 mar" ou "06/03/2026" ou "06/03/26"
  const m1 = texto.toLowerCase().match(/^(\d{1,2})\s+([a-z]{3})(?:\s+(\d{2,4}))?$/);
  if (m1) {
    const mesNum = MESES[m1[2]];
    if (!mesNum) return null;
    let ano = m1[3] ? m1[3] : String(new Date().getFullYear());
    if (ano.length === 2) ano = '20' + ano;
    return `${m1[1].padStart(2,'0')}/${mesNum}/${ano}`;
  }
  const m2 = texto.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (m2) {
    let ano = m2[3] ? m2[3] : String(new Date().getFullYear());
    if (ano.length === 2) ano = '20' + ano;
    return `${m2[1].padStart(2,'0')}/${m2[2].padStart(2,'0')}/${ano}`;
  }
  return null;
}

function parsearHora(texto) {
  // Aceita: "14", "14h", "14h30", "14:30"
  const m = texto.toLowerCase().match(/^(\d{1,2})(?:h(\d{2})?|:(\d{2}))?$/);
  if (!m) return null;
  return `${m[1].padStart(2,'0')}:${(m[2]||m[3]||'00').padStart(2,'0')}`;
}

function converterParaISO(dataFormatada, hora) {
  const [dia, mes, ano] = dataFormatada.split('/');
  const [h, min] = hora.split(':');
  return `${ano}-${mes}-${dia}T${h}:${min}:00-03:00`;
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
        resultado = { sucesso: true, resposta: "📅 Qual a data?\n(Ex: 6 mar 26 · 12 jan · 06/03/26)" };
      } else if (texto === "2") {
        estado.etapa = "pedir_data_consulta";
        resultado = { sucesso: true, resposta: "📅 Qual data consultar?\n(Ex: 6 mar 26 · 12 jan · 06/03/26)" };
      } else if (texto === "3") {
        estado.etapa = "pedir_data_link";
        resultado = { sucesso: true, resposta: "📅 Qual data abrir?\n(Ex: 6 mar 26 · 12 jan · 06/03/26)" };
      } else {
        resultado = { sucesso: false, resposta: "Opção inválida. Escolha 1, 2 ou 3." };
      }
      break;

    case "pedir_data": {
      const data = parsearData(texto);
      if (!data) { resultado = { sucesso: false, resposta: "❌ Data inválida.\n(Ex: 6 mar 26 · 12 jan · 06/03/26)" }; break; }
      estado.data = data;
      estado.etapa = "pedir_hora_inicio";
      resultado = { sucesso: true, resposta: "🕐 Horário de início?\n(Ex: 14 · 14h · 14h30)" };
      break;
    }

    case "pedir_hora_inicio": {
      const hora = parsearHora(texto);
      if (!hora) { resultado = { sucesso: false, resposta: "❌ Horário inválido.\n(Ex: 14 · 14h · 14h30)" }; break; }
      estado.horaInicio = hora;
      estado.etapa = "pedir_hora_fim";
      resultado = { sucesso: true, resposta: "🕐 Horário de término?\n(Ex: 15 · 15h · 15h30)" };
      break;
    }

    case "pedir_hora_fim": {
      const hora = parsearHora(texto);
      if (!hora) { resultado = { sucesso: false, resposta: "❌ Horário inválido.\n(Ex: 15 · 15h · 15h30)" }; break; }
      estado.horaFim = hora;
      estado.etapa = "pedir_titulo";
      resultado = { sucesso: true, resposta: "📝 Qual o título do compromisso?" };
      break;
    }

    case "pedir_titulo":
      estado.titulo = texto;
      estado.etapa = "confirmar_criacao";
      resultado = {
        sucesso: true,
        resposta: `Confirma?\n\n📝 *${estado.titulo}*\n📅 ${estado.data}\n🕐 ${estado.horaInicio} → ${estado.horaFim}\n\nDigite *sim* ou *não*.`
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
          resultado = { sucesso: true, resposta: `✅ *"${estado.titulo}"* agendado!\n\n🔗 ${link}` };
        } catch (error ) {
          console.error("Erro ao criar evento:", error);
          resultado = { sucesso: false, resposta: "⚠️ Não consegui criar o evento. Tente novamente." };
        }
        delete estados[remetente];
      } else if (['não','nao'].includes(texto.toLowerCase())) {
        resultado = { sucesso: true, resposta: "❌ Agendamento cancelado." };
        delete estados[remetente];
      } else {
        resultado = { sucesso: false, resposta: "Resposta inválida. Digite *sim* ou *não*." };
      }
      break;

    case "pedir_data_consulta": {
      const data = parsearData(texto);
      if (!data) { resultado = { sucesso: false, resposta: "❌ Data inválida.\n(Ex: 6 mar 26 · 12 jan · 06/03/26)" }; break; }
      const [dia2, mes2, ano2] = data.split('/');
      const dataISO = `${ano2}-${mes2}-${dia2}`;
      const link2 = `https://calendar.google.com/calendar/r/day/${ano2}/${mes2}/${dia2}`;
      try {
        const eventos = await listarEventosDoDia(dataISO );
        if (eventos.length === 0) {
          resultado = { sucesso: true, resposta: `📭 Nenhum evento para ${data}.\n\n🔗 ${link2}` };
        } else {
          let lista = `📅 *Compromissos para ${data}:*\n\n`;
          eventos.forEach(evento => {
            const inicio = evento.start?.dateTime
              ? new Date(evento.start.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
              : 'Dia todo';
            lista += `🕐 *${inicio}* — ${evento.summary}\n`;
          });
          lista += `\n🔗 ${link2}`;
          resultado = { sucesso: true, resposta: lista };
        }
      } catch (error) {
        console.error("Erro ao buscar eventos:", error);
        resultado = { sucesso: false, resposta: "⚠️ Não consegui consultar os eventos. Tente novamente." };
      }
      delete estados[remetente];
      break;
    }

    case "pedir_data_link": {
      const data = parsearData(texto);
      if (!data) { resultado = { sucesso: false, resposta: "❌ Data inválida.\n(Ex: 6 mar 26 · 12 jan · 06/03/26)" }; break; }
      const [dia3, mes3, ano3] = data.split('/');
      const link3 = `https://calendar.google.com/calendar/r/day/${ano3}/${mes3}/${dia3}`;
      resultado = { sucesso: true, resposta: `🔗 Sua agenda para ${data}:\n${link3}` };
      delete estados[remetente];
      break;
    }

    default:
      delete estados[remetente];
      resultado = { sucesso: false, resposta: "Ocorreu um erro. Digite *agenda* para recomeçar." };
      break;
  }

  return resultado;
}
