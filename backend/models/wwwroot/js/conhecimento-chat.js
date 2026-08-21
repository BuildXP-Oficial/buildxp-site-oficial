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
  const el = document.querySelector('#page-root .page-title, .page-hero .page-title, .page-title');
  if (el && el.textContent.trim()) return el.textContent.trim();
  const data = document.documentElement.dataset.bxpCardTitle;
  if (data && data.trim()) return data.trim();
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
  try {
    const querySlug = String(new URLSearchParams(window.location.search).get('slug') || '')
      .trim()
      .toLowerCase();
    if (querySlug) return querySlug;
  } catch {
    /* ignore */
  }
  const data = document.documentElement.dataset.bxpCardSlug;
  if (data && data.trim()) return data.trim().toLowerCase();
  return '';
}

function sincronizarTemaCardAtual() {
  const titulo = tituloCardConhecimento();
  const slug = slugCardConhecimento();
  if (titulo) document.documentElement.dataset.bxpCardTitle = titulo;
  if (slug) document.documentElement.dataset.bxpCardSlug = slug;
  return titulo;
}

function temaCardAtualParaEnvio() {
  const titulo = sincronizarTemaCardAtual();
  return titulo || slugCardConhecimento() || 'este card';
}

function conteudoCardAtualParaEnvio() {
  const partes = [];
  const root = document.getElementById('page-root');
  if (!root) return '';

  const titulo = root.querySelector('.page-title');
  if (titulo && titulo.textContent.trim()) partes.push(`Título: ${titulo.textContent.trim()}`);

  const steps = document.getElementById('steps-root');
  if (steps) {
    const texto = String(steps.innerText || '').replace(/\n{3,}/g, '\n\n').trim();
    if (texto) partes.push(`Trilha iniciante:\n${texto}`);
  }

  const refs = document.getElementById('ref');
  if (refs) {
    const texto = String(refs.innerText || '').replace(/\n{3,}/g, '\n\n').trim();
    if (texto) partes.push(`Cheap codes:\n${texto}`);
  }

  return partes.join('\n\n').slice(0, 6000);
}

function coletarHistoricoConhecimento(log, excluir) {
  const itens = [];
  log.querySelectorAll('.bxp-chat-bubble').forEach((el) => {
    if (el === excluir || el.classList.contains('bxp-chat-bubble--pending')) return;
    const texto = String(el.dataset.bxpChatTexto || '').trim();
    if (!texto) return;
    const papel = el.classList.contains('bxp-chat-bubble--user') ? 'user' : 'assistant';
    itens.push({ papel, conteudo: texto });
  });
  return itens.slice(-8);
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
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8.5 8.5 0 0 1-8.5 8.5H7l-4 3V12A8.5 8.5 0 1 1 21 12z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/></svg><span class="bxp-chat-fab-label">ASK AI</span>';

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
  sincronizarTemaCardAtual();
  const title = document.getElementById('bxp-chat-title');
  if (!title) return;
  title.textContent = `Especialista em ${tituloCardConhecimento()}`;
}

function escapeHtmlConhecimentoChat(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderizarMarkdownConhecimentoChat(texto) {
  const blocos = [];
  let html = escapeHtmlConhecimentoChat(texto);
  html = html.replace(/```[a-zA-Z0-9_-]*\n?([\s\S]*?)```/g, (_, code) => {
    const i = blocos.length;
    blocos.push(`<pre class="bxp-chat-code"><code>${code.replace(/^\n+|\n+$/g, '')}</code></pre>`);
    return `\u0000BXPCODE${i}\u0000`;
  });
  html = html.replace(/`([^`\n]+)`/g, '<code class="bxp-chat-inline-code">$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\n/g, '<br>');
  html = html.replace(/\u0000BXPCODE(\d+)\u0000/g, (_, i) => blocos[Number(i)] || '');
  return html;
}

function preencherBolhaConhecimento(bubble, papel, texto) {
  bubble.dataset.bxpChatTexto = String(texto ?? '');
  if (papel === 'agent') {
    bubble.innerHTML = renderizarMarkdownConhecimentoChat(texto);
  } else {
    bubble.textContent = texto;
  }
}

function acrescentarBolhaConhecimento(log, papel, texto) {
  const bubble = document.createElement('div');
  bubble.className = `bxp-chat-bubble bxp-chat-bubble--${papel}`;
  preencherBolhaConhecimento(bubble, papel, texto);
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
        temaOuCardAtual: temaCardAtualParaEnvio(),
        conteudoCard: conteudoCardAtualParaEnvio(),
        historico: coletarHistoricoConhecimento(log, pending),
      }),
    });
    if (!res.ok) {
      let mensagem = res.status === 429
        ? 'Muitas perguntas em pouco tempo. Espere um instante e tente de novo.'
        : 'Não foi possível responder agora. Tente de novo em instantes.';
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
    preencherBolhaConhecimento(pending, 'agent', resposta);
  } catch (err) {
    pending.classList.remove('bxp-chat-bubble--pending');
    const falha = err instanceof Error ? err.message : 'Falha ao falar com o assistente.';
    pending.dataset.bxpChatTexto = falha;
    pending.textContent = falha;
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
