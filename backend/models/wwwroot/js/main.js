// BuildXP — carrega módulos na ordem correta e só então inicializa a página.
(function () {
  const v = 'bxp-mod-67';
  const files = [
    'site-ui.js',
    'feedback.js',
    'terminal.js',
    'cards-home.js',
    'cards-catalog.js',
    'markdown-parser.js',
    'markdown-builder.js',
    'dashboard.js',
    'init.js',
  ];

  let base = 'js/';
  try {
    const cur = document.currentScript;
    if (cur?.src) base = new URL('.', cur.src).href;
  } catch {
    /* fallback */
  }

  function loadNext(i) {
    if (i >= files.length) {
      if (typeof window.buildxpBoot === 'function') void window.buildxpBoot();
      return;
    }
    const s = document.createElement('script');
    s.src = `${base}${files[i]}?v=${v}`;
    s.async = false;
    s.onload = () => loadNext(i + 1);
    s.onerror = () => {
      console.error('[BuildXP] Falha ao carregar', files[i]);
      loadNext(i + 1);
    };
    document.body.appendChild(s);
  }

  loadNext(0);
})();
