import { Contract, Interface, getAddress, id } from "ethers";
import reserveAbi from "../abi/KGENReserveRedemption_Upgradeable.json" with { type: "json" };
import eligibilityAbi from "../abi/CelestialEligibility_Upgradeable.json" with { type: "json" };
import capitalAbi from "../abi/CelestialCapitalCommitment_Upgradeable.json" with { type: "json" };
import bankAbi from "../abi/LingxiaoCelestialBank18888_Upgradeable.json" with { type: "json" };
import governanceAbi from "../abi/BankGovernance_Upgradeable.json" with { type: "json" };

export const PHASE2_FORMAL = Object.freeze({
  chainId: 56n,
  kgen: getAddress("0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be"),
  kaios: getAddress("0xD4E67B3a69e41524c424150E6b6e921b01D036db"),
  bank18888: getAddress("0x11d34c0F723aCd334B8F95076f73F07f06202aab"),
  furnace18911: getAddress("0x44c2CA9B9eba19d8F79F6E1786fd9D25e73738e1"),
  bankGovernance: getAddress("0xa2792fBDCc8A8AaC364053431D44E0a8D335E166"),
  eligibility: getAddress("0xA50743fd0fe022714831482355A27559027368F9"),
  reserveRedemption: getAddress("0xA06eF53c9AD4Af739FD13Ca1Ded446437134b0EE"),
  capitalCommitment: getAddress("0x04fC1536EC51E8CCaAcB961E5Af6151De47b078c"),
});

export const PHASE2_MODULE = Object.freeze({
  eligibility: id("KAIOS.BANK.MODULE.CELESTIAL_ELIGIBILITY"),
  reserveRedemption: id("KAIOS.BANK.MODULE.KGEN_RESERVE_REDEMPTION"),
  capitalCommitment: id("KAIOS.BANK.MODULE.CELESTIAL_CAPITAL_COMMITMENT"),
});

export const PHASE2_VERSION_HASH = Object.freeze({
  eligibility: id("CelestialEligibility_Upgradeable:1.0.0"),
  reserveRedemption: id("KGENReserveRedemption_Upgradeable:1.0.0"),
  capitalCommitment: id("CelestialCapitalCommitment_Upgradeable:1.0.0"),
});

export const ACTIVATION_STATE = Object.freeze({
  BUILDING: "BUILDING",
  INACTIVE: "INACTIVE",
  PAUSED: "PAUSED",
  ACTIVE: "ACTIVE",
  RESERVE_ACCUMULATING: "RESERVE_ACCUMULATING",
  REDEMPTION_DISABLED: "REDEMPTION_DISABLED",
  REDEMPTION_READY: "REDEMPTION_READY",
  ERROR_MISMATCH: "ERROR_MISMATCH",
});

export const ELIGIBILITY_STATUS = Object.freeze([
  "NONE", "MASS_THRESHOLD_PASSED", "CIVILIZATION_REVIEW", "ELIGIBLE_FOR_REVIEW",
  "APPROVED", "REJECTED", "REVOKED",
]);

export const CAPITAL_STATUS = Object.freeze([
  "NONE", "COMMITTED", "ELIGIBLE_FOR_WORMHOLE_SEAT_REVIEW", "APPROVED", "REJECTED", "RELEASED",
]);

export const PHASE2_WORDING = Object.freeze({
  reserveLabel: "18888 Reserve Redemption Reference",
  reserveReference: "1000 KAIOS -> up to 1 existing KGEN",
  reserveDisclaimer: "Subject to existing KGEN reserve, the 100 KGEN reserve floor, transaction and daily limits, Life eligibility, pause state, and system availability. This is not a guaranteed market exchange rate.",
  whiteHole: "White Hole: 1 permanently burned KGEN creates 1000 newly generated KAIOS.",
  redemptionPhysics: "Reserve Redemption: KAIOS is not burned and KGEN is not minted.",
  marketPrice: "Market price is independent from White Hole physics and the reserve redemption reference.",
  massQualification: "Mass Threshold Qualification",
  massDisclaimer: "A single formal 18911 burn of at least 5,000,000 KAIOS passes only the mass threshold. It does not automatically grant a celestial seat.",
  capitalDisclaimer: "KAIOS is not burned. V1 principal is locked for 2,592,000 seconds, may be lawfully released after maturity only to the stored canonical beneficiary, has no forfeiture path, and does not automatically grant a celestial seat.",
});

