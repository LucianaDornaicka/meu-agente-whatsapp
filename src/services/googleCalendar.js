import { google } from 'googleapis';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// =================================================================
// 1. CONFIGURAÇÃO E AUTENTICAÇÃO
// =================================================================

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

/**
 * Configura e retorna um cliente autenticado para a API do Google.
 * Usa GoogleAuth com credentials diretas para evitar problemas de formatação da private_key.
 */
async function getGoogleAuth() {
  const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT;

  if (!serviceAccount) {
    console.error('ERRO CALENDAR: A variável de ambiente GOOGLE_SERVICE_ACCOUNT não foi definida.');
    throw new Error('Credenciais da conta de serviço não encontradas.');
  }

  let credentials;
  try {
    credentials = JSON.parse(serviceAccount);
  } catch (error) {
    console.error('ERRO CALENDAR: Falha ao fazer o parse do JSON da GOOGLE_SERVICE_ACCOUNT.', error);
    throw new Error('Formato inválido das credenciais da conta de serviço.');
  }

  // Garante que a private_key tem quebras de linha reais (não literais \n)
  const privateKey = credentials.private_key.replace(/\\n/g, '\n');

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  } );

  return auth;
}

/**
 * Retorna uma instância autenticada da API do Google Calendar.
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
