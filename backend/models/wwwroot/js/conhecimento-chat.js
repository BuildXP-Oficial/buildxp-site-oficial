// BuildXP — assistente flutuante nas telas de conhecimento (card.html)
function conhecimentoChatApiBase() {
  if (typeof getBuildXpApiBase === 'function') return String(getBuildXpApiBase()).replace(/\/$/, '');
  if (typeof window.BUILDXP_API_BASE === 'string' && window.BUILDXP_API_BASE.trim()) {
    return window.BUILDXP_API_BASE.trim().replace(/\/$/, '');
  }
  return '';
}

function ehTelaConhecimentoChat() {
  const path = String(window.location.pathname || '').toLowerCase();
  if (path.includes('card.html')) return true;
  if (document.getElementById('page-root')) return true;
  try {
    if (new URLSearchParams(window.location.search).get('slug')) return true;
  } catch {
    /* ignore */
  }
  return false;
}

function tituloCardConhecimento() {
  const data = document.documentElement.dataset.bxpCardTitle;
  if (data && data.trim()) return data.trim();
  const el = document.querySelector('.page-title');
  if (el && el.textContent.trim()) return el.textContent.trim();
  const slug = slugCardConhecimento();
  const nomes = {
    git: 'Git',
    docker: 'Docker',
    npm: 'NPM',
    dotnet: '.NET',
    python: 'Python',
    java: 'Java',
    api: 'APIs',
    ia: 'IA',
    integrandoumaapi: 'APIs',
  };
  return nomes[slug] || slug || 'este card';
}

function slugCardConhecimento() {
  const data = document.documentElement.dataset.bxpCardSlug;
  if (data && data.trim()) return data.trim().toLowerCase();
  try {
    return String(new URLSearchParams(window.location.search).get('slug') || '')
      .trim()
      .toLowerCase();
  } catch {
    return '';
  }
}

function initConhecimentoChat() {
  if (!ehTelaConhecimentoChat()) return;
  if (document.getElementById('bxp-conhecimento-chat')) {
    atualizarCabecalhoConhecimentoChat();
    return;
  }

  const root = document.createElement('div');
  root.id = 'bxp-conhecimento-chat';

  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'bxp-chat-fab';
  fab.setAttribute('aria-label', 'Abrir assistente do card');
  fab.setAttribute('aria-expanded', 'false');
  fab.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8.5 8.5 0 0 1-8.5 8.5H7l-4 3V12A8.5 8.5 0 1 1 21 12z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/></svg><span class="bxp-chat-fab-label">AJUDA</span>';

  const panel = document.createElement('section');
  panel.className = 'bxp-chat-panel';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'Chat do assistente de conhecimento');

  const head = document.createElement('div');
  head.className = 'bxp-chat-head';
  const headCopy = document.createElement('div');
  headCopy.className = 'bxp-chat-head-copy';
  const kicker = document.createElement('div');
  kicker.className = 'bxp-chat-kicker';
  kicker.textContent = 'Assistente BuildXP';
  const title = document.createElement('div');
  title.className = 'bxp-chat-title';
  title.id = 'bxp-chat-title';
  headCopy.append(kicker, title);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'bxp-chat-close';
  close.setAttribute('aria-label', 'Fechar chat');
  close.textContent = '×';
  head.append(headCopy, close);

  const log = document.createElement('div');
  log.className = 'bxp-chat-log';
  log.id = 'bxp-chat-log';

  const form = document.createElement('form');
  form.className = 'bxp-chat-form';
  const input = document.createElement('input');
  input.className = 'bxp-chat-input';
  input.id = 'bxp-chat-input';
  input.type = 'text';
  input.autocomplete = 'off';
  input.placeholder = 'Pergunte sobre este card…';
  const send = document.createElement('button');
  send.type = 'submit';
  send.className = 'bxp-chat-send';
  send.textContent = 'ENVIAR';
  form.append(input, send);

  panel.append(head, log, form);
  root.append(panel, fab);
  document.body.appendChild(root);

  function abrir() {
    panel.hidden = false;
    fab.classList.add('is-open');
    fab.setAttribute('aria-expanded', 'true');
    atualizarCabecalhoConhecimentoChat();
    input.focus();
    log.scrollTop = log.scrollHeight;
  }

  function fechar() {
    panel.hidden = true;
    fab.classList.remove('is-open');
    fab.setAttribute('aria-expanded', 'false');
  }

  fab.addEventListener('click', () => {
    if (panel.hidden) abrir();
    else fechar();
  });
  close.addEventListener('click', fechar);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    void enviarMensagemConhecimentoChat(input, send, log);
  });

  atualizarCabecalhoConhecimentoChat();
  acrescentarBolhaConhecimento(log, 'agent', `Posso tirar dúvidas sobre a explicação de ${tituloCardConhecimento()}. Pergunte sobre um comando, um conceito ou um passo do card.`);

  const pageRoot = document.getElementById('page-root');
  if (pageRoot && typeof MutationObserver === 'function') {
    const obs = new MutationObserver(() => atualizarCabecalhoConhecimentoChat());
    obs.observe(pageRoot, { childList: true, subtree: true, characterData: true });
  }
}

