# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Configuração do Projeto – Assistente Pessoal

## Objetivo
Criar um sistema multiagente que funcione como Assistente Pessoal via WhatsApp.

O sistema deve:
- Receber mensagens via WhatsApp (Twilio)
- Interpretar comandos
- Delegar para subagentes especializados
- Executar ações usando APIs externas
- Responder o usuário automaticamente

## Arquitetura

### Fluxo de Requisição
```
Mensagem WhatsApp
  → Webhook Twilio (servidor no Render)
    → Agente Orquestrador (interpreta + delega)
      → Subagente especialista (Google Calendar / Drive / Supabase)
        → Resposta via Twilio → WhatsApp
```

### Agente Orquestrador
Responsável por:
- Interpretar a intenção do usuário
- Escolher o subagente correto
- Coordenar o fluxo da resposta

### Subagentes
- **Agente de Agenda** – Google Calendar (compromissos, lembretes)
- **Agente de Planejamento de Estudos** – Planos de estudo com checklist de progresso
- **Agente de Tarefas** – Listas de tarefas por categoria
- **Agente de Gestão de Arquivos** – Google Drive (links, imagens)
- **Agente de Lembretes Financeiros** – Contas a pagar e investimentos

Cada agente deve ter seu próprio arquivo de módulo.

## Stack Tecnológica
- **Backend:** Node.js
- **Integração WhatsApp:** Twilio
- **Banco de Dados:** Supabase
- **Hospedagem:** Render
- **APIs externas:** Google Calendar, Google Drive

## Regras Importantes
- Todas as respostas ao usuário devem ser em português do Brasil.
- O código deve ser organizado por módulos (um arquivo por agente).
- Explicar antes de gerar código complexo.
