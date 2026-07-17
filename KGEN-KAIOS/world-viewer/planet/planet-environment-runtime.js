import { createNotifier, runtimeError, snapshot } from "../civilization/runtime-utils.js";

const RUNTIME = "PlanetEnvironmentRuntime";
const REQUIRED_FIELDS = Object.freeze([
  "atmosphere",
  "gravity_g",
  "temperature",
  "pressure",
  "water",
  "radiation",
  "magnetic_field",
  "day_length_hours",
  "year_length_days",
  "native_species",
  "food_availability",
  "energy",
  "life_compatibility",
  "resource_rules",
  "civilization_rules",
  "travel_rules"
]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function identifier(value, label) {
  const result = String(value ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9_-]{1,64}$/.test(result)) {
    throw runtimeError(RUNTIME, "INVALID_IDENTIFIER", `${label} is invalid`);
  }
  return result;
}

function validateProfile(profile) {
  if (!isRecord(profile)) throw runtimeError(RUNTIME, "INVALID_PROFILE", "Planet profile must be an object");
  const planetId = identifier(profile.planet_id, "planet_id");
  const missing = REQUIRED_FIELDS.filter((field) => profile[field] === undefined);
  if (missing.length) {
    throw runtimeError(RUNTIME, "INCOMPLETE_PROFILE", `${planetId} is missing ${missing.join(", ")}`);
  }
  if (!isRecord(profile.atmosphere) || !isRecord(profile.life_compatibility)) {
    throw runtimeError(RUNTIME, "INVALID_PROFILE", `${planetId} atmosphere and life compatibility must be objects`);
  }
  if (!Array.isArray(profile.native_species) || !Array.isArray(profile.energy)) {
    throw runtimeError(RUNTIME, "INVALID_PROFILE", `${planetId} native species and energy must be arrays`);
  }
  const gravityUnknown = profile.gravity_g === null && profile.body_type === "UNKNOWN";
  const gravity = Number(profile.gravity_g);
  if (!gravityUnknown && (!Number.isFinite(gravity) || gravity < 0)) {
    throw runtimeError(RUNTIME, "INVALID_PROFILE", `${planetId} gravity must be non-negative`);
  }
  return snapshot({
    ...profile,
    planet_id: planetId,
    synthetic: true,
    authoritative: false,
    profile_scope: "WORLD_VIEWER_PRODUCT_FIXTURE"
  });
}

function compatibilityValue(profile, speciesId) {
  const species = identifier(speciesId, "species_id");
  return String(profile.life_compatibility[species]
    ?? profile.life_compatibility.DEFAULT
    ?? "UNKNOWN").toUpperCase();
}

