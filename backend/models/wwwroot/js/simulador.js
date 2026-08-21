// BuildXP — simulador de entrevistas / reuniões (simulador.html)
const SIMULADOR_PERSONAS = {
  rh_cultura: {
    kicker: 'RH · CULTURA',
    title: 'Recrutador de RH',
  },
  tech_lead_gerente: {
    kicker: 'TECH LEAD · GESTÃO',
    title: 'Tech Lead / Gerente',
  },
  stakeholder_negocios: {
    kicker: 'NEGÓCIOS · CLIENTE',
    title: 'Stakeholder de negócios',
  },
};

function simuladorApiBase() {
  if (typeof getBuildXpApiBase === 'function') return String(getBuildXpApiBase()).replace(/\/$/, '');
  if (typeof window.BUILDXP_API_BASE === 'string' && window.BUILDXP_API_BASE.trim()) {
    return window.BUILDXP_API_BASE.trim().replace(/\/$/, '');
  }
  return '';
}

function simuladorEstadoInicial() {
  return {
    persona: 'rh_cultura',
    cenario: '',
    historico: [],
    ocupado: false,
    encerrada: false,
  };
}

let simuladorEstado = simuladorEstadoInicial();

function simuladorPersonaSelecionada() {
  const marked = document.querySelector('input[name="simulador-persona"]:checked');
  return String(marked?.value || 'rh_cultura');
}

function simuladorAppendBolha(remetente, texto, pending) {
  const log = document.getElementById('simulador-log');
  if (!log) return null;
  const bubble = document.createElement('div');
  bubble.className = `simulador-bubble simulador-bubble--${remetente === 'usuario' ? 'user' : 'agent'}${pending ? ' is-pending' : ''}`;
  bubble.textContent = texto;
  log.appendChild(bubble);
  log.scrollTop = log.scrollHeight;
  return bubble;
}

function simuladorSetStatus(id, tipo, texto) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = tipo ? `fb-status ${tipo}` : 'fb-status';
  el.textContent = texto || '';
}

function simuladorTravarChat(travar) {
  const input = document.getElementById('simulador-input');
  const enviar = document.getElementById('simulador-enviar');
  const encerrar = document.getElementById('simulador-encerrar');
  if (input) input.disabled = travar;
  if (enviar) enviar.disabled = travar;
  if (encerrar) encerrar.disabled = travar && !simuladorEstado.encerrada;
}