const KGEN_ABI = [
  "function owner() view returns (address)",
  "function bankWallet() view returns (address)",
  "function rewardWallet() view returns (address)",
  "function autoLPWallet() view returns (address)",
  "function balanceOf(address) view returns (uint256)",
  "event SetTaxWallets(address indexed bank,address indexed reward,address indexed autolp)",
  "event Transfer(address indexed from,address indexed to,uint256 value)",
];

const text = (value) => value?.toString?.() ?? String(value);
const same = (left, right) => {
  try { return getAddress(left) === getAddress(right); } catch { return false; }
};
const hasCode = (code) => typeof code === "string" && code !== "0x";

export function resolveActivationState(kind, snapshot) {
  const mismatch = snapshot?.mismatch || snapshot?.unknown || snapshot?.chainId !== 56
    || !snapshot?.formalAddressMatch || !snapshot?.codePresent || !snapshot?.versionMatch
    || snapshot?.abiMatch === false;
  if (mismatch) return ACTIVATION_STATE.ERROR_MISMATCH;
  if (!snapshot.registered || !snapshot.governanceFinalized) return ACTIVATION_STATE.BUILDING;
  if (snapshot.paused) return ACTIVATION_STATE.PAUSED;
  if (kind === "reserveRedemption") {
    if (snapshot.taxReceiverMatches && !snapshot.redemptionEnabled) {
      return ACTIVATION_STATE.RESERVE_ACCUMULATING;
    }
    if (!snapshot.registryActive || !snapshot.humanActivationConfirmed) {
      return ACTIVATION_STATE.INACTIVE;
    }
    if (
      !snapshot.redemptionEnabled || !snapshot.reserveAboveFloor
      || !snapshot.activationMarginConfirmed
    ) return ACTIVATION_STATE.REDEMPTION_DISABLED;
    return ACTIVATION_STATE.REDEMPTION_READY;
  }
  if (!snapshot.registryActive || !snapshot.humanActivationConfirmed) {
    return ACTIVATION_STATE.INACTIVE;
  }
  return ACTIVATION_STATE.ACTIVE;
}

export function createPhase2IndexState() {
  return {
    modules: {}, proposals: {}, kgenTaxWallets: null, kgenInflows: [],
    eligibility: { paused: null, governanceFinalized: false, records: [] },
    reserveRedemption: { paused: null, governanceFinalized: false, redemptionEnabled: null, requests: [] },
    capitalCommitment: { paused: null, governanceFinalized: false, commitments: [] },
    roles: [],
  };
}

