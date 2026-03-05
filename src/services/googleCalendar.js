import { google } from 'googleapis';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente (essencial para rodar localmente)
dotenv.config();

// Escopo de permissão: Acesso total aos calendários
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

let calendar; // Instância da API do Google Calendar

try {
  // Lê as credenciais da variável de ambiente (funciona no Render e localmente com .env )
  const credsString = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!credsString) {
    throw new Error("A variável de ambiente GOOGLE_SERVICE_ACCOUNT não foi definida.");
  }

  const credenciais = JSON.parse(credsString);

  // Autenticação
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credenciais.client_email,
      // Garante que a chave privada seja formatada corretamente
      private_key: credenciais.private_key.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  });

  // Cria a instância principal da API do Google Calendar
  calendar = google.calendar({ version: 'v3', auth });
  console.log("Autenticação com Google Calendar realizada com sucesso.");

} catch (error) {
  console.error("ERRO CRÍTICO NA AUTENTICAÇÃO DO GOOGLE CALENDAR:", error.message);
  throw new Error("Falha ao inicializar a autenticação do Google Calendar.");
}


/**
 * Cria um novo evento no calendário principal.
 * @param {object} dadosDoEvento - Objeto com summary, start, end, etc.
 * @returns {Promise<object>} O objeto completo do evento criado, incluindo o htmlLink.
 */
export async function criarEventoNoCalendario(dadosDoEvento) {
  try {
    const response = await calendar.events.insert({
      calendarId: 'primary', // 'primary' usa o calendário principal do usuário autenticado
      resource: dadosDoEvento,
    });
    console.log('Evento criado com sucesso no Google Calendar.');
    // Retorna todos os dados do evento, que é o que o agente precisa
    return response.data;
  } catch (err) {
    console.error('Erro ao criar evento no Google Calendar:', err.message);
    throw new Error('Falha ao criar evento no calendário.');
  }
}

/**
 * Gera um link direto para a visualização de um dia específico no Google Agenda.
 * @param {Date} data - O objeto Date do dia desejado.
 * @returns {string} A URL para o dia na agenda.
 */
export function gerarLinkParaDia(data) {
  // Formata a data para o formato YYYYMMDD, que o Google Calendar entende na URL
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0'); // Adiciona +1 pois mês começa em 0
  const dia = String(data.getDate()).padStart(2, '0');
  
  const dataFormatada = `${ano}${mes}${dia}`;
  
  // Monta a URL. O parâmetro 'ctz' define o fuso horário.
  return `https://calendar.google.com/calendar/r/day/${dataFormatada}?ctz=America/Sao_Paulo`;
}