async function simuladorPostJson(caminho, corpo) {
  const res = await fetch(`${simuladorApiBase()}${caminho}`, {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(corpo),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const mensagemApi = String(data?.mensagem || data?.Mensagem || '').trim();
    let mensagem = mensagemApi;
    if (!mensagem) {
      if (res.status === 404) {
        mensagem = 'A API ainda não carregou o simulador. Reinicie o servidor e atualize a página.';
      } else if (res.status === 429) {
        mensagem = 'Muitas tentativas em pouco tempo. Espere um instante.';
      } else {
        mensagem = 'Não foi possível falar com o simulador agora.';
      }
    }
    throw new Error(mensagem);
  }
  return data;
}

async function simuladorEnviarTurno(mensagemUsuario) {
  const data = await simuladorPostJson('/api/simulacao/turno', {
    persona: simuladorEstado.persona,
    cenario: simuladorEstado.cenario,
    historicoMensagens: simuladorEstado.historico,
    mensagemUsuario,
  });
  const fala = String(data?.respostaPersona ?? data?.RespostaPersona ?? '').trim();
  const finalizada = Boolean(data?.finalizada ?? data?.Finalizada);
  if (!fala) throw new Error('A persona não devolveu uma fala neste turno.');
  return { fala, finalizada };
}

function simuladorMostrarChat() {
  const setup = document.getElementById('simulador-setup');
  const chat = document.getElementById('simulador-chat');
  const feedback = document.getElementById('simulador-feedback');
  const meta = SIMULADOR_PERSONAS[simuladorEstado.persona] || SIMULADOR_PERSONAS.rh_cultura;
  if (setup) setup.hidden = true;
  if (feedback) feedback.hidden = true;
  if (chat) chat.hidden = false;
  const kicker = document.getElementById('simulador-chat-kicker');
  const title = document.getElementById('simulador-chat-title');
  const cenario = document.getElementById('simulador-chat-cenario');
  if (kicker) kicker.textContent = meta.kicker;
  if (title) title.textContent = meta.title;
  if (cenario) cenario.textContent = simuladorEstado.cenario;
  const input = document.getElementById('simulador-input');
  if (input) {
    input.disabled = false;
    input.focus();
  }
}

function simuladorMostrarFeedback(data) {
  const chat = document.getElementById('simulador-chat');
  const feedback = document.getElementById('simulador-feedback');
  if (chat) chat.hidden = true;
  if (feedback) feedback.hidden = false;

  const nota = Math.min(10, Math.max(0, Number(data?.nota ?? data?.Nota) || 0));
  const relatorio = String(data?.relatorio ?? data?.Relatorio ?? '').trim();
  const fortes = data?.pontosFortes ?? data?.PontosFortes ?? [];
  const melhorias = data?.pontosMelhoria ?? data?.PontosMelhoria ?? [];

  const notaEl = document.getElementById('simulador-nota');
  const relEl = document.getElementById('simulador-relatorio');
  if (notaEl) notaEl.textContent = String(nota);
  if (relEl) relEl.textContent = relatorio;

  const preencher = (id, itens) => {
    const ul = document.getElementById(id);
    if (!ul) return;
    ul.replaceChildren();
    (Array.isArray(itens) ? itens : []).forEach((item) => {
      const texto = String(item || '').trim();
      if (!texto) return;
      const li = document.createElement('li');
      li.textContent = texto;
      ul.appendChild(li);
    });
    if (!ul.children.length) {
      const li = document.createElement('li');
      li.textContent = 'Nenhum item informado.';
      ul.appendChild(li);
    }
  };
  preencher('simulador-fortes', fortes);
  preencher('simulador-melhorias', melhorias);
}

async function simuladorIniciar() {
  const cenario = String(document.getElementById('simulador-cenario')?.value || '').trim();
  if (!cenario) {
    simuladorSetStatus('simulador-setup-status', 'bad', 'Descreva o cenário da simulação.');
    document.getElementById('simulador-cenario')?.focus();
    return;
  }

  simuladorEstado = simuladorEstadoInicial();
  simuladorEstado.persona = simuladorPersonaSelecionada();
  simuladorEstado.cenario = cenario;
  simuladorEstado.ocupado = true;

  const btn = document.getElementById('simulador-iniciar');
  if (btn) btn.disabled = true;
  simuladorSetStatus('simulador-setup-status', '', 'Abrindo a simulação…');

  try {
    const { fala, finalizada } = await simuladorEnviarTurno('');
    simuladorEstado.historico.push({ remetente: 'persona', texto: fala });
    const log = document.getElementById('simulador-log');
    if (log) log.replaceChildren();
    simuladorMostrarChat();
    simuladorAppendBolha('persona', fala);
    simuladorSetStatus('simulador-setup-status', '', '');
    simuladorSetStatus('simulador-chat-status', '', '');
    if (finalizada) {
      simuladorEstado.encerrada = true;
      simuladorTravarChat(true);
      simuladorSetStatus('simulador-chat-status', 'ok', 'A persona encerrou. Veja o feedback.');
    }
  } catch (err) {
    simuladorSetStatus(
      'simulador-setup-status',
      'bad',
      err instanceof Error ? err.message : 'Falha ao iniciar a simulação.',
    );
  } finally {
    simuladorEstado.ocupado = false;
    if (btn) btn.disabled = false;
  }
}

async function simuladorEnviarFala(event) {
  event.preventDefault();
  if (simuladorEstado.ocupado || simuladorEstado.encerrada) return;
  const input = document.getElementById('simulador-input');
  const texto = String(input?.value || '').trim();
  if (!texto) return;

  simuladorEstado.ocupado = true;
  simuladorTravarChat(true);
  if (input) input.value = '';
  simuladorAppendBolha('usuario', texto);
  const pending = simuladorAppendBolha('persona', 'A persona está pensando…', true);
  simuladorSetStatus('simulador-chat-status', '', '');

  try {
    const { fala, finalizada } = await simuladorEnviarTurno(texto);
    simuladorEstado.historico.push(
      { remetente: 'usuario', texto },
      { remetente: 'persona', texto: fala },
    );
    if (pending) {
      pending.classList.remove('is-pending');
      pending.textContent = fala;
    }
    if (finalizada) {
      simuladorEstado.encerrada = true;
      simuladorSetStatus('simulador-chat-status', 'ok', 'A persona encerrou. Veja o feedback.');
    }
  } catch (err) {
    pending?.remove();
    simuladorSetStatus(
      'simulador-chat-status',
      'bad',
      err instanceof Error ? err.message : 'Falha ao enviar o turno.',
    );
  } finally {
    simuladorEstado.ocupado = false;
    simuladorTravarChat(simuladorEstado.encerrada);
    if (!simuladorEstado.encerrada) input?.focus();
  }
}

async function simuladorEncerrar() {
  if (simuladorEstado.ocupado) return;
  if (!simuladorEstado.historico.length) {
    simuladorSetStatus('simulador-chat-status', 'bad', 'Ainda não há conversa para avaliar.');
    return;
  }

  simuladorEstado.ocupado = true;
  simuladorTravarChat(true);
  simuladorSetStatus('simulador-chat-status', '', 'Montando o relatório…');

  try {
    const data = await simuladorPostJson('/api/simulacao/feedback', simuladorEstado.historico);
    simuladorEstado.encerrada = true;
    simuladorMostrarFeedback(data);
  } catch (err) {
    simuladorSetStatus(
      'simulador-chat-status',
      'bad',
      err instanceof Error ? err.message : 'Falha ao gerar o feedback.',
    );
    simuladorTravarChat(false);
  } finally {
    simuladorEstado.ocupado = false;
  }
}

function simuladorResetar() {
  simuladorEstado = simuladorEstadoInicial();
  const setup = document.getElementById('simulador-setup');
  const chat = document.getElementById('simulador-chat');
  const feedback = document.getElementById('simulador-feedback');
  const log = document.getElementById('simulador-log');
  if (setup) setup.hidden = false;
  if (chat) chat.hidden = true;
  if (feedback) feedback.hidden = true;
  if (log) log.replaceChildren();
  simuladorSetStatus('simulador-setup-status', '', '');
  simuladorSetStatus('simulador-chat-status', '', '');
  document.getElementById('simulador-cenario')?.focus();
}

function initSimuladorPage() {
  if (!document.getElementById('simulador-app')) return;
  document.getElementById('simulador-iniciar')?.addEventListener('click', () => void simuladorIniciar());
  document.getElementById('simulador-form')?.addEventListener('submit', (ev) => void simuladorEnviarFala(ev));
  document.getElementById('simulador-encerrar')?.addEventListener('click', () => void simuladorEncerrar());
  document.getElementById('simulador-nova')?.addEventListener('click', simuladorResetar);
}

window.initSimuladorPage = initSimuladorPage;
