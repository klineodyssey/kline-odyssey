# KGEN_VALIDATION_SECOND_STAGE

Generated: 2026-07-05
Source report: `C:\Desktop\kline-odyssey\VALIDATION_REPORT.md`
Scope: second-stage WARN analysis only. No program files, contracts, Boot file, or Temple 12345 runtime files were modified.

## Executive Summary
| Area | Count | Second-stage decision |
|---|---:|---|
| Runtime operational orphans | 13 | Two true-orphan candidates (`KGEN/runtime/ignite_daily.md`, `KGEN/runtime/ignite_hourly.md`). Most others are history, provenance, reference, or formal source files that should be kept and indexed. |
| Exact duplicate file groups | 19 | No direct deletion recommended. Archive/history/CURRENT/vendor copies have meaning; ethers and 16888 engine copies are future audit candidates. |
| Missing references | 1207 missing + 12 case mismatches | Mostly scene-manifest refs, docs/README old refs, placeholders, dynamic strings, or relative-path scan artifacts. |
| Temple 12345 formal loaded chain | 60 candidates | No confirmed blocking missing dependency. Scene manifests remain a separate manual risk if scene runtime is enabled. |

## 1. Runtime Orphan Analysis
| Full path | Classification | Decision | Reason |
|---|---|---|---|
| `C:\Desktop\kline-odyssey\docs\neural\CIVILIZATION_BRAIN_ROLLCALL_V10_49_0_NOTE.md` | reference note | keep and index | Neural rollcall note is not an executable runtime but documents system context. |
| `C:\Desktop\kline-odyssey\docs\physics\KGEN_Universe_Physics_Runtime_V1_3.md` | historical runtime | keep as history | Older physics runtime edition; not formal active version under Boot V1.4. |
| `C:\Desktop\kline-odyssey\docs\physics\KGEN_Universe_Physics_Runtime_V1_4.md` | historical runtime | keep as history | Older physics runtime edition; not formal active version under Boot V1.4. |
| `C:\Desktop\kline-odyssey\docs\physics\KGEN_Universe_Physics_Runtime_V3_3_EARTH_LIFE_CERTIFICATION.md` | historical runtime | keep as history | Older physics runtime edition; not formal active version under Boot V1.4. |
| `C:\Desktop\kline-odyssey\docs\physics\KGEN_Universe_Physics_Runtime_V3_7.md` | CURRENT mirror / historical snapshot | keep and index | Exact duplicate of Runtime CURRENT; Boot rules make CURRENT formal, V3_7 remains provenance. |
| `C:\Desktop\kline-odyssey\KGEN\runtime\ignite_daily.md` | true orphan candidate | hold; owner review before delete | No inbound formal reference was found; looks like standalone ignite cadence documentation. |
| `C:\Desktop\kline-odyssey\KGEN\runtime\ignite_hourly.md` | true orphan candidate | hold; owner review before delete | No inbound formal reference was found; looks like standalone ignite cadence documentation. |
| `C:\Desktop\kline-odyssey\KGEN\runtime\KGEN_RewardVault_V1.sol` | formal active source | keep; do not delete | Runtime contract source is duplicated with contracts/archive; active ownership must be preserved. |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\docs\KGEN_12345_V10_42_4_RUNTIME_LOCKDOWN.md` | Temple 12345 historical/runtime doc | keep and index | Temple 12345 governance/runtime history; not part of index.html load chain. |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\docs\KGEN_12345_V10_43_FINAL_RUNTIME_ARCHITECTURE_CONSTITUTION.md` | Temple 12345 historical/runtime doc | keep and index | Temple 12345 governance/runtime history; not part of index.html load chain. |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\docs\KGEN_12345_V10_46_0_MORPH_DNA_RUNTIME_GENESIS.md` | Temple 12345 historical/runtime doc | keep and index | Temple 12345 governance/runtime history; not part of index.html load chain. |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\PHYSICS_RUNTIME_REFERENCE.md` | Temple 12345 historical/runtime doc | keep and index | Temple 12345 governance/runtime history; not part of index.html load chain. |
| `C:\Desktop\kline-odyssey\whitepaper\KGEN Universe Runtime Autopilot V0.1.md` | historical whitepaper/runtime concept | keep and index | Whitepaper/runtime autopilot record; cumulative history should not be removed. |

