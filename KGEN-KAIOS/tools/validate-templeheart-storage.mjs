import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import {
  Contract,
  ContractFactory,
  Interface,
  JsonRpcProvider,
  NonceManager,
  Wallet,
  ZeroAddress,
  getAddress,
  id,
  keccak256,
  parseUnits,
} from "ethers";
import solc from "solc";
import {
  ORGAN_EXCHANGE_TREASURY_11520,
  ORGAN_FURNACE_18911,
  bootstrapTestnetFixtures,
  createEvidenceWriter,
  renderMarkdown,
} from "./templeheart-testnet-support.mjs";

const root = path.resolve(import.meta.dirname, "..");
const artifactPath = path.join(root, "artifacts", "KGEN_TempleHeart_Upgradeable.json");
const reportPath = path.join(root, "reports", "TEMPLEHEART_STORAGE_LAYOUT_VALIDATION.json");
const baselineRef = process.env.TEMPLEHEART_V332_BASE_REF ?? "7344d231837d40b504622c8c8b4376ed25110e20";
const baselinePath = "KGEN/contracts/KGEN_TempleHeart_Upgradeable.sol";

function findImports(importPath) {
  const candidate = path.join(root, "node_modules", importPath);
  return fs.existsSync(candidate)
    ? { contents: fs.readFileSync(candidate, "utf8") }
    : { error: `Import not found: ${importPath}` };
}

function compileBaselineLayout() {
  const source = execFileSync("git", ["show", `${baselineRef}:${baselinePath}`], {
    cwd: path.resolve(root, ".."),
    encoding: "utf8",
  });
  const input = {
    language: "Solidity",
    sources: { [baselinePath]: { content: source } },
    settings: { outputSelection: { "*": { "*": ["storageLayout"] } } },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
  const errors = (output.errors ?? []).filter((item) => item.severity === "error");
  if (errors.length) throw new Error(errors.map((item) => item.formattedMessage).join("\n"));
  return output.contracts[baselinePath].KGEN_TempleHeart_Upgradeable.storageLayout;
}

function normalize(layout) {
  return layout.storage.map((entry) => ({
    label: entry.label,
    slot: entry.slot,
    offset: entry.offset,
    encoding: layout.types[entry.type].encoding,
    bytes: layout.types[entry.type].numberOfBytes,
  }));
}

const baseline = {
  sourceRef: baselineRef,
  sourcePath: baselinePath,
  version: "3.3.2",
  entries: normalize(compileBaselineLayout()),
};
const currentArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const current = normalize(currentArtifact.storageLayout);
const allowedRename = new Map([["kaiosBurnProofGenesis", "deprecatedProofSource"]]);
const failures = [];

for (let index = 0; index < baseline.entries.length; index += 1) {
  const oldEntry = baseline.entries[index];
  const newEntry = current[index];
  if (!newEntry) {
    failures.push({ index, reason: "MISSING_SLOT", oldEntry });
    continue;
  }
  const expectedLabel = allowedRename.get(oldEntry.label) ?? oldEntry.label;
  for (const key of ["slot", "offset", "encoding", "bytes"]) {
    if (oldEntry[key] !== newEntry[key]) {
      failures.push({ index, reason: `CHANGED_${key.toUpperCase()}`, oldEntry, newEntry });
    }
  }
  if (newEntry.label !== expectedLabel) {
    failures.push({ index, reason: "UNAPPROVED_LABEL_CHANGE", oldEntry, newEntry });
  }
}

const appended = current.slice(baseline.entries.length);
const report = {
  status: failures.length === 0 ? "PASS" : "FAIL",
  baseline: {
    version: baseline.version,
    ref: baseline.sourceRef,
    path: baseline.sourcePath,
    slots: baseline.entries.length,
  },
  candidate: {
    path: "KGEN/contracts/KGEN_TempleHeart_Upgradeable.sol",
    slots: current.length,
    appendedSlots: appended.map((entry) => ({ label: entry.label, slot: entry.slot })),
  },
  approvedRenames: Object.fromEntries(allowedRename),
  failures,
};
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`TempleHeart storage layout: ${report.status} (${baseline.entries.length} preserved, ${appended.length} appended)`);
if (failures.length) process.exit(1);

