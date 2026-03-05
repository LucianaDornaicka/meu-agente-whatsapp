// src/services/twilio.js

import twilio from 'twilio';

// Pega as credenciais das variáveis de ambiente
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// -------------------------------------------------------------------
// MUDANÇA CRÍTICA: Coloque seu Messaging Service SID diretamente aqui
// -------------------------------------------------------------------
const messagingServiceSid = "MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"; // <-- COLE O SEU SID AQUI

const client = twilio(accountSid, authToken);

/**
 * Envia uma mensagem de WhatsApp usando um Messaging Service.
 */
export async function sendMessage(to, body) {
  try {
    await client.messages.create({
      messagingServiceSid: messagingServiceSid,
      to: to,
      body: body,
    });
    console.log(`Mensagem enviada para ${to} usando o serviço ${messagingServiceSid}`);
  } catch (error) {
    console.error("Erro ao enviar mensagem pelo Twilio:", error.message);
  }
}


