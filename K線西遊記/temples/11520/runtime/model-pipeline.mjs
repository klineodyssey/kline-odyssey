/*
KGEN_META
VERSION: 1.0.0
REVISION: 2026-09-03.1
STATUS: ACTIVE
LAST_UPDATED: 2026-09-03
UPDATED_BY: GPT-5.6 Sol
TASK_ID: K11520-WORLD-MODEL-PIPELINE-20260903
CHANGE_REASON: Define one manifest-driven 3D asset pipeline for XYZ world actors and structures, with explicit primitive fallbacks until reviewed GLB assets are installed.
ANCESTOR: runtime/world-runtime.mjs + game-5d.html
SOURCE_OF_TRUTH: TRUE
*/

export const MODEL_MANIFEST = Object.freeze({
  HERO: Object.freeze({ kind: 'hero', url: null, fallback: 'HERO' }),
  STONE_APE: Object.freeze({ kind: 'monster', url: null, fallback: 'STONE_APE' }),
  FIRE_WISP: Object.freeze({ kind: 'monster', url: null, fallback: 'FIRE_WISP' }),
  BUILDING: Object.freeze({ kind: 'world-object', url: null, fallback: 'BUILDING' }),
  ATM: Object.freeze({ kind: 'world-object', url: null, fallback: 'ATM' }),
});

export function modelKeyForWorldObject(object) {
  return object?.type === 'ATM' ? 'ATM' : 'BUILDING';
}

export function modelKeyForMonster(monster) {
  return monster?.species === 'FIRE_WISP' ? 'FIRE_WISP' : 'STONE_APE';
}

export async function resolveModelAsset(key, { loadGltf } = {}) {
  const spec = MODEL_MANIFEST[key];
  if (!spec) throw new Error(`UNKNOWN_MODEL_KEY:${key}`);
  if (spec.url && typeof loadGltf === 'function') {
    try {
      const model = await loadGltf(spec.url);
      return { key, source: 'GLTF', model, spec };
    } catch (error) {
      return { key, source: 'FALLBACK', model: null, spec, error };
    }
  }
  return { key, source: 'FALLBACK', model: null, spec };
}
