import test from 'node:test';
import assert from 'node:assert/strict';
import {movementStep,defaultInventory,useInventoryItem,exchangeLocal,previewOrder,executeOrder,closePosition,tradeStats} from '../runtime/game-ui-runtime.mjs';
import {createWorldState,resolvePlayerMove,playerAttack,tickWorld} from '../runtime/world-runtime.mjs';
import {createMarketLife,decideMarketLifeLifestyle,applyLifestyleEconomy,travelMarketLife} from '../runtime/market-life-runtime.mjs';
import {createDigitalAnt,createDeliveryMission,buildAtmRegistry,quoteDeliveryEconomics,cfoEvaluateDelivery,chooseBestDelivery,assignDelivery,loadCargo,tickDigitalAntDelivery,verifyDeliveryReceipt} from '../runtime/digital-ant-logistics-runtime.mjs';
import {publishMarketLifeSourceEvent} from '../runtime/market-life-source-runtime.mjs';

test('0C still allows ordinary XZ walking',()=>{const s=movementStep({forward:1,turn:0,heading:0,warp:0});assert.ok(s.distance>0);assert.ok(s.dz>0)});
test('joystick horizontal rotates player',()=>{const s=movementStep({forward:0,turn:1,heading:0,warp:0});assert.ok(s.heading>0);assert.equal(s.distance,0)});
test('collision blocks building',()=>{const r=resolvePlayerMove({x:0,y:0,z:0},{x:-7,y:0,z:7});assert.equal(r.blocked,true)});

test('baseline chicken and duck may exist without market dimensions',()=>{
  for(const species of ['CHICKEN','DUCK']){
    const life=createMarketLife({lifeId:`LIFE-QA-${species}-001`,species,markets:[],capital:0,vitality:100});
    assert.deepEqual(life.marketDimensions,[]);
    assert.equal(life.strategy,'WILD_ECOLOGY');
    assert.equal(life.state,'ALIVE');
  }
});

test('source-driven Market Life spawns, requires settlement, and despawns',()=>{
  const w=createWorldState(0),p={x:2,y:0,z:2};
  assert.equal(w.monsters.some(m=>m.sourceManaged),false,'inactive source slots must not appear as living monsters');
  publishMarketLifeSourceEvent({type:'SPAWN',sourceId:'QA-DIGITAL-ANT',lifeId:'LIFE-QA-DIGITAL-ANT-001',name:'QA Digital Ant',species:'DIGITAL_ANT',intelligence:3,markets:['BTCUSDT'],capital:20,vitality:100,maxHp:100,positions:{KX:{market:'BTCUSDT',side:1,lots:1,c:.001}},x:2,y:0,z:2},{persistLocal:false,broadcast:false});
  tickWorld(w,p,100);
  const life=w.monsters.find(m=>m.sourceManaged&&m.lifeId==='LIFE-QA-DIGITAL-ANT-001');
  assert.ok(life,'source event must activate a world slot');
  const r=playerAttack(w,p,24,101);
  assert.equal(r.reason,'SOURCE_SETTLEMENT_REQUIRED');
  assert.equal(r.rewardKaios,0);
  publishMarketLifeSourceEvent({type:'DESPAWN',sourceId:'QA-DIGITAL-ANT',lifeId:'LIFE-QA-DIGITAL-ANT-001',reason:'QA_DONE'},{persistLocal:false,broadcast:false});
  tickWorld(w,p,102);
  assert.equal(w.monsters.some(m=>m.sourceManaged&&m.lifeId==='LIFE-QA-DIGITAL-ANT-001'),false);
});

test('Digital Ant CFO can reject loss-making freight and choose positive EV delivery',()=>{
  const ant=createDigitalAnt({capital:20,cargoCapacity:100});
  const atms=buildAtmRegistry([{id:'ATM-A',type:'ATM',x:3,y:4,z:0},{id:'ATM-B',type:'ATM',x:1,y:1,z:1}]);
  const loss=createDeliveryMission({missionId:'LOSS',amount:10,destinationAtmId:'ATM-A',freightOffer:1,demand:1,fuelPerMeter:1,speedMetersPerSecond:1});
  const good=createDeliveryMission({missionId:'GOOD',amount:10,destinationAtmId:'ATM-B',freightOffer:10,demand:1,fuelPerMeter:.1,speedMetersPerSecond:1});
  assert.equal(cfoEvaluateDelivery(ant,loss,atms[0]).action,'REQUOTE');
  const chosen=chooseBestDelivery(ant,[loss,good],atms);
  assert.equal(chosen.action,'ACCEPT');
  assert.equal(chosen.mission.missionId,'GOOD');
});