### Runtime Orphan Decision Summary
- Temple 12345 historical/runtime doc: 4
- historical runtime: 3
- true orphan candidate: 2
- reference note: 1
- CURRENT mirror / historical snapshot: 1
- formal active source: 1
- historical whitepaper/runtime concept: 1

True-orphan candidates:
- `C:\Desktop\kline-odyssey\KGEN\runtime\ignite_daily.md`
- `C:\Desktop\kline-odyssey\KGEN\runtime\ignite_hourly.md`

Files to keep but add/confirm index coverage:
- `C:\Desktop\kline-odyssey\docs\neural\CIVILIZATION_BRAIN_ROLLCALL_V10_49_0_NOTE.md`
- `C:\Desktop\kline-odyssey\docs\physics\KGEN_Universe_Physics_Runtime_V1_3.md`
- `C:\Desktop\kline-odyssey\docs\physics\KGEN_Universe_Physics_Runtime_V1_4.md`
- `C:\Desktop\kline-odyssey\docs\physics\KGEN_Universe_Physics_Runtime_V3_3_EARTH_LIFE_CERTIFICATION.md`
- `C:\Desktop\kline-odyssey\docs\physics\KGEN_Universe_Physics_Runtime_V3_7.md`
- `C:\Desktop\kline-odyssey\KGEN\runtime\KGEN_RewardVault_V1.sol`
- `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\docs\KGEN_12345_V10_42_4_RUNTIME_LOCKDOWN.md`
- `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\docs\KGEN_12345_V10_43_FINAL_RUNTIME_ARCHITECTURE_CONSTITUTION.md`
- `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\docs\KGEN_12345_V10_46_0_MORPH_DNA_RUNTIME_GENESIS.md`
- `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\PHYSICS_RUNTIME_REFERENCE.md`
- `C:\Desktop\kline-odyssey\whitepaper\KGEN Universe Runtime Autopilot V0.1.md`