export function reducePhase2IndexedEvent(previous, event) {
  const state = structuredClone(previous);
  const args = event.args ?? {};
  const moduleKey = event.contract === "CelestialEligibility_Upgradeable" ? "eligibility"
    : event.contract === "KGENReserveRedemption_Upgradeable" ? "reserveRedemption"
      : event.contract === "CelestialCapitalCommitment_Upgradeable" ? "capitalCommitment" : null;
  if (event.event === "ModuleConfigured") {
    state.modules[text(args.moduleId)] = {
      proxy: args.module, versionHash: args.versionHash,
      perTransactionLimit: text(args.perTransactionLimit), epochLimit: text(args.epochLimit),
      active: Boolean(args.active), transactionHash: event.transactionHash,
    };
  } else if (event.event === "GovernanceProposalCreated") {
    state.proposals[text(args.proposalId)] = {
      target: args.target, calldataHash: args.dataHash, eta: Number(args.executableAt),
      proposer: args.proposer, approver: null, approved: false, executed: false, cancelled: false,
    };
  } else if (event.event === "GovernanceProposalApproved") {
    const proposal = state.proposals[text(args.proposalId)] ?? {};
    state.proposals[text(args.proposalId)] = { ...proposal, approver: args.approver, approved: true };
  } else if (event.event === "GovernanceProposalExecuted") {
    const proposal = state.proposals[text(args.proposalId)] ?? {};
    state.proposals[text(args.proposalId)] = { ...proposal, executed: true };
  } else if (event.event === "GovernanceProposalCancelled") {
    const proposal = state.proposals[text(args.proposalId)] ?? {};
    state.proposals[text(args.proposalId)] = { ...proposal, cancelled: true };
  } else if (event.event === "SetTaxWallets") {
    state.kgenTaxWallets = { bank: args.bank, reward: args.reward, autoLP: args.autolp, transactionHash: event.transactionHash };
  } else if (
    event.event === "Transfer" && same(event.contractAddress, PHASE2_FORMAL.kgen)
    && same(args.to, event.reserveRedemptionAddress ?? PHASE2_FORMAL.reserveRedemption)
  ) {
    state.kgenInflows.push({
      from: args.from, to: args.to, value: text(args.value), transactionHash: event.transactionHash,
      classification: "UNCLASSIFIED_KGEN_INFLOW",
    });
  } else if (event.event === "ModuleGovernanceFinalized" && moduleKey) {
    state[moduleKey].governanceFinalized = true;
  } else if (["EligibilityPaused", "RedemptionPaused", "CapitalCommitmentPaused"].includes(event.event) && moduleKey) {
    state[moduleKey].paused = true;
  } else if (["EligibilityUnpaused", "RedemptionUnpaused", "CapitalCommitmentUnpaused"].includes(event.event) && moduleKey) {
    state[moduleKey].paused = false;
  } else if (event.event === "RedemptionAvailabilityChanged") {
    state.reserveRedemption.redemptionEnabled = Boolean(args.enabled);
  } else if (event.event === "RedemptionCompleted") {
    state.reserveRedemption.requests.push({ ...args, transactionHash: event.transactionHash });
  } else if (["AlchemyMassThresholdPassed", "CandidateStatusChanged", "ConstitutionHistoryRecorded", "ContributionRecorded", "ContributionStatusChanged", "LifeBound"].includes(event.event)) {
    state.eligibility.records.push({ event: event.event, args, transactionHash: event.transactionHash });
  } else if (["CapitalCommitted", "CapitalReleased", "CapitalReviewStatusChanged"].includes(event.event)) {
    state.capitalCommitment.commitments.push({ event: event.event, args, transactionHash: event.transactionHash });
  } else if (["RoleAdminChanged", "RoleGranted", "RoleRevoked"].includes(event.event)) {
    state.roles.push({ contract: event.contract, event: event.event, args, transactionHash: event.transactionHash });
  }
  return state;
}

export class KaiosCivilizationPhase2Adapter {
  constructor({
    provider,
    reserveRedemptionProxy = PHASE2_FORMAL.reserveRedemption,
    celestialEligibilityProxy = PHASE2_FORMAL.eligibility,
    capitalCommitmentProxy = PHASE2_FORMAL.capitalCommitment,
    bankProxy = PHASE2_FORMAL.bank18888,
    bankGovernance = PHASE2_FORMAL.bankGovernance,
    kgenToken = PHASE2_FORMAL.kgen,
  }) {
    if (!provider) throw new Error("provider is required");
    this.provider = provider;
    this.addresses = {
      reserveRedemption: getAddress(reserveRedemptionProxy), eligibility: getAddress(celestialEligibilityProxy),
      capitalCommitment: getAddress(capitalCommitmentProxy), bank: getAddress(bankProxy),
      governance: getAddress(bankGovernance), kgen: getAddress(kgenToken),
    };
    this.reserve = new Contract(this.addresses.reserveRedemption, reserveAbi, provider);
    this.eligibility = new Contract(this.addresses.eligibility, eligibilityAbi, provider);
    this.capital = new Contract(this.addresses.capitalCommitment, capitalAbi, provider);
    this.bank = new Contract(this.addresses.bank, bankAbi, provider);
    this.governance = new Contract(this.addresses.governance, governanceAbi, provider);
    this.kgen = new Contract(this.addresses.kgen, KGEN_ABI, provider);
    this.reserveInterface = new Interface(reserveAbi);
    this.eligibilityInterface = new Interface(eligibilityAbi);
    this.capitalInterface = new Interface(capitalAbi);
  }

