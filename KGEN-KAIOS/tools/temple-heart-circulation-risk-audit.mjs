// TempleHeart 12345 circulation risk audit, offchain and read-only.
// Human concept: Wukong should pump AND be replenished; life pulse != paid claim.
// No RPC, wallet, signer, allowance change, gas spending, transfer or chain writes.
function units(x, name) {
  if (typeof x !== 'string' || !/^(0|[1-9][0-9]*)$/.test(x)) {
    throw new TypeError(name + '_WHOLE_KGEN_DECIMAL_STRING_REQUIRED');
  }
  return BigInt(x);
}

export function assessHeartCirculation({
  heartKgenWhole,
  operationalFloorKgenWhole,
  heartbeatRewardKgenWhole,
  brainKgenWhole = '0',
  brainAllowanceKgenWhole = '0',
  liveSourceVerified = false
} = {}) {
  if (typeof liveSourceVerified !== 'boolean') throw new TypeError('SOURCE_VERIFICATION_FLAG_REQUIRED');
  const heart = units(heartKgenWhole, 'HEART');
  const floor = units(operationalFloorKgenWhole, 'FLOOR');
  const reward = units(heartbeatRewardKgenWhole, 'REWARD');
  const brain = units(brainKgenWhole, 'BRAIN');
  const allowance = units(brainAllowanceKgenWhole, 'BRAIN_ALLOWANCE');

  // Legacy V3.2.6 checks only heart balance after independent cooldown.
  // Never claim this result is a complete simulation of live chain eligibility.
  const legacyBalanceCanCoverReward = heart >= reward;
  const proposedPolicyCanPreserveFloor = legacyBalanceCanCoverReward && heart - reward >= floor;
  const floorGap = heart < floor ? floor - heart : 0n;
  const refillSourceCanCover = floorGap > 0n && brain >= floorGap && allowance >= floorGap;
  const possibleUnreservedRewardCapacity =
    heart > floor && reward > 0n ? (heart - floor) / reward : 0n;

  return Object.freeze({
    mode: 'OFFCHAIN_R0_AUDIT_ONLY',
    sourceStatus: liveSourceVerified ? 'EXTERNALLY_VERIFIED_INPUTS' : 'UNVERIFIED_OR_HISTORICAL_INPUTS',
    units: 'WHOLE_KGEN',
    legacyCanCoverHeartbeatRewardWithoutCooldown: legacyBalanceCanCoverReward,
    legacyPayoutFloorEnforced: false,
    proposedFloorPreservingPayoutPossible: proposedPolicyCanPreserveFloor,
    floorGapKgenWhole: floorGap.toString(),
    suggestedReviewReserveTopupKgenWhole: floorGap.toString(),
    proposedUnreservedHeartbeatCount: possibleUnreservedRewardCapacity.toString(),
    brainAndAllowanceAppearAdequateForReview: refillSourceCanCover,
    heartKeepsPulsingWhenClaimBlocked: 'GAME_HEART_SIGNAL_POLICY_REQUIRES_SEPARATE_RUNTIME',
    onchainKgenPayoutExecuted: false,
    onchainKaiosBloodTransferred: false,
    fundingAuthorized: false,
    walletOrPrivateKeyTouched: false,
    recipientAliveOrDeadDetermined: false
  });
}
