import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import ganache from "ganache";
import {
  BrowserProvider,
  Contract,
  ContractFactory,
  Interface,
  JsonRpcProvider,
  ZeroHash,
  formatEther,
  formatUnits,
  getAddress,
  getCreateAddress,
  id,
  parseEther,
} from "ethers";

const root = path.resolve(import.meta.dirname, "..");
const repo = path.resolve(root, "..");
const reportDirectory = path.join(root, "reports", "mainnet-pre-sign");
const publicRpc = process.env.BSC_MAINNET_RPC_URL ?? "https://bsc-dataseed1.bnbchain.org";

const FORMAL_KGEN = getAddress("0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be");
const FORMAL_11520 = getAddress("0xd0605F4EF10e5C1438F11AF9edc36926769239d6");
const LEGACY_HEART = getAddress("0xB016D4d8f1aED1339101b30722cad6dbA9B8C972");
const LEGACY_TREASURY_8888 = getAddress("0x2caE692310b5A89C44c4E09Ba9F26385359d1Aa9");
const FORMAL_GOVERNANCE = getAddress("0xCd60BF474e691F2484950a0276Eaf507616Ca4b9");
const DEPLOYMENT_SIGNER = getAddress("0xb3C54ca96De0dED4Ca0151F629ff9781506ba261");
const TECHNICAL_MINIMUM_DELAY = 3_600;
const KGEN_GENESIS_SUPPLY = 72_000_000n * 10n ** 18n;
const KAIOS_PER_KGEN = 1_000n;
const FORK_CELESTIAL_SALARY_BASE = 10n * 10n ** 18n;
const FORK_SALARY_WEIGHT_SCALE = 1_000_000n;
const FORK_MODULE_PER_TRANSACTION_LIMIT = 10_000n * 10n ** 18n;
const FORK_MODULE_DAILY_LIMIT = 100_000n * 10n ** 18n;
const EXPECTED_BANK_CREATION_HASH = "0xff5594efa2cd283aed2cab9f27634c06a4da3d2737c645addfdc54f53757d43b";
const EXPECTED_BANK_RUNTIME_HASH = "0xcfe00d93cf874129e6d01003f2fb265128d469dd350e5a5cab79beafb518f00c";

const artifact = (name) => JSON.parse(fs.readFileSync(path.join(root, "artifacts", `${name}.json`), "utf8"));
const receiptEvidence = (receipt) => ({
  transactionHash: receipt.hash,
  blockNumber: receipt.blockNumber,
  gasUsed: receipt.gasUsed.toString(),
  status: receipt.status === 1 ? "PASS" : "FAIL",
});
const units = (value) => ({ raw: value.toString(), decimal18: formatUnits(value, 18) });
const fail = (message) => { throw new Error(message); };
const expect = (condition, message) => { if (!condition) fail(message); };
const asJson = (value) => JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item, 2);

async function expectRevert(action, label) {
  try {
    const transaction = await action();
    const receipt = await transaction.wait();
    fail(`${label}:EXPECTED_REVERT_GOT_STATUS_${receipt.status}`);
  } catch (error) {
    if (String(error.message).includes("EXPECTED_REVERT_GOT_STATUS")) throw error;
    return {
      status: "PASS",
      transactionHash: error.receipt?.hash ?? error.transaction?.hash ?? null,
      blockNumber: error.receipt?.blockNumber ?? null,
      gasUsed: error.receipt?.gasUsed?.toString() ?? null,
      reason: "REVERTED_AS_REQUIRED",
    };
  }
}

