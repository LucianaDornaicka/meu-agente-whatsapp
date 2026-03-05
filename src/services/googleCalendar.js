import { google } from 'googleapis';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// =================================================================
// 1. CONFIGURAÇÃO E AUTENTICAÇÃO
// =================================================================

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

/**
 * Configura e retorna um cliente JWT autenticado para a API do Google.
 * Esta função é a chave para a autenticação correta no Render.
 * @returns {Promise<import('google-auth-library').JWT>}
 */
async function getGoogleAuth() {
  // Pega as credenciais da variável de ambiente.
  const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT;

  if (!serviceAccount) {
    console.error('ERRO CALENDAR: A variável de ambiente GOOGLE_SERVICE_ACCOUNT não foi definida.');
    throw new Error('Credenciais da conta de serviço não encontradas.');
  }

  let credentials;
  try {
    // O Render armazena a variável como uma string, então precisamos fazer o parse.
    credentials = JSON.parse(serviceAccount);
  } catch (error) {
    console.error('ERRO CALENDAR: Falha ao fazer o parse do JSON da GOOGLE_SERVICE_ACCOUNT.', error);
    throw new Error('Formato inválido das credenciais da conta de serviço.');
  }

  // A chave privada vem com '\n' literais que precisam ser substituídos por quebras de linha reais.
  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
  }

  const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ['https://www.googleapis.com/auth/calendar'] // Escopo para o Calendar
   );

  return auth;
}

/**
 * Retorna uma instância autenticada da API do Google Calendar.
 * @returns {Promise<import('googleapis').calendar_v3.Calendar>}
 */
async function getCalendarService() {
  const auth = await getGoogleAuth();
  return google.calendar({ version: 'v3', auth });
}


// =================================================================
// 2. FUNÇÕES DE MANIPULAÇÃO DE EVENTOS
// =================================================================

/**
 * Adiciona um novo evento na agenda.
 * @param {object} eventDetails - Detalhes do evento.
 * @param {string} eventDetails.summary - O título do evento.
 * @param {string} eventDetails.description - A descrição do evento.
 * @param {string} eventDetails.startDateTime - Data e hora de início (formato ISO, ex: '2024-08-15T10:00:00-03:00').
 * @param {string} eventDetails.endDateTime - Data e hora de fim (formato ISO, ex: '2024-08-15T11:00:00-03:00').
 */
export async function adicionarEventoNaAgenda(eventDetails) {
  try {
    const calendar = await getCalendarService();
    const event = {
      summary: eventDetails.summary,
      description: eventDetails.description,
      start: {
        dateTime: eventDetails.startDateTime,
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: eventDetails.endDateTime,
        timeZone: 'America/Sao_Paulo',
      },
    };

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      resource: event,
    });

    console.log('Evento criado com sucesso:', response.data.htmlLink);
    return response.data;
  } catch (error) {
    console.error('Erro ao adicionar evento na agenda:', error);
    throw error;
  }
}

/**
 * Lista os eventos de um dia específico.
 * @param {string} date - A data no formato 'YYYY-MM-DD'.
 */
export async function listarEventosDoDia(date) {
  try {
    const calendar = await getCalendarService();
    
    const startOfDay = new Date(`${date}T00:00:00-03:00`);
    const endOfDay = new Date(`${date}T23:59:59-03:00`);

    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items;
    if (!events || events.length === 0) {
      console.log('Nenhum evento encontrado para esta data.');
      return [];
    }
    
    console.log(`Eventos encontrados para ${date}:`, events.length);
    return events;

  } catch (error) {
    console.error('Erro ao listar eventos do dia:', error);
    throw error;
  }
}
