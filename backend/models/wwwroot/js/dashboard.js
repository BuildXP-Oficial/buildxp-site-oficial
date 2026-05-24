// BuildXP - dashboard
function dashEscapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** &lt;b&gt; → &lt;strong&gt; (execCommand / Word); negrito inline alinhado ao site estático. */
function dashNormalizeSlideBoldTags(html) {
  return String(html ?? '')
    .replace(/<\/b>/gi, '</strong>')
    .replace(/<b(\s[^>]*)?>/gi, '<strong$1>');
}

/** Em HTML de slide, newlines do editor entre tags viram quebra feia; colapsa só quando há tags. */
function dashCollapseNewlinesInSlideHtmlIfTagged(s) {
  const t = String(s ?? '').trim();
  if (!t || !/<[a-z][\s\S]*>/i.test(t)) return t;
  return t.replace(/\r\n|\r|\n/g, ' ');
}

/** Envolve a seleção do textarea com etiquetas (negrito &lt;strong&gt;, inline). */
function dashTextareaWrapSelection(textarea, openTag, closeTag, placeholder) {
  const ta = textarea;
  if (!ta || ta.tagName !== 'TEXTAREA') return;
  const ph = placeholder ?? 'texto';
  const start = typeof ta.selectionStart === 'number' ? ta.selectionStart : 0;
  const end = typeof ta.selectionEnd === 'number' ? ta.selectionEnd : start;
  const v = ta.value;
  const sel = v.slice(start, end);
  const inner = sel || ph;
  const insertion = openTag + inner + closeTag;
  ta.value = v.slice(0, start) + insertion + v.slice(end);
  const innerStart = start + openTag.length;
  const innerEnd = innerStart + inner.length;
  ta.selectionStart = innerStart;
  ta.selectionEnd = innerEnd;
  ta.focus();
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}

function dashBindSlideStrongToolbar(wrapEl) {
  if (!wrapEl) return;
  wrapEl.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.dash-slide-fmt-strong');
    if (!btn || !wrapEl.contains(btn)) return;
    ev.preventDefault();
    const pane = btn.closest('[data-ipane="text"]');
    const ta = pane
      ? pane.querySelector('textarea[data-f="text"]')
      : wrapEl.querySelector('textarea[data-f="text"]');
    if (ta) dashTextareaWrapSelection(ta, '<strong>', '</strong>', 'texto');
  });
}

/** Junta texto, comandos e observação num único HTML guardado em `Slide.Descricao` (a BD só tem Titulo+Descricao). */
function dashComposeContentSlideDescricaoForApi(slide) {
  const parts = [];
  if (slide.text?.trim()) {
    parts.push(
      dashCollapseNewlinesInSlideHtmlIfTagged(dashNormalizeSlideBoldTags(slide.text.trim())),
    );
  }
  if (slide.commands?.trim()) {
    const codeEsc = dashEscapeHtml(slide.commands.trim());
    parts.push(
      `<div class="cmd-block"><button type="button" class="copy-btn">copy</button><code>${codeEsc}</code></div>`,
    );
  }
  if (slide.observation?.trim()) {
    parts.push(
      `<div class="callout callout-tip">${dashCollapseNewlinesInSlideHtmlIfTagged(dashNormalizeSlideBoldTags(slide.observation.trim()))}</div>`,
    );
  }
  /* '' evita texto final + cmd-block ficarem como nós texto \\n fictícios (quebras falsas na UI) */
  return parts.join('');
}

function dashComposePauseDescricaoForApi(slide) {
  const parts = [];
  if (slide.text?.trim()) {
    const t = dashCollapseNewlinesInSlideHtmlIfTagged(dashNormalizeSlideBoldTags(slide.text.trim()));
    parts.push(/<[a-z][\s\S]*>/i.test(t) ? t : `<div class="step-desc">${t}</div>`);
  }
  if (slide.observation?.trim()) {
    parts.push(
      `<div class="callout callout-tip">${dashCollapseNewlinesInSlideHtmlIfTagged(dashNormalizeSlideBoldTags(slide.observation.trim()))}</div>`,
    );
  }
  return parts.join('') || '<div class="step-desc"></div>';
}

/** Payload para PUT /api/card/{slug}/slides/sync (substitui a trilha inteira, sem duplicar). */
function dashSlidesToSyncPayload(slides) {
  return (slides ?? []).map((slide, idx) => {
    const body = dashSlideToApiBody(slide, idx);
    return {
      ordem: body.ordem,
      titulo: body.titulo,
      descricao: body.descricao,
    };
  });
}

/** Corpo JSON para POST slide na API (campos que o modelo `Slide` persiste). */
function dashSlideToApiBody(slide, idx) {
  const ordem = idx + 1;
  if (slide.type === 'pause') {
    return {
      cardId: 0,
      ordem,
      titulo: BUILDXP_SLIDE_PAUSE_TITULO,
      descricao: dashComposePauseDescricaoForApi(slide),
      ativo: true,
    };
  }
  const titulo = (slide.title || '').trim() || `Slide ${ordem}`;
  return {
    cardId: 0,
    ordem,
    titulo,
    descricao: dashComposeContentSlideDescricaoForApi(slide),
    ativo: true,
  };
}

function buildWizCardPayloadForApi(slug, meta, themeRaw) {
  const theme =
    String(themeRaw || 'git')
      .trim()
      .toLowerCase()
      .replace(/[^a-z]/g, '') || 'git';
  const wizHex = buildxpNormalizeHexColor(document.getElementById('dash-wiz-border-hex')?.value);
  const border_color = wizHex ?? buildxpPresetHexForTheme(themeRaw);
  // BD: máx. 512 chars — priorizar caminho do upload; data URL longa não serve.
  const fromPath = String(meta.iconPath || '').trim();
  const rawIcon =
    fromPath ||
    (meta.iconDataUrl && String(meta.iconDataUrl).trim().startsWith('data:')
      ? ''
      : String(meta.iconDataUrl || '').trim());
  const iconPri = String(rawIcon || '').trim() || 'imagens/logo2buildxpret.png';
  const desc = meta.desc || '';
  const description_html =
    !desc ? '<p></p>' : /<[a-z][\s\S]*>/i.test(desc) ? desc : `<p>${dashEscapeHtml(desc).replace(/\n/g, '<br>')}</p>`;
  const slugNorm =
    slug && String(slug).trim()
      ? String(slug)
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '')
          .slice(0, 48)
      : null;
  return {
    slug: slugNorm,
    theme,
    border_color,
    rarity_label: meta.badge,
    card_class: meta.cardClass,
    display_name: meta.title,
    description_html,
    link_beginner: slugNorm ? buildxpPublicCardHref(slugNorm, 'beginner') : '',
    link_ref: slugNorm ? buildxpPublicCardHref(slugNorm, 'ref') : '',
    xp_current: meta.xpCurrent,
    xp_max: meta.xpMax,
    sort_order: 10,
    btn_primary_label: '▶ COMEÇAR',
    btn_secondary_label: '🎮 CHEAT CODES',
    icon_layout: 'single',
    icon_primary_src: iconPri,
    icon_primary_alt: meta.title || slugNorm || 'Card',
    icon_secondary_src: null,
    icon_secondary_alt: '',
    is_published: true,
  };
}

function dashNormalizeFeedbackStatus(raw) {
  const v = raw?.status ?? raw?.Status;
  if (typeof v === 'number') {
    if (v === 0) return 'pending';
    if (v === 1) return 'approved';
    if (v === 2) return 'rejected';
  }
  const s = String(v ?? '').toLowerCase();
  if (s === 'pendente' || s === 'pending') return 'pending';
  if (s === 'aprovado' || s === 'approved') return 'approved';
  if (s === 'rejeitado' || s === 'rejected') return 'rejected';
  return 'pending';
}

/** Data da decisão (<code>AvaliadoEm</code>) para <code>fmtDate</code>. */
function dashFeedbackIsoDate(raw) {
  const v = raw?.avaliadoEm ?? raw?.AvaliadoEm ?? '';
  if (v == null || v === '') return '';
  try {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? String(v) : d.toISOString();
  } catch (_) {
    return String(v);
  }
}

function dashNormalizePending(raw) {
  const id = raw.id ?? raw.Id ?? raw.uuid;
  if (id === undefined || id === null) return null;
  const name = raw.author_name ?? raw.name ?? raw.nome ?? '';
  const rawMsg = raw.message ?? raw.msg ?? raw.body ?? raw.mensagem ?? '';
  const status = dashNormalizeFeedbackStatus(raw);
  let kind = raw.categoria ?? raw.Categoria ?? raw.category ?? raw.kind ?? '';
  let msg = typeof rawMsg === 'string' ? rawMsg : String(rawMsg ?? '');
  if (!kind && msg.length) {
    const bracket = msg.match(/^\[([^\]]+)\]\s*\n*/);
    if (bracket) {
      kind = bracket[1];
      msg = msg.slice(bracket[0].length).trim();
    }
  }
  if (!kind) kind = '—';
  const createdAt = raw.created_at ?? raw.createdAt ?? raw.criadoEm ?? '';
  const moderatedBy = status === 'pending' ? '' : String(raw.moderadoPor ?? raw.ModeradoPor ?? '').trim();
  const moderatedAt = status === 'pending' ? '' : dashFeedbackIsoDate(raw);
  return {
    id: String(id),
    name,
    kind,
    msg,
    createdAt,
    status,
    moderatedBy,
    moderatedAt,
  };
}

function dashNormalizeCard(raw) {
  const slug = String(raw.slug ?? '')
    .trim()
    .toLowerCase();
  const display =
    raw.display_name ??
    raw.displayName ??
    raw.title ??
    (slug || null) ??
    '—';
  return {
    slug,
    display_name: display || '—',
    theme: raw.theme ?? '',
    rarity: raw.rarity_label ?? raw.rarity ?? '',
    sort_order: Number(raw.sort_order ?? raw.sortOrder ?? raw.Ordem ?? 0) || 0,
    border_color:
      buildxpNormalizeHexColor(raw.border_color ?? raw.BorderColor ?? raw.cor_borda) ??
      buildxpPresetHexForTheme(raw.theme),
  };
}

function dashApplyCardToForm(raw) {
  if (!document.getElementById('dash-card-slug')) return;
  const el = (id) => document.getElementById(id);
  el('dash-card-slug').value = raw.slug ?? '';
  el('dash-card-theme').value = raw.theme ?? 'git';
  const cardAccentHex =
    buildxpNormalizeHexColor(raw.border_color ?? raw.BorderColor ?? raw.cor_borda) ??
    buildxpPresetHexForTheme(raw.theme ?? el('dash-card-theme').value);
  const cardPicker = el('dash-card-border-picker');
  const cardHexInp = el('dash-card-border-hex');
  if (cardPicker) cardPicker.value = cardAccentHex;
  if (cardHexInp) cardHexInp.value = cardAccentHex;
  el('dash-card-display').value = raw.display_name ?? raw.displayName ?? '';
  el('dash-card-rarity').value = raw.rarity_label ?? raw.rarity ?? '';
  el('dash-card-class').value = raw.card_class ?? raw.cardClass ?? '';
  el('dash-card-xpc').value = raw.xp_current ?? raw.xpCurrent ?? 0;
  el('dash-card-xpm').value = raw.xp_max ?? raw.xpMax ?? 3000;
  el('dash-card-sort').value = raw.sort_order ?? raw.sortOrder ?? 0;
  const slugForLinks = String(el('dash-card-slug').value || raw.slug || '')
    .trim()
    .toLowerCase();
  const lb = String(raw.link_beginner ?? raw.linkBeginner ?? '').trim();
  const lr = String(raw.link_ref ?? raw.linkRef ?? '').trim();
  el('dash-card-link-b').value =
    lb || (slugForLinks ? buildxpPublicCardHref(slugForLinks, 'beginner') : '');
  el('dash-card-link-r').value =
    lr || (slugForLinks ? buildxpPublicCardHref(slugForLinks, 'ref') : '');
  el('dash-card-btn1').value = raw.btn_primary_label ?? raw.btnPrimaryLabel ?? '';
  el('dash-card-btn2').value = raw.btn_secondary_label ?? raw.btnSecondaryLabel ?? '';
  el('dash-card-desc').value = raw.description_html ?? raw.descriptionHtml ?? '';
  el('dash-card-icon-layout').value = raw.icon_layout ?? raw.iconLayout ?? 'single';
  syncDashCardIconDualLayout();
  el('dash-card-icon-pri').value = raw.icon_primary_src ?? raw.iconPrimarySrc ?? '';
  el('dash-card-icon-pri-alt').value = raw.icon_primary_alt ?? raw.iconPrimaryAlt ?? '';
  el('dash-card-icon-sec').value = raw.icon_secondary_src ?? raw.iconSecondarySrc ?? '';
  el('dash-card-icon-sec-alt').value = raw.icon_secondary_alt ?? raw.iconSecondaryAlt ?? '';
  const pub = raw.is_published ?? raw.isPublished ?? true;
  el('dash-card-published').checked = pub !== false;
  syncDashCardIconPreviewFromInput();
}

let dashCardIconObjectUrl = null;

function revokeDashCardIconPreviewUrl() {
  if (dashCardIconObjectUrl) {
    URL.revokeObjectURL(dashCardIconObjectUrl);
    dashCardIconObjectUrl = null;
  }
}

function resetDashCardIconFileUi() {
  revokeDashCardIconPreviewUrl();
  const fi = document.getElementById('dash-card-icon-file');
  if (fi) fi.value = '';
}

function dashSetCardIconPathReadout(text) {
  const out = document.getElementById('dash-card-icon-path-readout');
  if (!out) return;
  const t = String(text || '').trim();
  out.textContent = t ? `Guardado no servidor: ${t}` : '';
}

function syncDashCardIconPreviewFromInput() {
  const img = document.getElementById('dash-card-icon-preview');
  const pri = document.getElementById('dash-card-icon-pri')?.value?.trim();
  if (!img) return;
  revokeDashCardIconPreviewUrl();
  img.onload = () => {
    img.style.display = 'block';
  };
  img.onerror = () => {
    img.style.display = 'none';
  };
  if (!pri) {
    img.style.display = 'none';
    img.removeAttribute('src');
    dashSetCardIconPathReadout('');
    return;
  }
  dashSetCardIconPathReadout(pri);
  const cardId = Number.parseInt(
    document.getElementById('dash-card-form')?.dataset?.cardId || '0',
    10,
  );
  img.src = dashIconPreviewSrc(pri, Number.isFinite(cardId) && cardId > 0 ? cardId : 0);
}

