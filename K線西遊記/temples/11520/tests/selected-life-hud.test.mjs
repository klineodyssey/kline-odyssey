import test from 'node:test';
import assert from 'node:assert/strict';
import {selectedLifeSnapshot,selectedLifeText} from '../runtime/selected-life-hud.mjs';

test('selected life HUD reports canonical identity, HP/MAX HP, XYZ and combat state',()=>{
  const input={lifeId:'LIFE-TEST-001',displayName:'暗影猿',species:'STONE_APE',hp:73,maxHp:120,x:4.5,y:2,z:-8,state:'ATTACK'};
  const snap=selectedLifeSnapshot(input);
  assert.deepEqual(snap,{lifeId:'LIFE-TEST-001',name:'暗影猿',species:'STONE_APE',x:4.5,y:2,z:-8,hp:73,maxHp:120,state:'ATTACK'});
  const text=selectedLifeText(input);
  assert.match(text,/暗影猿 · STONE_APE/);
  assert.match(text,/HP 73 \/ 120/);
  assert.match(text,/XYZ 4.5, 2, -8/);
  assert.match(text,/ATTACK/);
  assert.match(text,/LIFE-TEST-001/);
});

test('selected life HUD clamps negative HP and supplies safe defaults',()=>{
  const snap=selectedLifeSnapshot({lifeId:'LIFE-X',hp:-2,maxHp:0});
  assert.equal(snap.hp,0);assert.equal(snap.maxHp,1);assert.equal(snap.state,'ALIVE');
});
