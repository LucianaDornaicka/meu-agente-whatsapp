import { preencherGasto, ITENS } from '../services/googleFinanceiro.js';
import { lerItensControleGastos, registrarGastoControle } from '../services/googleControleGastos.js';
 
export const estados = {};
 
const LINK_PLANILHA = 'https://docs.google.com/spreadsheets/d/1I7qD8n_Ms2cO_bpEW6j2j69IrL51PdvK2PWnLOa2DCE/edit';
const MESES_VALIDOS = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
 
function formatarReal(valor) {
  const numero = Number(valor) || 0;
  return `R$ ${numero.toFixed(2).replace('.', ',')}`;
}
 
function menuItens( ) {
  let lista = '💰 *Qual item deseja registrar?*\n\n';
  ITENS.forEach((item, i) => { lista += `${i + 1}. ${item}\n`; });
  lista += '\nDigite o número do item ou *0* para sair.';
  return lista;
}
 
function menuControleGastos(itens) {
  let lista = '📊 *Controle de Gastos — em qual item você gastou?*\n\n';
  itens.forEach((item, i) => { lista += `${i + 1}. ${item.nome}\n`; });
  lista += '\nDigite o número do item ou *0* para sair.';
  return lista;
}
 
function resumoItemControle(item) {
  const disponivel = item.limite - item.gastoAcumulado;
  return `📊 *${item.nome}*${item.categoria ? ` (${item.categoria})` : ''}\n\n` +
    `Limite do mês: ${formatarReal(item.limite)}\n` +
    `Já gasto: ${formatarReal(item.gastoAcumulado)}\n` +
    `Disponível: ${formatarReal(disponivel)}\n\n` +
    `💵 Qual o valor do novo gasto?\n(Ex: 50 ou 50,00)`;
}
 
export async function agenteFinanceiro(mensagem, remetente) {
  const texto = mensagem.trim();
  const estado = estados[remetente];
 
  if (!estado) {
    estados[remetente] = { etapa: 'menu' };
    return {
      sucesso: true,
      resposta: `💰 *Assistente Financeiro*\n\nO que deseja fazer?\n\n1️⃣  Ver / preencher planilha\n2️⃣  Registrar pagamento\n3️⃣  Controle de Gastos\n\nDigite *0* para sair.`
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
      } else if (texto === '3') {
        try {
          estado.itensControle = await lerItensControleGastos();
          estado.etapa = 'cg_escolher_item';
          resultado = { sucesso: true, resposta: menuControleGastos(estado.itensControle) };
        } catch (error) {
          console.error('Erro ao ler Controle de Gastos:', error);
          delete estados[remetente];
          resultado = { sucesso: false, resposta: '⚠️ Não consegui acessar a planilha de Controle de Gastos. Tente novamente.' };
        }
      } else {
        resultado = { sucesso: false, resposta: '❌ Opção inválida. Digite 1, 2 ou 3.' };
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
 
    case 'cg_escolher_item': {
      const itens = estado.itensControle || [];
      const num = parseInt(texto);
      if (isNaN(num) || num < 1 || num > itens.length) {
        resultado = { sucesso: false, resposta: `❌ Número inválido. Digite de 1 a ${itens.length}.` };
        break;
      }
      estado.itemControle = itens[num - 1];
      estado.etapa = 'cg_informar_valor';
      resultado = { sucesso: true, resposta: resumoItemControle(estado.itemControle) };
      break;
    }
 
    case 'cg_informar_valor': {
      const valorLimpo = texto.replace('R$', '').replace(' ', '').trim();
      if (!/^\d+([,.]\d{1,2})?$/.test(valorLimpo)) {
        resultado = { sucesso: false, resposta: '❌ Valor inválido. Ex: 50 ou 50,30' };
        break;
      }
      estado.valorControle = parseFloat(valorLimpo.replace(',', '.'));
      estado.etapa = 'cg_confirmar';
      resultado = {
        sucesso: true,
        resposta: `Confirma o gasto de ${formatarReal(estado.valorControle)} em *${estado.itemControle.nome}*?\n\nDigite *sim* ou *não*.`
      };
      break;
    }
 
    case 'cg_confirmar': {
      if (texto.toLowerCase() === 'sim') {
        try {
          const atualizado = await registrarGastoControle(estado.itemControle.nome, estado.valorControle);
          let msg = `✅ Gasto de ${formatarReal(estado.valorControle)} registrado em *${atualizado.nome}*!\n\n`;
          msg += `Limite do mês: ${formatarReal(atualizado.limite)}\n`;
          msg += `Gasto acumulado: ${formatarReal(atualizado.gastoAcumulado)}\n`;
          if (atualizado.disponivel < 0) {
            msg += `⚠️ *Você ultrapassou o limite de ${atualizado.nome} em ${formatarReal(Math.abs(atualizado.disponivel))}!*`;
          } else {
            msg += `Disponível: ${formatarReal(atualizado.disponivel)}`;
          }
          resultado = { sucesso: true, resposta: msg };
        } catch (error) {
          console.error('Erro ao registrar gasto no Controle de Gastos:', error);
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