function getDashApiPath(key) {
  const defaults = {
    login: '/api/Auth/login',
    forgotRequest: '/api/auth/recuperar-senha',
    validateRecoveryCode: '/api/auth/validar-codigo-recuperacao',
    resetPassword: '/api/auth/redefinir-senha',
    inviteCollaborator: '/api/Colaborador/convidar',
    colaboradorList: '/api/Colaborador',
    uploadCardIcon: '/api/Card/upload-icon',
    perfilMe: '/api/Perfil/me',
    perfilPut: '/api/Perfil/me',
  };
  const p = window.BUILDXP_API_PATHS || {};
  return p[key] || defaults[key] || '';
}

/** Envia imagem para a API; devolve <code>iconRef</code> (ex.: <code>icon-temp:{guid}</code>) e URL de preview. */
async function dashUploadCardIconFile(file) {
  if (!file) return null;
  const fd = new FormData();
  fd.append('file', file);
  const path = getDashApiPath('uploadCardIcon') || '/api/card/upload-icon';
  const r = await dashFetchNoThrow(path, { method: 'POST', body: fd });
  if (!r.ok || !r.data || typeof r.data !== 'object') {
    const msg =
      (typeof r.data === 'object' && r.data
        ? r.data.message ?? r.data.Message
        : null) ||
      (r.status === 401 ? 'Sessão expirada — volte a entrar.' : 'Falha no upload do ícone.');
    return { iconRef: null, previewUrl: null, error: msg };
  }
  const iconRef = String(
    r.data.iconRef ?? r.data.IconRef ?? r.data.path ?? r.data.Path ?? '',
  ).trim();
  if (!iconRef) {
    return { iconRef: null, previewUrl: null, error: 'Resposta inválida do servidor.' };
  }
  const previewUrl = String(r.data.previewUrl ?? r.data.PreviewUrl ?? '').trim();
  return {
    iconRef,
    previewUrl: previewUrl || dashIconPreviewSrc(iconRef),
  };
}

function dashIconPreviewSrc(storedRef, cardNumericId) {
  const ref = String(storedRef || '').trim();
  if (!ref) return '';
  const base = String(getBuildXpApiBase() || '').replace(/\/$/, '');
  const low = ref.toLowerCase();
  if (low.startsWith('icon-temp:')) {
    const id = ref.slice('icon-temp:'.length).trim();
    return id ? `${base}/api/card/icon-upload/${id}` : '';
  }
  const cid = Number(cardNumericId) || 0;
  if (low === 'db:primary' && cid > 0) return `${base}/api/card/${cid}/icon/primary`;
  if (low === 'db:secondary' && cid > 0) return `${base}/api/card/${cid}/icon/secondary`;
  if (ref.startsWith('http://') || ref.startsWith('https://')) return ref;
  if (ref.startsWith('/api/')) return `${base}${ref}`;
  return ref;
}

function dashIsCardPublishedInApi(raw) {
  const pub = raw?.is_published ?? raw?.IsPublished ?? raw?.ativo ?? raw?.Ativo;
  return pub !== false && pub !== 0;
}

function syncDashCardIconDualLayout() {
  const layout = document.getElementById('dash-card-icon-layout')?.value || 'single';
  const wrap = document.getElementById('dash-card-icon-dual-wrap');
  if (wrap) wrap.hidden = layout !== 'dual';
}

/** Lista colaboradores e controlos de acesso (só admin da plataforma; colaborador elevado convida mas não vê a tabela). */
async function loadDashColaboradoresList() {
  const wrap = document.getElementById('dash-collab-table-wrap');
  const st = document.getElementById('dash-collab-list-status');
  if (!wrap) return;
  if (!getDashIsPlataformaAdmin()) {
    wrap.innerHTML = '';
    if (st) {
      st.textContent = '';
      st.classList.remove('ok', 'bad');
    }
    return;
  }
  if (st) {
    st.textContent = '';
    st.classList.remove('ok', 'bad');
  }
  const baseList = getDashApiPath('colaboradorList') || '/api/Colaborador';
  const r = await dashFetchNoThrow(baseList, { method: 'GET' });
  if (!r.ok) {
    if (st) {
      st.textContent =
        r.status === 401
          ? 'Sem autorização para listar colaboradores.'
          : 'Não foi possível carregar a lista.';
      st.classList.add('bad');
    }
    wrap.innerHTML = '';
    return;
  }
  const rows = Array.isArray(r.data) ? r.data : [];
  if (rows.length === 0) {
    wrap.innerHTML = '<p class="dash-muted dash-collab-empty">Nenhum colaborador registado.</p>';
    return;
  }
  let html =
    '<table class="dash-collab-table dash-collab-table--usuarios" role="grid">' +
    '<colgroup>' +
    '<col class="dash-collab-col dash-collab-col--email" />' +
    '<col class="dash-collab-col dash-collab-col--user" />' +
    '<col class="dash-collab-col dash-collab-col--estado" />' +
    '<col class="dash-collab-col dash-collab-col--acesso" />' +
    '</colgroup>' +
    '<thead><tr>' +
    '<th scope="col">E-mail</th>' +
    '<th scope="col">Username</th>' +
    '<th scope="col">Estado da conta</th>' +
    '<th scope="col">Permissão no painel</th>' +
    '</tr></thead><tbody>';
  for (const row of rows) {
    const id = row.id ?? row.Id;
    const email = row.email ?? row.Email ?? '';
    const usuario = row.usuario ?? row.Usuario ?? '';
    const ativo = !!(row.ativo ?? row.Ativo);
    const adm = !!(row.acessoAdministrador ?? row.AcessoAdministrador);
    const estado = ativo
      ? '<span class="dash-badge dash-badge--ok">Ativo</span>'
      : '<span class="dash-badge dash-badge--pending">Convite</span>';
    const nivelTitulo = adm ? 'Administrador do painel' : 'Colaborador';
    const toggleId = `dash-collab-acesso-${id}`;
    html += `<tr class="dash-collab-row" data-dash-colab-id="${id}">
      <td class="dash-collab-td dash-collab-td--email"><span class="dash-collab-email">${dashEscapeHtml(String(email))}</span></td>
      <td class="dash-collab-td dash-collab-td--user">${usuario ? `<span class="dash-collab-user">${dashEscapeHtml(String(usuario))}</span>` : '<span class="dash-collab-dash">—</span>'}</td>
      <td class="dash-collab-td dash-collab-td--estado"><span class="dash-collab-estado-cell">${estado}</span></td>
      <td class="dash-collab-td dash-collab-td--acesso">
        <div class="dash-collab-acesso-cell">
          <div class="dash-collab-acesso-nivel">
            <span class="dash-collab-role-chip ${adm ? 'dash-collab-role-chip--admin' : 'dash-collab-role-chip--colab'}">${dashEscapeHtml(nivelTitulo)}</span>
          </div>
          <div class="dash-collab-acesso-switchrow">
            <div class="dash-collab-acesso-switchrow-text">
              <span class="dash-collab-acesso-switchrow-title">Administrador do painel</span>
            </div>
            <label class="dash-switch dash-switch--table" for="${toggleId}" title="Ativar ou desativar administrador do painel para esta conta">
              <input type="checkbox" class="dash-collab-acesso-toggle" id="${toggleId}" data-dash-colab-id="${id}" ${
      adm ? 'checked' : ''
    } aria-label="Administrador do painel para ${dashEscapeHtml(String(email))}" />
              <span class="dash-switch-slider" aria-hidden="true"></span>
            </label>
          </div>
        </div>
      </td>
    </tr>`;
  }
  html += '</tbody></table>';
  wrap.innerHTML = html;
}

async function dashFetchNoThrow(path, options = {}) {
  const base = getBuildXpApiBase();
  const url = `${base}${path}`;
  const token = getToken(); // pega o JWT salvo no login
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  try {
    const res = await fetch(url, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        // envia o token JWT em toda requisição
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      ...options,
    });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {
      data = text;
    }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: null, error: e };
  }
}

// ── TOKEN JWT ────────────────────────────────────────────────
// guarda o token JWT na sessão para enviar em todas as requisições
const BUILDXP_JWT_KEY = 'buildxp_jwt';
const BUILDXP_DASH_PODE_GERIR_KEY = 'buildxp_dash_pode_gerir_colaboradores';
const BUILDXP_DASH_IS_PLATAFORMA_ADMIN_KEY = 'buildxp_dash_is_plataforma_admin';

function getToken() {
  try {
    return sessionStorage.getItem(BUILDXP_JWT_KEY) || '';
  } catch (_) {
    return '';
  }
}
function saveToken(t) {
  try {
    sessionStorage.setItem(BUILDXP_JWT_KEY, t);
  } catch (_) {}
}
function removeToken() {
  try {
    sessionStorage.removeItem(BUILDXP_JWT_KEY);
    sessionStorage.removeItem(BUILDXP_DASH_PODE_GERIR_KEY);
    sessionStorage.removeItem(BUILDXP_DASH_IS_PLATAFORMA_ADMIN_KEY);
  } catch (_) {}
}

/** Payload JWT (sem validar assinatura — só para UI do dashboard). */
function dashParseJwtPayload(token) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
    const json = atob(b64 + pad);
    const o = JSON.parse(json);
    return o && typeof o === 'object' ? o : null;
  } catch (_) {
    return null;
  }
}

function dashJwtPayloadHasAdminRole(payload) {
  if (!payload) return false;
  const roles = [];
  for (const k of Object.keys(payload)) {
    const lk = k.toLowerCase();
    if (lk === 'role' || lk.endsWith('/role')) {
      const v = payload[k];
      if (Array.isArray(v)) roles.push(...v.map(String));
      else if (typeof v === 'string') roles.push(...v.split(',').map((s) => s.trim()));
    }
  }
  return roles.some((r) => String(r).toLowerCase() === 'admin');
}

/** Claim <code>nameidentifier</code> / <code>sub</code> no payload JWT (UI). */
function dashJwtPayloadNameIdentifier(payload) {
  if (!payload) return '';
  for (const k of Object.keys(payload)) {
    const lk = k.toLowerCase();
    if (lk === 'sub' || lk.endsWith('/nameidentifier')) {
      const v = payload[k];
      if (v != null && typeof v !== 'object') return String(v).trim();
    }
  }
  return '';
}

/** Conta admin da plataforma (mesmo critério do backend: id fixo <code>admin</code> no token). */
function dashJwtPayloadIsPlataformaAdmin(payload) {
  return dashJwtPayloadNameIdentifier(payload).toLowerCase() === 'admin';
}

function syncDashPodeGerirColaboradoresFromToken() {
  try {
    const t = getToken();
    if (!t) {
      sessionStorage.removeItem(BUILDXP_DASH_PODE_GERIR_KEY);
      sessionStorage.removeItem(BUILDXP_DASH_IS_PLATAFORMA_ADMIN_KEY);
      return;
    }
    const p = dashParseJwtPayload(t);
    sessionStorage.setItem(BUILDXP_DASH_PODE_GERIR_KEY, dashJwtPayloadHasAdminRole(p) ? '1' : '0');
    sessionStorage.setItem(BUILDXP_DASH_IS_PLATAFORMA_ADMIN_KEY, dashJwtPayloadIsPlataformaAdmin(p) ? '1' : '0');
  } catch (_) {}
}

function getDashPodeGerirColaboradores() {
  try {
    return sessionStorage.getItem(BUILDXP_DASH_PODE_GERIR_KEY) === '1';
  } catch (_) {
    return false;
  }
}

function getDashIsPlataformaAdmin() {
  try {
    return sessionStorage.getItem(BUILDXP_DASH_IS_PLATAFORMA_ADMIN_KEY) === '1';
  } catch (_) {
    return false;
  }
}

/** Secção colaboradores (convite) vs bloco da tabela de acessos (só admin da plataforma). */
function updateDashCollabSectionVisibility(viewName) {
  const collabSection = document.getElementById('dash-collab-section');
  const listBlock = document.getElementById('dash-collab-list-block');
  const view = String(viewName || 'home').trim() || 'home';
  const onHome = view === 'home';
  if (collabSection) {
    collabSection.hidden = !onHome || !getDashPodeGerirColaboradores();
  }
  if (listBlock) {
    listBlock.hidden = !onHome || !getDashIsPlataformaAdmin();
  }
}

/** Ex.: gislanesenaa@gmail.com → gis*********@gm*****com */
function maskRecoveryEmailDisplay(email) {
  const raw = String(email || '').trim();
  const at = raw.indexOf('@');
  if (at < 1 || at === raw.length - 1) return '***';
  const local = raw.slice(0, at);
  const host = raw.slice(at + 1);
  if (!host) return '***';
  const dot = host.lastIndexOf('.');
  const domain = dot > 0 ? host.slice(0, dot) : host;
  const tld = dot > 0 ? host.slice(dot + 1) : '';

  let localMasked;
  if (local.length <= 2) {
    localMasked = `${local[0] || '*'}**`;
  } else {
    localMasked = `${local.slice(0, 3)}${'*'.repeat(9)}`;
  }

  let domMasked;
  if (tld) {
    domMasked =
      domain.length <= 2
        ? `${domain.padEnd(2, '*').slice(0, 2)}*****${tld}`
        : `${domain.slice(0, 2)}*****${tld}`;
  } else {
    domMasked = `${domain.slice(0, 2)}*****`;
  }

  return `${localMasked}@${domMasked}`;
}

async function tryAdminLogin(username, password) {
  // nosso backend espera {usuario, senha} e retorna {token}
  const r = await dashFetchNoThrow('/api/Auth/login', {
    method: 'POST',
    body: JSON.stringify({ usuario: username, senha: password }),
  });

  // se o backend retornou token, salva e libera acesso
  if (r.ok && r.data?.token) {
    saveToken(r.data.token);
    syncDashPodeGerirColaboradoresFromToken();
    return true;
  }

  return false;
}

function resetDashPwWraps(root) {
  if (!root) return;
  root.querySelectorAll('.dash-pw-wrap').forEach((wrap) => {
    const input = wrap.querySelector('input');
    const btn = wrap.querySelector('.dash-pw-toggle');
    if (input) input.type = 'password';
    if (btn) {
      const peerSel = btn.getAttribute('data-dash-pw-peer');
      if (peerSel) {
        const peer = document.querySelector(peerSel);
        if (peer && peer.tagName === 'INPUT') peer.type = 'password';
      }
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', 'Mostrar senha');
      btn.textContent = 'Mostrar';
    }
  });
}

let dashPwToggleDelegationBound = false;

