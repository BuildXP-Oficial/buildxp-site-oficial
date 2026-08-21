// BuildXP — plano de estudos (rotina.html)
const ROTINA_TEMAS_PADRAO = [
  { slug: 'git', titulo: 'Git' },
  { slug: 'docker', titulo: 'Docker' },
  { slug: 'npm', titulo: 'NPM' },
  { slug: 'dotnet', titulo: '.NET' },
  { slug: 'python', titulo: 'Python' },
  { slug: 'java', titulo: 'Java' },
  { slug: 'api', titulo: 'APIs' },
  { slug: 'ia', titulo: 'IA' },
];

let rotinaTemas = ROTINA_TEMAS_PADRAO.slice();

function rotinaApiBase() {
  if (typeof getBuildXpApiBase === 'function') return String(getBuildXpApiBase()).replace(/\/$/, '');
  if (typeof window.BUILDXP_API_BASE === 'string' && window.BUILDXP_API_BASE.trim()) {
    return window.BUILDXP_API_BASE.trim().replace(/\/$/, '');
  }
  return '';
}

function rotinaNovoId(slug) {
  const base = String(slug || 'tema').toLowerCase();
  return `${base}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function rotinaOpcoesTema(slugSelecionado) {
  const opcoes = rotinaTemas
    .map((t) => {
      const sel = t.slug === slugSelecionado ? ' selected' : '';
      return `<option value="${escapeAttrRotina(t.slug)}"${sel}>${escapeAttrRotina(t.titulo)}</option>`;
    })
    .join('');
  const customSel = slugSelecionado === '__custom__' ? ' selected' : '';
  return `${opcoes}<option value="__custom__"${customSel}>Outro tema…</option>`;
}

function rotinaTituloDoSlug(slug) {
  const hit = rotinaTemas.find((t) => t.slug === slug);
  return hit?.titulo || slug || 'Tema';
}

function rotinaSlugDoTitulo(titulo) {
  const nome = String(titulo || '').trim().toLowerCase();
  const hit = rotinaTemas.find((t) => t.titulo.toLowerCase() === nome || t.slug === nome);
  return hit?.slug || '';
}

function rotinaToggleCustom(row) {
  const select = row.querySelector('.rotina-tema');
  const custom = row.querySelector('.rotina-tema-custom');
  if (!select || !custom) return;
  const isCustom = select.value === '__custom__';
  custom.hidden = !isCustom;
  custom.required = isCustom;
  if (isCustom) custom.focus();
}

function acrescentarTarefaRotina(lista, dados) {
  const row = document.createElement('div');
  row.className = 'rotina-tarefa';
  const slugInicial = String(dados?.id || dados?.slug || rotinaTemas[0]?.slug || 'git').toLowerCase();
  row.dataset.id = dados?.id && String(dados.id).includes('-') ? dados.id : rotinaNovoId(slugInicial);
  const urgenciaAtual = Number(dados?.urgencia);
  const urgenciaPadrao = Number.isFinite(urgenciaAtual) && urgenciaAtual >= 1 ? urgenciaAtual : 3;
  row.innerHTML = `
    <label class="fb-label">Tema / card
      <select class="fb-input rotina-tema" aria-label="Tema do BuildXP">
        ${rotinaOpcoesTema(slugInicial)}
      </select>
      <input class="fb-input rotina-tema-custom" type="text" maxlength="80" placeholder="ex: Kubernetes" hidden />
    </label>
    <label class="fb-label">Tempo estimado (min)
      <input class="fb-input rotina-duracao" type="number" min="15" max="240" step="15" value="${Number(dados?.duracaoMinutos) > 0 ? Number(dados.duracaoMinutos) : 45}" />
    </label>
    <label class="fb-label">Foco (1–5)
      <select class="fb-input rotina-urgencia">
        ${[1, 2, 3, 4, 5].map((n) => `<option value="${n}"${n === urgenciaPadrao ? ' selected' : ''}>${n}</option>`).join('')}
      </select>
    </label>
    <label class="rotina-flex">
      <input class="rotina-flexivel" type="checkbox" ${dados?.flexivel !== false ? 'checked' : ''} />
      Pode remarcar
    </label>
    <button class="rotina-remove" type="button" aria-label="Remover tema">×</button>
  `;
  row.querySelector('.rotina-tema')?.addEventListener('change', () => rotinaToggleCustom(row));
  row.querySelector('.rotina-remove').addEventListener('click', () => {
    if (lista.querySelectorAll('.rotina-tarefa').length <= 1) return;
    row.remove();
  });
  rotinaToggleCustom(row);
  lista.appendChild(row);
}

function escapeAttrRotina(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function coletarTarefasRotina(lista) {
  const tarefas = [];
  lista.querySelectorAll('.rotina-tarefa').forEach((row) => {
    const slug = String(row.querySelector('.rotina-tema')?.value || '').trim().toLowerCase();
    const custom = String(row.querySelector('.rotina-tema-custom')?.value || '').trim();
    const titulo = slug === '__custom__' ? custom : rotinaTituloDoSlug(slug);
    if (!titulo) return;
    tarefas.push({
      id: row.dataset.id || rotinaNovoId(slug === '__custom__' ? 'tema' : slug),
      titulo,
      duracaoMinutos: Math.max(15, Number(row.querySelector('.rotina-duracao')?.value) || 45),
      urgencia: Math.min(5, Math.max(1, Number(row.querySelector('.rotina-urgencia')?.value) || 3)),
      concluida: false,
      flexivel: Boolean(row.querySelector('.rotina-flexivel')?.checked),
    });
  });
  return tarefas;
}

function renderizarRotinaAjustada(mensagem, tarefas) {
  const vazio = document.getElementById('rotina-vazio');
  const bloco = document.getElementById('rotina-resultado');
  const msg = document.getElementById('rotina-mensagem');
  const ol = document.getElementById('rotina-lista');
  if (!bloco || !msg || !ol) return;

  if (vazio) vazio.hidden = true;
  bloco.hidden = false;
  msg.textContent = mensagem || '';
  ol.replaceChildren();

  (tarefas || []).forEach((t) => {
    const li = document.createElement('li');
    li.className = `rotina-item${t.concluida ? ' is-done' : ''}`;
    const body = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'rotina-item-title';
    const slug = rotinaSlugDoTitulo(t.titulo) || String(t.id || '').replace(/-[^-]+-[^-]+$/, '').toLowerCase();
    const nome = t.titulo || rotinaTituloDoSlug(slug);
    if (slug && /^[a-z0-9-]{1,48}$/.test(slug) && rotinaSlugDoTitulo(t.titulo)) {
      const a = document.createElement('a');
      a.href = `card.html?slug=${encodeURIComponent(slug)}`;
      a.textContent = nome;
      title.appendChild(a);
    } else {
      title.textContent = nome;
    }
    const meta = document.createElement('div');
    meta.className = 'rotina-item-meta';
    const chips = [
      `${t.duracaoMinutos || 0} min`,
      `foco ${t.urgencia ?? '—'}`,
      t.flexivel ? 'pode remarcar' : 'fixo no dia',
      t.concluida ? 'já revisado' : 'estudar / revisar',
    ];
    chips.forEach((c) => {
      const span = document.createElement('span');
      span.className = 'rotina-chip';
      span.textContent = c;
      meta.appendChild(span);
    });
    body.append(title, meta);
    li.appendChild(body);
    ol.appendChild(li);
  });
}

async function carregarTemasRotina() {
  try {
    const res = await fetch(`${rotinaApiBase()}/api/card`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!res.ok) return;
    const arr = await res.json();
    if (!Array.isArray(arr) || !arr.length) return;
    const daApi = arr
      .map((c) => ({
        slug: String(c.slug ?? c.Slug ?? '').trim().toLowerCase(),
        titulo: String(c.display_name ?? c.DisplayName ?? c.slug ?? '').trim(),
      }))
      .filter((c) => c.slug && c.titulo);
    if (daApi.length) rotinaTemas = daApi;
  } catch {
    /* usa a lista padrão */
  }
}

async function enviarRotina() {
  const status = document.getElementById('rotina-status');
  const btn = document.getElementById('rotina-organizar');
  const lista = document.getElementById('rotina-tarefas');
  const tarefas = coletarTarefasRotina(lista);
  if (!tarefas.length) {
    if (status) {
      status.className = 'fb-status bad';
      status.textContent = 'Escolha pelo menos um tema para estudar ou revisar.';
    }
    return;
  }

  const body = {
    tarefasAtuais: tarefas,
    nivelEnergia: String(document.getElementById('rotina-energia')?.value || 'media'),
    horasDisponiveis: Math.max(1, Number(document.getElementById('rotina-horas')?.value) || 1),
  };

  if (btn) btn.disabled = true;
  if (status) {
    status.className = 'fb-status';
    status.textContent = 'Montando o cronograma de estudos…';
  }

  try {
    const res = await fetch(`${rotinaApiBase()}/api/rotina`, {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let mensagem = res.status === 429
        ? 'Muitas tentativas em pouco tempo. Espere um instante.'
        : 'Não foi possível organizar o plano de estudos agora.';
      try {
        const err = await res.json();
        if (err?.mensagem) mensagem = String(err.mensagem);
      } catch {
        /* padrão */
      }
      throw new Error(mensagem);
    }
    const data = await res.json();
    const mensagem = String(data?.mensagemAgente ?? data?.MensagemAgente ?? '').trim();
    const ajustadas = data?.tarefasAjustadas ?? data?.TarefasAjustadas ?? [];
    renderizarRotinaAjustada(mensagem, ajustadas);
    if (status) {
      status.className = 'fb-status ok';
      status.textContent = 'Cronograma pronto.';
    }
  } catch (err) {
    if (status) {
      status.className = 'fb-status bad';
      status.textContent = err instanceof Error ? err.message : 'Falha ao falar com o agente.';
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function initRotinaPage() {
  const app = document.getElementById('rotina-app');
  if (!app) return;
  const lista = document.getElementById('rotina-tarefas');
  if (!lista) return;
  await carregarTemasRotina();
  if (!lista.children.length) acrescentarTarefaRotina(lista);
  document.getElementById('rotina-add')?.addEventListener('click', () => acrescentarTarefaRotina(lista));
  document.getElementById('rotina-organizar')?.addEventListener('click', () => void enviarRotina());
}

window.initRotinaPage = initRotinaPage;
