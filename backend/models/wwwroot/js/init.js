// BuildXP - init (executado por js/main.js após todos os módulos)
async function buildxpBoot() {
  if (typeof buildxpInitReadmeLabPage === 'function') {
    try { buildxpInitReadmeLabPage(); } catch (_) { /* lista não pode depender do resto */ }
  }
  ensureDashPasswordToggleDelegation();
  initCopy();
  await buildxpHydrateTrainingSlidesFromApi();
  initCopy();
  initStepsSlider();
  initTabs();
  initSearch();
  initMenu();
  initScroll();
  if (typeof resetGlobalSiteAccent === 'function') resetGlobalSiteAccent();
  initFeedback();
  initTrainingTerminal();
  initDashboard();
  if (typeof buildxpInitMarkdownBuilderPage === 'function') {
    try {
      await buildxpInitMarkdownBuilderPage();
    } catch (_) { /* lab de markdown não pode bloquear a lista */ }
  }
  if (typeof buildxpInitReadmeLabPage === 'function') {
    try { buildxpInitReadmeLabPage(); } catch (_) {}
  }
  if (document.getElementById('cards-catalog-grid')) {
    if (typeof buildxpInitCardsCatalogPage === 'function') {
      await buildxpInitCardsCatalogPage();
    }
  } else {
    await buildxpHydrateIndexCardsFromApi();
    applyIndexCardOrder();
    initIndexCardsHomeMarquee();
    if (typeof buildxpInitHomeColaboradoresTicker === 'function') {
      await buildxpInitHomeColaboradoresTicker();
    }
  }
  initCopy();
}

window.buildxpBoot = buildxpBoot;
