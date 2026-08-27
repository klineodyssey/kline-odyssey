import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const required = [
  "KAIOS_CREDIT_LEDGER_SCHEMA_V1.json",
  "KAIOS_PAYROLL_EVENT_SCHEMA_V1.json",
  "KAIOS_COLONY_RESOURCE_LEDGER_SCHEMA_V1.json",
  "KAIOS_LIFE_ECONOMIC_CAPABILITY_SCHEMA_V1.json",
  "KAIOS_CURSOR_LIFE_ENERGY_PAYROLL_TASK_ENVELOPE.json"
];

const documents = Object.fromEntries(required.map((name) => [
  name,
  JSON.parse(fs.readFileSync(path.join(here, name), "utf8"))
]));

for (const [name, document] of Object.entries(documents)) {
  assert.ok(document && typeof document === "object", `${name} must parse as an object`);
}

const life = documents["KAIOS_LIFE_ECONOMIC_CAPABILITY_SCHEMA_V1.json"];
assert.ok(life.properties.economic_capability.enum.includes("NO_ACCOUNT"));
assert.equal(life.properties.life_exists.const, true);
assert.equal(life.properties.simulation_only.const, true);

const credit = documents["KAIOS_CREDIT_LEDGER_SCHEMA_V1.json"];
assert.equal(credit.properties.currency.const, "KAIOS_CREDIT");
assert.equal(credit.properties.issuance_enabled.const, false);
assert.equal(credit.properties.entries.items.properties.balanced.const, true);

const payroll = documents["KAIOS_PAYROLL_EVENT_SCHEMA_V1.json"];
assert.equal(payroll.properties.currency.const, "KAIOS_CREDIT");
assert.equal(payroll.properties.reviewer.const, "codex-gm-01");
assert.ok(payroll.required.includes("timestamp"));
assert.ok(payroll.properties.status.enum.includes("PAYROLL_BLOCKED_MISSING_WALLET"));
assert.ok(payroll.properties.status.enum.includes("PAYROLL_BLOCKED_DUPLICATE"));

const colony = documents["KAIOS_COLONY_RESOURCE_LEDGER_SCHEMA_V1.json"];
assert.ok(colony.properties.group_type.enum.includes("ANT_COLONY"));
assert.ok(colony.properties.group_type.enum.includes("BEE_HIVE"));
assert.ok(colony.required.includes("winter_or_emergency_reserve"));
assert.equal(colony.properties.simulation_only.const, true);

const dispatch = documents["KAIOS_CURSOR_LIFE_ENERGY_PAYROLL_TASK_ENVELOPE.json"];
const registry = JSON.parse(fs.readFileSync(path.resolve(here, "../../../KGEN-KAIOS/worker_registry.json"), "utf8"));
const r2Events = registry.claim_events.filter((event) => event.task_id === "KAIOS-CURSOR-LIFE-ENERGY-PAYROLL-R2-001");
assert.equal(dispatch.status, "R2_CLOSED_NO_DELIVERY_WORKER_OFFBOARDED");
assert.equal(dispatch.claim_created, true);
assert.deepEqual(r2Events.map((event) => event.event_type), [
  "CLAIM_REGISTERED",
  "CLAIM_RECONCILIATION",
  "TASK_CLOSED_WORKER_OFFBOARDED"
]);
assert.deepEqual(r2Events.map((event) => event.sequence), [1, 2, 3]);
assert.equal(r2Events[1].new_state, "OPEN");
assert.equal(r2Events[1].task_reassignable, true);
assert.equal(r2Events[2].previous_event_id, r2Events[1].event_id);
assert.equal(r2Events[2].old_state, "OPEN");
assert.equal(r2Events[2].new_state, "CLOSED");
assert.equal(r2Events[2].task_reassignable, false);
assert.equal(dispatch.r2_reconciliation.claim_release_event_id, r2Events[1].event_id);
assert.equal(dispatch.r2_reconciliation.task_close_event_id, r2Events[2].event_id);
assert.equal(dispatch.r2_reconciliation.classification, "EXPIRED_UNDELIVERED_RELEASED_THEN_CLOSED_WORKER_OFFBOARDED");
assert.equal(dispatch.r2_reconciliation.lease_expired, true);
assert.equal(dispatch.r2_reconciliation.delivery_present, false);
assert.equal(dispatch.r2_reconciliation.review_present, false);
assert.equal(dispatch.r2_reconciliation.acceptance_present, false);
assert.equal(dispatch.r2_reconciliation.payroll_state, "NOT_ELIGIBLE_NO_ACCEPTED_DELIVERY");
assert.equal(dispatch.r2_reconciliation.payment_state, "NOT_SENT");
assert.equal(dispatch.r2_reconciliation.claim_active, false);
assert.equal(dispatch.r2_reconciliation.lease_active, false);
assert.equal(dispatch.r2_reconciliation.task_reassignable, false);
assert.equal(dispatch.r2_reconciliation.do_not_wake_cursor, true);
assert.equal(dispatch.r2_reconciliation.trust_changed, true);
assert.equal(dispatch.r2_reconciliation.employment_changed, true);
assert.equal(dispatch.r2_reconciliation.mainnet_write, false);
assert.ok(dispatch.forbidden_work.includes("KGEN"));
assert.ok(dispatch.forbidden_work.includes("real wallet"));

const correctedModel = fs.readFileSync(path.join(here, "KAIOS_LIFE_EXISTENCE_AGENCY_ECONOMY_MODEL_V1.md"), "utf8");
assert.match(correctedModel, /Missing economic capability never invalidates/);
assert.match(correctedModel, /Missing wallet blocks wallet-dependent payment only/);
assert.doesNotMatch(correctedModel, /no wallet means not alive/i);

console.log(JSON.stringify({
  status: "PASS",
  schemas: 4,
  dispatch_envelopes: 1,
  simulation_only: true,
  real_wallet: false,
  real_kgen: false,
  silent_mint: false
}, null, 2));
