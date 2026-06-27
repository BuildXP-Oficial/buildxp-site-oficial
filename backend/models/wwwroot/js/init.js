// BuildXP - init (executado por js/main.js após todos os módulos)
async function buildxpBoot() {
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
  if (document.getElementById('cards-catalog-grid')) {
    if (typeof buildxpInitCardsCatalogPage === 'function') {
      await buildxpInitCardsCatalogPage();
    }
  } else {
    await buildxpHydrateIndexCardsFromApi();
    applyIndexCardOrder();
    initIndexCardsHomeMarquee();
  }
  initCopy();
}

window.buildxpBoot = buildxpBoot;
