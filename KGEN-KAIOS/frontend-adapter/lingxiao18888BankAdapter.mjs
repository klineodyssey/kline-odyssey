import { Contract, Interface } from "ethers";
import bankAbi from "../abi/LingxiaoCelestialBank18888_Upgradeable.json" with { type: "json" };
import seatAbi from "../abi/CelestialSeat500_Upgradeable.json" with { type: "json" };

export class Lingxiao18888BankAdapter {
  constructor({ provider, bankProxy, celestialSeat500 }) {
    if (!provider) throw new Error("provider is required");
    if (!bankProxy) throw new Error("bankProxy is required");
    this.bank = new Contract(bankProxy, bankAbi, provider);
    this.seats = celestialSeat500 ? new Contract(celestialSeat500, seatAbi, provider) : null;
    this.bankInterface = new Interface(bankAbi);
    this.seatInterface = new Interface(seatAbi);
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