function atualizarCabecalhoConhecimentoChat() {
  const title = document.getElementById('bxp-chat-title');
  if (!title) return;
  title.textContent = `Especialista em ${tituloCardConhecimento()}`;
}

function acrescentarBolhaConhecimento(log, papel, texto) {
  const bubble = document.createElement('div');
  bubble.className = `bxp-chat-bubble bxp-chat-bubble--${papel}`;
  bubble.textContent = texto;
  log.appendChild(bubble);
  log.scrollTop = log.scrollHeight;
  return bubble;
}

async function enviarMensagemConhecimentoChat(input, send, log) {
  const texto = String(input.value || '').trim();
  if (!texto || input.disabled) return;

  acrescentarBolhaConhecimento(log, 'user', texto);
  input.value = '';
  input.disabled = true;
  send.disabled = true;
  const pending = acrescentarBolhaConhecimento(log, 'agent', 'Consultando o especialista…');
  pending.classList.add('bxp-chat-bubble--pending');

  try {
    const res = await fetch(`${conhecimentoChatApiBase()}/api/conhecimento/chat`, {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mensagemUsuario: texto,
        temaOuCardAtual: slugCardConhecimento() || tituloCardConhecimento(),
      }),
    });
    if (!res.ok) {
      let mensagem = 'Não foi possível responder agora. Tente de novo em instantes.';
      try {
        const err = await res.json();
        if (err?.mensagem) mensagem = String(err.mensagem);
      } catch {
        /* mantém padrão */
      }
      throw new Error(mensagem);
    }
    const data = await res.json();
    const resposta = String(data?.respostaAgente ?? data?.RespostaAgente ?? '').trim();
    if (!resposta) throw new Error('O assistente não devolveu uma resposta. Tente de novo.');
    pending.classList.remove('bxp-chat-bubble--pending');
    pending.textContent = resposta;
  } catch (err) {
    pending.classList.remove('bxp-chat-bubble--pending');
    pending.textContent = err instanceof Error ? err.message : 'Falha ao falar com o assistente.';
  } finally {
    input.disabled = false;
    send.disabled = false;
    input.focus();
    log.scrollTop = log.scrollHeight;
  }
}

window.initConhecimentoChat = initConhecimentoChat;

(function agendarInitConhecimentoChat() {
  const rodar = () => {
    try {
      initConhecimentoChat();
    } catch (err) {
      console.error('[BuildXP] Falha ao iniciar o assistente de conhecimento', err);
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', rodar);
  } else {
    rodar();
  }
  window.setTimeout(rodar, 400);
  window.setTimeout(rodar, 1200);
})();
