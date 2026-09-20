import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const read=p=>readFileSync(resolve(here,p),'utf8');
const html=read('../game-5d.html');
const main=read('../runtime/game-5d-main.mjs');
const fixes=read('../runtime/game-ui-product-fixes.mjs');
const controls=read('../runtime/game-controls-v251.mjs');
const xyzControl=read('../runtime/joystick-xzxy.mjs');
const xyzAuthority=read('../runtime/xyz-input-authority-runtime.mjs');
const driveLive=read('../runtime/combat-drive-live-runtime.mjs');
const driveAdapter=read('../runtime/combat-drive-adapter.mjs');
const massScale=read('../runtime/combat-mass-scale-runtime.mjs');
const characterStatus=read('../runtime/character-status-runtime.mjs');
const signedC=read('../runtime/mobile-signed-c-immersive-runtime.mjs');
const actionRail=read('../runtime/mobile-action-rail-clearance-runtime.mjs');
const publicMarketQuotes=read('../runtime/public-market-quotes.mjs');
const source=[html,main,fixes,controls,xyzControl,xyzAuthority,driveLive,driveAdapter,massScale,characterStatus].join('\n');

const organs=['world','trade','positions','orders','history','assets','records','market','bag','character','worldmap','atm','settings','help'];
const fixed=['three','lookPad','axes','walletPanel','walletToggle','walletConnect','walletRefresh','minimap','joy','knob','yControl','cControl','lotsControl','attack','skill','dodge','flat','orderFire','tradeSword','dock','dockToggle','rail','sheet','sheetClose','confirm','confirmOrder','cancelOrder'];

test('all formal organs remain present in production source',()=>{for(const id of organs)assert.ok(main.includes(`['${id}'`),id)});
test('all current fixed control surfaces exist in shell HTML',()=>{for(const id of fixed)assert.ok(html.includes(`id="${id}"`),id)});
test('core controls have runtime event wiring',()=>{for(const token of ["joy.addEventListener('pointerdown'","$('#lookPad').addEventListener('pointerdown'","$('#attack').onclick","$('#skill').onclick","$('#dodge').onclick","$('#tradeSword').onclick","$('#flat').onclick","$('#orderFire').onclick","$('#dockToggle').onclick","$('#walletConnect').onclick","$('#walletRefresh').onclick","$('#walletToggle').onclick","bindVertical('#lotsControl'","bindVertical('#cControl'"])assert.ok(main.includes(token),token);for(const token of ['function bindDisc()','function bindRail()','__K11520_3D_CONTROL__','railAxis','discAxes'])assert.ok(xyzControl.includes(token),token);assert.equal(main.includes("bindVertical('#yControl'"),false,'remaining-axis rail must not use legacy bounded Y slider wiring')});
test('0C walking remains independent from C control',()=>{assert.equal(source.includes('D.warp===0?0'),false);assert.ok(main.includes('function moveManual()'));assert.ok(main.includes('const speed=.10'))});
test('current dynamic organ actions are wired',()=>{for(const token of ['data-organ','openOrgan(','data-axis','data-market','openOrder()','closePos','setWaypoint','bindMap','PLANE_TRADE_AXIS','syncTradeAxisFromPlane'])assert.ok(main.includes(token),token)});
test('economy boundaries remain visibly separate',()=>{assert.ok(html.includes('KGEN Local Free'));assert.ok(html.includes('KAIOS'));for(const token of ['requiredMargin','positionRisk','attackKSpace'])assert.ok(main.includes(token),token);assert.equal(main.includes('S.kaios+=r.rewardKaios'),false)});

test('public reference quotes use the browser-safe market-data origin without credentials',()=>{
  assert.ok(main.includes("import {fetchPublicMarketQuotes} from './public-market-quotes.mjs'"));
  assert.ok(publicMarketQuotes.includes("origin:'https://data-api.binance.vision'"));
  assert.ok(publicMarketQuotes.includes("credentials:'omit'"));
  assert.equal(main.includes('https://api.binance.com'),false,'CORS-hostile general API origin returned');
  for(const forbidden of ['Authorization','privateKey','sendTransaction','eth_sendTransaction'])assert.equal(publicMarketQuotes.includes(forbidden),false,forbidden);
});

