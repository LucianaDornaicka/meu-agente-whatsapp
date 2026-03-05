# Assistente Pessoal WhatsApp

Bot de WhatsApp integrado com Google Sheets e Google Calendar, desenvolvido com Node.js e implantado no Render.

## Funcionalidades

- **Tarefas**: Criar, listar e filtrar tarefas por categoria via Google Sheets
- **Agenda**: Adicionar e consultar compromissos via Google Calendar
- **Financeiro**: Registrar pagamentos, acessar planilha financeira e receber lembretes de vencimento
- **Lembretes**: Cadastrar lembretes personalizados com recorrência (única, semanal, mensal ou anual)

## Comandos

| Comando | Descrição |
|---|---|
| `tarefa` | Abre o assistente de tarefas |
| `agenda` | Abre o assistente de agenda |
| `$` | Abre o assistente financeiro |
| `lembrete` | Cadastra um novo lembrete personalizado |
| `0` ou `cancelar` | Cancela o fluxo atual |

## Notificações Automáticas

| Horário | Notificação |
|---|---|
| 21h (Brasília) | Resumo dos compromissos do dia seguinte |
| 20h (Brasília) | Lembrete de pagamentos que vencem amanhã |
| 20h (Brasília) | Reforço de pagamentos que vencem hoje |
| A cada 5 min | Disparo de lembretes personalizados cadastrados |

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
| `TWILIO_WHATSAPP_NUMBER` | Número WhatsApp Twilio (remetente) |
| `TWILIO_WHATSAPP_DEST` | Número WhatsApp destino das notificações |
| `SPREADSHEET_ID` | ID da planilha Lista de Tarefas (tarefas + lembretes) |
| `FINANCIAL_SPREADSHEET_ID` | ID da planilha Financeira |
| `GOOGLE_CALENDAR_ID` | ID do Google Calendar |

### Secret Files (Render)

- `/etc/secrets/serviceAccount.json` → Credenciais da Service Account do Google

## Estrutura


src/
agents/
orchestrator.js       # Roteamento de mensagens
tarefas.js            # Fluxo de tarefas
agenda_.js            # Fluxo de agenda
financeiro.js         # Fluxo financeiro
lembretes.js          # Fluxo de lembretes personalizados
services/
googleSheets.js       # Integração Google Sheets (tarefas)
googleCalendar.js     # Integração Google Calendar
googleFinanceiro.js   # Integração Google Sheets (financeiro)
googleLembretes.js    # Integração Google Sheets (lembretes)
resumoAgenda.js       # Resumo diário de agenda
lembreteVencimento.js # Lembretes de vencimento financeiro
dispararLembretes.js  # Disparador de lembretes personalizados
twilio.js             # Envio de mensagens WhatsApp