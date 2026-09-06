import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {requiredMargin,pnlForMove,positionRisk,maxAdversePoints} from '../K線西遊記/temples/11520/runtime/kgen-margin-runtime.mjs';
import {createWorldState,playerAttack,tickWorld} from '../K線西遊記/temples/11520/runtime/world-runtime.mjs';
import {publishMarketLifeSourceEvent} from '../K線西遊記/temples/11520/runtime/market-life-source-runtime.mjs';

assert.equal(requiredMargin({lots:1}),1);assert.equal(requiredMargin({lots:100}),100);assert.equal(pnlForMove({entry:100,mark:99,side:'多',lots:100,c:1}),-100);assert.equal(maxAdversePoints(1),1);assert.equal(maxAdversePoints(.001),1000);const r=positionRisk({entry:100,mark:99,side:'多',lots:100,c:1});assert.equal(r.principal,100);assert.equal(r.pnl,-100);assert.equal(r.remaining,0);assert.equal(r.liquidated,true);

const world=createWorldState(1000);assert.equal(world.monsters.some(m=>m.sourceManaged),false);publishMarketLifeSourceEvent({type:'SPAWN',sourceId:'PRODUCT-STANDARD-QA',lifeId:'LIFE-DIGITAL-ANT-QA-001',name:'Digital Ant QA',species:'DIGITAL_ANT',intelligence:3,markets:['BTCUSDT'],capital:20,vitality:100,maxHp:100,positions:{KX:{market:'BTCUSDT',side:1,lots:1,c:.001}},x:0,y:0,z:0},{persistLocal:false,broadcast:false});tickWorld(world,{x:0,y:0,z:0},1100);const living=world.monsters.find(m=>m.sourceManaged&&m.lifeId==='LIFE-DIGITAL-ANT-QA-001');assert.ok(living);const attack=playerAttack(world,{x:0,y:0,z:0},{damage:999,now:1200});assert.equal(attack.ok,false);assert.equal(attack.reason,'SOURCE_SETTLEMENT_REQUIRED');assert.equal(attack.rewardKaios,0);

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.join(here,'../K線西遊記/temples/11520');
const html=fs.readFileSync(path.join(root,'game-5d.html'),'utf8');
const bootstrap=fs.readFileSync(path.join(root,'runtime/game-5d-bootstrap.mjs'),'utf8');
const main=fs.readFileSync(path.join(root,'runtime/game-5d-main.mjs'),'utf8');
const visual=fs.readFileSync(path.join(root,'runtime/life-visual-runtime.mjs'),'utf8');
const spatial=fs.readFileSync(path.join(root,'runtime/spatial-coordinate-runtime.mjs'),'utf8');
const navigation=fs.readFileSync(path.join(root,'runtime/map-object-navigation-runtime.mjs'),'utf8');
for(const marker of ['walletConnect','KGEN verified','orderFire','confirmOrder','./runtime/game-5d-bootstrap.mjs'])assert.ok(html.includes(marker),`missing product marker: ${marker}`);
for(const marker of ["import('./game-5d-main.mjs')",'DEGRADED_PLAYABLE','install11520ProductFixes','joystickToWorld'])assert.ok(bootstrap.includes(marker),`missing bootstrap marker: ${marker}`);
for(const marker of ['Knight.glb','GLTFLoader','AnimationMixer','KX','KY','KZ','主城世界','K場交易','持倉','委託','歷史','資產','統計','市場','背包','角色','世界地圖','ATM','設定','客服/說明'])assert.ok(main.includes(marker),`missing runtime marker: ${marker}`);
assert.ok(main.includes("joy.addEventListener('pointerdown'"));assert.ok(main.includes("$('#attack').onclick"));assert.ok(main.includes("$('#dockToggle').onclick"));assert.ok(main.includes('inspectMapPoint'));assert.ok(main.includes('createLifeVisual'));assert.ok(spatial.includes("northAxis:'Z+'"));assert.ok(navigation.includes("kind:'ENTITY'"));assert.ok(visual.includes("visualMode:'PROCEDURAL_3D'"));assert.ok(visual.includes("visualMode:'FALLBACK'"));assert.ok(!main.includes('new THREE.DodecahedronGeometry(.6)'));assert.ok(!main.includes('margin = lots / leverage'));assert.ok(!main.includes('margin = lots / C'));
console.log('11520 standardized product invariants PASS');
