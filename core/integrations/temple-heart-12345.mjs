import { invariant } from "../shared/errors.mjs";

export const TEMPLE_HEART_ADDRESS = "0xB016D4d8f1aED1339101b30722cad6dbA9B8C972";
export const HEART_ELIGIBILITY_SOURCE = "CLIENT_DERIVED";

// Selective continuation of PR #134's resolver/ABI seam, not its obsolete UI,
// Wallet or FortuneGame runtime. An allowed version alone is never identity.
export const TEMPLE_HEART_V34_ABI = Object.freeze([
  "function version() view returns (string)",
  "function hasRole(bytes32,address) view returns (bool)",
  "function kgen() view returns (address)",
  "function organRegistry() view returns (address)",
  "function kaiosAlchemyProofSource() view returns (address)",
  "function fortuneGame() view returns (address)",
  "function fortuneMaxWhole() view returns (uint256)",
  "function fortuneEpochMaxClaims() view returns (uint256)",
  "function nextFortuneEligibility(address) view returns (bool eligible,bool repaymentSatisfied,uint256 cooldownEndsAt)",
  "function makeWish(bytes32 wishHash,bytes32 civilizationId)",
  "function submitHolyCupProof(bytes32,bytes32,bytes32,uint256,bytes)",
  "function recordBurnOffering(bytes32,uint8)",
  "function fortuneClaim(bytes32 proofId)",
  "function voluntaryRepayFortune(uint256 amount)",
  "function heartbeatClaim()",
  "function igniteAndClaim()"
]);
const HEART_IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const HEART_ZERO = "0x0000000000000000000000000000000000000000";

export function resolveTempleHeartLineage({ chainId, mode = "LEGACY_V326", manifest = null } = {}) {
  if (Number(chainId) === 56 && mode === "LEGACY_V326") return Object.freeze({
    status:"LEGACY_V326", address:TEMPLE_HEART_ADDRESS, chainId:56,
    useExistingWalletAndHeartRuntime:true, newAuthority:false
  });
  if (Number(chainId) !== 97 || mode !== "V34_CANDIDATE") return Object.freeze({status:"V34_NOT_ACTIVATED", writeEnabled:false});
  if (!manifest || Number(manifest.chainId) !== 97 || String(manifest.proxy).toLowerCase() === TEMPLE_HEART_ADDRESS.toLowerCase()) {
    return Object.freeze({status:"CANDIDATE_MANIFEST_REQUIRED", writeEnabled:false});
  }
  return Object.freeze({status:"IDENTITY_VERIFICATION_REQUIRED", address:manifest.proxy, chainId:97, writeEnabled:false});
}