  async systemStatus({
    humanActivation = {}, lifeId = null, kaiosIn = 0n, proposalIds = [],
    reserveActivationMarginConfirmed = false,
  } = {}) {
    try {
      const network = await this.provider.getNetwork();
      const chainId = Number(network.chainId);
      if (chainId !== Number(PHASE2_FORMAL.chainId)) throw new Error(`CHAIN_ID_MISMATCH:${chainId}`);
      const formalAddressMatch = Object.entries({
        reserveRedemption: PHASE2_FORMAL.reserveRedemption, eligibility: PHASE2_FORMAL.eligibility,
        capitalCommitment: PHASE2_FORMAL.capitalCommitment, bank: PHASE2_FORMAL.bank18888,
        governance: PHASE2_FORMAL.bankGovernance, kgen: PHASE2_FORMAL.kgen,
      }).every(([key, value]) => same(this.addresses[key], value));
      if (!formalAddressMatch) throw new Error("FORMAL_ADDRESS_MISMATCH");
      const codes = await Promise.all(Object.values(this.addresses).map((address) => this.provider.getCode(address)));
      if (!codes.every(hasCode)) throw new Error("FORMAL_CODE_MISSING");

      const [eligModule, reserveModule, capitalModule, eligVersion, reserveVersion, capitalVersion,
        eligPaused, reservePaused, capitalPaused, eligFinalized, reserveFinalized, capitalFinalized,
        redemptionEnabled, reserveKgen, minimumKgenReserve, maxKgenPerTx, maxKgenPerDay,
        maxKaiosPerTx, maxKaiosPerDay, kgenOwner, bankWallet, rewardWallet, autoLPWallet] = await Promise.all([
        this.bank.module(PHASE2_MODULE.eligibility), this.bank.module(PHASE2_MODULE.reserveRedemption),
        this.bank.module(PHASE2_MODULE.capitalCommitment), this.eligibility.version(), this.reserve.version(),
        this.capital.version(), this.eligibility.paused(), this.reserve.paused(), this.capital.paused(),
        this.eligibility.governanceFinalized(), this.reserve.governanceFinalized(), this.capital.governanceFinalized(),
        this.reserve.redemptionEnabled(), this.reserve.kgenReserveBalance(), this.reserve.minimumKgenReserve(),
        this.reserve.maxKgenPerTx(), this.reserve.maxKgenPerDay(), this.reserve.maxKaiosPerTx(),
        this.reserve.maxKaiosPerDay(), this.kgen.owner(), this.kgen.bankWallet(), this.kgen.rewardWallet(), this.kgen.autoLPWallet(),
      ]);
      const registered = (module, expectedAddress, expectedVersion) => same(module.module, expectedAddress)
        && module.versionHash === expectedVersion;
      const base = (module, expectedAddress, expectedVersion, version, paused, finalized, activated) => ({
        chainId, formalAddressMatch, codePresent: true, abiMatch: true, versionMatch: version === "1.0.0",
        registered: registered(module, expectedAddress, expectedVersion), registryActive: module.active,
        paused, governanceFinalized: finalized, humanActivationConfirmed: activated === true,
      });
      const eligibilitySnapshot = base(eligModule, PHASE2_FORMAL.eligibility, PHASE2_VERSION_HASH.eligibility, eligVersion, eligPaused, eligFinalized, humanActivation.eligibility);
      const capitalSnapshot = base(capitalModule, PHASE2_FORMAL.capitalCommitment, PHASE2_VERSION_HASH.capitalCommitment, capitalVersion, capitalPaused, capitalFinalized, humanActivation.capitalCommitment);
      const reserveAboveFloor = reserveKgen > minimumKgenReserve;
      const reserveSnapshot = {
        ...base(reserveModule, PHASE2_FORMAL.reserveRedemption, PHASE2_VERSION_HASH.reserveRedemption, reserveVersion, reservePaused, reserveFinalized, humanActivation.reserveRedemption),
        redemptionEnabled, reserveAboveFloor, activationMarginConfirmed: reserveActivationMarginConfirmed,
        taxReceiverMatches: same(bankWallet, PHASE2_FORMAL.reserveRedemption),
      };
      let beneficiary = null, eligible = false, limitsValid = false, dailyLimitsValid = false;
      if (lifeId) {
        [beneficiary, eligible] = await Promise.all([
          this.eligibility.canonicalBeneficiary(lifeId), this.eligibility.redemptionEligible(lifeId),
        ]);
      }
      if (BigInt(kaiosIn) > 0n) {
        const kgenOut = await this.reserve.referenceKgenOut(kaiosIn);
        const day = await this.reserve.currentDayIndex();
        const usage = await this.reserve.dailyUsage(day);
        limitsValid = BigInt(kaiosIn) <= maxKaiosPerTx && kgenOut <= maxKgenPerTx;
        dailyLimitsValid = usage.kaiosIn + BigInt(kaiosIn) <= maxKaiosPerDay
          && usage.kgenOut + kgenOut <= maxKgenPerDay;
      }
      const eligibilityState = resolveActivationState("eligibility", eligibilitySnapshot);
      const capitalState = resolveActivationState("capitalCommitment", capitalSnapshot);
      const reserveState = resolveActivationState("reserveRedemption", reserveSnapshot);
      const pendingProposals = {};
      for (const proposalId of proposalIds) {
        const proposal = await this.governance.proposal(proposalId);
        pendingProposals[proposalId] = {
          target: proposal.target, calldataHash: proposal.dataHash, eta: Number(proposal.executableAt),
          proposer: proposal.proposer, approver: proposal.approver,
          approved: proposal.approver !== "0x0000000000000000000000000000000000000000",
          executed: proposal.executed, cancelled: proposal.cancelled,
        };
      }
      return {
        chainId,
        addresses: this.addresses,
        eligibility: {
          registered: eligibilitySnapshot.registered, registryActive: eligModule.active, paused: eligPaused,
          governanceFinalized: eligFinalized, runtimeReady: eligibilityState === ACTIVATION_STATE.ACTIVE,
          writeAllowed: eligibilityState === ACTIVATION_STATE.ACTIVE, activationState: eligibilityState,
        },
        capitalCommitment: {
          registered: capitalSnapshot.registered, registryActive: capitalModule.active, paused: capitalPaused,
          governanceFinalized: capitalFinalized, runtimeReady: capitalState === ACTIVATION_STATE.ACTIVE,
          writeAllowed: capitalState === ACTIVATION_STATE.ACTIVE, activationState: capitalState,
        },
        reserveRedemption: {
          registered: reserveSnapshot.registered, registryActive: reserveModule.active, paused: reservePaused,
          governanceFinalized: reserveFinalized, redemptionEnabled, reserveKgen: text(reserveKgen),
          minimumKgenReserve: text(minimumKgenReserve), excessKgenReserve: text(reserveKgen > minimumKgenReserve ? reserveKgen - minimumKgenReserve : 0n),
          maxKgenPerTx: text(maxKgenPerTx), maxKgenPerDay: text(maxKgenPerDay),
          maxKaiosPerTx: text(maxKaiosPerTx), maxKaiosPerDay: text(maxKaiosPerDay),
          beneficiary, eligible, limitsValid, dailyLimitsValid,
          runtimeReady: reserveState === ACTIVATION_STATE.REDEMPTION_READY,
          writeAllowed: reserveState === ACTIVATION_STATE.REDEMPTION_READY && eligible && limitsValid && dailyLimitsValid,
          activationState: reserveState, hardFloorKgen: text(minimumKgenReserve),
          activationMargin: "HUMAN_DECISION_REQUIRED", wording: PHASE2_WORDING,
        },
        kgen: { owner: kgenOwner, bankWallet, rewardWallet, autoLPWallet },
        governance: { delaySeconds: Number(await this.governance.governanceDelay()), proposals: pendingProposals },
      };
    } catch (error) {
      const failed = { registered: false, registryActive: false, paused: null, governanceFinalized: false, runtimeReady: false, writeAllowed: false, activationState: ACTIVATION_STATE.ERROR_MISMATCH };
      return { chainId: null, error: error.shortMessage ?? error.message, eligibility: { ...failed }, capitalCommitment: { ...failed }, reserveRedemption: { ...failed }, kgen: null, governance: null };
    }
  }

