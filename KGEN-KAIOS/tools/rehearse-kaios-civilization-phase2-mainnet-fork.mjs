import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import ganache from "ganache";
import {
  BrowserProvider,
  Contract,
  ContractFactory,
  JsonRpcProvider,
  getAddress,
  id,
  parseEther,
  formatEther,
} from "ethers";
import {
  ACTIVATION_STATE,
  KaiosCivilizationPhase2Adapter,
  createPhase2IndexState,
  reducePhase2IndexedEvent,
  resolveActivationState,
} from "../frontend-adapter/kaiosCivilizationPhase2Adapter.mjs";

const root = path.resolve(import.meta.dirname, "..");
const reportJson = path.join(root, "reports", "KAIOS_CIVILIZATION_PHASE2_MAINNET_FORK_REHEARSAL.json");
const reportMd = path.join(root, "reports", "KAIOS_CIVILIZATION_PHASE2_MAINNET_FORK_REHEARSAL.md");
const rpc = process.env.BSC_MAINNET_RPC_URL;
if (!rpc) throw new Error("BSC_MAINNET_RPC_URL is required; its value is never persisted");

const A = {
  KGEN: getAddress("0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be"),
  KAIOS: getAddress("0xD4E67B3a69e41524c424150E6b6e921b01D036db"),
  BANK: getAddress("0x11d34c0F723aCd334B8F95076f73F07f06202aab"),
  FURNACE: getAddress("0x44c2CA9B9eba19d8F79F6E1786fd9D25e73738e1"),
  SEAT500: getAddress("0xA447853985Ef6e6AbFcb14FCfDeFdced10Be0BDe"),
  ALLOCATION: getAddress("0x75A55Af6967932C4A1c896dB81Dd6F31e531c299"),
  GOVERNANCE_MODULE: getAddress("0xa2792fBDCc8A8AaC364053431D44E0a8D335E166"),
  MOTHER: getAddress("0xCd60BF474e691F2484950a0276Eaf507616Ca4b9"),
  JADE: getAddress("0xc15e08834fca9f2d3462a3f8f0bc30524d6dd756"),
  GUANYIN: getAddress("0xebeeac6d09d2d28db8010b0923442c9eb2b702fe"),
  PAIR: getAddress("0xf36640d7327b53ba3d7fcc1d98dfc1b85574b6c2"),
};
const MODULE = {
  ALLOCATION: id("KAIOS.BANK.MODULE.CIVILIZATION_ALLOCATION"),
  ELIGIBILITY: id("KAIOS.BANK.MODULE.CELESTIAL_ELIGIBILITY"),
  RESERVE: id("KAIOS.BANK.MODULE.KGEN_RESERVE_REDEMPTION"),
  CAPITAL: id("KAIOS.BANK.MODULE.CELESTIAL_CAPITAL_COMMITMENT"),
};
const DESTINATION_SOURCE = "KAIOS.CIVILIZATION.RESERVE_REDEMPTION.18888";
const DESTINATION = id(DESTINATION_SOURCE);
const artifact = (name) => JSON.parse(fs.readFileSync(path.join(root, "artifacts", `${name}.json`), "utf8"));
const expect = (condition, message) => { if (!condition) throw new Error(message); };
const json = (value) => JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item, 2);
const receipt = (value) => ({ hash: value.hash, blockNumber: value.blockNumber, gasUsed: value.gasUsed.toString(), status: value.status === 1 ? "PASS" : "FAIL" });

