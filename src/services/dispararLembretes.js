import { lerLembretesAtivos, atualizarStatusLembrete } from '../services/googleLembretes.js';
import { sendMessage } from '../services/twilio.js';

const NUMERO_DESTINO = process.env.TWILIO_WHATSAPP_DEST || 'whatsapp:+5519981394446';

export async function dispararLembretes() {
  try {
    const agora = new Date();
    const lembretes = await lerLembretesAtivos();
    for (const lembrete of lembretes) {
      if (!lembrete.proximoDisparo) continue;
      const [dataParte, horaParte] = lembrete.proximoDisparo.split(' ');
      const [dia, mes, ano] = dataParte.split('/').map(Number);
      const [hora, min] = (horaParte || '09:00').split(':').map(Number);
      const dataDisparo = new Date(ano, mes - 1, dia, hora, min, 0);
      const diff = agora - dataDisparo;
      if (diff >= 0 && diff <= 10 * 60 * 1000) {
        await sendMessage(NUMERO_DESTINO, `🔔 *Lembrete:* ${lembrete.descricao}`);
        if (lembrete.recorrencia === 'unica') {
          await atualizarStatusLembrete(lembrete.id, 'enviado', null);
        } else {
          const dt = new Date(dataDisparo);
          if (lembrete.recorrencia === 'semanal') dt.setDate(dt.getDate() + 7);
          else if (lembrete.recorrencia === 'mensal') dt.setMonth(dt.getMonth() + 1);
          else if (lembrete.recorrencia === 'anual') dt.setFullYear(dt.getFullYear() + 1);
          const proximo = `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
          await atualizarStatusLembrete(lembrete.id, 'ativo', proximo);
        }
      }
    }
  } catch (error) {
    console.error('Erro ao disparar lembretes:', error);
  }
}
