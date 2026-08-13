import { Contract, Interface } from "ethers";
import reserveAbi from "../abi/KGENReserveRedemption_Upgradeable.json" with { type: "json" };
import eligibilityAbi from "../abi/CelestialEligibility_Upgradeable.json" with { type: "json" };
import capitalAbi from "../abi/CelestialCapitalCommitment_Upgradeable.json" with { type: "json" };

const text = (value) => value?.toString?.() ?? String(value);

export class KaiosCivilizationPhase2Adapter {
  constructor({ provider, reserveRedemptionProxy, celestialEligibilityProxy, capitalCommitmentProxy }) {
    if (!provider) throw new Error("provider is required");
    this.reserve = reserveRedemptionProxy ? new Contract(reserveRedemptionProxy, reserveAbi, provider) : null;
    this.eligibility = celestialEligibilityProxy ? new Contract(celestialEligibilityProxy, eligibilityAbi, provider) : null;
    this.capital = capitalCommitmentProxy ? new Contract(capitalCommitmentProxy, capitalAbi, provider) : null;
    this.reserveInterface = new Interface(reserveAbi);
    this.eligibilityInterface = new Interface(eligibilityAbi);
    this.capitalInterface = new Interface(capitalAbi);
  }

  async reserveStatus(lifeId) {
    if (!this.reserve || !this.eligibility) throw new Error("reserve and eligibility addresses are required");
    const [version, reserve, totalKaios, totalKgen, paused, enabled, floor, maxKgenTx, maxKgenDay, maxKaiosTx, maxKaiosDay, beneficiary, eligible] = await Promise.all([
      this.reserve.version(), this.reserve.kgenReserveBalance(), this.reserve.totalKaiosDeposited(),
      this.reserve.totalKgenRedeemed(), this.reserve.paused(), this.reserve.redemptionEnabled(),
      this.reserve.minimumKgenReserve(), this.reserve.maxKgenPerTx(), this.reserve.maxKgenPerDay(),
      this.reserve.maxKaiosPerTx(), this.reserve.maxKaiosPerDay(),
      this.eligibility.canonicalBeneficiary(lifeId), this.eligibility.redemptionEligible(lifeId),
    ]);
    return {
      label: "18888 Reserve Redemption Reference",
      reference: "1000 KAIOS -> up to 1 existing KGEN",
      disclaimer: "Not a guaranteed exchange rate; subject to eligibility, reserve and limits.",
      version, reserveKgen: text(reserve), totalKaiosDeposited: text(totalKaios), totalKgenRedeemed: text(totalKgen),
      paused, enabled, minimumKgenReserve: text(floor), maxKgenPerTransaction: text(maxKgenTx),
      maxKgenPerUtcDay: text(maxKgenDay), maxKaiosPerTransaction: text(maxKaiosTx),
      maxKaiosPerUtcDay: text(maxKaiosDay), lifeId, beneficiary, eligible,
    };
  }

  async massQualification(proofId) {
    if (!this.eligibility) throw new Error("eligibility address is required");
    const candidate = await this.eligibility.candidate(proofId);
    return {
      label: "Mass threshold qualification",
      disclaimer: "Burning 5M KAIOS does not automatically grant a celestial seat.",
      proofId, lifeId: candidate.lifeId, owner: candidate.owner, beneficiary: candidate.beneficiary,
      singleBurnKaios: text(candidate.kaiosBurned), thresholdKaios: text(await this.eligibility.MASS_THRESHOLD_KAIOS()),
      destinationCode: candidate.destinationCode, burnEpoch: text(candidate.burnEpoch),
      maturityEpoch: text(candidate.maturityEpoch), reviewStatus: Number(candidate.status),
      constitution: await this.eligibility.constitutionRecord(candidate.lifeId),
      civilizationQualified: await this.eligibility.civilizationQualified(candidate.lifeId),
    };
  }

  async capitalCommitment(commitmentId) {
    if (!this.capital) throw new Error("capital commitment address is required");
    const [record, totalLiability, balance, invariant] = await Promise.all([
      this.capital.commitment(commitmentId), this.capital.totalCommittedPrincipal(),
      this.capital.kaiosBalance(), this.capital.liabilityInvariantHolds(),
    ]);
    return {
      commitmentId, lifeId: record.lifeId, beneficiary: record.beneficiary,
      committedPrincipal: text(record.committedPrincipal), createdAt: text(record.createdAt),
      releaseAt: text(record.releaseAt), reviewStatus: Number(record.status),
      totalCommittedPrincipal: text(totalLiability), moduleKaiosBalance: text(balance),
      liabilityInvariantHolds: invariant, burned: false, automaticSeat: false,
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