// Read-only, block-bound identity verification. No wallet prompt, switch, signer,
// approve or automatic submission. The UI's existing explicit action gate must
// still confirm each prepared transaction. BSC56 candidate activation is absent.
export async function verifyTempleHeartCandidate({ ethers, provider, manifest }) {
  const lineage = resolveTempleHeartLineage({chainId:manifest?.chainId, mode:"V34_CANDIDATE", manifest});
  invariant(lineage.status === "IDENTITY_VERIFICATION_REQUIRED", "V34_NOT_ACTIVATED");
  const utils = ethers.utils ?? ethers;
  const network = await provider.getNetwork();
  invariant(Number(network.chainId) === 97, "BSC97_REQUIRED");
  for (const key of ["proxy", "implementation", "kgen", "registry", "proofSource"]) {
    invariant(utils.isAddress(manifest[key]) && manifest[key].toLowerCase() !== HEART_ZERO, "INVALID_MANIFEST_ADDRESS");
  }
  const block = await provider.getBlock("latest"), tag = block.number;
  const [proxyCode, implementationCode, slot] = await Promise.all([
    provider.getCode(manifest.proxy, tag), provider.getCode(manifest.implementation, tag),
    provider.getStorageAt ? provider.getStorageAt(manifest.proxy, HEART_IMPLEMENTATION_SLOT, tag) : provider.getStorage(manifest.proxy, HEART_IMPLEMENTATION_SLOT, tag)
  ]);
  invariant(proxyCode !== "0x" && implementationCode !== "0x", "NO_CODE");
  invariant(utils.keccak256(proxyCode) === manifest.proxyCodeHash, "PROXY_CODE_MISMATCH");
  invariant(utils.keccak256(implementationCode) === manifest.implementationCodeHash, "IMPLEMENTATION_CODE_MISMATCH");
  invariant(`0x${slot.slice(-40)}`.toLowerCase() === manifest.implementation.toLowerCase(), "IMPLEMENTATION_SLOT_MISMATCH");
  const contract = new ethers.Contract(manifest.proxy, TEMPLE_HEART_V34_ABI, provider);
  const read = {blockTag:tag};
  invariant(await contract.version(read) === "3.4.0", "VERSION_MISMATCH");
  for (const [getter,key] of [["kgen","kgen"],["organRegistry","registry"],["kaiosAlchemyProofSource","proofSource"]]) {
    invariant((await contract[getter](read)).toLowerCase() === manifest[key].toLowerCase(), "BINDING_MISMATCH");
  }
  invariant((await contract.fortuneGame(read)).toLowerCase() === HEART_ZERO, "FORTUNEGAME_133_HOLD");
  invariant(String(await contract.fortuneMaxWhole(read)) === "8", "FORTUNE_MAX_MISMATCH");
  invariant(String(await contract.fortuneEpochMaxClaims(read)) === "500", "FORTUNE_CAP_MISMATCH");
  for (const role of ["DEFAULT_ADMIN_ROLE", "UPGRADER_ROLE", "OPERATOR_ROLE", "HOLY_CUP_SIGNER_ROLE"]) {
    const account = manifest.roles?.[role];
    invariant(utils.isAddress(account) && account.toLowerCase() !== HEART_ZERO, "ROLE_MANIFEST_REQUIRED");
    invariant(await contract.hasRole(role === "DEFAULT_ADMIN_ROLE" ? `0x${"00".repeat(32)}` : utils.id(role), account, read), "ROLE_MISMATCH");
  }
  return Object.freeze({status:"CANDIDATE_READ_VERIFIED", chainId:97, address:manifest.proxy, blockNumber:tag,
    blockHash:block.hash, implementation:manifest.implementation, writeEnabled:false, contract});
}

export function prepareTempleHeartCandidateCall({ethers, chainId, manifest, action, args = []}) {
  invariant(resolveTempleHeartLineage({chainId,mode:"V34_CANDIDATE",manifest}).status === "IDENTITY_VERIFICATION_REQUIRED", "V34_NOT_ACTIVATED");
  const utils = ethers.utils ?? ethers;
  const signatures = {
    WISH:"makeWish(bytes32,bytes32)", HOLY_CUP:"submitHolyCupProof(bytes32,bytes32,bytes32,uint256,bytes)",
    OFFERING:"recordBurnOffering(bytes32,uint8)", FORTUNE:"fortuneClaim(bytes32)",
    REPAY_FORTUNE:"voluntaryRepayFortune(uint256)", HEARTBEAT:"heartbeatClaim()", IGNITE:"igniteAndClaim()"
  };
  invariant(Boolean(signatures[action]), "UNSUPPORTED_V34_ACTION_USE_LEGACY");
  invariant(utils.isAddress(manifest.proxy), "INVALID_PROXY");
  if (action === "REPAY_FORTUNE") invariant(/^[1-9][0-9]*$/.test(String(args[0] ?? "")), "POSITIVE_BASE_UNIT_AMOUNT_REQUIRED");
  const iface = new utils.Interface(TEMPLE_HEART_V34_ABI);
  const data = iface.encodeFunctionData(signatures[action], args);
  return Object.freeze({chainId:97,to:manifest.proxy,data,value:"0",action,
    status:"PREPARED_NOT_SIGNED", requiresFreshIdentityCheck:true, requiresExplicitWalletConfirmation:true});
}

