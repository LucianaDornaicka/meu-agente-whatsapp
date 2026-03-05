# Assistente Pessoal WhatsApp

Bot de WhatsApp integrado com Google Sheets e Google Calendar, desenvolvido com Node.js e implantado no Render.

## Funcionalidades

- **Tarefas**: Criar, listar e filtrar tarefas por categoria via Google Sheets
- **Agenda**: Adicionar e consultar compromissos via Google Calendar

## Comandos

- `tarefa` → Abre o assistente de tarefas
- `agenda` → Abre o assistente de agenda
- `0` ou `cancelar` → Cancela o fluxo atual

## Tecnologias

- Node.js + Express
- Twilio (WhatsApp API)
- Google Sheets API
- Google Calendar API
- Render (hospedagem)

## Configuração

### Variáveis de ambiente (Render)

| Variável | Descrição |
|---|---|
| `TWILIO_ACCOUNT_SID` | SID da conta Twilio |
| `TWILIO_AUTH_TOKEN` | Token de autenticação Twilio |
| `TWILIO_WHATSAPP_NUMBER` | Número WhatsApp Twilio |
| `SPREADSHEET_ID` | ID da planilha Google Sheets |
| `GOOGLE_CALENDAR_ID` | ID do Google Calendar |

### Secret Files (Render)

- `/etc/secrets/serviceAccount.json` → Credenciais da Service Account do Google

## Estrutura


