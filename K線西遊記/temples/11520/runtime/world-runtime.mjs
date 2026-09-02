/*
KGEN_META
VERSION: 1.1.0
REVISION: 2026-09-03.2
STATUS: ACTIVE
LAST_UPDATED: 2026-09-03
UPDATED_BY: 界曜 / GPT-5.6 Sol
REVIEWED_BY: Human construction instruction
SOURCE_COMMIT: PENDING_THIS_CHANGESET
TASK_ID: K11520-P0A-GAMEPLAY-RUNTIME-INTEGRATION-20260903
CHANGE_REASON: Harden the existing formal XYZ gameplay runtime for direct game-5d integration: stable monster Life IDs, deterministic spawn origins, hit/death/reward state, aggro/chase/attack events and origin-preserving respawn. No duplicate gameplay runtime is created.
ANCESTOR: GAME_UI_SPEC.md + JIEYAO_HANDOFF_CURRENT.md + world-runtime.mjs@1042fd3e
SOURCE_OF_TRUTH: TRUE
*/

export const WORLD_RULES = Object.freeze({
  placeId: '11520',
  settlement: 'KAIOS',
  worldBounds: Object.freeze({ minX: -60, maxX: 60, minZ: -60, maxZ: 60, minY: 0, maxY: 40 }),
  playerRadius: 0.45,
  meleeRange: 2.2,
  monsterAggroRange: 8,
  monsterAttackRange: 1.55,
  monsterAttackCooldownMs: 1200,
  respawnMs: 8000,
});

export const WORLD_OBJECTS = Object.freeze([
  { id: 'HOME-11520-001', type: 'BUILDING', name: '花果山民宅', x: -7, z: 7, radius: 2.2, lifeId: 'LIFE-BUILDING-11520-HOME-001' },
  { id: 'ATM-11520-001', type: 'ATM', name: '行動 ATM 飛碟站', x: 8, z: 5, radius: 1.4, lifeId: 'LIFE-ATM-11520-001' },
  { id: 'SHOP-11520-001', type: 'BUILDING', name: '花果山市集', x: 13, z: -10, radius: 2.8, lifeId: 'LIFE-BUILDING-11520-SHOP-001' },
]);

export const MONSTER_TEMPLATES = Object.freeze({
  STONE_APE: Object.freeze({ species: 'STONE_APE', name: '暗影猿', maxHp: 120, attack: 6, rewardKaios: 12, speed: 0.018 }),
  FIRE_WISP: Object.freeze({ species: 'FIRE_WISP', name: '火靈', maxHp: 85, attack: 4, rewardKaios: 9, speed: 0.024 }),
});

export function createWorldState(now = Date.now()) {
  return {
    monsters: [
      spawnMonster('MON-11520-001', 'LIFE-MONSTER-11520-001', 'STONE_APE', 6, -8),
      spawnMonster('MON-11520-002', 'LIFE-MONSTER-11520-002', 'FIRE_WISP', -13, -5),
      spawnMonster('MON-11520-003', 'LIFE-MONSTER-11520-003', 'STONE_APE', 18, 12),
    ],
    lastTick: now,
  };
}

function spawnMonster(id, lifeId, templateKey, x, z) {
  const t = MONSTER_TEMPLATES[templateKey];
  return {
    id,
    lifeId,
    ...t,
    spawnX: x,
    spawnZ: z,
    x,
    y: 0,
    z,
    hp: t.maxHp,
    state: 'IDLE',
    lastAttackAt: 0,
    defeatedAt: null,
  };
}

export function distance2D(a, b) {
  return Math.hypot((a.x || 0) - (b.x || 0), (a.z || 0) - (b.z || 0));
}

export function resolvePlayerMove(player, next) {
  const bounded = {
    x: Math.max(WORLD_RULES.worldBounds.minX, Math.min(WORLD_RULES.worldBounds.maxX, Number(next.x) || 0)),
    y: Math.max(WORLD_RULES.worldBounds.minY, Math.min(WORLD_RULES.worldBounds.maxY, Number(next.y) || 0)),
    z: Math.max(WORLD_RULES.worldBounds.minZ, Math.min(WORLD_RULES.worldBounds.maxZ, Number(next.z) || 0)),
  };
  const blocker = WORLD_OBJECTS.find(o => distance2D(bounded, o) < o.radius + WORLD_RULES.playerRadius) || null;
  return blocker
    ? { x: player.x, y: player.y, z: player.z, blocked: true, blocker }
    : { ...bounded, blocked: false, blocker: null };
}

export function playerAttack(world, player, damage = 24, now = Date.now()) {
  const alive = world.monsters.filter(m => m.state !== 'DEAD');
  const target = alive.sort((a, b) => distance2D(player, a) - distance2D(player, b))[0] || null;
  const distance = target ? distance2D(player, target) : Infinity;
  if (!target || distance > WORLD_RULES.meleeRange) {
    return { world, hit: false, defeated: false, reason: 'OUT_OF_RANGE', rewardKaios: 0, target, distance };
  }

  target.hp = Math.max(0, target.hp - Math.max(0, Number(damage) || 0));
  target.state = target.hp === 0 ? 'DEAD' : 'AGGRO';
  if (target.hp === 0) {
    target.defeatedAt = now;
    return { world, hit: true, defeated: true, target, distance, rewardKaios: target.rewardKaios };
  }
  return { world, hit: true, defeated: false, target, distance, rewardKaios: 0 };
}

export function tickWorld(world, player, now = Date.now()) {
  const delta = Math.min(100, Math.max(0, now - (world.lastTick || now)));
  const events = [];

  for (const m of world.monsters) {
    if (m.state === 'DEAD') {
      if (m.defeatedAt !== null && now - m.defeatedAt >= WORLD_RULES.respawnMs) {
        m.x = m.spawnX;
        m.z = m.spawnZ;
        m.hp = m.maxHp;
        m.state = 'IDLE';
        m.lastAttackAt = 0;
        m.defeatedAt = null;
        events.push({ type: 'RESPAWN', monsterId: m.id, lifeId: m.lifeId });
      }
      continue;
    }

    let dist = distance2D(player, m);
    m.state = dist <= WORLD_RULES.monsterAggroRange ? 'AGGRO' : 'IDLE';

    if (m.state === 'AGGRO' && dist > WORLD_RULES.monsterAttackRange) {
      const dx = player.x - m.x;
      const dz = player.z - m.z;
      const len = Math.hypot(dx, dz) || 1;
      const step = Math.min(Math.max(0, dist - WORLD_RULES.monsterAttackRange), m.speed * delta);
      m.x += dx / len * step;
      m.z += dz / len * step;
      dist = distance2D(player, m);
    }

    if (dist <= WORLD_RULES.monsterAttackRange && now - m.lastAttackAt >= WORLD_RULES.monsterAttackCooldownMs) {
      m.lastAttackAt = now;
      events.push({ type: 'PLAYER_HIT', monsterId: m.id, lifeId: m.lifeId, damage: m.attack, distance: dist });
    }
  }

  world.lastTick = now;
  return { world, events };
}

export function serializeWorld(world) {
  return JSON.parse(JSON.stringify(world));
}
