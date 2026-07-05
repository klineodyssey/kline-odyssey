/*
KGEN Temple Shell V0.2 — bootstrap for level-node temples
*/
(function(global){
  'use strict';

  function initTemple(opts) {
    var id = opts.id;
    var status = new KGEN_StatusBus('kgen-status-text');
    var nav = document.getElementById('hud-nav');
    if (nav && KGEN_TempleHub) nav.innerHTML = KGEN_TempleHub.navLinks(id, 2);

    if (opts.npc && KGEN_TempleHub) {
      KGEN_TempleHub.renderNpc(document.getElementById('npc-panel'), opts.npc);
    }
    if (opts.quests && KGEN_TempleHub) {
      KGEN_TempleHub.renderQuestPanel(document.getElementById('quest-panel'), opts.quests);
    }
    if (opts.entryCards) {
      KGEN_TempleHub.renderEntryCards(document.getElementById('universe-nodes'), id);
    }

    KGEN_Wallet.demoMode = true;
    KGEN_Wallet.connect(status);

    if (opts.onInit) opts.onInit(status);

    status.push(id + ' ' + (opts.name || '') + ' V0.2 已啟動 · Demo');
    return status;
  }

  global.KGEN_TempleShell = { init: initTemple };
})(window);
