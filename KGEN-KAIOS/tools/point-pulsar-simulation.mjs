// KAIOS point Pulsar R0: pure, side-effect-free simulation candidate.
// SOURCE: Human 2026-10-14 Pulsar blood/nutrition decision.
// NOT a TempleHeart wallet client, chain settlement module or identity authority.

const isSafeEpoch = value => Number.isSafeInteger(value) && value >= 0;
function requireEpoch(value, name) {
  if (!isSafeEpoch(value)) throw new RangeError(`${name}_MUST_BE_NONNEGATIVE_SAFE_INTEGER`);
  return value;
}
function requirePositive(value, name) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new RangeError(`${name}_MUST_BE_POSITIVE_SAFE_INTEGER`);
  return value;
}
function requireId(value, name) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_.:-]{1,96}$/.test(value)) {
    throw new TypeError(`${name}_INVALID`);
  }
  return value;
}
function requireWholeWei(value, name) {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) throw new TypeError(`${name}_MUST_BE_DECIMAL_STRING`);
  return BigInt(value);
}

// Explicit time input: no wall-clock, no background scheduler, no consensus time.
// periodSeconds belongs to a specific authorized point; no universal "life Hz".
export function observePointPulse({
  pointId, periodSeconds, phaseSeconds = 0, observedAtSeconds
} = {}) {
  const point = requireId(pointId, 'POINT_ID');
  const period = requirePositive(periodSeconds, 'PERIOD');
  const phase = requireEpoch(phaseSeconds, 'PHASE');
  const now = requireEpoch(observedAtSeconds, 'OBSERVED_AT');
  if (phase >= period) throw new RangeError('PHASE_OUTSIDE_PERIOD');
  const completed = now < phase ? -1 : Math.floor((now - phase) / period);
  const previous = completed < 0 ? null : phase + completed * period;
  const next = completed < 0 ? phase : previous + period;
  if (!Number.isSafeInteger(next) || (previous !== null && !Number.isSafeInteger(previous))) {
    throw new RangeError('PULSE_TIMESTAMP_OUT_OF_RANGE');
  }
  return Object.freeze({
    scope: 'SIMULATION_ONLY', pointId: point, periodSeconds: period,
    phaseSeconds: phase, observedAtSeconds: now, completedCycle: completed,
    previousPulseAtSeconds: previous, nextPulseAtSeconds: next,
    pulseDueAtObservation: previous === now
  });
}

// This makes a virtual accounting proposal ONLY. A separate canonical event
// journal and authorized funded blood ledger would be needed for real settlement.
// KGEN Heartbeat, KAIOS ERC-20, KUFO and KSHIP cannot be moved by this function.
export function previewPulsarNutrition({
  pointId, eventId, availableVirtualKaiosWei, proposedVirtualKaiosWei,
  priorEventIds = [], walletBindingVerified = false, contactChannelVerified = false
} = {}) {
  const point = requireId(pointId, 'POINT_ID');
  const event = requireId(eventId, 'EVENT_ID');
  if (!Array.isArray(priorEventIds) || priorEventIds.some(id => typeof id !== 'string')) {
    throw new TypeError('PRIOR_EVENT_IDS_INVALID');
  }
  if (priorEventIds.includes(event)) throw new Error('PULSAR_EVENT_REPLAY');
  if (typeof walletBindingVerified !== 'boolean' || typeof contactChannelVerified !== 'boolean') {
    throw new TypeError('VERIFICATION_FLAGS_MUST_BE_BOOLEAN');
  }
  if (!walletBindingVerified && !contactChannelVerified) throw new Error('NO_VERIFIED_CONTACT_OR_WALLET');
  const available = requireWholeWei(availableVirtualKaiosWei, 'AVAILABLE_VIRTUAL_KAIOS_WEI');
  const gift = requireWholeWei(proposedVirtualKaiosWei, 'PROPOSED_VIRTUAL_KAIOS_WEI');
  if (gift === 0n) throw new RangeError('ZERO_NUTRITION');
  if (gift > available) throw new RangeError('SIMULATION_BLOOD_RESERVE_INSUFFICIENT');
  return Object.freeze({
    status: 'SIMULATION_PREVIEW_ONLY', pointId: point, eventId: event,
    asset: 'VIRTUAL_KAIOS_BLOOD', recipientChannel: walletBindingVerified ? 'WALLET_VERIFIED_EXTERNALLY' : 'CONTACT_ONLY',
    sourceDeltaWei: (-gift).toString(), recipientDeltaWei: gift.toString(),
    remainingReserveWei: (available - gift).toString(),
    netCreatedWei: '0',
    identityOrLifeIdIssued: false,
    onchainTransferAuthorized: false,
    walletOrSecretAccessed: false,
    receiptFinalized: false
  });
}
