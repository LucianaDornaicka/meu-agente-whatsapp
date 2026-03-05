import { adicionarEventoNaAgenda, listarEventosDoDia } from '../services/googleCalendar.js';

// Objeto para gerenciar o estado da conversa para cada usuário
export const estados = {};

/**
 * Agente para gerenciar o fluxo de agendamento.
 */
export async function agenteAgenda(mensagem, remetente) {
  const texto = mensagem.toLowerCase().trim();
  const estado = estados[remetente];

  // O comando de sair "0" é tratado globalmente pelo orquestrador.

  // --- Início do Fluxo ---
  if (!estado) {
    estados[remetente] = { etapa: "menu" };
    return {
      sucesso: true,
      resposta: `🗓️ *Assistente de Agenda*

O que você gostaria de fazer?

1️⃣  Adicionar um novo compromisso
2️⃣  Ver os compromissos de um dia

A qualquer momento, digite *0* para sair.`
    };
  }

  // --- Máquina de Estados ---
  let resultado;

  switch (estado.etapa) {
    case "menu":
      if (texto === "1") {
        estado.etapa = "pedir_data";
        resultado = { sucesso: true, resposta: "Qual a data do compromisso? (formato DD/MM/AAAA)" };
      } else if (texto === "2") {
        estado.etapa = "pedir_data_consulta";
        resultado = { sucesso: true, resposta: "Qual data você quer consultar? (formato DD/MM/AAAA)" };
      } else {
        resultado = { sucesso: false, resposta: "Opção inválida. Por favor, escolha 1 ou 2." };
      }
      break;

    // ... (outros cases do fluxo de agendamento)

    // Exemplo de case para consultar eventos
    case "pedir_data_consulta": {
      // Supondo que a data venha em DD/MM/AAAA, precisamos converter para YYYY-MM-DD
      const [dia, mes, ano] = texto.split('/');
      if (!dia || !mes || !ano) {
          resultado = { sucesso: false, resposta: "Formato de data inválido. Use DD/MM/AAAA." };
          break;
      }
      const dataFormatada = `${ano}-${mes}-${dia}`;
      
      try {
        const eventos = await listarEventosDoDia(dataFormatada);
        if (eventos.length === 0) {
          resultado = { sucesso: true, resposta: `Nenhum evento encontrado para ${texto}.` };
        } else {
          let listaFormatada = `*Compromissos para ${texto}:*\n\n`;
          eventos.forEach(evento => {
            const inicio = new Date(evento.start.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            listaFormatada += `- ${inicio}: ${evento.summary}\n`;
          });
          resultado = { sucesso: true, resposta: listaFormatada };
        }
      } catch (error) {
        console.error("Erro ao buscar eventos no agente:", error);
        resultado = { sucesso: false, resposta: "Desculpe, não consegui consultar os eventos. Tente novamente." };
      }
      
      delete estados[remetente]; // Finaliza o fluxo
      break;
    }

    // Adicione aqui os outros cases para o fluxo de criação de evento (pedir_data, pedir_hora, etc.)
    // Por enquanto, vamos manter simples para garantir que a conexão funcione.

    default:
      delete estados[remetente];
      resultado = { sucesso: false, resposta: "Ocorreu um erro, vamos recomeçar. Digite 'agenda'." };
      break;
  }

  return resultado;
}