const TESTNET_CHAIN_ID = 97n;
const TESTNET_EXECUTION_ACK = "BSC_TESTNET_REHEARSAL_ONLY";
const NEW_PROXY_SENTINEL = "NEW";
const evidenceJsonPath = path.join(root, "reports", "BSC_TESTNET_TEMPLEHEART_V3_4_REHEARSAL.json");
const evidenceMdPath = path.join(root, "reports", "BSC_TESTNET_TEMPLEHEART_V3_4_REHEARSAL.md");
let evidenceSession = createEvidenceWriter(evidenceJsonPath, evidenceMdPath);
const IMPLEMENTATION_SLOT =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const REQUIRED_SIGNER_ROLES = [
  ["DEFAULT_ADMIN_ROLE", `0x${"00".repeat(32)}`],
  ["UPGRADER_ROLE", id("UPGRADER_ROLE")],
  ["OPERATOR_ROLE", id("OPERATOR_ROLE")],
  ["HOLY_CUP_SIGNER_ROLE", id("HOLY_CUP_SIGNER_ROLE")],
];
const BASIC_ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address,uint256) returns (bool)",
  "function approve(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
];
const REGISTRY_ABI = ["function organ(bytes32) view returns (address)"];
const FURNACE_ABI = [
  "function kaios() view returns (address)",
  "function burnForKufo(uint256,address,bytes32,bytes32) returns (bytes32,uint256)",
  "event AlchemyProofCreated(bytes32 indexed proofId,address indexed owner,address indexed beneficiary,uint256 kaiosBurned,uint256 kufoAmount,uint64 burnEpoch,uint64 maturityEpoch)",
];

function env(name, { allowSecret = false } = {}) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  if (!allowSecret && /PRIVATE_KEY|MNEMONIC|SECRET/i.test(name)) {
    throw new Error(`Secret variable ${name} must be read with allowSecret`);
  }
  return value;
}

function configuredAddress(name) {
  const value = env(name);
  try {
    const address = getAddress(value);
    if (address === ZeroAddress) throw new Error("zero address");
    return address;
  } catch (error) {
    throw new Error(`${name} is not a non-zero EVM address: ${error.message}`);
  }
}

function configuredAddressOrNew(name) {
  const value = env(name);
  if (value.toUpperCase() === NEW_PROXY_SENTINEL) return { mode: "new", address: null };
  return { mode: "existing", address: configuredAddress(name) };
}

function writeEvidenceFiles(status, extra = {}) {
  const evidence = evidenceSession.finalize(status, extra);
  fs.mkdirSync(path.dirname(evidenceJsonPath), { recursive: true });
  fs.writeFileSync(evidenceJsonPath, `${JSON.stringify(evidence, null, 2)}\n`);
  fs.writeFileSync(evidenceMdPath, renderMarkdown(evidence));
  console.log(`Evidence written: ${evidenceJsonPath}`);
}

function artifact(name) {
  const candidate = path.join(root, "artifacts", `${name}.json`);
  if (!fs.existsSync(candidate)) {
    throw new Error(`Missing ${candidate}; run npm run compile first`);
  }
  return JSON.parse(fs.readFileSync(candidate, "utf8"));
}

async function requireContract(provider, address, label) {
  if ((await provider.getCode(address)) === "0x") {
    throw new Error(`${label} has no contract code at ${address}`);
  }
}

async function waitFor(label, transactionPromise, confirmations) {
  const transaction = await transactionPromise;
  console.log(`${label}: submitted ${transaction.hash}`);
  const receipt = await transaction.wait(confirmations);
  if (receipt.status !== 1) throw new Error(`${label} reverted: ${transaction.hash}`);
  console.log(`${label}: confirmed in block ${receipt.blockNumber}`);
  evidenceSession.recordTransaction(label, receipt);
  return receipt;
}

async function deployArtifact(name, signer, args, confirmations) {
  const compiled = artifact(name);
  const factory = new ContractFactory(compiled.abi, compiled.bytecode, signer);
  const contract = await factory.deploy(...args);
  const deployment = contract.deploymentTransaction();
  console.log(`Deploy ${name}: submitted ${deployment.hash}`);
  const receipt = await deployment.wait(confirmations);
  if (receipt.status !== 1) throw new Error(`Deploy ${name} reverted: ${deployment.hash}`);
  console.log(`Deploy ${name}: ${await contract.getAddress()} at block ${receipt.blockNumber}`);
  return contract;
}

function implementationAddressFromSlot(rawSlot) {
  return getAddress(`0x${rawSlot.slice(-40)}`);
}

