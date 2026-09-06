export const UFO_LIFE_STATE = Object.freeze({
  0: "DORMANT",
  1: "ALIVE",
  2: "FLIGHT",
  3: "MAINTENANCE",
  4: "RETIRED",
});

export function normalizeUfoSnapshot(raw) {
  if (!raw || !raw.shipId) throw new Error("UFO_SNAPSHOT_REQUIRED");
  const state = UFO_LIFE_STATE[Number(raw.state)] ?? "UNKNOWN";
  return Object.freeze({
    shipId: raw.shipId,
    lifeId: raw.lifeId ?? null,
    formalLifeAssigned: Boolean(raw.formalLifeAssigned),
    controller: raw.controller ?? null,
    state,
    heartbeatCount: BigInt(raw.heartbeatCount ?? 0),
    lastHeartbeatAt: BigInt(raw.lastHeartbeatAt ?? 0),
    organs: Object.freeze({
      tradingEngine: raw.organs?.tradingEngine ?? null,
      whiteHoleMatter: raw.organs?.whiteHoleMatter ?? null,
      reactor108000: raw.organs?.reactor108000 ?? null,
      kship: raw.organs?.kship ?? null,
      kgod: raw.organs?.kgod ?? null,
      atmBank8888: raw.organs?.atmBank8888 ?? null,
      navigation: raw.organs?.navigation ?? null,
    }),
    capabilities: Object.freeze({
      flight: Boolean(raw.capabilities?.flight),
      cogeneration: Boolean(raw.capabilities?.cogeneration),
      mobileAtm: Boolean(raw.capabilities?.mobileAtm),
    }),
  });
}

export function deriveUfoUi(snapshot) {
  const s = normalizeUfoSnapshot(snapshot);
  const controllerBound = Boolean(s.controller);
  const canActivate = controllerBound && (s.state === "DORMANT" || s.state === "MAINTENANCE");
  const canEnterFlight = controllerBound && s.state === "ALIVE" && s.capabilities.flight;
  const canLand = controllerBound && s.state === "FLIGHT";
  const canCogenerate = controllerBound && s.state !== "DORMANT" && s.state !== "RETIRED" && s.capabilities.cogeneration;
  const canUseAtm = controllerBound && s.state !== "RETIRED" && s.capabilities.mobileAtm;

  return Object.freeze({
    identity: `${s.shipId}${s.formalLifeAssigned && s.lifeId ? ` / ${s.lifeId}` : " / LIFE_NOT_ASSIGNED"}`,
    status: s.state,
    canActivate,
    canEnterFlight,
    canLand,
    canCogenerate,
    canUseAtm,
    failClosed: !controllerBound,
  });
}

export function assertActionAllowed(ui, action) {
  const map = {
    ACTIVATE: ui.canActivate,
    ENTER_FLIGHT: ui.canEnterFlight,
    LAND: ui.canLand,
    COGENERATE: ui.canCogenerate,
    MOBILE_ATM: ui.canUseAtm,
  };
  if (!(action in map)) throw new Error("UNKNOWN_UFO_ACTION");
  if (!map[action]) throw new Error(`UFO_ACTION_BLOCKED:${action}`);
  return true;
}
