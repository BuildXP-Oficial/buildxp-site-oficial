// BuildXP — carrega módulos na ordem correta e só então inicializa a página.
(function () {
  const v = 'bxp-mod-3';
  const base = 'js/';
  const files = [
    'site-ui.js',
    'feedback.js',
    'terminal.js',
    'cards-home.js',
    'dashboard.js',
    'init.js',
  ];

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
