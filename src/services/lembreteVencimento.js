import { lerItensPorVencimento } from '../services/googleFinanceiro.js';
import { sendMessage } from '../services/twilio.js';

const NUMERO_DESTINO = process.env.TWILIO_WHATSAPP_DEST || 'whatsapp:+5519981394446';

export async function lembreteVencimentoAmanha() {
  try {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const itens = await lerItensPorVencimento(amanha.getDate());
    if (itens.length === 0) return;
    let mensagem = `⚠️ *Lembrete de vencimento!*\n\nAmanhã vencem:\n\n`;
    itens.forEach(item => { mensagem += `💳 *${item}*\n`; });
    mensagem += `\nDigite *$* para registrar o pagamento.`;
    await sendMessage(NUMERO_DESTINO, mensagem);
  } catch (error) {
    console.error('Erro ao verificar vencimentos (amanhã):', error);
  }
}

export async function lembreteVencimentoHoje() {
  try {
    const itens = await lerItensPorVencimento(new Date().getDate());
    if (itens.length === 0) return;
    let mensagem = `🔔 *Reforço — vence HOJE!*\n\nVencem hoje:\n\n`;
    itens.forEach(item => { mensagem += `💳 *${item}*\n`; });
    mensagem += `\nDigite *$* para registrar o pagamento.`;
    await sendMessage(NUMERO_DESTINO, mensagem);
  } catch (error) {
    console.error('Erro ao verificar vencimentos (hoje):', error);
  }
}
