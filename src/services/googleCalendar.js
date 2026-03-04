import fs from 'fs';
import { google } from 'googleapis';

// 🔐 Lê a service account
let serviceAccount;

if (process.env.GOOGLE_SERVICE_ACCOUNT) {
  // Render (produção)
  serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

  console.log("EMAIL SERVICE:", serviceAccount.client_email);
  console.log("PRIVATE KEY START:", serviceAccount.private_key.substring(0, 30));

} else {
  // Local (seu computador)
  serviceAccount = JSON.parse(
    fs.readFileSync('serviceAccount.json', 'utf8')
  );
}

// 🔐 Autenticação
const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ['https://www.googleapis.com/auth/calendar']
});

const calendar = google.calendar({ version: 'v3', auth });

const CALENDAR_ID = 'assistentepessoal55@gmail.com';

// =====================================================
// 📅 CRIAR EVENTO
// =====================================================
export async function criarEvento({
  summary,
  description,
  startDateTime,
  endDateTime
}) {

  const response = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: {
      summary,
      description,
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Sao_Paulo'
      }
    }
  });

  return response.data;
}

// =====================================================
// 📋 LISTAR EVENTOS DO DIA
// =====================================================
export async function listarEventosDoDia(dataISO) {

  const inicio = new Date(dataISO);
  inicio.setHours(0, 0, 0, 0);

  const fim = new Date(dataISO);
  fim.setHours(23, 59, 59, 999);

  const response = await calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin: inicio.toISOString(),
    timeMax: fim.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return response.data.items;
}

// =====================================================
// ❌ CANCELAR POR TÍTULO
// =====================================================
export async function cancelarEventoPorTitulo(titulo) {

  const response = await calendar.events.list({
    calendarId: CALENDAR_ID,
    q: titulo,
    singleEvents: true
  });

  const eventos = response.data.items;

  if (!eventos || eventos.length === 0) return null;

  const evento = eventos[0];

  await calendar.events.delete({
    calendarId: CALENDAR_ID,
    eventId: evento.id
  });

  return evento.summary;
}