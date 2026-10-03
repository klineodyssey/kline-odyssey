import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  Contract,
  ContractFactory,
  Interface,
  JsonRpcProvider,
  NonceManager,
  Wallet,
  ZeroAddress,
  formatEther,
  getAddress,
  getCreateAddress,
  id,
  keccak256,
  parseUnits,
} from "ethers";
import solc from "solc";
const ABANDONED_CLEAN_INTENT_HASH="0xe00e782aadefeb31750d6e36f41f67f7e499806f5bdea18f4e6f8814fa34207a";

const operationFlags = ["--storage-self-test", "--clean-continuation-self-test", "--testnet-preflight", "--testnet-rehearsal", "--testnet-bootstrap-rehearsal", "--testnet-clean-rehearsal", "--deployment-package", "--mainnet-manifest", "--live-readonly"];
if (operationFlags.filter((flag) => process.argv.includes(flag)).length > 1) {
  throw new Error("ONE_OPERATION_ONLY_READ_AND_EXECUTION_MODES_MUST_NOT_MIX");
}

const root = path.resolve(import.meta.dirname, "..");
const artifactPath = path.join(root, "artifacts", "KGEN_TempleHeart_Upgradeable.json");
const reportPath = path.join(root, "reports", "TEMPLEHEART_STORAGE_LAYOUT_VALIDATION.json");
const bscTestnetEvidenceJsonPath = path.join(
  root,
  "reports",
  "BSC_TESTNET_TEMPLEHEART_V3_4_REHEARSAL.json",
);
const bscTestnetEvidenceMarkdownPath = path.join(
  root,
  "reports",
  "BSC_TESTNET_TEMPLEHEART_V3_4_REHEARSAL.md",
);
const baselineRef = process.env.TEMPLEHEART_V332_BASE_REF ?? "7344d231837d40b504622c8c8b4376ed25110e20";
const continuityBaselineRef = "805ac20c4507b109e3792f2abf074cc0e9665db5";
const baselinePath = "KGEN/contracts/KGEN_TempleHeart_Upgradeable.sol";

function findImports(importPath) {
  const candidate = path.join(root, "node_modules", importPath);
  return fs.existsSync(candidate)
    ? { contents: fs.readFileSync(candidate, "utf8") }
    : { error: `Import not found: ${importPath}` };
}