function maskedRuntimeHash(bytecode, immutableReferences) {
  const bytes = bytecode.slice(2).split("");
  for (const references of Object.values(immutableReferences ?? {})) {
    for (const { start, length } of references) {
      bytes.fill("0", start * 2, (start + length) * 2);
    }
  }
  return keccak256(`0x${bytes.join("")}`);
}

function runtimeMatchesArtifact(runtimeBytecode, compiledArtifact) {
  return maskedRuntimeHash(runtimeBytecode, compiledArtifact.immutableReferences) ===
    maskedRuntimeHash(compiledArtifact.deployedBytecode, compiledArtifact.immutableReferences);
}

async function expectCallRevert(provider, request, label) {
  try {
    await provider.call(request);
  } catch {
    console.log(`${label}: rejection verified`);
    return;
  }
  throw new Error(`${label}: call unexpectedly succeeded`);
}

function parsePositiveWhole(name) {
  const value = env(name);
  if (!/^[1-9][0-9]*$/.test(value)) throw new Error(`${name} must be a positive whole number`);
  return BigInt(value);
}

async function readRawSlots(provider, proxyAddress, start, count) {
  return Promise.all(
    Array.from({ length: count }, (_, offset) => provider.getStorage(proxyAddress, start + offset)),
  );
}