export function createPlanetEnvironmentRuntime({ world } = {}) {
  const profiles = Array.isArray(world?.planet_profiles) ? world.planet_profiles.map(validateProfile) : [];
  if (!profiles.length) throw runtimeError(RUNTIME, "PROFILE_DATABASE_EMPTY", "Synthetic Planet Profile database is empty");
  const index = new Map();
  for (const profile of profiles) {
    if (index.has(profile.planet_id)) throw runtimeError(RUNTIME, "DUPLICATE_PLANET", `Duplicate planet ${profile.planet_id}`);
    index.set(profile.planet_id, profile);
  }
  let activePlanetId = identifier(world?.genesis?.planet_id ?? "EARTH", "active_planet_id");
  if (!index.has(activePlanetId)) throw runtimeError(RUNTIME, "PLANET_NOT_FOUND", `Unknown active planet ${activePlanetId}`);

  const getSnapshot = () => snapshot({
    runtime: "PLANET_ENVIRONMENT_ALPHA",
    schema_version: "1.0.0",
    synthetic: true,
    source_of_truth: false,
    active_planet_id: activePlanetId,
    active_profile: index.get(activePlanetId),
    profile_count: index.size,
    profile_ids: [...index.keys()]
  });
  const notifier = createNotifier(getSnapshot);

  function getProfile(planetId = activePlanetId) {
    const id = identifier(planetId, "planet_id");
    const profile = index.get(id);
    if (!profile) throw runtimeError(RUNTIME, "PLANET_NOT_FOUND", `Unknown planet ${id}`);
    return profile;
  }

  function evaluateLifeCompatibility({ planetId = activePlanetId, speciesId = "HUMAN", habitat = false } = {}) {
    const profile = getProfile(planetId);
    const species = identifier(speciesId, "species_id");
    const compatibility = compatibilityValue(profile, species);
    const requiresHabitat = ["HABITAT_REQUIRED", "BASE_REQUIRED"].includes(compatibility);
    const compatible = compatibility === "COMPATIBLE" || (requiresHabitat && habitat === true);
    return snapshot({
      planet_id: profile.planet_id,
      species_id: species,
      compatibility,
      habitat_required: requiresHabitat,
      habitat_present: habitat === true,
      compatible,
      oxygen_available: (compatibility === "COMPATIBLE"
        && profile.atmosphere?.oxygen_available === true)
        || (requiresHabitat && habitat === true),
      status: compatible ? "PASS" : compatibility === "UNKNOWN" ? "UNKNOWN" : "FAIL"
    });
  }

  function verifyForBirth(request = {}) {
    const result = evaluateLifeCompatibility(request);
    if (!result.compatible) {
      throw runtimeError(
        RUNTIME,
        result.status === "UNKNOWN" ? "LIFE_COMPATIBILITY_UNKNOWN" : "LIFE_INCOMPATIBLE",
        `${result.species_id} cannot start on ${result.planet_id} without an approved compatible habitat`
      );
    }
    return result;
  }

  function resolveSurvivalRules({ planetId = activePlanetId, lifeMode = "MORTAL", immortalMode = null } = {}) {
    const profile = getProfile(planetId);
    const mode = identifier(lifeMode, "life_mode");
    if (mode === "MORTAL") {
      return snapshot({
        planet_id: profile.planet_id,
        life_mode: mode,
        enabled: true,
        daily_needs: ["WATER", "CALORIES", "OXYGEN", "SLEEP", "HEALTH"]
      });
    }
    if (mode !== "IMMORTAL") {
      throw runtimeError(RUNTIME, "UNKNOWN_LIFE_MODE", `Unknown life mode ${mode}`);
    }
    const requested = identifier(immortalMode, "immortal_mode");
    const approved = Array.isArray(profile.life_rules?.immortal_modes)
      && profile.life_rules.immortal_modes.includes(requested);
    return snapshot({
      planet_id: profile.planet_id,
      life_mode: mode,
      immortal_mode: requested,
      enabled: approved,
      daily_needs: approved ? ["SPIRITUAL_ENERGY", "HEALTH"] : [],
      status: approved ? "PLANET_RULE_ENABLED" : "PLANET_RULE_NOT_DEFINED"
    });
  }

  function setActivePlanet(planetId) {
    const profile = getProfile(planetId);
    activePlanetId = profile.planet_id;
    notifier.emit("ACTIVE_PLANET_CHANGED", { planet_id: activePlanetId });
    return getSnapshot();
  }

  function integrityReport() {
    const issues = [];
    for (const profile of profiles) {
      const missing = REQUIRED_FIELDS.filter((field) => profile[field] === undefined);
      if (missing.length) issues.push(`${profile.planet_id}: missing ${missing.join(", ")}`);
      if (profile.authoritative !== false || profile.synthetic !== true) issues.push(`${profile.planet_id}: source boundary invalid`);
      if (!Array.isArray(profile.life_rules?.immortal_modes)) issues.push(`${profile.planet_id}: immortal mode policy missing`);
    }
    if (!index.has(activePlanetId)) issues.push("active planet is missing");
    return snapshot({
      ok: issues.length === 0,
      runtime: "PLANET_ENVIRONMENT_ALPHA",
      profile_count: profiles.length,
      active_planet_id: activePlanetId,
      canonical_database_modified: false,
      issues
    });
  }

  return Object.freeze({
    getSnapshot,
    getProfile,
    evaluateLifeCompatibility,
    verifyForBirth,
    resolveSurvivalRules,
    setActivePlanet,
    subscribe: notifier.subscribe,
    integrityReport,
    destroy() {
      notifier.clear();
      return true;
    }
  });
}