  async reserveStatus(lifeId) {
    const [version, reserve, totalKaios, totalKgen, paused, enabled, floor, maxKgenTx, maxKgenDay, maxKaiosTx, maxKaiosDay, beneficiary, eligible] = await Promise.all([
      this.reserve.version(), this.reserve.kgenReserveBalance(), this.reserve.totalKaiosDeposited(),
      this.reserve.totalKgenRedeemed(), this.reserve.paused(), this.reserve.redemptionEnabled(),
      this.reserve.minimumKgenReserve(), this.reserve.maxKgenPerTx(), this.reserve.maxKgenPerDay(),
      this.reserve.maxKaiosPerTx(), this.reserve.maxKaiosPerDay(),
      this.eligibility.canonicalBeneficiary(lifeId), this.eligibility.redemptionEligible(lifeId),
    ]);
    return {
      label: PHASE2_WORDING.reserveLabel, reference: PHASE2_WORDING.reserveReference,
      disclaimer: PHASE2_WORDING.reserveDisclaimer, whiteHole: PHASE2_WORDING.whiteHole,
      redemptionPhysics: PHASE2_WORDING.redemptionPhysics, marketPrice: PHASE2_WORDING.marketPrice,
      version, reserveKgen: text(reserve), totalKaiosDeposited: text(totalKaios), totalKgenRedeemed: text(totalKgen),
      paused, enabled, minimumKgenReserve: text(floor), excessKgenReserve: text(reserve > floor ? reserve - floor : 0n),
      maxKgenPerTransaction: text(maxKgenTx), maxKgenPerUtcDay: text(maxKgenDay),
      maxKaiosPerTransaction: text(maxKaiosTx), maxKaiosPerUtcDay: text(maxKaiosDay),
      lifeId, beneficiary, eligible, activationMargin: "HUMAN_DECISION_REQUIRED",
    };
  }