async function assertTestnetConfiguration({ requireExecution }) {
  const rpcUrl = env("BSC_TESTNET_RPC_URL");
  const provider = new JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  if (network.chainId !== TESTNET_CHAIN_ID) {
    throw new Error(`Refusing chainId ${network.chainId}; BSC Testnet chainId 97 is required`);
  }

  const signerAddress = configuredAddress("BSC_TESTNET_SIGNER_ADDRESS");
  evidenceSession.evidence.signerAddress = signerAddress;
  const signerRole = env("BSC_TESTNET_SIGNER_ROLE");
  const proxyInput = env("BSC_TESTNET_PROXY_ADDRESS");
  const mode = proxyInput.toUpperCase() === NEW_PROXY_SENTINEL ? "fresh" : "existing";
  const proxyAddress = mode === "existing" ? getAddress(proxyInput) : null;
  const kgenTarget = configuredAddressOrNew("BSC_TESTNET_KGEN_ADDRESS");
  const treasuryTarget = configuredAddressOrNew("BSC_TESTNET_TREASURY_11520_ADDRESS");
  const proofTarget = configuredAddressOrNew("BSC_TESTNET_ALCHEMY_PROOF_SOURCE_ADDRESS");
  const registryTarget = configuredAddressOrNew("BSC_TESTNET_ORGAN_REGISTRY_ADDRESS");
  const fortuneTarget = configuredAddressOrNew("BSC_TESTNET_FORTUNE_GAME_ADDRESS");
  const kgenAddress = kgenTarget.address;
  const treasury11520Address = treasuryTarget.address;
  const proofSourceAddress = proofTarget.address;
  const registryAddress = registryTarget.address;
  const fortuneGameAddress = fortuneTarget.address;
  const bootstrapFixtures =
    kgenTarget.mode === "new" ||
    treasuryTarget.mode === "new" ||
    proofTarget.mode === "new" ||
    registryTarget.mode === "new" ||
    fortuneTarget.mode === "new";
  const unauthorizedAddress = configuredAddress("BSC_TESTNET_UNAUTHORIZED_ADDRESS");
  if (unauthorizedAddress === signerAddress) {
    throw new Error("BSC_TESTNET_UNAUTHORIZED_ADDRESS must differ from the authorized signer");
  }

  for (const [address, label] of [
    [kgenAddress, "KGEN"],
    [treasury11520Address, "11520 treasury"],
    [proofSourceAddress, "KAIOS Alchemy proof source"],
    [registryAddress, "Organ Registry"],
    [fortuneGameAddress, "Fortune Game stub"],
  ]) {
    if (address) await requireContract(provider, address, label);
  }
  if (proxyAddress) await requireContract(provider, proxyAddress, "TempleHeart proxy");

  let furnaceAddress = null;
  if (!bootstrapFixtures) {
    const registry = new Contract(registryAddress, REGISTRY_ABI, provider);
    const wiredTreasury = getAddress(await registry.organ(ORGAN_EXCHANGE_TREASURY_11520));
    if (wiredTreasury !== treasury11520Address) {
      throw new Error(
        `Organ Registry 11520 mismatch: registry=${wiredTreasury}, confirmed=${treasury11520Address}`,
      );
    }
    furnaceAddress = getAddress(await registry.organ(ORGAN_FURNACE_18911));
    await requireContract(provider, furnaceAddress, "KAIOS Alchemy Furnace 18911");
    const furnace = new Contract(furnaceAddress, FURNACE_ABI, provider);
    const furnaceKaios = getAddress(await furnace.kaios());
    if (furnaceKaios !== proofSourceAddress) {
      throw new Error(
        `Furnace KAIOS/proof-source mismatch: furnace=${furnaceKaios}, confirmed=${proofSourceAddress}`,
      );
    }
  }

  if (kgenAddress) {
    const kgen = new Contract(kgenAddress, BASIC_ERC20_ABI, provider);
    if ((await kgen.decimals()) !== 18n) throw new Error("TempleHeart rehearsal requires 18-decimal KGEN");
  }
  if (proofSourceAddress) {
    const kaios = new Contract(proofSourceAddress, BASIC_ERC20_ABI, provider);
    if ((await kaios.decimals()) !== 18n) throw new Error("TempleHeart rehearsal requires 18-decimal KAIOS");
  }

  const confirmations = Number(process.env.BSC_TESTNET_CONFIRMATIONS ?? "3");
  if (!Number.isSafeInteger(confirmations) || confirmations < 1) {
    throw new Error("BSC_TESTNET_CONFIRMATIONS must be a positive integer");
  }
  const heartFundWhole = parsePositiveWhole("BSC_TESTNET_HEART_FUND_WHOLE");
  if (heartFundWhole <= 108_000n) {
    throw new Error("BSC_TESTNET_HEART_FUND_WHOLE must exceed the 108000 normal cap");
  }
  const fortuneKaiosWhole = parsePositiveWhole("BSC_TESTNET_FORTUNE_KAIOS_WHOLE");
  if (fortuneKaiosWhole < 2n) {
    throw new Error("BSC_TESTNET_FORTUNE_KAIOS_WHOLE must be at least 2 for valid and redirect proofs");
  }

  const latestBlock = await provider.getBlock("latest");
  const utcSecondOfDay = BigInt(latestBlock.timestamp) % 86_400n;
  const balances = {
    nativeWei: await provider.getBalance(signerAddress),
    kgenWei: kgenAddress ? await new Contract(kgenAddress, BASIC_ERC20_ABI, provider).balanceOf(signerAddress) : 0n,
    kaiosWei: proofSourceAddress
      ? await new Contract(proofSourceAddress, BASIC_ERC20_ABI, provider).balanceOf(signerAddress)
      : 0n,
  };
  const requiredBalances = {
    kgenWei: parseUnits(heartFundWhole.toString(), 18),
    kaiosWei: parseUnits(fortuneKaiosWhole.toString(), 18),
  };
  if (balances.nativeWei === 0n) throw new Error("Confirmed signer has no testnet BNB for gas");
  if (!bootstrapFixtures) {
    if (balances.kgenWei < requiredBalances.kgenWei) {
      throw new Error("Confirmed signer lacks the acknowledged testnet KGEN rehearsal funding");
    }
    if (balances.kaiosWei < requiredBalances.kaiosWei) {
      throw new Error("Confirmed signer lacks the acknowledged KAIOS needed for two proof cases");
    }
  }

  if (requireExecution) {
    if (env("BSC_TESTNET_EXECUTE") !== TESTNET_EXECUTION_ACK) {
      throw new Error(`BSC_TESTNET_EXECUTE must equal ${TESTNET_EXECUTION_ACK}`);
    }
    if (mode === "existing" && env("BSC_TESTNET_PROXY_DISPOSITION") !== "DISPOSABLE_REHEARSAL_PROXY") {
      throw new Error(
        "Existing proxy execution requires BSC_TESTNET_PROXY_DISPOSITION=DISPOSABLE_REHEARSAL_PROXY",
      );
    }
    if (utcSecondOfDay >= 600n) {
      throw new Error(
        `Ignite smoke test requires UTC 00:00:00-00:09:59; current testnet second-of-day=${utcSecondOfDay}`,
      );
    }
  }

  console.log(JSON.stringify({
    status: "PASS",
    chainId: network.chainId.toString(),
    mode,
    signerAddress,
    signerRole,
    proxyAddress: proxyAddress ?? NEW_PROXY_SENTINEL,
    kgenAddress,
    treasury11520Address,
    proofSourceAddress,
    registryAddress,
    furnaceAddress,
    fortuneGameAddress,
    unauthorizedAddress,
    confirmations,
    heartFundWhole: heartFundWhole.toString(),
    fortuneKaiosWhole: fortuneKaiosWhole.toString(),
    utcSecondOfDay: utcSecondOfDay.toString(),
    executionAuthorized: requireExecution,
  }, null, 2));

  return {
    provider,
    mode,
    signerAddress,
    signerRole,
    proxyAddress,
    kgenAddress,
    treasury11520Address,
    proofSourceAddress,
    registryAddress,
    furnaceAddress,
    fortuneGameAddress,
    unauthorizedAddress,
    confirmations,
    heartFundWhole,
    fortuneKaiosWhole,
    bootstrapFixtures,
  };
}

