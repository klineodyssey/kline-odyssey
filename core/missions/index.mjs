import { requireFields, requireId, requireEnum } from "../shared/schema.mjs";
import { invariant } from "../shared/errors.mjs";

export const MISSION_STATUSES = Object.freeze(["LOCKED", "ACTIVE", "COMPLETED"]);

export function validateMilestone(milestone) {
  requireFields(milestone, ["milestone_id", "description", "status", "requirements", "evidence", "activated_at", "completed_at"], "Milestone");
  requireId(milestone.milestone_id, "milestone_id");
  requireEnum(milestone.status, MISSION_STATUSES, "mission.status");
  return milestone;
}

export class MissionEngine {
  constructor(milestones) {
    milestones.forEach(validateMilestone);
    invariant(milestones.filter((item) => item.status === "ACTIVE").length <= 1, "MULTIPLE_ACTIVE_MISSIONS", "Only one mission milestone may be active");
    this.milestones = structuredClone(milestones);
  }

  complete(milestoneId, evidence, timestamp = new Date().toISOString()) {
    const index = this.milestones.findIndex((item) => item.milestone_id === milestoneId);
    invariant(index >= 0, "MILESTONE_NOT_FOUND", `Milestone not found: ${milestoneId}`);
    invariant(this.milestones[index].status === "ACTIVE", "MISSION_SKIP_FORBIDDEN", "Only the active milestone can be completed");
    invariant(evidence && Object.keys(evidence).length > 0, "MISSION_EVIDENCE_REQUIRED", "Mission completion requires evidence");
    this.milestones[index] = { ...this.milestones[index], status: "COMPLETED", evidence, completed_at: timestamp };
    if (this.milestones[index + 1]) this.milestones[index + 1] = { ...this.milestones[index + 1], status: "ACTIVE", activated_at: timestamp };
    return structuredClone(this.milestones);
  }
}

export async function replayCanonicalMissionProgress({ store, life, milestones, recordedAt, schemaVersion = "2.3.0" }) {
  milestones.forEach(validateMilestone);
  const history = await store.history(life.life_id, "LIFE");
  if (history.some((event) => event.event_type === "MISSION_PROGRESS_RECONCILED" && event.payload?.schema_version === schemaVersion)) return Object.freeze({ status: "IDEMPOTENT_NOOP" });
  const completed = milestones.filter((item) => item.status === "COMPLETED");
  invariant(completed.every((item, index) => milestones[index].milestone_id === item.milestone_id), "MISSION_SKIP_FORBIDDEN", "Completed mission milestones must form an unbroken prefix");
  const event = await store.commit({
    domain: "LIFE",
    stream: "LIFE",
    id: life.life_id,
    entity: life,
    event_type: "MISSION_PROGRESS_RECONCILED",
    actor_id: "MISSION_ENGINE",
    timestamp: recordedAt,
    payload: { schema_version: schemaVersion, completed: completed.map((item) => ({ milestone_id: item.milestone_id, evidence: item.evidence, completed_at: item.completed_at })), active: milestones.find((item) => item.status === "ACTIVE")?.milestone_id ?? null }
  });
  return Object.freeze({ status: "MISSION_PROGRESS_REPLAYED", event });
}
