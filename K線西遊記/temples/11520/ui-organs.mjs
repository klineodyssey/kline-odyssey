/*
KGEN_META
VERSION: 1.0.0
REVISION: 2026-09-03.1
STATUS: ACTIVE
LAST_UPDATED: 2026-09-03
UPDATED_BY: GPT-5.6 Sol
REVIEWED_BY: Human instruction approved for construction
SOURCE_COMMIT: PENDING_THIS_CHANGESET
TASK_ID: K11520-GAME-UI-CONSTRUCTION-20260903
CHANGE_REASON: Establish one stable runtime registry for all persistent 11520 UI/game organs so features cannot silently disappear during later UI work.
ANCESTOR: GAME_UI_SPEC.md
SOURCE_OF_TRUTH: TRUE
*/

export const K11520_ORGANS = Object.freeze([
  ['world','主城世界 5D','WORLD','XYZ/KAIOS'],
  ['trade','交易面板 K 場','EXCHANGE','KX/KY/KZ/KGEN'],
  ['positions','持倉部位','EXCHANGE','KGEN'],
  ['orders','委託掛單','EXCHANGE','KGEN'],
  ['history','歷史成交','EXCHANGE','KGEN'],
  ['assets','資產總覽','ACCOUNT','KGEN/KAIOS/KUFO'],
  ['records','交易紀錄','ANALYTICS','KGEN'],
  ['markets','市場資訊','MARKET_DATA','KX/KY/KZ'],
  ['inventory','背包','LIFE','XYZ/KAIOS'],
  ['character','角色狀態','LIFE','XYZ/KAIOS'],
  ['worldMap','世界地圖','WORLD','XYZ'],
  ['settings','系統設定','SYSTEM','LOCAL'],
  ['help','幫助 / AI','CONCIERGE','CONTEXT'],
  ['atm','ATM','SERVICE','KGEN/KAIOS'],
  ['address','地址 / GPS','REAL_WORLD_ANCHOR','GPS'],
]);

export const ORGAN_BY_ID = Object.freeze(Object.fromEntries(
  K11520_ORGANS.map(([id,label,domain,economy]) => [id, Object.freeze({id,label,domain,economy})])
));

export function validateOrganRegistry(registry = K11520_ORGANS) {
  const ids = new Set();
  const errors = [];
  for (const row of registry) {
    if (!Array.isArray(row) || row.length !== 4) { errors.push('BAD_ROW'); continue; }
    const [id,label,domain,economy] = row;
    if (!id || !label || !domain || !economy) errors.push(`MISSING_FIELD:${id || 'UNKNOWN'}`);
    if (ids.has(id)) errors.push(`DUPLICATE_ID:${id}`);
    ids.add(id);
  }
  return {ok: errors.length === 0, errors, count: ids.size};
}

export function requireOrgan(id) {
  const organ = ORGAN_BY_ID[id];
  if (!organ) throw new Error(`UNKNOWN_11520_ORGAN:${id}`);
  return organ;
}

export const ECONOMY_BOUNDARY = Object.freeze({
  K_WORLD: Object.freeze({axes:['KX','KY','KZ'], settlement:'KGEN'}),
  XYZ_WORLD: Object.freeze({axes:['X','Y','Z'], settlement:'KAIOS'}),
});

export const CONTROL_CONTRACT = Object.freeze({
  XZ: 'GROUND_MOVEMENT',
  Y: 'HEIGHT_VELOCITY_SPRING_RETURN',
  C: 'SPATIAL_WARP_0_TO_1000C_ZERO_IS_STOP',
  FIREPOWER: 'SIGNED_LOTS_CENTER_0_UP_LONG_DOWN_SHORT',
  L: 'TRADING_LEVERAGE_NOT_SPATIAL_WARP',
  ORDER_SUBMIT: 'PREVIEW_CONFIRM_OR_CANCEL_THEN_SUBMIT',
});

export function assertEconomySeparation({axis, settlement}) {
  const k = ECONOMY_BOUNDARY.K_WORLD.axes.includes(axis);
  const xyz = ECONOMY_BOUNDARY.XYZ_WORLD.axes.includes(axis);
  if (k && settlement !== 'KGEN') throw new Error(`K_WORLD_REQUIRES_KGEN:${axis}`);
  if (xyz && settlement !== 'KAIOS') throw new Error(`XYZ_WORLD_REQUIRES_KAIOS:${axis}`);
  if (!k && !xyz) throw new Error(`UNKNOWN_AXIS:${axis}`);
  return true;
}
