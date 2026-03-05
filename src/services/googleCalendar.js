import { google } from 'googleapis';
import { existsSync, readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

async function getGoogleAuth() {
  let credentials;

  const secretPath = '/etc/secrets/serviceAccount.json';

  if (existsSync(secretPath)) {
    credentials = JSON.parse(readFileSync(secretPath, 'utf8'));
  } else {
    const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT;
    if (!serviceAccount) throw new Error('Credenciais não encontradas.');
    credentials = JSON.parse(serviceAccount);
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key.replace(/\\n/g, '\n'),

    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  } );

  return auth;
}

async function getCalendarService() {
  const auth = await getGoogleAuth();
  return google.calendar({ version: 'v3', auth });
}

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
