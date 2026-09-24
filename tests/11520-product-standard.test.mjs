import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {requiredMargin,pnlForMove,positionRisk,maxAdversePoints} from '../K線西遊記/temples/11520/runtime/kgen-margin-runtime.mjs';
import {createWorldState,playerAttack,tickWorld} from '../K線西遊記/temples/11520/runtime/world-runtime.mjs';
import {publishMarketLifeSourceEvent} from '../K線西遊記/temples/11520/runtime/market-life-source-runtime.mjs';
import {PUBLIC_WALLET_IDENTITY_KEY,PLAYER_SESSION_KEY,readPublicWalletIdentity,savePublicWalletIdentity,readPlayerSession,savePlayerSession} from '../K線西遊記/temples/11520/runtime/evm-wallet-runtime.mjs';

assert.equal(requiredMargin({lots:1}),1);
assert.equal(requiredMargin({lots:100}),100);
assert.equal(pnlForMove({entry:100,mark:99,side:'多',lots:100,c:100}),-100);
assert.equal(maxAdversePoints(100,100),1);
assert.equal(maxAdversePoints(50,100),2);
const r=positionRisk({entry:100,mark:99,side:'多',lots:100,c:100});
assert.equal(r.principal,100);assert.equal(r.pnl,-100);assert.equal(r.remaining,0);assert.equal(r.liquidated,true);

const world=createWorldState(1000);
assert.equal(world.monsters.some(m=>m.sourceManaged),false);
publishMarketLifeSourceEvent({type:'SPAWN',sourceId:'PRODUCT-STANDARD-QA',lifeId:'LIFE-DIGITAL-ANT-QA-001',name:'Digital Ant QA',species:'DIGITAL_ANT',intelligence:3,markets:['BTCUSDT'],capital:20,vitality:100,maxHp:100,positions:{KX:{market:'BTCUSDT',side:1,lots:1,c:.001}},x:0,y:0,z:0},{persistLocal:false,broadcast:false});
tickWorld(world,{x:0,y:0,z:0},1100);
const living=world.monsters.find(m=>m.sourceManaged&&m.lifeId==='LIFE-DIGITAL-ANT-QA-001');assert.ok(living);
const attack=playerAttack(world,{x:0,y:0,z:0},{damage:999,now:1200});assert.equal(attack.ok,false);assert.equal(attack.reason,'SOURCE_SETTLEMENT_REQUIRED');assert.equal(attack.rewardKaios,0);

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.join(here,'../K線西遊記/temples/11520');
const html=fs.readFileSync(path.join(root,'game-5d.html'),'utf8');
const main=fs.readFileSync(path.join(root,'runtime/game-5d-main.mjs'),'utf8');
const fixes=fs.readFileSync(path.join(root,'runtime/game-ui-product-fixes.mjs'),'utf8');
const controls=fs.readFileSync(path.join(root,'runtime/game-controls-v251.mjs'),'utf8');
const signedC=fs.readFileSync(path.join(root,'runtime/mobile-signed-c-immersive-runtime.mjs'),'utf8');
const shell=fs.readFileSync(path.join(root,'runtime/game-mobile-shell.mjs'),'utf8');
const fixesV23=fs.readFileSync(path.join(root,'runtime/game-ui-product-fixes-v23.mjs'),'utf8');
const guidance=fs.readFileSync(path.join(root,'runtime/trade-guidance-runtime.mjs'),'utf8');
const walletTrade=fs.readFileSync(path.join(root,'wallet-trade.html'),'utf8');
const legacyRuntime=fs.readFileSync(path.join(root,'runtime/game-ui-runtime.mjs'),'utf8');
const nonlinearControls=fs.readFileSync(path.join(root,'controls/nonlinear-controls.mjs'),'utf8');
const backend=fs.readFileSync(path.join(root,'backend/server.mjs'),'utf8');
const temple12345=fs.readFileSync(path.join(root,'../12345/index.html'),'utf8');
const temple16888=fs.readFileSync(path.join(root,'../16888/index.html'),'utf8');
const source=[html,main,fixes,controls].join('\n');

