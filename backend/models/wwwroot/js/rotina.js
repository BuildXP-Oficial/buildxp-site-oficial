// BuildXP — rotina inteligente (rotina.html)
function rotinaApiBase() {
  if (typeof getBuildXpApiBase === 'function') return String(getBuildXpApiBase()).replace(/\/$/, '');
  if (typeof window.BUILDXP_API_BASE === 'string' && window.BUILDXP_API_BASE.trim()) {
    return window.BUILDXP_API_BASE.trim().replace(/\/$/, '');
  }
  return '';
}

function rotinaNovoId() {
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function acrescentarTarefaRotina(lista, dados) {
  const row = document.createElement('div');
  row.className = 'rotina-tarefa';
  row.dataset.id = dados?.id || rotinaNovoId();
  const urgenciaAtual = Number(dados?.urgencia);
  const urgenciaPadrao = Number.isFinite(urgenciaAtual) && urgenciaAtual >= 1 ? urgenciaAtual : 3;
  row.innerHTML = `
    <label class="fb-label">Título
      <input class="fb-input rotina-titulo" type="text" maxlength="80" placeholder="ex: Revisar PRs" value="${escapeAttrRotina(dados?.titulo || '')}" />
    </label>
    <label class="fb-label">Duração (min)
      <input class="fb-input rotina-duracao" type="number" min="5" max="480" value="${Number(dados?.duracaoMinutos) > 0 ? Number(dados.duracaoMinutos) : 30}" />
    </label>
    <label class="fb-label">Urgência
      <select class="fb-input rotina-urgencia">
        ${[1, 2, 3, 4, 5].map((n) => `<option value="${n}"${n === urgenciaPadrao ? ' selected' : ''}>${n}</option>`).join('')}
      </select>
    </label>
    <label class="rotina-flex">
      <input class="rotina-flexivel" type="checkbox" ${dados?.flexivel ? 'checked' : ''} />
      Flexível
    </label>
    <button class="rotina-remove" type="button" aria-label="Remover tarefa">×</button>
  `;
  row.querySelector('.rotina-remove').addEventListener('click', () => {
    if (lista.querySelectorAll('.rotina-tarefa').length <= 1) return;
    row.remove();
  });
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
    const titulo = String(row.querySelector('.rotina-titulo')?.value || '').trim();
    if (!titulo) return;
    tarefas.push({
      id: row.dataset.id || rotinaNovoId(),
      titulo,
      duracaoMinutos: Math.max(5, Number(row.querySelector('.rotina-duracao')?.value) || 30),
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
    title.textContent = t.titulo || 'Tarefa';
    const meta = document.createElement('div');
    meta.className = 'rotina-item-meta';
    const chips = [
      `${t.duracaoMinutos || 0} min`,
      `urgência ${t.urgencia ?? '—'}`,
      t.flexivel ? 'flexível' : 'fixa',
      t.concluida ? 'concluída' : 'pendente',
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

async function enviarRotina() {
  const status = document.getElementById('rotina-status');
  const btn = document.getElementById('rotina-organizar');
  const lista = document.getElementById('rotina-tarefas');
  const tarefas = coletarTarefasRotina(lista);
  if (!tarefas.length) {
    if (status) {
      status.className = 'fb-status bad';
      status.textContent = 'Adicione pelo menos uma tarefa com título.';
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
    status.textContent = 'Consultando o agente de produtividade…';
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
        : 'Não foi possível organizar a rotina agora.';
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
      status.textContent = 'Rotina reorganizada.';
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

function initRotinaPage() {
  const app = document.getElementById('rotina-app');
  if (!app) return;
  const lista = document.getElementById('rotina-tarefas');
  if (!lista) return;
  if (!lista.children.length) acrescentarTarefaRotina(lista);
  document.getElementById('rotina-add')?.addEventListener('click', () => acrescentarTarefaRotina(lista));
  document.getElementById('rotina-organizar')?.addEventListener('click', () => void enviarRotina());
}

window.initRotinaPage = initRotinaPage;
