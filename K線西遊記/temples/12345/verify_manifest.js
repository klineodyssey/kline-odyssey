#!/usr/bin/env node
/*
============================================================
PRODUCT_ID: KGEN-12345-HEALTH-REGISTRY
VERSION: 12345-TEMPLE-V10.43-FINAL-RUNTIME-ARCHITECTURE-CONSTITUTION
BUILD: 20260520-V10.43-FINAL-RUNTIME-ARCHITECTURE-CONSTITUTION
STATUS: ACTIVE
BIRTH_CERTIFICATE: upgraded for V10.43 FINAL Runtime Architecture.
DEATH_CERTIFICATE: active; do not delete unless replaced by a higher health registry.
PURPOSE:
- Check missing files from MANIFEST.json.
- Check orphan files not listed in MANIFEST.json.
- Check deleted/dead files still present.
- Check local references in index.html and modules.
- Check Runtime FILE_CERTIFICATE headers.
============================================================
*/
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
function findTempleRoot() {
  const cwd = process.cwd();
  const here = __dirname;
  if (fs.existsSync(path.join(here, 'MANIFEST.json'))) return here;
  const alt = path.join(cwd, 'K線西遊記', 'temples', '12345');
  if (fs.existsSync(path.join(alt, 'MANIFEST.json'))) return alt;
  return here;
}
const root = findTempleRoot();
const manifestPath = path.join(root, 'MANIFEST.json');
if (!fs.existsSync(manifestPath)) { console.error('MISSING MANIFEST.json at', manifestPath); process.exit(2); }
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const expected = new Set((manifest.files || []).map(f => f.path.replace(/\\/g,'/')));
function walk(dir, base='') {
  let out=[];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.join(base, name).replace(/\\/g,'/');
    const st = fs.statSync(full);
    if (st.isDirectory()) out = out.concat(walk(full, rel)); else out.push(rel);
  }
  return out;
}
function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
const actual = new Set(walk(root));
const generated = new Set(['HEALTH_REPORT.md','ORPHAN_REPORT.md','MISSING_REPORT.md','BOOT_REPORT.md','UPLOAD_LIST.txt','SHA256SUMS.txt','MANIFEST.json']);
const missing = [...expected].filter(f => !actual.has(f));
const orphan = [...actual].filter(f => !expected.has(f) && !generated.has(f));
const shaMismatch = [];
for (const f of manifest.files || []) {
  if (!f.sha256) continue;
  const p = path.join(root, f.path);
  if (fs.existsSync(p)) {
    const h = sha256(p);
    if (h !== f.sha256) shaMismatch.push({path:f.path, expected:f.sha256, actual:h});
  }
}
let deleteList = [];
const delPath = path.join(root, 'DELETE_LIST.txt');
if (fs.existsSync(delPath)) deleteList = fs.readFileSync(delPath,'utf8').split(/\r?\n/).map(s=>s.trim()).filter(s=>s && !s.startsWith('#'));
function wildcardToRegExp(pat) {
  const escaped = pat.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp('^' + escaped + '$');
}
const deadStillExists = [];
for (const pat of deleteList) {
  if (pat.includes('*')) {
    const re = wildcardToRegExp(pat);
    if ([...actual].some(f => re.test(f))) deadStillExists.push(pat);
    continue;
  }
  const clean = pat.replace(/\/$/,'');
  if (!clean) continue;
  if ([...actual].some(f => f === clean || f.startsWith(clean + '/'))) deadStillExists.push(pat);
}
const referenceFiles = ['index.html'].concat([...actual].filter(f => f.startsWith('modules/') && /\.(js|css|json)$/.test(f)));
const refRegexes = [
  /(?:src|href)=["']([^"']+)["']/g,
  /url\(["']?([^"')]+)["']?\)/g,
  /["'](\.\/?(?:assets|modules|docs)\/[^"']+)["']/g
];
const brokenReferences = [];
for (const rf of referenceFiles) {
  const fp = path.join(root, rf);
  if (!fs.existsSync(fp)) continue;
  const txt = fs.readFileSync(fp,'utf8');
  for (const re of refRegexes) {
    let m;
    while ((m = re.exec(txt))) {
      let ref = String(m[1]).trim();
      if (!ref || ref.includes('${') || ref.startsWith('http') || ref.startsWith('data:') || ref.startsWith('#') || ref.startsWith('mailto:') || ref.startsWith('tel:')) continue;
      if (/^[a-z]+:/i.test(ref)) continue;
      ref = ref.split('?')[0].split('#')[0];
      if (ref.startsWith('./')) ref = ref.slice(2);
      const candidates = [
        path.normalize(path.join(path.dirname(rf), ref)).replace(/\\/g,'/'),
        path.normalize(ref).replace(/\\/g,'/')
      ];
      if (!candidates.some(c => actual.has(c))) brokenReferences.push({from:rf, ref:m[1], resolved:candidates});
    }
  }
}
const runtimeFiles = [...actual].filter(f => f.startsWith('modules/') && f.endsWith('.js'));
const recursiveHeaderMissing = [];
for (const f of runtimeFiles) {
  const txt = fs.readFileSync(path.join(root,f),'utf8');
  if (!txt.includes('FILE_CERTIFICATE') && !txt.includes('PRODUCT_ID:')) recursiveHeaderMissing.push(f);
}
const report = {
  product_id: manifest.product_id,
  version: manifest.version,
  checkedAt: new Date().toISOString(),
  root,
  totals: {expected: expected.size, actual: actual.size},
  missing,
  orphan,
  shaMismatch,
  deadStillExists,
  brokenReferences,
  recursiveHeaderMissing,
  ok: missing.length===0 && orphan.length===0 && shaMismatch.length===0 && deadStillExists.length===0 && brokenReferences.length===0 && recursiveHeaderMissing.length===0
};
function mdList(arr) { return arr.length ? arr.map(x => '- ' + (typeof x === 'string' ? x : JSON.stringify(x))).join('\n') : 'None'; }
fs.writeFileSync(path.join(root,'HEALTH_REPORT.md'), '# HEALTH REPORT\n\n```json\n'+JSON.stringify(report,null,2)+'\n```\n', 'utf8');
fs.writeFileSync(path.join(root,'ORPHAN_REPORT.md'), '# ORPHAN REPORT\n\n'+mdList(orphan)+'\n', 'utf8');
fs.writeFileSync(path.join(root,'MISSING_REPORT.md'), '# MISSING REPORT\n\n'+mdList(missing)+'\n', 'utf8');
fs.writeFileSync(path.join(root,'BOOT_REPORT.md'), '# BOOT REPORT\n\nGenerated by verify_manifest.js. Browser boot runtime also reports PASS/FAIL in HUD.\n\n```json\n'+JSON.stringify({ok:report.ok, version:report.version, checkedAt:report.checkedAt},null,2)+'\n```\n', 'utf8');
console.log(JSON.stringify(report,null,2));
process.exit(report.ok ? 0 : 1);