for(const marker of ['Knight.glb','GLTFLoader','AnimationMixer','walletConnect','KGEN verified','KX','KY','KZ','orderFire','confirmOrder','主城世界','K場交易','持倉','委託','歷史','資產','統計','市場','背包','角色','世界地圖','ATM','設定','客服/說明'])assert.ok(source.includes(marker),`missing product marker: ${marker}`);
assert.ok(controls.includes("const KGEN_GENESIS_DATA='data:image/webp;base64,"),'missing approved mobile-control marker: KGEN Genesis joystick data asset');
for(const marker of ['goddess-ui.webp','kgen-user-ui.webp','ufo-ui.png','#yJoyV250 .yKnob','#lotsThumb','#cThumb'])assert.ok(controls.includes(marker),`missing approved mobile-control marker: ${marker}`);

assert.ok(main.includes("joy.addEventListener('pointerdown'"));assert.ok(main.includes("$('#attack').onclick"));assert.ok(main.includes("$('#dockToggle').onclick"));assert.ok(main.includes('function moveManual()'));assert.ok(main.includes('setWaypoint'));assert.ok(fixes.includes('restoreWalletOrgan'));assert.ok(fixes.includes('placeOnlyRealBag'));assert.ok(controls.includes("#lookPad{display:none!important;pointer-events:none!important}"));assert.ok(!source.includes('margin = lots / leverage'));assert.ok(!source.includes('margin = lots / C'));
for(const runtime of [main,signedC,shell,fixesV23])assert.ok(!runtime.includes('[0,.000001,.00001,.0001,.001,.01,.1,1,10,100,1000]'),'interactive C ladder must stop at 100C');
for(const runtime of [legacyRuntime,nonlinearControls,backend])assert.ok(!runtime.includes('max:1000')&&!runtime.includes('<=1000'),'all executable 11520 C/leverage surfaces must stop at 100');
assert.ok(!backend.includes('lots / leverage'),'off-chain backend must not discount principal by leverage');
assert.ok(backend.includes('priceReturn*direction*lots*absC'),'off-chain backend metadata must disclose percentage-return PnL');
assert.ok(legacyRuntime.includes("import {clampPositionPnl,pnlForMove,requiredMargin}"),'legacy UI runtime must reuse the canonical bounded margin engine');
assert.ok(signedC.includes('cRange:[-100,100]'),'signed C numeric range must be capped at ±100C');
assert.ok(signedC.includes("invalidCPolicy:'REJECT_OUTSIDE_100C_AND_KEEP_PREVIOUS'"),'out-of-range numeric C must fail closed');
assert.ok(main.includes('每 1% 變動'),'order preview must explain percentage-return PnL');
assert.ok(!main.includes('每點 ±'),'order preview must not claim absolute point PnL');
assert.ok(guidance.includes('價格報酬率 × 口數 × C'),'customer guidance must match percentage-return PnL');
assert.ok(!walletTrade.includes('<option value="1000">'),'standalone wallet trade UI must not expose 1000C');
assert.ok(walletTrade.includes('PnL = 價格報酬率 × 口數 × C'),'standalone wallet trade formula must use percentage return');
assert.ok(walletTrade.includes('每 1% 損益'),'standalone wallet trade preview must use percentage semantics');
for(const [temple,id] of [[temple12345,'12345'],[temple16888,'16888']]){
  assert.match(temple,new RegExp(`href="\.\./11520/game-5d\\.html\\?returnFrom=${id}"`),`${id} must return to canonical 11520 world`);
  assert.match(temple,/id="return-to-11520"[^>]*>返回宇宙｜11520 花果山世界</,`${id} must expose the visible return control`);
  assert.match(temple,new RegExp(`bindTempleReturnWalletContinuity\\(\\{sourceWorld:'K${id}'\\}\\)`),`${id} must retain safe public wallet identity`);
}
const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
const walletIdentity=savePublicWalletIdentity({address:'0x1234567890123456789012345678901234567890',chainId:56,sourceWorld:'K12345'},storage);
assert.equal(walletIdentity.address,readPublicWalletIdentity(storage).address);assert.ok(values.has(PUBLIC_WALLET_IDENTITY_KEY));
const session=savePlayerSession({xyz:{x:12.5,y:3,z:-8},intentXYZ:{x:13,y:3.5,z:-8.5}},storage);
assert.deepEqual(readPlayerSession(storage).xyz,session.xyz);assert.ok(values.has(PLAYER_SESSION_KEY));
assert.equal(savePlayerSession({xyz:{x:Infinity,y:0,z:0},intentXYZ:{x:0,y:0,z:0}},storage),null,'invalid XYZ must fail closed');
console.log('11520 standardized product invariants PASS');
