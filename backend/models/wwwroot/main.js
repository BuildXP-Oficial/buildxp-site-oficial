// Compatibilidade: entradas antigas apontavam para /main.js na raiz do wwwroot.
(function () {
  if (document.querySelector('script[src*="js/main.js"]')) return;
  const s = document.createElement('script');
  s.src = 'js/main.js?v=bxp-mod-18';
  s.async = false;
  document.body.appendChild(s);
})();
