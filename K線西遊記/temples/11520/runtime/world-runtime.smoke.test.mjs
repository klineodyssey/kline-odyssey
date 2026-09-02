import assert from 'node:assert/strict';
import { createWorldState, playerAttack, resolvePlayerMove, tickWorld } from './world-runtime.mjs';

const world = createWorldState();

// Player cannot walk through the 11520 home collider.
const start = { x: -10, y: 0, z: 7 };
const blocked = resolvePlayerMove(start, { x: -7, y: 0, z: 7 });
assert.equal(blocked.blocked, true, 'home collider must block player movement');
assert.equal(blocked.x, start.x, 'blocked movement must keep previous position');

// Out-of-range attacks cannot produce KAIOS.
const miss = playerAttack(world, { x: 0, y: 0, z: 0 }, 9999);
assert.equal(miss.hit, false);
assert.equal(miss.rewardKaios, 0);

// A real kill produces exactly the monster reward once.
const target = world.monsters[0];
const kill = playerAttack(world, { x: target.x, y: 0, z: target.z }, target.maxHp);
assert.equal(kill.hit, true);
assert.equal(kill.defeated, true);
assert.equal(kill.rewardKaios, target.rewardKaios);
assert.equal(target.state, 'DEAD');

// Formal respawn occurs at 8 seconds and restores spawn position/HP.
target.x += 5;
target.z += 5;
const respawnAt = target.defeatedAt + 8000;
const tick = tickWorld(world, { x: 50, y: 0, z: 50 }, respawnAt);
assert.equal(target.state, 'IDLE');
assert.equal(target.hp, target.maxHp);
assert.equal(target.x, target.spawnX);
assert.equal(target.z, target.spawnZ);
assert.ok(tick.events.some(e => e.type === 'RESPAWN' && e.monsterId === target.id));

console.log('11520 world-runtime smoke PASS');
