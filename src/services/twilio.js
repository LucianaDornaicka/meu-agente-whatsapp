import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendMessage(to, body) {
  try {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: to,
      body: body,
    });
    console.log(`Mensagem enviada para ${to}`);
  } catch (error) {
    console.error("Erro ao enviar mensagem pelo Twilio:", error.message);
  }
}
