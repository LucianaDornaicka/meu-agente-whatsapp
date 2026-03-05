import { lerItensPorVencimento } from './googleFinanceiro.js';
import { sendMessage } from './twilio.js';

const NUMERO_DESTINO = process.env.TWILIO_WHATSAPP_DEST || 'whatsapp:+5519981394446';

export async function verificarVencimentos() {
  try {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const diaAmanha = amanha.getDate();
    console.log(`Verificando vencimentos para o dia ${diaAmanha}...`);
    const itens = await lerItensPorVencimento(diaAmanha);
    if (itens.length === 0) { console.log('Nenhum vencimento amanhã.'); return; }
    let mensagem = `⚠️ *Lembrete de vencimento!*\n\nAmanhã vencem:\n\n`;
    itens.forEach(item => { mensagem += `💳 *${item}*\n`; });
    mensagem += `\nDigite *$* para registrar o pagamento.`;
    await sendMessage(NUMERO_DESTINO, mensagem);
    console.log(`Lembrete enviado: ${itens.join(', ')}`);
  } catch (error) {
    console.error('Erro ao verificar vencimentos:', error);
  }
}
