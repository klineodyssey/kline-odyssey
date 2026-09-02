import test from 'node:test';
import assert from 'node:assert/strict';
import {movementStep,defaultInventory,useInventoryItem,exchangeLocal,previewOrder,executeOrder,closePosition,tradeStats} from '../runtime/game-ui-runtime.mjs';
import {createWorldState,resolvePlayerMove,playerAttack,tickWorld,WORLD_RULES} from '../runtime/world-runtime.mjs';

test('0C still allows ordinary XZ walking',()=>{const s=movementStep({forward:1,turn:0,heading:0,warp:0});assert.ok(s.distance>0);assert.ok(s.dz>0)});
test('joystick horizontal rotates player',()=>{const s=movementStep({forward:0,turn:1,heading:0,warp:0});assert.ok(s.heading>0);assert.equal(s.distance,0)});
test('collision blocks building',()=>{const r=resolvePlayerMove({x:0,y:0,z:0},{x:-7,y:0,z:7});assert.equal(r.blocked,true)});
test('attack only rewards on defeat and respawns after 8s',()=>{const w=createWorldState(0),p={x:6,y:0,z:-8};let r=playerAttack(w,p,24,100);assert.equal(r.rewardKaios,0);while(r.target.state!=='DEAD')r=playerAttack(w,p,48,200);assert.ok(r.rewardKaios>0);const rr=tickWorld(w,p,r.target.defeatedAt+WORLD_RULES.respawnMs);assert.ok(rr.events.some(e=>e.type==='RESPAWN'));assert.equal(w.monsters[0].x,w.monsters[0].spawnX)});
test('consumable item mutates inventory and hp',()=>{const inv=defaultInventory(),r=useInventoryItem(inv,'POTION-001',50);assert.equal(r.ok,true);assert.equal(r.hp,85);assert.equal(inv.find(i=>i.id==='POTION-001').qty,2)});
test('local ATM is explicit state conversion',()=>{const s={kgen:10,kaios:100};assert.equal(exchangeLocal(s,1,10).ok,true);assert.equal(s.kgen,9);assert.equal(s.kaios,110)});
test('order preview -> execute -> close keeps accounting path',()=>{const s={kgen:10,pos:{KX:null,KY:null,KZ:null},history:[]};const p=previewOrder({axis:'KX',symbol:'BTCUSDT',fire:2,leverage:2,price:100,kgen:s.kgen,hasPosition:false});assert.equal(p.ok,true);executeOrder(s,p.order);assert.equal(s.kgen,9);const c=closePosition(s,'KX',103);assert.equal(c.ok,true);assert.equal(c.pnl,6);assert.equal(s.kgen,16);const st=tradeStats(s.history);assert.equal(st.closed,1);assert.equal(st.realizedPnl,6)});
test('cancel invariant: preview alone does not mutate balances/position/history',()=>{const s={kgen:10,pos:{KX:null},history:[]};const snap=structuredClone(s);const p=previewOrder({axis:'KX',symbol:'BTCUSDT',fire:-1,leverage:1,price:100,kgen:10,hasPosition:false});assert.equal(p.ok,true);assert.deepEqual(s,snap)});