test('OBSERVE delivery earns no market tip while favorable LONG can earn one',()=>{
  const ant=createDigitalAnt({capital:20});
  const atm={atmId:'ATM-Q',x:3,y:4,z:0,online:true};
  const observe=createDeliveryMission({amount:10,destinationAtmId:'ATM-Q',mode:'OBSERVE',freightOffer:5,marketEdge:2,tipRate:.5,demand:1});
  const long=createDeliveryMission({amount:10,destinationAtmId:'ATM-Q',mode:'LONG',freightOffer:5,marketEdge:2,tipRate:.5,demand:1});
  assert.equal(quoteDeliveryEconomics(ant,observe,atm).tip,0);
  assert.ok(quoteDeliveryEconomics(ant,long,atm).tip>0);
});

test('Digital Ant travels full XYZ and requires verified receipt before delivery settlement',()=>{
  const ant=createDigitalAnt({capital:20,cargoCapacity:100});
  const atms=buildAtmRegistry([{id:'ATM-XYZ',type:'ATM',x:1,y:1,z:1}]);
  const mission=createDeliveryMission({missionId:'XYZ',amount:10,destinationAtmId:'ATM-XYZ',freightOffer:10,demand:1,speedMetersPerSecond:1});
  assert.equal(assignDelivery(ant,mission,atms).ok,true);
  assert.equal(loadCargo(ant).ok,true);
  let result;
  for(let i=0;i<20;i++){result=tickDigitalAntDelivery(ant,{deltaMs:100,speed:.02});if(result.arrived)break;}
  assert.equal(result.arrived,true);
  assert.ok(ant.y>0,'Y must move during XYZ delivery');
  assert.equal(ant.mission.status,'ARRIVED_AWAITING_RECEIPT');
  assert.equal(verifyDeliveryReceipt(ant,{receiptId:null,verified:false}).ok,false);
  const settled=verifyDeliveryReceipt(ant,{receiptId:'QA-RECEIPT-001',verified:true});
  assert.equal(settled.ok,true);
  assert.equal(ant.mission.status,'DELIVERED');
  assert.ok(ant.retirementReserve>=0);
});

test('Market Life may work, travel, rest, or retire instead of being forced into combat',()=>{
  const worker=createMarketLife({lifeId:'LIFE-QA-WORKER',markets:['BTCUSDT'],capital:20,retirementReserve:0,targetRetirementReserve:100,preferences:{work:1,travel:0,comfort:.5}});
  const work=decideMarketLifeLifestyle(worker,{jobs:[{id:'JOB-1',expectedNet:5}],random:()=>0});
  assert.equal(work.action,'WORK');
  const econ=applyLifestyleEconomy(worker,{income:10,expenses:2,retirementRate:.25});
  assert.equal(econ.net,8);
  assert.equal(econ.contribution,2);

  const traveler=createMarketLife({lifeId:'LIFE-QA-TRAVEL',markets:['BTCUSDT'],preferences:{work:0,travel:1,comfort:.2},needs:{hunger:.1,fatigue:.1,social:.1,curiosity:.9}});
  const travel=decideMarketLifeLifestyle(traveler,{destinations:[{id:'SCENIC-1',x:2,y:3,z:4}],random:()=>0});
  assert.equal(travel.action,'EXPLORE');
  const moved=travelMarketLife(traveler,{deltaMs:100,speed:.01});
  assert.equal(moved.ok,true);
  assert.ok(moved.position.y>0);

  const retiree=createMarketLife({lifeId:'LIFE-QA-RETIRE',markets:['BTCUSDT'],retirementReserve:120,targetRetirementReserve:100,preferences:{work:.2,travel:.5,comfort:.8}});
  assert.equal(decideMarketLifeLifestyle(retiree,{random:()=>.5}).action,'RETIRE');
});

test('consumable item mutates inventory and hp',()=>{const inv=defaultInventory(),r=useInventoryItem(inv,'POTION-001',50);assert.equal(r.ok,true);assert.equal(r.hp,85);assert.equal(inv.find(i=>i.id==='POTION-001').qty,2)});
test('local ATM is explicit state conversion',()=>{const s={kgen:10,kaios:100};assert.equal(exchangeLocal(s,1,10).ok,true);assert.equal(s.kgen,9);assert.equal(s.kaios,110)});
test('order preview -> execute -> close keeps accounting path',()=>{const s={kgen:10,pos:{KX:null,KY:null,KZ:null},history:[]};const p=previewOrder({axis:'KX',symbol:'BTCUSDT',fire:2,leverage:2,price:100,kgen:s.kgen,hasPosition:false});assert.equal(p.ok,true);executeOrder(s,p.order);assert.equal(s.kgen,9);const c=closePosition(s,'KX',103);assert.equal(c.ok,true);assert.equal(c.pnl,6);assert.equal(s.kgen,16);const st=tradeStats(s.history);assert.equal(st.closed,1);assert.equal(st.realizedPnl,6)});
test('cancel invariant: preview alone does not mutate balances/position/history',()=>{const s={kgen:10,pos:{KX:null},history:[]};const snap=structuredClone(s);const p=previewOrder({axis:'KX',symbol:'BTCUSDT',fire:-1,leverage:1,price:100,kgen:10,hasPosition:false});assert.equal(p.ok,true);assert.deepEqual(s,snap)});
