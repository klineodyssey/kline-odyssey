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
const source=[html,main,fixes,controls].join('\n');

const organs=['world','trade','positions','orders','history','assets','records','market','bag','character','worldmap','atm','settings','help'];
const fixed=['three','lookPad','axes','walletPanel','walletToggle','walletConnect','walletRefresh','minimap','joy','knob','yControl','cControl','lotsControl','attack','skill','dodge','flat','orderFire','tradeSword','dock','dockToggle','rail','sheet','sheetClose','confirm','confirmOrder','cancelOrder'];

test('all formal organs remain present in production source',()=>{
  for(const id of organs)assert.ok(main.includes(`['${id}'`),id);
});

test('all current fixed control surfaces exist in shell HTML',()=>{
  for(const id of fixed)assert.ok(html.includes(`id="${id}"`),id);
});

test('core controls have runtime event wiring',()=>{
  for(const token of [
    "joy.addEventListener('pointerdown'",
    "$('#lookPad').addEventListener('pointerdown'",
    "$('#attack').onclick",
    "$('#skill').onclick",
    "$('#dodge').onclick",
    "$('#tradeSword').onclick",
    "$('#flat').onclick",
    "$('#orderFire').onclick",
    "$('#dockToggle').onclick",
    "$('#walletConnect').onclick",
    "$('#walletRefresh').onclick",
    "$('#walletToggle').onclick",
    "bindVertical('#yControl'",
    "bindVertical('#lotsControl'",
    "bindVertical('#cControl'",
  ])assert.ok(main.includes(token),token);
});

test('0C walking remains independent from C control',()=>{
  assert.equal(source.includes('D.warp===0?0'),false);
  assert.ok(main.includes('function moveManual()'));
  assert.ok(main.includes('const speed=.10'));
});

test('current dynamic organ actions are wired',()=>{
  for(const token of ['data-organ','openOrgan(','data-axis','data-market','openOrder()','closePos','setWaypoint','bindMap'])assert.ok(main.includes(token),token);
});

test('economy boundaries remain visibly separate',()=>{
  assert.ok(html.includes('KGEN Local Free'));
  assert.ok(html.includes('KAIOS'));
  for(const token of ['requiredMargin','positionRisk','playerAttack'])assert.ok(main.includes(token),token);
});

test('human-approved V2.5 control imagery is production-wired',()=>{
  for(const token of ['brand-user-ui.webp','fairy_sprite_36.png','kgen-user-ui.webp','ufo-user-ui.webp'])assert.ok(controls.includes(token),token);
  for(const token of ['#knob','#yJoyV250 .yKnob','#lotsThumb','#cThumb'])assert.ok(controls.includes(token),token);
});

test('known central interceptor is explicitly retired, not heuristically scanned',()=>{
  assert.ok(controls.includes("#lookPad{display:none!important;pointer-events:none!important}"));
  assert.equal(controls.includes('largeBlank='),false,'heuristic large blank node deletion returned');
  assert.equal(controls.includes('document.body.children'),false,'broad body-child blocker deletion returned');
});

test('one real wallet/backpack organ remains in product-fix layer',()=>{
  assert.ok(fixes.includes('restoreWalletOrgan'));
  assert.ok(fixes.includes('placeOnlyRealBag'));
});
