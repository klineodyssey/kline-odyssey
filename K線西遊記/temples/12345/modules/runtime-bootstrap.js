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
    VERSION: 12345-TEMPLE-V10.48.0-LIFE-STANDARD-REGENERATION
    BUILD: 20260525-V10.48.0-LIFE-STANDARD-REGENERATION
    BIRTH: 2026-05-25
    DEATH: ACTIVE
    GROWTH_STAGE: IMMORTAL_REGENERATION_STANDARDIZATION
  TAXONOMY:
    DOMAIN: KGENVERSE
    KINGDOM: FinancialLifeform
    PHYLUM: RuntimeOrganism
    CLASS: ImmuneRuntime
    ORDER: BootstrapOrgan
    FAMILY: PrimeForgeLife
    GENUS: KGEN12345
    SPECIES: runtime-bootstrap.js
    CELL: Boot Cell
    ORGAN: Immune Self-Check Organ
    DNA: BOOTSTRAP-IMMUNE-DNA
  IMMUNE_SYSTEM:
    VIRUS_SCAN: ENABLED
    HASH_VALIDATION: REQUIRED
    UNKNOWN_ORGAN_BLOCK: TRUE
    PATCH_DRIFT_BLOCK: TRUE
    VERSION_FILENAME_BLOCK: TRUE
    SELF_HEALING: ENABLED
  REGENERATION:
    EMBRYO_MODE: GZIP_BASE64
    CAN_REBUILD_FROM_EMBRYO: TRUE
    REJUVENATION: ENABLED
    IMMORTALITY_CLASS: WUKONG_LONGEVITY
*/
(function(){
  'use strict';
  const SELF = {
    version: '12345-TEMPLE-V10.48.0-LIFE-STANDARD-REGENERATION',
    manifest: './LIFE_MANIFEST.json',
    genome: './RUNTIME_GENOME.json'
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
    try {
      window.dispatchEvent(new CustomEvent('kgen-life-boot', { detail: payload }));
    } catch(e) {}
  }

  async function head(path){
    try {
      const r = await fetch(path, { method: 'HEAD', cache: 'no-store' });
      if (r.ok) return true;
      const g = await fetch(path, { method: 'GET', cache: 'no-store' });
      return g.ok;
    } catch(e) {
      return false;
    }
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
      if (!ok) {
        state.missing.push({
          group: f.group,
          path: f.path,
          life_layer: f.life_layer || '',
          diagnosis: f.diagnosis || '生命部件缺失'
        });
      }
    }

    const forbidden = (state.manifest.immune_system && state.manifest.immune_system.forbidden_filename_patterns) || [];
    const listed = files.map(f => f.path || '');
    listed.forEach(p => {
      forbidden.forEach(pattern => {
        const needle = String(pattern).replace(/\*/g, '').toLowerCase();
        if (needle && p.toLowerCase().includes(needle)) {
          state.warnings.push({ path: p, diagnosis: '疑似癌化漂移命名：' + pattern });
        }
      });
    });

    state.status = state.missing.length ? 'INJURED' : 'ALIVE';
    emit(state.missing.length ? 'error' : 'log', state.missing.length ? '生命自檢發現缺損。' : '生命自檢完成：ALIVE。', state);
    window.KGEN_LIFE_BOOT = state;
    return state;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', check);
  } else {
    check();
  }
})();