/** Captura em document: corre mesmo que initDashboard saia cedo ou outro código pare a propagação. */
function ensureDashPasswordToggleDelegation() {
  if (dashPwToggleDelegationBound) return;
  dashPwToggleDelegationBound = true;
  document.addEventListener(
    'click',
    (e) => {
      const el = e.target;
      if (!el || typeof el.closest !== 'function') return;
      const btn = el.closest('.dash-pw-toggle');
      if (!btn) return;
      const wrap = btn.closest('.dash-pw-wrap');
      if (!wrap) return;
      const input = wrap.querySelector('input');
      if (!input) return;
      const nextType = input.type === 'text' ? 'password' : 'text';
      input.type = nextType;
      const peerSel = btn.getAttribute('data-dash-pw-peer');
      if (peerSel) {
        const peer = document.querySelector(peerSel);
        if (peer && peer.tagName === 'INPUT') peer.type = nextType;
      }
      const nowVisible = nextType === 'text';
      btn.setAttribute('aria-pressed', nowVisible ? 'true' : 'false');
      btn.setAttribute('aria-label', nowVisible ? 'Ocultar senha' : 'Mostrar senha');
      btn.textContent = nowVisible ? 'Ocultar' : 'Mostrar';
    },
    true,
  );
}

function initDashboard() {
  const loginEl = document.getElementById('dash-login');
  const shellEl = document.getElementById('dash-shell');
  if (!loginEl || !shellEl) return;

  document.getElementById('dash-nav-logo')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (typeof window.__dashGoHome === 'function') window.__dashGoHome();
  });

  const ADMIN_SESSION_KEY = 'buildxp_admin_session';
  const loginForm = document.getElementById('dash-login-form');
  const loginUser = document.getElementById('dash-login-username');
  const loginPw = document.getElementById('dash-login-password');
  const loginStatus = document.getElementById('dash-login-status');

  const forgotModal = document.getElementById('dash-forgot-modal');
  const forgotBackdrop = document.getElementById('dash-forgot-backdrop');
  const forgotClose = document.getElementById('dash-forgot-close');
  const forgotCancel = document.getElementById('dash-forgot-cancel');
  const forgotOpen = document.getElementById('dash-open-forgot');
  const forgotPanelEmail = document.getElementById('dash-forgot-panel-email');
  const forgotPanelCode = document.getElementById('dash-forgot-panel-code');
  const forgotPanelPassword = document.getElementById('dash-forgot-panel-password');
  const forgotEmailEl = document.getElementById('dash-forgot-email');
  const forgotStep1Status = document.getElementById('dash-forgot-step1-status');
  const forgotCodeStatus = document.getElementById('dash-forgot-code-status');
  const forgotPasswordStatus = document.getElementById('dash-forgot-step-password-status');
  const forgotVerifyCodeBtn = document.getElementById('dash-forgot-verify-code');
  const forgotResendBtn = document.getElementById('dash-forgot-resend');
  const forgotBackToEmail = document.getElementById('dash-forgot-back-to-email');
  const forgotBackToCode = document.getElementById('dash-forgot-back-to-code');
  const FORGOT_RESEND_SEC = 50;
  let pendingForgotEmail = '';
  let pendingForgotCode = '';
  let forgotResendTimer = null;

  function clearForgotResendTimer() {
    if (forgotResendTimer) {
      clearInterval(forgotResendTimer);
      forgotResendTimer = null;
    }
  }

  function updateForgotResendButton(sec) {
    if (!forgotResendBtn) return;
    if (sec > 0) {
      forgotResendBtn.disabled = true;
      forgotResendBtn.textContent = `Reenviar código (${sec}s)`;
    } else {
      forgotResendBtn.disabled = false;
      forgotResendBtn.textContent = 'Reenviar código';
    }
  }

  function startForgotResendCooldown() {
    clearForgotResendTimer();
    let sec = FORGOT_RESEND_SEC;
    updateForgotResendButton(sec);
    forgotResendTimer = setInterval(() => {
      sec -= 1;
      if (sec <= 0) {
        clearForgotResendTimer();
        updateForgotResendButton(0);
      } else {
        updateForgotResendButton(sec);
      }
    }, 1000);
  }

  function showForgotStep(which) {
    if (forgotPanelEmail) forgotPanelEmail.hidden = which !== 'email';
    if (forgotPanelCode) forgotPanelCode.hidden = which !== 'code';
    if (forgotPanelPassword) forgotPanelPassword.hidden = which !== 'password';
    const maskedEl = document.getElementById('dash-forgot-email-masked');
    if (maskedEl) {
      maskedEl.textContent =
        which === 'code' && pendingForgotEmail ? maskRecoveryEmailDisplay(pendingForgotEmail) : '';
    }
  }

  function openForgotModal() {
    if (!forgotModal) return;
    pendingForgotEmail = '';
    pendingForgotCode = '';
    clearForgotResendTimer();
    if (forgotResendBtn) {
      forgotResendBtn.disabled = true;
      forgotResendBtn.textContent = `Reenviar código (${FORGOT_RESEND_SEC}s)`;
    }
    showForgotStep('email');
    if (forgotEmailEl) forgotEmailEl.value = '';
    const codeEl = document.getElementById('dash-forgot-code');
    if (codeEl) codeEl.value = '';
    const np = document.getElementById('dash-forgot-newpw');
    const np2 = document.getElementById('dash-forgot-newpw2');
    if (np) np.value = '';
    if (np2) np2.value = '';
    resetDashPwWraps(forgotPanelPassword);
    if (forgotStep1Status) {
      forgotStep1Status.textContent = '';
      forgotStep1Status.classList.remove('ok', 'bad');
    }
    if (forgotCodeStatus) {
      forgotCodeStatus.textContent = '';
      forgotCodeStatus.classList.remove('ok', 'bad');
    }
    if (forgotPasswordStatus) {
      forgotPasswordStatus.textContent = '';
      forgotPasswordStatus.classList.remove('ok', 'bad');
    }
    const maskedReset = document.getElementById('dash-forgot-email-masked');
    if (maskedReset) maskedReset.textContent = '';
    forgotModal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeForgotModal() {
    if (!forgotModal) return;
    clearForgotResendTimer();
    resetDashPwWraps(forgotModal);
    forgotModal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  forgotOpen?.addEventListener('click', () => openForgotModal());
  forgotClose?.addEventListener('click', () => closeForgotModal());
  forgotCancel?.addEventListener('click', () => closeForgotModal());
  forgotBackdrop?.addEventListener('click', () => closeForgotModal());

  forgotBackToEmail?.addEventListener('click', () => {
    pendingForgotCode = '';
    showForgotStep('email');
    if (forgotCodeStatus) {
      forgotCodeStatus.textContent = '';
      forgotCodeStatus.classList.remove('ok', 'bad');
    }
    forgotEmailEl?.focus();
  });

  forgotBackToCode?.addEventListener('click', () => {
    pendingForgotCode = '';
    showForgotStep('code');
    if (forgotPasswordStatus) {
      forgotPasswordStatus.textContent = '';
      forgotPasswordStatus.classList.remove('ok', 'bad');
    }
    const np = document.getElementById('dash-forgot-newpw');
    const np2 = document.getElementById('dash-forgot-newpw2');
    if (np) np.value = '';
    if (np2) np2.value = '';
    resetDashPwWraps(forgotPanelPassword);
    document.getElementById('dash-forgot-code')?.focus();
  });

  document.getElementById('dash-forgot-step1')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!forgotEmailEl || !forgotStep1Status) return;
    const email = forgotEmailEl.value.trim();
    if (!email) return;
    forgotStep1Status.textContent = '';
    forgotStep1Status.classList.remove('ok', 'bad');
    const path = getDashApiPath('forgotRequest');
    const r = await dashFetchNoThrow(path, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    if (r.ok) {
      pendingForgotEmail = email.trim().toLowerCase();
      pendingForgotCode = '';
      forgotStep1Status.textContent = '';
      forgotStep1Status.classList.add('ok');
      showForgotStep('code');
      const codeEl = document.getElementById('dash-forgot-code');
      if (codeEl) {
        codeEl.value = '';
        codeEl.focus();
      }
      if (forgotCodeStatus) {
        forgotCodeStatus.textContent = '';
        forgotCodeStatus.classList.remove('ok', 'bad');
      }
      startForgotResendCooldown();
    } else {
      forgotStep1Status.textContent =
        (r.data && typeof r.data === 'object' && r.data.message) || 'Não foi possível enviar o código.';
      forgotStep1Status.classList.add('bad');
    }
  });

  forgotVerifyCodeBtn?.addEventListener('click', async () => {
    if (!forgotCodeStatus || !pendingForgotEmail) return;
    const code = document.getElementById('dash-forgot-code')?.value?.trim() || '';
    forgotCodeStatus.textContent = '';
    forgotCodeStatus.classList.remove('ok', 'bad');
    if (!code) {
      forgotCodeStatus.textContent = 'Informe o código.';
      forgotCodeStatus.classList.add('bad');
      return;
    }
    const path = getDashApiPath('validateRecoveryCode');
    const r = await dashFetchNoThrow(path, {
      method: 'POST',
      body: JSON.stringify({ email: pendingForgotEmail, codigo: code }),
    });
    if (r.ok) {
      pendingForgotCode = code;
      forgotCodeStatus.classList.add('ok');
      showForgotStep('password');
      document.getElementById('dash-forgot-newpw')?.focus();
    } else {
      const msg =
        (r.data && typeof r.data === 'object' && r.data.message) || 'Código inválido ou expirado.';
      forgotCodeStatus.textContent = msg;
      forgotCodeStatus.classList.add('bad');
    }
  });

  forgotResendBtn?.addEventListener('click', async () => {
    if (!pendingForgotEmail || forgotResendBtn?.disabled) return;
    if (forgotCodeStatus) {
      forgotCodeStatus.textContent = '';
      forgotCodeStatus.classList.remove('ok', 'bad');
    }
    const path = getDashApiPath('forgotRequest');
    const r = await dashFetchNoThrow(path, {
      method: 'POST',
      body: JSON.stringify({ email: pendingForgotEmail }),
    });
    if (r.ok) {
      startForgotResendCooldown();
      if (forgotCodeStatus) {
        forgotCodeStatus.textContent = 'Novo código enviado.';
        forgotCodeStatus.classList.remove('bad');
        forgotCodeStatus.classList.add('ok');
      }
    } else if (forgotCodeStatus) {
      forgotCodeStatus.textContent =
        (r.data && typeof r.data === 'object' && r.data.message) || 'Não foi possível reenviar.';
      forgotCodeStatus.classList.add('bad');
    }
  });

  let forgotPasswordSubmitting = false;
  document.getElementById('dash-forgot-step-password')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!forgotPasswordStatus || forgotPasswordSubmitting) return;
    const np = document.getElementById('dash-forgot-newpw')?.value || '';
    const np2 = document.getElementById('dash-forgot-newpw2')?.value || '';
    if (!pendingForgotEmail || !pendingForgotCode) {
      forgotPasswordStatus.textContent = 'Valide o código novamente.';
      forgotPasswordStatus.classList.add('bad');
      return;
    }
    if (!np) {
      forgotPasswordStatus.textContent = 'Informe a nova senha.';
      forgotPasswordStatus.classList.add('bad');
      return;
    }
    if (np !== np2) {
      forgotPasswordStatus.textContent = 'As senhas não conferem.';
      forgotPasswordStatus.classList.add('bad');
      return;
    }
    forgotPasswordStatus.textContent = '';
    forgotPasswordStatus.classList.remove('ok', 'bad');
    const saveBtn = document.getElementById('dash-forgot-save');
    forgotPasswordSubmitting = true;
    if (saveBtn) saveBtn.disabled = true;
    const path = getDashApiPath('resetPassword');
    try {
      const r = await dashFetchNoThrow(path, {
        method: 'POST',
        body: JSON.stringify({
          email: pendingForgotEmail,
          codigo: pendingForgotCode,
          novaSenha: np,
        }),
      });
      if (r.ok) {
        forgotPasswordStatus.textContent = 'Senha alterada com sucesso.';
        forgotPasswordStatus.classList.add('ok');
        setTimeout(() => {
          closeForgotModal();
        }, 400);
      } else {
        const msg =
          (r.data && typeof r.data === 'object' && r.data.message) ||
          (typeof r.data === 'string' ? r.data : null) ||
          'Não foi possível redefinir a senha.';
        forgotPasswordStatus.textContent = msg;
        forgotPasswordStatus.classList.add('bad');
      }
    } finally {
      forgotPasswordSubmitting = false;
      if (saveBtn) saveBtn.disabled = false;
    }
  });

  const profileSheet = document.getElementById('dash-profile-sheet');
  const profileBackdrop = document.getElementById('dash-profile-sheet-backdrop');
  const profileClose = document.getElementById('dash-profile-close');
  const profileOpenBtn = document.getElementById('dash-profile-open');
  const profileAdminMsg = document.getElementById('dash-profile-admin-msg');
  const profileForm = document.getElementById('dash-profile-form');
  const profileStatus = document.getElementById('dash-profile-status');
  const profileAlterarSenha = document.getElementById('dash-profile-alterar-senha');
  const profileSenhaFields = document.getElementById('dash-profile-senha-fields');
  let profilePendingRemoverFoto = false;
  let profilePendingBase64 = null;
  let profilePendingMime = null;

  function resetProfilePendingFiles() {
    profilePendingRemoverFoto = false;
    profilePendingBase64 = null;
    profilePendingMime = null;
    const fi = document.getElementById('dash-profile-foto-file');
    if (fi) fi.value = '';
  }

  function closeProfileSheet() {
    if (!profileSheet) return;
    profileSheet.setAttribute('hidden', '');
    profileSheet.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('dash-profile-sheet-open');
    resetDashPwWraps(profileSheet);
    resetProfilePendingFiles();
    if (profileStatus) {
      profileStatus.textContent = '';
      profileStatus.classList.remove('ok', 'bad');
    }
  }

  async function loadDashProfileChip() {
    const img = document.getElementById('dash-profile-avatar-img');
    const ph = document.getElementById('dash-profile-avatar-placeholder');
    const tok = getToken();
    if (!tok || !img || !ph) return;
    const path = getDashApiPath('perfilMe');
    const r = await dashFetchNoThrow(path, { method: 'GET' });
    if (!r.ok || !r.data || typeof r.data !== 'object') return;
    const u = r.data.fotoDataUrl;
    if (u && typeof u === 'string') {
      img.src = u;
      img.hidden = false;
      ph.hidden = true;
    } else {
      img.removeAttribute('src');
      img.hidden = true;
      ph.hidden = false;
    }
  }

  async function openProfileSheet() {
    if (!profileSheet) return;
    resetProfilePendingFiles();
    if (profileAdminMsg) {
      profileAdminMsg.innerHTML =
        '<p class="dash-muted">Carregando perfil…</p>';
    }
    if (profileStatus) {
      profileStatus.textContent = '';
      profileStatus.classList.remove('ok', 'bad');
    }
    const tok = getToken();
    if (!tok) return;
    const path = getDashApiPath('perfilMe');
    const r = await dashFetchNoThrow(path, { method: 'GET' });
    if (!r.ok || !r.data || typeof r.data !== 'object') {
      if (profileAdminMsg) {
        profileAdminMsg.hidden = false;
        profileAdminMsg.innerHTML =
          '<p class="dash-muted">Não foi possível carregar o perfil. Confirme que está com sessão válida (JWT).</p>';
      }
      if (profileForm) profileForm.hidden = true;
      profileSheet.removeAttribute('hidden');
      profileSheet.setAttribute('aria-hidden', 'false');
      document.body.classList.add('dash-profile-sheet-open');
      return;
    }
    const d = r.data;
    const podeEditar = !!(d.podeEditarPerfil ?? d.pode_editar_perfil);
    const adminEmailBlk = document.getElementById('dash-profile-email-admin-block');
    const collabEmailBlk = document.getElementById('dash-profile-email-collab-block');
    const emInput = document.getElementById('dash-profile-email-input');
    if (d.role === 'admin' && !podeEditar) {
      if (profileAdminMsg) {
        profileAdminMsg.hidden = false;
        profileAdminMsg.innerHTML =
          '<p class="dash-muted">Conta de <strong>administrador</strong>: a tabela <code>AdminPerfis</code> ainda não existe nesta base de dados. Executa o script SQL do projeto (<code>create_admin_perfis.sql</code>), reinicia a API e volta a abrir o painel.</p>';
      }
      if (profileForm) profileForm.hidden = true;
      if (adminEmailBlk) adminEmailBlk.hidden = true;
      if (collabEmailBlk) collabEmailBlk.hidden = true;
    } else {
      if (profileAdminMsg) profileAdminMsg.hidden = true;
      if (profileForm) profileForm.hidden = false;
      const isAdminProfile = d.role === 'admin' && podeEditar;
      if (profileForm) profileForm.dataset.profileMode = isAdminProfile ? 'admin' : 'colab';
      if (adminEmailBlk) adminEmailBlk.hidden = !isAdminProfile;
      if (collabEmailBlk) collabEmailBlk.hidden = !!isAdminProfile;
      const emEl = document.getElementById('dash-profile-email-display');
      const uEl = document.getElementById('dash-profile-usuario');
      if (isAdminProfile) {
        if (emInput) emInput.value = d.email ? String(d.email) : '';
      } else if (emEl) {
        emEl.textContent = d.email || '';
      }
      if (uEl) uEl.value = d.usuario ? String(d.usuario) : '';
      if (profileAlterarSenha) profileAlterarSenha.checked = false;
      if (profileSenhaFields) profileSenhaFields.hidden = true;
      ['dash-profile-senha-atual', 'dash-profile-nova-senha', 'dash-profile-confirm-senha'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
    }
    profileSheet.removeAttribute('hidden');
    profileSheet.setAttribute('aria-hidden', 'false');
    document.body.classList.add('dash-profile-sheet-open');
  }

  profileOpenBtn?.addEventListener('click', () => {
    void openProfileSheet();
  });
  profileClose?.addEventListener('click', () => closeProfileSheet());
  profileBackdrop?.addEventListener('click', () => closeProfileSheet());

  profileAlterarSenha?.addEventListener('change', () => {
    if (profileSenhaFields) profileSenhaFields.hidden = !profileAlterarSenha.checked;
  });

  document.getElementById('dash-profile-foto-file')?.addEventListener('change', async (e) => {
    const f = e.target.files && e.target.files[0];
    profilePendingRemoverFoto = false;
    profilePendingBase64 = null;
    profilePendingMime = null;
    if (!f) return;
    if (f.size > 256 * 1024) {
      if (profileStatus) {
        profileStatus.textContent = 'Imagem demasiado grande (máx. 256 KB).';
        profileStatus.classList.add('bad');
      }
      e.target.value = '';
      return;
    }
    const mime = f.type || '';
    if (!/^image\/(jpeg|png|webp)$/i.test(mime)) {
      if (profileStatus) {
        profileStatus.textContent = 'Use JPEG, PNG ou WebP.';
        profileStatus.classList.add('bad');
      }
      e.target.value = '';
      return;
    }
    const dataUrl = await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ''));
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(f);
    });
    const m = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl);
    if (m) {
      profilePendingMime = m[1];
      profilePendingBase64 = m[2];
    }
    if (profileStatus) profileStatus.classList.remove('bad');
  });

  document.getElementById('dash-profile-remover-foto')?.addEventListener('click', () => {
    profilePendingRemoverFoto = true;
    profilePendingBase64 = null;
    profilePendingMime = null;
    const fi = document.getElementById('dash-profile-foto-file');
    if (fi) fi.value = '';
    if (profileStatus) {
      profileStatus.textContent = 'Foto será removida ao guardar.';
      profileStatus.classList.remove('bad');
      profileStatus.classList.add('ok');
    }
  });

  profileForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!profileStatus) return;
    profileStatus.textContent = '';
    profileStatus.classList.remove('ok', 'bad');
    const alterar = !!(profileAlterarSenha && profileAlterarSenha.checked);
    const usuarioVal = document.getElementById('dash-profile-usuario')?.value?.trim() ?? '';
    const profileMode = profileForm?.dataset.profileMode === 'admin' ? 'admin' : 'colab';
    const emailVal =
      profileMode === 'admin'
        ? document.getElementById('dash-profile-email-input')?.value?.trim() ?? ''
        : '';
    const body = {
      usuario: usuarioVal === '' ? null : usuarioVal,
      email: profileMode === 'admin' ? (emailVal === '' ? null : emailVal) : null,
      senhaAtual: alterar ? document.getElementById('dash-profile-senha-atual')?.value ?? '' : null,
      novaSenha: alterar ? document.getElementById('dash-profile-nova-senha')?.value ?? '' : null,
      confirmarSenha: alterar ? document.getElementById('dash-profile-confirm-senha')?.value ?? '' : null,
      removerFoto: profilePendingRemoverFoto,
      fotoBase64: profilePendingBase64,
      fotoMimeType: profilePendingMime,
    };
    if (alterar) {
      if (!body.senhaAtual || String(body.senhaAtual).length === 0) {
        profileStatus.textContent = 'Informe a senha atual.';
        profileStatus.classList.add('bad');
        return;
      }
      if (!body.novaSenha || String(body.novaSenha).length < 6) {
        profileStatus.textContent = 'A nova senha deve ter pelo menos 6 caracteres.';
        profileStatus.classList.add('bad');
        return;
      }
      if (body.novaSenha !== body.confirmarSenha) {
        profileStatus.textContent = 'Nova senha e confirmação não coincidem.';
        profileStatus.classList.add('bad');
        return;
      }
    }
    const path = getDashApiPath('perfilPut');
    const r = await dashFetchNoThrow(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (r.ok) {
      profileStatus.textContent =
        (r.data && typeof r.data === 'object' && r.data.message) || 'Guardado com sucesso.';
      profileStatus.classList.add('ok');
      if (r.data && typeof r.data === 'object' && r.data.token) {
        saveToken(r.data.token);
        syncDashPodeGerirColaboradoresFromToken();
      }
      resetProfilePendingFiles();
      await loadDashProfileChip();
      const collabSection = document.getElementById('dash-collab-section');
      const activeView = document.querySelector('#dash-app .dash-view--active');
      const viewName = activeView?.getAttribute('data-dash-view') || 'home';
      if (collabSection) {
        collabSection.hidden = viewName !== 'home' || !getDashPodeGerirColaboradores();
      }
      void loadDashColaboradoresList();
      setTimeout(() => closeProfileSheet(), 600);
    } else {
      profileStatus.textContent =
        (r.data && typeof r.data === 'object' && r.data.message) ||
        (typeof r.data === 'string' ? r.data : null) ||
        'Não foi possível guardar.';
      profileStatus.classList.add('bad');
    }
  });

  function readSession() {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
    } catch (_) {
      return false;
    }
  }

  function writeSession() {
    try {
      sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
    } catch (_) {
      /* ignore */
    }
  }

  function clearSession() {
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch (_) {
      /* ignore */
    }
  }

  function resetDashViewsToHome() {
    const app = document.getElementById('dash-app');
    if (!app) return;
    app.querySelectorAll('[data-dash-view]').forEach((el) => {
      const on = el.getAttribute('data-dash-view') === 'home';
      el.toggleAttribute('hidden', !on);
      el.classList.toggle('dash-view--active', on);
    });
    updateDashCollabSectionVisibility('home');
  }

  function showLogin() {
    closeForgotModal();
    closeProfileSheet();
    document.body.classList.remove('dash-body--authed');
    loginEl.hidden = false;
    loginEl.removeAttribute('aria-hidden');
    shellEl.hidden = true;
    shellEl.setAttribute('aria-hidden', 'true');
    resetDashViewsToHome();
    if (loginUser) loginUser.value = '';
    if (loginPw) loginPw.value = '';
    if (loginStatus) {
      loginStatus.textContent = '';
      loginStatus.classList.remove('ok', 'bad');
    }
  }

  let shellStarted = false;
  let fbScope = 'pending';
  let editingCardSlug = null;
  /** ID numérico do card na API — usamos PUT /api/card/{id} para evitar ambiguidades de rota com o slug na URL. */
  let editingCardNumericId = null;

  function showShell() {
    document.body.classList.add('dash-body--authed');
    loginEl.hidden = true;
    loginEl.setAttribute('aria-hidden', 'true');
    shellEl.hidden = false;
    shellEl.removeAttribute('aria-hidden');
    syncDashPodeGerirColaboradoresFromToken();
    const activeV = document.querySelector('#dash-app .dash-view--active');
    updateDashCollabSectionVisibility(activeV?.getAttribute('data-dash-view') || 'home');
    if (!shellStarted) {
      shellStarted = true;
      startShell();
    } else {
      refreshAll();
    }
    void loadDashProfileChip();
  }

  let dashReloadAll = null;

  function refreshAll() {
    if (typeof dashReloadAll === 'function') dashReloadAll();
  }

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!loginStatus || !loginPw || !loginUser) return;
    const username = loginUser.value.trim();
    const password = loginPw.value;
    if (!username) {
      loginStatus.textContent = '';
      loginStatus.classList.remove('ok', 'bad');
      return;
    }

    
    loginStatus.textContent = '';
    loginStatus.classList.remove('ok', 'bad');
    const ok = await tryAdminLogin(username, password);
    if (ok) {
      writeSession();
      loginStatus.textContent = '';
      loginStatus.classList.remove('bad');
      showShell();
    } else {
      loginStatus.textContent = 'Senha incorreta.';
      loginStatus.classList.remove('ok');
      loginStatus.classList.add('bad');
    }
  });