async function main() {
  const compileEvidence = JSON.parse(fs.readFileSync(path.join(root, "reports", "SOLIDITY_COMPILE_EVIDENCE.json"), "utf8"));
  const bankCompile = compileEvidence.contracts.find((item) => item.contractName === "LingxiaoCelestialBank18888_Upgradeable");
  const economic8888Compile = compileEvidence.contracts.find(
    (item) => item.contractName === "GaolaozhuangCommercialBank8888_Upgradeable",
  );
  expect(bankCompile?.bytecodeHash === EXPECTED_BANK_CREATION_HASH, "BANK_CREATION_CODEHASH_MISMATCH");
  expect(bankCompile?.deployedBytecodeHash === EXPECTED_BANK_RUNTIME_HASH, "BANK_RUNTIME_CODEHASH_MISMATCH");
  expect(economic8888Compile?.deployedBytecodeBytes <= 24_576, "BANK_8888_EIP170_EXCEEDED");

  const live = new JsonRpcProvider(publicRpc);
  const liveNetwork = await live.getNetwork();
  expect(liveNetwork.chainId === 56n, `CHAIN_ID_MISMATCH:${liveNetwork.chainId}`);
  const [liveKgenCode, live11520Code, legacyCode] = await Promise.all([
    live.getCode(FORMAL_KGEN),
    live.getCode(FORMAL_11520),
    live.getCode(LEGACY_HEART),
  ]);
  expect(liveKgenCode !== "0x", "FORMAL_KGEN_HAS_NO_CODE");
  expect(live11520Code !== "0x", "FORMAL_11520_HAS_NO_CODE");
  expect(legacyCode !== "0x", "LEGACY_HEART_HAS_NO_CODE");
  const liveGasPrice = (await live.getFeeData()).gasPrice ?? 3_000_000_000n;
  const liveDeploymentSignerBalance = await live.getBalance(DEPLOYMENT_SIGNER);

  const eip1193 = ganache.provider({
    fork: { url: publicRpc },
    chain: { chainId: 56, networkId: 56, hardfork: "shanghai" },
    wallet: {
      deterministic: true,
      totalAccounts: 8,
      defaultBalance: 1_000,
      unlockedAccounts: [DEPLOYMENT_SIGNER, FORMAL_GOVERNANCE],
    },
    logging: { quiet: true },
  });

  try {
    const provider = new BrowserProvider(eip1193);
    provider.pollingInterval = 25;
    const network = await provider.getNetwork();
    expect(network.chainId === 56n, `FORK_CHAIN_ID_MISMATCH:${network.chainId}`);
    const forkBlockNumber = await provider.getBlockNumber();
    const forkBlock = await provider.getBlock(forkBlockNumber);
    const forkStartNonce = await provider.getTransactionCount(DEPLOYMENT_SIGNER);
    const kgenOwnerBefore = await new Contract(FORMAL_KGEN, ["function owner() view returns (address)"], provider).owner();
    expect(getAddress(kgenOwnerBefore) === DEPLOYMENT_SIGNER, "DEPLOYMENT_SIGNER_IS_NOT_KGEN_OWNER_AT_FORK");

    await eip1193.request({ method: "evm_setAccountBalance", params: [DEPLOYMENT_SIGNER, `0x${parseEther("1000").toString(16)}`] });
    await eip1193.request({ method: "evm_setAccountBalance", params: [FORMAL_GOVERNANCE, `0x${parseEther("1000").toString(16)}`] });
    const deployer = await provider.getSigner(DEPLOYMENT_SIGNER);
    const governance = await provider.getSigner(FORMAL_GOVERNANCE);
    const fixtureDeployer = await provider.getSigner(0);
    const distinctApprover = await provider.getSigner(1);
    const beneficiary = await provider.getSigner(2);
    const civilizationDestination = await provider.getSigner(3);
    const outsider = await provider.getSigner(4);
    const beneficiaryAddress = await beneficiary.getAddress();
    const civilizationDestinationAddress = await civilizationDestination.getAddress();
    const outsiderAddress = await outsider.getAddress();
    const distinctApproverAddress = await distinctApprover.getAddress();

    const forkOnlyBurnPair = await new ContractFactory(
      artifact("MockOrgan").abi,
      artifact("MockOrgan").bytecode,
      fixtureDeployer,
    ).deploy();
    await forkOnlyBurnPair.waitForDeployment();
    const forkOnlyBurnPairReceipt = await forkOnlyBurnPair.deploymentTransaction().wait();

    const deploymentActions = [];
    let deploymentGasUsed = 0n;
    async function deployCandidate(name, args = [], identity = name) {
      const nonce = forkStartNonce + deploymentActions.length;
      const predictedAddress = getCreateAddress({ from: DEPLOYMENT_SIGNER, nonce });
      const contract = await new ContractFactory(artifact(name).abi, artifact(name).bytecode, deployer).deploy(...args);
      await contract.waitForDeployment();
      const receipt = await contract.deploymentTransaction().wait();
      const actualAddress = getAddress(await contract.getAddress());
      expect(actualAddress === predictedAddress, `${identity}:PREDICTED_ADDRESS_MISMATCH`);
      deploymentGasUsed += receipt.gasUsed;
      deploymentActions.push({
        order: deploymentActions.length + 1,
        identity,
        contract: name,
        nonce,
        predictedAddress,
        forkAddress: actualAddress,
        actualMainnetAddress: null,
        autoBackfill: "SET_FROM_SUCCESSFUL_MAINNET_DEPLOYMENT_RECEIPT_CONTRACT_ADDRESS",
        ...receiptEvidence(receipt),
      });
      return contract;
    }

    async function deployProxyCandidate(name, initializeArgs, identity) {
      const implementation = await deployCandidate(name, [], `${identity}_IMPLEMENTATION`);
      const initializeData = implementation.interface.encodeFunctionData("initialize", initializeArgs);
      const proxy = await deployCandidate(
        "ERC1967Proxy",
        [await implementation.getAddress(), initializeData],
        `${identity}_PROXY`,
      );
      return {
        implementation,
        proxy,
        contract: new Contract(await proxy.getAddress(), artifact(name).abi, governance),
      };
    }

    const registry = await deployCandidate(
      "KAIOSOrganRegistry",
      [FORMAL_GOVERNANCE, TECHNICAL_MINIMUM_DELAY],
      "KAIOS_ORGAN_REGISTRY",
    );
    const bank = await deployProxyCandidate(
      "LingxiaoCelestialBank18888_Upgradeable",
      [FORMAL_GOVERNANCE, FORMAL_GOVERNANCE, FORMAL_KGEN],
      "LINGXIAO_18888_BANK",
    );
    const bankAddress = getAddress(await bank.contract.getAddress());
    const economic8888 = await deployProxyCandidate(
      "GaolaozhuangCommercialBank8888_Upgradeable",
      [FORMAL_GOVERNANCE, FORMAL_GOVERNANCE, FORMAL_KGEN, bankAddress, LEGACY_TREASURY_8888],
      "GAOLAOZHUANG_8888_COMMERCIAL_BANK",
    );
    const economic8888Address = getAddress(await economic8888.contract.getAddress());
    const moduleDefinitions = [
      ["CelestialSeat500_Upgradeable", [bankAddress, FORMAL_GOVERNANCE, FORMAL_GOVERNANCE, FORK_CELESTIAL_SALARY_BASE], "CELESTIAL_SEAT_500"],
      ["CivilizationAllocation_Upgradeable", [bankAddress, FORMAL_GOVERNANCE, FORMAL_GOVERNANCE], "CIVILIZATION_ALLOCATION"],
      ["EconomicRouter8888_Upgradeable", [bankAddress, FORMAL_GOVERNANCE, FORMAL_GOVERNANCE, economic8888Address], "ECONOMIC_ROUTER_8888"],
      ["ExchangeSettlement11520_Upgradeable", [bankAddress, FORMAL_GOVERNANCE, FORMAL_GOVERNANCE, FORMAL_11520], "EXCHANGE_SETTLEMENT_11520"],
      ["BankRiskController_Upgradeable", [bankAddress, FORMAL_GOVERNANCE, FORMAL_GOVERNANCE], "BANK_RISK_CONTROLLER"],
      ["BankGovernance_Upgradeable", [bankAddress, FORMAL_GOVERNANCE, FORMAL_GOVERNANCE, TECHNICAL_MINIMUM_DELAY], "BANK_GOVERNANCE"],
      ["BankMigration_Upgradeable", [bankAddress, FORMAL_GOVERNANCE, FORMAL_GOVERNANCE], "BANK_MIGRATION"],
    ];
    const modules = {};
    for (const [name, args, identity] of moduleDefinitions) {
      modules[name] = await deployProxyCandidate(name, args, identity);
    }
    const kaios = await deployCandidate("KAIOS", [FORMAL_KGEN, bankAddress, await registry.getAddress()], "KAIOS_TOKEN_CORE");
    const furnace = await deployCandidate(
      "KAIOSAlchemyFurnace",
      [await kaios.getAddress(), await registry.getAddress(), 86_400],
      "ALCHEMY_FURNACE_18911",
    );

    const transactions = { deployments: deploymentActions, forkOnlyFixtures: [receiptEvidence(forkOnlyBurnPairReceipt)] };
    let runtimeGasUsed = 0n;
    async function transact(label, promise) {
      const receipt = await (await promise).wait();
      runtimeGasUsed += receipt.gasUsed;
      transactions[label] = receiptEvidence(receipt);
      return receipt;
    }
    async function advanceForkTo(timestamp) {
      await eip1193.request({ method: "evm_setTime", params: [Number(timestamp) * 1_000] });
      await eip1193.request({ method: "evm_mine", params: [] });
    }

    await transact("bankBindKAIOS", bank.contract.bindKAIOS(await kaios.getAddress()));
    await transact("bank8888BindKAIOS", economic8888.contract.bindKAIOS(await kaios.getAddress()));
    const moduleIds = {
      CelestialSeat500_Upgradeable: id("KAIOS.BANK.MODULE.CELESTIAL_SEAT_500"),
      CivilizationAllocation_Upgradeable: id("KAIOS.BANK.MODULE.CIVILIZATION_ALLOCATION"),
      EconomicRouter8888_Upgradeable: id("KAIOS.BANK.MODULE.ECONOMIC_ROUTER_8888"),
      ExchangeSettlement11520_Upgradeable: id("KAIOS.BANK.MODULE.EXCHANGE_SETTLEMENT_11520"),
      BankRiskController_Upgradeable: id("KAIOS.BANK.MODULE.RISK_CONTROLLER"),
      BankGovernance_Upgradeable: id("KAIOS.BANK.MODULE.GOVERNANCE"),
      BankMigration_Upgradeable: id("KAIOS.BANK.MODULE.MIGRATION"),
    };
    for (const [name, item] of Object.entries(modules)) {
      const isPaymentModule = [
        "CelestialSeat500_Upgradeable",
        "CivilizationAllocation_Upgradeable",
        "EconomicRouter8888_Upgradeable",
        "ExchangeSettlement11520_Upgradeable",
      ].includes(name);
      await transact(
        `configureModule_${name}`,
        bank.contract.configureModule(
          moduleIds[name],
          await item.contract.getAddress(),
          id(`${name}:${name === "CelestialSeat500_Upgradeable" ? "2.0.0" : "1.0.0"}`),
          isPaymentModule ? FORK_MODULE_PER_TRANSACTION_LIMIT : 0n,
          isPaymentModule ? FORK_MODULE_DAILY_LIMIT : 0n,
          name !== "BankMigration_Upgradeable",
        ),
      );
    }
    await transact(
      "setRiskController",
      bank.contract.setRiskController(await modules.BankRiskController_Upgradeable.contract.getAddress()),
    );
    const governanceModule = modules.BankGovernance_Upgradeable.contract;
    await transact(
      "grantDistinctGovernanceApprover",
      governanceModule.grantRole(await governanceModule.APPROVER_ROLE(), distinctApproverAddress),
    );

    const organWiring = [
      [id("KAIOS.ORGAN.EXCHANGE_TREASURY.11520"), FORMAL_11520, "EXCHANGE_TREASURY_11520"],
      [id("KAIOS.ORGAN.LINGXIAO_BANK.18888"), bankAddress, "LINGXIAO_BANK_18888"],
      [id("KAIOS.ORGAN.KAIOS"), await kaios.getAddress(), "KAIOS"],
      [id("KAIOS.ORGAN.FURNACE.18911"), await furnace.getAddress(), "ALCHEMY_FURNACE_18911"],
    ];
    for (const [organId, address, label] of organWiring) {
      await transact(`registryBootstrap_${label}`, registry.connect(governance).bootstrapOrgan(organId, address));
    }
    await transact("registrySealBootstrap", registry.connect(governance).sealBootstrap());

    const kgen = new Contract(FORMAL_KGEN, [
      "function owner() view returns (address)",
      "function totalSupply() view returns (uint256)",
      "function balanceOf(address) view returns (uint256)",
      "function isTaxExempt(address) view returns (bool)",
      "function setTaxExempt(address,bool)",
      "function setMarketMakerPair(address,bool)",
      "function transfer(address,uint256) returns (bool)",
    ], provider);
    const supplyAtGenesisSettlement = await kgen.totalSupply();
    const historicalBurn = KGEN_GENESIS_SUPPLY - supplyAtGenesisSettlement;
    const expectedGenesisKaios = historicalBurn * KAIOS_PER_KGEN;
    const bankBalanceBeforeGenesis = await kaios.balanceOf(bankAddress);
    const genesisSettlementReceipt = await transact("settleWhiteHoleMassGenesis", kaios.connect(outsider).settleWhiteHoleMass());
    const bankBalanceAfterGenesis = await kaios.balanceOf(bankAddress);
    const actualGenesisKaios = bankBalanceAfterGenesis - bankBalanceBeforeGenesis;
    expect(actualGenesisKaios === expectedGenesisKaios, "GENESIS_MINT_MISMATCH");
    expect(await kaios.totalSupply() === expectedGenesisKaios, "GENESIS_TOTAL_SUPPLY_MISMATCH");
    expect(await kaios.settledKgenBurned() === historicalBurn, "GENESIS_SETTLED_BURN_MISMATCH");
    transactions.repeatGenesisSettlementRejected = await expectRevert(
      () => kaios.connect(outsider).settleWhiteHoleMass({ gasLimit: 500_000 }),
      "REPEAT_GENESIS_SETTLEMENT",
    );
    await transact("startGenesisEpoch", bank.contract.connect(outsider).startGenesisEpoch());

    const seats = modules.CelestialSeat500_Upgradeable.contract;
    await transact(
      "configureCelestialSeat1",
      seats.configureSeat(1, id("FORK-LIFE-SEAT-1"), id("FORK-TEMPLE-18888"), beneficiaryAddress, FORK_SALARY_WEIGHT_SCALE, 1),
    );
    const firstSalaryMonth = (await seats.calendarSeatState(1)).firstSalaryMonth;
    const firstSalaryMaturity = await seats.salaryMonthMaturityAt(firstSalaryMonth);
    await advanceForkTo(firstSalaryMaturity - 1n);
    expect(await seats.salaryMonthMatured(firstSalaryMonth) === false, "CELESTIAL_SALARY_MATURED_EARLY");
    await advanceForkTo(firstSalaryMaturity);
    expect(await seats.salaryMonthMatured(firstSalaryMonth) === true, "CELESTIAL_SALARY_NOT_MATURE_AT_BOUNDARY");
    const beneficiaryBeforeSalary = await kaios.balanceOf(beneficiaryAddress);
    await transact("claimCelestialSalary", seats.connect(outsider).claimCelestialSalary(1));
    const beneficiaryAfterSalary = await kaios.balanceOf(beneficiaryAddress);
    expect(
      beneficiaryAfterSalary - beneficiaryBeforeSalary === FORK_CELESTIAL_SALARY_BASE,
      "CELESTIAL_SALARY_DID_NOT_FLOW_EXACTLY",
    );

    const allocation = modules.CivilizationAllocation_Upgradeable.contract;
    const allocationId = id("FORK-CIVILIZATION-ALLOCATION");
    const currentBlock = await provider.getBlock("latest");
    await transact(
      "createCivilizationAllocation",
      allocation.createAllocation(
        allocationId,
        civilizationDestinationAddress,
        20n * 10n ** 18n,
        currentBlock.timestamp,
        id("FORK-CIVILIZATION-INFRASTRUCTURE"),
      ),
    );
    await transact("executeCivilizationAllocation", allocation.connect(outsider).executeAllocation(allocationId));
    expect(await kaios.balanceOf(civilizationDestinationAddress) === 20n * 10n ** 18n, "ALLOCATION_DID_NOT_FLOW");

    const router8888 = modules.EconomicRouter8888_Upgradeable.contract;
    await transact(
      "routeEconomicCapital8888",
      router8888.routeCapital(id("FORK-8888-ROUTE"), 30n * 10n ** 18n, id("FORK-8888-CAPITAL")),
    );
    expect(await kaios.balanceOf(economic8888Address) === 30n * 10n ** 18n, "8888_ROUTE_DID_NOT_FLOW");
    const payrollAccountId = id("FORK-8888-LIFE-ACCOUNT");
    await transact(
      "bank8888CreateLifeAccount",
      economic8888.contract.createAccount(
        payrollAccountId,
        id("FORK-8888-IDENTITY"),
        id("FORK-8888-LIFE"),
        ZeroHash,
        beneficiaryAddress,
        beneficiaryAddress,
        1,
      ),
    );
    const payrollEpoch = (await economic8888.contract.currentCalendarEpoch()) + 1n;
    const payrollId = id("FORK-8888-MONTHLY-PAYROLL");
    await transact(
      "bank8888ScheduleMonthlyPayroll",
      economic8888.contract.schedulePayroll(
        payrollId,
        id("FORK-8888-LIFE"),
        beneficiaryAddress,
        10n * 10n ** 18n,
        payrollEpoch,
      ),
    );
    const payrollClaimableAt = await economic8888.contract.epochClaimableAt(payrollEpoch);
    const beforePayrollBlock = await provider.getBlock("latest");
    await provider.send("evm_increaseTime", [Number(payrollClaimableAt) - beforePayrollBlock.timestamp - 1]);
    await provider.send("evm_mine", []);
    transactions.bank8888SalaryBeforeFifthRejected = await expectRevert(
      () => economic8888.contract.connect(outsider).claimSalary(payrollId, 2, payrollAccountId, { gasLimit: 1_000_000 }),
      "8888_SALARY_BEFORE_MONTHLY_FIFTH",
    );
    await provider.send("evm_increaseTime", [1]);
    await provider.send("evm_mine", []);
    await transact(
      "bank8888ClaimMonthlySalaryToSavings",
      economic8888.contract.connect(outsider).claimSalary(payrollId, 2, payrollAccountId),
    );
    expect((await economic8888.contract.account(payrollAccountId)).balance === 10n * 10n ** 18n, "8888_SAVINGS_CREDIT_FAILED");
    const commercePaymentId = id("FORK-8888-COMMERCE-PAYMENT");
    await transact(
      "bank8888CreateCommercialPayment",
      economic8888.contract.connect(beneficiary).createBusinessPayment(
        commercePaymentId,
        payrollAccountId,
        civilizationDestinationAddress,
        ZeroHash,
        5n * 10n ** 18n,
        3,
        1,
      ),
    );
    await transact(
      "bank8888ExecuteCommercialPayment",
      economic8888.contract.connect(outsider).executeBusinessPayment(commercePaymentId),
    );
    expect(await kaios.balanceOf(civilizationDestinationAddress) === 25n * 10n ** 18n, "8888_COMMERCE_DID_NOT_FLOW");
    transactions.bank8888PaymentReplayRejected = await expectRevert(
      () => economic8888.contract.connect(outsider).executeBusinessPayment(commercePaymentId, { gasLimit: 1_000_000 }),
      "8888_PAYMENT_REPLAY",
    );
    const settlement11520 = modules.ExchangeSettlement11520_Upgradeable.contract;
    const formal11520Before = await kaios.balanceOf(FORMAL_11520);
    await transact(
      "exchangeSettlement11520",
      settlement11520.settle(id("FORK-11520-SETTLEMENT"), 40n * 10n ** 18n, id("FORK-KAIOS-LISTING")),
    );
    const formal11520After = await kaios.balanceOf(FORMAL_11520);
    expect(formal11520After - formal11520Before === 40n * 10n ** 18n, "11520_SETTLEMENT_DID_NOT_FLOW");

    transactions.unauthorizedModulePaymentRejected = await expectRevert(
      () => bank.contract.connect(outsider).executeModulePayment(id("FORK-UNAUTHORIZED"), outsiderAddress, 10n ** 18n, { gasLimit: 500_000 }),
      "UNAUTHORIZED_MODULE_PAYMENT",
    );
    const withdrawInterface = new Interface(["function withdraw(address,uint256)"]);
    transactions.arbitraryOwnerWithdrawRejected = await expectRevert(
      () => governance.sendTransaction({
        to: bankAddress,
        data: withdrawInterface.encodeFunctionData("withdraw", [FORMAL_GOVERNANCE, 10n ** 18n]),
        gasLimit: 500_000,
      }),
      "ARBITRARY_OWNER_WITHDRAW",
    );
    await transact("pauseBank", bank.contract.pause());
    transactions.paymentWhilePausedRejected = await expectRevert(
      () => router8888.routeCapital(id("FORK-PAUSED-ROUTE"), 10n ** 18n, id("FORK-PAUSED"), { gasLimit: 500_000 }),
      "PAYMENT_WHILE_PAUSED",
    );
    await transact("unpauseBank", bank.contract.unpause());

    await transact(
      "configureCelestialSeat2ForRetry",
      seats.configureSeat(2, id("FORK-LIFE-SEAT-2"), id("FORK-TEMPLE-18888"), beneficiaryAddress, 10n * FORK_SALARY_WEIGHT_SCALE, 1),
    );
    const retrySalaryMonth = (await seats.calendarSeatState(2)).firstSalaryMonth;
    await advanceForkTo(await seats.salaryMonthMaturityAt(retrySalaryMonth));
    const retryCheckpointBefore = (await seats.calendarSeatState(2)).lastClaimedMonth;
    const risk = modules.BankRiskController_Upgradeable.contract;
    const balanceBeforeInsufficientClaim = await kaios.balanceOf(bankAddress);
    await transact(
      "setReserveToCurrentBalance",
      risk.applyRiskParameters(balanceBeforeInsufficientClaim, balanceBeforeInsufficientClaim),
    );
    transactions.insufficientSalaryRejected = await expectRevert(
      () => seats.connect(outsider).claimCelestialSalary(2, { gasLimit: 1_000_000 }),
      "INSUFFICIENT_SALARY",
    );
    const retryStateAfterFailure = await seats.seat(2);
    expect(
      (await seats.calendarSeatState(2)).lastClaimedMonth === retryCheckpointBefore,
      "FAILED_SALARY_ADVANCED_CHECKPOINT",
    );
    expect(retryStateAfterFailure.claimedAmount === 0n, "FAILED_SALARY_CHANGED_CLAIMED_AMOUNT");

    const governanceWasExempt = await kgen.isTaxExempt(FORMAL_GOVERNANCE);
    if (governanceWasExempt) {
      await transact("forkOnlyRemoveGovernanceKgenTaxExemption", kgen.connect(deployer).setTaxExempt(FORMAL_GOVERNANCE, false));
    }
    await transact("forkOnlyMarkBurnFixtureAsKgenPair", kgen.connect(deployer).setMarketMakerPair(await forkOnlyBurnPair.getAddress(), true));
    const supplyBeforeRefillBurn = await kgen.totalSupply();
    await transact(
      "forkOnlyKgenTaxableTransferForOneKgenBurn",
      kgen.connect(governance).transfer(await forkOnlyBurnPair.getAddress(), 1_000n * 10n ** 18n),
    );
    const supplyAfterRefillBurn = await kgen.totalSupply();
    expect(supplyBeforeRefillBurn - supplyAfterRefillBurn === 10n ** 18n, "FORK_REFILL_DID_NOT_BURN_EXACTLY_ONE_KGEN");
    const balanceBeforeRefill = await kaios.balanceOf(bankAddress);
    await transact("settleWhiteHoleMassRefill", kaios.connect(outsider).settleWhiteHoleMass());
    const balanceAfterRefill = await kaios.balanceOf(bankAddress);
    expect(balanceAfterRefill - balanceBeforeRefill === 1_000n * 10n ** 18n, "LEGAL_REFILL_DID_NOT_MINT_1000_KAIOS");
    await transact("retryCelestialSalaryAfterRefill", seats.connect(outsider).claimCelestialSalary(2));
    const retryStateAfterSuccess = await seats.seat(2);
    expect(
      (await seats.calendarSeatState(2)).lastClaimedMonth === retrySalaryMonth,
      "RETRY_DID_NOT_ADVANCE_CHECKPOINT",
    );
    expect(retryStateAfterSuccess.claimedAmount > 0n, "RETRY_DID_NOT_RECORD_CLAIM");

    const governanceAddress = getAddress(await governanceModule.getAddress());
    for (const [name, item] of Object.entries(modules)) {
      await transact(`finalizeModuleGovernance_${name}`, item.contract.finalizeModuleGovernance(governanceAddress));
    }
    await transact("finalizeBankGovernance", bank.contract.finalizeGovernance(governanceAddress));
    await transact(
      "finalizeBank8888Governance",
      economic8888.contract.finalizeGovernance(governanceAddress, outsiderAddress),
    );

    const bankReplacement = await new ContractFactory(
      artifact("LingxiaoCelestialBank18888_Upgradeable").abi,
      artifact("LingxiaoCelestialBank18888_Upgradeable").bytecode,
      fixtureDeployer,
    ).deploy();
    await bankReplacement.waitForDeployment();
    transactions.forkOnlyBankReplacementDeployment = receiptEvidence(await bankReplacement.deploymentTransaction().wait());
    const bankReplacementAddress = await bankReplacement.getAddress();
    const nonUups = await new ContractFactory(artifact("MockNonUUPS").abi, artifact("MockNonUUPS").bytecode, fixtureDeployer).deploy();
    await nonUups.waitForDeployment();
    transactions.forkOnlyNonUupsDeployment = receiptEvidence(await nonUups.deploymentTransaction().wait());

    const defaultAdminRole = await bank.contract.DEFAULT_ADMIN_ROLE();
    const moduleAdminRole = await bank.contract.MODULE_ADMIN_ROLE();
    const bankUpgraderRole = await bank.contract.UPGRADER_ROLE();
    const pauserRole = await bank.contract.PAUSER_ROLE();
    const moduleDefaultAdminRole = await seats.DEFAULT_ADMIN_ROLE();
    const moduleGovernanceRole = await seats.GOVERNANCE_ROLE();
    const moduleUpgraderRole = await seats.UPGRADER_ROLE();
    const economic8888DefaultAdminRole = await economic8888.contract.DEFAULT_ADMIN_ROLE();
    const economic8888UpgraderRole = await economic8888.contract.UPGRADER_ROLE();
    const economic8888AccountAdminRole = await economic8888.contract.ACCOUNT_ADMIN_ROLE();
    const economic8888PayrollAdminRole = await economic8888.contract.PAYROLL_ADMIN_ROLE();
    const economic8888PauserRole = await economic8888.contract.PAUSER_ROLE();
    const roleMatrix = {
      bank: {
        finalGovernance: {
          address: governanceAddress,
          defaultAdmin: await bank.contract.hasRole(defaultAdminRole, governanceAddress),
          moduleAdmin: await bank.contract.hasRole(moduleAdminRole, governanceAddress),
          upgrader: await bank.contract.hasRole(bankUpgraderRole, governanceAddress),
          pauser: await bank.contract.hasRole(pauserRole, governanceAddress),
        },
        bootstrapGovernance: {
          address: FORMAL_GOVERNANCE,
          defaultAdmin: await bank.contract.hasRole(defaultAdminRole, FORMAL_GOVERNANCE),
          moduleAdmin: await bank.contract.hasRole(moduleAdminRole, FORMAL_GOVERNANCE),
          upgrader: await bank.contract.hasRole(bankUpgraderRole, FORMAL_GOVERNANCE),
          pauser: await bank.contract.hasRole(pauserRole, FORMAL_GOVERNANCE),
        },
        deploymentSigner: {
          address: DEPLOYMENT_SIGNER,
          defaultAdmin: await bank.contract.hasRole(defaultAdminRole, DEPLOYMENT_SIGNER),
          moduleAdmin: await bank.contract.hasRole(moduleAdminRole, DEPLOYMENT_SIGNER),
          upgrader: await bank.contract.hasRole(bankUpgraderRole, DEPLOYMENT_SIGNER),
          pauser: await bank.contract.hasRole(pauserRole, DEPLOYMENT_SIGNER),
        },
      },
      economic8888: {
        proxy: economic8888Address,
        legacyTreasury: LEGACY_TREASURY_8888,
        finalGovernance: {
          address: governanceAddress,
          defaultAdmin: await economic8888.contract.hasRole(economic8888DefaultAdminRole, governanceAddress),
          accountAdmin: await economic8888.contract.hasRole(economic8888AccountAdminRole, governanceAddress),
          payrollAdmin: await economic8888.contract.hasRole(economic8888PayrollAdminRole, governanceAddress),
          upgrader: await economic8888.contract.hasRole(economic8888UpgraderRole, governanceAddress),
        },
        bootstrapGovernance: {
          address: FORMAL_GOVERNANCE,
          defaultAdmin: await economic8888.contract.hasRole(economic8888DefaultAdminRole, FORMAL_GOVERNANCE),
          accountAdmin: await economic8888.contract.hasRole(economic8888AccountAdminRole, FORMAL_GOVERNANCE),
          payrollAdmin: await economic8888.contract.hasRole(economic8888PayrollAdminRole, FORMAL_GOVERNANCE),
          upgrader: await economic8888.contract.hasRole(economic8888UpgraderRole, FORMAL_GOVERNANCE),
        },
        pauser: {
          address: outsiderAddress,
          hasRole: await economic8888.contract.hasRole(economic8888PauserRole, outsiderAddress),
          status: "FORK_ONLY_HUMAN_CONFIRM_REQUIRED_FOR_MAINNET",
        },
      },
      modules: {},
      governance: {
        contract: governanceAddress,
        delaySeconds: Number(await governanceModule.governanceDelay()),
        proposer: FORMAL_GOVERNANCE,
        distinctApprover: distinctApproverAddress,
      },
      registry: {
        owner: await registry.owner(),
        minimumDelaySeconds: Number(await registry.minimumDelay()),
        bootstrapOpen: await registry.bootstrapOpen(),
      },
    };
    for (const [name, item] of Object.entries(modules)) {
      roleMatrix.modules[name] = {
        proxy: await item.contract.getAddress(),
        finalGovernance: {
          defaultAdmin: await item.contract.hasRole(moduleDefaultAdminRole, governanceAddress),
          governance: await item.contract.hasRole(moduleGovernanceRole, governanceAddress),
          upgrader: await item.contract.hasRole(moduleUpgraderRole, governanceAddress),
        },
        bootstrapGovernance: {
          defaultAdmin: await item.contract.hasRole(moduleDefaultAdminRole, FORMAL_GOVERNANCE),
          governance: await item.contract.hasRole(moduleGovernanceRole, FORMAL_GOVERNANCE),
          upgrader: await item.contract.hasRole(moduleUpgraderRole, FORMAL_GOVERNANCE),
        },
      };
    }
    expect(roleMatrix.bank.finalGovernance.defaultAdmin && roleMatrix.bank.finalGovernance.moduleAdmin && roleMatrix.bank.finalGovernance.upgrader, "FINAL_GOVERNANCE_BANK_ROLES_MISSING");
    expect(!roleMatrix.bank.bootstrapGovernance.defaultAdmin && !roleMatrix.bank.bootstrapGovernance.moduleAdmin && !roleMatrix.bank.bootstrapGovernance.upgrader, "BOOTSTRAP_BANK_ROLES_NOT_REVOKED");
    expect(roleMatrix.economic8888.finalGovernance.defaultAdmin && roleMatrix.economic8888.finalGovernance.accountAdmin && roleMatrix.economic8888.finalGovernance.payrollAdmin && roleMatrix.economic8888.finalGovernance.upgrader, "FINAL_GOVERNANCE_8888_ROLES_MISSING");
    expect(!roleMatrix.economic8888.bootstrapGovernance.defaultAdmin && !roleMatrix.economic8888.bootstrapGovernance.accountAdmin && !roleMatrix.economic8888.bootstrapGovernance.payrollAdmin && !roleMatrix.economic8888.bootstrapGovernance.upgrader, "BOOTSTRAP_8888_ROLES_NOT_REVOKED");
    expect(Object.values(roleMatrix.modules).every((item) => item.finalGovernance.defaultAdmin && item.finalGovernance.governance && item.finalGovernance.upgrader), "FINAL_GOVERNANCE_MODULE_ROLES_MISSING");
    expect(Object.values(roleMatrix.modules).every((item) => !item.bootstrapGovernance.defaultAdmin && !item.bootstrapGovernance.governance && !item.bootstrapGovernance.upgrader), "BOOTSTRAP_MODULE_ROLES_NOT_REVOKED");

    transactions.unauthorizedPostFinalizationUpgradeRejected = await expectRevert(
      () => bank.contract.connect(governance).upgradeToAndCall(bankReplacementAddress, "0x", { gasLimit: 1_000_000 }),
      "UNAUTHORIZED_POST_FINALIZATION_UPGRADE",
    );
    const stateBeforeUpgrade = {
      implementation: await bank.contract.implementationAddress(),
      kgen: await bank.contract.kgen(),
      kaios: await bank.contract.kaios(),
      reserveRequirement: await bank.contract.reserveRequirement(),
      totalDisbursed: await bank.contract.totalKaiosDisbursed(),
      genesisOpeningBalance: await bank.contract.genesisOpeningBalance(),
      seat1: await seats.seat(1),
      seat2: await seats.seat(2),
      allocation: await allocation.allocation(allocationId),
    };

    const maliciousData = bank.contract.interface.encodeFunctionData("upgradeToAndCall", [await nonUups.getAddress(), "0x"]);
    const maliciousProposalId = id("FORK-MALICIOUS-NON-UUPS-UPGRADE");
    await transact("proposeMaliciousUpgrade", governanceModule.propose(maliciousProposalId, bankAddress, 0, maliciousData));
    await transact("approveMaliciousUpgrade", governanceModule.connect(distinctApprover).approve(maliciousProposalId));
    await provider.send("evm_increaseTime", [TECHNICAL_MINIMUM_DELAY + 1]);
    await provider.send("evm_mine", []);
    transactions.maliciousImplementationUpgradeRejected = await expectRevert(
      () => governanceModule.connect(outsider).execute(maliciousProposalId, maliciousData, { gasLimit: 2_000_000 }),
      "MALICIOUS_NON_UUPS_UPGRADE",
    );

    const originalImplementation = getAddress(await bank.contract.implementationAddress());
    const upgradeData = bank.contract.interface.encodeFunctionData("upgradeToAndCall", [bankReplacementAddress, "0x"]);
    const upgradeProposalId = id("FORK-VALID-BANK-UPGRADE");
    await transact("proposeValidUpgrade", governanceModule.propose(upgradeProposalId, bankAddress, 0, upgradeData));
    await transact("approveValidUpgrade", governanceModule.connect(distinctApprover).approve(upgradeProposalId));
    transactions.upgradeBeforeDelayRejected = await expectRevert(
      () => governanceModule.connect(outsider).execute(upgradeProposalId, upgradeData, { gasLimit: 2_000_000 }),
      "UPGRADE_BEFORE_DELAY",
    );
    await provider.send("evm_increaseTime", [TECHNICAL_MINIMUM_DELAY + 1]);
    await provider.send("evm_mine", []);
    await transact("executeValidUpgrade", governanceModule.connect(outsider).execute(upgradeProposalId, upgradeData, { gasLimit: 2_000_000 }));
    expect(getAddress(await bank.contract.implementationAddress()) === getAddress(bankReplacementAddress), "VALID_UPGRADE_IMPLEMENTATION_MISMATCH");

    const rollbackData = bank.contract.interface.encodeFunctionData("upgradeToAndCall", [originalImplementation, "0x"]);
    const rollbackProposalId = id("FORK-ROLLBACK-BANK-UPGRADE");
    await transact("proposeRollback", governanceModule.propose(rollbackProposalId, bankAddress, 0, rollbackData));
    await transact("approveRollback", governanceModule.connect(distinctApprover).approve(rollbackProposalId));
    await provider.send("evm_increaseTime", [TECHNICAL_MINIMUM_DELAY + 1]);
    await provider.send("evm_mine", []);
    await transact("executeRollback", governanceModule.connect(outsider).execute(rollbackProposalId, rollbackData, { gasLimit: 2_000_000 }));
    expect(getAddress(await bank.contract.implementationAddress()) === originalImplementation, "ROLLBACK_IMPLEMENTATION_MISMATCH");
    const stateAfterRollback = {
      implementation: await bank.contract.implementationAddress(),
      kgen: await bank.contract.kgen(),
      kaios: await bank.contract.kaios(),
      reserveRequirement: await bank.contract.reserveRequirement(),
      totalDisbursed: await bank.contract.totalKaiosDisbursed(),
      genesisOpeningBalance: await bank.contract.genesisOpeningBalance(),
      seat1: await seats.seat(1),
      seat2: await seats.seat(2),
      allocation: await allocation.allocation(allocationId),
    };
    const normalizedState = (value) => asJson(value).replaceAll(stateBeforeUpgrade.implementation, "IMPLEMENTATION").replaceAll(stateAfterRollback.implementation, "IMPLEMENTATION");
    expect(normalizedState(stateBeforeUpgrade) === normalizedState(stateAfterRollback), "ROLLBACK_STATE_PRESERVATION_FAILED");

    const economic8888Replacement = await new ContractFactory(
      artifact("GaolaozhuangCommercialBank8888_Upgradeable").abi,
      artifact("GaolaozhuangCommercialBank8888_Upgradeable").bytecode,
      fixtureDeployer,
    ).deploy();
    await economic8888Replacement.waitForDeployment();
    transactions.forkOnlyBank8888ReplacementDeployment = receiptEvidence(
      await economic8888Replacement.deploymentTransaction().wait(),
    );
    const economic8888ReplacementAddress = await economic8888Replacement.getAddress();
    const economic8888OriginalImplementation = getAddress(await economic8888.contract.implementationAddress());
    const economic8888StateBefore = {
      implementation: economic8888OriginalImplementation,
      legacyTreasury: await economic8888.contract.legacyTreasury(),
      kaios: await economic8888.contract.kaios(),
      account: await economic8888.contract.account(payrollAccountId),
      totalCustomerLiability: await economic8888.contract.totalCustomerLiability(),
      totalCommercialSettlement: await economic8888.contract.totalCommercialSettlement(),
    };
    transactions.unauthorizedBank8888UpgradeRejected = await expectRevert(
      () => economic8888.contract.connect(governance).upgradeToAndCall(
        economic8888ReplacementAddress,
        "0x",
        { gasLimit: 1_000_000 },
      ),
      "UNAUTHORIZED_8888_POST_FINALIZATION_UPGRADE",
    );
    const economic8888UpgradeData = economic8888.contract.interface.encodeFunctionData("upgradeToAndCall", [
      economic8888ReplacementAddress,
      "0x",
    ]);
    const economic8888UpgradeId = id("FORK-VALID-8888-UPGRADE");
    await transact("proposeBank8888Upgrade", governanceModule.propose(economic8888UpgradeId, economic8888Address, 0, economic8888UpgradeData));
    await transact("approveBank8888Upgrade", governanceModule.connect(distinctApprover).approve(economic8888UpgradeId));
    await provider.send("evm_increaseTime", [TECHNICAL_MINIMUM_DELAY + 1]);
    await provider.send("evm_mine", []);
    await transact("executeBank8888Upgrade", governanceModule.connect(outsider).execute(economic8888UpgradeId, economic8888UpgradeData, { gasLimit: 2_000_000 }));
    const economic8888RollbackData = economic8888.contract.interface.encodeFunctionData("upgradeToAndCall", [
      economic8888OriginalImplementation,
      "0x",
    ]);
    const economic8888RollbackId = id("FORK-ROLLBACK-8888-UPGRADE");
    await transact("proposeBank8888Rollback", governanceModule.propose(economic8888RollbackId, economic8888Address, 0, economic8888RollbackData));
    await transact("approveBank8888Rollback", governanceModule.connect(distinctApprover).approve(economic8888RollbackId));
    await provider.send("evm_increaseTime", [TECHNICAL_MINIMUM_DELAY + 1]);
    await provider.send("evm_mine", []);
    await transact("executeBank8888Rollback", governanceModule.connect(outsider).execute(economic8888RollbackId, economic8888RollbackData, { gasLimit: 2_000_000 }));
    const economic8888StateAfter = {
      implementation: await economic8888.contract.implementationAddress(),
      legacyTreasury: await economic8888.contract.legacyTreasury(),
      kaios: await economic8888.contract.kaios(),
      account: await economic8888.contract.account(payrollAccountId),
      totalCustomerLiability: await economic8888.contract.totalCustomerLiability(),
      totalCommercialSettlement: await economic8888.contract.totalCommercialSettlement(),
    };
    const normalize8888 = (value) => asJson(value)
      .replaceAll(economic8888StateBefore.implementation, "IMPLEMENTATION")
      .replaceAll(economic8888StateAfter.implementation, "IMPLEMENTATION");
    expect(normalize8888(economic8888StateBefore) === normalize8888(economic8888StateAfter), "8888_ROLLBACK_STATE_PRESERVATION_FAILED");

    const genesisBlock = await provider.getBlock(genesisSettlementReceipt.blockNumber);
    const genesisRecord = {
      status: "MAINNET_FORK_REHEARSAL_PREVIEW_NOT_FINAL",
      evidenceClass: "CHAIN_ID_56_MAINNET_FORK",
      mainnetTransactionAuthorized: false,
      chainId: "56",
      forkBlock: forkBlockNumber,
      pointIds: {
        kaiosGoldAndSilverIslandTokenPoint: "33333",
        whiteHole: "36000",
        lingxiaoCelestialBank: "18888",
      },
      addresses: {
        kgenToken: FORMAL_KGEN,
        kaiosTokenForkPredicted: await kaios.getAddress(),
        lingxiaoBankProxyForkPredicted: bankAddress,
        formal11520: FORMAL_11520,
        legacyHeart: LEGACY_HEART,
      },
      settlement: {
        transactionHash: genesisSettlementReceipt.hash,
        blockNumber: genesisSettlementReceipt.blockNumber,
        timestamp: genesisBlock.timestamp,
        timestampIso: new Date(Number(genesisBlock.timestamp) * 1_000).toISOString(),
        kgenGenesisSupply: units(KGEN_GENESIS_SUPPLY),
        kgenSupplyAtSettlementBlock: units(supplyAtGenesisSettlement),
        historicalKgenBurn: units(historicalBurn),
        actualGenesisKaiosMinted: units(actualGenesisKaios),
        kaiosTotalSupply: units(await kaios.totalSupply({ blockTag: genesisSettlementReceipt.blockNumber })),
        bankBalanceBefore: units(bankBalanceBeforeGenesis),
        bankBalanceAfter: units(bankBalanceAfterGenesis),
        bankBalanceDelta: units(actualGenesisKaios),
      },
      accountingInvariant: historicalBurn * KAIOS_PER_KGEN === actualGenesisKaios && actualGenesisKaios === bankBalanceAfterGenesis - bankBalanceBeforeGenesis,
      inscription: [
        "NO KGEN BURN, NO KAIOS MINT.",
        "ONE BURNED KGEN CREATES ONE THOUSAND KAIOS.",
        "NO DISCRETIONARY MINTING.",
        "CIVILIZATION MASS SHALL BE CONSERVED.",
      ],
      generation: "AUTOMATIC_FROM_CHAIN_ID_56_FORK_STATE_USING_BIGINT_NO_HUMAN_AMOUNT_INPUT",
      warning: "PREVIEW_NOT_FINAL. Regenerate from the actual Mainnet Genesis settlement block after explicit authorization.",
    };

    const totalGasUsed = deploymentGasUsed + runtimeGasUsed;
    const bufferedGas = totalGasUsed * 120n / 100n;
    const estimatedRequiredWei = bufferedGas * liveGasPrice;
    const parameterTable = [
      { parameter: "500 Seat salary base/rate", value: null, status: "HUMAN_CONFIRM_REQUIRED", forkOnlyValue: "10 KAIOS monthly base with 1.0x/10.0x test weights" },
      { parameter: "500 Seat epoch definition", value: "MONTHLY_DAY_5_00_00_UTC_PLUS_8", status: "HUMAN_FINAL_CANON_IMPLEMENTED", forkOnlyValue: "deterministic Gregorian YYYYMM maturity enforced on-chain" },
      { parameter: "18911 Alchemy epoch definition", value: null, status: "HUMAN_CONFIRM_REQUIRED", forkOnlyValue: "86400 seconds" },
      { parameter: "Reserve minimum", value: null, status: "HUMAN_CONFIRM_REQUIRED", forkOnlyValue: "dynamic balance lock for retry test only" },
      { parameter: "Salary exposure cap", value: null, status: "HUMAN_CONFIRM_REQUIRED", forkOnlyValue: `${formatEther(FORK_MODULE_PER_TRANSACTION_LIMIT)} per transaction / ${formatEther(FORK_MODULE_DAILY_LIMIT)} per UTC day` },
      { parameter: "Allocation exposure cap", value: null, status: "HUMAN_CONFIRM_REQUIRED", forkOnlyValue: `${formatEther(FORK_MODULE_PER_TRANSACTION_LIMIT)} per transaction / ${formatEther(FORK_MODULE_DAILY_LIMIT)} per UTC day` },
      { parameter: "8888 route cap", value: null, status: "HUMAN_CONFIRM_REQUIRED", forkOnlyValue: `${formatEther(FORK_MODULE_PER_TRANSACTION_LIMIT)} per transaction / ${formatEther(FORK_MODULE_DAILY_LIMIT)} per UTC day` },
      { parameter: "11520 settlement cap", value: null, status: "HUMAN_CONFIRM_REQUIRED", forkOnlyValue: `${formatEther(FORK_MODULE_PER_TRANSACTION_LIMIT)} per transaction / ${formatEther(FORK_MODULE_DAILY_LIMIT)} per UTC day` },
      { parameter: "8888 deposit interest rate", value: null, status: "HUMAN_CONFIRM_REQUIRED", forkOnlyValue: "unset; future-only checkpoint architecture tested locally" },
      { parameter: "Governance delay", value: "3600 seconds", status: "HUMAN_FINAL_CANON_TECHNICAL_MINIMUM", forkOnlyValue: "3600 seconds" },
      { parameter: "Distinct BankGovernance approver", value: null, status: "HUMAN_CONFIRM_REQUIRED", forkOnlyValue: distinctApproverAddress },
      { parameter: "Pause authority", value: null, status: "HUMAN_CONFIRM_REQUIRED", implementationBehavior: "Final BankGovernance and bootstrap governance PAUSER remain; pause cannot spend or unpause" },
      { parameter: "Initial module enable/disable state", value: "six active; BankMigration registered but inactive", status: "HUMAN_FINAL_CANON", forkOnlyValue: "matches Mainnet candidate" },
    ];
    const unresolvedParameters = parameterTable.filter((item) => item.status === "HUMAN_CONFIRM_REQUIRED").length;
    const economic8888Mainnet = {
      predictedProxy: economic8888Address,
      implementation: await economic8888.implementation.getAddress(),
      status: "NEW_CODE_BEARING_ERC1967_UUPS_PROXY_PREDICTION",
      legacyTreasury: LEGACY_TREASURY_8888,
      evidence: "Fork-deployed GaolaozhuangCommercialBank8888_Upgradeable code-bearing proxy; EconomicRouter8888 is initialized directly to this proxy.",
    };
    const deploymentSignerFunding = {
      address: DEPLOYMENT_SIGNER,
      balanceAtReviewWei: liveDeploymentSignerBalance.toString(),
      balanceAtReviewBNB: formatEther(liveDeploymentSignerBalance),
      gasPriceWei: liveGasPrice.toString(),
      rehearsalGasUsed: totalGasUsed.toString(),
      bufferedGasUnits: bufferedGas.toString(),
      estimatedRequiredWei: estimatedRequiredWei.toString(),
      estimatedRequiredBNB: formatEther(estimatedRequiredWei),
      estimatedShortfallWei: estimatedRequiredWei > liveDeploymentSignerBalance ? (estimatedRequiredWei - liveDeploymentSignerBalance).toString() : "0",
      sufficientAtReview: liveDeploymentSignerBalance >= estimatedRequiredWei,
      status: liveDeploymentSignerBalance >= estimatedRequiredWei ? "PASS" : "FUNDING_REQUIRED_BEFORE_SIGNATURE",
    };
    const moduleMatrix = Object.fromEntries(await Promise.all(Object.entries(modules).map(async ([name, item]) => {
      const config = await bank.contract.module(moduleIds[name]);
      return [name, {
        moduleId: moduleIds[name],
        implementation: await item.implementation.getAddress(),
        proxy: await item.contract.getAddress(),
        version: await item.contract.version(),
        activeInFork: config.active,
        perTransactionLimitForkOnly: config.perTransactionLimit.toString(),
        dailyEpochLimitForkOnly: config.epochLimit.toString(),
        mainnetActive: name !== "BankMigration_Upgradeable",
        mainnetLimits: null,
        mainnetStatus: "HUMAN_FINAL_INITIAL_STATE_LIMITS_PENDING",
      }];
    })));
    const gates = {
      postFinalizationUpgradePath: "PASS",
      genesisAccountingExact: genesisRecord.accountingInvariant ? "PASS" : "FAIL",
      realMoneyFlowPaths: "PASS",
      celestialSalary500: "PASS",
      celestialMonthlyDay5Utc8: "PASS",
      noThirtyDayApproximation: "PASS",
      routing8888: "PASS",
      monthlyPayroll8888: "PASS",
      savingsAccount8888: "PASS",
      settlement11520: "PASS",
      arbitraryDrain: "BLOCKED",
      entitlementRetryAfterRefill: "PASS",
      storageRollbackRestore: "PASS",
      storage8888RollbackRestore: "PASS",
      frozenBankCreationCodehash: "PASS",
      frozenBankRuntimeCodehash: "PASS",
      legacyHeartUntouched: "PASS",
    };
    const readinessBlockers = [
      "DEPLOYMENT_SIGNER_CONTROL_RECONFIRMATION_REQUIRED",
      ...parameterTable.filter((item) => item.status === "HUMAN_CONFIRM_REQUIRED").map((item) => `HUMAN_CONFIRM_REQUIRED:${item.parameter}`),
      ...(deploymentSignerFunding.sufficientAtReview ? [] : ["DEPLOYMENT_SIGNER_BNB_FUNDING_REQUIRED"]),
      "MAINNET_DEPLOY_APPROVED_NOT_RECEIVED",
    ];
    const manifest = {
      status: "MAINNET_PRE_SIGN_CALENDAR_REHEARSAL_COMPLETE_WITH_POLICY_BLOCKERS",
      mainnetTransactionAuthorized: false,
      readyForHumanMainnetAuthorization: false,
      chainId: 56,
      fork: {
        blockNumber: forkBlockNumber,
        blockHash: forkBlock.hash,
        timestamp: forkBlock.timestamp,
        timestampIso: new Date(Number(forkBlock.timestamp) * 1_000).toISOString(),
        network: "BSC Mainnet chainId 56 public read-only fork",
      },
      canon: {
        formalKgen: FORMAL_KGEN,
        formal11520: FORMAL_11520,
        legacyHeart: { address: LEGACY_HEART, status: "DO_NOT_TOUCH" },
        formalGovernance: FORMAL_GOVERNANCE,
        deploymentSignerCandidate: DEPLOYMENT_SIGNER,
        formalEconomicBank8888: economic8888Mainnet,
      },
      frozenCodehash: {
        bankCoreCreation: bankCompile.bytecodeHash,
        bankCoreRuntime: bankCompile.deployedBytecodeHash,
      },
      economic8888CandidateCodehash: {
        creation: economic8888Compile.bytecodeHash,
        runtime: economic8888Compile.deployedBytecodeHash,
        creationBytes: economic8888Compile.bytecodeBytes,
        runtimeBytes: economic8888Compile.deployedBytecodeBytes,
      },
      deploymentOrder: deploymentActions,
      organRegistryWiring: organWiring.map(([organId, address, label]) => ({ organId, label, forkAddress: address, mainnetAddress: label === "EXCHANGE_TREASURY_11520" ? address : null, autoBackfillRequired: label !== "EXCHANGE_TREASURY_11520" })),
      roleMatrix,
      moduleMatrix,
      economicParameters: parameterTable,
      genesisPreview: genesisRecord.settlement,
      deploymentSignerFunding,
      gates,
      blockers: readinessBlockers,
      autoBackfillRule: "Each actual Mainnet deployment address must be written from its successful receipt and then codehash-verified; predicted addresses alone never become formal.",
    };
    const rehearsal = {
      status: "PASS_WITH_HUMAN_ECONOMIC_AND_GOVERNANCE_POLICY_BLOCKERS",
      evidenceClass: "CHAIN_ID_56_MAINNET_FORK_FULL_REHEARSAL",
      mainnetTransactionAuthorized: false,
      fork: manifest.fork,
      contracts: {
        formalKgen: FORMAL_KGEN,
        formal11520: FORMAL_11520,
        legacyHeart: LEGACY_HEART,
        registry: await registry.getAddress(),
        bankImplementation: await bank.implementation.getAddress(),
        bankProxy: bankAddress,
        kaios: await kaios.getAddress(),
        furnace18911: await furnace.getAddress(),
        economic8888Implementation: await economic8888.implementation.getAddress(),
        economic8888Proxy: economic8888Address,
        legacyTreasury8888: LEGACY_TREASURY_8888,
        modules: moduleMatrix,
      },
      transactions,
      genesisRecord,
      roleMatrix,
      moduleMatrix,
      economicParameters: parameterTable,
      gas: { deploymentGasUsed: deploymentGasUsed.toString(), runtimeGasUsed: runtimeGasUsed.toString(), totalGasUsed: totalGasUsed.toString() },
      gates,
      blockers: readinessBlockers,
      activeHumanConfirmRequiredParameters: unresolvedParameters,
    };

    fs.mkdirSync(reportDirectory, { recursive: true });
    fs.writeFileSync(path.join(root, "config", "LINGXIAO_18888_MAINNET_DEPLOYMENT_MANIFEST.json"), `${asJson(manifest)}\n`);
    fs.writeFileSync(path.join(reportDirectory, "LINGXIAO_18888_MAINNET_FORK_REHEARSAL.json"), `${asJson(rehearsal)}\n`);
    fs.writeFileSync(path.join(reportDirectory, "KAIOS_GENESIS_MAINNET_RECORD.json"), `${asJson(genesisRecord)}\n`);
    fs.writeFileSync(path.join(reportDirectory, "KAIOS_GENESIS_MAINNET_INSCRIPTION.md"), [
      "# KAIOS Mainnet Genesis Inscription — Fork Preview",
      "",
      "> PREVIEW_NOT_FINAL. This is chainId 56 fork evidence, not a Mainnet transaction.",
      "",
      ...genesisRecord.inscription.map((line) => `> ${line}`),
      "",
      `- Fork block: ${forkBlockNumber}`,
      `- 33333 Point ID: KAIOS Gold & Silver Island Token Point`,
      `- Fork-predicted KAIOS Token: \`${await kaios.getAddress()}\``,
      `- 36000 Point ID: White Hole`,
      `- Fork-predicted 18888 Bank Proxy: \`${bankAddress}\``,
      `- Formal KGEN: \`${FORMAL_KGEN}\``,
      `- KGEN Genesis Supply: ${genesisRecord.settlement.kgenGenesisSupply.decimal18} KGEN`,
      `- KGEN Supply at fork settlement block: ${genesisRecord.settlement.kgenSupplyAtSettlementBlock.decimal18} KGEN`,
      `- Historical KGEN Burn Preview: ${genesisRecord.settlement.historicalKgenBurn.decimal18} KGEN`,
      `- Genesis KAIOS Preview: ${genesisRecord.settlement.actualGenesisKaiosMinted.decimal18} KAIOS`,
      `- 18888 balance delta: ${genesisRecord.settlement.bankBalanceDelta.decimal18} KAIOS`,
      `- Fork transaction: \`${genesisRecord.settlement.transactionHash}\``,
      "",
      "Generated automatically from fork receipt/state with BigInt. Regenerate from the actual authorized Mainnet settlement block; never copy this preview amount into a transaction.",
      "",
    ].join("\n"));
    fs.writeFileSync(path.join(root, "config", "LINGXIAO_18888_MAINNET_DEPLOYMENT_MANIFEST.md"), [
      "# Lingxiao 18888 Mainnet Deployment Manifest",
      "",
      "Status: pre-sign freeze review complete; Mainnet transaction is not authorized.",
      "",
      `- Fork block: ${forkBlockNumber}`,
      `- Formal KGEN: \`${FORMAL_KGEN}\``,
      `- Formal 11520: \`${FORMAL_11520}\``,
      `- Legacy Heart: \`${LEGACY_HEART}\` — DO NOT TOUCH`,
      `- Formal governance: \`${FORMAL_GOVERNANCE}\``,
      `- Deployment signer candidate: \`${DEPLOYMENT_SIGNER}\``,
      `- Bank creation codehash: \`${bankCompile.bytecodeHash}\``,
      `- Bank runtime codehash: \`${bankCompile.deployedBytecodeHash}\``,
      `- 8888 creation codehash: \`${economic8888Compile.bytecodeHash}\``,
      `- 8888 runtime codehash: \`${economic8888Compile.deployedBytecodeHash}\``,
      "",
      "## Deployment order and predicted addresses",
      "",
      "Predictions use the deployment signer nonce at the frozen fork block. Every address remains preview-only until a successful authorized receipt is codehash-verified and automatically backfilled.",
      "",
      "| Order | Identity | Nonce | Predicted address | Mainnet actual |",
      "|---:|---|---:|---|---|",
      ...deploymentActions.map((item) => `| ${item.order} | ${item.identity} | ${item.nonce} | \`${item.predictedAddress}\` | pending |`),
      "",
      "## Human-governed economic parameters",
      "",
      "| Parameter | Mainnet value | Status | Fork-only value / behavior |",
      "|---|---|---|---|",
      ...parameterTable.map((item) => `| ${item.parameter} | ${item.value ?? "unset"} | ${item.status} | ${item.forkOnlyValue ?? item.implementationBehavior ?? "—"} |`),
      "",
      "## Blocking conditions",
      "",
      ...readinessBlockers.map((item) => `- ${item}`),
      "",
      "No line in this manifest authorizes a transaction.",
      "",
    ].join("\n"));
    fs.writeFileSync(path.join(reportDirectory, "LINGXIAO_18888_MAINNET_FORK_REHEARSAL.md"), [
      "# Lingxiao 18888 Mainnet Fork Rehearsal",
      "",
      `Forked BSC Mainnet chainId 56 at block ${forkBlockNumber}. No Mainnet transaction was sent.`,
      "",
      "## Results",
      "",
      ...Object.entries(gates).map(([gate, result]) => `- ${gate}: ${result}`),
      "",
      "The 8888 rail passed through the new code-bearing Gaolaozhuang Commercial Bank proxy, including UTC+8 monthly day-5 payroll, savings credit, commercial payment and delayed UUPS rollback.",
      "CelestialSeat500 enforces Gregorian YYYYMM salary maturity exactly at day 5 00:00 UTC+8; no 30-day approximation or monthly admin advancement exists.",
      "",
      `KGEN totalSupply preview: ${formatUnits(supplyAtGenesisSettlement, 18)} KGEN.`,
      `Historical burn preview: ${formatUnits(historicalBurn, 18)} KGEN.`,
      `Genesis KAIOS preview: ${formatUnits(expectedGenesisKaios, 18)} KAIOS.`,
      "",
      "See the JSON evidence for transaction hashes, gas, complete roles, modules, state and blockers.",
      "",
    ].join("\n"));
    console.log(`LINGXIAO_18888_MAINNET_FORK_REHEARSAL=${rehearsal.status}`);
    console.log(`FORK_BLOCK=${forkBlockNumber}`);
    console.log(`GENESIS_KAIOS_PREVIEW=${formatUnits(expectedGenesisKaios, 18)}`);
    console.log(`READY_FOR_HUMAN_MAINNET_AUTHORIZATION=${manifest.readyForHumanMainnetAuthorization ? "YES" : "NO"}`);
  } finally {
    eip1193.disconnect();
    await live.destroy();
  }
}

await main();
