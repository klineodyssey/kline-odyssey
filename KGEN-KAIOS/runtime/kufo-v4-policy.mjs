export const KAIOS_PER_KGEN = 1000n;
export const KUFO_PER_KAIOS = 1000n;
export const KSHIP_PER_KUFO = 1000n;
export const K280_YEAR_SECONDS = 31_556_926n;

export function alchemyQuote(kaiosWei) {
  if (typeof kaiosWei !== "bigint" || kaiosWei < 1000n || kaiosWei % KAIOS_PER_KGEN !== 0n) {
    throw new RangeError("KAIOS_AMOUNT_MUST_BE_AT_LEAST_1000_WEI_AND_DIVISIBLE_BY_1000");
  }
  return Object.freeze({
    requiredKgenWei: kaiosWei / KAIOS_PER_KGEN,
    kufoWei: kaiosWei * KUFO_PER_KAIOS
  });
}

export function threeAutumnTarget(initialKufoWei, elapsedSeconds) {
  if (typeof initialKufoWei !== "bigint" || initialKufoWei < 0n) throw new TypeError("initialKufoWei");
  if (typeof elapsedSeconds !== "bigint" || elapsedSeconds < 0n) throw new TypeError("elapsedSeconds");
  if (elapsedSeconds < K280_YEAR_SECONDS) return 0n;
  if (elapsedSeconds < 2n * K280_YEAR_SECONDS) return initialKufoWei / 2n;
  if (elapsedSeconds < 3n * K280_YEAR_SECONDS) return initialKufoWei * 3n / 4n;
  return initialKufoWei;
}

export function threeAutumnState(initialKufoWei, alreadyConvertedWei, elapsedSeconds) {
  const target = threeAutumnTarget(initialKufoWei, elapsedSeconds);
  if (alreadyConvertedWei < 0n || alreadyConvertedWei > initialKufoWei) throw new RangeError("CONVERTED_OUT_OF_RANGE");
  const claimableKufoWei = target > alreadyConvertedWei ? target - alreadyConvertedWei : 0n;
  return Object.freeze({
    targetConvertedKufoWei: target,
    claimableKufoWei,
    expectedKshipWei: claimableKufoWei * KSHIP_PER_KUFO,
    remainingKufoWei: initialKufoWei - target,
    terminal: target === initialKufoWei
  });
}


export function splitThreeAutumnLineage(lot, transferredLiveWei) {
  const {
    initialKufoWei,
    alreadyConvertedWei,
    firstAutumnTargetWei,
    secondAutumnTargetWei
  } = lot;
  for (const value of [
    initialKufoWei,
    alreadyConvertedWei,
    firstAutumnTargetWei,
    secondAutumnTargetWei,
    transferredLiveWei
  ]) {
    if (typeof value !== "bigint") throw new TypeError("lineage values must be bigint");
  }
  if (
    initialKufoWei <= 0n ||
    alreadyConvertedWei < 0n ||
    alreadyConvertedWei >= initialKufoWei ||
    firstAutumnTargetWei < 0n ||
    firstAutumnTargetWei > secondAutumnTargetWei ||
    secondAutumnTargetWei > initialKufoWei
  ) {
    throw new RangeError("INVALID_LINEAGE");
  }
  const liveWei = initialKufoWei - alreadyConvertedWei;
  if (transferredLiveWei <= 0n || transferredLiveWei >= liveWei) {
    throw new RangeError("PARTIAL_TRANSFER_REQUIRED");
  }

  const childInitialKufoWei = initialKufoWei * transferredLiveWei / liveWei;
  const childAlreadyConvertedWei = childInitialKufoWei - transferredLiveWei;
  const childFirstAutumnTargetWei =
    firstAutumnTargetWei * childInitialKufoWei / initialKufoWei;
  const childSecondAutumnTargetWei =
    secondAutumnTargetWei * childInitialKufoWei / initialKufoWei;

  return Object.freeze({
    parent: Object.freeze({
      initialKufoWei: initialKufoWei - childInitialKufoWei,
      alreadyConvertedWei: alreadyConvertedWei - childAlreadyConvertedWei,
      firstAutumnTargetWei: firstAutumnTargetWei - childFirstAutumnTargetWei,
      secondAutumnTargetWei: secondAutumnTargetWei - childSecondAutumnTargetWei
    }),
    child: Object.freeze({
      initialKufoWei: childInitialKufoWei,
      alreadyConvertedWei: childAlreadyConvertedWei,
      firstAutumnTargetWei: childFirstAutumnTargetWei,
      secondAutumnTargetWei: childSecondAutumnTargetWei
    })
  });
}