test('human-approved current control imagery is production-wired',()=>{
  assert.ok(controls.includes("const KGEN_GENESIS_DATA='data:image/webp;base64,"),'KGEN Genesis joystick data asset');
  for(const token of ['goddess-ui.webp','kgen-user-ui.webp','ufo-ui.png'])assert.ok(controls.includes(token),token);
  for(const token of ['#knob','#yJoyV250 .yKnob','#lotsThumb','#cThumb'])assert.ok(controls.includes(token),token);
  assert.ok(xyzControl.includes("const HEART='data:image/webp;base64,"),'human-approved YZ heart art must be embedded in formal controller');
  assert.ok(xyzControl.includes("const MODES=['XZ','XY','YZ']"),'three-plane mode cycle');
});

test('XYZ plane control is unbounded intent with collision-constrained body',()=>{
  assert.ok(main.includes('intentXYZ:{x:0,y:0,z:0}'));
  assert.ok(main.includes('unboundedIntent:true'));
  assert.ok(main.includes("blocker={name:'GROUND'}"));
  assert.ok(main.includes('S.intentXYZ={x:S.intentXYZ.x+v.x*speed'));
  assert.ok(xyzControl.includes('unboundedCoordinateIntent:true'));
});

test('C and lot drive bridge is installed by XYZ authority without asset mutation',()=>{
  assert.ok(xyzAuthority.includes("import('./combat-drive-live-runtime.mjs')"),'XYZ authority must install live drive bridge');
  assert.ok(xyzAuthority.includes('applyToLiveControl:true'),'live XYZ intent scaling must be enabled');
  assert.ok(driveLive.includes('rawVectorFromControl'),'drive scaling must rebuild raw XYZ from disc/rail state to avoid compounding');
  assert.ok(driveLive.includes('__K11520_3D_CONTROL__=live'),'scaled control must reach canonical main runtime input');
  assert.ok(driveLive.includes('simulationOnly:true'),'drive bridge must remain simulation-only');
  assert.ok(massScale.includes('kaiosPerKgen: 1000'),'1 KGEN must remain 1000 KAIOS');
  assert.ok(massScale.includes("if (c===0) return 'LOCAL_WALK'"),'0C must remain local walking');
  assert.ok(massScale.includes("if (c===1) return 'LIGHT_SPEED_SPOT'"),'1C must remain light-speed spot');
  for(const forbidden of ['sendTransaction','eth_sendTransaction','privateKey','treasuryTransfer'])assert.equal(driveLive.includes(forbidden),false,forbidden);
});

test('detailed HP and character inspection are read-only and boot-wired',()=>{
  assert.ok(xyzAuthority.includes("import('./character-status-runtime.mjs')"),'character status must load in live boot path');
  for(const token of ['HP ${Math.round(h.current)} / ${h.max}','${h.pct.toFixed(1)}%','角色資料','悟空 · 11520 玩家','KAIOS','XYZ','C 曲速','口數','KX','KY','KZ'])assert.ok(characterStatus.includes(token),token);
  assert.ok(characterStatus.includes('simulationOnly:true'));
  assert.ok(characterStatus.includes("addEventListener('k11520:player-tap'"),'avatar inspection must use the canonical 3D player raycast event');
  assert.ok(characterStatus.includes('worldTapPassthrough:true'),'non-avatar world taps must remain canonical');
  assert.equal(characterStatus.includes('centralAvatar='),false,'hard-coded canvas rectangle must not consume world/entity taps');
  assert.ok(main.includes("emitWorldTapRoute('PLAYER')"),'player raycast route must be explicit');
  assert.ok(main.includes("emitWorldTapRoute('GROUND'"),'ground route must remain explicit');
  for(const forbidden of ['sendTransaction','eth_sendTransaction','privateKey','treasuryTransfer','approve(','transfer('])assert.equal(characterStatus.includes(forbidden),false,forbidden);
});

test('known central interceptor is explicitly retired, not heuristically scanned',()=>{
  assert.ok(controls.includes("#lookPad{display:none!important;pointer-events:none!important}"));
  assert.equal(controls.includes('largeBlank='),false,'heuristic large blank node deletion returned');
  assert.equal(controls.includes('document.body.children'),false,'broad body-child blocker deletion returned');
});

test('one real wallet/backpack organ remains in product-fix layer',()=>{assert.ok(fixes.includes('restoreWalletOrgan'));assert.ok(fixes.includes('placeOnlyRealBag'))});

