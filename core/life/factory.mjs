import { invariant } from "../shared/errors.mjs";
import { createLifeRightsManifest } from "../permissions/index.mjs";
import { validateLife } from "./index.mjs";

export const LIFE_FACTORY_STATUSES = Object.freeze(["GENESIS_DRAFT", "GENESIS_PENDING", "ACTIVE"]);

export function buildLifeDraft(input, species) {
  invariant(species, "SPECIES_NOT_FOUND", `Species is required before Life creation: ${input.species_id}`);
  invariant(species.species_id === input.species_id, "SPECIES_MISMATCH", "Life species must resolve to the supplied Species record");
  invariant(input.status === undefined || ["GENESIS_DRAFT", "GENESIS_PENDING"].includes(input.status), "INVALID_DRAFT_STATUS", "Life Factory can only create a draft or pending genesis record");
  invariant(input.birth_timestamp == null, "UNVERIFIED_BIRTH_TIME", "A Life draft cannot invent a birth timestamp");
  invariant(input.wallet_address == null, "RUNTIME_WALLET_ONLY", "Canonical Life drafts cannot persist a wallet binding");

  const life = {
    life_id: input.life_id,
    species_id: input.species_id,
    origin_id: input.origin_id,
    parent_life_ids: input.parent_life_ids ?? [],
    birthplace: input.birthplace ?? null,
    birth_timestamp: null,
    wallet_address: null,
    status: input.status ?? "GENESIS_DRAFT",
    current_job_ids: [],
    company_ids: [],
    skills: input.skills ?? [...species.skill_manifest],
    app_id: input.app_id,
    app_version: input.app_version ?? "0.1.0",
    ideal: input.ideal,
    dream: input.dream,
    ultimate_mission: input.ultimate_mission,
    current_phase: input.current_phase ?? "AWAIT_GENESIS",
    reputation: 0,
    rights_manifest: createLifeRightsManifest(input.rights_manifest ?? {}),
    location_id: input.location_id,
    civilization_id: input.civilization_id,
    created_at: null,
    updated_at: null,
    financial_role: input.financial_role ?? "SELF_GOVERNED"
  };
  return validateLife(life);
}

export async function createLifeDraft({ lifeRegistry, speciesRegistry, input, actorId = "LIFE_FACTORY" }) {
  const species = await speciesRegistry.get(input.species_id);
  return lifeRegistry.register(buildLifeDraft(input, species), actorId);
}

export async function recordLifeGenesis({ lifeRegistry, lifeId, evidence, actorId = "LIFE_FACTORY" }) {
  const life = await lifeRegistry.get(lifeId);
  invariant(life, "LIFE_NOT_FOUND", `Life not found: ${lifeId}`);
  invariant(["GENESIS_DRAFT", "GENESIS_PENDING", "NOT_RECORDED"].includes(life.status), "LIFE_ALREADY_BORN", "Genesis may only be recorded once");
  invariant(evidence?.verified === true, "VERIFIED_GENESIS_REQUIRED", "Life genesis requires verified evidence");
  invariant(typeof evidence.event_id === "string" && evidence.event_id.length > 0, "GENESIS_EVENT_REQUIRED", "Life genesis requires an event ID");
  invariant(!Number.isNaN(Date.parse(evidence.timestamp)), "GENESIS_TIMESTAMP_REQUIRED", "Life genesis requires a verifiable timestamp");
  return lifeRegistry.updateMetadata(lifeId, {
    birth_timestamp: new Date(evidence.timestamp).toISOString(),
    status: "ACTIVE",
    current_phase: evidence.current_phase ?? life.current_phase,
    genesis_evidence_id: evidence.event_id
  }, actorId);
}

export async function assignLifeJob({ lifeRegistry, jobRegistry, lifeId, jobId, evidence, actorId = "LIFE_FACTORY" }) {
  const [life, job] = await Promise.all([lifeRegistry.get(lifeId), jobRegistry.get(jobId)]);
  invariant(life, "LIFE_NOT_FOUND", `Life not found: ${lifeId}`);
  invariant(job, "JOB_NOT_FOUND", `Job not found: ${jobId}`);
  invariant(life.status === "ACTIVE", "LIFE_NOT_ACTIVE", "A draft Life cannot operate a deployed organ");
  invariant(job.status === "ACTIVE", "JOB_NOT_DEPLOYED", "A Life cannot be assigned to an undeployed job");
  invariant(evidence?.verified === true && evidence.event_id, "VERIFIED_ASSIGNMENT_REQUIRED", "Job assignment requires verified evidence");
  const jobIds = [...new Set([...life.current_job_ids, jobId])];
  return lifeRegistry.updateMetadata(lifeId, { current_job_ids: jobIds, job_assignment_evidence_id: evidence.event_id }, actorId);
}
