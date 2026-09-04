import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const here=dirname(fileURLToPath(import.meta.url));
const html=readFileSync(resolve(here,'../game-5d.html'),'utf8');
const organs=['world','trade','positions','orders','history','assets','records','market','bag','character','worldmap','atm','settings','help'];
const fixed=['three','lookPad','axes','walletPanel','walletToggle','walletConnect','walletRefresh','minimap','joy','knob','yControl','cControl','lotsControl','attack','skill','dodge','flat','orderFire','tradeSword','dock','dockToggle','rail','sheet','sheetClose','confirm','confirmOrder','cancelOrder'];

test('all formal organs remain present',()=>{for(const id of organs)assert.ok(html.includes(`['${id}'`),id)});
test('all current fixed control surfaces exist',()=>{for(const id of fixed)assert.ok(html.includes(`id="${id}"`),id)});
test('core controls have event wiring',()=>{
  for(const token of ["joy.addEventListener('pointerdown'","$('#lookPad').addEventListener('pointerdown'","$('#attack').onclick","$('#skill').onclick","$('#dodge').onclick","$('#tradeSword').onclick","$('#flat').onclick","$('#orderFire').onclick","$('#dockToggle').onclick","$('#walletConnect').onclick","$('#walletRefresh').onclick","$('#walletToggle').onclick","bindVertical('#yControl'","bindVertical('#lotsControl'","bindVertical('#cControl'"])assert.ok(html.includes(token),token);
});
test('0C walking remains independent from C control',()=>{assert.equal(html.includes('D.warp===0?0'),false);assert.ok(html.includes('function moveManual()'));assert.ok(html.includes('const speed=.10'))});
test('current dynamic organ actions are wired',()=>{for(const token of ['data-organ','openOrgan(','data-axis','data-market','openOrder()','closePos','setNavTarget','bindMap'])assert.ok(html.includes(token),token)});
test('economy boundaries remain visibly separate',()=>{assert.ok(html.includes('KGEN Local Free'));assert.ok(html.includes('KAIOS'));assert.ok(html.includes('requiredMargin'));assert.ok(html.includes('positionRisk'));assert.ok(html.includes('playerAttack'))});
