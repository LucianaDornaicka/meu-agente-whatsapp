import { preencherGasto, ITENS } from '../services/googleFinanceiro.js';

export const estados = {};

const LINK_PLANILHA = 'https://docs.google.com/spreadsheets/d/1I7qD8n_Ms2cO_bpEW6j2j69IrL51PdvK2PWnLOa2DCE/edit';
const MESES_VALIDOS = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];

function menuItens( ) {
  let lista = '💰 *Qual item deseja registrar?*\n\n';
  ITENS.forEach((item, i) => { lista += `${i + 1}. ${item}\n`; });
  lista += '\nDigite o número do item ou *0* para sair.';
  return lista;
}

export async function agenteFinanceiro(mensagem, remetente) {
  const texto = mensagem.trim();
  const estado = estados[remetente];

  if (!estado) {
    estados[remetente] = { etapa: 'menu' };
    return {
      sucesso: true,
      resposta: `💰 *Assistente Financeiro*\n\nO que deseja fazer?\n\n1️⃣  Ver / preencher planilha\n2️⃣  Registrar pagamento\n\nDigite *0* para sair.`
    };
  }

  let resultado;

  switch (estado.etapa) {
    case 'menu':
      if (texto === '1') {
        delete estados[remetente];
        resultado = { sucesso: true, resposta: `📊 Acesse sua planilha financeira:\n${LINK_PLANILHA}` };
      } else if (texto === '2') {
        estado.etapa = 'escolher_item';
        resultado = { sucesso: true, resposta: menuItens() };
      } else {
        resultado = { sucesso: false, resposta: '❌ Opção inválida. Digite 1 ou 2.' };
      }
      break;

    case 'escolher_item': {
      const num = parseInt(texto);
      if (isNaN(num) || num < 1 || num > ITENS.length) {
        resultado = { sucesso: false, resposta: `❌ Número inválido. Digite de 1 a ${ITENS.length}.` };
        break;
      }
      estado.itemIndex = num - 1;
      estado.itemNome = ITENS[num - 1];
      estado.etapa = 'informar_valor';
      resultado = { sucesso: true, resposta: `💵 Qual o valor pago em *${estado.itemNome}*?\n(Ex: 250,00)` };
      break;
    }

    case 'informar_valor': {
      const valorLimpo = texto.replace('R$', '').replace(' ', '').trim();
      if (!/^\d+([,.]\d{1,2})?$/.test(valorLimpo)) {
        resultado = { sucesso: false, resposta: '❌ Valor inválido. Ex: 250 ou 250,30' };
      
        break;
      }
      estado.valor = valorLimpo.replace(',', '.');
      estado.etapa = 'informar_mes';
      resultado = { sucesso: true, resposta: `📅 Qual o mês?\n(JAN, FEV, MAR, ABR, MAI, JUN, JUL, AGO, SET, OUT, NOV, DEZ)` };
      break;
    }

    case 'informar_mes': {
      const mes = texto.toUpperCase().trim();
      if (!MESES_VALIDOS.includes(mes)) {
        resultado = { sucesso: false, resposta: '❌ Mês inválido. Use: JAN, FEV, MAR...' };
        break;
      }
      estado.mes = mes;
      estado.etapa = 'confirmar';
      resultado = {
        sucesso: true,
        resposta: `Confirma?\n\n*Item:* ${estado.itemNome}\n*Valor:* R$${estado.valor.replace('.', ',')}\n*Mês:* ${mes}\n\nDigite *sim* ou *não*.`
      };
      break;
    }

    case 'confirmar': {
      if (texto.toLowerCase() === 'sim') {
        try {
          await preencherGasto(estado.itemNome, estado.mes, estado.valor);

          resultado = { sucesso: true, resposta: `✅ *${estado.itemNome}* — R$${estado.valor.replace('.', ',')} registrado como *Pago* em *${estado.mes}*!` };
        } catch (error) {
          console.error('Erro ao preencher gasto:', error);
          resultado = { sucesso: false, resposta: '⚠️ Erro ao salvar na planilha. Tente novamente.' };
        }
        delete estados[remetente];
      } else if (texto.toLowerCase() === 'não' || texto.toLowerCase() === 'nao') {
        resultado = { sucesso: true, resposta: '❌ Registro cancelado.' };
        delete estados[remetente];
      } else {
        resultado = { sucesso: false, resposta: "Resposta inválida. Digite *sim* ou *não*." };
      }
      break;
    }

    default:
      delete estados[remetente];
      resultado = { sucesso: false, resposta: "Ocorreu um erro. Digite *$* para recomeçar." };
      break;
  }

  return resultado;
}
