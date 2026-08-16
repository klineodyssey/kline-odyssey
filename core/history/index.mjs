import { clone, makeId, nowIso, sha256 } from "../shared/utils.mjs";
import { invariant } from "../shared/errors.mjs";

export const HISTORY_STREAMS = Object.freeze(["LIFE", "MARKET", "COMPANY", "ASSET", "APP", "SPECIES", "JOB", "SERVICE", "SPACECRAFT"]);

export async function createHistoryEvent(input, previousEventId = null) {
  invariant(HISTORY_STREAMS.includes(input.stream), "INVALID_HISTORY_STREAM", `Unsupported history stream: ${input.stream}`);
  const payload = clone(input.payload ?? {});
  return Object.freeze({
    event_id: input.event_id ?? makeId("EVT"),
    event_type: input.event_type,
    subject_id: input.subject_id,
    actor_id: input.actor_id,
    timestamp: input.timestamp ?? nowIso(),
    payload_hash: await sha256(payload),
    tx_hash: input.tx_hash ?? null,
    previous_event_id: previousEventId,
    stream: input.stream,
    payload
  });
}

export function assertAppendOnlyChain(events) {
  for (let i = 0; i < events.length; i += 1) {
    invariant(events[i].previous_event_id === (events[i - 1]?.event_id ?? null), "BROKEN_EVENT_CHAIN", `Broken history chain for ${events[i].subject_id}`);
  }
  return true;
}
