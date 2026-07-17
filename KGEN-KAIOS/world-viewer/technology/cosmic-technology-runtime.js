import {
  createNotifier,
  loadEnvelope,
  resolveStorage,
  runtimeError,
  saveEnvelope,
  snapshot
} from "../civilization/runtime-utils.js";
import { createCosmicCoordinateRuntime } from "./cosmic-coordinate-runtime.js";
import { createCosmicEnergyRuntime } from "./energy-runtime.js";
import { createCosmicMaterialRuntime } from "./cosmic-material-runtime.js";
import { createCosmicResearchRuntime } from "./research-runtime.js";
import { createSpaceExplorationRuntime } from "./space-exploration-runtime.js";
import { createSpecialAbilityRuntime } from "./special-ability-runtime.js";
import { createTechnologyTreeRuntime } from "./technology-tree-runtime.js";
import { createCosmicVehicleRuntime } from "./vehicle-runtime.js";

const RUNTIME = "CosmicTechnologyRuntime";

export function createCosmicTechnologyRuntime({
  config,
  civilizationProvider,
  storage,
  storageKey = "kaios.world-viewer.cosmic-technology.v1"
} = {}) {
  if (config?.decision_id !== "HUMAN-SPRINT-010-COSMIC-TECHNOLOGY") throw new TypeError("Cosmic Technology Runtime requires the Sprint 010 fixture");
  if (typeof civilizationProvider !== "function") throw new TypeError("Cosmic Technology Runtime requires a Civilization state provider");
  const storageRef = resolveStorage(storage);
  let destroyed = false;
  let state = { revision: 0, ufo_special_material_package_approved: false };
  const restored = loadEnvelope(storageRef, storageKey, (value) => value?.schema_version === "1.0.0" && value?.state);
  if (restored) state = { ...state, ...restored.state };
  const persist = () => saveEnvelope(storageRef, storageKey, { schema_version: "1.0.0", state });
  const usable = () => {
    if (destroyed) throw runtimeError(RUNTIME, "RUNTIME_DESTROYED", "Cosmic Technology Runtime has been destroyed");
  };

  const materials = createCosmicMaterialRuntime({ config: config.materials, storage, storageKey: `${storageKey}.materials` });
  const energy = createCosmicEnergyRuntime({ config: config.energy, storage, storageKey: `${storageKey}.energy` });
  const technologyIds = config.technology_ages.map(({ technology_id: id }) => id);
  const research = createCosmicResearchRuntime({ config: config.research, technologyIds, storage, storageKey: `${storageKey}.research` });
  const technology = createTechnologyTreeRuntime({
    config: config.technology_ages,
    researchRuntime: research,
    materialRuntime: materials,
    energyRuntime: energy,
    civilizationProvider,
    storage,
    storageKey: `${storageKey}.tree`
  });
  const abilities = createSpecialAbilityRuntime({ config: config.abilities, technologyRuntime: technology, storage, storageKey: `${storageKey}.abilities` });
  const vehicles = createCosmicVehicleRuntime({
    config: config.vehicles,
    technologyRuntime: technology,
    materialRuntime: materials,
    energyRuntime: energy,
    civilizationProvider,
    storage,
    storageKey: `${storageKey}.vehicles`
  });
  const coordinates = createCosmicCoordinateRuntime({ config: config.coordinates, technologyRuntime: technology, storage, storageKey: `${storageKey}.coordinates` });
  const exploration = createSpaceExplorationRuntime({
    config: config.exploration_activities,
    technologyRuntime: technology,
    coordinateRuntime: coordinates,
    vehicleRuntime: vehicles,
    energyRuntime: energy,
    storage,
    storageKey: `${storageKey}.exploration`
  });

  function getUfoGateSnapshot() {
    const requiredTechnologies = config.ufo_v2.required_technologies.map((technologyId) => ({
      technology_id: technologyId,
      ready: technology.isUnlocked(technologyId)
    }));
    const requiredCapabilities = config.ufo_v2.required_capabilities.map((capabilityId) => ({
      capability_id: capabilityId,
      ready: abilities.capabilityReady(capabilityId)
    }));
    return snapshot({
      schema_version: "2.0.0",
      technology_requirements: requiredTechnologies,
      capability_requirements: requiredCapabilities,
      special_material_costs: config.ufo_v2.special_material_costs,
      special_material_ready: state.ufo_special_material_package_approved,
      ready: requiredTechnologies.every(({ ready }) => ready)
        && requiredCapabilities.every(({ ready }) => ready)
        && state.ufo_special_material_package_approved
    });
  }

  const getSnapshot = () => snapshot({
    runtime: "COSMIC_TECHNOLOGY_ALPHA",
    schema_version: "1.0.0",
    decision_id: config.decision_id,
    architecture_first: true,
    product_alpha: true,
    simulation_only: true,
    authoritative_registry: false,
    protected_runtime_modified: false,
    universe_map_current_modified: false,
    technology: technology.getSnapshot(),
    research: research.getSnapshot(),
    materials: materials.getSnapshot(),
    energy: energy.getSnapshot(),
    vehicles: vehicles.getSnapshot(),
    abilities: abilities.getSnapshot(),
    coordinates: coordinates.getSnapshot(),
    exploration: exploration.getSnapshot(),
    ufo_v2_gates: getUfoGateSnapshot(),
    revision: state.revision
  });
  const notifier = createNotifier(getSnapshot);

  function changed(type, details = {}) {
    state.revision += 1;
    persist();
    notifier.emit(type, details);
    return getSnapshot();
  }

  function runResearchCycle(technologyId) {
    usable();
    research.contribute(technologyId, config.research_increment, config.knowledge_increment, config.civilization_experience_increment);
    return changed("COSMIC_RESEARCH_CYCLE_COMPLETED", { technology_id: technologyId });
  }

  function unlockTechnology(technologyId) {
    usable();
    technology.unlock(technologyId);
    return changed("COSMIC_TECHNOLOGY_UNLOCKED", { technology_id: technologyId });
  }

  function surveyMaterial(materialId, quantity = 2) {
    usable();
    materials.survey(materialId, quantity);
    return changed("COSMIC_MATERIAL_SURVEYED", { material_id: materialId, quantity });
  }

  function generateEnergy(energyId, quantity = 4) {
    usable();
    energy.generate(energyId, quantity);
    return changed("COSMIC_ENERGY_GENERATED", { energy_id: energyId, quantity });
  }

  function trainAbility(abilityId, amount = 25) {
    usable();
    abilities.train(abilityId, amount);
    return changed("COSMIC_ABILITY_TRAINED", { ability_id: abilityId, amount });
  }

  function buildVehicle(vehicleId) {
    usable();
    vehicles.build(vehicleId);
    return changed("COSMIC_VEHICLE_BUILT", { vehicle_id: vehicleId });
  }

  function discoverCoordinate(coordinateId) {
    usable();
    coordinates.discover(coordinateId);
    return changed("COSMIC_COORDINATE_DISCOVERED", { coordinate_id: coordinateId });
  }

  function launchExploration(activityId, coordinateId) {
    usable();
    exploration.launch(activityId, coordinateId);
    return changed("COSMIC_EXPLORATION_RECORDED", { activity_id: activityId, coordinate_id: coordinateId });
  }

  function advanceUfoProgram() {
    usable();
    for (const node of config.technology_ages) {
      if (!technology.isUnlocked(node.technology_id)) {
        research.contribute(node.technology_id, config.research_increment, config.knowledge_increment, config.civilization_experience_increment);
      }
    }
    for (const node of config.technology_ages) {
      if (technology.isUnlocked(node.technology_id)) continue;
      try { technology.unlock(node.technology_id); } catch (error) {
        if (error?.code !== "TECHNOLOGY_UNLOCK_BLOCKED") throw error;
      }
    }
    abilities.train("TRANSFORMATIONS_72", 25);
    abilities.train("TIMELINE_NAVIGATION", 25);
    return changed("UFO_V2_RESEARCH_PROGRAM_ADVANCED");
  }

  function approveUfoMaterialPackage() {
    usable();
    if (state.ufo_special_material_package_approved) return getSnapshot();
    materials.consumeBundle(config.ufo_v2.special_material_costs, "POCKET_TIME_CLOAKED_UFO_V2_PACKAGE");
    state.ufo_special_material_package_approved = true;
    return changed("UFO_V2_SPECIAL_MATERIAL_PACKAGE_APPROVED");
  }

  function integrityReport() {
    const reports = {
      technology: technology.integrityReport(),
      research: research.integrityReport(),
      materials: materials.integrityReport(),
      energy: energy.integrityReport(),
      vehicles: vehicles.integrityReport(),
      abilities: abilities.integrityReport(),
      coordinates: coordinates.integrityReport(),
      exploration: exploration.integrityReport()
    };
    const issues = Object.entries(reports).filter(([, report]) => !report.ok).map(([name]) => `${name} integrity failed`);
    if (config.real_nuclear_operation !== false || config.real_antimatter_operation !== false || config.real_navigation !== false || config.real_time_travel !== false) issues.push("Cosmic safety boundary changed");
    return snapshot({ ok: issues.length === 0, runtime: "COSMIC_TECHNOLOGY_ALPHA", issues, reports, ufo_v2_gates: getUfoGateSnapshot() });
  }

  return Object.freeze({
    getSnapshot,
    getUfoGateSnapshot,
    runResearchCycle,
    unlockTechnology,
    surveyMaterial,
    generateEnergy,
    trainAbility,
    buildVehicle,
    discoverCoordinate,
    launchExploration,
    advanceUfoProgram,
    approveUfoMaterialPackage,
    subscribe: notifier.subscribe,
    integrityReport,
    destroy() {
      if (destroyed) return false;
      notifier.clear();
      exploration.destroy();
      coordinates.destroy();
      vehicles.destroy();
      abilities.destroy();
      technology.destroy();
      research.destroy();
      energy.destroy();
      materials.destroy();
      destroyed = true;
      return true;
    }
  });
}
