/* KGEN 12345 Civilization Brain Rollcall
 * Version: V10.49.1_CIVILIZATION_BRAIN_CODE_SYNC
 * Purpose: shared source-of-truth registry for AI and runtime organs.
 */
(function(global){
  "use strict";
  const brain = {
    version: "V10.49.1_CIVILIZATION_BRAIN_CODE_SYNC",
    sourceOfTruth: {
      boot: "/PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_2.md",
      sop: "/SOP/PRIMEFORGE_GENESIS_RUNTIME_SOP_V1_0.md",
      physics: "/docs/physics/KGEN_Universe_Physics_Runtime_V1_6.md",
      universeMap: "/docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json",
      neuralMap: "/neural/NEURAL_MAP.json",
      civilizationGraph: "/neural/CIVILIZATION_GRAPH.json"
    },
    rules: {
      templeLocalPhysicsCopy: false,
      templeLocalUniverseMapCopy: false,
      duplicatePolicy: "ARCHIVE_ONLY",
      beforeEdit: "ROLLCALL_REQUIRED"
    }
  };
  global.KGEN_12345_CIVILIZATION_BRAIN_ROLLCALL = brain;
})(typeof window !== "undefined" ? window : globalThis);
