import assert from "node:assert/strict";
import test from "node:test";
import { deriveUfoUi, assertActionAllowed } from "../app/ufo-runtime-v1.mjs";

function snapshot(overrides = {}) {
  return {
    shipId: "0xship",
    lifeId: null,
    formalLifeAssigned: false,
    controller: "0xcontroller",
    state: 1,
    heartbeatCount: 3n,
    lastHeartbeatAt: 123n,
    organs: {
      tradingEngine: "0x1",
      whiteHoleMatter: "0x2",
      reactor108000: "0x3",
      kship: "0x4",
      kgod: "0x5",
      atmBank8888: "0x6",
      navigation: "0x7",
    },
    capabilities: { flight: true, cogeneration: true, mobileAtm: true },
    ...overrides,
  };
}

test("UFO app allows flight only when ALIVE and flight capability is verified", () => {
  const ui = deriveUfoUi(snapshot());
  assert.equal(ui.status, "ALIVE");
  assert.equal(ui.canEnterFlight, true);
  assert.equal(assertActionAllowed(ui, "ENTER_FLIGHT"), true);
});

test("UFO app fails closed without controller", () => {
  const ui = deriveUfoUi(snapshot({ controller: null }));
  assert.equal(ui.failClosed, true);
  assert.equal(ui.canEnterFlight, false);
  assert.throws(() => assertActionAllowed(ui, "ENTER_FLIGHT"));
});

test("retired UFO cannot cogenerate or use ATM", () => {
  const ui = deriveUfoUi(snapshot({ state: 4 }));
  assert.equal(ui.status, "RETIRED");
  assert.equal(ui.canCogenerate, false);
  assert.equal(ui.canUseAtm, false);
});

test("formal Life ID is not fabricated when not assigned", () => {
  const ui = deriveUfoUi(snapshot());
  assert.match(ui.identity, /LIFE_NOT_ASSIGNED$/);
});