// Non-mutating continuity adapter. State is read from the original contract at
// one block, not copied into a fictitious new-proxy ledger. Missing reads fail
// as a unit; an RPC failure is not a zero/never-claimed value.
export async function readTempleHeartLegacyContinuity({ethers, provider, walletAddress}) {
  const utils = ethers.utils ?? ethers;
  invariant(utils.isAddress(walletAddress), "INVALID_WALLET_ADDRESS", "有效的公開錢包地址為必填");
  invariant(Number((await provider.getNetwork()).chainId) === 56, "BSC56_REQUIRED", "舊 Heart 歷史須從 BSC56 讀取");
  const block = await provider.getBlock("latest"), read = {blockTag:block.number};
  const heart = new ethers.Contract(TEMPLE_HEART_ADDRESS, [...TEMPLE_HEART_READ_ABI,
    "function festivalClaimed(uint8,uint256,address) view returns(bool)",
    "function newYearCountdownClaimed(uint256,address,uint8) view returns(bool)"
  ], provider);
  const year = new Date(block.timestamp * 1000).getUTCFullYear();
  const [kgen, fortune, heartbeat, ignite, lamp, festival520, festival1111, newYear] = await Promise.all([
    heart.kgen(read), heart.lastFortuneAt(walletAddress,read), heart.lastHeartbeatAt(walletAddress,read),
    heart.lastIgniteDay(walletAddress,read), heart.lampExpireAt(walletAddress,read),
    heart.festivalClaimed(1,year,walletAddress,read), heart.festivalClaimed(2,year,walletAddress,read),
    Promise.all(Array.from({length:10},(_,slot)=>heart.newYearCountdownClaimed(year,walletAddress,slot,read)))
  ]);
  invariant(kgen.toLowerCase() === "0xba3d3810e58735cb6813bc1cdc5458c0d71432be", "LEGACY_KGEN_MISMATCH", "舊 Heart KGEN 綁定不符");
  const token = new ethers.Contract(kgen, ERC20_READ_ABI, provider);
  const [walletBalance, heartReserve, oldAllowance] = await Promise.all([
    token.balanceOf(walletAddress,read), token.balanceOf(TEMPLE_HEART_ADDRESS,read), token.allowance(walletAddress,TEMPLE_HEART_ADDRESS,read)
  ]);
  return Object.freeze({status:"LEGACY_READ_ONLY",chainId:56,legacyHeart:TEMPLE_HEART_ADDRESS,walletAddress,
    blockNumber:block.number,blockHash:block.hash,blockTimestamp:block.timestamp,year,
    lastFortuneAt:String(fortune),lastHeartbeatAt:String(heartbeat),lastIgniteDay:String(ignite),lampExpireAt:String(lamp),
    festivalClaimed:{1:festival520,2:festival1111},newYearCountdownClaimed:newYear,
    walletKgen:String(walletBalance),oldHeartReserve:String(heartReserve),legacyAllowance:String(oldAllowance),
    newProxyAllowance:"NOT_INHERITED",newProxyStorageWritten:false,
    wishAndVowHistory:"RETAIN_ORIGINAL_EVENT_LOGS_NOT_SYNTHESIZED",cooldownCutover:"HUMAN_POLICY_REQUIRED"});
}

export const TEMPLE_HEART_READ_ABI = Object.freeze([
  "function configLocked() view returns (bool)",
  "function kgen() view returns (address)",
  "function fortuneMin() view returns (uint256)",
  "function fortuneMax() view returns (uint256)",
  "function fortuneCooldownSeconds() view returns (uint256)",
  "function fortuneEpochSeconds() view returns (uint256)",
  "function fortuneEpochMaxClaims() view returns (uint256)",
  "function fortuneCapEnabled() view returns (bool)",
  "function fortuneEpochClaims(uint256) view returns (uint256)",
  "function heartbeatCooldownSeconds() view returns (uint256)",
  "function igniteWindowStart() view returns (uint256)",
  "function igniteWindowEnd() view returns (uint256)",
  "function heartbeatReward() view returns (uint256)",
  "function igniteReward() view returns (uint256)",
  "function lampPricePerDay() view returns (uint256)",
  "function lastFortuneAt(address) view returns (uint256)",
  "function lastHeartbeatAt(address) view returns (uint256)",
  "function lastIgniteDay(address) view returns (uint256)",
  "function lampExpireAt(address) view returns (uint256)",
  "function currentDayIndex() view returns (uint256)",
  "function currentFortuneEpochIndex() view returns (uint256)",
  "function timeOfDaySeconds() view returns (uint256)",
  "function heartBalance() view returns (uint256)",
  "event FortuneClaimed(address indexed user,uint256 amount,uint256 indexed epochIndex)",
  "event HeartbeatClaimed(address indexed user,uint256 reward)",
  "event IgniteClaimed(address indexed user,uint256 reward,uint256 indexed dayIndex)",
  "event Vowed(address indexed user,uint8 option,uint256 amount)",
  "event LampLit(address indexed user,uint256 daysAdded,uint256 paid,uint256 newExpireAt)",
  "event WishMade(address indexed user,bytes32 wishHash)"
]);