  async massQualification(proofId) {
    const candidate = await this.eligibility.candidate(proofId);
    const [constitution, civilizationQualified, proofMatured] = await Promise.all([
      this.eligibility.constitutionRecord(candidate.lifeId), this.eligibility.civilizationQualified(candidate.lifeId),
      candidate.status === 0n ? false : this.eligibility.proofMatured(proofId),
    ]);
    return {
      label: PHASE2_WORDING.massQualification, disclaimer: PHASE2_WORDING.massDisclaimer,
      proofId, lifeId: candidate.lifeId, owner: candidate.owner, beneficiary: candidate.beneficiary,
      singleBurnKaios: text(candidate.kaiosBurned), thresholdKaios: text(await this.eligibility.MASS_THRESHOLD_KAIOS()),
      destinationCode: candidate.destinationCode, burnEpoch: text(candidate.burnEpoch), maturityEpoch: text(candidate.maturityEpoch),
      proofMatured, reviewStatus: ELIGIBILITY_STATUS[Number(candidate.status)] ?? "UNKNOWN",
      constitution, civilizationQualified, automaticSeat: false,
    };
  }

  async capitalCommitment(commitmentId, nowTimestamp = Math.floor(Date.now() / 1000)) {
    const [record, totalLiability, balance, invariant] = await Promise.all([
      this.capital.commitment(commitmentId), this.capital.totalCommittedPrincipal(),
      this.capital.kaiosBalance(), this.capital.liabilityInvariantHolds(),
    ]);
    return {
      disclaimer: PHASE2_WORDING.capitalDisclaimer,
      commitmentId, lifeId: record.lifeId, beneficiary: record.beneficiary,
      committedPrincipal: text(record.committedPrincipal), createdAt: text(record.createdAt), releaseAt: text(record.releaseAt),
      remainingLockSeconds: Math.max(Number(record.releaseAt) - Number(nowTimestamp), 0),
      reviewStatus: CAPITAL_STATUS[Number(record.status)] ?? "UNKNOWN",
      totalCommittedPrincipal: text(totalLiability), moduleKaiosBalance: text(balance), liabilityInvariantHolds: invariant,
      burned: false, forfeiture: false, beneficiaryRedirect: false, automaticSeat: false,
    };
  }

  encodeRedemptionRequest(requestId, lifeId, kaiosIn, deadline) {
    return this.reserveInterface.encodeFunctionData("requestRedemption", [requestId, lifeId, kaiosIn, deadline]);
  }
  encodeMassProofSubmission(proofId, lifeId) {
    return this.eligibilityInterface.encodeFunctionData("submitAlchemyMassProof", [proofId, lifeId]);
  }
  encodeCapitalCommitment(commitmentId, lifeId, amount) {
    return this.capitalInterface.encodeFunctionData("commitCapital", [commitmentId, lifeId, amount]);
  }
}
