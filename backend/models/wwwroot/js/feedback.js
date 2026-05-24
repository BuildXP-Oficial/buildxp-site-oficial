// BuildXP - feedback
/* ── FEEDBACK (Public wall) ─────────────────────────────────*/
function initFeedback() {
  const app = document.getElementById('feedback-app');
  if (!app) return;

  const LS_KEY = 'buildxp_feedback_v1';
  const banned = [
    'idiota', 'burro', 'bosta', 'merda', 'fdp', 'foda-se', 'foda se', 'caralho',
    'porra', 'desgraça', 'desgraca', 'otario', 'otária', 'otaria', 'imbecil',
    'racista', 'nazista', 'lixo', 'vagabundo', 'vagabunda', 'puta', 'puto', 'horrível',
  ];

  const form = document.getElementById('fb-form');
  const nameEl = document.getElementById('fb-name');
  const kindEl = document.getElementById('fb-kind');
  const msgEl = document.getElementById('fb-msg');
  const statusEl = document.getElementById('fb-status');
  const listEl = document.getElementById('fb-list');
  const emptyEl = document.getElementById('fb-empty');
  const muralFilterEl = document.getElementById('fb-mural-filter');
  const muralScrollEl = document.querySelector('.fb-mural-scroll');
  const submitBtn = form?.querySelector('button[type="submit"]');
  let feedbackSubmitting = false;
  const muralMobileMq = window.matchMedia('(max-width: 768px)');
  const muralListGapPx = 12;
  let muralResizeTimer = 0;

  const norm = (s) =>
    String(s ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();

  const containsBanned = (text) => {
    const t = norm(text);
    return banned.find((w) => t.includes(w)) ?? null;
  };

  const fmtDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return '';
    }
  };

  function setStatus(text, type) {
    statusEl.textContent = text || '';
    statusEl.classList.toggle('ok', type === 'ok');
    statusEl.classList.toggle('bad', type === 'bad');
  }

  function updateFeedbackSubmitState() {
    const kind = String(kindEl?.value ?? '').trim();
    if (submitBtn) submitBtn.disabled = feedbackSubmitting || !kind;
  }

  function resetFeedbackForm() {
    if (nameEl) nameEl.value = '';
    if (kindEl) kindEl.value = '';
    if (msgEl) msgEl.value = '';
    updateFeedbackSubmitState();
  }

  const feedbackApiPrefix = () =>
    typeof getBuildXpApiBase === 'function' ? String(getBuildXpApiBase()).replace(/\/$/, '') : '';

  function mapApiFeedbackToWallItem(f) {
    const rawMsg = f.mensagem ?? f.Mensagem ?? '';
    let kind = String(f.categoria ?? f.Categoria ?? '').trim();
    let msg = String(rawMsg);
    if (!kind) {
      const bracket = msg.match(/^\[([^\]]+)\]\s*\n*/);
      if (bracket) {
        kind = bracket[1];
        msg = msg.slice(bracket[0].length).trim();
      }
    }
    if (!kind) kind = 'Feedback';
    return {
      id: String(f.id ?? ''),
      name: String(f.nome ?? f.Nome ?? '').slice(0, 100),
      kind,
      msg: msg.slice(0, 1000),
      createdAt: f.criadoEm ?? f.CriadoEm ?? new Date().toISOString(),
    };
  }

  async function fetchApprovedFromApi() {
    try {
      const url = `${feedbackApiPrefix()}/api/feedback/aprovados`;
      const res = await fetch(url, {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!Array.isArray(data)) return null;
      return data.map(mapApiFeedbackToWallItem);
    } catch {
      return null;
    }
  }

  let displayItems = [];
  let muralApiUnavailable = false;

  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    /* ignore */
  }

  function syncMuralMobileScrollHeight() {
    if (!muralScrollEl) return;
    if (!muralMobileMq.matches) {
      muralScrollEl.style.maxHeight = '';
      return;
    }
    const items = [...muralScrollEl.querySelectorAll('.fb-item')];
    if (items.length === 0) {
      muralScrollEl.style.maxHeight = '';
      return;
    }
    const visibleCount = Math.min(3, items.length);
    let h = 0;
    for (let i = 0; i < visibleCount; i += 1) {
      h += items[i].offsetHeight;
      if (i < visibleCount - 1) h += muralListGapPx;
    }
    muralScrollEl.style.maxHeight = `${Math.ceil(h)}px`;
  }

  function scheduleMuralScrollSync() {
    requestAnimationFrame(syncMuralMobileScrollHeight);
  }

  function render() {
    const filterKind = String(muralFilterEl?.value ?? '').trim();
    const items = !filterKind
      ? displayItems
      : displayItems.filter((it) => String(it.kind || '').trim() === filterKind);

    listEl.innerHTML = '';
    if (items.length === 0) {
      emptyEl.style.display = '';
      if (muralApiUnavailable && emptyEl) {
        emptyEl.textContent =
          'Não foi possível carregar o mural. Só são mostradas mensagens já publicadas — volte mais tarde.';
      } else if (emptyEl) {
        emptyEl.textContent = filterKind
          ? 'Nenhum feedback nesta categoria.'
          : 'Nenhum feedback ainda. Seja o primeiro.';
      }
    } else {
      emptyEl.style.display = 'none';
    }

    items
      .slice()
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .forEach((it) => {
        const div = document.createElement('div');
        div.className = 'fb-item';
        div.innerHTML = `
          <div class="fb-item-top">
            <span class="fb-kind"></span>
            <span class="fb-meta"></span>
          </div>
          <div class="fb-msg"></div>
        `;
        div.querySelector('.fb-kind').textContent = it.kind;
        div.querySelector('.fb-meta').textContent = `${it.name ? `${it.name} · ` : ''}${fmtDate(it.createdAt)}`;
        div.querySelector('.fb-msg').textContent = it.msg;
        listEl.appendChild(div);
      });

    scheduleMuralScrollSync();
  }

  async function refreshWall() {
    const remote = await fetchApprovedFromApi();
    if (remote !== null) {
      displayItems = remote;
      muralApiUnavailable = false;
    } else {
      displayItems = [];
      muralApiUnavailable = true;
    }
    render();
  }

  muralFilterEl?.addEventListener('change', () => render());
  muralMobileMq.addEventListener('change', scheduleMuralScrollSync);
  window.addEventListener('resize', () => {
    clearTimeout(muralResizeTimer);
    muralResizeTimer = setTimeout(scheduleMuralScrollSync, 120);
  });
  kindEl?.addEventListener('change', updateFeedbackSubmitState);
  msgEl?.addEventListener('input', updateFeedbackSubmitState);
  updateFeedbackSubmitState();

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (feedbackSubmitting) return;
    setStatus('', '');

    const name = String(nameEl?.value ?? '').trim().slice(0, 40);
    const kind = String(kindEl?.value ?? '').trim().slice(0, 40);
    const msg = String(msgEl?.value ?? '').trim();

    if (!kind) {
      setStatus('Selecione uma categoria antes de publicar.', 'bad');
      updateFeedbackSubmitState();
      return;
    }

    if (msg.length < 6) {
      setStatus('Escreva uma mensagem um pouco maior (mínimo 6 caracteres).', 'bad');
      return;
    }

    const badWord = containsBanned(msg + ' ' + name);
    if (badWord) {
      setStatus('Não foi possível publicar. Palavra não permitida detectada.', 'bad');
      return;
    }

    const payload = {
      categoria: kind,
      mensagem: msg.slice(0, 1000),
    };
    if (name) payload.nome = name.slice(0, 100);

    feedbackSubmitting = true;
    if (submitBtn) submitBtn.disabled = true;

    try {
      const url = `${feedbackApiPrefix()}/api/feedback`;
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        resetFeedbackForm();
        setStatus(
          'Obrigado pelo seu Feedback! Ele será em breve aprovado por um de nossos administradores.',
          'ok',
        );
        await refreshWall();
        return;
      }
      setStatus('Não foi possível enviar, tente novamente mais tarde!', 'bad');
    } catch {
      setStatus('Não foi possível enviar, tente novamente mais tarde!', 'bad');
    } finally {
      feedbackSubmitting = false;
      updateFeedbackSubmitState();
    }
  });

  refreshWall();
}
