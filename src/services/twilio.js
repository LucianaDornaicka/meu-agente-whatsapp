import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const messagingServiceSid = "MG6a603db341a48ae6386662540bc37603";

const client = twilio(accountSid, authToken);

export async function sendMessage(to, body) {
  try {
    await client.messages.create({
      messagingServiceSid: messagingServiceSid,
      to: to,
      body: body,
    });
    console.log(`Mensagem enviada para ${to}`);
  } catch (error) {
    console.error("Erro ao enviar mensagem pelo Twilio:", error.message);
  }
}
