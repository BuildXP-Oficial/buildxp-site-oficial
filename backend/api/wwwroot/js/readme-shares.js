function readmeShareGithubSvg() {
  return '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12 3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>';
}

function readmeShareEscape(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function readmeShareApiBase() {
  if (typeof getBuildXpApiBase === 'function') return String(getBuildXpApiBase()).replace(/\/$/, '');
  if (typeof window.BUILDXP_API_BASE === 'string') return window.BUILDXP_API_BASE.trim().replace(/\/$/, '');
  return '';
}

function readmeShareNormalizeFinType(raw) {
  return String(raw || '').trim().toLowerCase() === 'readmelabs' ? 'readmelabs' : 'terminal';
}

const README_SHARE_OWNED_KEY = 'buildxp-readme-share-owned';

function readmeShareOwnedMap() {
  try {
    const raw = JSON.parse(localStorage.getItem(README_SHARE_OWNED_KEY) || '{}');
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  } catch {
    return {};
  }
}

function readmeShareRememberOwned(id, token) {
  const key = String(id || '').trim();
  const tok = String(token || '').trim();
  if (!key || !tok) return;
  const map = readmeShareOwnedMap();
  map[key] = tok;
  localStorage.setItem(README_SHARE_OWNED_KEY, JSON.stringify(map));
}

function readmeShareForgetOwned(id) {
  const map = readmeShareOwnedMap();
  delete map[String(id)];
  localStorage.setItem(README_SHARE_OWNED_KEY, JSON.stringify(map));
}

function readmeShareOwnedToken(id) {
  return String(readmeShareOwnedMap()[String(id)] || '').trim();
}

function buildxpReadmeShareFormHtml() {
  return `
    <form class="card-fim-share-form" hidden>
      <label class="fb-label">Nome
        <input class="fb-input" name="nome" maxlength="80" placeholder="Como você quer aparecer" required />
      </label>
      <label class="fb-label">Link do GitHub
        <input class="fb-input" name="link" maxlength="500" placeholder="https://github.com/usuario" required />
      </label>
      <p class="dash-muted card-fim-share-hint">Se precisar excluir o seu link, <a href="index.html#contact">entre em contato</a>.</p>
      <button type="submit" class="term-btn primary">Salvar</button>
      <div class="card-fim-share-status fb-status" aria-live="polite"></div>
    </form>`;
}

function readmeShareDisplayName(value) {
  const cleaned = String(value || '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'README';
}

function buildxpReadmeShareListShellHtml() {
  return `
    <div class="card-fim-shares">
      <div class="card-fim-shares-title">READMES DA COMUNIDADE</div>
      <div class="card-fim-shares-list"></div>
      <div class="card-fim-share-empty">A carregar a lista…</div>
    </div>`;
}

function readmeShareFindRoot(fromEl) {
  return fromEl?.closest?.('#readme-lab-share-root, .step--fim, [data-fin-type="readmelabs"]')
    || document.getElementById('readme-lab-share-root')
    || document.querySelector('.step--fim[data-fin-type="readmelabs"]')
    || document.querySelector('.step--fim');
}

function readmeShareEnsureMarkup(root) {
  if (!root) return null;
  if (!root.querySelector('.card-fim-share-form')) {
    const actions = root.querySelector('.card-fim-actions, .term-actions');
    if (actions) actions.insertAdjacentHTML('afterend', buildxpReadmeShareFormHtml());
    else root.insertAdjacentHTML('beforeend', buildxpReadmeShareFormHtml());
  }
  if (!root.querySelector('.card-fim-shares')) {
    root.insertAdjacentHTML('beforeend', buildxpReadmeShareListShellHtml());
  }
  return root.querySelector('.card-fim-share-form');
}

function readmeShareNotifyLayout() {
  window.dispatchEvent(new Event('buildxp:readme-share-toggle'));
  window.dispatchEvent(new Event('resize'));
}

function buildxpOpenReadmeShareForm(root) {
  const host = root || readmeShareFindRoot(document.body);
  const form = readmeShareEnsureMarkup(host);
  if (!form) return;
  form.removeAttribute('hidden');
  form.classList.add('is-open');
  form.style.display = 'flex';
  const nome = form.querySelector('input[name="nome"]');
  window.requestAnimationFrame(() => {
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    nome?.focus();
    readmeShareNotifyLayout();
  });
}

function buildxpToggleReadmeShareForm(root) {
  const host = root || readmeShareFindRoot(document.body);
  const form = readmeShareEnsureMarkup(host);
  if (!form) return;
  const isOpen = form.classList.contains('is-open') && !form.hasAttribute('hidden');
  if (isOpen) {
    form.setAttribute('hidden', '');
    form.classList.remove('is-open');
    form.style.display = 'none';
    readmeShareNotifyLayout();
    return;
  }
  buildxpOpenReadmeShareForm(host);
}

function readmeShareNormalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.$values)) return data.$values;
  return [];
}

