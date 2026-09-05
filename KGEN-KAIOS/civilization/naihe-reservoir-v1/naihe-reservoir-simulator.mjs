const EXACT_GENESIS_BNB_WEI = 8_000_000_000_000_000n;

function fail(code, message = code) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function requireTrue(value, code) {
  if (!value) fail(code);
}

function amount(value, code = "AMOUNT_INVALID") {
  try {
    const parsed = BigInt(value);
    if (parsed < 0n) fail(code);
    return parsed;
  } catch (error) {
    if (error?.code === code) throw error;
    fail(code);
  }
}

function normalized(value) {
  return String(value ?? "").trim().toLowerCase();
}

function distinct(values, code) {
  const present = values.map(normalized).filter(Boolean);
  requireTrue(new Set(present).size === present.length, code);
}

export function validateRoleSeparation({
  economicSponsor,
  naiheSource,
  reservoir,
  serviceOperator,
  mengpoSoup,
  regenerationParent,
  companyId = null,
  companyMembershipStatus = "NOT_APPLICABLE",
  regenerationParentBasis = "UNASSIGNED_ORPHAN",
  companyParentPolicyId = null
}) {
  distinct([economicSponsor, naiheSource, reservoir, serviceOperator, mengpoSoup], "CIVILIZATION_ROLE_COLLISION");
  const parent = normalized(regenerationParent);
  if (!parent || parent === "unassigned_orphan") {
    requireTrue(regenerationParentBasis === "UNASSIGNED_ORPHAN", "PARENT_POLICY_REQUIRED");
    return true;
  }

  distinct([naiheSource, reservoir, serviceOperator, mengpoSoup, regenerationParent], "PARENT_ROLE_COLLISION");
  void companyId;
  void companyMembershipStatus;
  void companyParentPolicyId;
  fail("PARENT_ASSIGNMENT_AUTHORITY_UNBOUND");
}

export function classifyOperationalState({ bnbBalanceWei, wbnbBalanceWei }) {
  const bnb = amount(bnbBalanceWei);
  const wbnb = amount(wbnbBalanceWei);
  if (wbnb > 0n && bnb === 0n) return "ASSET_PRESENT_BUT_OPERATIONALLY_STARVED";
  return bnb > 0n ? "GAS_AVAILABLE" : "NO_OPERATIONAL_ENERGY";
}

export function validateLifeFluidRegistry(registry) {
  requireTrue(registry?.status === "DESIGN_ONLY_NOT_LIVE", "REGISTRY_STATUS_INVALID");
  requireTrue(registry?.chain_id === 56, "WRONG_CHAIN");
  requireTrue(registry?.reservoir_status === "NOT_DEPLOYED", "RESERVOIR_STATUS_UNEXPECTED");
  requireTrue(registry?.reservoir_address === null, "RESERVOIR_ADDRESS_MUST_BE_NULL");
  requireTrue(registry?.active_pool_count === 0, "ACTIVE_POOL_WITHOUT_RESERVOIR");
  const symbols = new Set();
  for (const asset of registry.assets ?? []) {
    requireTrue(!symbols.has(asset.symbol), "DUPLICATE_ASSET_SYMBOL");
    symbols.add(asset.symbol);
    if (asset.deployment_status.includes("NOT_DEPLOYED") || asset.deployment_status === "NOT_FOUND") {
      requireTrue(asset.pool_eligibility === false, "UNDEPLOYED_ASSET_ACTIVE_POOL");
    }
  }
  return true;
}

export class NaiheReservoirPaperRuntime {
  constructor({ registry, reservoirAddress, mode = "PAPER_TEST", authorizedMengpoLifeIds = [] }) {
    validateLifeFluidRegistry(registry);
    requireTrue(mode === "PAPER_TEST", "PRODUCTION_RUNTIME_FORBIDDEN");
    requireTrue(/^0x[0-9a-fA-F]{40}$/.test(reservoirAddress), "RESERVOIR_TEST_ADDRESS_INVALID");
    this.registry = registry;
    this.reservoirAddress = normalized(reservoirAddress);
    this.mode = mode;
    this.authorizedMengpoLifeIds = new Set(authorizedMengpoLifeIds);
    this.pools = new Map();
    this.refills = new Set();
    this.drawReplayKeys = new Set();
    this.draws = new Map();
    this.transformedDrawIds = new Set();
    this.transformations = new Map();
    this.doses = new Map();
    this.pendingGenesisIds = new Set();
    this.genesisIds = new Set();
    this.investmentReturns = new Set();
  }

  asset(assetId) {
    const found = this.registry.assets.find((entry) => entry.asset_id === assetId);
    requireTrue(found, "UNREGISTERED_ASSET");
    return found;
  }

