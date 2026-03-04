# Projeto: Assistente Pessoal – Agenda & Organização

## Objetivo do Sistema

Criar um assistente pessoal inteligente capaz de:
- Gerenciar compromissos
- Organizar estudos
- Enviar lembretes automáticos
- Responder via WhatsApp
- Funcionar 24h na nuvem

## Problema que Resolve

- Falta de organização pessoal
- Esquecimento de compromissos
- Falta de controle de estudos
- Dificuldade em centralizar tarefas
- Falta de lembretes financeiros

## Funcionalidades Principais

- **Gestão de Agenda:** Consultar, criar, editar compromissos e enviar lembretes.
- **Comunicação via WhatsApp:** Receber comandos e enviar respostas/alertas.
- **Planejamento de Estudos:** Criar planos de estudo por categoria com checklist de progresso.
- **Organização de Tarefas:** Criar e gerenciar listas de tarefas por categoria.
- **Gestão de Arquivos:** Salvar e organizar links e imagens.
- **Lembretes Financeiros:** Registrar contas a pagar/investimentos e enviar alertas.

## Subagentes do Sistema

- **Agente Orquestrador:** Coordena todos os outros agentes.
- **Agente de Agenda:** Especialista em Google Calendar.
- **Agente de Planejamento de Estudos:** Especialista em organização de estudos.
- **Agente de Organização de Tarefas:** Especialista em listas de tarefas.
- **Agente de Gestão de Arquivos:** Especialista em Google Drive.
- **Agente de Lembretes Financeiros:** Especialista em controle financeiro.

## Fluxo Geral

1. Usuário envia mensagem no WhatsApp.
2. O sistema (hospedado na Render e usando Twilio) recebe o comando.
3. O Agente Orquestrador interpreta o pedido e delega ao especialista correto.
4. O agente especialista executa a ação (usando APIs do Google, banco de dados Supabase, etc.).
5. O sistema retorna a resposta ao usuário via WhatsApp.

