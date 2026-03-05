import { adicionarLembrete } from '../services/googleLembretes.js';

export const estados = {};

const MESES_ABREV = { jan:'01',fev:'02',mar:'03',abr:'04',mai:'05',jun:'06',jul:'07',ago:'08',set:'09',out:'10',nov:'11',dez:'12' };
const RECORRENCIAS = ['unica','semanal','mensal','anual'];

function parsearData(texto) {
  const m1 = texto.toLowerCase().match(/^(\d{1,2})\s+([a-z]{3})(?:\s+(\d{4}))?$/);
  if (m1) {
    const mesNum = MESES_ABREV[m1[2]];
    if (!mesNum) return null;
    return `${m1[1].padStart(2,'0')}/${mesNum}/${m1[3] || new Date().getFullYear()}`;
  }
  const m2 = texto.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/);
  if (m2) return `${m2[1].padStart(2,'0')}/${m2[2].padStart(2,'0')}/${m2[3] || new Date().getFullYear()}`;
  return null;
}

function parsearHora(texto) {
  const m = texto.toLowerCase().match(/^(\d{1,2})(?:h(\d{2})?|:(\d{2}))?$/);
  if (!m) return null;
  return `${m[1].padStart(2,'0')}:${(m[2]||m[3]||'00').padStart(2,'0')}`;
}

export async function agenteLembretes(mensagem, remetente) {
  const texto = mensagem.trim();
  const estado = estados[remetente];

  if (!estado) {
    estados[remetente] = { etapa: 'pedir_descricao' };
    return { sucesso: true, resposta: `🔔 *Novo Lembrete*\n\nQual o lembrete?\n(Ex: Ligar para minha mãe)` };
  }

  let resultado;
  switch (estado.etapa) {
    case 'pedir_descricao':
      estado.descricao = texto;
      estado.etapa = 'pedir_data';
      resultado = { sucesso: true, resposta: `📅 Qual a data?\n(Ex: 12 mar · 15 fev · 12/03 · 12/03/2026)` };
      break;

    case 'pedir_data': {
      const data = parsearData(texto);
      if (!data) { resultado = { sucesso: false, resposta: '❌ Data inválida. Ex: 12 mar · 15 fev · 12/03' }; break; }
      estado.data = data;
      estado.etapa = 'pedir_hora';
      resultado = { sucesso: true, resposta: `🕐 Qual o horário?\n(Ex: 14h30 · 14h · 9h)\nOu *sem hora* para não definir.` };
      break;
    }

    case 'pedir_hora': {
      const tl = texto.toLowerCase().trim();
      if (tl === 'sem hora' || tl === 'sem') {
        estado.hora = null;
      } else {
        const hora = parsearHora(texto);
        if (!hora) { resultado = { sucesso: false, resposta: '❌ Horário inválido. Ex: 14h30 · 14h · ou *sem hora*' }; break; }
        estado.hora = hora;
      }
      estado.etapa = 'pedir_recorrencia';
      resultado = { sucesso: true, resposta: `🔁 Qual a recorrência?\n\n1. Única vez\n2. Semanal\n3. Mensal\n4. Anual` };
      break;
    }

    case 'pedir_recorrencia': {
      const opcoes = { '1':'unica','2':'semanal','3':'mensal','4':'anual' };
      const rec = opcoes[texto] || texto.toLowerCase();
      if (!RECORRENCIAS.includes(rec)) { resultado = { sucesso: false, resposta: '❌ Opção inválida. Digite 1, 2, 3 ou 4.' }; break; }
      estado.recorrencia = rec;
      estado.etapa = 'confirmar';
      const recExib = { unica:'Única vez',semanal:'Semanal',mensal:'Mensal',anual:'Anual' }[rec];
      resultado = { sucesso: true, resposta: `Confirma?\n\n📝 *${estado.descricao}*\n📅 ${estado.data}\n🕐 ${estado.hora || 'sem hora'}\n🔁 ${recExib}\n\nDigite *sim* ou *não*.` };
      break;
    }

    case 'confirmar': {
      if (texto.toLowerCase() === 'sim') {
        try {
          await adicionarLembrete({ descricao: estado.descricao, data: estado.data, hora: estado.hora, recorrencia: estado.recorrencia });
          resultado = { sucesso: true, resposta: `✅ Lembrete *"${estado.descricao}"* cadastrado!` };
        } catch (e) {
          console.error('Erro ao salvar lembrete:', e);
          resultado = { sucesso: false, resposta: '⚠️ Erro ao salvar. Tente novamente.' };
        }
        delete estados[remetente];
      } else if (['não','nao'].includes(texto.toLowerCase())) {
        resultado = { sucesso: true, resposta: '❌ Lembrete cancelado.' };
        delete estados[remetente];
      } else {
        resultado = { sucesso: false, resposta: "Resposta inválida. Digite *sim* ou *não*." };
      }
      break;
    }

    default:
      delete estados[remetente];
      resultado = { sucesso: false, resposta: "Erro no fluxo. Digite *lembrete* para recomeçar." };
  }
  return resultado;
}
