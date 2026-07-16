import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

import { createBuildingRuntime } from "../building/building-runtime.js";
import { validateWorldFixture } from "../data/world-store.js";
import { createLandRuntime } from "../land/land-runtime.js";
import { createLifeRuntime } from "../life/life-runtime.js";
import { createPlayerController } from "../player/player-controller.js";
import { createRoomRuntime } from "../room/room-runtime.js";

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(String(key), String(value));
  }

  removeItem(key) {
    this.values.delete(String(key));
  }
}

const fixtureUrl = new URL("../data/synthetic-world.json", import.meta.url);
const world = validateWorldFixture(JSON.parse(await readFile(fixtureUrl, "utf8")));
const canonicalBefore = JSON.stringify(world);
const storage = new MemoryStorage();
let clock = Date.parse("2026-07-17T01:00:00Z");
const now = () => new Date(clock += 1_000);

const land = createLandRuntime({ world, storage, storageKey: "sprint-003-test", now });
const initialParcel = land.getParcelSnapshot("parcel-001");
assert.equal(initialParcel.canonical_parcel_version, 2);
assert.equal(initialParcel.revision_history.length, 2);
assert.equal(initialParcel.ownership_timeline.length, 1);
assert.equal(initialParcel.ownership_mutated, false);

const draft = land.setDraft({
  proposal_id: "proposal-runtime-integrity-001",
  parcel_id: "parcel-001",
  requester_id: "mock-player-001",
  requester_role: "OWNER",
  requested_land_use: "FARM",
  reason: "Synthetic integrity test",
  estimated_cost: 0,
  environment_impact: "REVIEW_REQUIRED",
  neighbor_impact: "REVIEW_REQUIRED",
  required_permissions: ["OWNER"],
  evidence: [],
  review_status: "DRAFT"
});
assert.equal(draft.requested_land_use, "FARM");
assert.equal(draft.local_saved, false);
assert.equal(world.parcels[0].land_use, "RESIDENTIAL");
assert.equal(world.parcels[0].owner_id, "mock-player-001");

const savedDraft = land.saveDraft("parcel-001");
assert.equal(savedDraft.local_saved, true);
assert.equal(savedDraft.registry_persisted, false);
assert.equal(land.getParcelSnapshot("parcel-001").can_undo, true);
land.undo("parcel-001");
assert.equal(land.getActiveDraft("parcel-001").local_saved, false);
land.redo("parcel-001");
assert.equal(land.getActiveDraft("parcel-001").local_saved, true);

const restoredLand = createLandRuntime({ world, storage, storageKey: "sprint-003-test", now });
assert.equal(restoredLand.getActiveDraft("parcel-001").proposal_id, savedDraft.proposal_id);
assert.equal(restoredLand.getParcelSnapshot("parcel-001", "parcel-001-r1").revision_viewer.selected_revision.revision_id, "parcel-001-r1");
assert.equal(restoredLand.getParcelSnapshot("parcel-001").ownership_timeline.length, 1);

const building = createBuildingRuntime({ world });
assert.equal(building.integrityReport().ok, true);
assert.equal(building.listTemplates().length, 8);
assert.equal(building.listByParcel("parcel-001").length, 1);
const home = building.getBuildingSnapshot("building-home-001");
assert.equal(home.templateType, "RESIDENTIAL");
assert.equal(home.health, 94);
assert.equal(home.roomIds.length, 2);

const room = createRoomRuntime({ world, buildingRuntime: building });
assert.equal(room.integrityReport().ok, true);
assert.deepEqual([...room.integrityReport().occupantTypes], ["PLAYER", "AI_WORKER", "NPC", "PET", "PLANT"]);
const livingRoom = room.getRoomSnapshot("room-living-001");
assert.equal(livingRoom.occupancy.occupantCount, 3);
assert.equal(livingRoom.contents.chainStatus, "RESOLVED");
assert.equal(livingRoom.contents.furniture.length, 1);
assert.equal(livingRoom.contents.equipment.length, 1);
assert.equal(livingRoom.contents.organisms.length, 3);

const life = createLifeRuntime({
  world,
  storage,
  storageKey: "sprint-003-life-test",
  now: () => clock
});
assert.equal(life.listSnapshots().length, 6);
const foodBefore = life.getSnapshot("life-player-001").inventory.food_portions;
const waterBefore = life.getSnapshot("life-player-001").inventory.water_units;
assert.equal(life.act("life-player-001", "EAT").inventory.food_portions, foodBefore - 1);
assert.equal(life.act("life-player-001", "DRINK").inventory.water_units, waterBefore - 1);
const worked = life.act("life-player-001", "WORK");
assert.equal(worked.activity_state, "WORKING");
const sleeping = life.act("life-player-001", "SLEEP");
const energyBeforeSleep = sleeping.energy;
const advanced = life.advance({ lifeId: "life-player-001", elapsedMs: 3_600_000 });
assert.equal(advanced.activity_state, "SLEEPING");
assert.ok(advanced.energy > energyBeforeSleep);
assert.equal(life.act("life-player-001", "WAKE").activity_state, "AWAKE");
assert.equal(life.integrityReport().ok, true);

const player = createPlayerController({ world, now: () => clock });
const started = player.startSession(world.player, world.parcels[0]);
assert.equal(started.sessionActive, true);
assert.equal(started.currentEntity.id, "parcel-001");
const moved = player.walkBy(32, -18);
assert.equal(moved.stepCount, 1);
assert.equal(moved.movementState, "WALKING");
assert.ok(moved.position.x >= moved.sceneBounds[0]);
const entered = player.enter(world.buildings[0]);
assert.equal(entered.currentEntity.id, "building-home-001");
assert.equal(player.enter(world.rooms[0]).currentEntity.id, "room-living-001");
assert.equal(player.endSession().sessionActive, false);

assert.equal(JSON.stringify(world), canonicalBefore, "runtimes must not mutate the synthetic canonical fixture");

const report = {
  status: "PASS",
  land: {
    canonical_version: initialParcel.canonical_parcel_version,
    history_events: restoredLand.getParcelSnapshot("parcel-001").proposal_history.length,
    ownership_mutated: false,
    draft_recovered: true
  },
  building: building.integrityReport(),
  room: room.integrityReport(),
  life: life.integrityReport(),
  player: { walking: true, entered_room: true },
  protected_runtime_mutated: false
};
const serializedReport = `${JSON.stringify(report, null, 2)}\n`;
console.log(serializedReport.trimEnd());
const outputFlag = process.argv.indexOf("--output");
if (outputFlag >= 0 && process.argv[outputFlag + 1]) {
  await writeFile(process.argv[outputFlag + 1], serializedReport, "utf8");
}

land.destroy();
restoredLand.destroy();
life.destroy();
player.destroy();