// depois — com o removeToken()
  document.getElementById('dash-logout')?.addEventListener('click', () => {
  clearSession();
  removeToken(); // ← adiciona essa linha
  showLogin();
});

  if (readSession()) showShell();
  else showLogin();

  function startShell() {
    const root = document.getElementById('dash-app');
    if (!root) return;

    const collabSection = document.getElementById('dash-collab-section');
    collabSection?.addEventListener('change', async (e) => {
      const inp = e.target;
      if (
        !inp ||
        inp.tagName !== 'INPUT' ||
        inp.type !== 'checkbox' ||
        !inp.classList.contains('dash-collab-acesso-toggle')
      )
        return;
      if (!getDashIsPlataformaAdmin()) return;
      if (!inp.closest('#dash-collab-table-wrap')) return;
      const tr = inp.closest('tr');
      const idStr = inp.getAttribute('data-dash-colab-id') || tr?.getAttribute('data-dash-colab-id');
      const cid = idStr ? parseInt(idStr, 10) : NaN;
      if (!Number.isFinite(cid)) return;
      const acessoAdministrador = !!inp.checked;
      const st = document.getElementById('dash-collab-list-status');
      if (st) {
        st.textContent = 'A gravar…';
        st.classList.remove('bad', 'ok');
      }
      const baseList = getDashApiPath('colaboradorList') || '/api/Colaborador';
      const putPath = `${baseList.replace(/\/$/, '')}/${cid}/acesso-administrador`;
      const pr = await dashFetchNoThrow(putPath, {
        method: 'PUT',
        body: JSON.stringify({ acessoAdministrador }),
      });
      if (st) {
        if (pr.ok) {
          st.textContent = 'Acesso atualizado.';
          st.classList.add('ok');
          st.classList.remove('bad');
        } else {
          const msg =
            (pr.data && typeof pr.data === 'object' && pr.data.message) ||
            'Não foi possível atualizar o acesso.';
          st.textContent = msg;
          st.classList.add('bad');
          st.classList.remove('ok');
        }
      }
      await loadDashColaboradoresList();
    });
    const fbSearchEl = document.getElementById('dash-fb-search');
    const fbList = document.getElementById('dash-fb-list');
    const fbEmpty = document.getElementById('dash-fb-empty');
    const fbStatus = document.getElementById('dash-fb-status');
    const fbRefresh = document.getElementById('dash-fb-refresh');
    const cardsRefresh = document.getElementById('dash-cards-refresh');

    function setDashView(name) {
      const view = String(name || 'home').trim() || 'home';
      root.querySelectorAll('[data-dash-view]').forEach((el) => {
        const v = el.getAttribute('data-dash-view');
        const on = v === view;
        el.toggleAttribute('hidden', !on);
        el.classList.toggle('dash-view--active', on);
      });
      updateDashCollabSectionVisibility(view);
    }

    window.__dashGoHome = () => setDashView('home');

    document.getElementById('dash-open-feedback')?.addEventListener('click', () => {
      setDashView('feedback');
      loadFeedback();
    });
    document.getElementById('dash-open-cards-hub')?.addEventListener('click', () => setDashView('cards-hub'));
    document.getElementById('dash-open-cards-edit')?.addEventListener('click', () => {
      setDashView('cards-edit');
      void syncIndexOrderPanelFromApi();
    });
    document.getElementById('dash-open-cards-create')?.addEventListener('click', () => {
      resetCardWizard();
      setDashView('cards-create');
    });

    /** Delegação: clique no texto dentro do botão «VOLTAR» também volta ao destino certo. */
    root.addEventListener('click', (e) => {
      const el = e.target instanceof Element ? e.target : e.target.parentElement;
      const back = el?.closest('[data-dash-back]');
      if (!back || !root.contains(back)) return;
      e.preventDefault();
      const target = back.getAttribute('data-dash-back') || 'home';
      setDashView(target);
    });

    root.querySelectorAll('[data-dash-fb-scope]').forEach((btn) => {
      btn.addEventListener('click', () => {
        fbScope = btn.dataset.dashFbScope || 'pending';
        root.querySelectorAll('[data-dash-fb-scope]').forEach((b) => {
          b.classList.toggle('active', b.dataset.dashFbScope === fbScope);
        });
        loadFeedback();
      });
    });

    const dashApiCardPanelPath = (slug) =>
      `/api/card/panel/${encodeURIComponent(String(slug || '').trim())}`;

    /** Tenta `panel/{slug}`; se 404 ou falhar, casa com `/api/card/dashboard` (slug insensível a maiúsculas) e carrega `/api/card/for-edit/id/{id}`. */
    async function dashFetchCardMetaForEditor(slug) {
      try {
        return await fetchJson(dashApiCardPanelPath(slug));
      } catch (e1) {
        let list;
        try {
          list = await fetchJson('/api/card/dashboard');
        } catch {
          throw e1;
        }
        const desired = String(slug || '').trim().toLowerCase();
        const arr = Array.isArray(list) ? list : [];
        const hit = arr.find(
          (c) =>
            String(c.slug ?? c.Slug ?? '')
              .trim()
              .toLowerCase() === desired,
        );
        if (!hit) throw e1;
        const nid = Number(hit.id ?? hit.Id ?? 0);
        if (Number.isFinite(nid) && nid > 0) {
          try {
            return await fetchJson(`/api/card/for-edit/id/${nid}`);
          } catch {
            /* resumo sem slides completos */
          }
        }
        return hit;
      }
    }

    /** Labels para a lista «CARDS NO INDEX» (inclui cards criados na API). */
    let dashIndexCardLabels = {};
    /** slug → id numérico (excluir card na API). */
    let dashIndexCardIds = {};

    function mergeIndexOrderWithDashboardCards(order, cardsNorm) {
      const sorted = [...cardsNorm].sort((a, b) => a.sort_order - b.sort_order);
      const apiSlugs = sorted.map((c) => c.slug).filter(Boolean);
      const apiSet = new Set(apiSlugs);
      const kept = order.filter((s) => apiSet.has(s));
      const tail = apiSlugs.filter((s) => !kept.includes(s));
      return [...kept, ...tail];
    }

    async function syncIndexOrderPanelFromApi() {
      try {
        const data = await fetchJson('/api/card/dashboard');
        const arr = Array.isArray(data) ? data : [];
        dashIndexCardIds = {};
        arr.forEach((raw) => {
          if (!dashIsCardPublishedInApi(raw)) return;
          const slug = String(raw.slug ?? raw.Slug ?? '')
            .trim()
            .toLowerCase();
          const id = Number(raw.id ?? raw.Id ?? 0);
          if (slug && Number.isFinite(id) && id > 0) dashIndexCardIds[slug] = id;
        });
        const cards = arr
          .filter(dashIsCardPublishedInApi)
          .map(dashNormalizeCard)
          .filter((c) => c.slug);
        dashIndexCardLabels = Object.fromEntries(cards.map((c) => [c.slug, c.display_name || c.slug]));
        const merged = mergeIndexOrderWithDashboardCards(getIndexCardOrder(), cards);
        setIndexCardOrder(merged);
        renderIndexOrderList();
        applyIndexCardOrder();
      } catch (_) {
        renderIndexOrderList();
      }
    }

    async function dashDeleteCardFromList(slug) {
      const id = dashIndexCardIds[slug];
      if (!id) {
        globalThis.alert('Card não encontrado na API ou já foi removido.');
        return;
      }
      if (
        !globalThis.confirm(
          `Excluir o card «${slug}»? Deixa de aparecer no index (inativo na API).`,
        )
      ) {
        return;
      }
      const st = document.getElementById('dash-index-order-status');
      try {
        if (st) st.textContent = 'A excluir…';
        await fetchJson(`/api/card/${id}`, { method: 'DELETE' });
        const o = getIndexCardOrder().filter((s) => s !== slug);
        setIndexCardOrder(o);
        if (st) {
          st.textContent = 'Card excluído.';
          st.classList.add('ok');
        }
        await syncIndexOrderPanelFromApi();
      } catch (e) {
        if (st) {
          st.textContent =
            e?.status === 403
              ? 'Só o administrador da plataforma pode excluir cards.'
              : e?.message || 'Não foi possível excluir.';
          st.classList.add('bad');
        }
      }
    }

    function renderIndexOrderList() {
      const ul = document.getElementById('dash-index-order-list');
      if (!ul) return;
      ul.innerHTML = '';
      const order = getIndexCardOrder();
      const canDelete = getDashIsPlataformaAdmin();
      order.forEach((slug, idx) => {
        const def = BUILDXP_INDEX_CARD_DEFS.find((d) => d.slug === slug);
        const label = def?.label ?? dashIndexCardLabels[slug] ?? slug;
        const li = document.createElement('li');
        li.className = 'dash-index-order-item';
        const row = document.createElement('div');
        row.className = 'dash-index-order-row';
        row.innerHTML = `
          <div class="dash-index-order-head">
            <div>
              <span class="dash-index-order-title">${dashEscapeHtml(label)}</span>
              <code class="dash-index-order-slug">${dashEscapeHtml(slug)}</code>
            </div>
            <div class="dash-index-order-btns">
              <button type="button" class="term-btn ghost" data-idx-move="${idx}" data-dir="-1" ${idx === 0 ? 'disabled' : ''} title="Subir">↑</button>
              <button type="button" class="term-btn ghost" data-idx-move="${idx}" data-dir="1" ${idx === order.length - 1 ? 'disabled' : ''} title="Descer">↓</button>
            </div>
          </div>
          <div class="dash-index-order-actions">
            <button type="button" class="term-btn primary" data-edit-slug="${slug}">Editar Slide</button>
            ${canDelete ? `<button type="button" class="term-btn ghost danger" data-delete-slug="${slug}">Excluir card</button>` : ''}
          </div>
        `;
        li.appendChild(row);
        ul.appendChild(li);
      });
      ul.querySelectorAll('[data-edit-slug]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const slug = btn.getAttribute('data-edit-slug');
          if (slug) openIndexCardForDeepEdit(slug);
        });
      });
      ul.querySelectorAll('[data-delete-slug]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const slug = btn.getAttribute('data-delete-slug');
          if (slug) void dashDeleteCardFromList(slug);
        });
      });
      ul.querySelectorAll('[data-idx-move]').forEach((b) => {
        b.addEventListener('click', () => {
          const i = Number.parseInt(b.getAttribute('data-idx-move'), 10);
          const dir = Number.parseInt(b.getAttribute('data-dir'), 10);
          const o = getIndexCardOrder();
          const j = i + dir;
          if (j < 0 || j >= o.length) return;
          const t = o[i];
          o[i] = o[j];
          o[j] = t;
          setIndexCardOrder(o);
          renderIndexOrderList();
          applyIndexCardOrder();
        });
      });
    }

    let editSlides = [];
    let editSlidesSlug = null;
    let cardEditorStepIndex = 0;

    function dashSyncCardFormBorderFromThemePreset() {
      const t = document.getElementById('dash-card-theme')?.value || 'git';
      const hex = buildxpPresetHexForTheme(t);
      const picker = document.getElementById('dash-card-border-picker');
      const hexInp = document.getElementById('dash-card-border-hex');
      if (picker) picker.value = hex;
      if (hexInp) hexInp.value = hex;
    }

    function dashSyncWizBorderFromThemePreset() {
      const t = document.getElementById('dash-wiz-theme')?.value || 'git';
      const hex = buildxpPresetHexForTheme(t);
      const picker = document.getElementById('dash-wiz-border-picker');
      const hexInp = document.getElementById('dash-wiz-border-hex');
      if (picker) picker.value = hex;
      if (hexInp) hexInp.value = hex;
    }

    function syncSlideEditThemeFromForm() {
      const panel = document.getElementById('dash-card-editor-theme-host');
      if (!panel) return;
      const raw = String(document.getElementById('dash-card-theme')?.value || 'git')
        .toLowerCase()
        .replace(/[^a-z]/g, '');
      const theme = ['docker', 'npm', 'dotnet', 'api'].includes(raw) ? raw : 'git';
      panel.classList.remove('c-git', 'c-docker', 'c-npm', 'c-dotnet', 'c-api', 'dash-slide-theme-host');
      panel.classList.add('dash-slide-theme-host', `c-${theme}`);
      const hex = buildxpNormalizeHexColor(document.getElementById('dash-card-border-hex')?.value);
      if (hex) {
        panel.style.setProperty('--cc', hex);
        panel.style.setProperty('--accent', hex);
      } else {
        panel.style.removeProperty('--cc');
        panel.style.removeProperty('--accent');
      }
    }

    function getEditSlidesContentOnly() {
      return editSlides.filter((s) => s && s.type !== 'fin');
    }

    function getCardEditorStepCount() {
      return 1 + getEditSlidesContentOnly().length;
    }

    async function loadCardEditorSlidesData(slug) {
      if (!slug) {
        editSlidesSlug = null;
        editSlides = [];
        renderEditSlides();
        return false;
      }
      editSlidesSlug = slug;
      editSlides = [];
      try {
        const meta = await dashFetchCardMetaForEditor(slug);
        const parsed = dashParseApiSlidesArrayForEditor(meta?.slides ?? meta?.Slides);
        if (parsed.length) editSlides = parsed;
      } catch (_) {
        /* fallback abaixo */
      }
      if (!dashSlidesHasEditableContent(editSlides)) {
        editSlides = await dashLoadSlidesForSlug(slug, { preferApi: true });
      }
      renderEditSlides();
      return true;
    }

    function setCardEditorScreenTitles(primary, sub) {
      const t = document.getElementById('dash-card-editor-screen-title');
      const s = document.getElementById('dash-card-editor-screen-sub');
      if (t) t.textContent = primary || 'Editar';
      if (s) s.textContent = sub || '';
    }

    function mountOneSlideEditor(rootEl, slide, headTitle) {
      if (!slide || slide.type === 'fin') return;
      try {
        const wrap = document.createElement('div');
        wrap.className = 'dash-wiz-slide-editor';
        wrap.dataset.slideId = slide.id || dashNewSlideId();
        if (!slide.id) slide.id = wrap.dataset.slideId;
        if (!slide.type) slide.type = 'content';

        if (slide.type === 'pause') {
          wrap.innerHTML = `
            <div class="dash-wiz-slide-head">
              <span class="ref-section-title" style="margin:0;">${dashEscapeHtml(headTitle)}</span>
              <button type="button" class="term-btn ghost danger dash-wiz-remove" data-rid="${slide.id}">REMOVER</button>
            </div>
            <label class="fb-label">Texto (corpo da pausa, como no site)</label>
            <div class="dash-slide-html-toolbar">
              <span class="dash-muted" style="font-size:0.72rem;">Formatação:</span>
              <button type="button" class="term-btn ghost dash-slide-fmt-strong" title="Negrito (&lt;strong&gt;) — inline, não quebra linha">
                <strong>B</strong>
              </button>
            </div>
            <div class="dash-slide-pause-text">
              <textarea class="fb-input fb-textarea dash-wiz-ta" data-f="text" rows="5"></textarea>
            </div>
            <label class="fb-label">Observação (opcional — mesmo padrão de borda do site)</label>
            <div class="callout callout-tip dash-slide-obs-wrap">
              <textarea class="dash-slide-obs-ta dash-wiz-ta" data-f="observation" rows="3" spellcheck="false"></textarea>
            </div>
          `;
          wrap.querySelector('[data-f="text"]').value = slide.text || '';
          wrap.querySelector('[data-f="observation"]').value = slide.observation || '';
        } else {
          wrap.innerHTML = `
            <div class="dash-wiz-slide-head">
              <span class="ref-section-title" style="margin:0;">${dashEscapeHtml(headTitle)}</span>
              <button type="button" class="term-btn ghost danger dash-wiz-remove" data-rid="${slide.id}">REMOVER</button>
            </div>
            <label class="fb-label">Título do slide
              <input type="text" class="fb-input dash-wiz-title-inp" maxlength="200" />
            </label>
            <div class="dash-wiz-inner-tabs" role="tablist">
              <button type="button" class="dash-wiz-inner-tab active" data-itab="text">TEXTO</button>
              <button type="button" class="dash-wiz-inner-tab" data-itab="cmd">COMANDOS</button>
              <button type="button" class="dash-wiz-inner-tab" data-itab="obs">OBSERVAÇÃO</button>
            </div>
            <div class="dash-wiz-inner-pane active" data-ipane="text">
              <div class="dash-slide-html-toolbar">
                <span class="dash-muted" style="font-size:0.72rem;">Formatação:</span>
                <button type="button" class="term-btn ghost dash-slide-fmt-strong" title="Negrito (&lt;strong&gt;) — inline, não quebra linha">
                  <strong>B</strong>
                </button>
              </div>
              <label class="fb-label">Conteúdo (HTML) — preferir &lt;strong&gt; para negrito (usa o botão B)
                <textarea class="fb-input fb-textarea dash-wiz-ta" data-f="text" rows="6"></textarea>
              </label>
            </div>
            <div class="dash-wiz-inner-pane" data-ipane="cmd" hidden>
              <p class="dash-muted dash-slide-tab-hint">Bloco de comandos — mesma caixa colorida do treino (cor do card em Tema).</p>
              <div class="cmd-block dash-slide-cmd-block">
                <textarea class="dash-slide-cmd-ta dash-wiz-ta mono" data-f="commands" rows="10" spellcheck="false" placeholder="Comandos, um por linha…"></textarea>
              </div>
            </div>
            <div class="dash-wiz-inner-pane" data-ipane="obs" hidden>
              <p class="dash-muted dash-slide-tab-hint">Observação — mesmo estilo de callout (borda) das páginas publicadas.</p>
              <div class="callout callout-tip dash-slide-obs-wrap">
                <textarea class="dash-slide-obs-ta dash-wiz-ta" data-f="observation" rows="5" spellcheck="false" placeholder="Opcional — deixe vazio se não quiser observação neste slide."></textarea>
              </div>
            </div>
          `;
          const tin = wrap.querySelector('.dash-wiz-title-inp');
          if (tin) tin.value = slide.title || '';
          tin?.addEventListener('input', () => {
            slide.title = tin.value;
          });
          wrap.querySelector('[data-f="text"]').value = slide.text || '';
          wrap.querySelector('[data-f="commands"]').value = slide.commands || '';
          wrap.querySelector('[data-f="observation"]').value = slide.observation || '';
        }

        wrap.querySelectorAll('.dash-wiz-ta').forEach((ta) => {
          ta.addEventListener('input', () => {
            const f = ta.getAttribute('data-f');
            if (f) slide[f] = ta.value;
          });
        });

        wrap.querySelectorAll('.dash-wiz-remove').forEach((rb) => {
          rb.addEventListener('click', () => {
            const rid = rb.getAttribute('data-rid');
            const csBefore = getEditSlidesContentOnly();
            const removedIdx = csBefore.findIndex((x) => x.id === rid);
            editSlides = editSlides.filter((s) => s.id !== rid);
            const newCount = getCardEditorStepCount();
            if (cardEditorStepIndex > 0 && removedIdx >= 0 && removedIdx < cardEditorStepIndex) {
              cardEditorStepIndex -= 1;
            }
            if (cardEditorStepIndex >= newCount) cardEditorStepIndex = Math.max(0, newCount - 1);
            renderEditSlides();
          });
        });

        wrap.querySelectorAll('.dash-wiz-inner-tab').forEach((tab) => {
          tab.addEventListener('click', () => {
            const key = tab.getAttribute('data-itab');
            wrap.querySelectorAll('.dash-wiz-inner-tab').forEach((t) => t.classList.toggle('active', t === tab));
            wrap.querySelectorAll('.dash-wiz-inner-pane').forEach((p) => {
              p.hidden = p.getAttribute('data-ipane') !== key;
              p.classList.toggle('active', p.getAttribute('data-ipane') === key);
            });
          });
        });

        dashBindSlideStrongToolbar(wrap);

        rootEl.appendChild(wrap);
      } catch (_) {
        /* ignorado */
      }
    }

    function renderCardEditorChrome() {
      const meta = document.getElementById('dash-card-editor-step-meta');
      const slidesPane = document.getElementById('dash-card-editor-step-slides');
      const rootEl = document.getElementById('dash-edit-slides-root');
      const stepLabelEl = document.getElementById('dash-card-editor-step-label');
      const prevBtn = document.getElementById('dash-card-editor-prev');
      const nextBtn = document.getElementById('dash-card-editor-next');
      const addBar = document.getElementById('dash-card-editor-addbar');
      if (!meta || !slidesPane || !rootEl) return;

      const n = getCardEditorStepCount();
      if (cardEditorStepIndex >= n) cardEditorStepIndex = Math.max(0, n - 1);
      if (cardEditorStepIndex < 0) cardEditorStepIndex = 0;

      if (addBar) addBar.hidden = !editSlidesSlug;

      if (cardEditorStepIndex === 0) {
        meta.hidden = false;
        slidesPane.hidden = true;
        if (stepLabelEl) stepLabelEl.textContent = `1 / ${n} · Card (metadados · API)`;
      } else {
        meta.hidden = true;
        slidesPane.hidden = false;
        const cs = getEditSlidesContentOnly();
        const idx = cardEditorStepIndex - 1;
        const slide = cs[idx];
        if (stepLabelEl) {
          const kind = slide?.type === 'pause' ? 'Pausa' : 'Conteúdo';
          stepLabelEl.textContent = `${cardEditorStepIndex + 1} / ${n} · ${kind}`;
        }
        rootEl.innerHTML = '';
        if (slide) {
          let headTitle = `SLIDE ${idx + 1}`;
          if (slide.type === 'pause') {
            headTitle = `PAUSA ${cs.slice(0, idx + 1).filter((x) => x.type === 'pause').length}`;
          } else {
            headTitle = `SLIDE ${cs.slice(0, idx + 1).filter((x) => x.type !== 'pause').length}`;
          }
          mountOneSlideEditor(rootEl, slide, headTitle);
        } else if (editSlidesSlug) {
          const def = BUILDXP_INDEX_CARD_DEFS.find((d) => d.slug === editSlidesSlug);
          const pageHint = def ? dashEscapeHtml(def.page) : editSlidesSlug;
          rootEl.innerHTML = `
            <div class="dash-edit-slides-empty dash-muted" style="padding:1rem;border:1px dashed rgba(255,255,255,0.2);border-radius:8px;">
              <p style="margin:0 0 0.5rem;"><strong>Nenhum slide de conteúdo carregado</strong> para <code>${dashEscapeHtml(editSlidesSlug)}</code>.</p>
              <p style="margin:0;">Sirva o dashboard por HTTP na mesma pasta que <code>${pageHint || '—'}</code> para o navegador carregar o HTML do treino, ou use «+ slide» acima. Abrir em <code>file://</code> costuma bloquear o carregamento.</p>
            </div>`;
        }
      }
      if (prevBtn) prevBtn.disabled = cardEditorStepIndex <= 0;
      if (nextBtn) nextBtn.disabled = cardEditorStepIndex >= n - 1;
      syncSlideEditThemeFromForm();
    }

    function renderEditSlides() {
      renderCardEditorChrome();
    }

    async function openIndexCardForDeepEdit(slug) {
      if (!slug) return;
      setSlidesSaveStatus('', '');
      editingCardSlug = slug;
      editingCardNumericId = null;
      const staticD = INDEX_CARD_STATIC_DEFAULTS[slug];
      if (staticD) dashApplyCardToForm(staticD);
      try {
        const raw = await dashFetchCardMetaForEditor(slug);
        dashApplyCardToForm(raw);
        editingCardNumericId = Number(raw?.id ?? raw?.Id ?? 0) || null;
      } catch (_) {
        /* sem API: mantém estático se existir */
      }
      await loadCardEditorSlidesData(slug);
      setDashView('card-editor');
      const disp =
        BUILDXP_INDEX_CARD_DEFS.find((d) => d.slug === slug)?.label ??
        document.getElementById('dash-card-display')?.value?.trim() ??
        slug;
      setCardEditorScreenTitles(`Editar · ${disp}`, `slug: ${slug}`);
      cardEditorStepIndex = getEditSlidesContentOnly().length ? 1 : 0;
      renderCardEditorChrome();
      resetDashCardIconFileUi();
      syncDashCardIconPreviewFromInput();
    }

    function insertEditSlideBeforeFin(newSlide) {
      const finIdx = editSlides.findIndex((s) => s.type === 'fin');
      if (finIdx >= 0) editSlides.splice(finIdx, 0, newSlide);
      else editSlides.push(newSlide);
    }

    const slidesSaveStatusEl = document.getElementById('dash-card-editor-slides-status');
    function setSlidesSaveStatus(msg, kind) {
      if (!slidesSaveStatusEl) return;
      slidesSaveStatusEl.textContent = msg || '';
      slidesSaveStatusEl.classList.toggle('ok', kind === 'ok');
      slidesSaveStatusEl.classList.toggle('bad', kind === 'bad');
    }

    document.getElementById('dash-slides-save')?.addEventListener('click', async () => {
      if (!editSlidesSlug) return;

      setSlidesSaveStatus('', '');
      let meta = null;
      try {
        meta = await dashFetchCardMetaForEditor(editSlidesSlug);
      } catch (_) {
        setSlidesSaveStatus(
          'Não foi possível carregar dados do card (slug, JWT ou servidor). Faça login e confira se este slug existe na API.',
          'bad',
        );
        return;
      }

      const slidesParaSalvar = getEditSlidesContentOnly();

      try {
        const syncBody = { slides: dashSlidesToSyncPayload(slidesParaSalvar) };
        const cardId = Number(meta?.id ?? meta?.Id ?? editingCardNumericId ?? 0);
        if (Number.isFinite(cardId) && cardId > 0) {
          await fetchJson(`/api/card/${cardId}/slides/sync`, {
            method: 'PUT',
            body: JSON.stringify(syncBody),
          });
        } else {
          await fetchJson(`/api/card/${encodeURIComponent(editSlidesSlug)}/slides/sync`, {
            method: 'PUT',
            body: JSON.stringify(syncBody),
          });
        }

        try {
          localStorage.setItem(dashSlidesStorageKey(editSlidesSlug), JSON.stringify(editSlides));
        } catch (_) { /* ignore */ }

        setSlidesSaveStatus('Slides guardados na API com sucesso.', 'ok');

        const btn = document.getElementById('dash-slides-save');
        if (btn) {
          const original = btn.textContent;
          btn.textContent = '✓ SALVO';
          btn.disabled = true;
          setTimeout(() => {
            btn.textContent = original;
            btn.disabled = false;
          }, 2000);
        }
      } catch (e) {
        try {
          localStorage.setItem(dashSlidesStorageKey(editSlidesSlug), JSON.stringify(editSlides));
        } catch (_) { /* ignore */ }
        const extra =
          e?.status === 401
            ? ' Faça login com o utilizador admin (JWT).'
            : e?.message
              ? ` ${e.message}`
              : '';
        setSlidesSaveStatus(
          `Erro ao salvar na API.${extra} Os slides foram gravados só no navegador (localStorage).`,
          'bad',
        );
      }
    });

    document.getElementById('dash-card-editor-prev')?.addEventListener('click', () => {
      if (cardEditorStepIndex > 0) {
        cardEditorStepIndex -= 1;
        renderCardEditorChrome();
      }
    });
    document.getElementById('dash-card-editor-next')?.addEventListener('click', () => {
      const n = getCardEditorStepCount();
      if (cardEditorStepIndex < n - 1) {
        cardEditorStepIndex += 1;
        renderCardEditorChrome();
      }
    });

    document.getElementById('dash-edit-add-content')?.addEventListener('click', () => {
      if (!editSlidesSlug) return;
      insertEditSlideBeforeFin({
        id: dashNewSlideId(),
        type: 'content',
        title: '',
        text: '',
        commands: '',
        observation: '',
      });
      cardEditorStepIndex = getCardEditorStepCount() - 1;
      renderCardEditorChrome();
    });

    document.getElementById('dash-edit-add-pause')?.addEventListener('click', () => {
      if (!editSlidesSlug) return;
      insertEditSlideBeforeFin({
        id: dashNewSlideId(),
        type: 'pause',
        text: '',
        observation: '',
      });
      cardEditorStepIndex = getCardEditorStepCount() - 1;
      renderCardEditorChrome();
    });

    let wizSlides = [];
    let wizIconDataUrl = '';
    let wizIconPrimaryPath = '';

    function resetCardWizard() {
      wizSlides = [];
      wizIconDataUrl = '';
      wizIconPrimaryPath = '';
      const ids = [
        'dash-wiz-slug',
        'dash-wiz-theme',
        'dash-wiz-title',
        'dash-wiz-badge',
        'dash-wiz-class',
        'dash-wiz-desc',
        'dash-wiz-xpc',
        'dash-wiz-xpm',
      ];
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === 'number') el.value = id === 'dash-wiz-xpm' ? '3000' : '0';
        else if (id === 'dash-wiz-theme') el.value = 'git';
        else el.value = '';
      });
      const file = document.getElementById('dash-wiz-icon-file');
      if (file) file.value = '';
      const prev = document.getElementById('dash-wiz-icon-preview');
      if (prev) {
        prev.removeAttribute('src');
        prev.hidden = true;
      }
      dashSyncWizBorderFromThemePreset();
      const meta = document.getElementById('dash-create-step-meta');
      const slides = document.getElementById('dash-create-step-slides');
      if (meta) meta.hidden = false;
      if (slides) slides.hidden = true;
      const st = document.getElementById('dash-wiz-status');
      if (st) st.textContent = '';
    }

    function buildWizMeta() {
      return {
        title: document.getElementById('dash-wiz-title')?.value?.trim() || '',
        badge: document.getElementById('dash-wiz-badge')?.value?.trim() || '',
        cardClass: document.getElementById('dash-wiz-class')?.value?.trim() || '',
        desc: document.getElementById('dash-wiz-desc')?.value?.trim() || '',
        xpCurrent: Number.parseInt(document.getElementById('dash-wiz-xpc')?.value, 10) || 0,
        xpMax: Number.parseInt(document.getElementById('dash-wiz-xpm')?.value, 10) || 3000,
        iconDataUrl: wizIconDataUrl || null,
        iconPath: wizIconPrimaryPath || null,
      };
    }

    function renderWizSlides() {
      const rootEl = document.getElementById('dash-wiz-slides-root');
      if (!rootEl) return;
      rootEl.innerHTML = '';
      wizSlides.forEach((slide, slideIndex) => {
        const wrap = document.createElement('div');
        wrap.className = 'dash-wiz-slide-editor';
        wrap.dataset.slideId = slide.id;

        if (slide.type === 'pause') {
          wrap.innerHTML = `
            <div class="dash-wiz-slide-head">
              <span class="ref-section-title" style="margin:0;">PAUSA ${slideIndex + 1}</span>
              <button type="button" class="term-btn ghost danger dash-wiz-remove" data-rid="${slide.id}">REMOVER</button>
            </div>
            <label class="fb-label">Texto</label>
            <div class="dash-slide-html-toolbar">
              <span class="dash-muted" style="font-size:0.72rem;">Formatação:</span>
              <button type="button" class="term-btn ghost dash-slide-fmt-strong" title="Negrito (&lt;strong&gt;) — inline">
                <strong>B</strong>
              </button>
            </div>
            <textarea class="fb-input fb-textarea dash-wiz-ta" data-f="text" rows="4"></textarea>
            <label class="fb-label">Observação (opcional — some no slide se vazio)
              <textarea class="fb-input fb-textarea dash-wiz-ta" data-f="observation" rows="2"></textarea>
            </label>
          `;
          wrap.querySelector('[data-f="text"]').value = slide.text || '';
          wrap.querySelector('[data-f="observation"]').value = slide.observation || '';
        } else {
          wrap.innerHTML = `
            <div class="dash-wiz-slide-head">
              <span class="ref-section-title" style="margin:0;">SLIDE ${slideIndex + 1}</span>
              <button type="button" class="term-btn ghost danger dash-wiz-remove" data-rid="${slide.id}">REMOVER</button>
            </div>
            <label class="fb-label">Título do slide (cabeçalho na página pública)
              <input type="text" class="fb-input dash-wiz-title-inp" maxlength="200" placeholder="Ex.: Instalar o SDK" />
            </label>
            <div class="dash-wiz-inner-tabs" role="tablist">
              <button type="button" class="dash-wiz-inner-tab active" data-itab="text">TEXTO</button>
              <button type="button" class="dash-wiz-inner-tab" data-itab="cmd">COMANDOS</button>
              <button type="button" class="dash-wiz-inner-tab" data-itab="obs">OBSERVAÇÃO</button>
            </div>
            <div class="dash-wiz-inner-pane active" data-ipane="text">
              <div class="dash-slide-html-toolbar">
                <span class="dash-muted" style="font-size:0.72rem;">Formatação:</span>
                <button type="button" class="term-btn ghost dash-slide-fmt-strong" title="Negrito (&lt;strong&gt;) — inline">
                  <strong>B</strong>
                </button>
              </div>
              <label class="fb-label">Conteúdo (texto / HTML simples) — botão <strong>B</strong> insere &lt;strong&gt;
                <textarea class="fb-input fb-textarea dash-wiz-ta" data-f="text" rows="6"></textarea>
              </label>
            </div>
            <div class="dash-wiz-inner-pane" data-ipane="cmd" hidden>
              <label class="fb-label">Bloco verde (comandos)
                <textarea class="fb-input fb-textarea dash-wiz-ta mono" data-f="commands" rows="8" placeholder="npm install ..."></textarea>
              </label>
            </div>
            <div class="dash-wiz-inner-pane" data-ipane="obs" hidden>
              <label class="fb-label">Observação na borda verde (opcional)
                <textarea class="fb-input fb-textarea dash-wiz-ta" data-f="observation" rows="3"></textarea>
              </label>
            </div>
          `;
          wrap.querySelector('[data-f="text"]').value = slide.text || '';
          wrap.querySelector('[data-f="commands"]').value = slide.commands || '';
          wrap.querySelector('[data-f="observation"]').value = slide.observation || '';
          const wTitle = wrap.querySelector('.dash-wiz-title-inp');
          if (wTitle) {
            wTitle.value = slide.title || '';
            wTitle.addEventListener('input', () => {
              slide.title = wTitle.value;
            });
          }
        }

        wrap.querySelectorAll('.dash-wiz-ta').forEach((ta) => {
          ta.addEventListener('input', () => {
            const f = ta.getAttribute('data-f');
            if (f) slide[f] = ta.value;
          });
        });

        wrap.querySelectorAll('.dash-wiz-remove').forEach((rb) => {
          rb.addEventListener('click', () => {
            const rid = rb.getAttribute('data-rid');
            wizSlides = wizSlides.filter((s) => s.id !== rid);
            renderWizSlides();
          });
        });

        wrap.querySelectorAll('.dash-wiz-inner-tab').forEach((tab) => {
          tab.addEventListener('click', () => {
            const key = tab.getAttribute('data-itab');
            wrap.querySelectorAll('.dash-wiz-inner-tab').forEach((t) => t.classList.toggle('active', t === tab));
            wrap.querySelectorAll('.dash-wiz-inner-pane').forEach((p) => {
              p.hidden = p.getAttribute('data-ipane') !== key;
              p.classList.toggle('active', p.getAttribute('data-ipane') === key);
            });
          });
        });

        dashBindSlideStrongToolbar(wrap);

        rootEl.appendChild(wrap);
      });
    }

    document.getElementById('dash-wiz-icon-file')?.addEventListener('change', async (ev) => {
      const f = ev.target.files?.[0];
      const img = document.getElementById('dash-wiz-icon-preview');
      const wizSt = document.getElementById('dash-wiz-status');
      if (!f) return;
      if (wizSt) {
        wizSt.textContent = '';
        wizSt.classList.remove('ok', 'bad');
      }
      const blobUrl = URL.createObjectURL(f);
      if (img) {
        img.src = blobUrl;
        img.hidden = false;
      }
      const up = await dashUploadCardIconFile(f);
      URL.revokeObjectURL(blobUrl);
      if (!up?.iconRef) {
        wizIconPrimaryPath = '';
        wizIconDataUrl = '';
        if (img) {
          img.removeAttribute('src');
          img.hidden = true;
        }
        if (wizSt) {
          wizSt.textContent =
            up?.error ||
            'Upload do ícone falhou. Confirme sessão (JWT), tipo (PNG, JPEG, WebP, GIF, SVG) e máx. 2 MB.';
          wizSt.classList.add('bad');
        }
        return;
      }
      wizIconPrimaryPath = up.iconRef;
      wizIconDataUrl = '';
      if (img) {
        img.src = up.previewUrl || dashIconPreviewSrc(up.iconRef);
        img.hidden = false;
      }
      if (wizSt) {
        wizSt.textContent = `Ícone enviado (${up.iconRef})`;
        wizSt.classList.add('ok');
        wizSt.classList.remove('bad');
      }
    });

    document.getElementById('dash-wiz-to-slides')?.addEventListener('click', () => {
      const m = buildWizMeta();
      if (!m.title || !m.badge || !m.cardClass) {
        const st = document.getElementById('dash-wiz-status');
        if (st) st.textContent = '';
        return;
      }
      const metaEl = document.getElementById('dash-create-step-meta');
      const slidesEl = document.getElementById('dash-create-step-slides');
      if (metaEl) metaEl.hidden = true;
      if (slidesEl) slidesEl.hidden = false;
      if (!wizSlides.length) {
        wizSlides.push({
          id: dashNewSlideId(),
          type: 'content',
          title: '',
          text: '',
          commands: '',
          observation: '',
        });
      }
      renderWizSlides();
    });

    document.getElementById('dash-wiz-back-meta')?.addEventListener('click', () => {
      const metaEl = document.getElementById('dash-create-step-meta');
      const slidesEl = document.getElementById('dash-create-step-slides');
      if (metaEl) metaEl.hidden = false;
      if (slidesEl) slidesEl.hidden = true;
    });

    document.getElementById('dash-wiz-add-content')?.addEventListener('click', () => {
      wizSlides.push({
        id: dashNewSlideId(),
        type: 'content',
        title: '',
        text: '',
        commands: '',
        observation: '',
      });
      renderWizSlides();
    });

    document.getElementById('dash-wiz-add-pause')?.addEventListener('click', () => {
      wizSlides.push({ id: dashNewSlideId(), type: 'pause', text: '', observation: '' });
      renderWizSlides();
    });

    async function dashWizardPublishToApi() {
      const st = document.getElementById('dash-wiz-status');
      if (st) {
        st.classList.remove('ok', 'bad');
      }
      const slugRaw = (document.getElementById('dash-wiz-slug')?.value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '')
        .slice(0, 48);
      let slugNorm = slugRaw || null;

      const slugEl = document.getElementById('dash-wiz-slug');
      const meta = buildWizMeta();
      const theme = document.getElementById('dash-wiz-theme')?.value || 'git';
      const body = buildWizCardPayloadForApi(slugNorm, meta, theme);

      try {
        let effectiveSlug = slugNorm;

        if (effectiveSlug) {
          try {
            await fetchJson(`/api/card/${encodeURIComponent(effectiveSlug)}`, {
              method: 'PUT',
              body: JSON.stringify(body),
            });
          } catch (err) {
            if (err.status !== 404) throw err;
            const created = await fetchJson('/api/card', {
              method: 'POST',
              body: JSON.stringify(body),
            });
            effectiveSlug = String(created.slug ?? created.Slug ?? '').trim().toLowerCase();
            if (slugEl && effectiveSlug) slugEl.value = effectiveSlug;
          }
        } else {
          const created = await fetchJson('/api/card', {
            method: 'POST',
            body: JSON.stringify(body),
          });
          effectiveSlug = String(created.slug ?? created.Slug ?? '').trim().toLowerCase();
          if (!effectiveSlug) throw new Error('A API não devolveu slug para o card criado.');
          if (slugEl) slugEl.value = effectiveSlug;
        }

        slugNorm = effectiveSlug;
        if (!slugNorm) throw new Error('Sem slug após criar/atualizar.');

        const syncBody = { slides: dashSlidesToSyncPayload(wizSlides) };
        await fetchJson(`/api/card/${encodeURIComponent(slugNorm)}/slides/sync`, {
          method: 'PUT',
          body: JSON.stringify(syncBody),
        });

        try {
          localStorage.setItem(dashSlidesStorageKey(slugNorm), JSON.stringify(wizSlides));
        } catch (_) {
          /* ignorado */
        }

        if (st) {
          st.textContent =
            `Publicado (slug «${slugNorm}»). O index.html lê GET /api/card — recarrega a página inicial para ver o card na faixa. Abrir: card.html?slug=${encodeURIComponent(slugNorm)}&tab=beginner`;
          st.classList.add('ok');
          st.classList.remove('bad');
        }
        await syncIndexOrderPanelFromApi();
      } catch (e) {
        if (st) {
          const stCode = e && typeof e.status === 'number' ? e.status : 0;
          let msg =
            (e && e.message) ||
            'Erro ao publicar. Confirme sessão (login) e que o slug não está em uso.';
          if (stCode === 401) msg = 'Sessão expirada ou sem token. Volte a entrar no dashboard.';
          if (stCode === 403) msg = 'Sem permissão para criar/atualizar este card. Peça acesso de admin ou colaborador.';
          if (stCode === 404 && String(msg).toLowerCase().includes('not found'))
            msg = 'Card não encontrado na API (slug errado ou card apagado).';
          st.textContent = msg;
          st.classList.add('bad');
        }
      }
    }

    document.getElementById('dash-wiz-publish-api')?.addEventListener('click', () => {
      void dashWizardPublishToApi();
    });

    document.getElementById('dash-wiz-save-draft')?.addEventListener('click', () => {
      const meta = buildWizMeta();
      if (!meta.title) return;
      const publishedSlides = wizSlides.map((s) => {
        if (s.type === 'pause') {
          return {
            type: 'pause',
            text: s.text || '',
            observation: (s.observation || '').trim() || null,
          };
        }
        return {
          type: 'content',
          title: s.title || '',
          text: s.text || '',
          commands: s.commands || '',
          observation: (s.observation || '').trim() || null,
        };
      });
      const finalSlide = {
        type: 'fin',
        title: 'Conclusão',
        actions: ['voltar_inicio', 'iniciar_treinamento'],
      };
      const bundle = {
        version: 1,
        meta,
        slides: publishedSlides,
        finalSlide,
        savedAt: new Date().toISOString(),
      };
      try {
        let arr = [];
        try {
          arr = JSON.parse(localStorage.getItem(BUILDXP_WIZ_DRAFT_KEY) || '[]');
        } catch (_) {
          arr = [];
        }
        if (!Array.isArray(arr)) arr = [];
        arr.push(bundle);
        localStorage.setItem(BUILDXP_WIZ_DRAFT_KEY, JSON.stringify(arr));
        const st = document.getElementById('dash-wiz-status');
        if (st) {
          st.textContent = 'Rascunho guardado só neste navegador.';
          st.classList.remove('bad');
          st.classList.add('ok');
        }
      } catch (_) { /* ignore */ }
    });

    try {
      if (fbSearchEl) {
        fbSearchEl.value = sessionStorage.getItem('buildxp_fb_search') || '';
      }
    } catch (_) { /* ignore */ }

    fbSearchEl?.addEventListener('input', () => {
      try {
        sessionStorage.setItem('buildxp_fb_search', String(fbSearchEl.value || '').trim());
      } catch (_) { /* ignore */ }
      renderFeedbackListFromCache();
    });

    document.getElementById('dash-card-theme')?.addEventListener('change', () => {
      dashSyncCardFormBorderFromThemePreset();
      syncSlideEditThemeFromForm();
    });
    document.getElementById('dash-card-border-picker')?.addEventListener('input', (ev) => {
      const hexInp = document.getElementById('dash-card-border-hex');
      if (hexInp) hexInp.value = ev.target.value;
      syncSlideEditThemeFromForm();
    });
    document.getElementById('dash-card-border-hex')?.addEventListener('change', () => {
      const n = buildxpNormalizeHexColor(document.getElementById('dash-card-border-hex')?.value);
      const picker = document.getElementById('dash-card-border-picker');
      if (n && picker) picker.value = n;
      syncSlideEditThemeFromForm();
    });
    document.getElementById('dash-wiz-theme')?.addEventListener('change', () => {
      dashSyncWizBorderFromThemePreset();
    });

    function setFbStatus(msg, type) {
      if (!fbStatus) return;
      fbStatus.textContent = msg || '';
      fbStatus.classList.toggle('ok', type === 'ok');
      fbStatus.classList.toggle('bad', type === 'bad');
    }

    async function fetchJson(path, opts = {}) {
      const base = getBuildXpApiBase();
      const url = `${base}${path}`;
      const token = getToken(); // mesmo token JWT
    
      const res = await fetch(url, {
        ...opts,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(opts.headers || {}),
        },
      });
      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (_) {
        data = text;
      }
      if (!res.ok) {
        const msg =
          typeof data === 'object' && data !== null && data.message
            ? String(data.message)
            : res.statusText || 'Erro HTTP';
        const err = new Error(msg);
        err.status = res.status;
        err.body = data;
        throw err;
      }
      return data;
    }

    function fmtDate(iso) {
      try {
        const d = new Date(iso);
        return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
      } catch (_) {
        return String(iso || '');
      }
    }

    let fbCachedItems = [];

    function fbFeedbackMatchesQuery(it, queryRaw) {
      const q = String(queryRaw || '').trim().toLowerCase();
      if (!q) return true;
      const hay = [
        it.kind,
        it.name,
        it.msg,
        it.status,
        it.moderatedBy,
        it.moderatedAt,
        it.createdAt,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const tokens = q.split(/\s+/).filter(Boolean);
      if (!tokens.length) return true;
      return tokens.every((t) => hay.includes(t));
    }

    function renderFeedbackListFromCache() {
      if (!fbList || !fbEmpty) return;
      const q = fbSearchEl ? String(fbSearchEl.value || '') : '';
      const items = fbCachedItems.filter((it) => fbFeedbackMatchesQuery(it, q));
      fbList.innerHTML = '';
      if (!items.length) {
        fbEmpty.hidden = false;
        fbEmpty.textContent = '';
        return;
      }
      fbEmpty.hidden = true;
      items.forEach((it) => {
        const st = String(it.status || 'pending').toLowerCase();
        const stClass = st.replace(/[^a-z]/g, '') || 'pending';
        const canModerate = st === 'pending';
        const row = document.createElement('article');
        row.className = 'dash-queue-item';
        row.innerHTML = `
          <div class="dash-queue-top">
            <span class="fb-kind">${dashEscapeHtml(it.kind)}</span>
            <span class="dash-fb-status dash-fb-status--${stClass}">${dashEscapeHtml(st)}</span>
          </div>
          <div class="fb-meta">${dashEscapeHtml(it.name ? `${it.name} · ` : '')}${dashEscapeHtml(fmtDate(it.createdAt))}</div>
          <div class="dash-fb-decision-meta" ${canModerate ? 'hidden' : ''}></div>
          <div class="dash-queue-msg"></div>
          <div class="dash-queue-actions"></div>
        `;
        row.querySelector('.dash-queue-msg').textContent = it.msg;
        const decisionMeta = row.querySelector('.dash-fb-decision-meta');
        if (decisionMeta && !canModerate) {
          decisionMeta.removeAttribute('hidden');
          const verb = st === 'approved' ? 'Aprovado' : st === 'rejected' ? 'Rejeitado' : '';
          const who = (it.moderatedBy || '').trim();
          const whenRaw = (it.moderatedAt || '').trim();
          if (verb) {
            if (who && whenRaw) {
              decisionMeta.textContent = `${verb} por ${who} em ${fmtDate(whenRaw)}`;
            } else if (who) {
              decisionMeta.textContent = `${verb} por ${who}`;
            } else if (whenRaw) {
              decisionMeta.textContent = `${verb} em ${fmtDate(whenRaw)} (moderador não registado)`;
            } else {
              decisionMeta.textContent = `${verb} (sem registo de moderador)`;
            }
          }
        }
        const actions = row.querySelector('.dash-queue-actions');
        if (canModerate) {
          const approveBtn = document.createElement('button');
          approveBtn.type = 'button';
          approveBtn.className = 'term-btn primary';
          approveBtn.textContent = 'APROVAR';
          approveBtn.addEventListener('click', () => moderate(it.id, 'approved'));
          const rejectBtn = document.createElement('button');
          rejectBtn.type = 'button';
          rejectBtn.className = 'term-btn ghost danger';
          rejectBtn.textContent = 'REJEITAR';
          rejectBtn.addEventListener('click', () => moderate(it.id, 'rejected'));
          actions.appendChild(approveBtn);
          actions.appendChild(rejectBtn);
        } else if (st === 'approved') {
          const removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.className = 'term-btn ghost danger';
          removeBtn.textContent = 'REMOVER DO MURAL';
          removeBtn.addEventListener('click', () => removeFeedbackFromPublicWall(it.id));
          actions.appendChild(removeBtn);
        }
        fbList.appendChild(row);
      });
    }

    async function loadFeedback() {
      if (!fbList || !fbEmpty) return;
      fbCachedItems = [];
      fbList.innerHTML = '';
      fbEmpty.hidden = true;
      setFbStatus('', '');
      const path =
      fbScope === 'history'
        ? '/api/feedback/dashboard'
        : '/api/feedback/dashboard?status=Pendente';
      try {
        const data = await fetchJson(path);
        const arr = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];
        let items = arr.map(dashNormalizePending).filter(Boolean);
        if (fbScope === 'history') {
          items = items.filter((it) => {
            const st = String(it.status || '').toLowerCase();
            return st === 'approved' || st === 'rejected';
          });
        }
        setFbStatus('', '');
        fbCachedItems = items;
        if (!items.length) {
          fbEmpty.hidden = false;
          fbEmpty.textContent = '';
          return;
        }
        renderFeedbackListFromCache();
      } catch (e) {
      setFbStatus('', '');
      fbEmpty.hidden = false;
      fbEmpty.textContent = '';
    }
    }

  async function moderate(id, action) {
    const body = {};
    setFbStatus('', '');
    try {
      // nosso backend tem rotas separadas para aprovar e rejeitar
      const endpoint = action === 'approved'
        ? `/api/feedback/${encodeURIComponent(id)}/aprovar`
        : `/api/feedback/${encodeURIComponent(id)}/rejeitar`;
  
      await fetchJson(endpoint, { method: 'PATCH', body: JSON.stringify(body) });
      setFbStatus('', '');
      await loadFeedback();
    } catch (e) {
      setFbStatus('', '');
    }
  }

  async function removeFeedbackFromPublicWall(id) {
    if (
      !globalThis.confirm(
        'Remover esta mensagem do mural público? Será apagada da base de dados (irreversível).',
      )
    ) {
      return;
    }
    setFbStatus('', '');
    try {
      await fetchJson(`/api/feedback/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await loadFeedback();
    } catch (e) {
      setFbStatus(e?.message || 'Não foi possível remover.', 'bad');
    }
  }

  const cardForm = document.getElementById('dash-card-form');
  const cardFormStatus = document.getElementById('dash-card-form-status');

  function setCardFormStatus(msg, type) {
    if (!cardFormStatus) return;
    cardFormStatus.textContent = msg || '';
    cardFormStatus.classList.toggle('ok', type === 'ok');
    cardFormStatus.classList.toggle('bad', type === 'bad');
  }

  document.getElementById('dash-card-icon-file')?.addEventListener('change', async (ev) => {
    const f = ev.target.files?.[0];
    const img = document.getElementById('dash-card-icon-preview');
    const priInp = document.getElementById('dash-card-icon-pri');
    if (!f) return;
    setCardFormStatus('A enviar ícone…', '');
    revokeDashCardIconPreviewUrl();
    dashCardIconObjectUrl = URL.createObjectURL(f);
    if (img) {
      img.onload = () => {
        img.style.display = 'block';
      };
      img.onerror = () => {
        img.style.display = 'none';
      };
      img.src = dashCardIconObjectUrl;
    }
    const saved = await dashUploadCardIconFile(f);
    if (!saved?.iconRef) {
      setCardFormStatus(
        saved?.error ||
          'Não foi possível gravar o ficheiro. Confirme sessão (JWT), tipo (PNG, JPEG, WebP, GIF, SVG) e tamanho máx. 2 MB.',
        'bad',
      );
      return;
    }
    if (priInp) priInp.value = saved.iconRef;
    dashSetCardIconPathReadout(saved.iconRef);
    revokeDashCardIconPreviewUrl();
    if (img) {
      img.src = saved.previewUrl || dashIconPreviewSrc(saved.iconRef);
      img.style.display = 'block';
    }
    setCardFormStatus('Ícone enviado com sucesso.', 'ok');
  });

  document.getElementById('dash-card-icon-layout')?.addEventListener('change', syncDashCardIconDualLayout);

  async function loadCardForEdit(slug) {
    setCardFormStatus('', '');
    setSlidesSaveStatus('', '');
    try {
      const raw = await dashFetchCardMetaForEditor(slug);
      editingCardSlug = slug;
      editingCardNumericId = Number(raw?.id ?? raw?.Id ?? 0) || null;
      dashApplyCardToForm(raw);
      setCardFormStatus('', '');
      await loadCardEditorSlidesData(slug);
      setDashView('card-editor');
      const disp = document.getElementById('dash-card-display')?.value?.trim() || slug;
      setCardEditorScreenTitles(`Editar · ${disp}`, `slug: ${slug}`);
      cardEditorStepIndex = getEditSlidesContentOnly().length ? 1 : 0;
      renderCardEditorChrome();
      resetDashCardIconFileUi();
      syncDashCardIconPreviewFromInput();
    } catch (e) {
      editingCardSlug = null;
      editingCardNumericId = null;
      setCardFormStatus('', '');
      await loadCardEditorSlidesData(null);
    }
  }

  const cardsEditViewEl = () => root.querySelector('[data-dash-view="cards-edit"]');
  const isCardsEditViewActive = () => {
    const el = cardsEditViewEl();
    return !!(el && !el.hasAttribute('hidden'));
  };
  const isCardEditorViewActive = () => {
    const el = root.querySelector('[data-dash-view="card-editor"]');
    return !!(el && !el.hasAttribute('hidden'));
  };

  function dashFormatApiErrorMessage(errOrBody, fallbackMsg) {
    const b =
      errOrBody && typeof errOrBody.body === 'object' ? errOrBody.body : errOrBody && typeof errOrBody === 'object'
        ? errOrBody
        : null;
    if (!b || typeof b !== 'object') return fallbackMsg;
    const errors = b.errors ?? b.Errors;
    if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
      const bits = [];
      for (const k of Object.keys(errors)) {
        const v = errors[k];
        bits.push(Array.isArray(v) ? `${k}: ${v.join('; ')}` : `${k}: ${v}`);
      }
      if (bits.length) return bits.join(' ');
    }
    return String(b.detail ?? b.Detail ?? b.title ?? b.Title ?? b.message ?? b.Message ?? fallbackMsg);
  }

  cardForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if ((isCardsEditViewActive() || isCardEditorViewActive()) && !editingCardSlug) {
      setCardFormStatus('Selecione um card («Editar Slide» na lista «CARDS NO INDEX»). Criar card novo é só na aba «Criar card».', 'bad');
      return;
    }
    const slugRaw = document.getElementById('dash-card-slug').value.trim().toLowerCase();
    const slugNorm =
      slugRaw.replace(/[^a-z0-9_-]/g, '').slice(0, 48) || null;
    if (slugNorm) document.getElementById('dash-card-slug').value = slugNorm;

    const priRaw = document.getElementById('dash-card-icon-pri').value.trim();
    const iconPri = priRaw || 'imagens/logo2buildxpret.png';
    if (iconPri.length > 512) {
      setCardFormStatus(
        'Ícone primário: máximo 512 caracteres (limite da BD). Guarde o PNG/SVG em wwwroot/imagens/ e use um caminho curto.',
        'bad',
      );
      return;
    }
    const secondary = document.getElementById('dash-card-icon-sec').value.trim();
    if (secondary.length > 512) {
      setCardFormStatus('Ícone secundário: máximo 512 caracteres.', 'bad');
      return;
    }

    const themeSel = document.getElementById('dash-card-theme').value;
    const border_color =
      buildxpNormalizeHexColor(document.getElementById('dash-card-border-hex')?.value) ??
      buildxpPresetHexForTheme(themeSel);
    const body = {
      slug: slugNorm,
      theme: themeSel,
      border_color,
      rarity_label: document.getElementById('dash-card-rarity').value.trim(),
      card_class: document.getElementById('dash-card-class').value.trim(),
      display_name: document.getElementById('dash-card-display').value.trim(),
      description_html: document.getElementById('dash-card-desc').value,
      link_beginner: document.getElementById('dash-card-link-b').value.trim(),
      link_ref: document.getElementById('dash-card-link-r').value.trim(),
      xp_current: Number.parseInt(document.getElementById('dash-card-xpc').value, 10) || 0,
      xp_max: Number.parseInt(document.getElementById('dash-card-xpm').value, 10) || 3000,
      sort_order: Number.parseInt(document.getElementById('dash-card-sort').value, 10) || 0,
      btn_primary_label: document.getElementById('dash-card-btn1').value.trim() || '▶ COMEÇAR',
      btn_secondary_label: document.getElementById('dash-card-btn2').value.trim() || '🎮 CHEAT CODES',
      icon_layout: document.getElementById('dash-card-icon-layout').value || 'single',
      icon_primary_src: iconPri,
      icon_primary_alt: document.getElementById('dash-card-icon-pri-alt').value.trim(),
      icon_secondary_src: secondary || null,
      icon_secondary_alt: document.getElementById('dash-card-icon-sec-alt').value.trim(),
      is_published: document.getElementById('dash-card-published').checked,
    };
    setCardFormStatus('', '');
    try {
      if (editingCardSlug) {
        const numericId =
          editingCardNumericId != null &&
          typeof editingCardNumericId === 'number' &&
          Number.isFinite(editingCardNumericId) &&
          editingCardNumericId > 0
            ? editingCardNumericId
            : null;
        if (numericId != null) {
          await fetchJson(`/api/card/${numericId}`, {
            method: 'PUT',
            body: JSON.stringify(body),
          });
        } else {
          const urlSlug = editingCardSlug;
          await fetchJson(`/api/card/${encodeURIComponent(urlSlug)}`, {
            method: 'PUT',
            body: JSON.stringify(body),
          });
        }
        if (slugNorm && slugNorm !== editingCardSlug) {
          editingCardSlug = slugNorm;
          editSlidesSlug = slugNorm;
          const disp = document.getElementById('dash-card-display')?.value?.trim() || slugNorm;
          setCardEditorScreenTitles(`Editar · ${disp}`, `slug: ${slugNorm}`);
        }
      } else if (!isCardsEditViewActive() && !isCardEditorViewActive()) {
        const created = await fetchJson('/api/card', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        const ns =
          created && typeof created === 'object' ? created.slug ?? created.Slug : null;
        const slugIn = document.getElementById('dash-card-slug');
        if (ns && slugIn && !slugIn.value.trim()) {
          slugIn.value = String(ns).trim().toLowerCase();
        }
      } else {
        setCardFormStatus('Não é possível criar card nesta aba.', 'bad');
        return;
      }
      setCardFormStatus('Card guardado na API com sucesso.', 'ok');
      await syncIndexOrderPanelFromApi();
    } catch (err) {
      const fallback =
        (err && err.message) || 'Não foi possível salvar. Verifique o login e a consola do servidor.';
      let msg = dashFormatApiErrorMessage(err, fallback);
      const b = err?.body;
      if (
        typeof b === 'string' &&
        b.trim() &&
        (!msg || msg === 'Bad Request' || msg === fallback)
      ) {
        msg = b.trim();
      }
      setCardFormStatus(msg, 'bad');
    }
  });

  const collabEmail = document.getElementById('dash-collab-email');
  const collabStatus = document.getElementById('dash-collab-status');
  const submitCollabInvite = async () => {
    if (!collabEmail || !collabStatus) return;
    const email = collabEmail.value.trim();
    if (!email) {
      collabStatus.textContent = 'Informe o e-mail do colaborador.';
      collabStatus.classList.remove('ok');
      collabStatus.classList.add('bad');
      return;
    }
    collabStatus.classList.remove('ok', 'bad');
    collabStatus.textContent = 'Enviando convite…';
    const submitBtn = document.getElementById('dash-collab-submit');
    if (submitBtn) submitBtn.disabled = true;
    const path = getDashApiPath('inviteCollaborator');
    const r = await dashFetchNoThrow(path, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    if (submitBtn) submitBtn.disabled = false;
    const apiMsg = r.data && typeof r.data === 'object' && !Array.isArray(r.data) ? r.data.message : null;
    if (r.ok) {
      collabStatus.textContent =
        apiMsg ||
        'Colaborador adicionado com sucesso! Foi enviado um e-mail com o link para criar a senha.';
      collabStatus.classList.add('ok');
      collabStatus.classList.remove('bad');
      collabEmail.value = '';
      void loadDashColaboradoresList();
    } else {
      let msg = apiMsg;
      if (!msg) {
        if (r.status === 401) {
          msg = 'Sem autorização. Faça login de novo com usuário e senha de admin (o PIN de dev agora também pede o token à API).';
        } else if (r.status === 0) {
          msg = 'Sem conexão com a API. Verifique se o servidor está rodando.';
        } else {
          msg = 'Não foi possível enviar o convite.';
        }
      }
      collabStatus.textContent = msg;
      collabStatus.classList.add('bad');
      collabStatus.classList.remove('ok');
    }
  };
  document.getElementById('dash-collab-submit')?.addEventListener('click', submitCollabInvite);
  collabEmail?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitCollabInvite();
    }
  });

    fbRefresh?.addEventListener('click', loadFeedback);
    cardsRefresh?.addEventListener('click', () => {
      void syncIndexOrderPanelFromApi();
    });

    setDashView('home');
    loadFeedback();
    void syncIndexOrderPanelFromApi();
    dashReloadAll = () => {
      loadFeedback();
      void syncIndexOrderPanelFromApi();
      void loadDashColaboradoresList();
    };
    void loadDashColaboradoresList();
  }

}
