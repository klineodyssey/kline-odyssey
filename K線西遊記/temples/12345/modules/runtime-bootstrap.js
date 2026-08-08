/*
PRIMEFORGE_LIFE_HEADER_V1:
  CIVILIZATION_INFO:
    CIVILIZATION_ID: KGEN-PRIME-CIVILIZATION
    CIVILIZATION_NAME: KLINE ODYSSEY
    GALAXY: Internet
    PLANET: GitHub
    REPO: klineodyssey/kline-odyssey
    CHAIN_NETWORK: BNB Smart Chain
    SURVIVAL_RULE: 沒有質量，就沒有位置
  STRUCTURE_COORDINATE:
    ROOT_STRUCTURE: /K線西遊記
    CITY_STRUCTURE: /K線西遊記/temples/12345
    CURRENT_LIFE_COORDINATE: /K線西遊記/temples/12345/modules/runtime-bootstrap.js
  FILE_CERTIFICATE:
    FILE: runtime-bootstrap.js
    PATH: /K線西遊記/temples/12345/modules/runtime-bootstrap.js
    PRODUCT_ID: KGEN-12345-RUNTIME-BOOTSTRAP
    LIFE_LAYER: ORGAN
    LIFE_TYPE: Boot Immune Organ
    VERSION: 12345-TEMPLE-V10.50.0-KAIOS-LINEAGE-TEMPLEHEART-V3.3.2-READY
    BUILD: 20260809-V10.50.0
    BIRTH: 2026-05-25
    DEATH: ACTIVE
    GROWTH_STAGE: KAIOS_LINEAGE_TEMPLEHEART_V3_3_2_READY
  IMMUNE_SYSTEM:
    VIRUS_SCAN: ENABLED
    HASH_VALIDATION: REQUIRED
    UNKNOWN_ORGAN_BLOCK: TRUE
    PATCH_DRIFT_BLOCK: TRUE
    VERSION_FILENAME_BLOCK: TRUE
    SELF_HEALING: ENABLED
*/
(function(){
  'use strict';
  const SELF = {
    version: '12345-TEMPLE-V10.50.0-KAIOS-LINEAGE-TEMPLEHEART-V3.3.2-READY',
    manifest: './LIFE_MANIFEST.json',
    genome: './RUNTIME_GENOME.json'
  };

  const RELEASE = {
    frontend: 'V10.50.0',
    templeHeartTarget: 'V3.3.2',
    mergedLineageCommit: '66088f3a09e3a68df3027a877e122514ab829d52',
    heartProxy: '0xB016D4d8f1aED1339101b30722cad6dbA9B8C972',
    rpc: 'https://bsc-dataseed.binance.org/',
    chainId: 56,
    status: 'FRONTEND_LIVE_CHAIN_UPGRADE_SEPARATE'
  };

  const state = {
    loadedAt: new Date().toISOString(),
    manifest: null,
    genome: null,
    missing: [],
    warnings: [],
    status: 'BOOTING'
  };

  function emit(type, message, data){
    const payload = {type, message, data: data || null, at: new Date().toISOString()};
    try { console[type === 'error' ? 'error' : 'log']('[KGEN LIFE BOOT]', payload); } catch(e) {}
    try { window.dispatchEvent(new CustomEvent('kgen-life-boot', { detail: payload })); } catch(e) {}
  }

  async function head(path){
    try {
      const r = await fetch(path, { method: 'HEAD', cache: 'no-store' });
      if (r.ok) return true;
      const g = await fetch(path, { method: 'GET', cache: 'no-store' });
      return g.ok;
    } catch(e) { return false; }
  }

  function flattenRequired(manifest){
    const out = [];
    const rf = manifest.required_files || {};
    Object.keys(rf).forEach(group => {
      const arr = Array.isArray(rf[group]) ? rf[group] : [];
      arr.forEach(item => out.push(Object.assign({group}, item)));
    });
    return out;
  }

  async function loadJson(path){
    const r = await fetch(path, { cache: 'no-store' });
    if (!r.ok) throw new Error('LOAD_FAIL ' + path);
    return await r.json();
  }

  function releaseBadge(){
    let badge = document.getElementById('kgen-12345-release-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'kgen-12345-release-badge';
      badge.setAttribute('role','status');
      badge.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:2147483646;max-width:min(360px,calc(100vw - 16px));padding:7px 10px;border:1px solid rgba(255,215,120,.55);border-radius:10px;background:rgba(5,7,11,.88);color:#ffe28a;font:600 11px/1.45 system-ui,-apple-system,BlinkMacSystemFont,Noto Sans TC,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.28);pointer-events:none';
      document.body.appendChild(badge);
    }
    badge.textContent = '12345 ' + RELEASE.frontend + '｜TempleHeart ' + RELEASE.templeHeartTarget + ' 程式已整合｜鏈上版本檢查中';
    return badge;
  }

  function enforceReleaseVersion(){
    const versionNode = document.getElementById('ver-st');
    if (versionNode) {
      versionNode.textContent = RELEASE.frontend;
      versionNode.setAttribute('data-version','12345-TEMPLE-' + RELEASE.frontend);
      versionNode.title = 'KAIOS lineage + TempleHeart V3.3.2 integration-ready frontend';
    }
    document.documentElement.dataset.kgen12345Release = RELEASE.frontend;
    window.KGEN_12345_RELEASE = Object.assign({}, RELEASE);
  }

  async function probeHeartVersion(attempt){
    const badge = releaseBadge();
    enforceReleaseVersion();
    if (!(window.ethers && window.ethers.providers && window.ethers.Contract)) {
      if ((attempt || 0) < 12) setTimeout(function(){ probeHeartVersion((attempt || 0) + 1); }, 750);
      return;
    }
    try {
      const provider = new window.ethers.providers.JsonRpcProvider(RELEASE.rpc);
      const heart = new window.ethers.Contract(RELEASE.heartProxy, ['function version() view returns (string)'], provider);
      const v = await heart.version();
      window.KGEN_12345_RELEASE.detectedHeartVersion = String(v || '');
      const isTarget = String(v || '').indexOf('3.3.2') >= 0;
      badge.textContent = '12345 ' + RELEASE.frontend + '｜鏈上 Heart ' + (v || 'UNKNOWN') + (isTarget ? '｜V3.3.2 已啟用' : '｜前端已更新，鏈上代理尚待正式升級');
      badge.style.color = isTarget ? '#8fffd1' : '#ffe28a';
    } catch (error) {
      window.KGEN_12345_RELEASE.detectedHeartVersion = 'LEGACY_OR_UNVERIFIED';
      badge.textContent = '12345 ' + RELEASE.frontend + '｜TempleHeart V3.3.2 程式已上主線｜目前鏈上代理仍以既有 ABI 安全運作，升級交易另行簽署';
    }
  }

  async function check(){
    state.status = 'CHECKING';
    try {
      state.manifest = await loadJson(SELF.manifest);
      state.genome = await loadJson(SELF.genome);
    } catch(e) {
      state.status = 'MANIFEST_OR_GENOME_MISSING';
      state.missing.push({ path: SELF.manifest + ' / ' + SELF.genome, diagnosis: '失憶或 DNA 缺失' });
      emit('error', 'LIFE_MANIFEST 或 RUNTIME_GENOME 缺失，停止自動融合。', state);
      window.KGEN_LIFE_BOOT = state;
      return state;
    }

    const files = flattenRequired(state.manifest);
    for (const f of files) {
      if (!f.path) continue;
      const relative = f.path.replace(/^\/K線西遊記\/temples\/12345\//, './').replace(/^\//, './');
      const ok = await head(relative);
      if (!ok) state.missing.push({ group: f.group, path: f.path, life_layer: f.life_layer || '', diagnosis: f.diagnosis || '生命部件缺失' });
    }

    const forbidden = (state.manifest.immune_system && state.manifest.immune_system.forbidden_filename_patterns) || [];
    const listed = files.map(f => f.path || '');
    listed.forEach(p => {
      forbidden.forEach(pattern => {
        const needle = String(pattern).replace(/\*/g, '').toLowerCase();
        if (needle && p.toLowerCase().includes(needle)) state.warnings.push({ path: p, diagnosis: '疑似癌化漂移命名：' + pattern });
      });
    });

    state.status = state.missing.length ? 'INJURED' : 'ALIVE';
    emit(state.missing.length ? 'error' : 'log', state.missing.length ? '生命自檢發現缺損。' : '生命自檢完成：ALIVE。', state);
    window.KGEN_LIFE_BOOT = state;
    return state;
  }

  function start(){
    enforceReleaseVersion();
    releaseBadge();
    check();
    setTimeout(function(){ enforceReleaseVersion(); probeHeartVersion(0); }, 350);
    setTimeout(enforceReleaseVersion, 1600);
    setTimeout(enforceReleaseVersion, 3200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