export const TEMPLE_HEART_DRY_RUN_ABI = Object.freeze([
  "function fortuneClaim(uint256 amountWhole)",
  "function heartbeatClaim()",
  "function igniteAndClaim()",
  "function vowTo(uint8 option,uint256 amountWhole)",
  "function lightLamp(uint256 daysToAdd)",
  "function makeWish(bytes32 wishHash)",
  "function festivalClaim(uint8 festivalId)",
  "function newYearCountdownClaim()"
]);

const ERC20_READ_ABI = Object.freeze([
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function decimals() view returns (uint8)"
]);

export const TEMPLE_HEART_VERIFIED_ACTIONS = Object.freeze({
  HEARTBEAT: "heartbeatClaim()",
  IGNITION: "igniteAndClaim()",
  FORTUNE_CLAIM: "fortuneClaim(uint256)",
  WISH: "makeWish(bytes32)",
  LIGHT: "lightLamp(uint256)",
  VOW: "vowTo(uint8,uint256)",
  FESTIVAL_CLAIM: "festivalClaim(uint8)",
  NEW_YEAR_COUNTDOWN: "newYearCountdownClaim()"
});

const RISK_LEVELS = Object.freeze(["NORMAL", "WATCH", "SUSPICIOUS", "HIGH_RISK"]);

function decimalString(value) { return value?.toString?.() ?? String(value ?? "0"); }
function isoFromSeconds(seconds) { return Number(seconds) > 0 ? new Date(Number(seconds) * 1000).toISOString() : null; }
function lower(value) { return String(value ?? "").toLowerCase(); }

function eligibility({ eligible, reason, requiredValue = "0", requiredCurrency = "BNB", cooldown = 0, nextEligibleAt = null, plannedAction, estimatedGas = null }) {
  return Object.freeze({
    source: HEART_ELIGIBILITY_SOURCE,
    eligible,
    reason,
    required_value: requiredValue,
    required_currency_id: requiredCurrency,
    cooldown_seconds: Number(cooldown),
    next_eligible_time: nextEligibleAt,
    planned_action: plannedAction,
    execution_mode: "DRY_RUN_ONLY",
    estimated_gas: estimatedGas,
    estimated_gas_status: estimatedGas === null ? "ESTIMATE_UNAVAILABLE" : "CHAIN_ESTIMATED"
  });
}