  registerPool({ poolId, assetId, balance, reserveFloor, drawLimit, massScale }) {
    requireTrue(!this.pools.has(poolId), "DUPLICATE_POOL");
    const asset = this.asset(assetId);
    requireTrue(asset.pool_eligibility === true, "UNDEPLOYED_ASSET_ACTIVE_POOL");
    requireTrue(asset.scale === massScale, "WRONG_SCALE_CONVERSION");
    const pool = {
      poolId,
      assetId,
      balance: amount(balance),
      reserveFloor: amount(reserveFloor),
      drawLimit: amount(drawLimit),
      massScale
    };
    requireTrue(pool.balance >= pool.reserveFloor, "RESERVE_BELOW_FLOOR");
    this.pools.set(poolId, pool);
    return this.poolSnapshot(poolId);
  }

  poolSnapshot(poolId) {
    const pool = this.pools.get(poolId);
    requireTrue(pool, "POOL_NOT_FOUND");
    return Object.freeze({ ...pool, balance: pool.balance.toString(), reserveFloor: pool.reserveFloor.toString(), drawLimit: pool.drawLimit.toString() });
  }

  applyVerifiedRefill(request) {
    requireTrue(request.chainId === 56, "WRONG_CHAIN");
    requireTrue(request.receiptStatus === "VERIFIED_PAPER", "VERIFIED_REFILL_RECEIPT_REQUIRED");
    requireTrue(normalized(request.destinationReservoir) === this.reservoirAddress, "WRONG_RESERVOIR");
    requireTrue(normalized(request.sourceTreasury) !== this.reservoirAddress, "TREASURY_NOT_RESERVOIR");
    requireTrue(!request.recipientLifeId, "PUBLIC_GOOD_DIRECT_LIFE_PAYMENT_FORBIDDEN");
    requireTrue(!this.refills.has(request.replayKey), "DUPLICATE_REFILL");
    const pool = this.pools.get(request.poolId);
    requireTrue(pool, "POOL_NOT_FOUND");
    requireTrue(pool.assetId === request.assetId, "REFILL_ASSET_MISMATCH");
    const refill = amount(request.amount);
    requireTrue(refill > 0n && refill <= amount(request.epochCap), "REFILL_CAP_EXCEEDED");
    requireTrue(pool.balance < amount(request.minimumReserve), "REFILL_NOT_REQUIRED");
    requireTrue(pool.balance + refill <= amount(request.maximumReserve), "MAX_RESERVE_EXCEEDED");
    const sourceBefore = amount(request.sourceBalanceBefore);
    const sourceAfter = amount(request.sourceBalanceAfter);
    requireTrue(sourceBefore - sourceAfter === refill, "REFILL_SOURCE_CONSERVATION_FAILED");
    requireTrue(amount(request.destinationBalanceBefore) === pool.balance, "REFILL_DESTINATION_BEFORE_MISMATCH");
    requireTrue(amount(request.destinationBalanceAfter) === pool.balance + refill, "REFILL_DESTINATION_AFTER_MISMATCH");
    pool.balance += refill;
    this.refills.add(request.replayKey);
    return this.poolSnapshot(request.poolId);
  }

  authorizeDraw(request) {
    requireTrue(request.chainId === 56, "WRONG_CHAIN");
    requireTrue(this.authorizedMengpoLifeIds.has(request.operatorLifeId), "MENGPO_UNAUTHORIZED_DRAW");
    requireTrue(request.authorityStatus === "AUTHORIZED_PAPER_ONLY", "DRAW_AUTHORITY_REQUIRED");
    requireTrue(request.receiptStatus === "VERIFIED_PAPER", "DRAW_RECEIPT_REQUIRED");
    requireTrue(!this.draws.has(request.drawId), "DUPLICATE_DRAW");
    requireTrue(!this.drawReplayKeys.has(request.replayKey), "DUPLICATE_DRAW");
    requireTrue(!this.pendingGenesisIds.has(request.genesisId) && !this.genesisIds.has(request.genesisId), "DUPLICATE_GENESIS");
    validateRoleSeparation(request.roles);
    const pool = this.pools.get(request.poolId);
    requireTrue(pool, "POOL_NOT_FOUND");
    requireTrue(pool.assetId === request.sourceAssetId, "DRAW_ASSET_MISMATCH");
    requireTrue(pool.massScale === request.sourceScale, "WRONG_SCALE_CONVERSION");
    const draw = amount(request.sourceAmount);
    requireTrue(draw > 0n && draw <= pool.drawLimit, "DRAW_LIMIT_EXCEEDED");
    requireTrue(pool.balance - draw >= pool.reserveFloor, "RESERVE_FLOOR_VIOLATION");
    const before = pool.balance;
    pool.balance -= draw;
    const record = Object.freeze({ ...request, sourceAmount: draw.toString(), reservoirBalanceBefore: before.toString(), reservoirBalanceAfter: pool.balance.toString() });
    this.draws.set(request.drawId, record);
    this.drawReplayKeys.add(request.replayKey);
    this.pendingGenesisIds.add(request.genesisId);
    return record;
  }

