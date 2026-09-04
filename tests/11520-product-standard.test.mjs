import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {requiredMargin,pnlForMove,positionRisk,maxAdversePoints} from '../K線西遊記/temples/11520/runtime/kgen-margin-runtime.mjs';
import {createWorldState,playerAttack,tickWorld} from '../K線西遊記/temples/11520/runtime/world-runtime.mjs';
import {publishMarketLifeSourceEvent} from '../K線西遊記/temples/11520/runtime/market-life-source-runtime.mjs';

// KGEN canonical math.
assert.equal(requiredMargin({lots:1}),1);
assert.equal(requiredMargin({lots:100}),100);
assert.equal(pnlForMove({entry:100,mark:99,side:'多',lots:100,c:1}),-100);
assert.equal(maxAdversePoints(1),1);
assert.equal(maxAdversePoints(.001),1000);
const r=positionRisk({entry:100,mark:99,side:'多',lots:100,c:1});
assert.equal(r.principal,100);
assert.equal(r.pnl,-100);
assert.equal(r.remaining,0);
assert.equal(r.liquidated,true);

// Source-driven living-market invariant: no formal fixed monster at boot.
const world=createWorldState(1000);
assert.equal(world.monsters.some(m=>m.sourceManaged),false);
publishMarketLifeSourceEvent({type:'SPAWN',sourceId:'PRODUCT-STANDARD-QA',lifeId:'LIFE-DIGITAL-ANT-QA-001',name:'Digital Ant QA',species:'DIGITAL_ANT',intelligence:3,markets:['BTCUSDT'],capital:20,vitality:100,maxHp:100,positions:{KX:{market:'BTCUSDT',side:1,lots:1,c:.001}},x:0,y:0,z:0},{persistLocal:false,broadcast:false});
tickWorld(world,{x:0,y:0,z:0},1100);
const living=world.monsters.find(m=>m.sourceManaged&&m.lifeId==='LIFE-DIGITAL-ANT-QA-001');
assert.ok(living);
const attack=playerAttack(world,{x:0,y:0,z:0},{damage:999,now:1200});
assert.equal(attack.ok,false);
assert.equal(attack.reason,'SOURCE_SETTLEMENT_REQUIRED');
assert.equal(attack.rewardKaios,0);

// Static product regression locks.
const here=path.dirname(fileURLToPath(import.meta.url));
const html=fs.readFileSync(path.join(here,'../K線西遊記/temples/11520/game-5d.html'),'utf8');
for(const marker of [
  'Knight.glb','GLTFLoader','AnimationMixer','XZ 平面圓形遙桿',
  'walletConnect','KGEN verified','KX','KY','KZ','orderFire','confirmOrder',
  '主城世界','K場交易','持倉','委託','歷史','資產','統計','市場','背包','角色','世界地圖','ATM','設定','客服/說明'
]) assert.ok(html.includes(marker),`missing product marker: ${marker}`);
assert.ok(html.includes("joy.addEventListener('pointerdown'"));
assert.ok(html.includes("$('#attack').onclick"));
assert.ok(html.includes("$('#dockToggle').onclick"));
assert.ok(!html.includes('margin = lots / leverage'));
assert.ok(!html.includes('margin = lots / C'));

console.log('11520 standardized product invariants PASS');