async function signAndSubmitHolyCup({ heart, signer, chainId, civilizationId, wishHash, confirmations, suffix }) {
  const latestBlock = await signer.provider.getBlock("latest");
  const deadline = BigInt(latestBlock.timestamp + 3_600);
  const proofId = id(`TEMPLEHEART_V340_TESTNET_HOLY_CUP_${suffix}_${await heart.getAddress()}`);
  const signature = await signer.signTypedData(
    {
      name: "KGEN TempleHeart 12345",
      version: "3.4.0",
      chainId,
      verifyingContract: await heart.getAddress(),
    },
    {
      HolyCupProof: [
        { name: "claimant", type: "address" },
        { name: "civilizationId", type: "bytes32" },
        { name: "wishHash", type: "bytes32" },
        { name: "proofId", type: "bytes32" },
        { name: "deadline", type: "uint256" },
      ],
    },
    {
      claimant: await signer.getAddress(),
      civilizationId,
      wishHash,
      proofId,
      deadline,
    },
  );
  await waitFor(
    `Holy Cup ${suffix}`,
    heart.submitHolyCupProof(proofId, civilizationId, wishHash, deadline, signature),
    confirmations,
  );
}

async function createAlchemyProof({ heart, furnace, kaios, signer, civilizationId, wishHash, beneficiary, amount, confirmations, suffix }) {
  await waitFor(`Approve KAIOS ${suffix}`, kaios.approve(await furnace.getAddress(), amount), confirmations);
  const purpose = await heart.fortunePurposeCode();
  const destination = await heart.alchemyDestinationCode(purpose, wishHash);
  const receipt = await waitFor(
    `Create Alchemy proof ${suffix}`,
    furnace.burnForKufo(amount, beneficiary, civilizationId, destination),
    confirmations,
  );
  for (const log of receipt.logs) {
    try {
      const parsed = furnace.interface.parseLog(log);
      if (parsed?.name === "AlchemyProofCreated") return parsed.args.proofId;
    } catch {
      // Receipt contains logs from KAIOS and the Furnace.
    }
  }
  throw new Error(`AlchemyProofCreated not found for ${suffix}`);
}

