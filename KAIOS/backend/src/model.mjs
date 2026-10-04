import { validatePlayerLifePlayer } from "../../../K線西遊記/temples/11520/runtime/player-life-runtime.mjs";
import {
  fields,
  requireThat,
  integer,
  clone,
  canonical,
  hash,
} from "./primitives.mjs";
export const SCHEMA_VERSION = 1;
export function gamePlayer(input) {
  validatePlayerLifePlayer(input);
  const p = clone(input);
  // Profile PII and local wallet proof never become cloud identity evidence.
  p.displayName = "取經旅人";
  p.pronoun = "";
  p.ageRange = null;
  p.walletLinks = [];
  p.privacyConsent = { location: false, motion: false, analytics: false };
  validatePlayerLifePlayer(p);
  return p;
}
const text = (v) =>
  typeof v === "string" &&
  v.length > 0 &&
  v.length <= 128 &&
  !/[\x00-\x1f<>]/.test(v);
export function receipt(v, owner) {
  fields(v, [
    "receiptId",
    "playerId",
    "type",
    "missionId",
    "requestId",
    "completedAt",
    "scope",
  ]);
  requireThat(
    text(v.receiptId) &&
      v.playerId === owner &&
      [
        "GAME_ACHIEVEMENT",
        "MONSTER_TRAINING",
        "DIGITAL_ANT_DELIVERY",
        "PLAYER_COURIER",
      ].includes(v.type) &&
      integer(v.completedAt, Number.MAX_SAFE_INTEGER) &&
      v.scope === "BACKEND_GAME_ONLY",
    "INVALID_GAME_RECEIPT",
  );
  for (const k of ["missionId", "requestId"])
    if (v[k] !== undefined) requireThat(text(v[k]), "INVALID_REFERENCE");
  return clone(v);
}
export function mission(v, owner) {
  fields(v, [
    "missionId",
    "requestId",
    "playerId",
    "courierLifeId",
    "status",
    "completedAt",
    "receiptId",
    "runtime",
    "cargoGameMetadata",
  ]);
  requireThat(
    v.playerId === owner &&
      text(v.missionId) &&
      text(v.receiptId) &&
      integer(v.completedAt, Number.MAX_SAFE_INTEGER) &&
      ["DELIVERED", "ROBBED", "FAILED"].includes(v.status) &&
      ["DIGITAL_ANT", "PLAYER_COURIER"].includes(v.runtime),
    "INVALID_MISSION_PROJECTION",
  );
  if (v.requestId !== undefined)
    requireThat(text(v.requestId), "INVALID_REQUEST_ID");
  if (v.courierLifeId !== undefined)
    requireThat(text(v.courierLifeId), "INVALID_COURIER_ID");
  if (v.cargoGameMetadata !== undefined) {
    fields(v.cargoGameMetadata, ["kind", "units"]);
    requireThat(
      text(v.cargoGameMetadata.kind) && integer(v.cargoGameMetadata.units),
      "INVALID_CARGO_GAME_METADATA",
    );
  }
  return clone(v);
}
export function validateState(v, owner) {
  fields(v, [
    "schemaVersion",
    "player",
    "monsterHistory",
    "gameReceipts",
    "missions",
  ]);
  requireThat(v.schemaVersion === 1, "MIGRATION_REQUIRED", 422);
  requireThat(v.player?.playerId === owner, "WRONG_PLAYER", 403);
  const player = gamePlayer(v.player);
  const monsterHistory = v.monsterHistory ?? [];
  requireThat(
    Array.isArray(monsterHistory) && monsterHistory.length <= 32,
    "INVALID_TRAINING",
  );
  for (const a of monsterHistory) {
    fields(a, ["id", "growth"]);
    requireThat(text(a.id), "INVALID_ACTOR");
    fields(a.growth, [
      "predictionCount",
      "wins",
      "losses",
      "flat",
      "streak",
      "experience",
      "dimensionUnlocks",
    ]);
    const g = a.growth;
    requireThat(
      Object.values(g).every((n) => integer(n)) &&
        [
          "predictionCount",
          "wins",
          "losses",
          "flat",
          "streak",
          "experience",
          "dimensionUnlocks",
        ].every((k) => integer(g[k])) &&
        g.predictionCount === g.wins + g.losses + g.flat &&
        g.experience === g.wins &&
        g.streak <= g.wins,
      "INVALID_COMPLETED_TRAINING",
    );
  }
  const gameReceipts = v.gameReceipts ?? [],
    missions = v.missions ?? [];
  requireThat(
    Array.isArray(gameReceipts) &&
      gameReceipts.length <= 1000 &&
      Array.isArray(missions) &&
      missions.length <= 1000,
    "PROJECTION_CAPACITY",
  );
  const result = {
    schemaVersion: 1,
    player,
    monsterHistory: clone(monsterHistory),
    gameReceipts: gameReceipts.map((r) => receipt(r, owner)),
    missions: missions.map((m) => mission(m, owner)),
  };
  for (const [list, key] of [
    [result.gameReceipts, "receiptId"],
    [result.missions, "missionId"],
    [result.monsterHistory, "id"],
  ])
    requireThat(
      new Set(list.map((x) => x[key])).size === list.length,
      "DUPLICATE_PROJECTION",
    );
  return result;
}
export const migrations = new Map([
  [
    0,
    (v) => {
      fields(v, [
        "schemaVersion",
        "player",
        "monsterHistory",
        "gameReceipts",
        "missions",
      ]);
      return {
        schemaVersion: 1,
        player: v.player,
        monsterHistory: v.monsterHistory ?? [],
        gameReceipts: v.gameReceipts ?? [],
        missions: v.missions ?? [],
      };
    },
  ],
]);
export function migrate(v, owner) {
  let candidate = clone(v);
  const visited = new Set();
  while (candidate.schemaVersion !== SCHEMA_VERSION) {
    requireThat(
      !visited.has(candidate.schemaVersion) &&
        migrations.has(candidate.schemaVersion),
      "SCHEMA_UNSUPPORTED",
      422,
    );
    visited.add(candidate.schemaVersion);
    candidate = migrations.get(candidate.schemaVersion)(candidate);
  }
  return validateState(candidate, owner);
}
export async function backupPackage(snapshot, payload) {
  return {
    format: "KAIOS_PLAYER_BACKUP",
    manifest: {
      schemaVersion: payload.schemaVersion,
      playerId: snapshot.playerId,
      snapshotId: snapshot.snapshotId,
      createdAt: snapshot.createdAt,
      sourceRevision: snapshot.sourceRevision,
      contentHash: await hash(payload),
    },
    payload,
  };
}
export async function validateImport(pkg, owner) {
  fields(pkg, ["format", "manifest", "payload"]);
  fields(pkg.manifest, [
    "schemaVersion",
    "playerId",
    "snapshotId",
    "createdAt",
    "sourceRevision",
    "contentHash",
  ]);
  requireThat(
    pkg.format === "KAIOS_PLAYER_BACKUP" &&
      pkg.manifest.playerId === owner &&
      pkg.payload?.player?.playerId === owner,
    "WRONG_PLAYER",
    403,
  );
  requireThat(
    integer(pkg.manifest.createdAt, Number.MAX_SAFE_INTEGER) &&
      integer(pkg.manifest.sourceRevision) &&
      typeof pkg.manifest.snapshotId === "string" &&
      /^[0-9a-f]{64}$/.test(pkg.manifest.contentHash),
    "INVALID_MANIFEST",
  );
  requireThat(
    pkg.manifest.schemaVersion === pkg.payload.schemaVersion &&
      pkg.manifest.contentHash === (await hash(pkg.payload)),
    "CORRUPTED",
    422,
  );
  return migrate(pkg.payload, owner);
}
export function chainReceiptProjection(v, { verified = false } = {}) {
  fields(v, [
    "chainId",
    "contract",
    "txHash",
    "blockNumber",
    "logIndex",
    "verifiedAt",
  ]);
  requireThat(verified, "CHAIN_VERIFIER_REQUIRED", 403);
  requireThat(
    integer(v.chainId) &&
      v.chainId > 0 &&
      /^0x[0-9a-fA-F]{40}$/.test(v.contract) &&
      /^0x[0-9a-fA-F]{64}$/.test(v.txHash) &&
      integer(v.blockNumber, Number.MAX_SAFE_INTEGER) &&
      integer(v.logIndex) &&
      integer(v.verifiedAt, Number.MAX_SAFE_INTEGER),
    "INVALID_CHAIN_PROJECTION",
  );
  return {
    ...v,
    authority: "BLOCKCHAIN",
    scope: "INDEX_ONLY_NOT_BALANCE_AUTHORITY",
  };
}
export const retentionPolicy = (snapshots, { keep = 30 } = {}) => ({
  deleteCandidates: snapshots
    .slice(keep)
    .filter((s) => !["pre-restore", "pre-migration"].includes(s.reason))
    .map((s) => s.snapshotId),
  automaticDeletion: false,
});
export const same = (a, b) => canonical(a) === canonical(b);