export function deriveHeartEligibility(snapshot, { fortuneAmountWhole = "1", lampDays = 1, wishHash } = {}) {
  invariant(snapshot?.chain_id === 56, "BSC_CHAIN_56_REQUIRED", "Heart eligibility requires a BSC chain 56 snapshot");
  const now = Number(snapshot.block_timestamp);
  const amount = BigInt(String(fortuneAmountWhole));
  const fortuneMin = BigInt(snapshot.fortune.min);
  const fortuneMax = BigInt(snapshot.fortune.max);
  const fortuneNext = Number(snapshot.account.last_fortune_at) + Number(snapshot.fortune.cooldown_seconds);
  const fortuneCapacity = !snapshot.fortune.cap_enabled || BigInt(snapshot.fortune.epoch_claims) < BigInt(snapshot.fortune.epoch_max_claims);
  const fortuneRange = amount >= fortuneMin && amount <= fortuneMax;
  const fortuneFunds = BigInt(snapshot.heart_balance_wei) >= amount * 10n ** BigInt(snapshot.kgen_decimals);
  const fortuneEligible = now >= fortuneNext && fortuneCapacity && fortuneRange && fortuneFunds;

  const heartbeatNext = Number(snapshot.account.last_heartbeat_at) + Number(snapshot.heartbeat.cooldown_seconds);
  const heartbeatFunds = BigInt(snapshot.heart_balance_wei) >= BigInt(snapshot.heartbeat.reward) * 10n ** BigInt(snapshot.kgen_decimals);
  const heartbeatEligible = now >= heartbeatNext && heartbeatFunds;

  const inIgnitionWindow = Number(snapshot.time_of_day_seconds) >= Number(snapshot.ignition.window_start)
    && Number(snapshot.time_of_day_seconds) <= Number(snapshot.ignition.window_end);
  const notIgnitedToday = Number(snapshot.account.last_ignite_day) !== Number(snapshot.current_day_index);
  const ignitionFunds = BigInt(snapshot.heart_balance_wei) >= BigInt(snapshot.ignition.reward) * 10n ** BigInt(snapshot.kgen_decimals);
  const ignitionEligible = inIgnitionWindow && notIgnitedToday && ignitionFunds;
  const eligibleNow = snapshot.observed_at ?? isoFromSeconds(now);
  const ignitionNext = ignitionEligible ? eligibleNow : isoFromSeconds(now - Number(snapshot.time_of_day_seconds) + Number(snapshot.ignition.window_start) + (Number(snapshot.time_of_day_seconds) > Number(snapshot.ignition.window_end) || !notIgnitedToday ? 86_400 : 0));

  const lampRequired = BigInt(snapshot.light.price_per_day) * BigInt(lampDays) * 10n ** BigInt(snapshot.kgen_decimals);
  const lampFunded = BigInt(snapshot.account.kgen_balance_wei) >= lampRequired;
  const lampApproved = BigInt(snapshot.account.kgen_allowance_wei) >= lampRequired;
  const lampEligible = Number.isInteger(lampDays) && lampDays > 0 && lampDays <= 3650 && lampFunded && lampApproved;
  const wishEligible = /^0x[0-9a-fA-F]{64}$/.test(String(wishHash ?? "")) && !/^0x0{64}$/i.test(String(wishHash));

  return Object.freeze({
    source: HEART_ELIGIBILITY_SOURCE,
    heartbeat: eligibility({ eligible: heartbeatEligible, reason: heartbeatEligible ? "HEARTBEAT_ELIGIBLE" : now < heartbeatNext ? "HEARTBEAT_COOLDOWN" : "HEART_INSUFFICIENT_FUNDS", cooldown: snapshot.heartbeat.cooldown_seconds, nextEligibleAt: heartbeatEligible ? eligibleNow : isoFromSeconds(heartbeatNext), plannedAction: heartbeatEligible ? "HEARTBEAT_CLAIM_PROPOSAL" : "NO_ACTION", estimatedGas: snapshot.gas_estimates?.heartbeat ?? null }),
    ignition: eligibility({ eligible: ignitionEligible, reason: ignitionEligible ? "IGNITION_ELIGIBLE" : !inIgnitionWindow ? "IGNITE_OUT_OF_WINDOW" : !notIgnitedToday ? "IGNITE_ALREADY_TODAY" : "HEART_INSUFFICIENT_FUNDS", nextEligibleAt: ignitionNext, plannedAction: ignitionEligible ? "IGNITION_PROPOSAL" : "NO_ACTION", estimatedGas: snapshot.gas_estimates?.ignition ?? null }),
    fortune: eligibility({ eligible: fortuneEligible, reason: fortuneEligible ? "FORTUNE_CLAIM_ELIGIBLE" : !fortuneRange ? "FORTUNE_OUT_OF_RANGE" : now < fortuneNext ? "FORTUNE_COOLDOWN" : !fortuneCapacity ? "FORTUNE_EPOCH_FULL" : "HEART_INSUFFICIENT_FUNDS", cooldown: snapshot.fortune.cooldown_seconds, nextEligibleAt: fortuneEligible ? eligibleNow : isoFromSeconds(fortuneNext), plannedAction: fortuneEligible ? "FORTUNE_CLAIM_PROPOSAL" : "NO_ACTION", estimatedGas: snapshot.gas_estimates?.fortune ?? null }),
    light: eligibility({ eligible: lampEligible, reason: lampEligible ? "LIGHT_ELIGIBLE" : !lampFunded ? "KGEN_BALANCE_INSUFFICIENT" : !lampApproved ? "KGEN_ALLOWANCE_INSUFFICIENT" : "LAMP_DAYS_INVALID", requiredValue: lampRequired.toString(), requiredCurrency: "KGEN_WEI", plannedAction: lampEligible ? "LIGHT_LAMP_PROPOSAL" : "NO_ACTION", estimatedGas: snapshot.gas_estimates?.light ?? null }),
    wish: eligibility({ eligible: wishEligible, reason: wishEligible ? "WISH_HASH_VALID" : "WISH_HASH_INVALID", plannedAction: wishEligible ? "WISH_PROPOSAL" : "NO_ACTION", estimatedGas: snapshot.gas_estimates?.wish ?? null })
  });
}

