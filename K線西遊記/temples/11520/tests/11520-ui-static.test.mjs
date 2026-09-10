import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const read=p=>readFileSync(resolve(here,p),'utf8');
const html=read('../game-5d.html');
const main=read('../runtime/game-5d-main.mjs');
const fixes=read('../runtime/game-ui-product-fixes.mjs');
const controls=read('../runtime/game-controls-v251.mjs');
const xyzControl=read('../runtime/joystick-xzxy.mjs');
const source=[html,main,fixes,controls,xyzControl].join('\n');

const organs=['world','trade','positions','orders','history','assets','records','market','bag','character','worldmap','atm','settings','help'];
const fixed=['three','lookPad','axes','walletPanel','walletToggle','walletConnect','walletRefresh','minimap','joy','knob','yControl','cControl','lotsControl','attack','skill','dodge','flat','orderFire','tradeSword','dock','dockToggle','rail','sheet','sheetClose','confirm','confirmOrder','cancelOrder'];

test('all formal organs remain present in production source',()=>{for(const id of organs)assert.ok(main.includes(`['${id}'`),id)});
test('all current fixed control surfaces exist in shell HTML',()=>{for(const id of fixed)assert.ok(html.includes(`id="${id}"`),id)});
test('core controls have runtime event wiring',()=>{for(const token of ["joy.addEventListener('pointerdown'","$('#lookPad').addEventListener('pointerdown'","$('#attack').onclick","$('#skill').onclick","$('#dodge').onclick","$('#tradeSword').onclick","$('#flat').onclick","$('#orderFire').onclick","$('#dockToggle').onclick","$('#walletConnect').onclick","$('#walletRefresh').onclick","$('#walletToggle').onclick","bindVertical('#lotsControl'","bindVertical('#cControl'"])assert.ok(main.includes(token),token);for(const token of ['function bindDisc()','function bindRail()','__K11520_3D_CONTROL__','railAxis','discAxes'])assert.ok(xyzControl.includes(token),token);assert.equal(main.includes("bindVertical('#yControl'"),false,'remaining-axis rail must not use legacy bounded Y slider wiring')});
test('0C walking remains independent from C control',()=>{assert.equal(source.includes('D.warp===0?0'),false);assert.ok(main.includes('function moveManual()'));assert.ok(main.includes('const speed=.10'))});
test('current dynamic organ actions are wired',()=>{for(const token of ['data-organ','openOrgan(','data-axis','data-market','openOrder()','closePos','setWaypoint','bindMap'])assert.ok(main.includes(token),token)});
test('economy boundaries remain visibly separate',()=>{assert.ok(html.includes('KGEN Local Free'));assert.ok(html.includes('KAIOS'));for(const token of ['requiredMargin','positionRisk','playerAttack'])assert.ok(main.includes(token),token)});

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

test('known central interceptor is explicitly retired, not heuristically scanned',()=>{
  assert.ok(controls.includes("#lookPad{display:none!important;pointer-events:none!important}"));
  assert.equal(controls.includes('largeBlank='),false,'heuristic large blank node deletion returned');
  assert.equal(controls.includes('document.body.children'),false,'broad body-child blocker deletion returned');
});

test('one real wallet/backpack organ remains in product-fix layer',()=>{assert.ok(fixes.includes('restoreWalletOrgan'));assert.ok(fixes.includes('placeOnlyRealBag'))});
