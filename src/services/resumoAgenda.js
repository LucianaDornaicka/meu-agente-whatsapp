import { listarEventosDoDia } from '../services/googleCalendar.js';
import { sendMessage } from '../services/twilio.js';

const NUMERO_DESTINO = process.env.TWILIO_WHATSAPP_DEST || 'whatsapp:+5519981394446';

export async function enviarResumoDiario() {
  try {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const ano = amanha.getFullYear();
    const mes = String(amanha.getMonth() + 1).padStart(2, '0');
    const dia = String(amanha.getDate()).padStart(2, '0');
    const dataStr = `${ano}-${mes}-${dia}`;
    const eventos = await listarEventosDoDia(dataStr);
    let mensagem;
    if (!eventos || eventos.length === 0) {
      mensagem = `📅 *Agenda de amanhã (${dia}/${mes})*\n\nNenhum compromisso agendado. ✅`;
    } else {
      mensagem = `📅 *Agenda de amanhã (${dia}/${mes})*\n\n`;
      eventos.forEach(evento => {
        const inicio = evento.start?.dateTime
          ? new Date(evento.start.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
          : 'Dia todo';
        mensagem += `🕐 *${inicio}* — ${evento.summary}\n`;
        if (evento.description) mensagem += `   📝 ${evento.description}\n`;
      });
    }
    await sendMessage(NUMERO_DESTINO, mensagem);
  } catch (error) {
    console.error('Erro ao enviar resumo diário:', error);
  }
}