export function classifyGatekeeperRisk({ indicators = [], evidence = [] } = {}) {
  const distinct = new Set(indicators.filter(Boolean));
  let level = "NORMAL";
  if (distinct.size >= 1) level = "WATCH";
  if (distinct.size >= 2 && evidence.length >= 2) level = "SUSPICIOUS";
  if (distinct.size >= 4 && evidence.length >= 4) level = "HIGH_RISK";
  invariant(RISK_LEVELS.includes(level), "INVALID_RISK_LEVEL", "Unsupported gatekeeper risk level");
  invariant(!["SUSPICIOUS", "HIGH_RISK"].includes(level) || evidence.length >= 2, "RISK_EVIDENCE_REQUIRED", "Suspicious or high-risk labels require evidence");
  return Object.freeze({ level, indicators: [...distinct], evidence: [...evidence], enforcement_authority: "NONE", conclusion: "OBSERVATION_ONLY_NOT_A_CRIMINAL_FINDING" });
}

export function createTempleHeartProvider(ethers, runtimeConfig = globalThis.KGEN_RUNTIME_CONFIG ?? {}) {
  if (globalThis.ethereum) return new ethers.providers.Web3Provider(globalThis.ethereum, "any");
  if (runtimeConfig.bscRpcUrl) return new ethers.providers.JsonRpcProvider(runtimeConfig.bscRpcUrl, 56);
  return null;
}

async function estimate(call) {
  try { return decimalString(await call()); } catch { return null; }
}

export async function readCoreHeartEvents(heart, fromBlock, toBlock) {
  if (fromBlock === null || fromBlock === undefined) return { status: "NOT_REQUESTED", indexer: "CORE_HEART_INDEXER", from_block: null, to_block: toBlock, fortune_claims: [], wishes: [], heartbeat_claims: [], ignitions: [], lamps: [], vows: [] };
  try {
    const settled = await Promise.allSettled([
      heart.queryFilter(heart.filters.FortuneClaimed(), fromBlock, toBlock), heart.queryFilter(heart.filters.WishMade(), fromBlock, toBlock), heart.queryFilter(heart.filters.HeartbeatClaimed(), fromBlock, toBlock), heart.queryFilter(heart.filters.IgniteClaimed(), fromBlock, toBlock), heart.queryFilter(heart.filters.LampLit(), fromBlock, toBlock), heart.queryFilter(heart.filters.Vowed(), fromBlock, toBlock)
    ]);
    const [fortune, wishes, heartbeat, ignitions, lamps, vows] = settled.map((result) => result.status === "fulfilled" ? result.value : []);
    const failed = settled.map((result, index) => result.status === "rejected" ? ["FORTUNE", "WISH", "HEARTBEAT", "IGNITION", "LAMP", "VOW"][index] : null).filter(Boolean);
    const base = (event) => ({ block_number: event.blockNumber, transaction_index: event.transactionIndex, tx_hash: event.transactionHash });
    return {
      status: failed.length ? "CORE_HEART_INDEXER_PARTIAL" : "CORE_HEART_INDEXER_HEALTHY", indexer: "CORE_HEART_INDEXER", failed_event_types: failed, from_block: fromBlock, to_block: toBlock,
      fortune_claims: fortune.map((event) => ({ ...base(event), wallet: event.args.user, amount_wei: decimalString(event.args.amount), epoch_index: decimalString(event.args.epochIndex) })),
      wishes: wishes.map((event) => ({ ...base(event), wallet: event.args.user, wish_hash: event.args.wishHash })),
      heartbeat_claims: heartbeat.map((event) => ({ ...base(event), wallet: event.args.user, reward_whole: decimalString(event.args.reward) })),
      ignitions: ignitions.map((event) => ({ ...base(event), wallet: event.args.user, reward_whole: decimalString(event.args.reward), day_index: decimalString(event.args.dayIndex) })),
      lamps: lamps.map((event) => ({ ...base(event), wallet: event.args.user, days_added: decimalString(event.args.daysAdded), paid_wei: decimalString(event.args.paid), expires_at: decimalString(event.args.newExpireAt) })),
      vows: vows.map((event) => ({ ...base(event), wallet: event.args.user, option: Number(event.args.option), amount_wei: decimalString(event.args.amount) }))
    };
  } catch {
    return { status: "CORE_HEART_INDEXER_UNAVAILABLE", indexer: "CORE_HEART_INDEXER", from_block: fromBlock, to_block: toBlock, fortune_claims: [], wishes: [], heartbeat_claims: [], ignitions: [], lamps: [], vows: [] };
  }
}