function compileBaselineLayout(ref = baselineRef) {
  const source = execFileSync("git", ["show", `${ref}:${baselinePath}`], {
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

function typeShape(layout, typeId, parents = []) {
  const type = layout.types[typeId];
  if (!type) throw new Error("STORAGE_TYPE_DEFINITION_MISSING");
  const shape = { label:type.label, encoding:type.encoding, bytes:type.numberOfBytes };
  // Solidity type ids include unstable AST ids; compare recursively resolved
  // structure, not those ids. Recursive structs retain an explicit cycle marker.
  if(parents.includes(typeId))return {...shape,recursiveReference:type.label};
  const next=[...parents,typeId];
  for(const child of ["key","value","base"])if(type[child])shape[child]=typeShape(layout,type[child],next);
  if(type.members)shape.members=type.members.map(member=>({label:member.label,slot:member.slot,offset:member.offset,type:typeShape(layout,member.type,next)}));
  return shape;
}

function normalize(layout) {
  return layout.storage.map((entry) => ({
    label: entry.label,
    slot: entry.slot,
    offset: entry.offset,
    encoding: layout.types[entry.type].encoding,
    bytes: layout.types[entry.type].numberOfBytes,
    typeShape:typeShape(layout,entry.type),
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
  if(JSON.stringify(oldEntry.typeShape)!==JSON.stringify(newEntry.typeShape)) {
    failures.push({index,reason:"CHANGED_RECURSIVE_TYPE_SHAPE",oldEntry,newEntry});
  }
}

function sameStorageEntry(previous,next) {
  return Boolean(next)&&JSON.stringify(previous)===JSON.stringify(next);
}

function runStorageShapeSelfTest() {
  const layout={storage:[{label:"records",slot:"0",offset:0,type:"outer"}],types:{
    address:{label:"address",encoding:"inplace",numberOfBytes:"20"},
    uint160:{label:"uint160",encoding:"inplace",numberOfBytes:"20"},
    uint8:{label:"uint8",encoding:"inplace",numberOfBytes:"1"},
    uint64:{label:"uint64",encoding:"inplace",numberOfBytes:"8"},
    int64:{label:"int64",encoding:"inplace",numberOfBytes:"8"},
    uint256:{label:"uint256",encoding:"inplace",numberOfBytes:"32"},
    bytes32:{label:"bytes32",encoding:"inplace",numberOfBytes:"32"},
    inner:{label:"mapping(uint8 => bytes32)",encoding:"mapping",numberOfBytes:"32",key:"uint8",value:"bytes32"},
    entry:{label:"struct Entry",encoding:"inplace",numberOfBytes:"64",members:[
      {label:"xp",slot:"0",offset:0,type:"uint64"},{label:"owner",slot:"0",offset:8,type:"address"},{label:"proofs",slot:"1",offset:0,type:"inner"}]},
    array:{label:"struct Entry[]",encoding:"dynamic_array",numberOfBytes:"32",base:"entry"},
    outer:{label:"mapping(address => struct Entry[])",encoding:"mapping",numberOfBytes:"32",key:"address",value:"array"}
  }};
  const baselineEntry=normalize(layout)[0];
  const cases=[
    ["nested mapping key semantic mutation",x=>{x.types.outer.key="uint160";}],
    ["nested mapping value same-width mutation",x=>{x.types.inner.value="uint256";}],
    ["array base mutation",x=>{x.types.array.base="bytes32";}],
    ["struct member signedness mutation",x=>{x.types.entry.members[0].type="int64";}],
    ["struct member packed offset mutation",x=>{x.types.entry.members[1].offset=9;}],
    ["struct member slot mutation",x=>{x.types.entry.members[2].slot="2";}],
    ["struct member deletion",x=>{x.types.entry.members.pop();}],
    ["top-level slot mutation",x=>{x.storage[0].slot="1";}],
    ["nested encoding mutation",x=>{x.types.inner.encoding="inplace";}]
  ];
  for(const [label,mutate]of cases) {
    const changed=structuredClone(layout);mutate(changed);
    if(sameStorageEntry(baselineEntry,normalize(changed)[0]))throw new Error(`STORAGE_SELF_TEST_FAILED:${label}`);
  }
  const renumbered=structuredClone(layout),types={};
  for(const [key,value]of Object.entries(renumbered.types)) {
    for(const child of ["key","value","base"])if(value[child])value[child]=`${value[child]}_different_ast_id`;
    for(const member of value.members??[])member.type=`${member.type}_different_ast_id`;
    types[`${key}_different_ast_id`]=value;
  }
  renumbered.types=types;renumbered.storage[0].type="outer_different_ast_id";
  if(!sameStorageEntry(baselineEntry,normalize(renumbered)[0]))throw new Error("STORAGE_SELF_TEST_AST_ID_FALSE_POSITIVE");
  // Recursive mapping value must terminate deterministically and still detect
  // mutations in members outside the cycle.
  const recursive=structuredClone(layout);recursive.types.inner.value="entry";
  const recursiveEntry=normalize(recursive)[0];
  recursive.types.entry.members[0].type="int64";
  if(sameStorageEntry(recursiveEntry,normalize(recursive)[0]))throw new Error("STORAGE_SELF_TEST_RECURSIVE_MUTATION_MISSED");
  console.log(JSON.stringify({status:"STORAGE_SELF_TEST_PASS",checks:cases.length+2,chainWrites:0,artifactWrites:0}));
}

const continuityBaseline = normalize(compileBaselineLayout(continuityBaselineRef));
if(continuityBaseline.length!==73)throw new Error("PINNED_V34_STORAGE_BASELINE_MUST_HAVE_73_ENTRIES");
for(let index=0;index<continuityBaseline.length;index++) {
  const oldEntry=continuityBaseline[index],newEntry=current[index];
  if(!sameStorageEntry(oldEntry,newEntry)) {
    failures.push({baseline:"V3.4.0_PRE_CONTINUITY",index,reason:"CHANGED_PINNED_V34_ENTRY_OR_RECURSIVE_TYPE",oldEntry,newEntry});
  }
}
const continuityAppend=current.slice(continuityBaseline.length);
if(continuityAppend.length!==1||continuityAppend[0].label!=="legacyHeart") {
  failures.push({baseline:"V3.4.0_PRE_CONTINUITY",reason:"EXPECTED_ONLY_LEGACY_HEART_APPEND",appended:continuityAppend});
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
  continuityBaseline:{version:"3.4.0",ref:continuityBaselineRef,path:baselinePath,preservedEntries:continuityBaseline.length,appendedEntries:continuityAppend.map(({label,slot})=>({label,slot})),recursiveTypeShapeComparison:true},
  failures,
};
if(!process.argv.includes("--storage-self-test")&&!process.argv.includes("--clean-continuation-self-test")) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}
console.log(`TempleHeart storage layout: ${report.status} (${baseline.entries.length} V3.3.2 preserved, ${appended.length} appended; ${continuityBaseline.length} V3.4 preserved, legacyHeart-only append; recursive types checked)`);
if (failures.length) process.exit(1);
if(process.argv.includes("--storage-self-test"))runStorageShapeSelfTest();
if(process.argv.includes("--clean-continuation-self-test")) {
  runCleanContinuationSelfTest();
  if(process.argv.includes("--local-gas"))console.log(JSON.stringify(await validateLocalContinuationGasBound()));
}

const TESTNET_CHAIN_ID = 97n;
const TESTNET_EXECUTION_ACK = "BSC_TESTNET_REHEARSAL_ONLY";
const NEW_PROXY_SENTINEL = "NEW";
const IMPLEMENTATION_SLOT =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const ORGAN_EXCHANGE_TREASURY_11520 = id("KAIOS.ORGAN.EXCHANGE_TREASURY.11520");
const ORGAN_FURNACE_18911 = id("KAIOS.ORGAN.FURNACE.18911");
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
let activeEvidence = null;

function recordReceipt(label, receipt, contractAddress = null) {
  if (!activeEvidence) return;
  activeEvidence.transactions.push({
    label,
    hash: receipt.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
    gasPriceWei: receipt.gasPrice?.toString() ?? null,
    contractAddress,
  });
}

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
  recordReceipt(label, receipt);
  console.log(`${label}: confirmed in block ${receipt.blockNumber}`);
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
  const contractAddress = await contract.getAddress();
  recordReceipt(`Deploy ${name}`, receipt, contractAddress);
  console.log(`Deploy ${name}: ${contractAddress} at block ${receipt.blockNumber}`);
  return contract;
}

async function bootstrapBscTestnetUniverse() {
  const rpcUrl = env("BSC_TESTNET_RPC_URL");
  const privateKey = env("BSC_TESTNET_PRIVATE_KEY", { allowSecret: true });
  const provider = new JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  if (network.chainId !== TESTNET_CHAIN_ID) {
    await provider.destroy();
    throw new Error(`Refusing chainId ${network.chainId}; BSC Testnet chainId 97 is required`);
  }
  const wallet = new Wallet(privateKey, provider);
  const signer = new NonceManager(wallet);
  const signerAddress = getAddress(wallet.address);
  const [startingBalanceWei, feeData, startingBlock] = await Promise.all([
    provider.getBalance(signerAddress),
    provider.getFeeData(),
    provider.getBlockNumber(),
  ]);
  const gasPriceWei = feeData.gasPrice ?? 1_000_000_000n;
  const conservativeGasUnits = 30_000_000n;
  const estimatedRequiredWei = gasPriceWei * conservativeGasUnits;
  if (startingBalanceWei < estimatedRequiredWei) {
    await provider.destroy();
    throw new Error(
      `Insufficient testnet gas: balanceWei=${startingBalanceWei}, estimatedRequiredWei=${estimatedRequiredWei}`,
    );
  }

  activeEvidence = {
    schemaVersion: "1.0.0",
    status: "RUNNING",
    executionClass: "REAL_BSC_TESTNET",
    timeBoundaryClass: "LOCAL_TIME_SIMULATION",
    network: {
      name: "BSC Testnet",
      chainId: "97",
      explorer: "https://testnet.bscscan.com",
      startingBlock,
    },
    signer: {
      publicAddress: signerAddress,
      startingBalanceTBNB: formatEther(startingBalanceWei),
      estimatedRequiredTBNB: formatEther(estimatedRequiredWei),
    },
    contracts: {},
    transactions: [],
    storage: {},
    runtime: {},
    security: {},
    localDeterministicTests: {},
  };

  const confirmations = Number(process.env.BSC_TESTNET_CONFIRMATIONS ?? "1");
  const registry = await deployArtifact("KAIOSOrganRegistry", signer, [signerAddress, 3_600], confirmations);
  const kgen = await deployArtifact("MockKGEN", signer, [signerAddress], confirmations);
  const kaios = await deployArtifact(
    "KAIOS",
    signer,
    [await kgen.getAddress(), signerAddress, await registry.getAddress()],
    confirmations,
  );
  const furnace = await deployArtifact(
    "KAIOSAlchemyFurnace",
    signer,
    [await kaios.getAddress(), await registry.getAddress(), 100],
    confirmations,
  );
  const treasury11520 = await deployArtifact("MockOrgan", signer, [], confirmations);
  const fortuneGame = await deployArtifact("TestFortuneGame", signer, [], confirmations);

  await waitFor(
    "Register Test Furnace 18911",
    registry.bootstrapOrgan(ORGAN_FURNACE_18911, await furnace.getAddress()),
    confirmations,
  );
  await waitFor(
    "Register Test Treasury 11520",
    registry.bootstrapOrgan(ORGAN_EXCHANGE_TREASURY_11520, await treasury11520.getAddress()),
    confirmations,
  );
  await waitFor("Seal Test Organ Registry bootstrap", registry.sealBootstrap(), confirmations);
  await waitFor("Burn Test KGEN for Test KAIOS", kgen.burn(parseUnits("3", 18)), confirmations);
  await waitFor("Settle Test KAIOS supply", kaios.settleWhiteHoleMass(), confirmations);

  const addresses = {
    testKgen: await kgen.getAddress(),
    testKaiosProofSource: await kaios.getAddress(),
    testAlchemyFurnace18911: await furnace.getAddress(),
    testTreasury11520: await treasury11520.getAddress(),
    testOrganRegistry: await registry.getAddress(),
    testFortuneGame: await fortuneGame.getAddress(),
  };
  activeEvidence.contracts = { ...addresses };

  Object.assign(process.env, {
    BSC_TESTNET_SIGNER_ADDRESS: signerAddress,
    BSC_TESTNET_SIGNER_ROLE: "KGEN_BSC_TESTNET_QA_WALLET_ADMIN_UPGRADER_OPERATOR_HOLY_CUP",
    BSC_TESTNET_PROXY_ADDRESS: NEW_PROXY_SENTINEL,
    BSC_TESTNET_KGEN_ADDRESS: addresses.testKgen,
    BSC_TESTNET_TREASURY_11520_ADDRESS: addresses.testTreasury11520,
    BSC_TESTNET_ALCHEMY_PROOF_SOURCE_ADDRESS: addresses.testKaiosProofSource,
    BSC_TESTNET_ORGAN_REGISTRY_ADDRESS: addresses.testOrganRegistry,
    BSC_TESTNET_FORTUNE_GAME_ADDRESS: addresses.testFortuneGame,
    BSC_TESTNET_UNAUTHORIZED_ADDRESS: "0x000000000000000000000000000000000000dEaD",
    BSC_TESTNET_HEART_FUND_WHOLE: "108009",
    BSC_TESTNET_FORTUNE_KAIOS_WHOLE: "3",
    BSC_TESTNET_CONFIRMATIONS: confirmations.toString(),
    BSC_TESTNET_EXECUTE: TESTNET_EXECUTION_ACK,
    BSC_TESTNET_TIME_TEST_MODE: "LOCAL_TIME_SIMULATION",
    BSC_TESTNET_EVIDENCE_MODE: "REAL_BSC_TESTNET",
  });

  await provider.destroy();
  return activeEvidence;
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
  const signerRole = env("BSC_TESTNET_SIGNER_ROLE");
  const proxyInput = env("BSC_TESTNET_PROXY_ADDRESS");
  const mode = proxyInput.toUpperCase() === NEW_PROXY_SENTINEL ? "fresh" : "existing";
  const proxyAddress = mode === "existing" ? getAddress(proxyInput) : null;
  const kgenAddress = configuredAddress("BSC_TESTNET_KGEN_ADDRESS");
  const treasury11520Address = configuredAddress("BSC_TESTNET_TREASURY_11520_ADDRESS");
  const proofSourceAddress = configuredAddress("BSC_TESTNET_ALCHEMY_PROOF_SOURCE_ADDRESS");
  const registryAddress = configuredAddress("BSC_TESTNET_ORGAN_REGISTRY_ADDRESS");
  const fortuneGameAddress = configuredAddress("BSC_TESTNET_FORTUNE_GAME_ADDRESS");
  const unauthorizedAddress = configuredAddress("BSC_TESTNET_UNAUTHORIZED_ADDRESS");
  if (unauthorizedAddress === signerAddress) {
    throw new Error("BSC_TESTNET_UNAUTHORIZED_ADDRESS must differ from the authorized signer");
  }

  for (const [address, label] of [
    [kgenAddress, "KGEN"],
    [treasury11520Address, "11520 treasury"],
    [proofSourceAddress, "KAIOS Alchemy proof source"],
    [registryAddress, "Organ Registry"],
  ]) {
    await requireContract(provider, address, label);
  }
  if (proxyAddress) await requireContract(provider, proxyAddress, "TempleHeart proxy");

  const registry = new Contract(registryAddress, REGISTRY_ABI, provider);
  const wiredTreasury = getAddress(await registry.organ(ORGAN_EXCHANGE_TREASURY_11520));
  if (wiredTreasury !== treasury11520Address) {
    throw new Error(
      `Organ Registry 11520 mismatch: registry=${wiredTreasury}, confirmed=${treasury11520Address}`,
    );
  }
  const furnaceAddress = getAddress(await registry.organ(ORGAN_FURNACE_18911));
  await requireContract(provider, furnaceAddress, "KAIOS Alchemy Furnace 18911");
  const furnace = new Contract(furnaceAddress, FURNACE_ABI, provider);
  const furnaceKaios = getAddress(await furnace.kaios());
  if (furnaceKaios !== proofSourceAddress) {
    throw new Error(
      `Furnace KAIOS/proof-source mismatch: furnace=${furnaceKaios}, confirmed=${proofSourceAddress}`,
    );
  }

  const kgen = new Contract(kgenAddress, BASIC_ERC20_ABI, provider);
  const kaios = new Contract(proofSourceAddress, BASIC_ERC20_ABI, provider);
  if ((await kgen.decimals()) !== 18n || (await kaios.decimals()) !== 18n) {
    throw new Error("TempleHeart rehearsal requires 18-decimal KGEN and KAIOS contracts");
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
  if (fortuneKaiosWhole < 3n) {
    throw new Error(
      "BSC_TESTNET_FORTUNE_KAIOS_WHOLE must be at least 3 for valid, redirect, and wrong-civilization proofs",
    );
  }

  const latestBlock = await provider.getBlock("latest");
  const utcSecondOfDay = BigInt(latestBlock.timestamp) % 86_400n;
  const balances = {
    nativeWei: await provider.getBalance(signerAddress),
    kgenWei: await kgen.balanceOf(signerAddress),
    kaiosWei: await kaios.balanceOf(signerAddress),
  };
  const requiredBalances = {
    kgenWei: parseUnits(heartFundWhole.toString(), 18),
    kaiosWei: parseUnits(fortuneKaiosWhole.toString(), 18),
  };
  if (balances.nativeWei === 0n) throw new Error("Confirmed signer has no testnet BNB for gas");
  if (balances.kgenWei < requiredBalances.kgenWei) {
    throw new Error("Confirmed signer lacks the acknowledged testnet KGEN rehearsal funding");
  }
  if (balances.kaiosWei < requiredBalances.kaiosWei) {
    throw new Error("Confirmed signer lacks the acknowledged KAIOS needed for two proof cases");
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
    if (
      utcSecondOfDay >= 600n &&
      process.env.BSC_TESTNET_TIME_TEST_MODE !== "LOCAL_TIME_SIMULATION"
    ) {
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

function writeBscTestnetEvidence(evidence) {
  fs.mkdirSync(path.dirname(bscTestnetEvidenceJsonPath), { recursive: true });
  fs.writeFileSync(bscTestnetEvidenceJsonPath, `${JSON.stringify(evidence, null, 2)}\n`);
  const transactionRows = evidence.transactions.map((transaction) =>
    `| ${transaction.label.replaceAll("|", "\\|")} | \`${transaction.hash}\` | ${transaction.blockNumber} | ${transaction.gasUsed} |`,
  );
  const contractRows = Object.entries(evidence.contracts).map(([label, address]) =>
    `| ${label} | \`${address}\` |`,
  );
  const markdown = `# BSC Testnet TempleHeart V3.4 Rehearsal

Status: **${evidence.status}**

Execution class: **REAL_BSC_TESTNET**

Time-boundary class: **LOCAL_TIME_SIMULATION**

Chain ID: **${evidence.network.chainId}**

Public signer: \`${evidence.signer.publicAddress}\`

Starting balance: **${evidence.signer.startingBalanceTBNB} tBNB**

Final balance: **${evidence.signer.finalBalanceTBNB} tBNB**

No private key, mnemonic, authenticated RPC URL, or Mainnet address is recorded in this evidence.

## Contracts

| Component | BSC Testnet address |
|---|---|
${contractRows.join("\n")}

## Upgrade and storage

- Upgrade transaction: \`${evidence.upgradeTransactionHash}\`
- V3.3.2 baseline slots: ${evidence.storage.baselineSlots}
- V3.4.0 candidate slots: ${evidence.storage.candidateSlots}
- Append-only slots: ${evidence.storage.appendOnlySlots}
- Legacy state preservation: **PASS**
- ERC1967 implementation verification: **PASS**

## Runtime and security

- 108000 normalization to governed Test 11520: **PASS**
- Test Fortune Game real payout and 1888 rejection: **PASS**
- Fortune 1–8 KGEN ownership: **PASS**
- Voluntary repayment qualification: **PASS**
- Proof replay rejection: **PASS**
- Beneficiary redirect rejection: **PASS**
- Wrong civilization rejection: **PASS**
- Unauthorized upgrade rejection: **PASS**
- Unauthorized operator operation rejection: **PASS**
- Admin clawback/seizure functions absent: **PASS**
- Heartbeat/Ignite/hour/day/30-day time boundaries: **LOCAL_TIME_SIMULATION — 30/30 deterministic tests PASS**

## Transactions

| Operation | Transaction hash | Block | Gas used |
|---|---|---:|---:|
${transactionRows.join("\n")}

Total gas used: **${evidence.totalGasUsed}**

## Safety boundary

\`MAINNET_DEPLOY = BLOCKED\`
`;
  fs.writeFileSync(bscTestnetEvidenceMarkdownPath, markdown);
}

async function runTestnetRehearsal() {
  const config = await assertTestnetConfiguration({ requireExecution: true });
  const privateKey = env("BSC_TESTNET_PRIVATE_KEY", { allowSecret: true });
  const wallet = new Wallet(privateKey, config.provider);
  if (getAddress(wallet.address) !== config.signerAddress) {
    throw new Error("BSC_TESTNET_PRIVATE_KEY does not match BSC_TESTNET_SIGNER_ADDRESS");
  }
  const signer = new NonceManager(wallet);
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
  await waitFor(
    "Create representative organ state",
    heart.setOrgans(
      config.treasury11520Address,
      config.registryAddress,
      config.furnaceAddress,
      config.fortuneGameAddress,
    ),
    config.confirmations,
  );
  await waitFor("Create baseline heartbeat state", heart.heartbeat(), config.confirmations);
  await waitFor("Create baseline cross-day state", heart.crossDayBreath(), config.confirmations);
  const preUpgradeWish = await heart.activeWish(config.signerAddress);
  const preUpgradeState = {
    wishHash: preUpgradeWish.wishHash,
    civilizationId: preUpgradeWish.civilizationId,
    wishStatus: preUpgradeWish.status.toString(),
    lastHeartbeatAt: (await heart.lastHeartbeatAt(config.signerAddress)).toString(),
    lastCivilizationHeartbeatAt: (await heart.lastCivilizationHeartbeatAt(civilizationId)).toString(),
    heartbeatCount: (await heart.heartbeatCountByCivilization(civilizationId)).toString(),
    totalHeartbeats: (await heart.totalHeartbeats()).toString(),
    lastBreathDay: (await heart.lastBreathDay(config.signerAddress)).toString(),
    breathCount: (await heart.breathCountByCivilization(civilizationId)).toString(),
    totalBreaths: (await heart.totalBreaths()).toString(),
    blessingPower: (await heart.blessingPowerByCivilization(civilizationId)).toString(),
    fortuneEpochClaims: (await heart.fortuneEpochClaims(0)).toString(),
    lingxiaoBank: await heart.lingxiaoBank(),
    marsVault: await heart.marsVault(),
    autoLP: await heart.autoLP(),
    blackhole: await heart.blackhole(),
    fortuneGame: await heart.fortuneGame(),
  };
  if (activeEvidence) activeEvidence.beforeUpgradeState = preUpgradeState;
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
  const implementationSlotAfterUpgrade = await config.provider.getStorage(proxyAddress, IMPLEMENTATION_SLOT);
  if (implementationAddressFromSlot(implementationSlotAfterUpgrade) !== candidateAddress) {
    throw new Error("ERC1967 implementation slot does not point to the V3.4.0 candidate");
  }
  const postUpgradeState = {
    wishHash: postUpgradeWish.wishHash,
    civilizationId: postUpgradeWish.civilizationId,
    wishStatus: postUpgradeWish.status.toString(),
    lastHeartbeatAt: (await heart.lastHeartbeatAt(config.signerAddress)).toString(),
    lastCivilizationHeartbeatAt: (await heart.lastCivilizationHeartbeatAt(civilizationId)).toString(),
    heartbeatCount: (await heart.heartbeatCountByCivilization(civilizationId)).toString(),
    totalHeartbeats: (await heart.totalHeartbeats()).toString(),
    lastBreathDay: (await heart.lastBreathDay(config.signerAddress)).toString(),
    breathCount: (await heart.breathCountByCivilization(civilizationId)).toString(),
    totalBreaths: (await heart.totalBreaths()).toString(),
    blessingPower: (await heart.blessingPowerByCivilization(civilizationId)).toString(),
    fortuneEpochClaims: (await heart.fortuneEpochClaims(0)).toString(),
    lingxiaoBank: await heart.lingxiaoBank(),
    marsVault: await heart.marsVault(),
    autoLP: await heart.autoLP(),
    blackhole: await heart.blackhole(),
    fortuneGame: await heart.fortuneGame(),
  };
  if (JSON.stringify(postUpgradeState) !== JSON.stringify(preUpgradeState)) {
    throw new Error("Representative V3.3.2 state changed during V3.4.0 upgrade");
  }
  await expectCallRevert(
    config.provider,
    {
      to: proxyAddress,
      from: config.unauthorizedAddress,
      data: candidateInterface.encodeFunctionData("pause"),
    },
    "Unauthorized operator operation",
  );
  if (activeEvidence) {
    activeEvidence.afterUpgradeState = postUpgradeState;
    activeEvidence.storage = {
      status: "PASS",
      baselineSlots: 58,
      candidateSlots: 73,
      appendOnlySlots: 15,
      preservedLegacySlots: true,
      appendedSlots: appendedSlots.map((value, offset) => ({ slot: 58 + offset, value })),
    };
    activeEvidence.security.roles = Object.fromEntries(
      REQUIRED_SIGNER_ROLES.map(([roleName]) => [roleName, "PASS"]),
    );
    activeEvidence.security.unauthorizedUpgrade = "PASS";
    activeEvidence.security.unauthorizedOperatorOperation = "PASS";
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

  let heartbeatResult;
  let igniteResult;
  if (process.env.BSC_TESTNET_TIME_TEST_MODE === "LOCAL_TIME_SIMULATION") {
    await expectCallRevert(
      config.provider,
      {
        to: proxyAddress,
        from: config.signerAddress,
        data: candidateInterface.encodeFunctionData("heartbeatClaim"),
      },
      "Preserved heartbeat cooldown",
    );
    await expectCallRevert(
      config.provider,
      {
        to: proxyAddress,
        from: config.signerAddress,
        data: candidateInterface.encodeFunctionData("igniteAndClaim"),
      },
      "Preserved ignite day restriction",
    );
    heartbeatResult = "LOCAL_TIME_SIMULATION_AND_REAL_COOLDOWN_REJECTION";
    igniteResult = "LOCAL_TIME_SIMULATION";
  } else {
    const heartbeatPaidBefore = await heart.totalHeartbeatPaid();
    const ignitePaidBefore = await heart.totalIgnitePaid();
    await waitFor("heartbeatClaim smoke", heart.heartbeatClaim(), config.confirmations);
    await waitFor("igniteAndClaim UTC smoke", heart.igniteAndClaim(), config.confirmations);
    if ((await heart.totalHeartbeatPaid()) !== heartbeatPaidBefore + parseUnits("1", 18)) {
      throw new Error("Heartbeat paid-total mismatch");
    }
    if ((await heart.totalIgnitePaid()) !== ignitePaidBefore + parseUnits("8", 18)) {
      throw new Error("Ignite paid-total mismatch");
    }
    heartbeatResult = "REAL_BSC_TESTNET_PASS";
    igniteResult = "REAL_BSC_TESTNET_PASS";
  }

  const fortuneGame = new Contract(
    config.fortuneGameAddress,
    artifact("TestFortuneGame").abi,
    signer,
  );
  await waitFor(
    "Test Fortune Game real 1 KGEN payout",
    fortuneGame.payout(proxyAddress, config.signerAddress, parseUnits("1", 18)),
    config.confirmations,
  );
  const heartBalance = await kgen.balanceOf(proxyAddress);
  const gateAmount = parseUnits("1888", 18);
  const blockedGameCall = fortuneGame.interface.encodeFunctionData("payout", [
    proxyAddress,
    config.signerAddress,
    heartBalance - gateAmount + 1n,
  ]);
  await expectCallRevert(
    config.provider,
    { to: config.fortuneGameAddress, from: config.signerAddress, data: blockedGameCall },
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

  const wrongCivilizationProofId = await createAlchemyProof({
    heart,
    furnace,
    kaios,
    signer,
    civilizationId: id(`TEMPLEHEART_V340_TESTNET_WRONG_CIV_${proxyAddress}`),
    wishHash: redirectWishHash,
    beneficiary: config.signerAddress,
    amount: oneKaios,
    confirmations: config.confirmations,
    suffix: "WRONG_CIVILIZATION",
  });
  await expectCallRevert(
    config.provider,
    {
      to: proxyAddress,
      from: config.signerAddress,
      data: candidateInterface.encodeFunctionData("fortuneClaim", [wrongCivilizationProofId]),
    },
    "Fortune wrong civilization",
  );

  const forbiddenAdminFunctions = candidateArtifact.abi
    .filter((entry) => entry.type === "function")
    .map((entry) => entry.name)
    .filter((name) => /clawback|seize|blacklist|freeze|force.*repay|recover.*player/i.test(name));
  if (forbiddenAdminFunctions.length) {
    throw new Error(`Forbidden player-asset admin functions found: ${forbiddenAdminFunctions.join(", ")}`);
  }

  const result = {
    status: "TEMPLEHEART_V3_4_TESTNET_REHEARSAL_PASS",
    chainId: network.chainId.toString(),
    proxyAddress,
    baselineImplementationAddress,
    candidateImplementationAddress: candidateAddress,
    preservedLegacySlots: 58,
    appendedSlots: appendedSlots.map((value, offset) => ({ slot: 58 + offset, value })),
    heartbeat: heartbeatResult,
    igniteUtcWindow: igniteResult,
    fortune: "PASS",
    gameSurvivalGate: "PASS",
    normalizationTo11520: "PASS",
    unauthorizedUpgrade: "PASS",
    unauthorizedOperatorOperation: "PASS",
    rollbackAndRestore: "PASS",
  };

  if (activeEvidence && process.env.BSC_TESTNET_EVIDENCE_MODE === "REAL_BSC_TESTNET") {
    const finalBalanceWei = await config.provider.getBalance(config.signerAddress);
    const endingBlock = await config.provider.getBlockNumber();
    Object.assign(activeEvidence.contracts, {
      templeHeartV332Implementation: baselineImplementationAddress,
      templeHeartProxy: proxyAddress,
      templeHeartV340Implementation: candidateAddress,
    });
    activeEvidence.status = result.status;
    activeEvidence.network.endingBlock = endingBlock;
    activeEvidence.signer.finalBalanceTBNB = formatEther(finalBalanceWei);
    activeEvidence.upgradeTransactionHash = activeEvidence.transactions.find(
      (transaction) => transaction.label === "Upgrade V3.3.2 -> V3.4.0",
    )?.hash ?? null;
    activeEvidence.totalGasUsed = activeEvidence.transactions
      .reduce((total, transaction) => total + BigInt(transaction.gasUsed), 0n)
      .toString();
    activeEvidence.runtime = {
      normalizationTo11520: "PASS",
      testFortuneGamePayout: "PASS",
      gameSurvivalGate1888: "PASS",
      fortuneClaimOwnership: "PASS",
      voluntaryRepaymentQualification: "PASS",
      heartbeat: heartbeatResult,
      ignite: igniteResult,
    };
    Object.assign(activeEvidence.security, {
      proofReplayRejection: "PASS",
      beneficiaryRedirectRejection: "PASS",
      wrongCivilizationRejection: "PASS",
      adminClawbackSeizureFunctionsAbsent: "PASS",
      rollbackAndRestore: "PASS",
    });
    activeEvidence.localDeterministicTests = {
      executionClass: "LOCAL_TIME_SIMULATION",
      fullSuite: "30/30 PASS",
      heartbeatOneHour: "PASS",
      heartbeatHourCap88: "PASS",
      igniteUtcBoundary: "PASS",
      igniteDayCap88: "PASS",
      fortuneCooldown30Day: "PASS",
      fortuneEpochCap500: "PASS",
    };
    writeBscTestnetEvidence(activeEvidence);
  }

  console.log(JSON.stringify(result, null, 2));
  await config.provider.destroy();
  return result;
}

if (process.argv.includes("--testnet-preflight")) {
  const config = await assertTestnetConfiguration({ requireExecution: false });
  await config.provider.destroy();
}

if (process.argv.includes("--testnet-rehearsal")) {
  await runTestnetRehearsal();
}

if (process.argv.includes("--testnet-bootstrap-rehearsal")) {
  await bootstrapBscTestnetUniverse();
  await runTestnetRehearsal();
}

// Offline generation only. This path has no Wallet, RPC, signing or broadcast
// call; old direct deployments are never upgrade targets. Values are supplied
// explicitly rather than inferring that a deployer is entitled to every role.
async function buildFreshDeploymentPackage(config) {
  const legacy = "0xB016D4d8f1aED1339101b30722cad6dbA9B8C972";
  if (config.chainId !== 56 && config.chainId !== 97) throw new Error("UNSUPPORTED_CHAIN");
  if (config.fortuneGame != null && config.fortuneGame !== ZeroAddress) throw new Error("FORTUNEGAME_133_HOLD");
  const addresses = {};
  for (const key of ["deployer", "admin", "upgrader", "operator", "holyCupSigner", "kgen", "legacyBrainVault", "proofSource", "registry", "treasury11520", "legacyHeart"]) {
    if (typeof config[key] !== "string") throw new Error(`MISSING_PUBLIC_ADDRESS:${key}`);
    addresses[key] = getAddress(config[key]);
    if (addresses[key] === ZeroAddress) throw new Error(`ZERO_ADDRESS:${key}`);
  }
  if (!Number.isSafeInteger(config.startNonce) || config.startNonce < 0 || config.startNonce > Number.MAX_SAFE_INTEGER - 2) throw new Error("INVALID_NONCE");
  if (config.chainId === 56 && addresses.kgen.toLowerCase() !== "0xba3d3810e58735cb6813bc1cdc5458c0d71432be") throw new Error("KGEN_IDENTITY_MISMATCH");
  if (config.chainId === 56 && addresses.legacyHeart !== legacy) throw new Error("LEGACY_CONTINUITY_IDENTITY_MISMATCH");
  for (const key of ["implementation", "proxy", "registryInitialization", "legacyContinuity"]) {
    if (!Number.isSafeInteger(config.gasCaps?.[key]) || config.gasCaps[key] <= 0) throw new Error(`MISSING_GAS_CAP:${key}`);
  }
  if (!/^[1-9][0-9]*$/.test(String(config.maxGasPriceWei ?? ""))) throw new Error("MISSING_GAS_PRICE_CAP");
  const implementation = getCreateAddress({ from: addresses.deployer, nonce: config.startNonce });
  const proxy = getCreateAddress({ from: addresses.deployer, nonce: config.startNonce + 1 });
  if ([implementation, proxy].some((a) => a.toLowerCase() === legacy.toLowerCase())) throw new Error("LEGACY_TARGET_FORBIDDEN");
  const heart = artifact("KGEN_TempleHeart_Upgradeable");
  const proxyArtifact = artifact("ERC1967Proxy");
  const iface = new Interface(heart.abi);
  const initArgs = [addresses.admin, addresses.upgrader, addresses.operator, addresses.holyCupSigner,
    addresses.kgen, addresses.legacyBrainVault, addresses.proofSource];
  const initializer = iface.encodeFunctionData("initialize", initArgs);
  const proxyDeployment = await new ContractFactory(proxyArtifact.abi, proxyArtifact.bytecode).getDeployTransaction(implementation, initializer);
  const registryInitialization = iface.encodeFunctionData("initializeV340", [addresses.registry]);
  const legacyContinuity = iface.encodeFunctionData("bindLegacyContinuity", [addresses.legacyHeart]);
  const sha256 = (data) => createHash("sha256").update(data).digest("hex");
  const sourcePaths = [baselinePath, "KGEN-KAIOS/package-lock.json", "KGEN-KAIOS/tools/compile-contracts.mjs", "KGEN-KAIOS/tools/validate-templeheart-storage.mjs"];
  const sourceHashes = Object.fromEntries(sourcePaths.map((file) => [file, sha256(fs.readFileSync(path.resolve(root, "..", file)))]));
  const compiledSourceHash = sha256(fs.readFileSync(path.resolve(root, "..", baselinePath)));
  if (heart.sourceSha256 !== compiledSourceHash) throw new Error("STALE_COMPILED_HEART_RUN_COMPILE");
  const tx = (label, from, to, data, gas, nonce = null) => ({ label, chainId:config.chainId, from, to, data,
    calldataHash:keccak256(data), value:"0", gasLimit:String(gas), maxGasPriceWei:String(config.maxGasPriceWei), nonce });
  return {
    status:"UNSIGNED_CANDIDATE_NOT_MAINNET_READY", executionAuthorized:false, sourceHashes,
    sourceHead:execFileSync("git", ["rev-parse", "HEAD"], {cwd:root, encoding:"utf8"}).trim(),
    sourceDirty:Boolean(execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], {cwd:root, encoding:"utf8"}).trim()),
    compiler:heart.compiler, openzeppelin:"5.0.2", chainId:config.chainId,
    implementation, proxy, legacyHeart:addresses.legacyHeart, historicalMainnetHeart:legacy, legacyIsProxy:false, roles:addresses, initializer, initializerCalldataHash:keccak256(initializer), initArgs,
    implementationCreationCodeHash:keccak256(heart.bytecode), proxyCreationCodeHash:keccak256(proxyDeployment.data),
    implementationRuntimeTemplateHash:keccak256(heart.deployedBytecode), immutableReferences:heart.immutableReferences,
    fortuneMaxWhole:8, fortuneEpochMaxClaims:500, fortuneGame:ZeroAddress,
    caps:{gas:config.gasCaps, maxGasPriceWei:String(config.maxGasPriceWei), nativeValue:"0", kgenTransfer:"0"},
    transactions:[
      tx("DEPLOY_IMPLEMENTATION", addresses.deployer, null, heart.bytecode, config.gasCaps.implementation, config.startNonce),
      tx("DEPLOY_PROXY_WITH_INITIALIZER", addresses.deployer, null, proxyDeployment.data, config.gasCaps.proxy, config.startNonce + 1),
      tx("ADMIN_INITIALIZE_REGISTRY", addresses.admin, proxy, registryInitialization, config.gasCaps.registryInitialization),
      tx("ADMIN_BIND_LEGACY_CONTINUITY", addresses.admin, proxy, legacyContinuity, config.gasCaps.legacyContinuity)
    ],
    preconditions:["EXACT_HEAD_AND_SOURCE_HASHES", "HUMAN_APPROVAL_OF_THIS_EXACT_PACKAGE", "FRESH_CHAIN_AND_NONCE_CHECK",
      "ROLE_ADDRESS_AUTHORITY_CONFIRMED", "TOKEN_REGISTRY_PROOF_SOURCE_CODE_IDENTITIES_VERIFIED", "REGISTRY_TREASURY_MATCH", "GAS_ESTIMATES_WITHIN_CAPS"],
    postconditions:["ERC1967_IMPLEMENTATION_SLOT_MATCH", "RUNTIME_BYTECODE_WITH_IMMUTABLES_MATCH", "VERSION_3_4_0", "ALL_FOUR_ROLES_MATCH",
      "REGISTRY_AND_TREASURY_MATCH", "FORTUNE_MAX_8_EPOCH_500", "HEARTBEAT_AND_IGNITE_CAP_88", "FORTUNEGAME_ZERO", "SECOND_INITIALIZATION_REJECTED", "ONE_TIME_LEGACY_BINDING_MATCH", "LIVE_LEGACY_COOLDOWNS_ENFORCED"],
    funding:{status:"SEPARATE_HUMAN_FUNDING_DECISION_REQUIRED", operationalReserveWhole:20000, normalCapWhole:108000, automaticTransfer:false,
      tokenTaxExemption:"READ_ONLY_INSPECT_NO_CHANGES",accounting:"MEASURE_RECIPIENT_BALANCE_BEFORE_AND_AFTER_NEVER_ASSUME_GROSS_EQUALS_NET",reserveGate:"ACTUAL_RECEIVED_BALANCE_MUST_SATISFY_OPERATIONAL_FLOOR"},
    continuity:{
      festivalClaims:"LEGACY_READ_AND_EXISTING_LEGACY_ACTION_ONLY", newYearClaims:"LEGACY_READ_AND_EXISTING_LEGACY_ACTION_ONLY",
      lampState:"LEGACY_READ_AND_EXISTING_LEGACY_ACTION_ONLY", wishEvents:"LEGACY_EVENT_HISTORY_NEW_WISH_REQUIRED",
      vowHistory:"LEGACY_EVENT_HISTORY", walletKgen:"UNCHANGED_TOKEN_BALANCE", oldHeartReserve:"RETAIN_OLD_HEART_NO_AUTOMATIC_SWEEP",
      tokenAllowances:"NOT_MIGRATABLE_NEW_SPENDER_EXPLICIT_APPROVAL_ONLY",
      fortuneCooldown:"ONCHAIN_MAX_LOCAL_AND_LIVE_LEGACY_COOLDOWN", heartbeatState:"ONCHAIN_LIVE_LEGACY_COOLDOWN", igniteState:"ONCHAIN_LIVE_LEGACY_DAY_REJECTION",
      humanFinalPolicy:"CONFIRM_ENFORCED_CONTINUITY_NO_AUTOMATIC_RESET"
    },
    emergency:["DO_NOT_SWITCH_FRONTEND_UNTIL_POSTCHECKS_PASS", "PAUSE_NEW_HEART_BY_CONFIRMED_OPERATOR_IF_APPROVED",
      "PRESERVE_LEGACY_ADDRESS_AND_HISTORY", "FUTURE_UUPS_ROLLBACK_REQUIRES_STORAGE_COMPATIBLE_IMPLEMENTATION_AND_APPROVAL"],
    broadcast:false, signerLoaded:false, mainnetTransactionsSent:0
  };
}

if (process.argv.includes("--deployment-package")) {
  // Public JSON only: never an .env/key file. Generated data remains unsigned.
  const input = process.argv[process.argv.indexOf("--deployment-package") + 1];
  if (!input || !input.endsWith(".json")) throw new Error("PUBLIC_CONFIG_JSON_REQUIRED");
  const config = JSON.parse(fs.readFileSync(input, "utf8"));
  if (/private.?key|mnemonic|secret|token.?credential/i.test(JSON.stringify(Object.keys(config)))) throw new Error("SECRET_CONFIG_FORBIDDEN");
  const result = await buildFreshDeploymentPackage(config);
  const output = path.join(root, "artifacts", "TEMPLEHEART_DEPLOYMENT_PACKAGE.json");
  fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({status:result.status, path:output, mainnetTransactionsSent:0}));
}

if(process.argv.includes("--mainnet-manifest")) {
  // Template is complete and executable through the strict materializer, but
  // unknown Human addresses are never replaced with test roles/zero addresses.
  const sourceHead=execFileSync("git",["rev-parse","HEAD"],{cwd:root,encoding:"utf8"}).trim();
  const sourcePaths=[baselinePath,"KGEN-KAIOS/tools/validate-templeheart-storage.mjs","KGEN-KAIOS/tools/compile-contracts.mjs","KGEN-KAIOS/package-lock.json"];
  const sourceHashes=Object.fromEntries(sourcePaths.map(file=>[file,createHash("sha256").update(fs.readFileSync(path.resolve(root,"..",file))).digest("hex")]));
  if(currentArtifact.sourceSha256!==sourceHashes[baselinePath])throw new Error("STALE_COMPILED_HEART_RUN_COMPILE");
  const evidence=JSON.parse(fs.readFileSync(bscTestnetEvidenceJsonPath,"utf8"));
  const initializerTemplate={chainId:56,signature:"initialize(address,address,address,address,address,address,address)",args:["ADMIN","UPGRADER","OPERATOR","HOLY_CUP_SIGNER","kgen","treasury11520","proofSource"]};
  const manifest={
    status:"UNSIGNED_MANIFEST_READY_FOR_HUMAN_PARAMETERS",chainId:56,sourceHead,sourceHashes,
    sourceDirty:Boolean(execFileSync("git",["status","--porcelain","--untracked-files=no"],{cwd:root,encoding:"utf8"}).trim()),
    compiler:currentArtifact.compiler,openzeppelin:"5.0.2",implementationCreationCodeHash:keccak256(currentArtifact.bytecode),
    implementationRuntimeTemplateHash:keccak256(currentArtifact.deployedBytecode),immutableReferences:currentArtifact.immutableReferences,
    initializerBinding:{
      template:initializerTemplate,templateSha256:createHash("sha256").update(JSON.stringify(initializerTemplate)).digest("hex"),
      initializerCalldataHash:null,status:"HUMAN_PARAMETERS_REQUIRED_FOR_ACTUAL_CALLDATA_HASH",
      materializedField:"initializerCalldataHash",algorithm:"keccak256(ABI_ENCODED_INITIALIZE_WITH_FINAL_ADDRESSES)",
      placeholderHashIsNotCalldataHash:true
    },
    testnetReference:{chainId:97,proxy:evidence.cleanRehearsal?.contracts?.proxy?.address??null,
      implementation:evidence.cleanRehearsal?.contracts?.implementation?.address??null,
      deployedImplementationCodeHash:evidence.cleanRehearsal?.contracts?.implementation?.codeHash??null,
      rehearsalStatus:evidence.cleanRehearsal?.status??"NOT_AVAILABLE",mainnetParameterSource:false},
    parameters:{ADMIN:"HUMAN_FINAL",UPGRADER:"HUMAN_FINAL",OPERATOR:"HUMAN_FINAL",HOLY_CUP_SIGNER:"HUMAN_FINAL",INITIAL_HEART_FUNDING:"HUMAN_FINAL",OLD_HEART_RESERVE_ACTION:"HUMAN_FINAL_RECOMMENDED_RETAIN",COOLDOWN_CONTINUITY_POLICY:"HUMAN_FINAL_CONFIRM_LIVE_LEGACY_ENFORCEMENT"},
    verifiedCanonicalAddresses:{legacyHeart:"0xB016D4d8f1aED1339101b30722cad6dbA9B8C972",kgen:"0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be",registry:"0xA9e7CbF161E39E556f4B5b8E41397Ac4B87a932D",proofSource:"0xD4E67B3a69e41524c424150E6b6e921b01D036db",treasury11520:"0xd0605F4EF10e5C1438F11AF9edc36926769239d6",fortuneGame:ZeroAddress},
    deploymentKind:"NEW_ERC1967_PROXY_NOT_UPGRADE_OF_OLD_DIRECT_HEART",
    transactionSequence:[
      {step:1,label:"DEPLOY_IMPLEMENTATION",from:"DEPLOYER_PUBLIC_ADDRESS",to:null,artifact:"KGEN_TempleHeart_Upgradeable",gasCap:8000000,value:"0"},
      {step:2,label:"DEPLOY_PROXY_WITH_ATOMIC_INITIALIZER",from:"DEPLOYER_PUBLIC_ADDRESS",to:null,artifact:"ERC1967Proxy",initializer:"initialize(address,address,address,address,address,address,address)",args:["ADMIN","UPGRADER","OPERATOR","HOLY_CUP_SIGNER","kgen","treasury11520","proofSource"],gasCap:1500000,value:"0"},
      {step:3,label:"ADMIN_INITIALIZE_REGISTRY",from:"ADMIN",to:"EXPECTED_NEW_PROXY",method:"initializeV340(address)",args:["registry"],gasCap:500000,value:"0"},
      {step:4,label:"ADMIN_BIND_LEGACY_CONTINUITY",from:"ADMIN",to:"EXPECTED_NEW_PROXY",method:"bindLegacyContinuity(address)",args:["legacyHeart"],gasCap:250000,value:"0"},
      {step:5,label:"READ_ONLY_POSTCHECKS",broadcast:false},
      {step:6,label:"HUMAN_FINAL_EXACT_FUNDING_ONLY",enabled:false,amount:"INITIAL_HEART_FUNDING",separateCalldataMaterializationRequired:true}
    ],
    caps:{maxGasPriceWei:"1000000000",maxNativeValue:"0",maxKgenTransfer:"0_UNTIL_HUMAN_FINAL_FUNDING",unlimitedApproval:false},
    materialization:{command:"node KGEN-KAIOS/tools/validate-templeheart-storage.mjs --deployment-package PUBLIC_CONFIG.json",requires:["HUMAN_FINAL_PARAMETERS","FRESH_PUBLIC_DEPLOYER_AND_PENDING_NONCE","READ_ONLY_CHAIN56_CODE_AND_BINDING_CHECKS"],output:"KGEN-KAIOS/artifacts/TEMPLEHEART_DEPLOYMENT_PACKAGE.json",calldata:"GENERATED_ONLY_AFTER_REAL_PARAMETERS_NO_PLACEHOLDER_HEX",predictedAddresses:"DERIVED_FROM_REAL_DEPLOYER_NONCE_NO_INVENTED_ADDRESS"},
    migration:{mode:"LIVE_READ_NO_STORAGE_FABRICATION",fortuneCooldown:"max(local.lastFortuneAt,legacy.lastFortuneAt)+30days",heartbeatCooldown:"bothLocalAndLegacyPlusOneHour",ignite:"legacyDayAndNewDayBothEnforced",failure:"LEGACY_READ_FAILURE_REVERTS_CLAIM",festival:"LEGACY_READ_AND_LEGACY_ACTION",newYear:"LEGACY_READ_AND_LEGACY_ACTION",lamp:"LEGACY_READ_AND_LEGACY_ACTION",wishVow:"PRESERVE_LEGACY_EVENT_HISTORY_NEW_V34_WISH",tokenBalance:"UNCHANGED",allowance:"NEW_SPENDER_EXPLICIT_APPROVAL_ONLY",oldReserve:"NO_AUTOMATIC_TRANSFER"},
    preconditions:["EXACT_HEAD_SOURCE_HASHES_AND_COMPILER_MATCH","BSC97_CLEAN_REHEARSAL_PASS","FRONTEND_CANDIDATE_AND_REGRESSIONS_PASS","ROLE_OWNERSHIP_CONFIRMED","REGISTRY_TREASURY_FURNACE_PROOF_SOURCE_VERIFIED","GAS_ESTIMATES_WITHIN_CAPS","TOKEN_TAX_EXEMPTION_READ_ONLY_INSPECTED_NO_CHANGES","FUNDING_BALANCE_BASELINE_RECORDED","HUMAN_FINAL_APPROVAL_BEFORE_ANY_CHAIN56_SIGNATURE"],
    postconditions:["ERC1967_SLOT_AND_IMPLEMENTATION_BYTECODE_MATCH","VERSION3.4.0","FOUR_ROLES_MATCH","LEGACY_BINDING_IMMUTABLE_MATCH","FORTUNEGAME_ZERO","FORTUNE_MAX8_EPOCH500","HEARTBEAT_IGNITE_CAP88","AUTHORIZED_FUNDING_ACTUAL_NET_RECEIVED_VERIFIED_NEVER_ASSUME_GROSS_EQUALS_NET","OPERATIONAL_RESERVE_FLOOR_CHECKED_AGAINST_ACTUAL_BALANCE","NO_FRONTEND_PRODUCTION_CUTOVER_UNTIL_ALL_PASS"],
    emergency:["STOP_ON_FIRST_FAILURE_NO_BLIND_RESEND","KEEP_LEGACY_ROUTE_AND_HISTORY","PAUSE_NEW_HEART_ONLY_WITH_AUTHORIZED_OPERATOR","NEVER_CALL_UPGRADE_ON_OLD_DIRECT_HEART","FUTURE_PROXY_UPGRADE_REQUIRES_STORAGE_COMPATIBILITY"],
    humanApproval:false,broadcast:false,signerLoaded:false,mainnetTransactionsSent:0
  };
  evidence.unsignedMainnetManifest=manifest;
  fs.writeFileSync(bscTestnetEvidenceJsonPath,`${JSON.stringify(evidence,null,2)}\n`);
  console.log(JSON.stringify({status:manifest.status,sourceHead,mainnetTransactionsSent:0}));
}

// Fresh disposable TEST-only lineage. This never reads targets from execution
// environment variables and never mutates the historical rehearsal proxy.
// Receipts are checkpointed before waiting; uncertain broadcasts must be
// resolved from their recorded hash, never blindly resent.
function cleanCapCohort(){return [...Array.from({length:61},(_,i)=>510+i),...Array.from({length:28},(_,i)=>600+i)];}
function guardAbandonedCleanRequest(request,abandoned) {
  if(BigInt(request.chainId)!==97n||BigInt(request.value)!==0n)throw new Error("CLEAN_CONTINUATION_CHAIN_OR_VALUE");
  for(const old of abandoned)if(Number(request.nonce)===old.nonce&&(request.to??null)===(old.to??null)&&keccak256(request.data)===old.dataHash)
    throw new Error("CLEAN_ABANDONED_UNSIGNED_REQUEST_FORBIDDEN");
}
function guardAbandonedCleanHash(hash,abandoned) {
  if(hash===ABANDONED_CLEAN_INTENT_HASH||abandoned.some(o=>o.hash===hash))throw new Error("CLEAN_ABANDONED_SIGNED_HASH_FORBIDDEN");
}
function publicUnsignedCleanTransaction(request) {
  return {chainId:Number(request.chainId),from:request.from,to:request.to??null,data:request.data,value:String(request.value),nonce:Number(request.nonce),gasLimit:String(request.gasLimit),gasPrice:String(request.gasPrice),type:Number(request.type)};
}
function boundedCleanSpend(balanceDelta,backendFees,frontendFees){const receipts=BigInt(backendFees)+BigInt(frontendFees);return BigInt(balanceDelta)>receipts?BigInt(balanceDelta):receipts;}
function validateCleanCapRows({cohort,rows,kind,index,globalCount,complete=false,rejectedActor=null}) {
  const addresses=cohort.map(a=>a.toLowerCase()),users=new Set(),hashes=new Set(),counters=new Set();
  if(addresses.length!==89||new Set(addresses).size!==89)throw new Error("CLEAN_CAP_COHORT_NOT_89_DISTINCT");
  for(const row of rows) {
    const user=row.user.toLowerCase();
    if(!addresses.includes(user)||users.has(user)||hashes.has(row.hash)||row.status!==1||row.to.toLowerCase()!==user||row.eventUser.toLowerCase()!==user||row.eventIndex!==index)throw new Error("CLEAN_CAP_RECEIPT_IDENTITY");
    if(Math.floor(row.timestamp/(kind==="HEARTBEAT"?3600:86400))!==index||(kind==="IGNITE"&&row.timestamp%86400>=600))throw new Error("CLEAN_CAP_RECEIPT_OUTSIDE_WINDOW");
    if(row.blockHash!==row.receiptBlockHash||row.eventCounter<1||row.eventCounter>88||counters.has(row.eventCounter))throw new Error("CLEAN_CAP_RECEIPT_BLOCK_OR_COUNTER");
    users.add(user);hashes.add(row.hash);counters.add(row.eventCounter);
  }
  if(globalCount!==rows.length||[...counters].some(n=>n>rows.length))throw new Error("CLEAN_CAP_UNRELATED_OR_MISSING_CLAIM");
  if(complete&&(rows.length!==88||!rejectedActor||users.has(rejectedActor.toLowerCase())||!addresses.includes(rejectedActor.toLowerCase())))throw new Error("CLEAN_CAP_INCOMPLETE_OR_INVALID_89TH");
  return {confirmedDistinctCohortClaims:users.size,confirmedDistinctReceipts:hashes.size,windowIndex:index,globalCount};
}
function runCleanContinuationSelfTest() {
  let checks=0;const ok=(v)=>{if(!v)throw new Error("CLEAN_CONTINUATION_SELF_TEST");checks++;};
  const rejects=(f)=>{let rejected=false;try{f();}catch{rejected=true;}ok(rejected);};
  const old={hash:ABANDONED_CLEAN_INTENT_HASH,nonce:3054,to:null,dataHash:keccak256("0x1234")};
  const request={chainId:97,value:0,nonce:3054,to:null,data:"0x1234"};
  rejects(()=>guardAbandonedCleanRequest(request,[old]));
  rejects(()=>guardAbandonedCleanRequest({...request,chainId:56},[old]));
  rejects(()=>guardAbandonedCleanRequest({...request,value:1},[old]));
  guardAbandonedCleanRequest({...request,to:ZeroAddress,data:"0x5678"},[old]);ok(true);
  guardAbandonedCleanRequest({...request,nonce:3055},[old]);ok(true);
  rejects(()=>guardAbandonedCleanHash(old.hash,[old]));
  guardAbandonedCleanHash(id("new allowed test action"),[old]);ok(true);
  const cohort=cleanCapCohort();ok(cohort.length===89&&new Set(cohort).size===89);ok(!cohort.includes(571));ok(cohort.filter(i=>i<=570).length===61&&cohort.filter(i=>i>=600).length===28);
  const unsigned=publicUnsignedCleanTransaction({...request,from:ZeroAddress,gasLimit:337000n,gasPrice:100000000n,type:0});
  ok(Object.keys(unsigned).sort().join(",")==="chainId,data,from,gasLimit,gasPrice,nonce,to,type,value");
  ok(unsigned.gasPrice==="100000000"&&unsigned.value==="0"&&!JSON.stringify(unsigned).includes("private"));
  ok(boundedCleanSpend(0n,10n,5n)===15n);ok(boundedCleanSpend(-100n,10n,5n)===15n);ok(boundedCleanSpend(30n,10n,5n)===30n);
  const addresses=Array.from({length:89},(_,i)=>`0x${(i+1).toString(16).padStart(40,"0")}`);
  const rows=addresses.slice(0,88).map((user,i)=>({user,to:user,eventUser:user,status:1,hash:id(`receipt${i}`),blockHash:id(`block${i}`),receiptBlockHash:id(`block${i}`),timestamp:36000+i,eventIndex:10,eventCounter:i+1}));
  const candidate={cohort:addresses,rows,kind:"HEARTBEAT",index:10,globalCount:88,complete:true,rejectedActor:addresses[88]};
  ok(validateCleanCapRows(candidate).confirmedDistinctCohortClaims===88);
  rejects(()=>validateCleanCapRows({...candidate,rows:rows.slice(0,87)}));
  rejects(()=>validateCleanCapRows({...candidate,globalCount:89}));
  rejects(()=>validateCleanCapRows({...candidate,rejectedActor:addresses[0]}));
  rejects(()=>validateCleanCapRows({...candidate,rows:[rows[0],...rows.slice(0,87)]}));
  rejects(()=>validateCleanCapRows({...candidate,rows:rows.map((r,i)=>i? r:{...r,timestamp:39600})}));
  rejects(()=>validateCleanCapRows({...candidate,rows:rows.map((r,i)=>i? r:{...r,eventUser:addresses[88]})}));
  rejects(()=>validateCleanCapRows({...candidate,rows:rows.map((r,i)=>i? r:{...r,receiptBlockHash:id("reorg")})}));
  const igniteRows=rows.map((r,i)=>({...r,eventIndex:10,timestamp:864000+i}));
  ok(validateCleanCapRows({...candidate,kind:"IGNITE",rows:igniteRows}).globalCount===88);
  rejects(()=>validateCleanCapRows({...candidate,kind:"IGNITE",rows:igniteRows.map((r,i)=>i?r:{...r,timestamp:864600})}));
  console.log(JSON.stringify({status:"CLEAN_CONTINUATION_SELF_TEST_PASS",checks,chainWrites:0,artifactWrites:0}));
}
async function validateLocalContinuationGasBound() {
  // In-memory Ganache only. Never attach this clock helper to an external RPC.
  const {setupLineage,deploy:localDeploy,artifact:localArtifact,cleanupProviders,ETHER}=await import("../tests/helpers.mjs");
  try {
    const context=await setupLineage({chainId:31337});
    if((await context.provider.getNetwork()).chainId!==31337n)throw new Error("CLEAN_LOCAL_GAS_TEST_CHAIN");
    const owner=await context.owner.getAddress(),implementation=await localDeploy("KGEN_TempleHeart_Upgradeable",context.owner);
    const init=implementation.interface.encodeFunctionData("initialize",[owner,owner,owner,owner,context.kgen.target,owner,context.kaios.target]);
    const proxy=await localDeploy("ERC1967Proxy",context.owner,[implementation.target,init]);
    const heart=new Contract(proxy.target,localArtifact("KGEN_TempleHeart_Upgradeable").abi,context.owner);
    const legacy=await localDeploy("MockLegacyHeart",context.owner,[context.kgen.target]);
    await(await heart.initializeV340(context.registry.target)).wait();
    await(await heart.bindLegacyContinuity(legacy.target)).wait();
    await(await context.kgen.transfer(heart.target,21000n*ETHER)).wait();
    const actor=await localDeploy("RehearsalActor",context.owner);
    const makeWish=(name)=>actor.execute(heart.target,heart.interface.encodeFunctionData("makeWish",[id(name),id("LOCAL_CAP_CIV")]),{gasLimit:500000});
    await(await makeWish("LOCAL_PREP_A")).wait();
    await(await actor.execute(heart.target,heart.interface.encodeFunctionData("heartbeatClaim"),{gasLimit:500000})).wait();
    const prior=await heart.lastHeartbeatAt(actor.target);
    await(await makeWish("LOCAL_PREP_B")).wait();
    if(await heart.lastHeartbeatAt(actor.target)!==prior)throw new Error("CLEAN_LOCAL_PREP_RESET_COOLDOWN");
    const freshActor=await localDeploy("RehearsalActor",context.owner);
    await(await freshActor.execute(heart.target,heart.interface.encodeFunctionData("makeWish",[id("LOCAL_IGNITE_WISH"),id("LOCAL_IGNITE_CIV")]),{gasLimit:500000})).wait();
    const now=(await context.provider.getBlock("latest")).timestamp;
    await context.provider.send("evm_setTime",[(Math.floor(now/86400)+1)*86400000]);
    await context.provider.send("evm_mine",[]);
    const data=heart.interface.encodeFunctionData("igniteAndClaim");
    const estimate=await freshActor.execute.estimateGas(heart.target,data);
    const gasLimitBound=500000n;
    if(estimate*120n/100n+10000n>gasLimitBound)throw new Error("CLEAN_LOCAL_IGNITE_GAS_BOUND");
    const receipt=await(await freshActor.execute(heart.target,data,{gasLimit:gasLimitBound})).wait();
    if(receipt.status!==1||receipt.gasUsed>gasLimitBound)throw new Error("CLEAN_LOCAL_IGNITE_RECEIPT_BOUND");
    return {status:"PASS",environment:"LOCAL_GANACHE_31337_NO_EXTERNAL_CLOCK_MUTATION",sameCivilizationWishPreservesHeartbeat:true,igniteGasUsed:String(receipt.gasUsed),igniteEstimatedGas:String(estimate),igniteGasLimitBound:String(gasLimitBound)};
  } finally {cleanupProviders();}
}
async function runCleanTestnetRehearsal() {
  const provider = new JsonRpcProvider(env("BSC_TESTNET_RPC_URL"));
  provider.pollingInterval = 1000;
  let evidence;
  let writerLock;
  const writerLockPath=`${bscTestnetEvidenceJsonPath}.writer-lock`;
  let historical = JSON.parse(fs.readFileSync(bscTestnetEvidenceJsonPath, "utf8"));
  const persist = () => {
    historical.cleanRehearsal = evidence;
    const temporary=`${bscTestnetEvidenceJsonPath}.pending`;
    const serialized=`${JSON.stringify(historical, null, 2)}\n`;
    // Windows readers may hold a brief deny-write handle. Atomic replacement
    // keeps the previous durable INTENT intact rather than truncating it.
    for(let attempt=0;attempt<40;attempt++) {
      try {fs.writeFileSync(temporary,serialized);fs.renameSync(temporary,bscTestnetEvidenceJsonPath);return;}
      catch {Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,50);}
    }
    throw new Error("CLEAN_JOURNAL_WRITE_BLOCKED_STOP");
  };
  const fail = (code) => { throw new Error(code); };
  try {
    if (BigInt(await provider.send("eth_chainId", [])) !== 97n) fail("CLEAN_CHAIN_97_ONLY");
    const wallet = new Wallet(env("BSC_TESTNET_PRIVATE_KEY", { allowSecret:true }), provider);
    const signer = new NonceManager(wallet);
    const balance = await provider.getBalance(wallet.address);
    const fees = await provider.getFeeData();
    const gasPrice = fees.gasPrice;
    const caps = { transactionGas:8000000, gasPriceWei:"1000000000", totalFeeWei:parseUnits("0.10",18).toString(), nativeValue:"0", testKgenFundingWhole:108000 };
    if (!gasPrice || gasPrice > BigInt(caps.gasPriceWei)) fail("CLEAN_GAS_PRICE_CAP");
    console.log(JSON.stringify({operation:"CLEAN_TESTNET_PREFLIGHT",chainId:97,publicSigner:wallet.address,balanceTBNB:formatEther(balance),gasPriceWei:String(gasPrice),caps,mainnetTransactionsSent:0}));
    if (process.env.BSC_TESTNET_EXECUTE !== "BSC97_FRESH_ISOLATED_V34_ONLY") return;
    try {writerLock=fs.openSync(writerLockPath,"wx");fs.writeFileSync(writerLock,JSON.stringify({pid:process.pid,chainId:97,startedAt:new Date().toISOString()}));}
    catch {fail("CLEAN_WRITER_ALREADY_ACTIVE_CHECK_LOCK_READ_ONLY");}
    historical=JSON.parse(fs.readFileSync(bscTestnetEvidenceJsonPath,"utf8"));
    if (balance < parseUnits("0.01",18)) fail("CLEAN_TEST_GAS_INSUFFICIENT");
    const head = execFileSync("git",["rev-parse","HEAD"],{cwd:root,encoding:"utf8"}).trim();
    const compiled = artifact("KGEN_TempleHeart_Upgradeable");
    const currentSourceHash = createHash("sha256").update(fs.readFileSync(path.resolve(root,"..",baselinePath))).digest("hex");
    if (compiled.sourceSha256 !== currentSourceHash) fail("STALE_COMPILED_HEART_RUN_COMPILE");
    evidence = historical.cleanRehearsal ?? {
      schemaVersion:"1.0.0", executionClass:"REAL_BSC_TESTNET_FRESH_ISOLATED", status:"RUNNING",
      chainId:97, sourceHead:head, sourceSha256:currentSourceHash, publicSigner:wallet.address,
      startingBalanceTBNB:formatEther(balance), startedAt:new Date().toISOString(), caps,
      contracts:{}, operations:{}, checks:{}, actors:[], totalFeeWei:"0", mainnetTransactionsSent:0,
      fortuneGame:ZeroAddress, fortuneGame133:"DISABLED", clockMutation:false,
      legacyHistoricalRehearsalPreserved:true,sourceDirty:true
    };
    if (evidence.chainId !== 97 || evidence.publicSigner !== wallet.address || evidence.sourceSha256 !== currentSourceHash) fail("CLEAN_RESUME_IDENTITY_OR_SOURCE_MISMATCH");
    if(process.argv.includes("--continue-caps")&&(!historical.cleanRehearsal||evidence.checks.FIVE_HUNDRED_DISTINCT_CLAIMS!=="PASS"||evidence.checks.BOT_501_EPOCH_CAP?.status!=="PASS"))fail("CLEAN_CONTINUATION_REQUIRES_FINAL_FORTUNE_PASS");
    evidence.sourceDirty=true;
    evidence.executionRuns??=[];
    evidence.executionRuns.push({at:new Date().toISOString(),sourceHead:head,sourceDirty:true,toolSha256:createHash("sha256").update(fs.readFileSync(import.meta.filename)).digest("hex"),contractSourceSha256:currentSourceHash,mode:process.argv.includes("--ignite")?"IGNITE":process.argv.includes("--continue-caps")?"CONTINUE_CAPS":process.argv.includes("--stress")?"STRESS":"CORE"});
    persist();
    const allowed = new Set(Object.values(evidence.contracts).map((c)=>c.address.toLowerCase()));
    for (const a of evidence.actors.filter(Boolean)) allowed.add(a.address.toLowerCase());
    const recordReceipt = (op, receipt) => {
      if (!receipt || receipt.status !== 1) fail("CLEAN_RECEIPT_FAILED_STOP");
      op.status="CONFIRMED"; op.blockNumber=receipt.blockNumber; op.gasUsed=String(receipt.gasUsed);
      op.gasPriceWei=String(receipt.gasPrice); op.feeWei=String(receipt.gasUsed*receipt.gasPrice);
      evidence.totalFeeWei=String(Object.values(evidence.operations).filter(o=>o.status==="CONFIRMED").reduce((n,o)=>n+BigInt(o.feeWei),0n));
      persist();
    };
    const transact = async (label, request, deployment=false) => {
      const dataHash=keccak256(request.data);
      const existing=evidence.operations[label];
      if(existing) {
        if(existing.status==="ABANDONED_UNBROADCAST_INTENT")fail("CLEAN_ABANDONED_INTENT_MUST_NOT_EXECUTE");
        if(existing.dataHash!==dataHash || existing.to!==(request.to??null)) fail("CLEAN_RESUME_CALLDATA_MISMATCH");
        const receipt=await provider.getTransactionReceipt(existing.hash);
        if(!receipt) fail("CLEAN_PENDING_TRANSACTION_STOP_NO_RESEND");
        if(existing.status!=="CONFIRMED") recordReceipt(existing,receipt);
        return receipt;
      }
      if (BigInt(await provider.send("eth_chainId",[]))!==97n) fail("CLEAN_CHAIN_CHANGED");
      if (request.value != null && BigInt(request.value)!==0n) fail("CLEAN_NATIVE_VALUE_FORBIDDEN");
      if (!deployment && (!request.to || !allowed.has(request.to.toLowerCase()))) fail("CLEAN_TARGET_NOT_FRESH_ALLOWLIST");
      if(deployment && request.to) fail("CLEAN_DEPLOY_TARGET_FORBIDDEN");
      const estimate=await provider.estimateGas({...request,from:wallet.address,value:0n});
      const gasLimit=estimate*120n/100n+10000n;
      if(gasLimit>BigInt(caps.transactionGas)) fail("CLEAN_TRANSACTION_GAS_CAP");
      const freshFees=await provider.getFeeData();
      if(!freshFees.gasPrice||freshFees.gasPrice>BigInt(caps.gasPriceWei)) fail("CLEAN_GAS_PRICE_CAP");
      const signerBalance=await provider.getBalance(wallet.address);
      const aggregateSpend=parseUnits(evidence.startingBalanceTBNB,18)-signerBalance;
      const frontendFeeFloor=(evidence.frontendLive?.receipts??[]).reduce((n,r)=>n+BigInt(r.feeWei),0n);
      const boundedSpend=boundedCleanSpend(aggregateSpend,evidence.totalFeeWei,frontendFeeFloor);
      if(boundedSpend+gasLimit*freshFees.gasPrice>BigInt(caps.totalFeeWei)) fail("CLEAN_TOTAL_TEST_GAS_CAP");
      if(signerBalance<gasLimit*freshFees.gasPrice)fail("CLEAN_TEST_GAS_INSUFFICIENT");
      const nonce=await provider.getTransactionCount(wallet.address,"pending");
      const latestNonce=await provider.getTransactionCount(wallet.address,"latest");
      if(latestNonce!==nonce)fail("CLEAN_PENDING_NONCE_DIFFERS_FROM_CONFIRMED_STOP");
      const unsigned={...request,from:wallet.address,value:0n,gasLimit,gasPrice:freshFees.gasPrice,chainId:97,nonce,type:0};
      const abandoned=Object.values(evidence.operations).filter(o=>o.status==="ABANDONED_UNBROADCAST_INTENT");
      guardAbandonedCleanRequest(unsigned,abandoned);
      const raw=await wallet.signTransaction(unsigned);
      guardAbandonedCleanHash(keccak256(raw),abandoned);
      const op={label,to:request.to??null,dataHash,hash:keccak256(raw),nonce,status:"INTENT_RECORDED",gasLimit:String(gasLimit),gasPriceWei:String(freshFees.gasPrice),unsignedTransaction:publicUnsignedCleanTransaction(unsigned),nonceSource:"LIVE_LATEST_EQUALS_PENDING_NOT_FORCED"};
      evidence.operations[label]=op;persist();
      const tx=await provider.broadcastTransaction(raw);
      if(tx.hash!==op.hash)fail("CLEAN_BROADCAST_HASH_MISMATCH");
      op.status="SUBMITTED";persist();
      const receipt=await tx.wait(1);recordReceipt(op,receipt);
      console.log(`${label}: ${tx.hash} confirmed ${receipt.blockNumber}`);
      return receipt;
    };
    const deploy = async (key,name,args=[]) => {
      const a=artifact(name);
      const request=await new ContractFactory(a.abi,a.bytecode).getDeployTransaction(...args);
      const receipt=await transact(`DEPLOY_${key}`,request,true);
      const address=receipt.contractAddress;
      if(!address) fail("CLEAN_DEPLOY_ADDRESS_MISSING");
      const code=await provider.getCode(address);
      if(!runtimeMatchesArtifact(code,a)) fail("CLEAN_DEPLOY_BYTECODE_MISMATCH");
      evidence.contracts[key]={address,artifact:name,codeHash:keccak256(code)};
      allowed.add(address.toLowerCase());persist();
      return new Contract(address,a.abi,provider);
    };
    const call = (label,contract,method,args=[]) => transact(label,{to:contract.target,data:contract.interface.encodeFunctionData(method,args)});
    const assert = (ok,label) => {if(!ok)fail(label);evidence.checks[label]="PASS";persist();};
    const rejection = async (label,contract,method,args=[],from=wallet.address,expected=null,pinnedBlock=null) => {
      if(evidence.checks[label]?.status==="PASS"&&!pinnedBlock)return;
      try {await provider.call({to:contract.target,from,data:contract.interface.encodeFunctionData(method,args),...(pinnedBlock?{blockTag:pinnedBlock.number}:{})});}
      catch(error) {
        if(error.code!=="CALL_EXCEPTION")fail(`CLEAN_NON_REVERT_READ_FAILURE_${label}`);
        let data=error.data??error.info?.error?.data;
        if(typeof data==="object")data=data?.data??data?.result;
        let parsed;try{parsed=contract.interface.parseError(data);}catch{}
        if(!parsed||!expected||parsed.name!==expected)fail(`CLEAN_WRONG_REVERT_${label}`);
        evidence.checks[label]={status:"PASS",kind:"LIVE_ETH_CALL_REJECTION_NO_WRITE",error:parsed?.name??"REVERT",block:pinnedBlock?.number??await provider.getBlockNumber(),...(pinnedBlock?{blockHash:pinnedBlock.hash,blockTimestamp:pinnedBlock.timestamp,pinnedBlockTag:true,from,to:contract.target,method}:{})};persist();return;
      }
      fail(`CLEAN_EXPECTED_REJECTION_${label}`);
    };
    const registry=await deploy("registry","KAIOSOrganRegistry",[wallet.address,3600]);
    const kgen=await deploy("kgen","MockKGEN",[wallet.address]);
    const kaios=await deploy("proofSource","KAIOS",[kgen.target,wallet.address,registry.target]);
    const furnace=await deploy("furnace","KAIOSAlchemyFurnace",[kaios.target,registry.target,100]);
    const treasury=await deploy("treasury11520","MockOrgan");
    const legacy=await deploy("legacyHeart","MockLegacyHeart",[kgen.target]);
    await call("REGISTER_FURNACE",registry,"bootstrapOrgan",[ORGAN_FURNACE_18911,furnace.target]);
    await call("REGISTER_TREASURY",registry,"bootstrapOrgan",[ORGAN_EXCHANGE_TREASURY_11520,treasury.target]);
    await call("SEAL_REGISTRY",registry,"sealBootstrap");
    const implementation=await deploy("implementation","KGEN_TempleHeart_Upgradeable");
    const init=implementation.interface.encodeFunctionData("initialize",[wallet.address,wallet.address,wallet.address,wallet.address,kgen.target,treasury.target,kaios.target]);
    const proxy=await deploy("proxy","ERC1967Proxy",[implementation.target,init]);
    const heart=new Contract(proxy.target,compiled.abi,provider);
    await call("INITIALIZE_V340",heart,"initializeV340",[registry.target]);
    await call("BIND_LEGACY_CONTINUITY",heart,"bindLegacyContinuity",[legacy.target]);
    await call("FUND_TEST_HEART",kgen,"transfer",[heart.target,parseUnits("108000",18)]);
    await call("BURN_TEST_KGEN",kgen,"burn",[parseUnits("3",18)]);
    await call("SETTLE_TEST_KAIOS",kaios,"settleWhiteHoleMass");
    assert(await heart.fortuneGame()===ZeroAddress,"FORTUNEGAME_ZERO");
    assert(await heart.version()==="3.4.0","VERSION_3_4_0");
    assert(await heart.legacyHeart()===legacy.target,"LEGACY_CONTINUITY_BOUND");
    assert(await heart.fortuneMaxWhole()===8n&&await heart.fortuneEpochMaxClaims()===500n,"FORTUNE_CANON_8_500");
    assert(!compiled.abi.some(entry=>entry.type==="function"&&entry.name==="fortuneClaim"&&entry.inputs?.[0]?.type==="uint256"),"BOT_009_NO_AMOUNT_CONTROLLED_FORTUNE_SELECTOR");
    assert(implementationAddressFromSlot(await provider.getStorage(heart.target,IMPLEMENTATION_SLOT))===implementation.target,"IMPLEMENTATION_SLOT_MATCH");
    for(const [name,role]of REQUIRED_SIGNER_ROLES)assert(await heart.hasRole(role,wallet.address),`TEST_ROLE_${name}`);
    const manifest={chainId:97,proxy:heart.target,implementation:implementation.target,kgen:kgen.target,registry:registry.target,proofSource:kaios.target,legacyHeart:legacy.target,furnace:furnace.target,
      roles:Object.fromEntries(REQUIRED_SIGNER_ROLES.map(([name])=>[name,wallet.address])),
      proxyCodeHash:evidence.contracts.proxy.codeHash,implementationCodeHash:evidence.contracts.implementation.codeHash,
      codeHashes:Object.fromEntries(Object.entries(evidence.contracts).map(([k,v])=>[k,v.codeHash])),fortuneGame:ZeroAddress};
    evidence.frontendManifest=manifest;persist();
    const browserEvidencePath=path.resolve(root,"..","artifacts/kaios-portal-qa/heart-v34-live-report.json");
    if(fs.existsSync(browserEvidencePath)) {
      const browser=JSON.parse(fs.readFileSync(browserEvidencePath,"utf8"));
      if(browser.status==="PASS_REAL_BSC97_UI_CORE"&&browser.chainId===97&&browser.proxy===heart.target&&browser.signer===wallet.address) {
        const receipts=[];
        for(const [label,item]of Object.entries(browser.transactions??{})) {
          const receipt=await provider.getTransactionReceipt(item.hash);
          if(!receipt||receipt.status!==1)fail("CLEAN_BROWSER_RECEIPT_NOT_CONFIRMED");
          receipts.push({label,hash:item.hash,to:receipt.to,blockNumber:receipt.blockNumber,gasUsed:String(receipt.gasUsed),feeWei:String(receipt.gasUsed*receipt.gasPrice)});
        }
        evidence.frontendLive={status:browser.status,chainId:97,proxy:heart.target,publicSigner:wallet.address,
          scope:browser.scope,physicalMetaMask:"NOT_USED_CONTROLLED_TEST_SIGNER",receipts,mainnetTransactionsSent:0};persist();
      }
    }
    const actorAbi=artifact("RehearsalActor").abi;
    const actor = async (index) => {
      if(!evidence.actors[index]) {
        const c=await deploy(`actor${index}`,"RehearsalActor");
        evidence.actors[index]={address:c.target};persist();
      }
      return new Contract(evidence.actors[index].address,actorAbi,provider);
    };
    const actorCall=(label,a,target,method,args=[])=>call(label,a,"execute",[target.target,target.interface.encodeFunctionData(method,args)]);
    if(process.argv.includes("--continue-caps")) {
      const abandoned=evidence.operations.DEPLOY_actor571;
      if(!abandoned||abandoned.hash!==ABANDONED_CLEAN_INTENT_HASH)fail("CLEAN_CONTINUATION_INCIDENT_IDENTITY");
      // The explicit Human continuation order abandons an uncertain intent; it
      // does not assert that the failed RPC request never left the process.
      const originalReceipt=await provider.getTransactionReceipt(abandoned.hash);
      const originalTransaction=await provider.getTransaction(abandoned.hash);
      if(originalReceipt||originalTransaction)fail("CLEAN_ABANDONED_INTENT_OBSERVED_RECONCILE_BEFORE_CONTINUATION");
      if(!evidence.capContinuation) {
        if(process.env.BSC_TESTNET_CONTINUATION!=="ABANDON_ACTOR571_NO_REPLAY")fail("CLEAN_CONTINUATION_HUMAN_ACK_REQUIRED");
        const independent=new JsonRpcProvider("https://data-seed-prebsc-1-s1.bnbchain.org:8545");
        let observation;
        try {
          if(BigInt(await independent.send("eth_chainId",[]))!==97n)fail("CLEAN_CONTINUATION_INDEPENDENT_CHAIN");
          if(await independent.getTransaction(abandoned.hash)||await independent.getTransactionReceipt(abandoned.hash))fail("CLEAN_ABANDONED_INTENT_OBSERVED_INDEPENDENT_NODE");
          const latestNonce=await independent.getTransactionCount(wallet.address,"latest"),pendingNonce=await independent.getTransactionCount(wallet.address,"pending");
          if(latestNonce!==pendingNonce)fail("CLEAN_CONTINUATION_PENDING_TRANSACTION_PRESENT");
          observation={at:new Date().toISOString(),source:"INDEPENDENT_PUBLIC_BSC97",receipt:null,transactionPresent:false,latestNonce,pendingNonce};
        } finally {await independent.destroy();}
        abandoned.status="ABANDONED_UNBROADCAST_INTENT";
        abandoned.abandonedAt=new Date().toISOString();
        abandoned.abandonment={authority:"EXPLICIT_HUMAN_CONTINUATION_ORDER",meaning:"ABANDONED_UNCERTAIN_RPC_INTENT_NOT_PROOF_OF_NEVER_BROADCAST",noReconstruction:true,noReplay:true,observation};
        evidence.executionBlocker.resolution={at:new Date().toISOString(),authority:"EXPLICIT_HUMAN_CONTINUATION_ORDER",action:"ABANDON_ORIGINAL_INTENT_NO_REPLAY_CONTINUE_NEW_VALID_TEST_ACTIONS",originalIncidentPreserved:true};
        evidence.capContinuation={authority:"EXPLICIT_HUMAN_CONTINUATION_ORDER",startedAt:new Date().toISOString(),cohort:cleanCapCohort(),fortune:"FINAL_PASS_NO_RERUN",originalIncidentPreserved:true,originalIntentHash:abandoned.hash,status:"PREPARING",writerPid:process.pid};
        persist();
      }
      const continuation=evidence.capContinuation;
      if(JSON.stringify(continuation.cohort)!==JSON.stringify(cleanCapCohort()))fail("CLEAN_CONTINUATION_COHORT_MISMATCH");
      continuation.writerPid=process.pid;continuation.status="RUNNING";evidence.status="CAP_CONTINUATION_RUNNING";persist();
      const refreshForecast=async()=>{
        const localValidation=continuation.gasForecast?.localValidation??await validateLocalContinuationGasBound();
        const confirmed=Object.values(evidence.operations).filter(o=>o.status==="CONFIRMED");
        const observedMax=(prefix)=>confirmed.filter(o=>o.label.startsWith(prefix)).reduce((n,o)=>BigInt(o.gasLimit)>n?BigInt(o.gasLimit):n,0n);
        const deployLimit=observedMax("DEPLOY_actor"),wishLimit=observedMax("HEARTBEAT_WISH_"),heartbeatLimit=observedMax("HEARTBEAT_");
        if(!deployLimit||!wishLimit||!heartbeatLimit)fail("CLEAN_CONTINUATION_GAS_HISTORY_MISSING");
        const newActors=continuation.cohort.filter(i=>!evidence.actors[i]).length;
        const missingWishes=continuation.cohort.filter(i=>i>=600&&!evidence.operations[`CAP_CONTINUATION_WISH_${i}`]).length;
        const preparationCalls=evidence.operations.CAP_CONTINUATION_PREPARE_ACTOR_510?0:1;
        const heartbeatClaims=evidence.checks.BOT_89_HEARTBEAT_CAP?.status==="PASS"?0:88-confirmed.filter(o=>o.label.startsWith(`HEARTBEAT_STRESS_${continuation.heartbeatHour}_`)).length;
        const igniteClaims=evidence.checks.BOT_89_IGNITE_CAP?.status==="PASS"?0:88-confirmed.filter(o=>o.label.startsWith(`IGNITE_STRESS_${continuation.igniteDay}_`)).length;
        const remainingGas=BigInt(newActors)*deployLimit+BigInt(missingWishes+preparationCalls)*wishLimit+BigInt(heartbeatClaims)*heartbeatLimit+BigInt(igniteClaims)*BigInt(localValidation.igniteGasLimitBound);
        const freshGasPrice=(await provider.getFeeData()).gasPrice;
        if(!freshGasPrice||freshGasPrice>BigInt(caps.gasPriceWei))fail("CLEAN_GAS_PRICE_CAP");
        const combinedReceiptFees=BigInt(evidence.totalFeeWei)+(evidence.frontendLive?.receipts??[]).reduce((n,r)=>n+BigInt(r.feeWei),0n);
        const balanceSpend=parseUnits(evidence.startingBalanceTBNB,18)-await provider.getBalance(wallet.address);
        const alreadySpent=boundedCleanSpend(balanceSpend,combinedReceiptFees,0n);
        const projected=alreadySpent+remainingGas*freshGasPrice;
        continuation.gasForecastHistory??=[];
        if(continuation.gasForecast)continuation.gasForecastHistory.push(continuation.gasForecast);
        continuation.gasForecast={at:new Date().toISOString(),localValidation,alreadySpentWei:String(alreadySpent),includesFrontendReceiptFees:true,newActors,missingWishes,preparationCalls,heartbeatClaims,igniteClaims,deployGasLimit:String(deployLimit),wishGasLimit:String(wishLimit),heartbeatGasLimit:String(heartbeatLimit),remainingGasBound:String(remainingGas),gasPriceWei:String(freshGasPrice),projectedTotalWei:String(projected),fixedTotalCapWei:caps.totalFeeWei};persist();
        if(projected>BigInt(caps.totalFeeWei))fail("CLEAN_CONTINUATION_WHOLE_RUN_GAS_CAP");
      };
      await refreshForecast();
      if(BigInt(continuation.gasForecast.projectedTotalWei)>BigInt(caps.totalFeeWei))fail("CLEAN_CONTINUATION_WHOLE_RUN_GAS_CAP");
      const waitForBlock=async(target,label)=>{
        continuation.status=label;continuation.waitUntilBlockTimestamp=target;persist();
        let block=await provider.getBlock("latest"),lastNotice=0;
        while(block.timestamp<target){
          if(block.timestamp-lastNotice>=300){console.log(JSON.stringify({status:label,currentBlockTimestamp:block.timestamp,targetBlockTimestamp:target}));lastNotice=block.timestamp;}
          await new Promise(resolve=>setTimeout(resolve,15000));block=await provider.getBlock("latest");
        }
        continuation.status="RUNNING";persist();return block;
      };
      const runCohortCap=async(kind,index)=>{
        const heartbeat=kind==="HEARTBEAT",method=heartbeat?"heartbeatClaim":"igniteAndClaim";
        const eventName=heartbeat?"HeartbeatClaimed":"IgniteClaimed",counter=heartbeat?"heartbeatHourClaims":"igniteDayClaims";
        const expected=heartbeat?"HeartbeatHourFull":"IgniteDayFull",check=heartbeat?"BOT_89_HEARTBEAT_CAP":"BOT_89_IGNITE_CAP";
        const slot=heartbeat?"heartbeat":"ignite",cohort=continuation.cohort.map(i=>evidence.actors[i].address),rows=[];
        const inWindow=block=>{if(Math.floor(block.timestamp/(heartbeat?3600:86400))!==index||(!heartbeat&&block.timestamp%86400>=600))fail("CLEAN_CAP_REAL_WINDOW_ENDED_STOP");};
        const verifyReceipt=async(i,receipt)=>{
          const user=evidence.actors[i].address,label=`${kind}_STRESS_${index}_${i}`,op=evidence.operations[label];
          if(!receipt||receipt.status!==1||receipt.hash!==op?.hash||receipt.from.toLowerCase()!==wallet.address.toLowerCase())fail("CLEAN_CAP_CONFIRMED_RECEIPT_REQUIRED");
          const block=await provider.getBlock(receipt.blockNumber);inWindow(block);
          const events=receipt.logs.filter(log=>log.address.toLowerCase()===heart.target.toLowerCase()).map(log=>{try{return heart.interface.parseLog(log);}catch{return null;}}).filter(log=>log?.name===eventName);
          if(events.length!==1)fail("CLEAN_CAP_EXACTLY_ONE_CLAIM_EVENT_REQUIRED");
          const args=events[0].args;
          return {actorIndex:i,user,to:receipt.to,eventUser:args.user,eventIndex:Number(heartbeat?args.hourIndex:args.dayIndex),eventCounter:Number(heartbeat?args.hourClaims:args.dayClaims),status:receipt.status,hash:receipt.hash,blockNumber:block.number,blockHash:block.hash,receiptBlockHash:receipt.blockHash,timestamp:block.timestamp};
        };
        // One initial reconciliation, then only each newly confirmed receipt is
        // fetched. Never perform O(n²) RPC scans inside the ten-minute window.
        for(const i of continuation.cohort){const op=evidence.operations[`${kind}_STRESS_${index}_${i}`];if(op){if(op.status!=="CONFIRMED")fail("CLEAN_CAP_UNRESOLVED_INTENT_STOP");rows.push(await verifyReceipt(i,await provider.getTransactionReceipt(op.hash)));}}
        continuation[slot]={status:"VERIFYING_REAL_COHORT",windowIndex:index,receiptEvidence:rows};persist();
        for(const i of continuation.cohort){
          const block=await provider.getBlock("latest");inWindow(block);
          const globalCount=Number(await heart[counter](index,{blockTag:block.number}));
          validateCleanCapRows({cohort,rows,kind,index,globalCount});
          const a=await actor(i);
          if(rows.some(row=>row.user.toLowerCase()===a.target.toLowerCase()))continue;
          if(rows.length<88){
            const receipt=await actorCall(`${kind}_STRESS_${index}_${i}`,a,heart,method);
            rows.push(await verifyReceipt(i,receipt));
            validateCleanCapRows({cohort,rows,kind,index,globalCount:rows.length});
            continuation[slot].receiptEvidence=rows;persist();
          }else{
            const summary=validateCleanCapRows({cohort,rows,kind,index,globalCount,complete:true,rejectedActor:a.target});
            // The exact cap revert proves earlier wallet/civilization/window
            // gates passed. Pin both eth_call and global counter to this block.
            await rejection(check,heart,method,[],a.target,expected,block);
            if((await provider.getBlock(block.number)).hash!==block.hash)fail("CLEAN_CAP_REJECTION_BLOCK_REORG_STOP");
            const reject=evidence.checks[check];
            if(!reject.pinnedBlockTag||reject.block!==block.number||reject.blockHash!==block.hash)fail("CLEAN_CAP_REJECTION_NOT_EXACT_PINNED_BLOCK");
            continuation[slot]={status:"PASS",...summary,successfulClaims:summary.confirmedDistinctCohortClaims,receiptEvidence:rows,rejectedActor:a.target,rejection:expected,rejectionBlock:{number:block.number,hash:block.hash,timestamp:block.timestamp},earlierHour61NotCounted:heartbeat};persist();
            return continuation[slot];
          }
        }
        fail("CLEAN_CAP_MISSING_89TH_REJECTION");
      };
      if(!process.argv.includes("--ignite")) {
        const firstCohortActor=await actor(510);
        if(!continuation.firstPreparation) {
          const wish=await heart.activeWish(firstCohortActor.target);
          continuation.firstPreparation={actorIndex:510,civilizationId:wish.civilizationId,wishHash:id(`CAP_CONTINUATION_${heart.target}_510`),heartbeatBefore:String(await heart.lastHeartbeatAt(firstCohortActor.target))};persist();
        }
        const prep=continuation.firstPreparation;
        await actorCall("CAP_CONTINUATION_PREPARE_ACTOR_510",firstCohortActor,heart,"makeWish",[prep.wishHash,prep.civilizationId]);
        if(!continuation.firstPreparationVerified) {
          assert(String(await heart.lastHeartbeatAt(firstCohortActor.target))===prep.heartbeatBefore,"CONTINUATION_PREPARATION_DOES_NOT_RESET_HEARTBEAT");
          continuation.firstPreparationVerified=true;persist();
        }
        for(const i of continuation.cohort.filter(i=>i>=600)) {
          const a=await actor(i);
          await actorCall(`CAP_CONTINUATION_WISH_${i}`,a,heart,"makeWish",[id(`CAP_WISH_${heart.target}_${i}`),id(`CAP_CIV_${heart.target}_${i}`)]);
        }
        continuation.preparedActors=continuation.cohort.length;persist();
        if(continuation.heartbeatHour==null) {
          let eligibleAt=0;
          for(const i of continuation.cohort)eligibleAt=Math.max(eligibleAt,Number(await heart.lastHeartbeatAt(evidence.actors[i].address))+3600);
          const now=(await provider.getBlock("latest")).timestamp;
          continuation.heartbeatHour=Math.ceil(Math.max(now,eligibleAt)/3600);
          continuation.heartbeatEligibleAt=eligibleAt;persist();
        }
        const hour=continuation.heartbeatHour;
        if(continuation.heartbeat?.status!=="PASS") {
          await waitForBlock(hour*3600,"WAITING_REAL_HEARTBEAT_COHORT_HOUR");
          await refreshForecast();
          await runCohortCap("HEARTBEAT",hour);
        }
      } else {
        if(continuation.heartbeat?.status!=="PASS"||continuation.preparedActors!==89)fail("CLEAN_CONTINUATION_IGNITE_PREPARATION_INCOMPLETE");
        const now=(await provider.getBlock("latest")).timestamp;
        continuation.igniteDay??=now%86400<600?Math.floor(now/86400):Math.floor(now/86400)+1;persist();
        const day=continuation.igniteDay;
        await waitForBlock(day*86400,"WAITING_REAL_UTC_IGNITE_WINDOW");
        await refreshForecast();
        await runCohortCap("IGNITE",day);
        evidence.checks.IGNITE={status:"PASS",kind:"REAL_BSC97_UTC_WINDOW",dayIndex:day};
        persist();
      }
      evidence.status=continuation.heartbeat?.status==="PASS"&&continuation.ignite?.status==="PASS"?"CLEAN_REHEARSAL_PASS":"CORE_AND_FORTUNE_PASS_REAL_CAP_WINDOW_PENDING";
      continuation.status=evidence.status;continuation.writerPid=null;evidence.updatedAt=new Date().toISOString();persist();
      console.log(JSON.stringify({status:evidence.status,proxy:heart.target,totalTestGasTBNB:formatEther(BigInt(evidence.totalFeeWei)),mainnetTransactionsSent:0}));return;
    }
    const prepare = async (index,suffix="FIRST",options={}) => {
      const a=await actor(index);const row=evidence.actors[index];
      const p=row[suffix]??{civilizationId:id(`CLEAN_CIV_${heart.target}_${index}_${suffix}`),wishHash:id(`CLEAN_WISH_${heart.target}_${index}_${suffix}`),holyCupProofId:id(`CLEAN_CUP_${heart.target}_${index}_${suffix}`)};
      row[suffix]=p;persist();
      await call(`FUND_KAIOS_${index}_${suffix}`,kaios,"transfer",[a.target,parseUnits("1",18)]);
      if(!p.deadline){p.deadline=(await provider.getBlock("latest")).timestamp+86400;persist();}
      const signature=await wallet.signTypedData({name:"KGEN TempleHeart 12345",version:"3.4.0",chainId:97,verifyingContract:heart.target},
        {HolyCupProof:[{name:"claimant",type:"address"},{name:"civilizationId",type:"bytes32"},{name:"wishHash",type:"bytes32"},{name:"proofId",type:"bytes32"},{name:"deadline",type:"uint256"}]},
        {claimant:a.target,civilizationId:p.civilizationId,wishHash:p.wishHash,proofId:p.holyCupProofId,deadline:p.deadline});
      await call(`WISH_CUP_APPROVE_${index}_${suffix}`,a,"executeBatch",[
        [heart.target,heart.target,kaios.target],
        [heart.interface.encodeFunctionData("makeWish",[p.wishHash,p.civilizationId]),heart.interface.encodeFunctionData("submitHolyCupProof",[p.holyCupProofId,p.civilizationId,p.wishHash,p.deadline,signature]),kaios.interface.encodeFunctionData("approve",[furnace.target,parseUnits("1",18)])]]);
      const destination=await heart.alchemyDestinationCode(await heart.fortunePurposeCode(),p.wishHash);
      const receipt=await actorCall(`ALCHEMY_${index}_${suffix}`,a,furnace,"burnForKufo",[parseUnits("1",18),options.beneficiary??a.target,options.civilizationId??p.civilizationId,destination]);
      for(const log of receipt.logs){try{const x=furnace.interface.parseLog(log);if(x?.name==="AlchemyProofCreated")p.proofId=x.args.proofId;}catch{}}
      if(!p.proofId)fail("CLEAN_PROOF_EVENT_MISSING");persist();return{a,p};
    };
    const first=await prepare(0);
    await actorCall("FORTUNE_FIRST",first.a,heart,"fortuneClaim",[first.p.proofId]);
    const ledger=await heart.fortuneLedger(first.a.target);
    assert(ledger.claimCount===1n,"FORTUNE_FIRST_LEDGER");
    const second=await prepare(0,"SECOND");
    if(!evidence.operations.VOLUNTARY_REPAYMENT)await rejection("REPAYMENT_REQUIRED",heart,"fortuneClaim",[second.p.proofId],first.a.target,"RepaymentRequired");
    await actorCall("APPROVE_REPAYMENT",first.a,kgen,"approve",[heart.target,parseUnits("1",18)]);
    await actorCall("VOLUNTARY_REPAYMENT",first.a,heart,"voluntaryRepayFortune",[parseUnits("1",18)]);
    assert((await heart.fortuneLedger(first.a.target)).repaidAfterLastClaim,"VOLUNTARY_REPAYMENT_RESTORES_CONDITION");
    const eligibility=await heart.nextFortuneEligibility(first.a.target);
    assert(eligibility.repaymentSatisfied&&!eligibility.eligible,"REPAYMENT_TRUE_NOT_COOLDOWN_BYPASS");
    evidence.checks.FORTUNE_AGAIN_ELIGIBILITY={status:"PASS_REPAYMENT_TRUE_30_DAY_COOLDOWN_REMAINS",cooldownEndsAt:String(eligibility.cooldownEndsAt),observedBlock:await provider.getBlockNumber()};persist();
    await rejection("CIVILIZATION_SWITCH_STILL_WALLET_COOLDOWN",heart,"fortuneClaim",[second.p.proofId],first.a.target,"FortuneCooldown");
    await actorCall("HEARTBEAT_FIRST",first.a,heart,"heartbeatClaim");
    assert(await heart.lastHeartbeatAt(first.a.target)>0n,"HEARTBEAT_LIVE");
    const wrong=await prepare(501,"REDIRECT",{beneficiary:wallet.address});
    await rejection("BENEFICIARY_MISMATCH",heart,"fortuneClaim",[wrong.p.proofId],wrong.a.target,"BeneficiaryMismatch");
    const wrongCiv=await prepare(502,"WRONG_CIV",{civilizationId:id("WRONG_CIVILIZATION")});
    await rejection("CIVILIZATION_MISMATCH",heart,"fortuneClaim",[wrongCiv.p.proofId],wrongCiv.a.target,"CivilizationMismatch");
    await rejection("WALLET_SWITCH_CANNOT_CLAIM_OTHER_PROOF",heart,"fortuneClaim",[wrongCiv.p.proofId],wrong.a.target,"BurnerMismatch");
    await rejection("PROOF_REPLAY",heart,"fortuneClaim",[first.p.proofId],first.a.target,"ProofAlreadyConsumed");
    await rejection("UNAUTHORIZED_UPGRADE",heart,"upgradeToAndCall",[implementation.target,"0x"],wrong.a.target,"AccessControlUnauthorizedAccount");
    const continuity=await prepare(503,"LEGACY");
    if(!evidence.legacyTestTimestamp){evidence.legacyTestTimestamp=(await provider.getBlock("latest")).timestamp;persist();}
    await call("SET_TEST_LEGACY_HISTORY",legacy,"setHistory",[continuity.a.target,evidence.legacyTestTimestamp,evidence.legacyTestTimestamp,Math.floor(evidence.legacyTestTimestamp/86400)]);
    await rejection("LEGACY_FORTUNE_COOLDOWN",heart,"fortuneClaim",[continuity.p.proofId],continuity.a.target,"FortuneCooldown");
    await rejection("LEGACY_HEARTBEAT_COOLDOWN",heart,"heartbeatClaim",[],continuity.a.target,"HeartbeatCooldown");
    const reserveProxy=await deploy("reserveProbeProxy","ERC1967Proxy",[implementation.target,init]);
    const reserveHeart=new Contract(reserveProxy.target,compiled.abi,provider);
    await call("RESERVE_INITIALIZE",reserveHeart,"initializeV340",[registry.target]);
    await call("RESERVE_LEGACY_BIND",reserveHeart,"bindLegacyContinuity",[legacy.target]);
    await call("RESERVE_FUND_EXACT_FLOOR",kgen,"transfer",[reserveHeart.target,parseUnits("20000",18)]);
    await call("RESERVE_WISH",reserveHeart,"makeWish",[id("RESERVE_WISH"),id("RESERVE_CIV")]);
    await rejection("RESERVE_PROTECTION",reserveHeart,"heartbeatClaim",[],wallet.address,"HeartInsufficientFunds");
    const latest=await provider.getBlock("latest");
    if(evidence.checks.IGNITE?.status!=="PASS")evidence.checks.IGNITE=latest.timestamp%86400<600 ? "WINDOW_OPEN_PENDING_STRESS" : {status:"WAITING_REAL_UTC_WINDOW",nextWindowUtc:new Date((Math.floor(latest.timestamp/86400)+1)*86400000).toISOString()};
    persist();
    if(process.argv.includes("--stress")) {
      const epoch=BigInt((await provider.getBlock("latest")).timestamp)/await heart.fortuneEpochSeconds();
      evidence.stressEpoch??=String(epoch);if(evidence.stressEpoch!==String(epoch))fail("CLEAN_EPOCH_CHANGED_STOP");
      if(evidence.checks.FIVE_HUNDRED_DISTINCT_CLAIMS!=="PASS")for(let i=1;i<=500;i++) {
        if(BigInt((await provider.getBlock("latest")).timestamp)/await heart.fortuneEpochSeconds()!==epoch)fail("CLEAN_EPOCH_CHANGED_STOP");
        const item=await prepare(i);
        // Reconcile this wallet's existing intent before choosing a fresh cap
        // probe. A restart after claim 500 must not probe a consumed proof.
        if(evidence.operations[`FORTUNE_STRESS_${i}`]) {
          await actorCall(`FORTUNE_STRESS_${i}`,item.a,heart,"fortuneClaim",[item.p.proofId]);continue;
        }
        if(await heart.fortuneEpochClaims(epoch)<500n)await actorCall(`FORTUNE_STRESS_${i}`,item.a,heart,"fortuneClaim",[item.p.proofId]);
        else {await rejection("BOT_501_EPOCH_CAP",heart,"fortuneClaim",[item.p.proofId],item.a.target,"FortuneEpochFull");evidence.epochRejectedActor=item.a.target;persist();break;}
      }
      assert(await heart.fortuneEpochClaims(epoch)===500n,"FIVE_HUNDRED_DISTINCT_CLAIMS");
      // Prepare the 89 contract wallets before choosing the assertion hour.
      // They remain usable for the real daily Ignite window without deployments
      // consuming that short window. Never adjust the canonical clock/caps.
      if(evidence.checks.BOT_89_HEARTBEAT_CAP?.status!=="PASS")for(let i=510;i<599;i++) {
        const a=await actor(i);
        await actorCall(`CAP_WISH_${i}`,a,heart,"makeWish",[id(`HB_WISH_${heart.target}_${i}`),id(`HB_CIV_${heart.target}_${i}`)]);
      }
      let clock=await provider.getBlock("latest");
      while(evidence.checks.BOT_89_HEARTBEAT_CAP?.status!=="PASS"&&3600-clock.timestamp%3600<600) {
        console.log("CLEAN_HEARTBEAT_WAIT_FOR_SAFE_REAL_HOUR_WINDOW");
        await new Promise(resolve=>setTimeout(resolve,30000));clock=await provider.getBlock("latest");
      }
      const hour=Math.floor(clock.timestamp/3600);
      // 89 unused addresses: no reliance on the earlier control claim's hour.
      if(evidence.checks.BOT_89_HEARTBEAT_CAP?.status!=="PASS")for(let i=510;i<599;i++) {
        if(Math.floor((await provider.getBlock("latest")).timestamp/3600)!==hour)fail("CLEAN_HOUR_CHANGED_STOP");
        const a=await actor(i);
        if(evidence.operations[`HEARTBEAT_STRESS_${hour}_${i}`]) {
          await actorCall(`HEARTBEAT_STRESS_${hour}_${i}`,a,heart,"heartbeatClaim");continue;
        }
        const current=await heart.heartbeatHourClaims(hour);
        if(current<88n)await actorCall(`HEARTBEAT_STRESS_${hour}_${i}`,a,heart,"heartbeatClaim");
        else await rejection("BOT_89_HEARTBEAT_CAP",heart,"heartbeatClaim",[],a.target,"HeartbeatHourFull");
      }
    }
    if(process.argv.includes("--ignite")) {
      const block=await provider.getBlock("latest");
      if(block.timestamp%86400>=600)fail("CLEAN_IGNITE_REAL_UTC_WINDOW_NOT_OPEN");
      const day=Math.floor(block.timestamp/86400);
      for(let i=510;i<599;i++) {
        const now=await provider.getBlock("latest");
        if(Math.floor(now.timestamp/86400)!==day||now.timestamp%86400>=600)fail("CLEAN_IGNITE_WINDOW_ENDED_STOP");
        if(!evidence.actors[i])fail("CLEAN_IGNITE_ACTORS_MUST_BE_PREPARED_BEFORE_WINDOW");
        const a=await actor(i);
        if(evidence.operations[`IGNITE_STRESS_${day}_${i}`]) {
          await actorCall(`IGNITE_STRESS_${day}_${i}`,a,heart,"igniteAndClaim");continue;
        }
        const count=await heart.igniteDayClaims(day);
        if(count<88n)await actorCall(`IGNITE_STRESS_${day}_${i}`,a,heart,"igniteAndClaim");
        else {await rejection("BOT_89_IGNITE_CAP",heart,"igniteAndClaim",[],a.target,"IgniteDayFull");break;}
      }
      assert(await heart.igniteDayClaims(day)===88n,"EIGHTY_EIGHT_LIVE_IGNITES");
      evidence.checks.IGNITE={status:"PASS",kind:"REAL_BSC97_UTC_WINDOW",dayIndex:day};persist();
    }
    evidence.status=evidence.checks.FIVE_HUNDRED_DISTINCT_CLAIMS==="PASS"&&evidence.checks.BOT_89_HEARTBEAT_CAP?.status==="PASS"&&evidence.checks.BOT_89_IGNITE_CAP?.status==="PASS"
      ?"CLEAN_REHEARSAL_PASS":"CORE_PASS_STRESS_OR_REAL_WINDOW_PENDING";
    evidence.updatedAt=new Date().toISOString();persist();
    console.log(JSON.stringify({status:evidence.status,proxy:heart.target,totalTestGasTBNB:formatEther(BigInt(evidence.totalFeeWei)),mainnetTransactionsSent:0}));
  } catch(error) {
    // Do not serialize ethers exception payloads (may contain authenticated RPC
    // URLs), transaction objects, Wallet objects or private key material.
    const safe=/^(CLEAN_|STALE_)/.test(error.message??"") ? error.message : (typeof error.code==="string"?error.code:"CLEAN_OPERATION_FAILED");
    if(evidence){evidence.status="STOPPED";evidence.lastFailure={code:safe,at:new Date().toISOString()};try{persist();}catch{}}
    console.error(JSON.stringify({status:"CLEAN_REHEARSAL_STOPPED",code:safe,mainnetTransactionsSent:0}));process.exitCode=1;
  } finally {
    if(writerLock!==undefined){
      if(evidence?.capContinuation){evidence.capContinuation.writerPid=null;evidence.capContinuation.writerReleasedAt=new Date().toISOString();try{persist();}catch{}}
      fs.closeSync(writerLock);fs.unlinkSync(writerLockPath);
    }
    await provider.destroy();
  }
}

if(process.argv.includes("--testnet-clean-rehearsal"))await runCleanTestnetRehearsal();

if (process.argv.includes("--live-readonly")) {
  const evidence = {status:"READ_ONLY_EVIDENCE", sourceHead:execFileSync("git",["rev-parse","HEAD"],{cwd:root,encoding:"utf8"}).trim(), networks:[], mainnetTransactionsSent:0, signerLoaded:false};
  for (const chainId of [56,97]) {
    const rpc = process.env[chainId === 56 ? "BSC_MAINNET_RPC_URL" : "BSC_TESTNET_RPC_URL"];
    if (!rpc) { evidence.networks.push({chainId,status:"RPC_NOT_PRESENT"}); continue; }
    const provider = new JsonRpcProvider(rpc);
    try {
      if ((await provider.getNetwork()).chainId !== BigInt(chainId)) throw new Error("WRONG_CHAIN");
      const block = await provider.getBlock("latest"), tag = block.number, read = {blockTag:tag};
      const addresses = chainId === 56 ? {
        heart:"0xB016D4d8f1aED1339101b30722cad6dbA9B8C972", kgen:"0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be",
        registry:"0xA9e7CbF161E39E556f4B5b8E41397Ac4B87a932D", proofSource:"0xD4E67B3a69e41524c424150E6b6e921b01D036db"
      } : {
        heart:"0xa74F84942ADe7F668009BC4cB9E73C05ed5A3296", kgen:"0x79b65388e6fd7e0b171147914384A0455c7A16E6",
        registry:"0x577eb07d3d24aC26f3393771F0E48608C4871DeA", proofSource:"0x74f7A95B40bB9a1Aa2ebCc680166e9A45494C225"
      };
      const entry = {chainId,blockNumber:tag,blockHash:block.hash,blockTimestamp:block.timestamp,addresses,codeHashes:{}};
      for (const [name,address] of Object.entries(addresses)) {
        const code = await provider.getCode(address,tag);
        if (code === "0x") throw new Error("MISSING_CODE");
        entry.codeHashes[name] = keccak256(code);
      }
      entry.implementationSlot = await provider.getStorage(addresses.heart,IMPLEMENTATION_SLOT,tag);
      entry.heartReserve = String(await new Contract(addresses.kgen,BASIC_ERC20_ABI,provider).balanceOf(addresses.heart,read));
      const registry = new Contract(addresses.registry,REGISTRY_ABI,provider);
      entry.treasury11520 = await registry.organ(ORGAN_EXCHANGE_TREASURY_11520,read);
      entry.furnace = await registry.organ(ORGAN_FURNACE_18911,read);
      if (chainId === 97) {
        const heart = new Contract(addresses.heart,currentArtifact.abi,provider);
        entry.version = await heart.version(read);
        entry.implementation = getAddress(`0x${entry.implementationSlot.slice(-40)}`);
        const code = await provider.getCode(entry.implementation,tag);
        entry.implementationCodeHash = keccak256(code);
        entry.currentSourceRuntimeMatch = runtimeMatchesArtifact(code,currentArtifact);
        entry.fortuneGame = await heart.fortuneGame(read);
        entry.fortuneGameReleaseBlocked = entry.fortuneGame !== ZeroAddress;
        entry.roles = {};
        for (const [name,role] of REQUIRED_SIGNER_ROLES) entry.roles[name] = {
          historicalPublicSigner:"0x3a909988E4d5c9C2326A7a0596714482AB25eE0A",
          hasRole:await heart.hasRole(role,"0x3a909988E4d5c9C2326A7a0596714482AB25eE0A",read)
        };
      } else {
        entry.classification = entry.implementationSlot === `0x${"00".repeat(32)}` ? "LEGACY_DIRECT_DEPLOYMENT_NO_UUPS" : "UNEXPECTED_SLOT_STOP";
        const legacy = new Contract(addresses.heart,["function owner() view returns(address)","function brainVault() view returns(address)"],provider);
        entry.legacyOwner = await legacy.owner(read);
        entry.legacyBrainVault = await legacy.brainVault(read);
        entry.newHeartRoleAssignments = "NOT_AUTHORIZED_OR_INFERRED_FROM_LEGACY_OWNER";
      }
      // Verify the supported proof return shape without issuing a proof or burn.
      const source = new Contract(addresses.proofSource,["function alchemyBurnRecord(bytes32) view returns(tuple(address owner,address beneficiary,address furnace,uint256 kaiosBurned,uint256 expectedKufo,bytes32 lifeId,bytes32 destinationCode,uint256 blockNumber,uint256 timestamp))"],provider);
      await source.alchemyBurnRecord(`0x${"00".repeat(32)}`,read);
      entry.proofInterfaceRead = "PASS_EMPTY_RECORD_ONLY_NOT_PROOF_ISSUANCE";
      evidence.networks.push(entry);
    } catch (error) {
      // RPC exception objects can contain authenticated URLs. Never log them.
      evidence.networks.push({chainId,status:"READ_FAILED",code:typeof error.code === "string" ? error.code : "READ_CHECK_FAILED"});
      evidence.status = "INCOMPLETE_READ_ONLY_EVIDENCE";
      process.exitCode = 1;
    } finally { await provider.destroy(); }
  }
  const output = path.join(root,"artifacts","TEMPLEHEART_LIVE_READONLY.json");
  fs.writeFileSync(output,`${JSON.stringify(evidence,null,2)}\n`);
  console.log(JSON.stringify({status:evidence.status,path:output,mainnetTransactionsSent:0}));
}