  transformDraw(record) {
    const draw = this.draws.get(record.drawId);
    requireTrue(draw, "DRAW_NOT_FOUND");
    requireTrue(!this.transformedDrawIds.has(record.drawId), "DRAW_ALREADY_TRANSFORMED");
    requireTrue(!this.transformations.has(record.transformationId), "DUPLICATE_TRANSFORMATION");
    requireTrue(record.ruleStatus === "TEST_ONLY_FROZEN_MOCK", "UNFROZEN_CONVERSION");
    requireTrue(record.inputAssetId === draw.sourceAssetId, "TRANSFORMATION_INPUT_ASSET_MISMATCH");
    requireTrue(amount(record.inputAmount) === amount(draw.sourceAmount), "TRANSFORMATION_INPUT_AMOUNT_MISMATCH");
    requireTrue(record.recipientLifeId === draw.recipientLifeId && record.genesisId === draw.genesisId, "WRONG_RECIPIENT");
    const inputMass = amount(record.inputMass);
    const outputMass = amount(record.outputMass);
    const loss = amount(record.loss);
    const byproduct = amount(record.byproduct);
    requireTrue(inputMass === outputMass + loss + byproduct, "MASS_CONSERVATION_FAILED");
    requireTrue(amount(record.energyInput) >= amount(record.energyOutput), "ENERGY_ACCOUNTING_FAILED");
    const transformed = Object.freeze({ ...record, reservoirBalanceBefore: draw.reservoirBalanceBefore, reservoirBalanceAfter: draw.reservoirBalanceAfter });
    this.transformations.set(record.transformationId, transformed);
    this.transformedDrawIds.add(record.drawId);
    return transformed;
  }

  prepareSoupDose(dose) {
    const transformation = this.transformations.get(dose.transformationId);
    requireTrue(transformation, "TRANSFORMATION_NOT_FOUND");
    requireTrue(dose.chainId === 56, "WRONG_CHAIN");
    requireTrue(dose.recipientLifeId === transformation.recipientLifeId, "WRONG_RECIPIENT");
    requireTrue(dose.genesisId === transformation.genesisId, "GENESIS_BINDING_MISMATCH");
    requireTrue(dose.outputAssetId === transformation.outputAssetId, "DOSE_OUTPUT_ASSET_MISMATCH");
    requireTrue(normalized(dose.recipientAddress) === normalized(dose.expectedRecipientAddress), "WRONG_RECIPIENT");
    requireTrue(!this.doses.has(dose.doseId) && this.pendingGenesisIds.has(dose.genesisId) && !this.genesisIds.has(dose.genesisId), "DUPLICATE_GENESIS");
    if (dose.outputAssetId === "BSC_NATIVE_BNB") {
      requireTrue(amount(dose.outputAmount) === EXACT_GENESIS_BNB_WEI, "WRONG_GENESIS_AMOUNT");
    }
    requireTrue(amount(dose.outputAmount) === amount(transformation.outputAmount), "DOSE_OUTPUT_AMOUNT_MISMATCH");
    requireTrue(dose.regenerationParentStatus === "UNASSIGNED_ORPHAN", "PARENT_ASSIGNMENT_AUTHORITY_UNBOUND");
    this.doses.set(dose.doseId, Object.freeze({ ...dose }));
    this.pendingGenesisIds.delete(dose.genesisId);
    this.genesisIds.add(dose.genesisId);
    return this.doses.get(dose.doseId);
  }

  acceptInvestmentReturn(record) {
    requireTrue(!record.genesisReserveUsed, "INVESTMENT_FUND_USED_GENESIS_RESERVE");
    requireTrue(record.realized && record.settled && record.receipted, "UNREALIZED_PROFIT_CANNOT_REFILL");
    requireTrue(!this.investmentReturns.has(record.replayKey), "DUPLICATE_INVESTMENT_RETURN");
    this.investmentReturns.add(record.replayKey);
    return Object.freeze({ ...record });
  }

  assertReservoirNotTradingPrincipal(value) {
    requireTrue(value === false, "RESERVOIR_TRADING_PRINCIPAL_FORBIDDEN");
    return true;
  }
}

export { EXACT_GENESIS_BNB_WEI };