test('legacy zero-parameter event handlers and observers are removed at source',()=>{
  for(const token of ['installZeroParameterSemantics','pinZeroThumb','zeroSemantics','zeroLots','zeroWarp','zeroObserver',"style.top='64%'"])
    assert.equal(fixes.includes(token),false,`obsolete parameter writer returned: ${token}`);
});

test('temporary compatibility shims are deleted rather than kept as late DOM owners',()=>{
  for(const shim of ['legacy-parameter-zero-retirement.mjs','mobile-lot-numeric-canonical-bridge.mjs'])assert.equal(existsSync(resolve(here,'../runtime',shim)),false,`delete obsolete shim: ${shim}`);
  assert.equal(actionRail.includes('mobile-lot-numeric-canonical-bridge.mjs'),false,'action rail must not load a second lot-input owner');
});

test('game main no longer owns signed C display or thumb rendering',()=>{
  assert.ok(main.includes('__K11520_TRADE_DIRECTION_API__'),'game state must expose one direct canonical side API');
  assert.ok(main.includes('__K11520_SIGNED_C_IMMERSIVE__?.api?.paintSignedC?.(S.axis)'),'native control refresh must delegate signed-C rendering');
  assert.equal(main.includes("$('#cRead').textContent=`${a.c}C`"),false,'unsigned cRead writer returned');
  assert.equal(main.includes("setThumb($('#cThumb')"),false,'unsigned cThumb writer returned');
  assert.ok(main.includes("setTradeSide(S.axis,axis().side==='多'?'空':'多')"),'legacy side button fallback must use canonical side setter');
});

test('signed C runtime owns one positive-lot numeric policy and direct side synchronization',()=>{
  for(const token of ['function normalizeNumericLots','invalidLotPolicy:\'REJECT_AND_KEEP_PREVIOUS\'','__K11520_TRADE_DIRECTION_API__?.getSide','api.setSide(axis,side)','l.type=\'text\''])assert.ok(signedC.includes(token),token);
  for(const token of ['TRADE_ORGAN_NOT_FOUND','SIDE_BUTTON_NOT_FOUND','SIDE_SYNC_FAILED','trade.click()'])assert.equal(signedC.includes(token),false,`async UI-button side sync returned: ${token}`);
});

test('market cards remain information-only and cannot rewrite plane-selected trade authority',()=>{
  assert.equal(signedC.includes('paintSignedC(card.dataset.axis)'),false,'market-card click must not repaint C for the inspected market');
  assert.equal(signedC.includes('syncCanonicalSide(v,card.dataset.axis)'),false,'market-card click must not synchronize direction for the inspected market');
});

test('product help uses signed C and positive lots without obsolete zero-lot hints',()=>{
  for(const token of ['最低 0口','C 最低 0','#cControl::after','#lotsControl::after'])assert.equal(fixes.includes(token),false,token);
  assert.ok(fixes.includes('口數永遠為正'));
  assert.ok(fixes.includes('向上為 +C 多、向下為 -C 空'));
  assert.ok(fixes.includes('最小 1 口'));
});

test('plane switch directly owns trading axis and sword no longer gates orders',()=>{assert.ok(main.includes("const PLANE_TRADE_AXIS=Object.freeze({XZ:'KY',XY:'KZ',YZ:'KX'})"));assert.equal(main.includes('if(!S.tradeArmed)'),false);assert.equal(main.includes('tradeArmed'),false);for(const skill of ['phantomAxe','goldenRain','slash'])assert.ok(main.includes(`performCombat('${skill}')`));assert.ok(main.includes("data-market-card"));assert.ok(main.includes("點市場卡不會改變交易軸"));for(const pair of ["KX:'BTCUSDT'","KY:'ETHUSDT'","KZ:'BNBUSDT'"])assert.ok(main.includes(pair),pair);assert.equal(main.includes('核爆'),false);assert.equal(html.includes('核爆'),false)});

test('combat FX shields translucent HUD surfaces while effects are active',()=>{const fx=readFileSync(new URL('../runtime/combat-fx-runtime.mjs',import.meta.url),'utf8');assert.ok(fx.includes('k11520CombatFxActive'));assert.ok(fx.includes('hudShielded:true'));assert.ok(fx.includes("background:#091119!important"))});
