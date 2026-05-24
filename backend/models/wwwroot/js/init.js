// BuildXP - init (executado pelo loader em main.js após todos os módulos)
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
  await buildxpHydrateIndexCardsFromApi();
  applyIndexCardOrder();
  initIndexCardsHomeMarquee();
  initCopy();
}

window.buildxpBoot = buildxpBoot;