export async function readTempleHeart12345({ ethers = globalThis.ethers, provider = null, walletAddress = null, fortuneAmountWhole = "1", lampDays = 1, wishText = null, recentBlockWindow = 0 } = {}) {
  if (!ethers) return { status: "CHAIN_READ_UNAVAILABLE", reason: "ETHERS_UNAVAILABLE" };
  const activeProvider = provider ?? createTempleHeartProvider(ethers);
  if (!activeProvider) return { status: "CHAIN_READ_UNAVAILABLE", reason: "RPC_NOT_CONFIGURED" };
  try {
    const network = await activeProvider.getNetwork();
    if (Number(network.chainId) !== 56) return { status: "CHAIN_READ_UNAVAILABLE", reason: "BSC_CHAIN_56_REQUIRED" };
    const [bytecode, latestBlock] = await Promise.all([activeProvider.getCode(TEMPLE_HEART_ADDRESS), activeProvider.getBlock("latest")]);
    if (!bytecode || bytecode === "0x") return { status: "CHAIN_READ_UNAVAILABLE", reason: "HEART_BYTECODE_NOT_FOUND" };
    const heart = new ethers.Contract(TEMPLE_HEART_ADDRESS, [...TEMPLE_HEART_READ_ABI, ...TEMPLE_HEART_DRY_RUN_ABI], activeProvider);
    const [configLocked, kgen, fortuneMin, fortuneMax, fortuneCooldown, fortuneEpochSeconds, fortuneEpochMaxClaims, fortuneCapEnabled, heartbeatCooldown, igniteStart, igniteEnd, heartbeatReward, igniteReward, lampPrice, currentDay, currentEpoch, timeOfDay, heartBalance] = await Promise.all([
      heart.configLocked(), heart.kgen(), heart.fortuneMin(), heart.fortuneMax(), heart.fortuneCooldownSeconds(), heart.fortuneEpochSeconds(), heart.fortuneEpochMaxClaims(), heart.fortuneCapEnabled(), heart.heartbeatCooldownSeconds(), heart.igniteWindowStart(), heart.igniteWindowEnd(), heart.heartbeatReward(), heart.igniteReward(), heart.lampPricePerDay(), heart.currentDayIndex(), heart.currentFortuneEpochIndex(), heart.timeOfDaySeconds(), heart.heartBalance()
    ]);
    const token = new ethers.Contract(kgen, ERC20_READ_ABI, activeProvider);
    const kgenDecimals = Number(await token.decimals());
    const account = walletAddress ? await Promise.all([heart.lastFortuneAt(walletAddress), heart.lastHeartbeatAt(walletAddress), heart.lastIgniteDay(walletAddress), heart.lampExpireAt(walletAddress), token.balanceOf(walletAddress), token.allowance(walletAddress, TEMPLE_HEART_ADDRESS), heart.fortuneEpochClaims(currentEpoch)]) : null;
    const wishHash = wishText ? ethers.utils.id(wishText) : null;
    const gasEstimates = walletAddress ? await (async () => {
      const [heartbeat, ignition, fortune, light, wish] = await Promise.all([
        estimate(() => heart.estimateGas.heartbeatClaim({ from: walletAddress })),
        estimate(() => heart.estimateGas.igniteAndClaim({ from: walletAddress })),
        estimate(() => heart.estimateGas.fortuneClaim(fortuneAmountWhole, { from: walletAddress })),
        estimate(() => heart.estimateGas.lightLamp(lampDays, { from: walletAddress })),
        wishHash ? estimate(() => heart.estimateGas.makeWish(wishHash, { from: walletAddress })) : Promise.resolve(null)
      ]);
      return { heartbeat, ignition, fortune, light, wish };
    })() : null;
    const snapshot = {
      status: "CHAIN_READ_VERIFIED", chain_id: 56, block_number: latestBlock.number, block_timestamp: latestBlock.timestamp, observed_at: new Date(latestBlock.timestamp * 1000).toISOString(), contract_code_verified: true, config_locked: configLocked,
      kgen_token: kgen, kgen_token_matches: lower(kgen) === "0xba3d3810e58735cb6813bc1cdc5458c0d71432be", kgen_decimals: kgenDecimals, heart_balance_wei: decimalString(heartBalance),
      fortune: { min: decimalString(fortuneMin), max: decimalString(fortuneMax), cooldown_seconds: decimalString(fortuneCooldown), epoch_seconds: decimalString(fortuneEpochSeconds), epoch_max_claims: decimalString(fortuneEpochMaxClaims), cap_enabled: fortuneCapEnabled, epoch_claims: decimalString(account?.[6] ?? 0) },
      heartbeat: { reward: decimalString(heartbeatReward), cooldown_seconds: decimalString(heartbeatCooldown) }, ignition: { reward: decimalString(igniteReward), window_start: decimalString(igniteStart), window_end: decimalString(igniteEnd) }, light: { price_per_day: decimalString(lampPrice) },
      wish: { wish_hash: wishHash, event: "WishMade(address,bytes32)", account_history_status: walletAddress ? "EVENT_WINDOW_READ" : "ACCOUNT_BINDING_REQUIRED" }, current_day_index: decimalString(currentDay), current_fortune_epoch_index: decimalString(currentEpoch), time_of_day_seconds: decimalString(timeOfDay),
      account: account ? { wallet: walletAddress, last_fortune_at: decimalString(account[0]), last_heartbeat_at: decimalString(account[1]), last_ignite_day: decimalString(account[2]), lamp_expire_at: decimalString(account[3]), kgen_balance_wei: decimalString(account[4]), kgen_allowance_wei: decimalString(account[5]) } : null,
      gas_estimates: gasEstimates, actions: TEMPLE_HEART_VERIFIED_ACTIONS, write_status: "DRY_RUN_ONLY"
    };
    const fromBlock = recentBlockWindow > 0 ? Math.max(0, latestBlock.number - recentBlockWindow + 1) : null;
    snapshot.recent_events = await readCoreHeartEvents(heart, fromBlock, latestBlock.number);
    snapshot.claim_flow_analysis = { status: "ADVANCED_GRAPH_INDEXER_REQUIRED", indexer: "ADVANCED_TRANSACTION_GRAPH_INDEXER", required: ["ERC20_TRANSFER_INDEXER", "APPROVAL_INDEXER", "FUNDING_GRAPH", "ROUTER_CLASSIFICATION", "ADDRESS_CLUSTERING"], affects_core_gatekeeper_health: false, fast_dex_entry: null, fast_sell: null, common_router: null, common_trading_pattern: null, common_gas_funding: null, common_upstream: null, common_downstream: null, address_clusters: [], reason: "Advanced transfer traces and complete address history are not inferred from Core Heart events" };
    snapshot.risk_assessment = classifyGatekeeperRisk();
    snapshot.eligibility = account ? deriveHeartEligibility(snapshot, { fortuneAmountWhole, lampDays, wishHash }) : null;
    return Object.freeze(snapshot);
  } catch {
    return { status: "CHAIN_READ_UNAVAILABLE", reason: "RPC_OR_CONTRACT_CALL_FAILED" };
  }
}