async function runTestnetRehearsal() {
  try {
  const config = await assertTestnetConfiguration({ requireExecution: true });
  const privateKey = env("BSC_TESTNET_PRIVATE_KEY", { allowSecret: true });
  const wallet = new Wallet(privateKey, config.provider);
  if (getAddress(wallet.address) !== config.signerAddress) {
    throw new Error("BSC_TESTNET_PRIVATE_KEY does not match BSC_TESTNET_SIGNER_ADDRESS");
  }
  const signer = new NonceManager(wallet);
  if (config.bootstrapFixtures) {
    const fixtures = await bootstrapTestnetFixtures({
      signer,
      confirmations: config.confirmations,
      deployArtifact,
      waitFor,
      artifact,
    });
    Object.assign(config, fixtures);
    evidenceSession.evidence.contracts = {
      testKgen: fixtures.kgenAddress,
      test11520Treasury: fixtures.treasury11520Address,
      testKaiosAlchemyProofSource: fixtures.proofSourceAddress,
      testOrganRegistry: fixtures.registryAddress,
      testFortuneGameStub: fixtures.fortuneGameAddress,
      testFurnace18911: fixtures.furnaceAddress,
    };
  }
  const network = await config.provider.getNetwork();
  const candidateArtifact = artifact("KGEN_TempleHeart_Upgradeable");
  const baselineArtifact = artifact("KGEN_TempleHeart_V3_3_2_Baseline");
  const candidateInterface = new Interface(candidateArtifact.abi);
  let baselineImplementationAddress;
  let proxyAddress = config.proxyAddress;

  if (config.mode === "fresh") {
    const baseline = await deployArtifact(
      "KGEN_TempleHeart_V3_3_2_Baseline",
      signer,
      [],
      config.confirmations,
    );
    baselineImplementationAddress = await baseline.getAddress();
    const initializeData = new Interface(baselineArtifact.abi).encodeFunctionData("initialize", [
      config.signerAddress,
      config.signerAddress,
      config.signerAddress,
      config.signerAddress,
      config.kgenAddress,
      config.treasury11520Address,
      config.proofSourceAddress,
    ]);
    const proxy = await deployArtifact(
      "ERC1967Proxy",
      signer,
      [baselineImplementationAddress, initializeData],
      config.confirmations,
    );
    proxyAddress = await proxy.getAddress();
  } else {
    const implementationSlot = await config.provider.getStorage(proxyAddress, IMPLEMENTATION_SLOT);
    baselineImplementationAddress = implementationAddressFromSlot(implementationSlot);
    await requireContract(config.provider, baselineImplementationAddress, "Current V3.3.2 implementation");
  }

  const baselineRuntime = await config.provider.getCode(baselineImplementationAddress);
  if (!runtimeMatchesArtifact(baselineRuntime, baselineArtifact)) {
    throw new Error("Rehearsal baseline bytecode does not match the exact compiled V3.3.2 artifact");
  }

  const heart = new Contract(proxyAddress, candidateArtifact.abi, signer);
  if ((await heart.version()) !== "3.3.2") {
    throw new Error(`Proxy ${proxyAddress} is not running exact V3.3.2 before rehearsal`);
  }
  for (const [roleName, roleId] of REQUIRED_SIGNER_ROLES) {
    if (!(await heart.hasRole(roleId, config.signerAddress))) {
      throw new Error(`Confirmed signer lacks ${roleName} on rehearsal proxy`);
    }
    if (await heart.hasRole(roleId, config.unauthorizedAddress)) {
      throw new Error(`Unauthorized test address unexpectedly has ${roleName}`);
    }
  }

  await waitFor(
    "Bind Fortune Game",
    heart.setFortuneGame(config.fortuneGameAddress),
    config.confirmations,
  );
  const civilizationId = id(`TEMPLEHEART_V340_TESTNET_CIV_${proxyAddress}`);
  const wishHash = id(`TEMPLEHEART_V340_TESTNET_WISH_${proxyAddress}`);
  await waitFor(
    "Create pre-upgrade wish state",
    heart.makeWish(wishHash, civilizationId),
    config.confirmations,
  );
  const preUpgradeWish = await heart.activeWish(config.signerAddress);
  const preservedSlots = await readRawSlots(config.provider, proxyAddress, 0, 58);
  const candidate = await deployArtifact(
    "KGEN_TempleHeart_Upgradeable",
    signer,
    [],
    config.confirmations,
  );
  const candidateAddress = await candidate.getAddress();
  const candidateRuntime = await config.provider.getCode(candidateAddress);
  if (!runtimeMatchesArtifact(candidateRuntime, candidateArtifact)) {
    throw new Error("Deployed candidate bytecode does not match the compiled V3.4.0 artifact");
  }
  const upgradeData = candidateInterface.encodeFunctionData("upgradeToAndCall", [candidateAddress, "0x"]);
  await expectCallRevert(
    config.provider,
    { to: proxyAddress, from: config.unauthorizedAddress, data: upgradeData },
    "Unauthorized upgrade",
  );
  const initializeV340Data = candidateInterface.encodeFunctionData("initializeV340", [config.registryAddress]);
  await waitFor(
    "Upgrade V3.3.2 -> V3.4.0",
    heart.upgradeToAndCall(candidateAddress, initializeV340Data),
    config.confirmations,
  );

  const postUpgradeSlots = await readRawSlots(config.provider, proxyAddress, 0, 58);
  for (let index = 0; index < preservedSlots.length; index += 1) {
    if (preservedSlots[index] !== postUpgradeSlots[index]) {
      throw new Error(`Legacy storage slot ${index} changed during upgrade`);
    }
  }
  const appendedSlots = await readRawSlots(config.provider, proxyAddress, 58, 15);
  const postUpgradeWish = await heart.activeWish(config.signerAddress);
  if (postUpgradeWish.wishHash !== preUpgradeWish.wishHash || postUpgradeWish.civilizationId !== civilizationId) {
    throw new Error("Pre-upgrade wish state was not preserved");
  }
  if ((await heart.version()) !== "3.4.0") throw new Error("V3.4.0 version check failed");
  if ((await heart.gameSurvivalGateWhole()) !== 1_888n) throw new Error("1888 game gate check failed");
  if ((await heart.heartbeatMaxClaimsPerHour()) !== 88n) throw new Error("Heartbeat cap check failed");
  if ((await heart.igniteMaxClaimsPerDay()) !== 88n) throw new Error("Ignite cap check failed");
  if (getAddress(await heart.current11520Treasury()) !== config.treasury11520Address) {
    throw new Error("V3.4.0 did not resolve the confirmed 11520 treasury");
  }

  await waitFor(
    "Rollback V3.4.0 -> V3.3.2",
    heart.upgradeToAndCall(baselineImplementationAddress, "0x"),
    config.confirmations,
  );
  if ((await heart.version()) !== "3.3.2") throw new Error("Rollback version check failed");
  await waitFor(
    "Restore V3.4.0 after rollback",
    heart.upgradeToAndCall(candidateAddress, "0x"),
    config.confirmations,
  );
  if ((await heart.version()) !== "3.4.0") throw new Error("Post-rollback restore failed");

  const kgen = new Contract(config.kgenAddress, BASIC_ERC20_ABI, signer);
  const kaios = new Contract(config.proofSourceAddress, BASIC_ERC20_ABI, signer);
  const furnace = new Contract(config.furnaceAddress, FURNACE_ABI, signer);
  const fundingAmount = parseUnits(config.heartFundWhole.toString(), 18);
  const heartBeforeFunding = await kgen.balanceOf(proxyAddress);
  const treasuryBefore = await kgen.balanceOf(config.treasury11520Address);
  await waitFor("Fund rehearsal Heart", kgen.transfer(proxyAddress, fundingAmount), config.confirmations);
  await waitFor("Normalize Heart to 108000", heart.normalizeHeartBalance(), config.confirmations);
  const normalCap = parseUnits("108000", 18);
  if ((await kgen.balanceOf(proxyAddress)) !== normalCap) throw new Error("Heart normalization cap mismatch");
  const treasuryAfter = await kgen.balanceOf(config.treasury11520Address);
  if (treasuryAfter - treasuryBefore !== heartBeforeFunding + fundingAmount - normalCap) {
    throw new Error("11520 treasury did not receive the exact excess over 108000");
  }

  const heartbeatPaidBefore = await heart.totalHeartbeatPaid();
  const ignitePaidBefore = await heart.totalIgnitePaid();
  await waitFor("heartbeatClaim smoke", heart.heartbeatClaim(), config.confirmations);
  await expectCallRevert(
    config.provider,
    { to: proxyAddress, from: config.signerAddress, data: candidateInterface.encodeFunctionData("heartbeatClaim", []) },
    "Double heartbeat",
  );
  await waitFor("igniteAndClaim UTC smoke", heart.igniteAndClaim(), config.confirmations);
  await expectCallRevert(
    config.provider,
    { to: proxyAddress, from: config.signerAddress, data: candidateInterface.encodeFunctionData("igniteAndClaim", []) },
    "Double ignite",
  );
  if ((await heart.totalHeartbeatPaid()) !== heartbeatPaidBefore + parseUnits("1", 18)) {
    throw new Error("Heartbeat paid-total mismatch");
  }
  if ((await heart.totalIgnitePaid()) !== ignitePaidBefore + parseUnits("8", 18)) {
    throw new Error("Ignite paid-total mismatch");
  }

  const heartBalance = await kgen.balanceOf(proxyAddress);
  const gateAmount = parseUnits("1888", 18);
  const safePayout = heartBalance - gateAmount;
  if (config.fortuneGameContract) {
    await waitFor(
      "1888 game payout accepted",
      config.fortuneGameContract.payout(proxyAddress, config.signerAddress, safePayout),
      config.confirmations,
    );
  }
  const safeGameCall = candidateInterface.encodeFunctionData("gamePayout", [config.signerAddress, safePayout]);
  await config.provider.call({ to: proxyAddress, from: config.fortuneGameAddress, data: safeGameCall });
  const blockedGameCall = candidateInterface.encodeFunctionData("gamePayout", [
    config.signerAddress,
    safePayout + 1n,
  ]);
  await expectCallRevert(
    config.provider,
    { to: proxyAddress, from: config.fortuneGameAddress, data: blockedGameCall },
    "1888 game survival gate",
  );

  await signAndSubmitHolyCup({
    heart,
    signer,
    chainId: network.chainId,
    civilizationId,
    wishHash,
    confirmations: config.confirmations,
    suffix: "VALID",
  });
  const oneKaios = parseUnits("1", 18);
  const validProofId = await createAlchemyProof({
    heart,
    furnace,
    kaios,
    signer,
    civilizationId,
    wishHash,
    beneficiary: config.signerAddress,
    amount: oneKaios,
    confirmations: config.confirmations,
    suffix: "VALID",
  });
  const claimantBefore = await kgen.balanceOf(config.signerAddress);
  await waitFor("fortuneClaim smoke", heart.fortuneClaim(validProofId), config.confirmations);
  const claimantAfter = await kgen.balanceOf(config.signerAddress);
  const claimedAmount = claimantAfter - claimantBefore;
  if (claimedAmount < parseUnits("1", 18) || claimedAmount > parseUnits("8", 18)) {
    throw new Error("Fortune reward was outside the canonical 1-8 KGEN range");
  }
  await expectCallRevert(
    config.provider,
    { to: proxyAddress, from: config.signerAddress, data: candidateInterface.encodeFunctionData("fortuneClaim", [validProofId]) },
    "Fortune proof replay",
  );
  await waitFor("Approve voluntary Fortune repayment", kgen.approve(proxyAddress, parseUnits("1", 18)), config.confirmations);
  await waitFor("Voluntary Fortune repayment", heart.voluntaryRepayFortune(parseUnits("1", 18)), config.confirmations);
  const ledger = await heart.fortuneLedger(config.signerAddress);
  if (!ledger.repaidAfterLastClaim) throw new Error("Voluntary repayment did not restore next-round qualification");

  const redirectWishHash = id(`TEMPLEHEART_V340_TESTNET_REDIRECT_WISH_${proxyAddress}`);
  await waitFor(
    "Create redirect-rejection wish",
    heart.makeWish(redirectWishHash, civilizationId),
    config.confirmations,
  );
  await signAndSubmitHolyCup({
    heart,
    signer,
    chainId: network.chainId,
    civilizationId,
    wishHash: redirectWishHash,
    confirmations: config.confirmations,
    suffix: "REDIRECT",
  });
  const redirectProofId = await createAlchemyProof({
    heart,
    furnace,
    kaios,
    signer,
    civilizationId,
    wishHash: redirectWishHash,
    beneficiary: config.fortuneGameAddress,
    amount: oneKaios,
    confirmations: config.confirmations,
    suffix: "REDIRECT",
  });
  await expectCallRevert(
    config.provider,
    { to: proxyAddress, from: config.signerAddress, data: candidateInterface.encodeFunctionData("fortuneClaim", [redirectProofId]) },
    "Fortune beneficiary redirect",
  );

  writeEvidenceFiles("TEMPLEHEART_V3_4_TESTNET_REHEARSAL_PASS", {
    contracts: {
      ...evidenceSession.evidence.contracts,
      templeHeartV332Implementation: baselineImplementationAddress,
      templeHeartProxy: proxyAddress,
      templeHeartV340Implementation: candidateAddress,
    },
    storagePreservation: "58 legacy slots preserved; 15 append-only slots read",
    attackTests: {
      unauthorizedUpgrade: "PASS",
      doubleHeartbeat: "PASS",
      doubleIgnite: "PASS",
      fortuneProofReplay: "PASS",
      fortuneBeneficiaryRedirect: "PASS",
    },
    runtimeTests: {
      heartbeatClaim: "PASS",
      igniteAndClaim: "PASS",
      fortuneClaim: "PASS",
      voluntaryRepayment: "PASS",
      gameSurvivalGate1888: "PASS",
      normalization108000: "PASS",
      rollbackAndRestore: "PASS",
    },
  });
  console.log(JSON.stringify({ status: "TEMPLEHEART_V3_4_TESTNET_REHEARSAL_PASS" }, null, 2));
  } catch (error) {
    writeEvidenceFiles("TEMPLEHEART_V3_4_TESTNET_REHEARSAL_FAIL", {
      failure: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

if (process.argv.includes("--testnet-preflight")) {
  try {
    const config = await assertTestnetConfiguration({ requireExecution: false });
    await config.provider.destroy();
  } catch (error) {
    writeEvidenceFiles("TEMPLEHEART_V3_4_TESTNET_REHEARSAL_FAIL", {
      failure: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

if (process.argv.includes("--testnet-rehearsal")) {
  await runTestnetRehearsal();
}