## 2. Exact Duplicate File Analysis
| Count | Classification | Decision | Full paths | Reason |
|---:|---|---|---|---|
| 2 | archive asset mirror | keep | `C:\Desktop\kline-odyssey\archive\kgen32-vector.svg`<br>`C:\Desktop\kline-odyssey\kgen32.svg` | Archive copy should remain as history. |
| 6 | vendor runtime copies | keep now; future consolidation audit | `C:\Desktop\kline-odyssey\assets\ethers-5.7.2.umd.min.js`<br>`C:\Desktop\kline-odyssey\ethers-5.7.2.umd.min.js`<br>`C:\Desktop\kline-odyssey\K線西遊記\assets\ethers-5.7.2.umd.min.js`<br>`C:\Desktop\kline-odyssey\K線西遊記\temples\108000\ethers-5.7.2.umd.min.js`<br>`C:\Desktop\kline-odyssey\K線西遊記\temples\12345\assets\ethers-5.7.2.umd.min.js`<br>`C:\Desktop\kline-odyssey\wukong-temple\ethers-5.7.2.umd.min.js` | Multiple frontends load local vendored ethers copies. Do not delete until every HTML reference is audited. |
| 2 | visual asset duplicate | review before merge | `C:\Desktop\kline-odyssey\assets\wukong_caishen.png`<br>`C:\Desktop\kline-odyssey\wukong-temple\wukong-avatar.png` | Exact same asset bytes appear under different semantic names. |
| 2 | CURRENT/version snapshot duplicate | keep; no merge | `C:\Desktop\kline-odyssey\docs\physics\KGEN_Universe_Physics_Runtime_CURRENT.md`<br>`C:\Desktop\kline-odyssey\docs\physics\KGEN_Universe_Physics_Runtime_V3_7.md` | CURRENT is formal; V3_7 is provenance for the same content. |
| 3 | runtime historical mirror | keep; index provenance | `C:\Desktop\kline-odyssey\docs\physics\KGEN_Universe_Physics_Runtime_V1_6.md`<br>`C:\Desktop\kline-odyssey\K線西遊記\temples\12345\KGEN_Universe_Physics_Runtime_V1_6.md`<br>`C:\Desktop\kline-odyssey\whitepaper\KGEN_Universe_Physics_Runtime_V1_6.md` | Same runtime edition appears in docs, temple, and whitepaper locations. |
| 2 | active/archive contract duplicate | keep; contract-owner review required before any consolidation | `C:\Desktop\kline-odyssey\KGEN\contracts\archive\KGEN_RewardVault_V1.sol`<br>`C:\Desktop\kline-odyssey\KGEN\runtime\KGEN_RewardVault_V1.sol` | Runtime source and archive mirror have different governance meaning. |
| 7 | placeholder files | keep | `C:\Desktop\kline-odyssey\K線西遊記\autopilot\inbox\.gitkeep`<br>`C:\Desktop\kline-odyssey\K線西遊記\autopilot\out\events\.gitkeep`<br>`C:\Desktop\kline-odyssey\K線西遊記\autopilot\out\posts_zh\.gitkeep`<br>`C:\Desktop\kline-odyssey\K線西遊記\autopilot\out\subtitles_en\.gitkeep`<br>`C:\Desktop\kline-odyssey\K線西遊記\autopilot\out\voice_en\.gitkeep`<br>`C:\Desktop\kline-odyssey\K線西遊記\autopilot\schemas\.gitkeep`<br>`C:\Desktop\kline-odyssey\K線西遊記\autopilot\templates\.gitkeep` | Identical placeholders intentionally preserve empty directory structure. |
| 2 | shared engine plus temple-local copy | merge candidate after runtime audit | `C:\Desktop\kline-odyssey\K線西遊記\engine\engine_params_v1_0.json`<br>`C:\Desktop\kline-odyssey\K線西遊記\temples\16888\engine_params_v1_0.json` | 16888 appears to carry local engine copies; verify references before consolidation. |
| 2 | shared engine plus temple-local copy | merge candidate after runtime audit | `C:\Desktop\kline-odyssey\K線西遊記\engine\kline_engine_v1_0.js`<br>`C:\Desktop\kline-odyssey\K線西遊記\temples\16888\kline_engine_v1_0.js` | 16888 appears to carry local engine copies; verify references before consolidation. |
| 2 | legacy shell snapshot | keep until owner confirms formal page | `C:\Desktop\kline-odyssey\K線西遊記\kline-app-game\index.html`<br>`C:\Desktop\kline-odyssey\K線西遊記\kline-app-game\index_kline_app_game_btc_4d_runtime_v0_1A_from_12345.html` | One file is active index and one is named source snapshot from 12345. |
| 2 | data master/history duplicate | keep | `C:\Desktop\kline-odyssey\K線西遊記\kline-taifex\master\history\台指近全20260108.xlsx`<br>`C:\Desktop\kline-odyssey\K線西遊記\kline-taifex\master\台指近全20260108.xlsx` | Master/history snapshot relationship; do not collapse without pipeline policy. |
| 2 | data master/history duplicate | keep | `C:\Desktop\kline-odyssey\K線西遊記\kline-taifex\master\history\台指近全20260109.xlsx`<br>`C:\Desktop\kline-odyssey\K線西遊記\kline-taifex\master\台指近全20260109.xlsx` | Master/history snapshot relationship; do not collapse without pipeline policy. |
| 3 | visual asset duplicate | review before merge | `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\assets\bear-rear.png`<br>`C:\Desktop\kline-odyssey\K線西遊記\temples\16888\assets\fairy.png`<br>`C:\Desktop\kline-odyssey\K線西遊記\temples\16888\assets\fairy_sprite_36.png` | Exact same asset bytes appear under different semantic names. |
| 2 | visual asset duplicate | review before merge | `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\assets\heart-drive.png`<br>`C:\Desktop\kline-odyssey\K線西遊記\temples\12345\assets\heart.png` | Exact same asset bytes appear under different semantic names. |
| 2 | scene/SOP manifest mirror | keep; possible merge only after scene-runtime decision | `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\scenes\README.md`<br>`C:\Desktop\kline-odyssey\K線西遊記\temples\12345\SOP\scenes\README.md` | Formal scenes and SOP scenes mirror each other for documentation/runtime separation. |
| 2 | scene/SOP manifest mirror | keep; possible merge only after scene-runtime decision | `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\scenes\README_宇宙電梯樓層圖.md`<br>`C:\Desktop\kline-odyssey\K線西遊記\temples\12345\SOP\scenes\README_宇宙電梯樓層圖.md` | Formal scenes and SOP scenes mirror each other for documentation/runtime separation. |
| 2 | scene/SOP manifest mirror | keep; possible merge only after scene-runtime decision | `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\scenes\SCENE_MANIFEST.json`<br>`C:\Desktop\kline-odyssey\K線西遊記\temples\12345\SOP\scenes\SCENE_MANIFEST.json` | Formal scenes and SOP scenes mirror each other for documentation/runtime separation. |
| 2 | CURRENT/version SOP duplicate | keep; no merge | `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\SOP\TEMPLE_12345_AI_SOP_CURRENT.md`<br>`C:\Desktop\kline-odyssey\K線西遊記\temples\12345\SOP\TEMPLE_12345_AI_SOP_V1_4.md` | CURRENT is formal while V1_4 is historical provenance. |
| 2 | music playlist mirror | merge candidate after 16888 audit | `C:\Desktop\kline-odyssey\K線西遊記\temples\16888\music\playlist.json`<br>`C:\Desktop\kline-odyssey\K線西遊記\temples\16888\playlist.json` | 16888 has root and music playlist copies that may diverge by load path. |

