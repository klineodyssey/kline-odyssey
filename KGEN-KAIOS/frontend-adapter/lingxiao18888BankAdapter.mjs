import { Contract, Interface } from "ethers";
import bankAbi from "../abi/LingxiaoCelestialBank18888_Upgradeable.json" with { type: "json" };
import seatAbi from "../abi/CelestialSeat500_Upgradeable.json" with { type: "json" };
import economic8888Abi from "../abi/GaolaozhuangCommercialBank8888_Upgradeable.json" with { type: "json" };

export class Lingxiao18888BankAdapter {
  constructor({ provider, bankProxy, celestialSeat500, economicBank8888 }) {
    if (!provider) throw new Error("provider is required");
    if (!bankProxy) throw new Error("bankProxy is required");
    this.bank = new Contract(bankProxy, bankAbi, provider);
    this.seats = celestialSeat500 ? new Contract(celestialSeat500, seatAbi, provider) : null;
    this.economic8888 = economicBank8888 ? new Contract(economicBank8888, economic8888Abi, provider) : null;
    this.bankInterface = new Interface(bankAbi);
    this.seatInterface = new Interface(seatAbi);
  }

  async economic8888Status() {
    if (!this.economic8888) throw new Error("Gaolaozhuang 8888 Bank address is not configured");
    const [version, implementation, kgen, kaios, legacyTreasury, health, calendarEpoch, bankingEpoch] =
      await Promise.all([
        this.economic8888.version(),
        this.economic8888.implementationAddress(),
        this.economic8888.kgen(),
        this.economic8888.kaios(),
        this.economic8888.legacyTreasury(),
        this.economic8888.bankHealth(),
        this.economic8888.currentCalendarEpoch(),
        this.economic8888.currentBankingEpoch(),
      ]);
    return {
      version,
      implementation,
      kgen,
      kaios,
      legacyTreasury,
      calendarEpoch: calendarEpoch.toString(),
      bankingEpoch: bankingEpoch.toString(),
      health: {
        balance: health.balance.toString(),
        customerLiability: health.customerLiability.toString(),
        interestReserve: health.interestReserve.toString(),
        pendingInterest: health.pendingInterest.toString(),
        reserve: health.reserve.toString(),
        available: health.available.toString(),
        solvent: health.solvent,
        paused: health.isPaused,
      },
    };
  }

  async status() {
    const [version, implementation, kgen, kaios, balance, health, genesisStarted, genesisOpeningBalance] =
      await Promise.all([
        this.bank.version(),
        this.bank.implementationAddress(),
        this.bank.kgen(),
        this.bank.kaios(),
        this.bank.kaiosBalance(),
        this.bank.bankHealth(),
        this.bank.genesisStarted(),
        this.bank.genesisOpeningBalance(),
      ]);
    return {
      version,
      implementation,
      kgen,
      kaios,
      balance: balance.toString(),
      genesisStarted,
      genesisOpeningBalance: genesisOpeningBalance.toString(),
      health: {
        balance: health.balance.toString(),
        reserve: health.reserve.toString(),
        available: health.available.toString(),
        accountedInflow: health.accountedInflow.toString(),
        totalOutflow: health.totalOutflow.toString(),
        healthy: health.healthy,
        paused: health.isPaused,
      },
    };
  }

  async seat(seatId) {
    if (!this.seats) throw new Error("CelestialSeat500 address is not configured");
    return this.seats.seat(seatId);
  }

  encodeSalaryClaim(seatId) {
    return this.seatInterface.encodeFunctionData("claimCelestialSalary", [seatId]);
  }

  encodeAccountingSync() {
    return this.bankInterface.encodeFunctionData("synchronizeAccounting");
  }
}