async function buildxpLoadReadmeShares(root) {
  if (!root) return;
  const listEl = root.querySelector('.card-fim-shares-list');
  const emptyEl = root.querySelector('.card-fim-share-empty');
  if (!listEl) return;
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = window.setTimeout(() => ctrl?.abort(), 8000);
  try {
    const res = await fetch(`${readmeShareApiBase()}/api/readme-shares`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      credentials: 'same-origin',
      signal: ctrl?.signal,
    });
    if (!res.ok) throw new Error('list');
    const data = await res.json();
    const list = readmeShareNormalizeList(data);
    listEl.innerHTML = list.map((item) => {
      const nome = readmeShareEscape(readmeShareDisplayName(item.nome || item.Nome || ''));
      const link = readmeShareEscape(item.githubLink || item.GithubLink || item.link || '#');
      return `<div class="card-fim-share-row">
        <a class="card-fim-share-item" href="${link}" target="_blank" rel="noopener noreferrer">${readmeShareGithubSvg()}<span>${nome}</span></a>
      </div>`;
    }).join('');
    listEl.classList.toggle('is-scrollable', list.length >= 4);
    if (emptyEl) {
      emptyEl.hidden = list.length > 0;
      emptyEl.textContent = list.length > 0 ? '' : 'Nenhum README compartilhado ainda.';
    }
    readmeShareNotifyLayout();
  } catch {
    listEl.innerHTML = '';
    listEl.classList.remove('is-scrollable');
    if (emptyEl) {
      emptyEl.hidden = false;
      emptyEl.textContent = 'Não foi possível carregar a lista.';
    }
  } finally {
    window.clearTimeout(timer);
  }
}

function buildxpBindReadmeShares(root, slug) {
  if (!root) return;
  readmeShareEnsureMarkup(root);
  if (root.dataset.readmeSharesBound === '1') {
    void buildxpLoadReadmeShares(root);
    return;
  }
  root.dataset.readmeSharesBound = '1';
  const form = root.querySelector('.card-fim-share-form');
  const status = root.querySelector('.card-fim-share-status');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = form.querySelector('input[name="nome"]')?.value?.trim() || '';
    const link = form.querySelector('input[name="link"]')?.value?.trim() || '';
    if (status) {
      status.textContent = '';
      status.classList.remove('ok', 'bad');
    }
    try {
      const res = await fetch(`${readmeShareApiBase()}/api/readme-shares`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ nome, githubLink: link, link, slug: slug || null }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.message || 'Não foi possível salvar.');
      }
      form.reset();
      form.setAttribute('hidden', '');
      form.classList.remove('is-open');
      form.style.display = 'none';
      if (status) {
        status.textContent = 'Entrou na lista.';
        status.classList.add('ok');
      }
      readmeShareNotifyLayout();
      await buildxpLoadReadmeShares(root);
    } catch (err) {
      if (status) {
        status.textContent = err?.message || 'Não foi possível salvar.';
        status.classList.add('bad');
      }
    }
  });
  void buildxpLoadReadmeShares(root);
}

function buildxpInitReadmeLabPage() {
  const shareRoot = document.getElementById('readme-lab-share-root');
  if (!shareRoot) return;
  const params = new URLSearchParams(window.location.search);
  const slug = String(params.get('slug') || '').trim().toLowerCase();
  buildxpBindReadmeShares(shareRoot, slug);
}

if (!window.__buildxpReadmeShareClickBound) {
  window.__buildxpReadmeShareClickBound = true;
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-mostre-seu], #md-btn-mostre-seu');
    if (!btn) return;
    e.preventDefault();
    const labRoot = document.getElementById('readme-lab-share-root');
    if (btn.id === 'md-btn-mostre-seu') {
      const guest = document.getElementById('md-btn-guest');
      if (guest && document.body.classList.contains('md-gate-open')) {
        guest.click();
      }
      window.setTimeout(() => buildxpOpenReadmeShareForm(labRoot), 80);
      return;
    }
    const root = readmeShareFindRoot(btn);
    if (!root) return;
    if (root.dataset.readmeSharesBound !== '1') {
      const params = new URLSearchParams(window.location.search);
      buildxpBindReadmeShares(root, String(params.get('slug') || '').trim().toLowerCase());
    }
    buildxpToggleReadmeShareForm(root);
  });
}

window.readmeShareNormalizeFinType = readmeShareNormalizeFinType;
window.buildxpInitReadmeLabPage = buildxpInitReadmeLabPage;
window.buildxpReadmeShareFormHtml = buildxpReadmeShareFormHtml;
window.buildxpReadmeShareListShellHtml = buildxpReadmeShareListShellHtml;
window.buildxpBindReadmeShares = buildxpBindReadmeShares;
window.buildxpLoadReadmeShares = buildxpLoadReadmeShares;
window.buildxpOpenReadmeShareForm = buildxpOpenReadmeShareForm;
window.buildxpToggleReadmeShareForm = buildxpToggleReadmeShareForm;

if (document.getElementById('readme-lab-share-root')) {
  buildxpInitReadmeLabPage();
}