### Duplicate Decision Summary
- visual asset duplicate: 3
- scene/SOP manifest mirror: 3
- shared engine plus temple-local copy: 2
- data master/history duplicate: 2
- archive asset mirror: 1
- vendor runtime copies: 1
- CURRENT/version snapshot duplicate: 1
- runtime historical mirror: 1
- active/archive contract duplicate: 1
- placeholder files: 1
- legacy shell snapshot: 1
- CURRENT/version SOP duplicate: 1
- music playlist mirror: 1

Merge candidates requiring manual audit before any change:
- Vendored `ethers-5.7.2.umd.min.js` copies.
- 16888 shared engine/local engine copies.
- Exact duplicate visual assets with different semantic names.
- Temple 12345 `scenes` and `SOP/scenes` mirrors, only after scene-runtime ownership is decided.
- 16888 root/music playlist mirrors.

Do-not-delete groups without explicit owner approval:
- CURRENT Runtime and version snapshots.
- Archive/history files and master/history data snapshots.
- `KGEN/runtime/KGEN_RewardVault_V1.sol` and its archive mirror.
- `.gitkeep` placeholder files.

## 3. Missing Reference Analysis
Total missing references: 1207
Total case mismatches: 12

### Missing References By Source Area
| Source area | Count |
|---|---:|
| Temple 12345 | 873 |
| Frontend/site/data | 146 |
| runtime JSON | 70 |
| README/docs/root | 54 |
| Other temple | 43 |
| Other | 9 |
| legacy wukong | 9 |
| KGEN docs/scripts/contracts | 2 |
| CI/workflow | 1 |

### Missing References By Cause
| Cause | Count | Second-stage meaning |
|---|---:|---|
| scene manifest asset reference | 602 | Likely real scene asset inventory gaps; not confirmed in formal Temple 12345 page load. |
| candidate real missing reference | 490 | Needs manual follow-up; may be a true broken file reference. |
| docs/README old reference | 57 | Documentation references that may be stale; does not automatically affect runtime. |
| dynamic URL/string false positive | 37 | Scanner captured URL variables, deeplinks, or UI strings rather than file dependencies. |
| absolute URL/site-route artifact | 13 | Site route or production URL path; validate separately from filesystem dependency checks. |
| placeholder/documentation link | 7 | Template placeholder or human-facing sample link. |
| CI secret/runtime artifact | 1 | Expected generated/secret artifact that is absent from the repository. |