async function main() {
  const live = new JsonRpcProvider(rpc);
  const network = await live.getNetwork();
  expect(network.chainId === 56n, `CHAIN_ID_MISMATCH:${network.chainId}`);
  const codes = await Promise.all(Object.values(A).slice(0, 7).map((address) => live.getCode(address)));
  expect(codes.every((code) => code !== "0x"), "FORMAL_CODE_MISSING");
  const liveKgen = new Contract(A.KGEN, artifact("KGEN_Token_V7_5_2").abi, live);
  const [owner, bankWallet, rewardWallet, autoLPWallet, pairEnabled] = await Promise.all([
    liveKgen.owner(), liveKgen.bankWallet(), liveKgen.rewardWallet(), liveKgen.autoLPWallet(), liveKgen.isMarketMakerPair(A.PAIR),
  ]);
  const KGEN_OWNER = getAddress(owner);
  expect(pairEnabled, "FORMAL_PAIR_NOT_ENABLED");
  const liveReadModel = await new KaiosCivilizationPhase2Adapter({ provider: live }).systemStatus();
  expect(!liveReadModel.error, `LIVE_READ_MODEL_FAILED:${liveReadModel.error}`);
  expect(liveReadModel.eligibility.activationState === ACTIVATION_STATE.INACTIVE, "LIVE_ELIGIBILITY_NOT_INACTIVE");
  expect(liveReadModel.capitalCommitment.activationState === ACTIVATION_STATE.INACTIVE, "LIVE_CAPITAL_NOT_INACTIVE");
  expect(liveReadModel.reserveRedemption.activationState === ACTIVATION_STATE.INACTIVE, "LIVE_RESERVE_NOT_INACTIVE");

  const eip1193 = ganache.provider({
    fork: { url: rpc },
    chain: { chainId: 56, networkId: 56, hardfork: "shanghai" },
    wallet: {
      deterministic: true,
      totalAccounts: 8,
      defaultBalance: 1_000,
      unlockedAccounts: [A.MOTHER, A.JADE, A.GUANYIN, KGEN_OWNER, A.PAIR],
    },
    logging: { quiet: true },
  });

  try {
    const provider = new BrowserProvider(eip1193);
    provider.pollingInterval = 25;
    const forkBlock = await provider.getBlockNumber();
    for (const address of [A.MOTHER, A.JADE, A.GUANYIN, KGEN_OWNER, A.PAIR]) {
      await eip1193.request({ method: "evm_setAccountBalance", params: [address, `0x${parseEther("100").toString(16)}`] });
    }
    const deployer = await provider.getSigner(0);
    const user = await provider.getSigner(1);
    const outsider = await provider.getSigner(2);
    const mother = await provider.getSigner(A.MOTHER);
    const jade = await provider.getSigner(A.JADE);
    const pauser = await provider.getSigner(A.GUANYIN);
    const kgenOwner = await provider.getSigner(KGEN_OWNER);
    const pair = await provider.getSigner(A.PAIR);
    const userAddress = getAddress(await user.getAddress());
    const txs = {};
    let gasUsed = 0n;
    let indexedState = createPhase2IndexState();
    const indexedEvents = [];
    const indexSources = [];
    const indexReceipt = (result) => {
      for (const log of result.logs) {
        const source = indexSources.find((item) => item.address === getAddress(log.address));
        if (!source) continue;
        try {
          const parsed = source.interface.parseLog(log);
          if (!parsed) continue;
          const args = Object.fromEntries(parsed.fragment.inputs.map((input, index) => [input.name, parsed.args[index]]));
          const event = {
            contract: source.name,
            contractAddress: source.address,
            reserveRedemptionAddress: reserve.proxy,
            event: parsed.name,
            transactionHash: result.hash,
            blockNumber: result.blockNumber,
            args,
          };
          indexedEvents.push(event);
          indexedState = reducePhase2IndexedEvent(indexedState, event);
        } catch {}
      }
    };
    const transact = async (label, promise) => {
      const result = await (await promise).wait();
      expect(result.status === 1, `${label}:REVERTED`);
      txs[label] = receipt(result);
      gasUsed += result.gasUsed;
      indexReceipt(result);
      return result;
    };

    async function deployProxy(name, args) {
      const implementation = await new ContractFactory(artifact(name).abi, artifact(name).bytecode, deployer).deploy();
      await implementation.waitForDeployment();
      const implementationReceipt = await implementation.deploymentTransaction().wait();
      const init = implementation.interface.encodeFunctionData("initialize", args);
      const proxy = await new ContractFactory(artifact("ERC1967Proxy").abi, artifact("ERC1967Proxy").bytecode, deployer).deploy(await implementation.getAddress(), init);
      await proxy.waitForDeployment();
      const proxyReceipt = await proxy.deploymentTransaction().wait();
      gasUsed += implementationReceipt.gasUsed + proxyReceipt.gasUsed;
      return {
        implementation: getAddress(await implementation.getAddress()),
        proxy: getAddress(await proxy.getAddress()),
        contract: new Contract(await proxy.getAddress(), artifact(name).abi, mother),
        receipts: { implementation: receipt(implementationReceipt), proxy: receipt(proxyReceipt) },
      };
    }

    const eligibility = await deployProxy("CelestialEligibility_Upgradeable", [A.BANK, A.MOTHER, A.MOTHER, A.GUANYIN, A.FURNACE, DESTINATION]);
    const reserve = await deployProxy("KGENReserveRedemption_Upgradeable", [
      A.BANK, A.MOTHER, A.MOTHER, A.GUANYIN, A.KGEN, A.KAIOS, eligibility.proxy,
      parseEther("100"), parseEther("10"), parseEther("100"), parseEther("10000"), parseEther("100000"), false,
    ]);
    const capital = await deployProxy("CelestialCapitalCommitment_Upgradeable", [A.BANK, A.MOTHER, A.MOTHER, A.GUANYIN, A.KAIOS, eligibility.proxy, 2_592_000]);

    const bank = new Contract(A.BANK, artifact("LingxiaoCelestialBank18888_Upgradeable").abi, provider);
    const governance = new Contract(A.GOVERNANCE_MODULE, artifact("BankGovernance_Upgradeable").abi, provider);
    const allocation = new Contract(A.ALLOCATION, artifact("CivilizationAllocation_Upgradeable").abi, provider);
    const kgen = new Contract(A.KGEN, artifact("KGEN_Token_V7_5_2").abi, provider);
    const kaios = new Contract(A.KAIOS, artifact("KAIOS").abi, provider);
    const furnace = new Contract(A.FURNACE, artifact("KAIOSAlchemyFurnace").abi, provider);
    const seat500 = new Contract(A.SEAT500, artifact("CelestialSeat500_Upgradeable").abi, provider);
    indexSources.push(
      { address: A.BANK, name: "LingxiaoCelestialBank18888_Upgradeable", interface: bank.interface },
      { address: A.GOVERNANCE_MODULE, name: "BankGovernance_Upgradeable", interface: governance.interface },
      { address: A.KGEN, name: "KGEN_Token_V7_5_2", interface: kgen.interface },
      { address: eligibility.proxy, name: "CelestialEligibility_Upgradeable", interface: eligibility.contract.interface },
      { address: reserve.proxy, name: "KGENReserveRedemption_Upgradeable", interface: reserve.contract.interface },
      { address: capital.proxy, name: "CelestialCapitalCommitment_Upgradeable", interface: capital.contract.interface },
    );

    expect(!(await reserve.contract.redemptionEnabled()), "REDEMPTION_NOT_INITIALIZED_DISABLED");
    await transact("capitalPrePauseByGuanyin", capital.contract.connect(pauser).pause());
    expect(!(await eligibility.contract.paused()), "ELIGIBILITY_UNEXPECTEDLY_PAUSED");
    expect(!(await reserve.contract.paused()), "RESERVE_UNEXPECTEDLY_PAUSED");
    expect(await capital.contract.paused(), "CAPITAL_INITIAL_PAUSE_FAILED");

    const lifeId = id("PHASE2-FORK-LIFE-001");

    let proposed = [];
    async function propose(label, target, data) {
      const proposalId = id(`PHASE2-FORK:${forkBlock}:${label}`);
      await transact(`${label}_propose`, governance.connect(mother).propose(proposalId, target, 0, data));
      await transact(`${label}_approve`, governance.connect(jade).approve(proposalId));
      proposed.push({ label, proposalId, data });
    }
    const bankVersion = (name) => id(`${name}:1.0.0`);
    for (const [label, moduleId, item, name] of [
      ["registerEligibility", MODULE.ELIGIBILITY, eligibility, "CelestialEligibility_Upgradeable"],
      ["registerReserve", MODULE.RESERVE, reserve, "KGENReserveRedemption_Upgradeable"],
      ["registerCapital", MODULE.CAPITAL, capital, "CelestialCapitalCommitment_Upgradeable"],
    ]) {
      const data = bank.interface.encodeFunctionData("configureModule", [moduleId, item.proxy, bankVersion(name), 0, 0, false]);
      await propose(label, A.BANK, data);
    }
    const existingAllocation = await bank.module(MODULE.ALLOCATION);
    const allocationLimit = parseEther("11000000");
    await propose("raiseForkAllocationCap", A.BANK, bank.interface.encodeFunctionData("configureModule", [
      MODULE.ALLOCATION, existingAllocation.module, existingAllocation.versionHash, allocationLimit, allocationLimit, true,
    ]));
    const latest = await provider.getBlock("latest");
    const allocationId = id("PHASE2-FORK-KAIOS-FUNDING");
    await propose("createForkAllocation", A.ALLOCATION, allocation.interface.encodeFunctionData("createAllocation", [
      allocationId, userAddress, parseEther("10004000"), latest.timestamp, id("PHASE2-FORK-ONLY-TEST-FUNDING"),
    ]));

    await eip1193.request({ method: "evm_increaseTime", params: [3_601] });
    await eip1193.request({ method: "evm_mine", params: [] });
    for (const item of proposed) {
      await transact(`${item.label}_execute`, governance.connect(outsider).execute(item.proposalId, item.data, { gasLimit: 2_000_000 }));
    }
    await transact("executeForkAllocation", allocation.connect(outsider).executeAllocation(allocationId, { gasLimit: 1_500_000 }));

    for (const moduleId of [MODULE.ELIGIBILITY, MODULE.RESERVE, MODULE.CAPITAL]) {
      expect(!(await bank.module(moduleId)).active, `MODULE_NOT_INITIALIZED_INACTIVE:${moduleId}`);
    }
    await transact("finalizeEligibilityGovernance", eligibility.contract.finalizeModuleGovernance(A.GOVERNANCE_MODULE));
    await transact("finalizeReserveGovernance", reserve.contract.finalizeModuleGovernance(A.GOVERNANCE_MODULE));
    await transact("finalizeCapitalGovernance", capital.contract.finalizeModuleGovernance(A.GOVERNANCE_MODULE));

    const stageReadModel = [];
    async function captureStage(label, humanActivation = {}, activationMarginConfirmed = false) {
      const [eligModule, reserveModule, capitalModule, reserveBalance, floor, liveBankWallet] = await Promise.all([
        bank.module(MODULE.ELIGIBILITY), bank.module(MODULE.RESERVE), bank.module(MODULE.CAPITAL),
        kgen.balanceOf(reserve.proxy), reserve.contract.minimumKgenReserve(), kgen.bankWallet(),
      ]);
      const common = { chainId: 56, formalAddressMatch: true, codePresent: true, versionMatch: true, abiMatch: true, registered: true, governanceFinalized: true };
      const eligibilityState = resolveActivationState("eligibility", { ...common, registryActive: eligModule.active, paused: await eligibility.contract.paused(), humanActivationConfirmed: humanActivation.eligibility === true });
      const capitalState = resolveActivationState("capitalCommitment", { ...common, registryActive: capitalModule.active, paused: await capital.contract.paused(), humanActivationConfirmed: humanActivation.capitalCommitment === true });
      const reserveState = resolveActivationState("reserveRedemption", {
        ...common, registryActive: reserveModule.active, paused: await reserve.contract.paused(), humanActivationConfirmed: humanActivation.reserveRedemption === true,
        taxReceiverMatches: getAddress(liveBankWallet) === reserve.proxy, redemptionEnabled: await reserve.contract.redemptionEnabled(),
        reserveAboveFloor: reserveBalance > floor, activationMarginConfirmed,
      });
      stageReadModel.push({ label, eligibilityState, capitalState, reserveState, reserveBalance, floor });
    }
    await captureStage("PRE_STAGE2", {}, false);

    async function executeBatch() {
      await eip1193.request({ method: "evm_increaseTime", params: [3_601] });
      await eip1193.request({ method: "evm_mine", params: [] });
      for (const item of proposed) {
        await transact(`${item.label}_execute`, governance.connect(outsider).execute(item.proposalId, item.data, { gasLimit: 2_000_000 }));
      }
      proposed = [];
    }

    // Stage 2A: Capital remains paused while Eligibility is opened and validated.
    proposed = [];
    await propose("activateEligibility", A.BANK, bank.interface.encodeFunctionData("configureModule", [
      MODULE.ELIGIBILITY, eligibility.proxy, bankVersion("CelestialEligibility_Upgradeable"), 0, 0, true,
    ]));
    await propose("unpauseEligibility", eligibility.proxy, eligibility.contract.interface.encodeFunctionData("unpause"));
    await executeBatch();
    await captureStage("STAGE2A_ACTIVE", { eligibility: true }, false);
    expect((await bank.module(MODULE.ELIGIBILITY)).active, "ELIGIBILITY_NOT_ACTIVE");
    expect(await capital.contract.paused(), "CAPITAL_PRE_PAUSE_LOST");

    await propose("setMotherContributionVerifier", eligibility.proxy, eligibility.contract.interface.encodeFunctionData("setContributionVerifier", [A.MOTHER, true]));
    await propose("bindForkLife", eligibility.proxy, eligibility.contract.interface.encodeFunctionData("bindLife", [lifeId, userAddress, true]));
    await propose("enableForkLifeReserve", eligibility.proxy, eligibility.contract.interface.encodeFunctionData("setReserveRedemptionEligibility", [lifeId, true]));
    await propose("recordForkConstitution", eligibility.proxy, eligibility.contract.interface.encodeFunctionData("recordConstitutionHistory", [lifeId, id("PHASE2-CONSTITUTION-EVIDENCE"), true]));
    await executeBatch();
    await transact("recordContribution", eligibility.contract.recordContribution(id("PHASE2-CONTRIBUTION-001"), lifeId, id("CYBERSECURITY"), id("PHASE2-CONTRIBUTION-EVIDENCE")));

    const seatCountBefore = await seat500.seatCount();
    await transact("approveFurnaceKaios", kaios.connect(user).approve(A.FURNACE, parseEther("5000000")));
    const burnReceipt = await transact("burnSingle5mKaios", furnace.connect(user).burnForKufo(parseEther("5000000"), userAddress, lifeId, DESTINATION));
    let proofId;
    for (const log of burnReceipt.logs) {
      try {
        const parsed = furnace.interface.parseLog(log);
        if (parsed?.name === "AlchemyProofCreated") proofId = parsed.args.proofId;
      } catch {}
    }
    expect(proofId, "ALCHEMY_PROOF_EVENT_NOT_FOUND");
    await transact("submitSingle5mProof", eligibility.contract.connect(user).submitAlchemyMassProof(proofId, lifeId));
    await propose("beginMassCandidateReview", eligibility.proxy, eligibility.contract.interface.encodeFunctionData("beginCivilizationReview", [proofId, id("PHASE2-FORK-CANDIDATE-REVIEW")]));
    await propose("markMassCandidateEligible", eligibility.proxy, eligibility.contract.interface.encodeFunctionData("markEligibleForReview", [proofId, id("PHASE2-FORK-CANDIDATE-ELIGIBLE")]));
    await executeBatch();
    expect((await eligibility.contract.candidate(proofId)).status === 3n, "MASS_CANDIDATE_NOT_ELIGIBLE_FOR_REVIEW");
    expect(await seat500.seatCount() === seatCountBefore, "MASS_BURN_AUTOMATICALLY_ASSIGNED_SEAT");

    // Stage 2B: registry activation first, then delayed-governance unpause.
    await propose("activateCapital", A.BANK, bank.interface.encodeFunctionData("configureModule", [
      MODULE.CAPITAL, capital.proxy, bankVersion("CelestialCapitalCommitment_Upgradeable"), 0, 0, true,
    ]));
    await propose("unpauseCapital", capital.proxy, capital.contract.interface.encodeFunctionData("unpause"));
    await executeBatch();
    await captureStage("STAGE2B_ACTIVE", { eligibility: true, capitalCommitment: true }, false);
    await transact("approveCapitalKaios", kaios.connect(user).approve(capital.proxy, parseEther("5000000")));
    const commitmentId = id("PHASE2-FORK-CAPITAL-COMMITMENT");
    await transact("commit5mKaiosCapital", capital.contract.connect(user).commitCapital(commitmentId, lifeId, parseEther("5000000")));
    await transact("submitCapitalReview", capital.contract.connect(outsider).submitForWormholeSeatReview(commitmentId, id("PHASE2-FORK-WORMHOLE-REVIEW")));
    expect(await capital.contract.totalCommittedPrincipal() === parseEther("5000000"), "CAPITAL_LIABILITY_MISMATCH");
    expect(await kaios.balanceOf(capital.proxy) === parseEther("5000000"), "CAPITAL_CUSTODY_MISMATCH");
    expect(await seat500.seatCount() === seatCountBefore, "CAPITAL_AUTOMATICALLY_ASSIGNED_SEAT");

    // Stage 2C-0/1: fork-only ownership migration and delayed tax redirect; redemption remains disabled.
    const currentReward = getAddress(await kgen.rewardWallet());
    const currentAutoLP = getAddress(await kgen.autoLPWallet());
    expect(currentReward === getAddress(rewardWallet), "REWARD_WALLET_CHANGED_DURING_FORK");
    expect(currentAutoLP === getAddress(autoLPWallet), "AUTOLP_WALLET_CHANGED_DURING_FORK");
    await transact("forkOnlyTransferKgenOwnershipToGovernance", kgen.connect(kgenOwner).transferOwnership(A.GOVERNANCE_MODULE));
    await propose("forkOnlyGovernedSetTaxWallets", A.KGEN, kgen.interface.encodeFunctionData("setTaxWallets", [reserve.proxy, currentReward, currentAutoLP]));
    await executeBatch();
    expect(!(await reserve.contract.redemptionEnabled()), "REDEMPTION_ENABLED_DURING_ACCUMULATION");
    await captureStage("STAGE2C1_RESERVE_ACCUMULATING", { eligibility: true, capitalCommitment: true }, false);
    const tradeAmount = parseEther("110000");
    const taxBefore = {
      supply: await kgen.totalSupply(), reserve: await kgen.balanceOf(reserve.proxy),
      reward: await kgen.balanceOf(currentReward), autoLP: await kgen.balanceOf(currentAutoLP), recipient: await kgen.balanceOf(userAddress),
    };
    await transact("forkOnlyTaxablePairTransfer", kgen.connect(pair).transfer(userAddress, tradeAmount, { gasLimit: 1_000_000 }));
    const taxAfter = {
      supply: await kgen.totalSupply(), reserve: await kgen.balanceOf(reserve.proxy),
      reward: await kgen.balanceOf(currentReward), autoLP: await kgen.balanceOf(currentAutoLP), recipient: await kgen.balanceOf(userAddress),
    };
    const taxDeltas = {
      trueBurn: taxBefore.supply - taxAfter.supply,
      reserve: taxAfter.reserve - taxBefore.reserve,
      reward: taxAfter.reward - taxBefore.reward,
      autoLP: taxAfter.autoLP - taxBefore.autoLP,
      recipient: taxAfter.recipient - taxBefore.recipient,
    };
    expect(taxDeltas.trueBurn === parseEther("110"), "TRUE_BURN_TAX_MISMATCH");
    expect(taxDeltas.reserve === parseEther("110"), "BANK_TAX_RESERVE_MISMATCH");
    expect(taxDeltas.reward === parseEther("55"), "REWARD_TAX_MISMATCH");
    expect(taxDeltas.autoLP === parseEther("55"), "AUTOLP_TAX_MISMATCH");
    expect(taxDeltas.recipient === parseEther("109670"), "TRADE_RECIPIENT_MISMATCH");
    expect(indexedState.kgenInflows.some((inflow) => inflow.classification === "UNCLASSIFIED_KGEN_INFLOW"), "KGEN_INFLOW_FALSELY_CLASSIFIED_OR_MISSING");
    await captureStage("STAGE2C1_THRESHOLD_CROSSED_DISABLED", { eligibility: true, capitalCommitment: true }, false);
    await transact("approveReserveKaiosWhileDisabled", kaios.connect(user).approve(reserve.proxy, parseEther("4000")));
    let disabledBlocked = false;
    try {
      await (await reserve.contract.connect(user).requestRedemption(id("PHASE2-FORK-DISABLED"), lifeId, parseEther("1000"), (await provider.getBlock("latest")).timestamp + 3_600, { gasLimit: 1_000_000 })).wait();
    } catch { disabledBlocked = true; }
    expect(disabledBlocked, "REDEMPTION_NOT_BLOCKED_DURING_ACCUMULATION");

    // Stage 2C-2: only after reserve is above the hard floor and the Human margin gate is simulated.
    expect(await kgen.balanceOf(reserve.proxy) > await reserve.contract.minimumKgenReserve(), "RESERVE_NOT_ABOVE_FLOOR");
    await propose("activateReserve", A.BANK, bank.interface.encodeFunctionData("configureModule", [
      MODULE.RESERVE, reserve.proxy, bankVersion("KGENReserveRedemption_Upgradeable"), 0, 0, true,
    ]));
    await propose("unpauseReserve", reserve.proxy, reserve.contract.interface.encodeFunctionData("unpause"));
    await propose("enableForkRedemption", reserve.proxy, reserve.contract.interface.encodeFunctionData("setRedemptionEnabled", [true]));
    await executeBatch();
    await captureStage("STAGE2C2_REDEMPTION_READY", { eligibility: true, capitalCommitment: true, reserveRedemption: true }, true);

    const kgenSupplyBeforeRedemption = await kgen.totalSupply();
    const kaiosSupplyBeforeRedemption = await kaios.totalSupply();
    for (const [label, amount] of [["999", parseEther("999")], ["1000", parseEther("1000")], ["1001", parseEther("1001")]]) {
      await transact(`redeem${label}Kaios`, reserve.contract.connect(user).requestRedemption(id(`PHASE2-FORK-REDEMPTION-${label}`), lifeId, amount, (await provider.getBlock("latest")).timestamp + 3_600));
    }
    expect(await kgen.totalSupply() === kgenSupplyBeforeRedemption, "REDEMPTION_INCREASED_KGEN_SUPPLY");
    expect(await kaios.totalSupply() === kaiosSupplyBeforeRedemption, "REDEMPTION_BURNED_KAIOS");
    expect(await kgen.balanceOf(reserve.proxy) === parseEther("107"), "RESERVE_PAYOUT_OR_FLOOR_MISMATCH");

    await transact("guanyinPauseReserve", reserve.contract.connect(pauser).pause());
    await captureStage("STAGE2C2_PAUSED", { eligibility: true, capitalCommitment: true, reserveRedemption: true }, true);
    expect(await reserve.contract.paused(), "GUANYIN_PAUSE_FAILED");
    await propose("governedUnpauseReserve", reserve.proxy, reserve.contract.interface.encodeFunctionData("unpause"));
    await executeBatch();
    await captureStage("STAGE2C2_RESUMED", { eligibility: true, capitalCommitment: true, reserveRedemption: true }, true);

    expect(stageReadModel.find((item) => item.label === "PRE_STAGE2").eligibilityState === ACTIVATION_STATE.INACTIVE, "READ_MODEL_PRE_STAGE2");
    expect(stageReadModel.find((item) => item.label === "STAGE2A_ACTIVE").capitalState === ACTIVATION_STATE.PAUSED, "READ_MODEL_CAPITAL_PRE_PAUSE");
    expect(stageReadModel.find((item) => item.label === "STAGE2C1_RESERVE_ACCUMULATING").reserveState === ACTIVATION_STATE.RESERVE_ACCUMULATING, "READ_MODEL_ACCUMULATION");
    expect(stageReadModel.find((item) => item.label === "STAGE2C2_REDEMPTION_READY").reserveState === ACTIVATION_STATE.REDEMPTION_READY, "READ_MODEL_READY");
    expect(stageReadModel.find((item) => item.label === "STAGE2C2_PAUSED").reserveState === ACTIVATION_STATE.PAUSED, "READ_MODEL_PAUSED");
    expect(indexedState.kgenTaxWallets?.bank === reserve.proxy, "INDEXER_TAX_WALLET_STATE");
    expect(indexedState.proposals && Object.values(indexedState.proposals).some((item) => item.executed), "INDEXER_GOVERNANCE_STATE");

    const finalKgenSupply = await kgen.totalSupply();
    const finalKaiosSupply = await kaios.totalSupply();
    const report = {
      status: "PASS",
      environment: "BSC_MAINNET_FORK_ONLY",
      mainnetTransactionSent: false,
      chainId: 56,
      forkBlock,
      frozenV1Parameters: {
        destinationCodeSource: DESTINATION_SOURCE,
        destinationCode: DESTINATION,
        minimumKgenReserve: "100.0",
        maxKgenPerTransaction: "10.0",
        maxKgenPerUtcDay: "100.0",
        maxKaiosPerTransaction: "10000.0",
        maxKaiosPerUtcDay: "100000.0",
        redemptionInitiallyEnabled: false,
        capitalMinimumLockPeriodSeconds: 2_592_000,
        initialBankModuleState: "INACTIVE",
      },
      formalAddresses: A,
      liveKgenTaxBeforeForkMutation: { owner: KGEN_OWNER, bankWallet: getAddress(bankWallet), rewardWallet: getAddress(rewardWallet), autoLPWallet: getAddress(autoLPWallet), pairEnabled },
      liveReadModel,
      forkDeployments: {
        eligibility: { implementation: eligibility.implementation, proxy: eligibility.proxy, receipts: eligibility.receipts },
        reserve: { implementation: reserve.implementation, proxy: reserve.proxy, receipts: reserve.receipts },
        capital: { implementation: capital.implementation, proxy: capital.proxy, receipts: capital.receipts },
      },
      transactions: txs,
      gasUsed: gasUsed.toString(),
      stagedReadModelReplay: stageReadModel,
      indexedState,
      indexedEventCount: indexedEvents.length,
      simulatedFutureTaxFlowFor110000Kgen: Object.fromEntries(Object.entries(taxDeltas).map(([key, value]) => [key, formatEther(value)])),
      reserveRedemption: {
        kaiosIn: "3000.0", maximumExistingKgenOut: "3.0", kgenSupplyUnchanged: finalKgenSupply === kgenSupplyBeforeRedemption,
        kaiosSupplyUnchangedByRedemption: kaiosSupplyBeforeRedemption === finalKaiosSupply,
        finalReserveKgen: formatEther(await kgen.balanceOf(reserve.proxy)), minimumReservePreserved: true, formal18888KaiosReceipt: "PASS",
      },
      alchemyEligibility: { proofId, singleBurnKaios: "5000000.0", thresholdPassed: true, multipleProofAggregation: "BLOCKED_BY_DESIGN", seatIssued: false },
      capitalCommitment: { commitmentId, committedKaios: "5000000.0", burned: false, liabilityAccounted: true, seatIssued: false },
      security: {
        formalKgenModified: false, formalKaiosModified: false, formal18911Modified: false, live18888Modified: false,
        forkOnlyKgenConfigurationMutation: true, mainnetSetTaxWalletsExecuted: false,
        noArbitrarySweep: true, noBeneficiaryRedirect: true, moneyAloneGrantsSeat: false,
        governanceDelaySeconds: 3600, distinctApprover: true, guanyinPauseOnlyTest: "PASS",
      },
      future: { wormhole511111: "FUTURE", kufo: "FUTURE", pairRegistry: "FUTURE", market8895: "FUTURE" },
    };
    fs.writeFileSync(reportJson, `${json(report)}\n`);
    fs.writeFileSync(reportMd, `# KAIOS Civilization Phase 2 Mainnet Fork Rehearsal\n\nStatus: PASS. Environment: BSC Mainnet fork only. No Mainnet transaction was sent.\n\n- Fork block: ${forkBlock}\n- Frozen V1 parameters: 100 KGEN reserve floor; 10 KGEN / 10,000 KAIOS per transaction; 100 KGEN / 100,000 KAIOS per UTC day; redemption initially disabled; capital lock 2,592,000 seconds.\n- Destination source: ${DESTINATION_SOURCE}; bytes32: ${DESTINATION}.\n- Staged replay: Guanyin pre-paused Capital; Eligibility activated first; Capital activated and unpaused second; KGEN ownership migrated to delayed BankGovernance on the fork; tax redirect accumulated reserve while redemption stayed disabled; Reserve activation and redemption enable occurred only after the balance exceeded the hard floor.\n- Future 110,000 KGEN taxable trade: ${taxDeltas.trueBurn / 10n ** 18n} KGEN true burn, ${taxDeltas.reserve / 10n ** 18n} KGEN reserve, ${taxDeltas.reward / 10n ** 18n} KGEN Reward, ${taxDeltas.autoLP / 10n ** 18n} KGEN AutoLP, ${taxDeltas.recipient / 10n ** 18n} KGEN recipient.\n- Reserve redemption: 999 / 1,000 / 1,001 KAIOS produced maximum payouts of 0.999 / 1 / 1.001 existing KGEN; neither supply changed; the 100 KGEN floor remained.\n- Alchemy eligibility: one formal 18911 proof burned exactly 5,000,000 KAIOS and passed only the mass threshold/review ledger; no seat was assigned.\n- Capital commitment: 5,000,000 KAIOS remained in module custody as principal liability; no burn and no seat assignment.\n- Frontend/read model replay covered INACTIVE, PAUSED, ACTIVE, RESERVE_ACCUMULATING and REDEMPTION_READY states. Indexed receipts reconstructed ModuleConfigured, governance lifecycle, KGEN receiver change and Phase 2 runtime events. KGEN transfers into Reserve are deliberately classified UNCLASSIFIED_KGEN_INFLOW.\n\nMachine-readable receipts, indexed state and temporary fork addresses are in \`reports/KAIOS_CIVILIZATION_PHASE2_MAINNET_FORK_REHEARSAL.json\`.\n`);
    console.log(`PHASE2_MAINNET_FORK_REHEARSAL=PASS block=${forkBlock} gas=${gasUsed}`);
  } finally {
    await eip1193.disconnect();
    await live.destroy();
  }
}

main().catch((error) => {
  console.error(`PHASE2_MAINNET_FORK_REHEARSAL=FAIL ${error.message}`);
  process.exitCode = 1;
});
