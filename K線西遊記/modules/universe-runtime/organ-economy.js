/*
KGEN Universe Runtime — Organ Economy V0.2
App = Organism · Module = Organ · Collateral → Organ Decomposition
*/
(function(global){
  'use strict';

  var ORGAN_ECONOMY = {
    VERSION: 'V0.2',
    TERMS: {
      APP: 'Organism',
      MODULE: 'Organ',
      COLLATERAL: '保證金',
      DECOMPOSITION: 'Organ Decomposition',
    },
    RISK_LEVELS: [
      { id: 'safe', label: '安全', color: '#7cffc5', minRatio: 1.5 },
      { id: 'watch', label: '觀察', color: '#ffd778', minRatio: 1.2 },
      { id: 'warning', label: '警戒', color: '#ff8d35', minRatio: 1.0 },
      { id: 'liquidation', label: '清算', color: '#ff4444', minRatio: 0 },
    ],
    DEMO_ORGANS: [
      { id: 'heart', name: '心臟模組', type: 'Module', hp: 100, collateral: 500 },
      { id: 'brain', name: '大腦 App', type: 'App', hp: 100, collateral: 1200 },
      { id: 'liver', name: '肝臟模組', type: 'Module', hp: 100, collateral: 800 },
      { id: 'wallet', name: '錢包器官', type: 'Module', hp: 100, collateral: 300 },
    ],
  };

  function marginRatio(collateral, debt) {
    if (!debt || debt <= 0) return 999;
    return collateral / debt;
  }

  function riskLevel(ratio) {
    var levels = ORGAN_ECONOMY.RISK_LEVELS;
    for (var i = 0; i < levels.length; i++) {
      if (ratio >= levels[i].minRatio) return levels[i];
    }
    return levels[levels.length - 1];
  }

  function simulateDecomposition(organ, onTick, onComplete) {
    var steps = ['⚠️ 保證金不足', '🔥 器官能量流失', '💀 Organ Decomposition', '♻️ 模組回收至 11520'];
    var i = 0;
    var interval = setInterval(function(){
      if (onTick) onTick(steps[i], i);
      i++;
      if (i >= steps.length) {
        clearInterval(interval);
        if (onComplete) onComplete(organ);
      }
    }, 900);
    return interval;
  }

  function renderCollateralGauge(container, collateral, debt) {
    if (!container) return;
    var ratio = marginRatio(collateral, debt);
    var risk = riskLevel(ratio);
    var pct = Math.min(100, Math.max(0, (ratio / 2) * 100));
    container.innerHTML =
      '<div class="kgen-collateral-gauge">' +
        '<div class="kgen-cg-head"><span>保證金比率</span><span style="color:' + risk.color + '">' + risk.label + ' · ' + ratio.toFixed(2) + 'x</span></div>' +
        '<div class="kgen-progress-track"><div class="kgen-progress-fill" style="width:' + pct + '%;background:' + risk.color + '"></div></div>' +
        '<div class="kgen-cg-foot"><span>抵押 ' + collateral.toLocaleString() + ' KGEN</span><span>負債 ' + debt.toLocaleString() + ' KGEN</span></div>' +
      '</div>';
  }

  function renderOrganTable(container, organs, onDecompose) {
    if (!container) return;
    var html = '<table class="kgen-table"><thead><tr><th>器官</th><th>類型</th><th>HP</th><th>保證金</th><th>狀態</th></tr></thead><tbody>';
    (organs || ORGAN_ECONOMY.DEMO_ORGANS).forEach(function(o){
      var debt = o.debt || o.collateral * 0.85;
      var ratio = marginRatio(o.collateral, debt);
      var risk = riskLevel(ratio);
      var status = ratio < 1 ? '<button class="kgen-btn danger" style="padding:4px 10px;font-size:11px" data-organ="' + o.id + '">分解</button>' : '<span class="kgen-pill green" style="font-size:10px">' + risk.label + '</span>';
      html += '<tr><td>' + o.name + '</td><td>' + o.type + '</td><td>' + o.hp + '</td><td>' + o.collateral + '</td><td>' + status + '</td></tr>';
    });
    html += '</tbody></table>';
    container.innerHTML = html;
    if (onDecompose) {
      container.querySelectorAll('[data-organ]').forEach(function(btn){
        btn.addEventListener('click', function(){ onDecompose(btn.getAttribute('data-organ')); });
      });
    }
  }

  global.KGEN_OrganEconomy = {
    VERSION: ORGAN_ECONOMY.VERSION,
    TERMS: ORGAN_ECONOMY.TERMS,
    DEMO_ORGANS: ORGAN_ECONOMY.DEMO_ORGANS,
    marginRatio: marginRatio,
    riskLevel: riskLevel,
    simulateDecomposition: simulateDecomposition,
    renderCollateralGauge: renderCollateralGauge,
    renderOrganTable: renderOrganTable,
  };
})(window);