### Temple 12345 Formal Loaded Chain
Formal loaded-chain missing-reference candidates: 60
| Cause | Count |
|---|---:|
| candidate real missing reference | 44 |
| dynamic URL/string false positive | 12 |
| docs/README old reference | 3 |
| absolute URL/site-route artifact | 1 |

Decision: no confirmed blocking missing dependency was found in the formal Temple 12345 load chain. The candidates are mainly relative-path resolution artifacts, dynamic strings, or shared-module scan artifacts. Do not change runtime code until a browser fetch/runtime test confirms an active failure.

Representative formal-chain candidates:
| Source | Raw reference | Resolved by first-stage scan | Second-stage classification |
|---|---|---|---|
| `C:\Desktop\kline-odyssey\K線西遊記\modules\kgen-land-engine.js` | `data/kgen-land-demo.json` | `K線西遊記/modules/data/kgen-land-demo.json` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\index.html` | `/PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_2.md` | `PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_2.md` | docs/README old reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-ai-service.js` | `./assets/heart.png` | `K線西遊記/temples/12345/modules/assets/heart.png` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-ai-service.js` | `請先斷開目前錢包或換用錢包 App 內建瀏覽器，重新開啟 12345.html?autoconnect=1&bridge=1 再連結。` | `K線西遊記/temples/12345/modules/請先斷開目前錢包或換用錢包 App 內建瀏覽器，重新開啟 12345.html` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-app-shell.js` | `blob` | `K線西遊記/temples/12345/modules/blob` | dynamic URL/string false positive |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-app-shell.js` | `f` | `K線西遊記/temples/12345/modules/f` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-app-shell.js` | `music/playlist.json` | `K線西遊記/temples/12345/modules/music/playlist.json` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-app-shell.js` | `music/song.mp3` | `K線西遊記/temples/12345/modules/music/song.mp3` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-app-shell.js` | `playlist.json` | `K線西遊記/temples/12345/modules/playlist.json` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-app-shell.js` | `raw` | `K線西遊記/temples/12345/modules/raw` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-app-shell.js` | `raw, base` | `K線西遊記/temples/12345/modules/raw, base` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-app-shell.js` | `track` | `K線西遊記/temples/12345/modules/track` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-app-shell.js` | `window.location.href` | `K線西遊記/temples/12345/modules/window.location.href` | dynamic URL/string false positive |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-divine-regeneration.js` | `'[KGEN` | `K線西遊記/temples/12345/modules/[KGEN` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-divine-regeneration.js` | `blob` | `K線西遊記/temples/12345/modules/blob` | dynamic URL/string false positive |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-divine-regeneration.js` | `url` | `K線西遊記/temples/12345/modules/url` | dynamic URL/string false positive |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-mother-runtime.js` | `ASSET_MANIFEST.md` | `K線西遊記/temples/12345/modules/ASSET_MANIFEST.md` | docs/README old reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-mother-runtime.js` | `PROGRAM_HISTORY.md` | `K線西遊記/temples/12345/modules/PROGRAM_HISTORY.md` | docs/README old reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-mother-runtime.js` | `assets/bear-rear.png` | `assets/bear-rear.png` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-mother-runtime.js` | `assets/bull-front.png` | `assets/bull-front.png` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-mother-runtime.js` | `assets/heart.png` | `assets/heart.png` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-mother-runtime.js` | `assets/warp-core.png` | `assets/warp-core.png` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-mother-runtime.js` | `modules/kgen-12345-cell-registry.json` | `K線西遊記/temples/12345/modules/modules/kgen-12345-cell-registry.json` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-mother-runtime.js` | `modules/kgen-12345-core.css` | `K線西遊記/temples/12345/modules/modules/kgen-12345-core.css` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-mother-runtime.js` | `modules/kgen-12345-growth-policy.json` | `K線西遊記/temples/12345/modules/modules/kgen-12345-growth-policy.json` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-mother-runtime.js` | `modules/kgen-12345-mother-runtime.js` | `K線西遊記/temples/12345/modules/modules/kgen-12345-mother-runtime.js` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-mother-runtime.js` | `modules/kgen-12345-runtime.js` | `K線西遊記/temples/12345/modules/modules/kgen-12345-runtime.js` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-runtime.js` | `./assets/bear-rear.png` | `K線西遊記/temples/12345/modules/assets/bear-rear.png` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-runtime.js` | `./assets/bull-front.png` | `K線西遊記/temples/12345/modules/assets/bull-front.png` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-runtime.js` | `./assets/heart.png` | `K線西遊記/temples/12345/modules/assets/heart.png` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-runtime.js` | `./assets/warp-core.png` | `K線西遊記/temples/12345/modules/assets/warp-core.png` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\runtime-bootstrap.js` | `'[KGEN` | `K線西遊記/temples/12345/modules/[KGEN` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\runtime-bootstrap.js` | `./LIFE_MANIFEST.json` | `K線西遊記/temples/12345/modules/LIFE_MANIFEST.json` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\runtime-bootstrap.js` | `./RUNTIME_GENOME.json` | `K線西遊記/temples/12345/modules/RUNTIME_GENOME.json` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\runtime-main.js` | `"deeplink 失敗，已改為複製橋接連結"` | `K線西遊記/temples/12345/modules/deeplink 失敗，已改為複製橋接連結` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\runtime-main.js` | `./assets/bear-rear.png` | `K線西遊記/temples/12345/modules/assets/bear-rear.png` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\runtime-main.js` | `./assets/bull-front.png` | `K線西遊記/temples/12345/modules/assets/bull-front.png` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\runtime-main.js` | `./assets/heart.png` | `K線西遊記/temples/12345/modules/assets/heart.png` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\runtime-main.js` | `./assets/warp-core.png` | `K線西遊記/temples/12345/modules/assets/warp-core.png` | candidate real missing reference |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\runtime-main.js` | `./music/playlist.json` | `K線西遊記/temples/12345/modules/music/playlist.json` | candidate real missing reference |
| ... | ... | ... | 20 more candidates retained in `C:\Desktop\kline-odyssey\VALIDATION_REPORT.md` |

### Case Mismatch Analysis
| Source | Raw reference | Resolved path | Existing path | Second-stage note |
|---|---|---|---|---|
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\LIFE_MANIFEST.json` | `index.html` | `index.html` | `Index.html` | Likely scanner base-path artifact: Temple 12345 has local `index.html`, while repo root has `Index.html`. |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\MANIFEST.json` | `index.html` | `index.html` | `Index.html` | Likely scanner base-path artifact: Temple 12345 has local `index.html`, while repo root has `Index.html`. |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\RUNTIME_GENOME.json` | `index.html` | `index.html` | `Index.html` | Likely scanner base-path artifact: Temple 12345 has local `index.html`, while repo root has `Index.html`. |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-cell-registry.json` | `index.html` | `index.html` | `Index.html` | Likely scanner base-path artifact: Temple 12345 has local `index.html`, while repo root has `Index.html`. |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\kgen-12345-mother-runtime.js` | `index.html` | `index.html` | `Index.html` | Likely scanner base-path artifact: Temple 12345 has local `index.html`, while repo root has `Index.html`. |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\runtime-cell-registry.json` | `index.html` | `index.html` | `Index.html` | Likely scanner base-path artifact: Temple 12345 has local `index.html`, while repo root has `Index.html`. |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\modules\runtime-mother.js` | `index.html` | `index.html` | `Index.html` | Likely scanner base-path artifact: Temple 12345 has local `index.html`, while repo root has `Index.html`. |
| `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\verify_manifest.js` | `index.html` | `index.html` | `Index.html` | Likely scanner base-path artifact: Temple 12345 has local `index.html`, while repo root has `Index.html`. |
| `C:\Desktop\kline-odyssey\MANIFEST.json` | `index.html` | `index.html` | `Index.html` | Potential case-sensitive hosting issue; validate before changing paths. |
| `C:\Desktop\kline-odyssey\neural\ORGAN_INDEX.json` | `index.html#kgen-heart-live-panel` | `index.html` | `Index.html` | Potential case-sensitive hosting issue; validate before changing paths. |
| `C:\Desktop\kline-odyssey\wukong-temple\index.html` | `manifest.json` | `manifest.json` | `MANIFEST.json` | Legacy wukong case mismatch may matter on GitHub Pages/Linux hosting. |
| `C:\Desktop\kline-odyssey\wukong-temple\manifest.json` | `index.html` | `index.html` | `Index.html` | Legacy wukong case mismatch may matter on GitHub Pages/Linux hosting. |

## 4. Impact On Temple 12345 Formal Operation
- Temple 12345 HTML/JS/CSS/JSON coverage remains complete: first-stage validation found all 108 target files in `docs/KGEN_TEMPLE_12345_MAP.md`.
- No confirmed missing local script/style/data dependency blocks `C:\Desktop\kline-odyssey\K線西遊記\temples\12345\index.html`.
- `SCENE_MANIFEST.json` and `SOP/scenes/SCENE_MANIFEST.json` still contain many scene asset references; these are the highest manual risk if scene playback is enabled later.
- Any cleanup must wait for explicit user approval and a browser/runtime verification pass.

## 5. Safe Commit Guidance
### Can Safely Commit After User Approval
- `C:\Desktop\kline-odyssey\docs\KGEN_MASTER_INDEX.md`
- `C:\Desktop\kline-odyssey\docs\KGEN_BOOT_FLOW.md`
- `C:\Desktop\kline-odyssey\docs\KGEN_DEPENDENCY_GRAPH.md`
- `C:\Desktop\kline-odyssey\docs\KGEN_TEMPLE_12345_MAP.md`
- `C:\Desktop\kline-odyssey\docs\KGEN_FRONTEND_INDEX.md`
- `C:\Desktop\kline-odyssey\docs\KGEN_RUNTIME_RULES.md`
- `C:\Desktop\kline-odyssey\docs\KGEN_VALIDATION_SECOND_STAGE.md`
- `C:\Desktop\kline-odyssey\VALIDATION_REPORT.md`
- `C:\Desktop\kline-odyssey\AGENTS.md` if the permanent AI rules update is accepted.

### Temporarily Should Not Commit
- `C:\Desktop\kline-odyssey\PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md`: Boot edits require explicit Boot approval.
- `C:\Desktop\kline-odyssey\README.md`: review against the no-Boot-change/no-program-change boundary before committing.
- `C:\Desktop\kline-odyssey\8q1232@gmail.com - Google Drive (H) - 捷徑.lnk`: local shortcut; should not be committed.

## 6. Manual Risk List
- Temple 12345 scene-manifest asset references may become real blockers if scene runtime is enabled.
- Vendored ethers copies are duplicated across root, assets, temple, and legacy pages; consolidate only after all page references are mapped.
- 16888 shared engine and temple-local engine files may represent intentional isolation; audit before merging.
- RewardVault duplicate spans active runtime and archive; contract ownership/deployment history must be confirmed before any move.
- Case mismatch rows involving root `Index.html`, Temple 12345 `index.html`, and legacy wukong `manifest.json` should be checked on case-sensitive hosting.
- Documentation/README old links should be repaired only through cumulative documentation updates, not by deleting old history.

## 7. Required Follow-Up Before Any Cleanup
1. Run a browser fetch/runtime check for Temple 12345 before touching runtime code.
2. Confirm which scene-manifest assets are still formal runtime requirements.
3. Decide whether 16888 should keep local engine copies or use the shared engine path.
4. Decide whether duplicated visual assets are intentionally separate semantic names.
5. Keep Boot V1.4, Runtime CURRENT, and Universe Map as the controlling entry chain for any later change.
