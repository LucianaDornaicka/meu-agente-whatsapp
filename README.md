# Assistente Pessoal WhatsApp

Bot de WhatsApp integrado com Google Sheets e Google Calendar, desenvolvido com Node.js e implantado no Render.

## Funcionalidades

- **Tarefas**: Criar, listar e filtrar tarefas por categoria via Google Sheets
- **Agenda**: Adicionar e consultar compromissos via Google Calendar
- **Financeiro**: Registrar pagamentos, acessar planilha financeira e receber lembretes de vencimento
- **Lembretes**: Cadastrar lembretes personalizados com recorrência (única, semanal, mensal ou anual)
- **Médicos**: Listar e incluir médicos com especialidade, contato e endereço
- **Inglês**: Acessar links do curso e visualizar as últimas lições registradas
- **Cardápio**: Acessar link da planilha ou lista de compras semanal
- **Organização Casa**: Receber automaticamente as tarefas domésticas do dia seguinte

## Comandos

| Comando | Descrição |
|---|---|
| `tarefa` | Abre o assistente de tarefas |
| `agenda` | Abre o assistente de agenda |
| `$` | Abre o assistente financeiro |
| `lembrete` | Cadastra um novo lembrete personalizado |
| `médico` | Abre o assistente de médicos |
| `ing` ou `en` | Exibe progresso e links do inglês |
| `cardápio` | Acessa link ou lista de compras do cardápio |
| `0` ou `cancelar` | Cancela o fluxo atual |

## Notificações Automáticas

| Horário | Notificação |
|---|---|
| 21h (Brasília) | Resumo dos compromissos do dia seguinte |
| 21h (Brasília) | Cardápio do dia seguinte |
| 21h (Brasília) | Tarefas domésticas do dia seguinte (sexta inclui link da planilha) |
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
| `TWILIO_WHATSAPP_FROM` | Número WhatsApp Twilio remetente (ex: whatsapp:+15075007313) |
| `MEU_NUMERO_WHATSAPP` | Número WhatsApp destino das notificações automáticas |
| `GOOGLE_SPREADSHEET_ID` | ID da planilha principal (tarefas, médicos, inglês, cardápio, etc.) |
| `FINANCIAL_SPREADSHEET_ID` | ID da planilha financeira |
| `GOOGLE_CALENDAR_ID` | ID do Google Calendar |
| `GOOGLE_SERVICE_ACCOUNT` | JSON da Service Account do Google (em variável de ambiente) |

### Secret Files (Render)

- `/etc/secrets/serviceAccount.json` → Credenciais da Service Account do Google (se usado via arquivo)

## Estrutura

src/
agents/
orchestrator.js        # Roteamento de mensagens
tarefas.js             # Fluxo de tarefas
agenda_.js             # Fluxo de agenda
financeiro.js          # Fluxo financeiro
lembretes.js           # Fluxo de lembretes personalizados
medicos.js             # Fluxo de médicos
ingles.js              # Fluxo de inglês
cardapio.js            # Fluxo de cardápio + envio automático
organizacaoCasa.js     # Envio automático de tarefas domésticas
services/
googleSheets.js        # Integração Google Sheets (tarefas)
googleCalendar.js      # Integração Google Calendar
googleFinanceiro.js    # Integração Google Sheets (financeiro)
googleLembretes.js     # Integração Google Sheets (lembretes)
resumoAgenda.js        # Resumo diário de agenda
lembreteVencimento.js  # Lembretes de vencimento financeiro
dispararLembretes.js   # Disparador de lembretes personalizados
twilio.js              # Envio de mensagens WhatsApp