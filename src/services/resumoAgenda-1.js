import { listarEventosDoDia, listarEventosNaoRecorrentesDoMes } from '../services/googleCalendar.js';
import { lerLembretesAtivos } from '../services/googleLembretes.js';
import { sendMessage } from '../services/twilio.js';

const NUMERO_DESTINO = process.env.TWILIO_WHATSAPP_DEST || 'whatsapp:+5519981394446';

function horarioDoEvento(evento) {
  return evento.start?.dateTime
    ? new Date(evento.start.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
    : 'Dia todo';
}

// Extrai {ano, mes, dia} direto da string do evento (dateTime ou date),
// sem passar por `new Date()` — evita o desvio de fuso horário em eventos de dia inteiro.
function dataDoEvento(evento) {
  const raw = evento.start?.dateTime || evento.start?.date;
  if (!raw) return null;
  const [ano, mes, dia] = raw.substring(0, 10).split('-').map(Number);
  return { ano, mes, dia };
}

export async function enviarResumoDiario() {
  try {
    // Obtém a data de hoje no fuso de Brasília (evita bug quando roda à meia-noite UTC = 21h BRT)
    const hojeEmBrasilia = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    const [anoHoje, mesHoje, diaHoje] = hojeEmBrasilia.split('-').map(Number);
    const amanha = new Date(anoHoje, mesHoje - 1, diaHoje + 1);
    const ano = amanha.getFullYear();
    const mesNum = amanha.getMonth() + 1;
    const dia = String(amanha.getDate()).padStart(2, '0');
    const mes = String(mesNum).padStart(2, '0');
    const dataStr = `${ano}-${mes}-${dia}`;

    const eventosAmanha = await listarEventosDoDia(dataStr);

    // Tenta buscar lembretes, mas não quebra o fluxo se falhar
    let lembretes = [];
    try {
      lembretes = await lerLembretesAtivos();
    } catch (erroLembretes) {
      console.error('Erro ao buscar lembretes ativos:', erroLembretes);
    }

    let mensagem = '';

    // Seção de Lembretes (sempre aparece se houver)
    if (lembretes && lembretes.length > 0) {
      mensagem += `🔔 *Lembretes Ativos*\n\n`;
      lembretes.forEach(lembrete => {
        mensagem += `✓ ${lembrete.descricao}`;
        if (lembrete.data && lembrete.data !== 'sem data') {
          mensagem += ` (${lembrete.data}`;
          if (lembrete.hora && lembrete.hora !== 'sem hora') mensagem += ` às ${lembrete.hora}`;
          mensagem += ')';
        }
        mensagem += '\n';
      });
      mensagem += '\n';
    }

    // Seção de Agenda de Amanhã
    if (!eventosAmanha || eventosAmanha.length === 0) {
      mensagem += `📅 *Agenda de amanhã (${dia}/${mes})*\n\nNenhum compromisso agendado. ✅`;
    } else {
      mensagem += `📅 *Agenda de amanhã (${dia}/${mes})*\n\n`;
      eventosAmanha.forEach(evento => {
        mensagem += `🕐 *${horarioDoEvento(evento)}* — ${evento.summary}\n`;
        if (evento.description) mensagem += `   📝 ${evento.description}\n`;
      });
    }

    // Resto do mês: compromissos avulsos (não recorrentes) depois de amanhã até o fim do mês.
    // Fica num bloco separado para não duplicar o que já apareceu em "Agenda de amanhã".
    try {
      const eventosDoMes = await listarEventosNaoRecorrentesDoMes(ano, mesNum);
      const amanhaNum = ano * 10000 + mesNum * 100 + amanha.getDate();

      const restoDoMes = eventosDoMes.filter(evento => {
        const d = dataDoEvento(evento);
        if (!d) return false;
        const dNum = d.ano * 10000 + d.mes * 100 + d.dia;
        return dNum > amanhaNum;
      });

      if (restoDoMes.length > 0) {
        mensagem += `\n📆 *Resto do mês (compromissos avulsos)*\n\n`;
        restoDoMes.forEach(evento => {
          const d = dataDoEvento(evento);
          mensagem += `🗓️ *${String(d.dia).padStart(2, '0')}/${String(d.mes).padStart(2, '0')}* — ${evento.summary}\n`;
        });
      }
    } catch (erroMes) {
      console.error('Erro ao buscar compromissos do resto do mês:', erroMes);
    }

    await sendMessage(NUMERO_DESTINO, mensagem);
  } catch (error) {
    console.error('Erro ao enviar resumo diário:', error);
  }
}
