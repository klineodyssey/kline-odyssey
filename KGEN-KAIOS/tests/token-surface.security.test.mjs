import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { artifact } from "./helpers.mjs";

const root = path.resolve(import.meta.dirname, "..");

function functionNames(contractName) {
  return new Set(
    artifact(contractName).abi
      .filter((entry) => entry.type === "function")
      .map((entry) => entry.name),
  );
}

test("token ABIs expose no arbitrary mint, blacklist, seizure, tax, or AMM-pair controls", () => {
  const forbidden = [
    "mint",
    "adminMint",
    "setMinter",
    "blacklist",
    "seize",
    "setTax",
    "setTaxExempt",
    "setMarketMakerPair",
    "setPair",
  ];
  for (const contractName of ["KAIOS", "KUFO", "KSHIP"]) {
    const names = functionNames(contractName);
    for (const name of forbidden) assert.equal(names.has(name), false, `${contractName}.${name}`);
  }
});

test("compiler and OpenZeppelin dependencies are exactly pinned", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const packageLock = JSON.parse(fs.readFileSync(path.join(root, "package-lock.json"), "utf8"));
  assert.equal(packageJson.devDependencies.solc, "0.8.24");
  assert.equal(packageJson.devDependencies["@openzeppelin/contracts"], "5.0.2");
  assert.equal(packageJson.devDependencies["@openzeppelin/contracts-upgradeable"], "5.0.2");
  assert.equal(packageLock.packages["node_modules/solc"].version, "0.8.24");
  assert.equal(packageLock.packages["node_modules/@openzeppelin/contracts"].version, "5.0.2");
  assert.equal(packageLock.packages["node_modules/@openzeppelin/contracts-upgradeable"].version, "5.0.2");
});

test("review package contains no Mainnet deployment script or deployed address manifest", () => {
  assert.equal(fs.existsSync(path.join(root, "deployments", "mainnet.json")), false);
  assert.equal(fs.existsSync(path.join(root, "scripts", "deploy-mainnet.mjs")), false);
});

test("Genesis inscription binds the Organ Registry rather than one permanent Furnace", () => {
  const names = functionNames("KAIOSGenesisInscription");
  assert.equal(names.has("organRegistry"), true);
  assert.equal(names.has("alchemyFurnace18911"), false);
});


// The actual inline 18888 funding adapter/controller are the sole product owners.
// Execute their complete component bodies with real ethers and offline providers;
// no test reimplementation, external RPC, wallet signer or real funds is used.
import { AbiCoder, id, keccak256, parseUnits } from "ethers";
const BANK_CONTROLLER_MARKER = "// BEGIN HUMAN FUNDING CONTROLLER";
const BANK_CONTROLLER_END = "// END HUMAN FUNDING CONTROLLER";
const SEVEN_CONTROLLER_MARKER = "// BEGIN SEVEN FLOOR CONTROLLER";
const SEVEN_CONTROLLER_END = "// END SEVEN FLOOR CONTROLLER";
const BANK_TEST_ETHER = 10n ** 18n;
async function inlineBankApi({ mockGovernanceRuntime } = {}) {
  const vm = await import("node:vm"), { createRequire } = await import("node:module");
  const ethers = createRequire(import.meta.url)(path.resolve(root, "../K線西遊記/temples/12345/assets/ethers-5.7.2.umd.min.js"));
  const html = fs.readFileSync(path.resolve(root, "../K線西遊記/temples/18888/index.html"), "utf8");
  const source = html.match(/<script\b[^>]*id="funding-controller"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(source?.includes(BANK_CONTROLLER_MARKER), "execute the real retained inline component");
  let adapter = source.split(BANK_CONTROLLER_MARKER)[0].replace(/^import[^\n]+\r?\n/gm, "");
  if (mockGovernanceRuntime) {
    // Use the actual pin verification with synthetic, offline code for this fixture only.
    const governancePin = /(governance: Object.freeze\(\{[^\n]*runtimeHash: ")0x[0-9a-f]{64}(")/;
    assert.match(adapter, governancePin);
    adapter = adapter.replace(governancePin, (_pin, prefix, suffix) => prefix + keccak256(mockGovernanceRuntime) + suffix);
  }
  const context = { ...ethers.utils, window: {}, navigator: {}, structuredClone };
  vm.runInNewContext(adapter + `\nglobalThis.bankTestApi = {
    FUNDING_FORMAL,FUNDING_RUNTIME_PINS,FUNDING_IMPLEMENTATION_SLOT,FUNDING_STORAGE_KEY,FUNDING_LOCK_KEY,FUNDING_EVIDENCE_PREFIX,
    buildLifeResourcePlan,deriveFundingStep,HumanFundingWallet,buildSharedCapPlan,deriveSharedCapStep,SharedCapWallet,
    buildLegacyCapCancelPlan,deriveLegacyCapCancelStep,isLegacyCapCancelPlan,LegacyCapCancelWallet,LEGACY_APPROVAL_RECEIPT,
    buildBankPausePlan,deriveBankPauseStep,HumanBankPauseWallet,readFundingRuntimePins,walletAccounts,authorizedWalletAccount,
    SEVEN_FLOORS,SEVEN_FLOOR_RELEASE,sevenFloorRuntimePins,projectSevenFloorPlayerContext,
    validateSevenFloorAmount,buildSevenFloorPlan,deriveSevenFloorStep,SevenFloorClaimWallet,
    bankAbi,allocationAbi,governanceAbi,floorInterface
  };`, context, { filename: "actual-18888-inline-adapter.mjs" });
  return context.bankTestApi;
}
let archivedBankPromise;
async function compiledArchivedBank() {
  if (!archivedBankPromise) archivedBankPromise = (async () => {
    const { default: solc } = await import("solc");
    const name = "contracts/LingxiaoCelestialBank18888_Upgradeable.sol";
    const content = fs.readFileSync(path.join(root, "archive/mainnet-lineage/pr135-genesis", name), "utf8");
    const output = JSON.parse(solc.compile(JSON.stringify({ language: "Solidity", sources: { [name]: { content } },
      settings: { optimizer: { enabled: true, runs: 1 }, viaIR: true, evmVersion: "paris", metadata: { bytecodeHash: "none" },
        outputSelection: { "*": { "*": ["abi", "evm.deployedBytecode.object", "evm.deployedBytecode.immutableReferences"] } } } }),
      { import: dependency => {
        const file = path.join(root, "node_modules", dependency);
        return fs.existsSync(file) ? { contents: fs.readFileSync(file, "utf8") } : { error: `Missing locked dependency: ${dependency}` };
      } }));
    assert.deepEqual((output.errors || []).filter(item => item.severity === "error"), []);
    const built = output.contracts[name].LingxiaoCelestialBank18888_Upgradeable;
    return { abi: built.abi, deployedBytecode: `0x${built.evm.deployedBytecode.object}`,
      immutableReferences: built.evm.deployedBytecode.immutableReferences };
  })();
  return archivedBankPromise;
}
function patchBankTestSelfAddress(template, references, implementation) {
  const bytes = Uint8Array.from(Buffer.from(template.slice(2), "hex"));
  const address = Buffer.from(implementation.slice(2).padStart(64, "0"), "hex");
  const ranges = Object.values(references).flat(); assert.ok(ranges.length > 0);
  for (const { start, length } of ranges) { assert.equal(length, 32); bytes.set(address, start); }
  return `0x${Buffer.from(bytes).toString("hex")}`;
}

test("human funding: exact plans, fail-closed steps and explicit wallet requests", async (t) => {
  const {
    FUNDING_FORMAL: formal,
    FUNDING_LOCK_KEY,
    FUNDING_STORAGE_KEY,
    FUNDING_EVIDENCE_PREFIX,
    buildLifeResourcePlan,
    deriveFundingStep,
    HumanFundingWallet,
  } = await inlineBankApi();
  const { Interface } = await import("ethers");
  const receiptInterface = new Interface([
    "event Transfer(address indexed from,address indexed to,uint256 value)",
    "event AllocationExecuted(bytes32 indexed allocationId,address indexed beneficiary,uint256 amount,address triggeredBy)",
    "event ModulePaymentExecuted(bytes32 indexed moduleId,bytes32 indexed paymentId,address indexed beneficiary,uint256 amount)",
    "event GovernanceProposalExecuted(bytes32 indexed proposalId,address indexed target,bytes32 indexed dataHash)",
  ]);
  const eventLog = (address, name, values) => ({ address,
    ...receiptInterface.encodeEventLog(receiptInterface.getEvent(name), values) });
  const transactionHash = `0x${"11".repeat(32)}`;
  const blockHash = `0x${"22".repeat(32)}`;
  const receipt = (logs = []) => ({ status: "0x1", transactionHash,
    blockNumber: "0x100", blockHash, logs });
  const zero = "0x0000000000000000000000000000000000000000";
  const beneficiary = "0x1000000000000000000000000000000000000001";
  const alternate = "0x2000000000000000000000000000000000000002";
  const plan = buildLifeResourcePlan({ beneficiary, amount: "1080000" });
  const timestamp = 1_700_000_000;
  const absent = () => ({ target: zero, value: "0", dataHash: id("absent"), executableAt: "0", proposer: zero, approver: zero, executed: false, cancelled: false });
  const snapshot = () => ({
    chainId: 56, account: formal.mother, timestamp,
    codeOk: true, token: formal.kaios, decimals: 18,
    module: { module: formal.allocation, versionHash: formal.versionHash, active: true,
      perTransactionLimit: formal.capWei, epochLimit: formal.capWei,
      epochSpent: "0", epochIndex: String(Math.floor(timestamp / 86400)) },
    health: { healthy: true, paused: false, available: String(20_000_000n * BANK_TEST_ETHER) },
    roles: { proposer: true, approver: false, moduleAdmin: true },
    capProposal: absent(), allocationProposal: absent(),
    allocation: { beneficiary: zero, amount: "0", executableAt: "0", purposeHash: id("absent"), executed: false, cancelled: false },
    paymentConsumed: false,
  });
  const storage = () => {
    const records = new Map();
    return { getItem: (key) => records.get(key) ?? null,
      setItem: (key, value) => records.set(key, value),
      removeItem: (key) => records.delete(key) };
  };
  const mockWallet = (options = {}) => {
    const calls = [], listeners = new Map();
    const provider = { on: (name, listener) => listeners.set(name, listener),
      request: async ({ method, params }) => {
        calls.push({ method, params });
        if (method === "eth_sendTransaction") {
          if (options.sendError) throw options.sendError;
          return `0x${"11".repeat(32)}`;
        }
        if (method === "eth_chainId") return "0x38";
        if (method === "eth_accounts" || method === "eth_requestAccounts") return [formal.mother];
        if (method === "eth_getTransactionReceipt") return options.receipt ?? null;
        if (method === "eth_getBlockByNumber") return options.canonicalBlock ??
          { number: options.receipt?.blockNumber, hash: options.receipt?.blockHash };
        if (method === "eth_getTransactionByHash") {
          const sent = calls.find((call) => call.method === "eth_sendTransaction")?.params[0];
          return sent ? { ...sent, input: sent.data, chainId: "0x38",
            blockNumber: options.receipt?.blockNumber, blockHash: options.receipt?.blockHash } : null;
        }
        throw new Error(`Unexpected offline provider request: ${method}`);
      } };
    const wallet = new HumanFundingWallet({ provider, storage: options.storage ?? storage(),
      now: options.now ?? (() => timestamp * 1000),
      locks: options.locks === undefined ? { request: async (_name, _options, callback) => callback({}) } : options.locks });
    let current = snapshot();
    wallet.inspect = async () => structuredClone(current);
    return { wallet, calls, listeners, change: (next) => { current = next; },
      sends: () => calls.filter((call) => call.method === "eth_sendTransaction") };
  };

  await t.test("decimal strings preserve all 18 places and stable IDs", () => {
    const precise = buildLifeResourcePlan({ beneficiary, amount: "1.000000000000000001" });
    assert.equal(BigInt(precise.amountWei), 1_000_000_000_000_000_001n);
    assert.equal(BigInt(plan.amountWei), 1_080_000n * BANK_TEST_ETHER);
    assert.equal(buildLifeResourcePlan({ beneficiary, amount: "1080000.0" }).allocationId, plan.allocationId);
    assert.equal(buildLifeResourcePlan({ beneficiary, amount: "1080000" }).allocationId, plan.allocationId);
    assert.notEqual(buildLifeResourcePlan({ beneficiary: alternate, amount: "1080000" }).allocationId, plan.allocationId);
    for (const amount of ["0", "-1", "1e6", "NaN", "Infinity", "1.0000000000000000001", 1.1]) {
      assert.throws(() => buildLifeResourcePlan({ beneficiary, amount }), `must reject ${amount}`);
    }
  });

  await t.test("wrong chain, code, token, roles and used epoch block", () => {
    for (const mutate of [
      (s) => { s.chainId = 1; }, (s) => { s.codeOk = false; },
      (s) => { s.token = alternate; }, (s) => { s.decimals = 6; },
      (s) => { s.module.versionHash = id("wrong-version"); },
      (s) => { s.roles.proposer = false; },
      (s) => { delete s.allocation; }, (s) => { delete s.paymentConsumed; },
      (s) => { s.module.perTransactionLimit = "1"; s.module.epochLimit = "1"; s.module.epochSpent = "1";
        s.allocation = { beneficiary:plan.beneficiary, amount:plan.amountWei, executableAt:"0", purposeHash:plan.purposeHash, executed:false, cancelled:false }; },
    ]) {
      const state = snapshot(); mutate(state);
      assert.equal(deriveFundingStep(plan, state).ready, false);
    }
    const high = snapshot();
    high.module.perTransactionLimit = String(20_000_000n * BANK_TEST_ETHER);
    high.module.epochLimit = String(20_000_000n * BANK_TEST_ETHER);
    const highStep = deriveFundingStep(plan, high);
    assert.equal(highStep.ready, false, "a higher existing cap requires explicit review, not automatic lowering");
    assert.equal(["CAP_PROPOSE", "CAP_EXECUTE"].includes(highStep.kind), false);
  });

  await t.test("proposal hash, approval, ETA and cancellation stay separate", () => {
    const state = snapshot();
    state.allocationProposal = { ...absent(), target: plan.allocation.target,
      dataHash: plan.allocation.dataHash, proposer: formal.mother, executableAt: String(timestamp + 3600) };
    assert.notEqual(deriveFundingStep(plan, state).kind, "ALLOCATION_EXECUTE", "unapproved proposal cannot execute");
    state.roles.approver = true;
    assert.equal(deriveFundingStep(plan, state).ready, false, "the proposer cannot approve their own proposal");
    state.account = formal.jade;
    assert.equal(deriveFundingStep(plan, state).kind, "ALLOCATION_APPROVE");
    state.allocationProposal.approver = formal.jade;
    assert.equal(deriveFundingStep(plan, state).kind, "WAIT_ETA");
    state.allocationProposal.executableAt = String(timestamp - 1);
    assert.equal(deriveFundingStep(plan, state).kind, "ALLOCATION_EXECUTE");
    state.allocationProposal.dataHash = id("tampered-calldata");
    assert.equal(deriveFundingStep(plan, state).ready, false);
    state.allocationProposal.dataHash = plan.allocation.dataHash;
    state.allocationProposal.cancelled = true;
    assert.equal(deriveFundingStep(plan, state).ready, false);
    state.allocationProposal.cancelled = false;
    state.allocationProposal.executed = true;
    assert.equal(deriveFundingStep(plan, state).ready, false, "executed proposal without matching allocation is inconsistent");
  });

  await t.test("allocation completion, cancellation and consumed IDs are exact", () => {
    const state = snapshot();
    state.allocation = { beneficiary: plan.beneficiary, amount: plan.amountWei,
      purposeHash: plan.purposeHash, executableAt: "0", executed: false, cancelled: false };
    assert.equal(deriveFundingStep(plan, state).kind, "PAYOUT");
    state.allocation.cancelled = true;
    assert.equal(deriveFundingStep(plan, state).ready, false);
    state.allocation.cancelled = false;
    state.paymentConsumed = true;
    assert.equal(deriveFundingStep(plan, state).ready, false);
    state.allocation.executed = true;
    assert.equal(deriveFundingStep(plan, state).kind, "DONE");
    state.allocation.beneficiary = alternate;
    assert.equal(deriveFundingStep(plan, state).ready, false, "an executed mismatched allocation is not this payment");
  });

  await t.test("original allocation governance runs beside cap governance without opening a premature payment", () => {
    const state = snapshot();
    state.module.perTransactionLimit = "6010928961748633879781";
    state.module.epochLimit = "6010928961748633879781";
    state.module.epochSpent = "1";
    assert.equal(deriveFundingStep(plan, state).kind, "ALLOCATION_PROPOSE", "no transfer or cap reset is involved");
    assert.equal(deriveFundingStep(plan, state).proposalId, plan.allocation.proposalId);
    state.allocationProposal = { ...absent(), target:plan.allocation.target, dataHash:plan.allocation.dataHash,
      proposer:formal.mother, executableAt:String(timestamp + 3600) };
    state.account = formal.jade; state.roles.approver = true;
    assert.equal(deriveFundingStep(plan, state).kind, "ALLOCATION_APPROVE");
    state.allocationProposal.approver = formal.jade;
    assert.equal(deriveFundingStep(plan, state).kind, "WAIT_ETA");
    state.allocationProposal.executableAt = String(timestamp);
    assert.equal(deriveFundingStep(plan, state).kind, "ALLOCATION_EXECUTE");
    state.allocation = {beneficiary:plan.beneficiary, amount:plan.amountWei, executableAt:"0", purposeHash:plan.purposeHash, executed:false, cancelled:false};
    assert.equal(deriveFundingStep(plan, state).ready, false, "used UTC spend still blocks a cap reset");
    assert.notEqual(deriveFundingStep(plan, state).kind, "PAYOUT");
    state.module.epochSpent = "0";
    assert.notEqual(deriveFundingStep(plan, state).kind, "PAYOUT", "pending cap cannot pay 1.08M");
    state.module.perTransactionLimit = formal.capWei; state.module.epochLimit = formal.capWei;
    assert.equal(deriveFundingStep(plan, state).kind, "PAYOUT");
  });

  await t.test("prepare never sends and a double click sends only once", async () => {
    const mock = mockWallet();
    assert.equal(mock.calls.length, 0, "constructor is inert");
    const preview = await mock.wallet.prepare(plan);
    assert.equal(mock.sends().length, 0);
    await Promise.allSettled([mock.wallet.request(preview), mock.wallet.request(preview)]);
    assert.equal(mock.sends().length, 1);
    assert.equal(mock.calls.some((call) => /sign|sendRaw/i.test(call.method)), false);
  });

  await t.test("missing or held browser locks block, available exclusive lock sends once", async () => {
    // An explicit empty manager represents an unavailable browser capability;
    // null would intentionally fall back to Node 24's own navigator.locks.
    for (const locks of [{}, { request: async (_name, _options, callback) => callback(null) }]) {
      const mock = mockWallet({ locks });
      const preview = await mock.wallet.prepare(plan);
      await assert.rejects(mock.wallet.request(preview));
      assert.equal(mock.sends().length, 0);
    }
    const lockCalls = [];
    const mock = mockWallet({ locks: { request: async (name, options, callback) => {
      lockCalls.push({ name, options }); return callback({ name });
    } } });
    await mock.wallet.request(await mock.wallet.prepare(plan));
    assert.deepEqual(JSON.parse(JSON.stringify(lockCalls)), [{ name: FUNDING_LOCK_KEY, options: { mode: "exclusive", ifAvailable: true } }]);
    assert.equal(mock.sends().length, 1);
    assert.equal(mock.sends()[0].params[0].chainId, "0x38");
  });

  await t.test("changed account or chain invalidates the preview", async () => {
    for (const mutate of [(s) => { s.account = formal.jade; }, (s) => { s.chainId = 1; }]) {
      const mock = mockWallet(); const preview = await mock.wallet.prepare(plan);
      const changed = snapshot(); mutate(changed); mock.change(changed);
      await assert.rejects(mock.wallet.request(preview));
      assert.equal(mock.sends().length, 0);
    }
  });

  await t.test("provider change events and an expired preview send nothing", async () => {
    for (const event of ["accountsChanged", "chainChanged"]) {
      const mock = mockWallet(); const preview = await mock.wallet.prepare(plan);
      mock.listeners.get(event)?.(event === "chainChanged" ? "0x1" : [formal.jade]);
      await assert.rejects(mock.wallet.request(preview));
      assert.equal(mock.sends().length, 0);
    }
    let time = timestamp * 1000;
    const mock = mockWallet({ now: () => time });
    const preview = await mock.wallet.prepare(plan);
    time += 120_001;
    await assert.rejects(mock.wallet.request(preview));
    assert.equal(mock.sends().length, 0);
    let inspectedTime = timestamp * 1000;
    const slow = mockWallet({ now: () => inspectedTime });
    const slowPreview = await slow.wallet.prepare(plan);
    const inspect = slow.wallet.inspect;
    slow.wallet.inspect = async (...args) => { inspectedTime += 120_001; return inspect(...args); };
    await assert.rejects(slow.wallet.request(slowPreview));
    assert.equal(slow.sends().length, 0, "expiry during fresh preflight still blocks the wallet request");
  });

  await t.test("storage save/readback failures prevent every send", async () => {
    for (const broken of [
      { ...storage(), setItem: () => { throw new Error("quota exceeded"); } },
      { ...storage(), getItem: () => null },
      { ...storage(), getItem: () => { throw new Error("storage unreadable"); } },
    ]) {
      const mock = mockWallet({ storage: broken });
      await assert.rejects(async () => {
        const preview = await mock.wallet.prepare(plan);
        await mock.wallet.request(preview);
      });
      assert.equal(mock.sends().length, 0);
    }
  });

  await t.test("4001 and unknown failures never auto retry", async () => {
    for (const code of [4001, -32603]) {
      const mock = mockWallet({ sendError: Object.assign(new Error("mock wallet refusal"), { code }) });
      const preview = await mock.wallet.prepare(plan);
      await assert.rejects(mock.wallet.request(preview));
      assert.equal(mock.sends().length, 1);
      await assert.rejects(mock.wallet.request(preview));
      assert.equal(mock.sends().length, 1);
      if (code !== 4001) {
        await assert.rejects(async () => mock.wallet.request(await mock.wallet.prepare(plan)));
        assert.equal(mock.sends().length, 1, "unknown submission must lock even a fresh preview");
      }
    }
  });

  await t.test("a successful receipt alone never proves the applicant was paid", async () => {
    for (const payout of [false, true]) {
      const hash = `0x${"11".repeat(32)}`;
      const mock = mockWallet({ receipt: receipt() });
      const state = snapshot();
      if (payout) state.allocation = { beneficiary: plan.beneficiary, amount: plan.amountWei,
        purposeHash: plan.purposeHash, executableAt: "0", executed: false, cancelled: false };
      mock.change(state);
      const preview = await mock.wallet.prepare(plan);
      await mock.wallet.request(preview);
      if (payout) { state.allocation.executed = true; state.paymentConsumed = true; mock.change(state); }
      const result = await mock.wallet.reconcile(hash);
      assert.equal(result.status, "MISMATCH", "status=1 without exact event evidence is insufficient");
      assert.notEqual(result.status, "VERIFIED_PAID");
      await assert.rejects(mock.wallet.prepare(plan), "unverified receipts retain the pending lock");
      assert.equal(mock.sends().length, 1);
    }
  });

  await t.test("payout needs all three exact events, canonical block and completed state", async () => {
    for (const mode of ["exact", "missing-event", "wrong-transfer", "wrong-canonical-block"]) {
      const logs = [
        eventLog(formal.kaios, "Transfer", [formal.bank, mode === "wrong-transfer" ? alternate : beneficiary, plan.amountWei]),
        eventLog(formal.allocation, "AllocationExecuted", [plan.allocationId, beneficiary, plan.amountWei, formal.mother]),
        eventLog(formal.bank, "ModulePaymentExecuted", [formal.moduleId, plan.paymentId, beneficiary, plan.amountWei]),
      ];
      if (mode === "missing-event") logs.pop();
      const mock = mockWallet({ receipt: receipt(logs),
        ...(mode === "wrong-canonical-block" ? { canonicalBlock: { number: "0x100", hash: `0x${"33".repeat(32)}` } } : {}) });
      const state = snapshot();
      state.allocation = { beneficiary, amount: plan.amountWei, purposeHash: plan.purposeHash,
        executableAt: "0", executed: false, cancelled: false };
      mock.change(state);
      await mock.wallet.request(await mock.wallet.prepare(plan));
      state.allocation.executed = true; state.paymentConsumed = true; mock.change(state);
      const result = await mock.wallet.reconcile(transactionHash);
      assert.equal(result.status, mode === "exact" ? "VERIFIED_PAID" : "MISMATCH");
      if (mode === "exact") assert.equal(mock.wallet.readPending(), null);
      else assert.notEqual(mock.wallet.readPending(), null, "uncertain receipt retains the lock");
      assert.equal(mock.wallet.storage.getItem(FUNDING_EVIDENCE_PREFIX+transactionHash)!==null,mode==='exact','only fully verified evidence is saved');
      assert.equal(mock.sends().length, 1);
    }
  });

  const paidEvidenceFixture = async (records, options={}) => {
    const mock=mockWallet({storage:records,...options,receipt:receipt([
      eventLog(formal.kaios,'Transfer',[formal.bank,beneficiary,plan.amountWei]),
      eventLog(formal.allocation,'AllocationExecuted',[plan.allocationId,beneficiary,plan.amountWei,formal.mother]),
      eventLog(formal.bank,'ModulePaymentExecuted',[formal.moduleId,plan.paymentId,beneficiary,plan.amountWei])
    ])});
    const state=snapshot();state.allocation={beneficiary,amount:plan.amountWei,purposeHash:plan.purposeHash,executableAt:'0',executed:false,cancelled:false};
    mock.change(state);await mock.wallet.request(await mock.wallet.prepare(plan));
    state.allocation.executed=true;state.paymentConsumed=true;mock.change(state);
    return mock;
  };
  const evidenceKey=FUNDING_EVIDENCE_PREFIX+transactionHash;
  await t.test('verified receipt evidence is written and read back before clearing the original pending intent',async()=>{
    const records=storage(),operations=[],get=records.getItem,set=records.setItem,remove=records.removeItem;
    records.getItem=key=>{if(key===evidenceKey)operations.push('read-evidence');return get(key);};
    records.setItem=(key,value)=>{if(key===evidenceKey)operations.push('write-evidence');set(key,value);};
    records.removeItem=key=>{if(key===FUNDING_STORAGE_KEY){operations.push('clear-pending');assert.ok(get(evidenceKey),'complete evidence exists before release');}remove(key);};
    const mock=await paidEvidenceFixture(records),original=mock.wallet.readPending();
    assert.equal((await mock.wallet.reconcile(transactionHash)).status,'VERIFIED_PAID');
    const saved=JSON.parse(get(evidenceKey));assert.equal(saved.schema,1);assert.equal(saved.firstVerifiedAt,timestamp*1000);
    assert.equal(saved.evidence.chainId,56);assert.equal(saved.evidence.hash,transactionHash);
    assert.equal(saved.evidence.status,'VERIFIED_PAID');assert.equal(saved.evidence.intent.intentId,original.intentId);
    assert.equal(saved.evidence.intent.plan.allocationId,plan.allocationId);assert.equal(saved.evidence.intent.plan.paymentId,plan.paymentId);
    assert.equal(saved.evidence.transaction.input,original.transaction.data.toLowerCase());
    assert.equal(saved.evidence.receipt.blockHash,blockHash);assert.equal(saved.evidence.canonicalBlock.hash,blockHash);
    assert.equal(saved.evidence.receipt.logs.length,3);assert.equal(saved.evidence.receipt.logs[0].address,formal.kaios.toLowerCase());
    assert.ok(operations.indexOf('write-evidence')<operations.lastIndexOf('read-evidence'));
    assert.ok(operations.lastIndexOf('read-evidence')<operations.indexOf('clear-pending'));
    assert.equal(get(FUNDING_STORAGE_KEY),null);assert.equal(mock.sends().length,1);
  });
  await t.test('evidence storage, quota, corrupt records and readback failures retain the exact original pending intent',async()=>{
    for(const mode of ['write','quota','read','drop-write','wrong-readback','corrupt','schema','invalid-clock']){
      const records=storage(),get=records.getItem,set=records.setItem;
      let wrote=false;
      records.setItem=(key,value)=>{if(key===evidenceKey){if(mode==='write'||mode==='quota')throw Error(mode);wrote=true;if(mode==='drop-write')return;}set(key,value);};
      records.getItem=key=>{if(key===evidenceKey){if(mode==='read')throw Error('read failed');if(mode==='wrong-readback'&&wrote)return '{}';}return get(key);};
      if(mode==='corrupt')set(evidenceKey,'{');
      if(mode==='schema')set(evidenceKey,JSON.stringify({schema:999,firstVerifiedAt:1,evidence:{}}));
      const mock=await paidEvidenceFixture(records),pending=get(FUNDING_STORAGE_KEY),prior=get(evidenceKey);
      if(mode==='invalid-clock')mock.wallet.now=()=>NaN;
      await assert.rejects(mock.wallet.reconcile(transactionHash),/EVIDENCE_(STORAGE_FAILED|CONFLICT)_RETAIN_PENDING/,mode);
      assert.equal(get(FUNDING_STORAGE_KEY),pending,mode);assert.equal(mock.sends().length,1,mode);
      if(mode==='corrupt'||mode==='schema')assert.equal(get(evidenceKey),prior,'existing evidence is never overwritten');
    }
  });
  await t.test('saved evidence survives interrupted pending release and reload retries are idempotent across clock changes',async()=>{
    const records=storage(),remove=records.removeItem;let interrupt=true;
    records.removeItem=key=>{if(key===FUNDING_STORAGE_KEY&&interrupt)throw Error('interrupted before clear');remove(key);};
    const mock=await paidEvidenceFixture(records),pending=records.getItem(FUNDING_STORAGE_KEY);
    await assert.rejects(mock.wallet.reconcile(transactionHash),/interrupted before clear/);
    const saved=records.getItem(evidenceKey);assert.ok(saved);assert.equal(records.getItem(FUNDING_STORAGE_KEY),pending);
    const reloaded=new HumanFundingWallet({provider:mock.wallet.provider,storage:records,now:()=>timestamp*1000+60000,
      locks:{request:async(_name,_options,callback)=>callback({})}});
    reloaded.inspect=mock.wallet.inspect;interrupt=false;
    assert.equal((await reloaded.reconcile(transactionHash)).status,'VERIFIED_PAID');
    assert.equal(records.getItem(evidenceKey),saved,'retry preserves the first proof and original verification time');
    assert.equal(reloaded.readPending(),null);assert.equal(mock.sends().length,1,'reload never resubmits the original payment');
  });
  await t.test('same-hash conflicting intent, IDs, block or events cannot overwrite saved evidence or release pending',async()=>{
    for(const mutate of [r=>r.evidence.intent.intentId='different-intent',r=>r.evidence.intent.plan.paymentId=id('other-payment'),
      r=>r.evidence.intent.plan.allocationId=id('other-allocation'),r=>r.evidence.intent.plan.beneficiary=alternate,
      r=>r.evidence.receipt.blockHash=id('other-block'),r=>r.evidence.receipt.logs[0].data='0x00']){
      const records=storage(),mock=await paidEvidenceFixture(records),pending=records.getItem(FUNDING_STORAGE_KEY);
      await mock.wallet.reconcile(transactionHash);const record=JSON.parse(records.getItem(evidenceKey));mutate(record);
      const conflicting=JSON.stringify(record);records.setItem(evidenceKey,conflicting);records.setItem(FUNDING_STORAGE_KEY,pending);
      await assert.rejects(mock.wallet.reconcile(transactionHash),/EVIDENCE_CONFLICT_RETAIN_PENDING/);
      assert.equal(records.getItem(evidenceKey),conflicting);assert.equal(records.getItem(FUNDING_STORAGE_KEY),pending);
      assert.equal(mock.sends().length,1);
    }
  });
  await t.test('equivalent saved evidence accepts hex case and object key order without rewriting its first record',async()=>{
    const records=storage(),mock=await paidEvidenceFixture(records),pending=records.getItem(FUNDING_STORAGE_KEY);
    await mock.wallet.reconcile(transactionHash);const record=JSON.parse(records.getItem(evidenceKey));
    record.evidence.transaction.from=record.evidence.transaction.from.toUpperCase();
    record.evidence.receipt.logs[0].data=record.evidence.receipt.logs[0].data.toUpperCase();
    record.evidence=Object.fromEntries(Object.entries(record.evidence).reverse());
    const reordered=JSON.stringify(record);records.setItem(evidenceKey,reordered);records.setItem(FUNDING_STORAGE_KEY,pending);
    assert.equal((await mock.wallet.reconcile(transactionHash)).status,'VERIFIED_PAID');
    assert.equal(records.getItem(evidenceKey),reordered);assert.equal(mock.wallet.readPending(),null);assert.equal(mock.sends().length,1);
  });
  await t.test('stale watches before or after evidence storage cannot clear pending or publish a completed result',async()=>{
    for(const stage of ['before','after','pending-changed']){
      const records=storage(),get=records.getItem,set=records.setItem,mock=await paidEvidenceFixture(records);
      const pending=records.getItem(FUNDING_STORAGE_KEY);let current=true;
      if(stage==='before'){const inspect=mock.wallet.inspect;mock.wallet.inspect=async(...args)=>{const value=await inspect(...args);current=false;return value;};}
      else records.getItem=key=>{const value=get(key);if(key===evidenceKey&&value!==null){if(stage==='after')current=false;else set(FUNDING_STORAGE_KEY,JSON.stringify({...JSON.parse(pending),intentId:'newer-pending'}));}return value;};
      const watch={pending,isCurrent:()=>current};
      if(stage==='pending-changed')await assert.rejects(mock.wallet.reconcile(transactionHash,watch),/PENDING_CHANGED_RETAIN_LOCK/);
      else assert.equal((await mock.wallet.reconcile(transactionHash,watch)).status,'WATCH_STOPPED');
      assert.equal(get(evidenceKey)!==null,stage!=='before');
      if(stage==='pending-changed')assert.equal(JSON.parse(get(FUNDING_STORAGE_KEY)).intentId,'newer-pending');
      else assert.equal(get(FUNDING_STORAGE_KEY),pending);
      assert.equal(mock.sends().length,1);
    }
  });
  await t.test('archived evidence never replaces fresh canonical checks after a reload',async()=>{
    const records=storage(),mock=await paidEvidenceFixture(records),pending=records.getItem(FUNDING_STORAGE_KEY);
    await mock.wallet.reconcile(transactionHash);const saved=records.getItem(evidenceKey);
    for(const mode of ['pending','wrong-block']){
      records.setItem(FUNDING_STORAGE_KEY,pending);const reads=[];
      const provider={request:args=>{reads.push(args.method);if(mode==='pending'&&args.method==='eth_getTransactionReceipt')return null;
        if(mode==='wrong-block'&&args.method==='eth_getBlockByNumber')return {number:'0x100',hash:id('noncanonical')};return mock.wallet.provider.request(args);}};
      const reloaded=new HumanFundingWallet({provider,storage:records,locks:{request:async(_name,_options,callback)=>callback({})}});
      reloaded.inspect=mock.wallet.inspect;
      assert.equal((await reloaded.reconcile(transactionHash)).status,mode==='pending'?'PENDING':'MISMATCH');
      assert.ok(reads.includes('eth_getTransactionReceipt'));assert.equal(records.getItem(evidenceKey),saved);
      assert.equal(records.getItem(FUNDING_STORAGE_KEY),pending);assert.equal(mock.sends().length,1);
    }
  });

  await t.test("Guanyan matching payment events retain the original pending ID until full reconciliation", async () => {
    const p = buildLifeResourcePlan({ beneficiary: formal.guanyanBeneficiary, amount: "1080000" });
    const mock = mockWallet({ receipt: receipt([
      eventLog(formal.kaios, "Transfer", [formal.bank, p.beneficiary, p.amountWei]),
      eventLog(formal.allocation, "AllocationExecuted", [p.allocationId, p.beneficiary, p.amountWei, formal.mother]),
      eventLog(formal.bank, "ModulePaymentExecuted", [formal.moduleId, p.paymentId, p.beneficiary, p.amountWei]),
    ]) });
    const state = snapshot();
    state.allocation = { beneficiary: p.beneficiary, amount: p.amountWei, purposeHash: p.purposeHash,
      executableAt: "0", executed: false, cancelled: false };
    mock.change(state);
    // Simulate a previously submitted intent from the original wallet adapter.
    await mock.wallet.request(await mock.wallet.prepare(p));
    const originalPending = mock.wallet.readPending();
    state.allocation.executed = true; state.paymentConsumed = true; mock.change(state);
    const result = await mock.wallet.reconcile(transactionHash);
    assert.equal(result.status, "EVIDENCE_INCOMPLETE");
    assert.equal(mock.wallet.storage.getItem(FUNDING_EVIDENCE_PREFIX+transactionHash),null,'Guanyan incomplete evidence never becomes an archived PAID result');
    equalInline(mock.wallet.readPending(), originalPending);
    assert.equal(mock.sends().length, 1);
  });

  await t.test("cap execute confirms only exact event and exact resulting module caps", async () => {
    for (const mode of ["exact", "wrong-event-hash", "wrong-result-cap"]) {
      const logs = [eventLog(formal.governance, "GovernanceProposalExecuted", [plan.cap.proposalId,
        plan.cap.target, mode === "wrong-event-hash" ? id("incorrect cap calldata") : plan.cap.dataHash])];
      const mock = mockWallet({ receipt: receipt(logs) });
      const state = snapshot();
      state.module.perTransactionLimit = "1"; state.module.epochLimit = "1";
      state.allocation = {beneficiary:plan.beneficiary, amount:plan.amountWei, executableAt:"0", purposeHash:plan.purposeHash, executed:false, cancelled:false};
      state.capProposal = { ...absent(), target: plan.cap.target, dataHash: plan.cap.dataHash,
        proposer: formal.mother, approver: formal.jade, executableAt: String(timestamp - 1) };
      mock.change(state);
      const preview = await mock.wallet.prepare(plan);
      assert.equal(preview.step.kind, "CAP_EXECUTE");
      await mock.wallet.request(preview);
      state.capProposal.executed = true;
      state.module.perTransactionLimit = formal.capWei;
      state.module.epochLimit = mode === "wrong-result-cap" ? "1" : formal.capWei;
      mock.change(state);
      const result = await mock.wallet.reconcile(transactionHash);
      assert.equal(result.status, mode === "exact" ? "CONFIRMED" : "MISMATCH");
      assert.notEqual(result.status, "VERIFIED_PAID", "limit adjustment is not a payment");
      assert.equal(mock.wallet.readPending() === null, mode === "exact");
      assert.equal(mock.sends().length, 1);
    }
  });

  await t.test("actual funding controller discards stale prepare success and failure after form changes", async t => {
    const { readFileSync } = await import("node:fs");
    const { runInNewContext } = await import("node:vm");
    const {detectVoiceCapabilities, normalizeVoiceError} = await import('../../core/apps/index.mjs');
    const { buildBankPausePlan, buildSharedCapPlan, deriveSharedCapStep, buildLegacyCapCancelPlan, isLegacyCapCancelPlan, LEGACY_APPROVAL_RECEIPT, walletAccounts, authorizedWalletAccount } = await inlineBankApi();
    const html = readFileSync(new URL("../../K線西遊記/temples/18888/index.html", import.meta.url), "utf8");
    const source = html.match(/<script\b[^>]*id="funding-controller"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    assert.ok(source, "test the real existing inline funding controller");
    assert.ok(source.includes(BANK_CONTROLLER_MARKER));
    const controller = source.split(BANK_CONTROLLER_MARKER)[1].split(BANK_CONTROLLER_END)[0];
    const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
    const mount = async (options = {}) => {
      const nodes = new Map(), providerListeners = new Map(), requests = [], wallets = [], receiptCalls = [], prepareCalls = [], timers = [];
      const state = { account: options.account ?? formal.mother, accounts: options.accounts, chainId: options.chainId ?? 56, pauser: options.pauser ?? false };
      const exposedAccounts = () => state.accounts ?? (state.account ? [state.account] : []);
      const rpc = [], mobileLog = [], storageFixture = storage(), providerEvents = [], connectionTimers = new Set();
      const voiceLog = [], recognitions = [], storageWrites = [];
      const originalStorageSet = storageFixture.setItem.bind(storageFixture);
      storageFixture.setItem = (key, value) => {storageWrites.push({key,value}); originalStorageSet(key,value);};
      const windowEvents = new Map(), documentEvents = new Map();
      let guidedPending = options.guided?.pending ?? null;
      const guided = options.guided;
      const guidedPhases = guided ? new Map(Object.entries(guided.phases ?? {})) : null;
      const guidedSnapshot = (nextPlan, account) => {
        const capConfigured = (guided.cap ?? 'configured') === 'configured', phase = guidedPhases.get(nextPlan.allocationId) ?? guided.phase ?? 'absent';
        const proposal = (candidate, value) => value === 'absent' ? absent() : {
          target:candidate.target, value:'0', dataHash:candidate.dataHash, proposer:formal.mother,
          approver:['approved','created','paid','done'].includes(value) ? formal.jade : zero,
          executableAt:String(guided.eta ?? timestamp - 1), executed:['created','paid','done','configured'].includes(value), cancelled:false,
        };
        return {...snapshot(), account, chainId:state.chainId, identityErrors:[],
          roles:{proposer:account === formal.mother, approver:account === formal.jade, moduleAdmin:true, allocationGovernance:true},
          module:{...snapshot().module, perTransactionLimit:capConfigured ? formal.capWei : '1', epochLimit:capConfigured ? formal.capWei : '1'},
          capProposal:proposal(nextPlan.cap, guided.cap ?? 'configured'),
          ...(nextPlan.type === 'SHARED_CAP' ? {} : {
            allocationProposal:proposal(nextPlan.allocation, phase),
            allocation:['created','paid','done'].includes(phase) ? {beneficiary:nextPlan.beneficiary, amount:nextPlan.amountWei,
              purposeHash:nextPlan.purposeHash, executableAt:'0', executed:['paid','done'].includes(phase), cancelled:false} : snapshot().allocation,
            paymentConsumed:['paid','done'].includes(phase),
          }), ...guided.snapshotOverride};
      };
      if (options.savedTopic) storageFixture.setItem("kaios18888.walletconnect.confirmedTopic.v1", options.savedTopic);
      const node = (name) => {
        if (!nodes.has(name)) {
          const listeners = new Map();
          nodes.set(name, { value: "", checked: false, disabled: false, textContent: "", readOnly: false,
            options: [{ value: "", textContent: "" }], files: [], attrs: {},
            setAttribute(name, value) { this.attrs[name] = String(value); },
            getAttribute(name) { return this.attrs[name] ?? null; },
            removeAttribute(name) { delete this.attrs[name]; },
            focus() { this.focused = true; }, scrollIntoView() { this.scrolled = true; },
            get href() { return this.attrs.href ?? ""; }, set href(value) { this.attrs.href = String(value); },
            addEventListener: (event, handler) => listeners.set(event, handler),
            emit: (event, detail) => listeners.get(event)?.(detail),
             dispatchEvent: (event) => listeners.get(event.type)?.(event),
            replaceChildren(...children) { this.options = children; },
            append(child) { this.options.push(child); } });
        }
        return nodes.get(name);
      };
      node("beneficiary").value = beneficiary; node("amount").value = "1080000"; node("role").value = options.role ?? "mother"; node("mode").value = options.mode ?? "fixed";
      // Match the retained HTML's inert native anchors before the controller boots.
      for (const name of ["native-metamask", "native-okx", "native-okx-app", "native-trust"]) {
        node(name).setAttribute("aria-disabled", "true"); node(name).tabIndex = -1;
      }
      node("okx-route").hidden = true;
      let authorized = !options.needsAuthorization;
      const provider = { request: async ({ method, params }) => {
        rpc.push({ method, params });
        if (method === "eth_requestAccounts") {
          if (options.requestAccountsError) throw Object.assign(Error("Wallet rejected connection"), { code: options.requestAccountsError });
          authorized = true;
        }
        if (method === "eth_accounts" || method === "eth_requestAccounts") return authorized ? exposedAccounts() : [];
        if (method === "eth_chainId") return `0x${state.chainId.toString(16)}`;
        if (method === "wallet_requestPermissions") {
          if (options.permissionsWait) await options.permissionsWait.promise;
          if (options.permissionsError) throw Object.assign(Error("Wallet rejected permissions"), { code: options.permissionsError });
          if (options.reselectAccount) state.account = options.reselectAccount;
          providerListeners.get("accountsChanged")?.([state.account]);
          return [];
        }
        if (method === "wallet_switchEthereumChain") {
          assert.equal(params[0].chainId, "0x38");
          if (options.switchError) throw Object.assign(Error("Wallet rejected chain switch"), { code: options.switchError });
          if (!options.switchNoChange) { state.chainId = 56; providerListeners.get("chainChanged")?.("0x38"); }
          return null;
        }
        throw Error(`Unexpected offline UI provider request: ${method}`);
      }, on: (event, handler) => providerListeners.set(event, handler) };
      if (options.accountsWait) {
        const request = provider.request;
        provider.request = args => {
          if (args.method !== "eth_accounts") return request(args);
          rpc.push(args);
          return options.accountsWait.promise;
        };
      }
      if (options.malformedProviders) provider.providers = { unexpected: true };
      if (options.metaMask) provider.isMetaMask = true;
      const mobileListeners = new Map();
      const mobileSession = (metadata, topic, expired = false) => ({ topic,
        expiry: Math.floor(Date.now() / 1000) + (expired ? -1 : 3600), self: { metadata },
        namespaces: { eip155: { accounts: [`eip155:56:${formal.guanyin}`] } } });
      let mobileMetadata;
      const mobile = {
        async disconnect() {
          mobileLog.push("disconnect");
          if (options.mobileDisconnectError) throw Error("Disconnect failed");
          this.session = null; mobileListeners.get("disconnect")?.();
        },
        async enable() {
          mobileLog.push("enable");
          if (options.mobileReject) throw Object.assign(Error("Rejected by wallet"), { code: 4001 });
          state.account = formal.guanyin; state.chainId = 56; state.pauser = true;
          this.session = mobileSession(mobileMetadata, "new-topic");
          if (options.mobileUnapprovedAccount) this.session.namespaces.eip155.accounts = [`eip155:1:${formal.guanyin}`];
          mobileListeners.get("chainChanged")?.("0x38");
          mobileListeners.get("accountsChanged")?.([state.account]);
          return [state.account];
        },
        request(args) { mobileLog.push(args.method); return provider.request(args); },
        on: (event, handler) => mobileListeners.set(event, handler),
      };
      class FakeWallet {
        constructor({selectedAccount} = {}) { this.selectedAccount = selectedAccount; this.next = null; this.invalidations = 0; this.generation = 0; this.flowType = "FIXED_ALLOCATION"; wallets.push(this); }
        readPending() { return guided ? guidedPending : options.pending ?? null; }
        invalidatePreview() { this.invalidations++; this.generation++; }
        invalidate() { this.invalidatePreview(); }
        async connect() { return [state.account]; }
        async prepare(nextPlan) {
          prepareCalls.push({ plan: nextPlan, wallet: this });
          const wait = this.next; this.next = null;
          if (wait) await wait.promise;
          const pause = nextPlan?.type === "BANK_PAUSE";
          const account = authorizedWalletAccount(exposedAccounts(), this.selectedAccount?.());
          if (!account) throw Error("ACCOUNT_OR_BLOCK_UNKNOWN");
          if (guided) {
            if (guided.onPrepare) await guided.onPrepare(nextPlan);
            const observed = guidedSnapshot(nextPlan, account);
            const step = nextPlan.type === 'SHARED_CAP' ? deriveSharedCapStep(nextPlan, observed) : deriveFundingStep(nextPlan, observed);
            return {plan:nextPlan, account, snapshot:observed, step, generation:this.generation};
          }
          const allowed = options.forceReady ?? (!pause || account.toLowerCase() === formal.guanyin.toLowerCase() && state.pauser && state.chainId === 56);
          return { plan: nextPlan, account,
            snapshot: { account, chainId: state.chainId, codeOk: true, identityErrors: [], paused: false,
              roles: { proposer: account === formal.mother, approver: account === formal.jade, pauser: state.pauser },
              ...options.snapshotOverride },
            step: { ready: allowed, kind: pause ? "BANK_PAUSE" : options.stepKind ?? (nextPlan?.type === "SHARED_CAP" ? "CAP_PROPOSE" : "ALLOCATION_PROPOSE"),
              blockers: allowed ? [] : options.stepBlockers ?? ["GUANYIN_PAUSER_REQUIRED"], proposalId: options.stepProposalId, to: pause ? formal.bank : formal.governance } };
        }
        async request(candidate) {
          requests.push(candidate);
          if (guided) {
            const hash = '0x' + requests.length.toString(16).padStart(64, '0');
            guidedPending = {flowType:this.flowType, plan:candidate.plan, kind:candidate.step.kind, proposalId:candidate.step.proposalId,
              hash, intentId:'mock-' + requests.length, transaction:{from:candidate.account}};
            try { if (guided.onRequest) await guided.onRequest(candidate); }
            catch(error) { if (Number(error.code) === 4001) guidedPending = null; throw error; }
            return {hash,status:'SUBMITTED_UNCONFIRMED',kind:candidate.step.kind};
          }
          if (this.nextSend) await this.nextSend.promise; return { hash: transactionHash };
        }
        async reconcile(hash, watch) { receiptCalls.push({hash, watch}); if (this.nextReceipt) await this.nextReceipt.promise;
          if (guided) {
            if (guided.onReconcile) await guided.onReconcile(hash, this);
            if (watch && !watch.isCurrent()) return {hash,status:'WATCH_STOPPED'};
            const pending = guidedPending;
            const result = guided.results?.shift() ?? (pending.kind === 'PAYOUT' ? 'VERIFIED_PAID' : 'CONFIRMED');
            if (result instanceof Error) throw result;
            if (result === (pending.kind === 'PAYOUT' ? 'VERIFIED_PAID' : 'CONFIRMED')) {
              if (!guided.staleState) {
                if (pending.kind.startsWith('CAP_')) guided.cap = {CAP_PROPOSE:'proposed',CAP_APPROVE:'approved',CAP_EXECUTE:'configured'}[pending.kind];
                else guidedPhases.set(pending.plan.allocationId, {ALLOCATION_PROPOSE:'proposed',ALLOCATION_APPROVE:'approved',ALLOCATION_EXECUTE:'created',PAYOUT:'paid'}[pending.kind]);
              }
              guidedPending = null;
            }
            return {hash:guided.wrongHash ? blockHash : hash,status:result,kind:pending.kind};
          }
          const result = options.receiptResults?.shift();
          if (result instanceof Error) throw result;
          return { hash: transactionHash, status: result ?? (this instanceof FakePauseWallet ? "BANK_PAUSED" : "CONFIRMED") }; }
      }
      class FakePauseWallet extends FakeWallet {
        async prepare() { return super.prepare(buildBankPausePlan()); }
      }
      class FakeCapWallet extends FakeWallet {
        constructor(options) { super(options); this.flowType = "SHARED_CAP"; }
        async prepare(plan = buildSharedCapPlan()) { return super.prepare(plan); }
      }
      class FakeLegacyCancelWallet extends FakeWallet {
        constructor(walletOptions) {
          super(walletOptions);
          this.flowType = "LEGACY_CAP_CANCEL";
          this.pending = options.pending ?? null;
        }
        readPending() { return this.pending; }
        async findExecutionHash() { return options.executionHash; }
        async prepare(plan = buildLegacyCapCancelPlan()) {
          const candidate = await super.prepare(plan);
          if (this.readPending()) {
            candidate.step.ready = false;
            candidate.step.blockers.push("PENDING_INTENT_RECONCILE_FIRST");
          }
          return candidate;
        }
        async request(candidate) {
          const result = await super.request(candidate);
          this.pending = { plan: candidate.plan, kind: candidate.step.kind, hash: result.hash, transaction: { from: candidate.account } };
          return result;
        }
        async reconcile(hash, watch) {
          const result = await super.reconcile(hash, watch);
          if (watch && !watch.isCurrent()) return { status: "WATCH_STOPPED", hash };
          if (!options.receiptResults) return { status: "PENDING", hash };
          if (["CONFIRMED", "LEGACY_CANCELLED"].includes(result.status)) this.pending = null;
          return { ...result, hash };
        }
      }
      const otherProvider = options.lateOkx ? { request() { throw Error("Unexpected fallback provider request"); } } : provider;
      const window = { ethereum: options.okxOnly || options.lateMetaMask ? undefined : otherProvider, okxwallet: options.okxDirect ? provider : options.okxOnly ? { ethereum: provider } : undefined, location: new URL(options.href ?? "http://localhost:8080/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/18888/index.html"),
        localStorage: storageFixture, addEventListener: (event, handler) => windowEvents.set(event, handler), dispatchEvent: event => providerEvents.push(event),
        WalletConnectEthereumProvider: options.mobile ? { async init({ metadata, chains, storageOptions }) {
          mobileLog.push("init");
          assert.equal(chains[0], 56); assert.equal(storageOptions.database, "kaios18888-walletconnect");
          mobileMetadata = metadata;
          if (options.mobileCached) mobile.session = mobileSession(options.mobileForeign ? { ...metadata, url: "https://foreign.example" } : metadata, "cached-topic", options.mobileExpired);
          return mobile;
        } } : undefined };
      const context = { window, isSecureContext:options.secureContext ?? true, document: { getElementById: (id) => node(id.replace(/^funding-/, "")),
        visibilityState: options.visible ? "visible" : undefined,
        addEventListener: (event, handler) => documentEvents.set(event, handler),
        createElement: () => ({ value: "", textContent: "" }), head: { append() { throw Error("No external scripts in offline UI test"); } } },
        navigator: { userAgent: options.userAgent, clipboard: options.clipboard,
          mediaDevices:{getUserMedia(){voiceLog.push('microphone');throw Error('No microphone allowed in offline tests');}},
          ...(options.webLocks === false ? {} : { locks: { request() {} } }) },
        Event: class { constructor(type) { this.type = type; } },
        CustomEvent: class { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } }, URL,
        setTimeout: (callback, delay) => {
          if (delay === 60000 || delay === 30000) connectionTimers.add(callback);
          else if (delay === 4000 && (options.mode === "legacy-cancel" && !options.legacyManualTimers || guided && !guided.manualTimers)) queueMicrotask(callback);
          else timers.push(callback);
          return callback;
        },
        clearTimeout: callback => connectionTimers.delete(callback),
        Option: class { constructor(textContent, value) { this.textContent = textContent; this.value = value; } },
        FUNDING_FORMAL: formal, buildLifeResourcePlan, buildBankPausePlan, buildSharedCapPlan, buildLegacyCapCancelPlan, isLegacyCapCancelPlan, LEGACY_APPROVAL_RECEIPT,
        walletAccounts, authorizedWalletAccount, SharedCapWallet: FakeCapWallet, LegacyCapCancelWallet: FakeLegacyCancelWallet,
        HumanFundingWallet: FakeWallet, HumanBankPauseWallet: FakePauseWallet, detectVoiceCapabilities, normalizeVoiceError };
      const injectRecognition = (settings = {}) => {
        class Recognition {
          constructor(){recognitions.push(this);}
          start(){voiceLog.push('start');assert.equal(this.processLocally,true);assert.equal(this.lang,'zh-TW');this.onstart?.();}
          abort(){voiceLog.push('abort');this.onend?.();}
        }
        if(settings.localProperty!==false) Recognition.prototype.processLocally=false;
        if(settings.api!==false) Recognition.available=options=>{
          voiceLog.push({available:options});
          if(settings.wait) return settings.wait.promise;
          if(settings.error) throw settings.error;
          return Promise.resolve(settings.availability ?? 'available');
        };
        Recognition.install=()=>{voiceLog.push('install');throw Error('Language installation not authorized');};
        context.SpeechRecognition=Recognition;
      };
      if(options.voice) injectRecognition(options.voice);
      runInNewContext(controller + "\nglobalThis.uiProbe = { preview: () => preview, setCases: (cases) => { importedCases = cases; }, watchReceipt: () => watchFundingReceipt(wallet) };", context);
      if (options.lateOkx) window.okxwallet = { ethereum: provider };
      if (!options.skipConnect) {
        node("wallet").value = "0";
        await node("connect").onclick();
      }
      const setVisibility = visibility => {
        context.document.visibilityState = visibility;
        documentEvents.get("visibilitychange")();
      };
      const injectMetaMask = (announce = false) => {
        provider.isMetaMask = true;
        window.ethereum = provider;
        if (announce) windowEvents.get("ethereum#initialized")?.();
      };
      return { node, wallets, requests, state, providerListeners, receiptCalls, prepareCalls, timers, rpc, mobileLog, providerEvents, storageFixture, connectionTimers,
        injectMetaMask, setVisibility, pageShow: () => windowEvents.get("pageshow")(), pageHide: () => windowEvents.get("pagehide")(),
        mobile, mobileListeners, probe: context.uiProbe, guidedPhases, pending:() => guidedPending,
        voiceLog, recognitions, injectRecognition, storageWrites, allText:()=>[...nodes.values()].map(node=>node.textContent).join('\n') };
    };
    for (const failure of [false, true]) {
      const ui = await mount(), wait = deferred();
      const otherPlan = buildLifeResourcePlan({ beneficiary: alternate, amount: "2" });
      ui.probe.setCases([{ ...otherPlan, name: "offline fixture B" }]);
      ui.wallets[0].next = wait;
      const pending = ui.node("prepare").onclick();
      ui.node("case").value = "0"; ui.node("case").emit("change");
      ui.node("status").textContent = "new case B state";
      if (failure) wait.reject(Error("stale case A failure")); else wait.resolve();
      await pending;
      assert.equal(ui.node("beneficiary").value, alternate);
      assert.equal(ui.node("amount").value, "2");
      assert.equal(ui.probe.preview(), null, "late A must not restore a preview after selecting B");
      assert.equal(ui.node("send").disabled, true);
      assert.equal(ui.node("status").textContent, "new case B state", "late success/failure must not replace newer form status");
      ui.node("ack").checked = true; ui.node("ack").emit("change");
      await ui.node("send").onclick();
      assert.equal(ui.requests.length, 0);
    }
    for (const change of ["amount", "wallet", "accountsChanged", "chainChanged"]) {
      const ui = await mount(), wait = deferred(); ui.wallets[0].next = wait;
      const pending = ui.node("prepare").onclick();
      if (change === "amount") { ui.node("amount").value = "3"; ui.node("amount").emit("input"); }
      else if (change === "wallet") { ui.node("wallet").value = "1"; ui.node("wallet").emit("input"); }
      else ui.providerListeners.get(change)?.(change === "chainChanged" ? "0x1" : [formal.jade]);
      wait.resolve(); await pending;
      assert.equal(ui.probe.preview(), null, `${change} invalidates an in-flight preview`);
      assert.equal(ui.node("send").disabled, true);
      assert.equal(ui.requests.length, 0);
    }
    const ui = await mount();
    await ui.node("prepare").onclick();
    ui.node("amount").value = "4"; // Deliberately bypass input events to test the send-time canonical guard.
    ui.node("ack").checked = true; ui.node("ack").emit("change");
    await ui.node("send").onclick();
    assert.equal(ui.requests.length, 0, "send must compare the current canonical form, not only a stored ready flag");
    const fresh = await mount();
    await fresh.node("prepare").onclick();
    fresh.node("ack").checked = true; fresh.node("ack").emit("change");
    await fresh.node("send").onclick();
    assert.equal(fresh.requests.length, 1, "a fresh unchanged acknowledged form still reaches the explicit mock wallet method");
    assert.equal(fresh.requests[0].plan.allocationId, plan.allocationId);

    for (const change of ["accountsChanged", "chainChanged", "role"]) {
      const ui = await mount(); await ui.node("prepare").onclick();
      ui.node("ack").checked = true; ui.node("ack").emit("change");
      assert.equal(ui.node("send").disabled, false);
      if (change === "role") { ui.node("role").value = "jade"; ui.node("role").emit("change"); }
      else ui.providerListeners.get(change)?.(change === "chainChanged" ? "0x1" : [formal.jade]);
      assert.equal(ui.node("ack").checked, false, `${change} clears a previously checked acknowledgment`);
      assert.equal(ui.probe.preview(), null, change); assert.equal(ui.node("send").disabled, true, change);
      await ui.node("send").onclick(); assert.equal(ui.requests.length, 0, change);
    }
    for (const role of ["mother", "jade"]) {
      const cap = await mount({ account: formal[role] });
      cap.node("role").value = role; cap.node("role").emit("change");
      cap.node("beneficiary").value = ""; cap.node("amount").value = "";
      cap.node("ack").checked = true;
      cap.node("mode").value = "cap"; cap.node("mode").emit("change");
      assert.equal(cap.node("ack").checked, false); assert.equal(cap.node("send").disabled, true);
      await cap.node("prepare").onclick();
      equalInline(cap.probe.preview().plan, buildSharedCapPlan());
      assert.equal(cap.node("beneficiary").disabled, true); assert.equal(cap.node("file").disabled, true);
      assert.doesNotMatch(cap.node("summary").textContent, /undefined|本案：|已付款|入帳/);
      assert.equal(cap.requests.length, 0, "role/mode/prepare never requests a transaction");
      cap.node("ack").checked = true; cap.node("ack").emit("change");
      assert.equal(cap.node("send").disabled, false, "the reviewed shared-cap step can be handed to its holder");
      assert.equal(JSON.parse(cap.node("preview").textContent).step.ready, true);
      assert.equal(cap.requests.length, 0, "review and acknowledgment do not send a transaction");
      cap.node("mode").value = "fixed"; cap.node("mode").emit("change");
      assert.equal(cap.probe.preview(), null); assert.equal(cap.node("ack").checked, false);
      assert.equal(cap.node("beneficiary").disabled, false);
      assert.equal(cap.wallets.length, 2, "switching back reuses the original fixed wallet session");
      await cap.node("send").onclick(); assert.equal(cap.requests.length, 0);
      cap.node("mode").value = "cap"; cap.node("mode").emit("change");
      const wait = deferred(); cap.wallets[1].next = wait;
      const preparing = cap.node("prepare").onclick();
      cap.node("mode").value = "fixed"; cap.node("mode").emit("change");
      wait.resolve(); await preparing;
      assert.equal(cap.probe.preview(), null, "late cap response cannot replace the fixed form");
      cap.node("role").value = "guanyin"; cap.node("role").emit("change");
      cap.node("mode").value = "cap"; cap.node("mode").emit("change");
      await cap.node("prepare").onclick();
      assert.equal(cap.probe.preview(), null, "Mother/Jade cannot read Guanyin authority as their own");
      assert.equal(cap.node("prepare").disabled, true);
      assert.equal(cap.node("send").disabled, true, "Mother/Jade cannot acquire Guanyin authority by choosing pause");
      await cap.node("draft").onclick();
      assert.equal(JSON.parse(cap.node("preview").textContent).type, "BANK_PAUSE", "Guanyin offline parameters stay separate from cap mode");
    }

    await t.test("shared cap progress explains approved chain ETA and invalidates when the account changes", async () => {
      const ui = await mount({ mode: "cap", role: "jade", account: formal.jade,
        stepKind: "WAIT_ETA", forceReady: false, stepBlockers: [],
        snapshotOverride: { timestamp: "1794381780", blockNumber: "0x7ec5951", capProposal: { executableAt: "1794383466" } } });
      assert.equal(ui.node("progress").hidden, false);
      assert.match(ui.node("progress-title").textContent, /等待重新核對/);
      await ui.node("progress-next").onclick();
      assert.match(ui.node("progress-title").textContent, /玉帝已批准.*等待到期/);
      assert.equal(ui.node("progress-step-1").attrs["data-state"], "done");
      assert.equal(ui.node("progress-step-2").attrs["aria-current"], "step");
      assert.match(ui.node("progress-eta").textContent, /2026.*11.*11.*15:51:06.*台灣/);
      assert.match(ui.node("progress-detail").textContent, /到期後.*更新鏈上進度.*不用重新批准/);
      assert.match(ui.node("progress-evidence").textContent, /0x7ec5951.*15:23:00/);
      assert.equal(ui.node("send").disabled, true);
      assert.equal(ui.requests.length, 0);
      ui.providerListeners.get("accountsChanged")([formal.mother]);
      assert.equal(ui.node("progress-step-1").attrs["data-state"], "unknown");
      assert.equal(ui.node("progress-step-2").attrs["aria-current"], undefined);
      assert.equal(ui.node("progress-eta").textContent, "");
      assert.equal(ui.node("send").disabled, true);
      assert.equal(ui.requests.length, 0);
    });
    await t.test("cap progress does not advance on a submitted hash or a governance receipt", async () => {
      const ui = await mount({ mode: "cap", role: "jade", account: formal.jade, stepKind: "CAP_EXECUTE",
        snapshotOverride: { timestamp: "1794383466", capProposal: { executableAt: "1794383466" } } });
      await ui.node("progress-next").onclick();
      assert.match(ui.node("progress-title").textContent, /本次讀查.*已批准且到期/);
      assert.match(ui.node("progress-detail").textContent, /送出前會再次核對.*超過兩分鐘請更新/);
      assert.equal(ui.node("progress-step-3").attrs["data-state"], "waiting");
      assert.equal(ui.node("send").disabled, true, "a progress card never supplies acknowledgment");
      assert.equal(ui.requests.length, 0);
      ui.node("ack").checked = true; ui.node("ack").emit("change");
      await ui.node("send").onclick();
      assert.equal(ui.requests.length, 1);
      assert.equal(ui.node("progress-step-3").attrs["data-state"], "unknown", "hash is not an effect");
      await ui.node("receipt").onclick();
      assert.match(ui.node("progress-detail").textContent, /回執已確認.*更新鏈上進度/);
      assert.equal(ui.node("progress-step-3").attrs["data-state"], "unknown", "read actual module limits again");
      assert.equal(ui.requests.length, 1, "receipt completion never sends the next transaction");
    });
    await t.test("observed shared limits guide five original cases without claiming payment", async () => {
      const ui = await mount({ mode: "cap", role: "jade", account: formal.jade,
        stepKind: "CAP_ALREADY_CONFIGURED", forceReady: false, stepBlockers: [] });
      await ui.node("progress-next").onclick();
      assert.match(ui.node("progress-title").textContent, /限額已生效/);
      assert.match(ui.node("progress-detail").textContent, /固定配額.*五筆.*不代表已付款/);
      assert.match(ui.node("progress-step-0").textContent, /本次無需此步/);
      assert.equal(ui.node("progress-step-3").attrs["data-state"], "done");
      assert.equal(ui.node("send").disabled, true);
      assert.equal(ui.requests.length, 0);
      ui.node("mode").value = "fixed"; ui.node("mode").emit("change");
      assert.equal(ui.node("progress").hidden, true);
      assert.equal(ui.requests.length, 0);
    });
    await t.test("unverified role or runtime never displays completed cap progress", async () => {
      for (const snapshotOverride of [{ codeOk: false }, { identityErrors: ["RUNTIME_PIN_MISMATCH"] }]) {
        const ui = await mount({ mode: "cap", role: "jade", account: formal.jade,
          stepKind: "CAP_ALREADY_CONFIGURED", snapshotOverride });
        await ui.node("progress-next").onclick();
        assert.equal(ui.node("progress-step-3").attrs["data-state"], "unknown");
        assert.doesNotMatch(ui.node("progress-title").textContent, /已生效/);
        assert.equal(ui.node("send").disabled, true);
        assert.equal(ui.requests.length, 0);
      }
    });

    await t.test("one click loads and locks the original five cases with no file or transaction", async () => {
      const ui = await mount({ mode:"cap" });
      await ui.node("load-five").onclick();
      assert.equal(ui.node("mode").value, "fixed");
      assert.equal(ui.node("case").value, "0");
      assert.equal(ui.node("case").options.length, 6);
      assert.equal(ui.node("beneficiary").value, "0x60Ed5A562642cbC303D720507a37170116707259");
      assert.equal(ui.node("amount").value, "1080000");
      assert.equal(ui.node("beneficiary").readOnly, true);
      assert.equal(ui.node("amount").readOnly, true);
      const seen = new Set();
      for (let index=0; index<5; index++) {
        ui.node("case").value=String(index); ui.node("case").emit("change");
        await ui.node("progress-next").onclick();
        const p=ui.probe.preview().plan;
        assert.equal(p.amountKaios,"1080000"); seen.add(p.allocationId);
        assert.equal(ui.node("progress").hidden,false);
        assert.match(ui.node("progress-detail").textContent,/與調額並行/);
      }
      assert.equal(seen.size,5);
      assert.equal(ui.requests.length,0);
      assert.match(ui.node("case").options.map(o=>o.textContent).join(" "),/高翠蘭.*知蘭.*豬八戒.*白寧.*澄序/);
    });

    await t.test('role shortcuts change the sole original selection without changing the wallet account or sending', async () => {
      const pending = {flowType:'FIXED_ALLOCATION',kind:'ALLOCATION_APPROVE',hash:transactionHash,
        transaction:{from:formal.jade},plan:buildLifeResourcePlan({beneficiary:'0x60Ed5A562642cbC303D720507a37170116707259',amount:'1080000'})};
      const ui = await mount({role:'jade',account:formal.jade,pending,stepKind:'ALLOCATION_APPROVE'});
      const originalAccounts = ui.rpc.filter(call=>/requestAccounts|requestPermissions|switchEthereumChain/.test(call.method)).length;
      for (const role of ['mother','guanyin','jade']) {
        ui.node('switch-role-'+role).onclick(); await new Promise(resolve=>setImmediate(resolve));
        assert.equal(ui.node('role').value,role);
        assert.equal(ui.node('switch-role-'+role).getAttribute('aria-pressed'),'true');
        assert.equal(ui.state.account,formal.jade); assert.equal(ui.wallets.at(-1).readPending(),pending);
        assert.equal(ui.node('ack').checked,false); assert.equal(ui.node('send').disabled,true);
      }
      assert.equal(ui.rpc.filter(call=>/requestAccounts|requestPermissions|switchEthereumChain/.test(call.method)).length,originalAccounts);
      assert.equal(ui.requests.length,0);
    });
    await t.test('previous and next original cases preserve the five IDs, operator and selected case on reload', async () => {
      const ui = await mount({role:'jade',account:formal.jade,stepKind:'ALLOCATION_APPROVE'});
      await ui.node('load-five').onclick();
      const options = ui.node('case').options.map(option=>({value:option.value,text:option.textContent}));
      assert.equal(ui.node('case-prev').disabled,true); assert.equal(ui.node('case-next').disabled,false);
      for (let index=1;index<5;index++) {
        await ui.node('prepare').onclick(); ui.node('ack').checked=true; ui.node('ack').emit('change');
        assert.equal(ui.node('ack').checked,true);
        ui.node('case-next').onclick();
        assert.equal(ui.node('case').value,String(index)); assert.equal(ui.node('role').value,'jade');
        assert.equal(ui.node('ack').checked,false); assert.equal(ui.node('send').disabled,true);
        assert.equal(ui.node('beneficiary').readOnly,true); assert.equal(ui.node('amount').value,'1080000');
        await ui.node('prepare').onclick();
        assert.equal(ui.probe.preview().plan.beneficiary.toLowerCase(),ui.node('beneficiary').value.toLowerCase());
        assert.match(ui.node('selection-status').textContent,new RegExp(`（${index+1}/5）`));
      }
      assert.equal(ui.node('case-next').disabled,true); ui.node('case-next').onclick();
      assert.equal(ui.node('case').value,'4','last case never wraps to the first or empty draft');
      ui.node('case-prev').onclick(); assert.equal(ui.node('case').value,'3');
      await ui.node('load-five').onclick(); assert.equal(ui.node('case').value,'3','reloading does not reset to GaoCuilan');
      assert.deepEqual(ui.node('case').options.map(option=>({value:option.value,text:option.textContent})),options);
      assert.equal(ui.requests.length,0);
    });
    await t.test('case and role shortcuts preserve an in-flight wallet request and never release its busy state', async () => {
      const wait=deferred();
      const ui=await mount({role:'jade',account:formal.jade,guided:{phase:'proposed',onRequest:()=>wait.promise}});
      await ui.node('load-five').onclick(); await ui.node('prepare').onclick();
      ui.node('ack').checked=true;ui.node('ack').emit('change');
      const sending=ui.node('send').onclick(); await new Promise(resolve=>setImmediate(resolve));
      const pending=ui.pending();assert.ok(pending);assert.equal(ui.requests.length,1);
      ui.node('case-next').onclick();ui.node('switch-role-mother').onclick();
      assert.equal(ui.node('case').value,'1');assert.equal(ui.node('role').value,'mother');
      assert.equal(ui.node('account').disabled,true);assert.equal(ui.pending(),pending);
      assert.match(ui.node('selection-status').textContent,/原請求仍在處理/);
      await ui.node('send').onclick();assert.equal(ui.requests.length,1);
      wait.resolve();await sending;await new Promise(resolve=>setImmediate(resolve));
      assert.equal(ui.pending(),pending);assert.equal(ui.requests.length,1);
      assert.equal(ui.node('ack').checked,false);assert.equal(ui.node('send').disabled,true);
      assert.equal(ui.node('case').value,'1');assert.equal(ui.node('role').value,'mother');
    });
    await t.test('case selection guidance focuses existing controls without changing a non-fixed flow or loading cases', async () => {
      const ui=await mount({mode:'cap'});
      ui.node('case-select').onclick();
      assert.equal(ui.node('advanced').open,true);assert.equal(ui.node('mode').focused,true);
      assert.equal(ui.node('mode').value,'cap');assert.equal(ui.node('case-prev').disabled,true);assert.equal(ui.node('case-next').disabled,true);
      ui.node('mode').value='fixed';ui.node('mode').emit('change');ui.node('case-select').onclick();
      assert.equal(ui.node('load-five').focused,true);assert.equal(ui.node('case').value,'');
      await ui.node('load-five').onclick();ui.node('case-select').onclick();
      assert.equal(ui.node('case').focused,true);assert.equal(ui.node('case').scrolled,true);
      ui.node('switch-role-guanyin').onclick();ui.node('case-select').onclick();
      assert.equal(ui.node('role').value,'guanyin');assert.equal(ui.node('role').focused,true);
      assert.match(ui.node('status').textContent,/先選王母或玉帝/);
      assert.equal(ui.node('case-prev').disabled,true);assert.equal(ui.node('case-next').disabled,true);
      assert.equal(ui.requests.length,0);
    });

    await t.test("a created original case waiting for the shared cap shows the cap ETA, not its earlier case ETA", async () => {
      const ui = await mount({mode:"fixed", role:"jade", account:formal.jade, stepKind:"WAIT_ETA", forceReady:false, stepBlockers:[],
        stepProposalId:buildSharedCapPlan().cap.proposalId, snapshotOverride:{capProposal:{executableAt:"1794383466"}, allocationProposal:{executableAt:"1700000000",executed:true}}});
      await ui.node("load-five").onclick();
      await ui.node("progress-next").onclick();
      assert.match(ui.node("progress-title").textContent,/高翠蘭.*配額已建立.*共享調額/);
      assert.match(ui.node("progress-eta").textContent,/2026.*15:51:06/);
      assert.doesNotMatch(ui.node("progress-eta").textContent,/2023/);
      assert.match(ui.node("progress-detail").textContent,/切換.*共享一千萬調額.*不用重提或重批/);
      assert.equal(ui.node("send").disabled,true); assert.equal(ui.requests.length,0);
    });
    await t.test("a saved case A receipt cannot advance the selected case B", async () => {
      const savedPlan=buildLifeResourcePlan({beneficiary:"0x60Ed5A562642cbC303D720507a37170116707259",amount:"1080000"});
      const ui=await mount({mode:"fixed",pending:{flowType:"FIXED_ALLOCATION",kind:"PAYOUT",hash:transactionHash,transaction:{from:formal.mother},plan:savedPlan},receiptResults:["VERIFIED_PAID"]});
      await ui.node("load-five").onclick();
      ui.node("case").value="1"; ui.node("case").emit("change");
      await ui.probe.watchReceipt();
      assert.equal(ui.receiptCalls.length,0,"automatic checks stay with the selected original case");
      await ui.node("receipt").onclick();
      assert.match(ui.node("progress-detail").textContent,/高翠蘭.*付款回執核對通過.*與目前選案不同/);
      assert.match(ui.node("summary").textContent,/原案「高翠蘭」/);
      assert.equal(JSON.parse(ui.node("preview").textContent).receiptAllocationId,savedPlan.allocationId);
      assert.match(ui.node("progress-title").textContent,/知蘭.*等待重新核對/);
      assert.equal(ui.node("progress-step-3").attrs["data-state"],"unknown");
      assert.equal(ui.requests.length,0);
    });

    for (const mode of ["cap", "fixed"]) {
      for (const [stepKind, role] of [["CAP_PROPOSE", "mother"], ["CAP_APPROVE", "jade"], ["CAP_EXECUTE", "jade"]]) {
        const ui = await mount({ stepKind, account: formal[role] });
        ui.node("role").value = role; ui.node("role").emit("change");
        ui.node("mode").value = mode; ui.node("mode").emit("change");
        await ui.node("prepare").onclick();
        const shown = JSON.parse(ui.node("preview").textContent);
        assert.equal(shown.step.kind, stepKind);
        const sharedCap = mode === "cap";
        assert.equal(shown.step.ready, sharedCap);
        assert.equal(shown.review?.reason, sharedCap ? undefined : "BANK_COMMITMENTS_NOT_VERIFIED");
        ui.node("ack").checked = true; ui.node("ack").emit("change");
        assert.equal(ui.node("send").disabled, !sharedCap);
        await ui.node("send").onclick();
        assert.equal(ui.requests.length, sharedCap ? 1 : 0, [mode, stepKind].join("/"));
        if (sharedCap) {
          assert.equal(ui.requests[0].plan.type, "SHARED_CAP");
          assert.equal(ui.requests[0].step.kind, stepKind);
        }
        await ui.node("receipt").onclick();
        assert.match(ui.node("summary").textContent, /治理步驟已核對/);
      }
    }
    await t.test('Guanyan shortcut loads one canonical locked case without a file or wallet authority', async () => {
      const ui = await mount({mode:'cap', needsAuthorization:true, skipConnect:true});
      await ui.node('load-guanyan').onclick();
      assert.equal(ui.node('mode').value,'fixed');
      assert.equal(ui.node('case').options.length,2,'Guanyan is separate from the five original cases');
      assert.match(ui.node('case').options[1].textContent,/觀衍/);
      assert.equal(ui.node('beneficiary').value.toLowerCase(),formal.guanyanBeneficiary);
      assert.equal(ui.node('amount').value,'1080000');
      for (const field of ['beneficiary','amount']) assert.equal(ui.node(field).readOnly,true);
      assert.equal(ui.node('advanced').open,true);
      assert.equal(ui.node('progress').hidden,false);
      assert.match(ui.node('progress-title').textContent,/觀衍.*1080000/);
      assert.equal(ui.node('send').disabled,true);
      assert.equal(ui.requests.length,0);
      assert.equal(ui.rpc.some(call=>/requestAccounts|requestPermissions|switchEthereumChain|sendTransaction|sign/.test(call.method)),false);
      await ui.node('load-five').onclick();
      assert.equal(ui.node('case').options.length,6,'returning to the original five does not add a sixth payee');
      assert.doesNotMatch(ui.node('case').options.map(row=>row.textContent).join(' '),/觀衍/);
    });
    await t.test('Guanyan shortcut cannot enable sending even when the original stage is otherwise ready', async () => {
      const ui = await mount();
      await ui.node('load-guanyan').onclick();
      await new Promise(resolve=>setImmediate(resolve));
      await ui.node('prepare').onclick();
      const shown=JSON.parse(ui.node('preview').textContent);
      assert.equal(shown.plan.allocationId,buildLifeResourcePlan({beneficiary:formal.guanyanBeneficiary,amount:'1080000'}).allocationId);
      assert.equal(shown.review.reason,'GUANYAN_RECONCILIATION_NOT_VERIFIED');
      assert.match(ui.node('progress-detail').textContent,/觀衍案尚缺/);
      ui.node('ack').checked=true;ui.node('ack').emit('change');
      assert.equal(ui.node('send').disabled,true);
      await ui.node('send').onclick();
      assert.equal(ui.requests.length,0);
      ui.node('switch-role-guanyin').onclick();
      assert.equal(ui.node('load-guanyan').disabled,true);
      await ui.node('load-guanyan').onclick();
      assert.equal(ui.node('role').value,'guanyin');
      assert.equal(ui.requests.length,0);
    });
    for (const amount of ["1070000", "1080000"]) {
      const ui = await mount();
      ui.node("beneficiary").value = formal.guanyanBeneficiary; ui.node("amount").value = amount;
      await ui.node("prepare").onclick();
      if (amount === "1070000") {
        assert.equal(ui.probe.preview(), null);
        assert.match(ui.node("status").textContent, /107 萬草案已作廢/);
      } else {
        assert.equal(JSON.parse(ui.node("preview").textContent).review.reason, "GUANYAN_RECONCILIATION_NOT_VERIFIED");
      }
      ui.node("ack").checked = true; ui.node("ack").emit("change");
      assert.equal(ui.node("send").disabled, true);
      await ui.node("send").onclick(); assert.equal(ui.requests.length, 0);
    }

    const pendingCap = {flowType:"SHARED_CAP", kind:"CAP_PROPOSE", hash:transactionHash,
      transaction:{from:formal.mother}, plan:buildSharedCapPlan()};
    const tick = async ui => {
      assert.ok(ui.timers.length > 0);
      ui.timers.shift()();
      await new Promise(resolve => setImmediate(resolve));
    };
    const wait = await mount({mode:"cap", pending:pendingCap, receiptResults:["PENDING", "CONFIRMED"]});
    assert.deepEqual(wait.receiptCalls.map(c => c.hash), [transactionHash]);
    assert.equal(wait.receiptCalls[0].watch.pending, JSON.stringify(pendingCap));
    wait.node("txhash").value = blockHash;
    await tick(wait);
    assert.deepEqual(wait.receiptCalls.map(c => c.hash), [transactionHash, transactionHash], "auto-read ignores manually entered hashes");
    assert.match(wait.node("summary").textContent, /治理步驟已核對/);
    assert.equal(wait.requests.length, 0);
    const exhausted = await mount({mode:"cap", pending:pendingCap, receiptResults:Array(4).fill("PENDING")});
    for (let i=0;i<3;i++) await tick(exhausted);
    assert.equal(exhausted.receiptCalls.length, 4);
    assert.equal(exhausted.timers.length, 0);
    assert.match(exhausted.node("summary").textContent, /尚未確認/);
    for (const result of ["MISMATCH", "REVERTED", "EVIDENCE_INCOMPLETE", Error("offline read error")]) {
      const ui = await mount({mode:"cap", pending:pendingCap, receiptResults:[result]});
      assert.equal(ui.receiptCalls.length, 1);
      assert.equal(ui.timers.length, 0, "only PENDING retries");
      assert.equal(ui.requests.length, 0);
    }
    for (const options of [
      {mode:"cap", pending:{...pendingCap, hash:undefined}},
      {mode:"fixed", pending:pendingCap},
      {mode:"cap", account:formal.jade, role:"jade", pending:pendingCap},
    ]) assert.equal((await mount(options)).receiptCalls.length, 0);
    const stale = await mount({mode:"cap", pending:pendingCap, receiptResults:["PENDING", "CONFIRMED"]});
    stale.providerListeners.get("accountsChanged")([formal.jade]);
    await tick(stale);
    assert.equal(stale.receiptCalls.length, 1);
    assert.equal(stale.requests.length, 0);
    assert.match(stale.node("status").textContent, /帳戶已變更/);

    const unprivileged = await mount({ forceReady: true });
    unprivileged.node("role").value = "guanyin"; unprivileged.node("role").emit("change");
    await unprivileged.node("prepare").onclick();
    unprivileged.node("ack").checked = true; unprivileged.node("ack").emit("change");
    assert.equal(unprivileged.node("send").disabled, true, "choosing Guanyin cannot grant its account or pauser role");
    await unprivileged.node("send").onclick(); assert.equal(unprivileged.requests.length, 0);
    for (const snapshotOverride of [{ codeOk: false }, { identityErrors: ["BANK_RUNTIME_PIN_UNKNOWN"] },
      { identityErrors: null }, { chainId: 1 }, { roles: { pauser: false } }, { account: formal.mother }]) {
      const ui = await mount({ account: formal.guanyin, pauser: true, forceReady: true, snapshotOverride });
      ui.node("role").value = "guanyin"; ui.node("role").emit("change"); await ui.node("prepare").onclick();
      ui.node("ack").checked = true; ui.node("ack").emit("change");
      assert.equal(ui.node("send").disabled, true, JSON.stringify(snapshotOverride));
      await ui.node("send").onclick(); assert.equal(ui.requests.length, 0, JSON.stringify(snapshotOverride));
    }

    const multiple = await mount({ okxOnly: true, role: "guanyin", accounts: [alternate, formal.guanyin], pauser: true });
    assert.equal(multiple.node("account").value, alternate);
    multiple.node("account").value = formal.guanyin; multiple.node("account").emit("change");
    await multiple.node("prepare").onclick();
    assert.equal(JSON.parse(multiple.node("preview").textContent).unsignedTransaction.from.toLowerCase(), formal.guanyin.toLowerCase());
    multiple.state.accounts = [alternate];
    multiple.providerListeners.get("accountsChanged")?.([alternate]);
    assert.equal(multiple.node("account").value, "", "removal never silently changes the selected account");
    await multiple.node("prepare").onclick();
    assert.equal(multiple.node("send").disabled, true); assert.equal(multiple.requests.length, 0);

    const manualReceiptPending = () => ({flowType:'FIXED_ALLOCATION', kind:'ALLOCATION_APPROVE', hash:transactionHash,
      transaction:{from:formal.jade}, plan:buildLifeResourcePlan({beneficiary:'0x60Ed5A562642cbC303D720507a37170116707259', amount:'1080000'})});
    await t.test('manual receipt: a stalled RPC releases controls at the original deadline and late results retain pending', async () => {
      const pending = manualReceiptPending(), wait = deferred();
      const ui = await mount({mode:'fixed', role:'jade', account:formal.jade, guided:{pending}});
      ui.wallets.at(-1).nextReceipt = wait;
      const running = ui.node('receipt').onclick();
      assert.equal(ui.node('account').disabled, true);
      assert.equal(ui.node('load-five').disabled, true);
      assert.equal(ui.receiptCalls.length, 1);
      const watch = ui.receiptCalls[0].watch;
      assert.equal(watch.pending, JSON.stringify(pending)); assert.equal(watch.isCurrent(), true);
      assert.equal(ui.connectionTimers.size, 1);
      [...ui.connectionTimers][0](); await running;
      assert.equal(ui.connectionTimers.size, 0);
      assert.equal(ui.node('account').disabled, false);
      assert.equal(ui.node('load-five').disabled, false);
      assert.equal(ui.node('prepare').disabled, false);
      assert.equal(ui.pending(), pending); assert.equal(watch.isCurrent(), false);
      assert.match(ui.node('status').textContent, /逾時/);
      const status = ui.node('status').textContent, preview = ui.node('preview').textContent;
      wait.resolve(); await new Promise(resolve => setImmediate(resolve));
      assert.equal(ui.pending(), pending, 'a late confirmed read cannot release the original intent');
      assert.equal(ui.node('status').textContent, status); assert.equal(ui.node('preview').textContent, preview);
      assert.equal(ui.requests.length, 0); assert.equal(ui.receiptCalls.length, 1);
    });
    await t.test('manual receipt: changing the selected case or operation role invalidates a delayed read', async () => {
      for (const change of ['case','role']) {
        const pending = manualReceiptPending(), wait = deferred();
        const ui = await mount({mode:'fixed', role:'jade', account:formal.jade, guided:{pending}});
        ui.wallets.at(-1).nextReceipt = wait;
        const running = ui.node('receipt').onclick();
        if (change === 'case') {
          ui.probe.setCases([{name:'知蘭',beneficiary:'0x9B72FA6A8827ccE211239B0b0E739c98851D1B78',amountKaios:'1080000',
            allocationId:'0xbb183e13332a2594ffdf45b0501f4a26561378e167450b9de19ebf70cdd9f3c7'}]);
          ui.node('case').value = '0'; ui.node('case').emit('change');
        } else { ui.node('role').value = 'mother'; ui.node('role').emit('change'); }
        const selected = ui.node(change).value;
        assert.equal(ui.receiptCalls[0].watch.isCurrent(), false, change);
        wait.resolve(); await running; await new Promise(resolve => setImmediate(resolve));
        assert.equal(ui.pending(), pending, change);
        assert.equal(ui.node(change).value, selected); assert.equal(ui.node('send').disabled, true);
        assert.doesNotMatch(ui.node('summary').textContent, /本次治理步驟已核對/);
        assert.equal(ui.connectionTimers.size, 0); assert.equal(ui.requests.length, 0);
      }
    });
    await t.test('manual receipt: a current confirmed read clears only the original pending without sending', async () => {
      const pending = manualReceiptPending();
      const ui = await mount({mode:'fixed', role:'jade', account:formal.jade, guided:{pending}});
      await ui.node('receipt').onclick();
      assert.equal(ui.receiptCalls.length, 1);
      assert.equal(ui.receiptCalls[0].watch.pending, JSON.stringify(pending));
      assert.equal(ui.pending(), null); assert.equal(ui.connectionTimers.size, 0);
      assert.match(ui.node('summary').textContent, /本次治理步驟已核對/);
      assert.equal(ui.node('account').disabled, false); assert.equal(ui.requests.length, 0);
    });

    const delayedRead = await mount(), readWait = deferred();
    delayedRead.wallets[0].next = readWait;
    const reading = delayedRead.node("prepare").onclick();
    [...delayedRead.connectionTimers][0]();
    await reading;
    readWait.resolve(); await Promise.resolve(); await Promise.resolve();
    assert.equal(delayedRead.probe.preview(), null, "late read cannot restore a preview after timeout");
    assert.equal(delayedRead.node("send").disabled, true);

    const okx = await mount({ okxOnly: true, role: "guanyin", account: alternate, chainId: 1, pauser: true, reselectAccount: formal.guanyin });
    assert.match(okx.node("connection").textContent, /chainId=1\b/);
    assert.ok(okx.node("connection").textContent.includes(alternate));
    assert.equal(okx.rpc.filter(call => call.method === "wallet_switchEthereumChain").length, 0);
    await okx.node("prepare").onclick(); assert.equal(okx.node("send").disabled, true);
    await okx.node("reselect").onclick();
    assert.ok(okx.node("connection").textContent.toLowerCase().includes(formal.guanyin.toLowerCase()));
    assert.equal(okx.rpc.filter(call => call.method === "wallet_requestPermissions").length, 1);
    await okx.node("switch-bsc").onclick();
    assert.match(okx.node("connection").textContent, /chainId=56\b/);
    assert.equal(okx.probe.preview(), null); assert.equal(okx.node("send").disabled, true);
    await okx.node("prepare").onclick();
    const pauseIntent = JSON.parse(okx.node("preview").textContent).unsignedTransaction;
    assert.equal(pauseIntent.from.toLowerCase(), formal.guanyin.toLowerCase()); assert.equal(pauseIntent.to, formal.bank);
    assert.equal(pauseIntent.chainId, 56); assert.equal(pauseIntent.data, "0x8456cb59"); assert.equal(pauseIntent.value, "0x0");
    assert.equal(okx.requests.length, 0);
    okx.node("wallet").emit("change");
    await okx.node("prepare").onclick(); assert.equal(okx.probe.preview(), null);
    assert.equal(okx.providerEvents.filter(event => event.type === "kaios18888:wallet").at(-1).detail.provider, null);

    for (const timeout of [false, true]) {
      const wait = deferred();
      const ui = await mount({ role: "guanyin", account: alternate, malformedProviders: true, reselectAccount: formal.guanyin, permissionsWait: wait });
      const pending = ui.node("reselect").onclick();
      await Promise.resolve(); await Promise.resolve();
      assert.equal(ui.node("cancel-connect").hidden, false);
      assert.equal(ui.rpc.filter(call => call.method === "wallet_requestPermissions").length, 1);
      if (timeout) [...ui.connectionTimers][0]();
      else ui.node("cancel-connect").onclick();
      await pending;
      assert.equal(ui.node("cancel-connect").hidden, true);
      assert.equal(ui.connectionTimers.size, 0);
      await ui.node("connect").onclick();
      assert.equal(ui.rpc.filter(call => call.method === "eth_requestAccounts").length, 1, "do not stack a second prompt over the pending request");
      wait.resolve();
      await Promise.resolve(); await Promise.resolve();
      assert.equal(ui.probe.preview(), null); assert.equal(ui.node("send").disabled, true);
      assert.equal(ui.providerEvents.filter(event => event.type === "kaios18888:wallet").at(-1).detail.provider, null);
      assert.equal(ui.requests.length, 0);
    }

    for (const outcome of [{ switchError: 4001 }, { switchNoChange: true }]) {
      const ui = await mount({ role: "guanyin", account: formal.guanyin, chainId: 1, pauser: true, ...outcome });
      await ui.node("switch-bsc").onclick(); await ui.node("prepare").onclick();
      assert.equal(ui.rpc.filter(call => call.method === "wallet_switchEthereumChain").length, 1);
      assert.equal(ui.probe.preview(), null); assert.equal(ui.node("send").disabled, true); assert.equal(ui.requests.length, 0);
    }
    for (const code of [4200, 4001, -32002]) {
      const ui = await mount({ account: alternate, role: "guanyin", permissionsError: code });
      await ui.node("reselect").onclick();
      assert.equal(ui.rpc.filter(call => call.method === "eth_requestAccounts").length, 1, "never auto-prompt again");
      assert.equal(ui.probe.preview(), null); assert.equal(ui.requests.length, 0);
    }

    for (const mobileResult of [{}, { mobileForeign: true }, { mobileDisconnectError: true }, { mobileUnapprovedAccount: true }, { mobileReject: true }]) {
      const ui = await mount({ mobile: true, mobileCached: true, role: "guanyin", account: alternate, chainId: 1, ...mobileResult });
      ui.storageFixture.setItem("kaios18888.humanFunding.pending.v1", "original-intent");
      await ui.node("mobile").onclick();
      assert.equal(ui.storageFixture.getItem("kaios18888.humanFunding.pending.v1"), "original-intent");
      assert.equal(ui.mobileLog.includes("eth_requestAccounts"), false, "one WalletConnect authorization entry");
      if (mobileResult.mobileForeign || mobileResult.mobileDisconnectError) {
        assert.deepEqual(ui.mobileLog, mobileResult.mobileForeign ? ["init"] : ["init", "disconnect"]);
      } else {
        assert.deepEqual(ui.mobileLog.slice(0, 3), ["init", "disconnect", "enable"]);
        if (!mobileResult.mobileReject && !mobileResult.mobileUnapprovedAccount) {
          assert.match(ui.node("connection").textContent, /chainId=56\b/);
          await ui.node("prepare").onclick();
          assert.equal(JSON.parse(ui.node("preview").textContent).unsignedTransaction.data, "0x8456cb59");
        } else {
          assert.equal(ui.probe.preview(), null);
        }
      }
      assert.equal(ui.node("send").disabled, true); assert.equal(ui.requests.length, 0);
    }

    const settleWallet = () => new Promise(resolve => setImmediate(resolve));
    const say = (ui, transcript, final = true, recognition = ui.recognitions.at(-1)) => recognition.onresult?.({
      resultIndex:0, results:[Object.assign([{transcript}],{isFinal:final})]
    });
    await t.test('funding diagnostics automatically show current account, chain, pending and failed identity near the main action', async () => {
      const ui=await mount({visible:true});
      assert.match(ui.node('diagnostics').textContent,new RegExp(formal.mother,'i'));
      assert.match(ui.node('diagnostics').textContent,/網路：56.*原待核交易.*下一步/);
      ui.state.chainId=1;ui.providerListeners.get('chainChanged')('0x1');
      assert.match(ui.node('diagnostics').textContent,/網路：1.*BSC主網56/);
      ui.wallets.at(-1).readPending=()=>{throw Error('PENDING_STORAGE_CORRUPT_DO_NOT_RESEND');};
      ui.node('ack').emit('change');
      assert.match(ui.node('diagnostics').textContent,/紀錄讀取失敗.*停止送單/);
      assert.equal(ui.requests.length,0);
      const identity=await mount({visible:true,snapshotOverride:{identityErrors:['BANK_RUNTIME_PIN_UNKNOWN'],codeOk:false}});
      assert.match(identity.node('diagnostics').textContent,/BANK_RUNTIME_PIN_UNKNOWN/);
      assert.doesNotMatch(identity.node('diagnostics').textContent,/本次鏈上角色與版本已核對/);
      assert.equal(identity.requests.length,0);
    });
    await t.test('funding voice requires an explicit click and confirmed on-device zh-TW without microphone, installation or cloud fallback', async () => {
      for(const options of [{},{voice:{api:false}},{voice:{localProperty:false}},{voice:{availability:'downloadable'}},
        {voice:{availability:'downloading'}},{voice:{availability:'unavailable'}},{voice:{availability:'unknown'}},
        {voice:{error:Object.assign(Error('permission blocked'),{error:'not-allowed'})}},{voice:{},secureContext:false}]) {
        const ui=await mount({visible:true,...options});
        assert.deepEqual(ui.voiceLog,[],'boot and wallet restoration do not inspect or activate speech');
        assert.equal(ui.node('voice-start').disabled,false,'unsupported capability still has an explained check button');
        await ui.node('voice-start').onclick();
        assert.match(ui.node('voice-status').textContent,/未確認本機中文語音可用/);
        assert.equal(ui.voiceLog.includes('start'),false);
        assert.equal(ui.voiceLog.includes('microphone'),false);assert.equal(ui.voiceLog.includes('install'),false);
        assert.equal(ui.connectionTimers.size,0);assert.equal(ui.requests.length,0);
      }
    });
    await t.test('funding voice executes only final whitelisted read intent, never stores or displays transcripts, and permits late API detection', async () => {
      const ui=await mount({visible:true});
      await ui.node('voice-start').onclick();
      assert.match(ui.node('voice-status').textContent,/未確認/);
      ui.injectRecognition();
      const reads=ui.prepareCalls.length;await ui.node('voice-start').onclick();
      equalInline(ui.voiceLog.find(call=>call.available).available,{langs:['zh-TW'],processLocally:true});
      assert.equal(ui.voiceLog.filter(call=>call==='start').length,1);
      await say(ui,'核對狀態',false);assert.equal(ui.prepareCalls.length,reads,'interim speech cannot execute');
      await say(ui,'核對狀態');
      assert.equal(ui.prepareCalls.length,reads+1);assert.equal(ui.requests.length,0);
      assert.equal(ui.connectionTimers.size,0);assert.equal(ui.node('ack').checked,false);
      const unknown='do not save this synthetic unknown phrase 987654';
      await ui.node('voice-start').onclick();await say(ui,unknown);
      assert.match(ui.node('voice-status').textContent,/未符合三項操作指令/);
      assert.equal(ui.allText().includes(unknown),false);
      assert.equal(ui.storageWrites.some(entry=>String(entry.value).includes(unknown)),false);
      assert.equal(ui.prepareCalls.length,reads+1);assert.equal(ui.voiceLog.includes('microphone'),false);
      assert.equal(ui.voiceLog.includes('install'),false);
    });
    await t.test('funding voice continuation uses only pre-existing bound bulk consent and stopping preserves an in-flight original transaction', async () => {
      const ui=await mount({visible:true,role:'jade',account:formal.jade,guided:{phase:'created'},voice:{}});
      await ui.node('voice-start').onclick();await say(ui,'接續辦理');
      assert.equal(ui.requests.length,0);assert.equal(ui.node('five-ack').checked,false);
      assert.match(ui.node('voice-status').textContent,/尚未完成原五案確認/);
      ui.node('five-ack').checked=true;ui.node('five-ack').emit('change');
      await ui.node('voice-start').onclick();await say(ui,'接續辦理');
      assert.equal(ui.requests.length,5);assert.match(ui.node('five-paid-count').textContent,/5 \/ 5/);
      assert.equal(ui.node('ack').checked,false);assert.equal(ui.voiceLog.includes('microphone'),false);
      const cfg={},stopped=await mount({visible:true,guided:cfg,voice:{}}),wait=deferred();
      stopped.node('five-ack').checked=true;stopped.node('five-ack').emit('change');
      await stopped.node('voice-start').onclick();cfg.onRequest=()=>wait.promise;
      const working=stopped.node('five-start').onclick();await settleWallet();
      assert.match(stopped.node('diagnostics').textContent,/本次接續中.*高翠蘭.*1,080,000/);
      const pending=stopped.pending();await say(stopped,'停止');wait.resolve();await working;
      assert.equal(stopped.requests.length,1);assert.equal(stopped.pending(),pending);assert.equal(stopped.receiptCalls.length,0);
      assert.equal(stopped.node('five-ack').checked,false);assert.match(stopped.node('voice-status').textContent,/語音與接續已停止/);
    });
    await t.test('funding voice aborts on external context or cancellation and ignores late recognition or availability', async () => {
      for(const change of ['accountsChanged','chainChanged','role','mode','case','wallet','background']) {
        const ui=await mount({visible:true,voice:{}});await ui.node('voice-start').onclick();const recognition=ui.recognitions.at(-1);
        if(change==='accountsChanged'){ui.state.accounts=[formal.jade];ui.providerListeners.get(change)([formal.jade]);}
        else if(change==='chainChanged'){ui.state.chainId=1;ui.providerListeners.get(change)('0x1');}
        else if(change==='background')ui.setVisibility('hidden');
        else {ui.node(change).value=change==='role'?'jade':change==='mode'?'cap':'';ui.node(change).emit(change==='wallet'?'input':'change');}
        await settleWallet();const before=ui.prepareCalls.length,message=ui.node('voice-status').textContent;
        await say(ui,'核對狀態',true,recognition);
        assert.equal(ui.prepareCalls.length,before,change);assert.equal(ui.requests.length,0,change);
        assert.equal(ui.node('voice-status').textContent,message,change);assert.ok(ui.voiceLog.includes('abort'),change);
      }
      const wait=deferred(),ui=await mount({visible:true,voice:{wait}});
      const checking=ui.node('voice-start').onclick();await settleWallet();ui.node('voice-stop').onclick();await checking;
      const message=ui.node('voice-status').textContent;wait.resolve('available');await settleWallet();
      assert.equal(ui.voiceLog.includes('start'),false);assert.equal(ui.connectionTimers.size,0);
      assert.equal(ui.node('voice-status').textContent,message);assert.equal(ui.requests.length,0);
    });
    await t.test('funding voice deadlines preserve financial consent and pending records and never restart recognition', async () => {
      for(const available of [true,false]) {
        const wait=deferred(),ui=await mount({visible:true,voice:available?{}:{wait}});
        const pending={flowType:'FIXED_ALLOCATION',kind:'ALLOCATION_PROPOSE',hash:transactionHash,transaction:{from:formal.mother}};
        ui.wallets.at(-1).readPending=()=>pending;
        ui.node('five-ack').checked=true;ui.node('five-ack').emit('change');
        const listening=ui.node('voice-start').onclick();await settleWallet();
        assert.equal(ui.connectionTimers.size,1);[...ui.connectionTimers][0]();await listening;
        const message=ui.node('voice-status').textContent;wait.resolve('available');await settleWallet();
        const recognition=ui.recognitions.at(-1);if(recognition.onresult)await say(ui,'接續辦理',true,recognition);
        assert.equal(ui.node('voice-status').textContent,message);
        assert.equal(ui.node('five-ack').checked,true);assert.equal(ui.wallets.at(-1).readPending(),pending);
        assert.equal(ui.requests.length,0);assert.equal(ui.connectionTimers.size,0);
        assert.equal(ui.voiceLog.filter(call=>call==='start').length,available?1:0);
      }
      const ended=await mount({visible:true,voice:{}});await ended.node('voice-start').onclick();
      ended.recognitions.at(-1).onend();await settleWallet();
      assert.equal(ended.voiceLog.filter(call=>call==='start').length,1);assert.equal(ended.connectionTimers.size,0);
    });
    await t.test("authorized fixed connection and case/mode changes preview once without acknowledging or sending", async () => {
      const ui = await mount({ visible: true });
      assert.equal(ui.prepareCalls.length, 1, "successful connection uses the original read-only preparation");
      await ui.node("load-five").onclick(); await settleWallet();
      assert.equal(ui.probe.preview().plan.allocationId, "0x75a5aaf0a27ce1b009f71e28319a587feaacbb8bf1204cf4b4a1fc53da70e428");
      assert.equal(ui.probe.preview().plan.amountKaios, "1080000");
      assert.match(ui.node("summary").textContent, /下一步/);
      assert.doesNotMatch(ui.node("status").textContent, /離線參數未驗證/);
      assert.equal(ui.node("ack").checked, false); assert.equal(ui.node("send").disabled, true);
      ui.node("case").value = "1"; ui.node("case").emit("change"); await settleWallet();
      assert.equal(ui.probe.preview().plan.allocationId, "0xbb183e13332a2594ffdf45b0501f4a26561378e167450b9de19ebf70cdd9f3c7");
      ui.node("mode").value = "cap"; ui.node("mode").emit("change"); await settleWallet();
      assert.equal(ui.probe.preview().plan.type, "SHARED_CAP");
      assert.equal(ui.node("ack").checked, false); assert.equal(ui.node("send").disabled, true);
      assert.equal(ui.requests.length, 0);
      const reads = ui.prepareCalls.length;
      await ui.node("draft").onclick(); await settleWallet();
      assert.equal(ui.prepareCalls.length, reads, "explicit offline draft stays offline");
      assert.equal(JSON.parse(ui.node("preview").textContent).status, "OFFLINE_DRAFT_NOT_CHAIN_VERIFIED");
    });
    await t.test("one queued latest case replaces an in-flight stale preview and invalid contexts cannot preview", async () => {
      const ui = await mount({ visible: true });
      await ui.node("load-five").onclick(); await settleWallet();
      const wait = deferred(), before = ui.prepareCalls.length;
      ui.wallets.at(-1).next = wait;
      const reading = ui.node("prepare").onclick();
      assert.match(ui.node("status").textContent, /正在唯讀核對.*不會送出交易/);
      for (const index of ["1", "2"]) { ui.node("case").value = index; ui.node("case").emit("change"); }
      wait.resolve(); await reading; await settleWallet();
      assert.equal(ui.prepareCalls.length, before + 2, "one stale read plus one latest selection read");
      assert.equal(ui.probe.preview().plan.allocationId, "0x2ac4cf224f86e93394833036e96068523e5b71295c5c535d82f2efa3f2827359");
      ui.state.chainId = 1; ui.providerListeners.get("chainChanged")("0x1"); await settleWallet();
      assert.equal(ui.probe.preview(), null);
      const wrongChainReads = ui.prepareCalls.length;
      ui.node("case").value = "3"; ui.node("case").emit("change"); await settleWallet();
      assert.equal(ui.prepareCalls.length, wrongChainReads);
      ui.state.chainId = 56; ui.providerListeners.get("chainChanged")("0x38"); await settleWallet();
      assert.equal(ui.probe.preview().plan.allocationId, "0x58114b263f63088c52711b13bc7b370fc71ab63b45470fd45ef610d237775dd9");
      ui.node("role").value = "jade"; ui.node("role").emit("change"); await settleWallet();
      assert.equal(ui.probe.preview(), null); assert.equal(ui.node("send").disabled, true);
      ui.state.accounts = [formal.jade]; ui.providerListeners.get("accountsChanged")([formal.jade]);
      ui.node("account").value = formal.jade; ui.node("account").emit("change"); await settleWallet();
      assert.equal(ui.probe.preview().account, formal.jade);
      assert.equal(ui.node("ack").checked, false); assert.equal(ui.requests.length, 0);
    });
    await t.test("connection rejection/cancellation and failed reads do not auto-retry or restore stale results", async () => {
      const rejected = await mount({ visible: true, skipConnect: true, requestAccountsError: 4001 });
      rejected.node("wallet").value = "0"; await rejected.node("connect").onclick(); await settleWallet();
      assert.equal(rejected.prepareCalls.length, 0); assert.equal(rejected.probe.preview(), null);
      for (const timeout of [false, true]) {
        const accounts = deferred();
        const ui = await mount({ visible: true, skipConnect: true, accountsWait: accounts });
        ui.node("wallet").value = "0"; const connecting = ui.node("connect").onclick(); await settleWallet();
        if (timeout) [...ui.connectionTimers][0](); else ui.node("cancel-connect").onclick();
        await connecting; accounts.resolve([formal.mother]); await settleWallet();
        assert.equal(ui.prepareCalls.length, 0); assert.equal(ui.probe.preview(), null); assert.equal(ui.requests.length, 0);
      }
      const ui = await mount({ visible: true }), wait = deferred(), before = ui.prepareCalls.length;
      ui.wallets.at(-1).next = wait;
      const reading = ui.node("prepare").onclick(); ui.pageShow();
      wait.reject(Error("RPC_READ_UNAVAILABLE")); await reading; await settleWallet();
      assert.equal(ui.prepareCalls.length, before + 1, "queued foreground restoration cannot retry a failed read");
      assert.equal(ui.probe.preview(), null); assert.match(ui.node("status").textContent, /RPC_READ_UNAVAILABLE/);
      assert.doesNotMatch(ui.node("connection").textContent, new RegExp(formal.mother, "i"), "unverified app return cannot display the old account as currently authorized");
      assert.equal(ui.node("prepare").disabled, true);
      await ui.node("connect").onclick();
      assert.equal(ui.prepareCalls.length, before + 2, "an explicit reconnect may read again after the stopped failure");
      assert.ok(ui.probe.preview()); assert.equal(ui.requests.length, 0);
    });
    await t.test("automatic preview preserves the original pending watcher and its error or receipt evidence", async () => {
      for (const result of ["PENDING", "CONFIRMED", "MISMATCH", Error("receipt offline")]) {
        const pending = { flowType: "SHARED_CAP", kind: "CAP_PROPOSE", hash: transactionHash,
          transaction: { from: formal.mother }, plan: buildSharedCapPlan() };
        const ui = await mount({ mode: "cap", visible: true, pending, receiptResults: [result] });
        await settleWallet();
        assert.equal(ui.receiptCalls.length, 1, "one original receipt check, without replacing its watch");
        assert.equal(ui.prepareCalls.length, 0); assert.equal(ui.probe.preview(), null);
        assert.equal(ui.wallets.at(-1).readPending(), pending); assert.equal(ui.requests.length, 0);
        assert.equal(ui.node("send").disabled, true);
        if (result instanceof Error) assert.match(ui.node("status").textContent, /查詢已停止.*receipt offline/);
        else if (result !== "PENDING") assert.equal(JSON.parse(ui.node("preview").textContent).status, result);
      }
    });
    await t.test('primary five entry opens only the original native route in the current click and never resumes sending after connection', async () => {
      const href='https://klineodyssey.github.io/kline-odyssey/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/18888/index.html?fundingRole=mother&fundingFlow=fixed';
      const ui=await mount({href,lateMetaMask:true,skipConnect:true,needsAuthorization:true,visible:true,guided:{}});
      let clicks=0, inGesture=true;
      const native=ui.node('native-metamask');
      native.click=()=>{assert.equal(inGesture,true,'native navigation stays in this synchronous gesture');clicks++;};
      assert.equal(ui.node('five-start').disabled,false);
      assert.match(ui.node('five-start').textContent,/連接王母/);
      await ui.node('five-start').onclick();
      assert.equal(clicks,1);assert.match(native.href,/^https:\/\/link\.metamask\.io\/dapp\//);
      assert.equal(ui.rpc.length,0);assert.equal(ui.requests.length,0);
      ui.injectMetaMask();
      native.click=()=>{assert.equal(inGesture,true);clicks++;return native.onclick({preventDefault(){}});};
      const connecting=ui.node('five-start').onclick();inGesture=false;await connecting;await settleWallet();
      assert.equal(clicks,2);assert.equal(ui.rpc.filter(call=>call.method==='eth_requestAccounts').length,1);
      assert.equal(ui.requests.length,0);assert.equal(ui.node('five-ack').checked,false);
      assert.match(ui.node('five-start').textContent,/確認原五筆/);
      assert.ok(ui.rpc.every(call=>['eth_accounts','eth_requestAccounts','eth_chainId'].includes(call.method)));
      await ui.node('five-start').onclick();
      assert.equal(ui.node('five-ack').focused,true);assert.equal(ui.node('five-ack').checked,false);
      assert.equal(ui.requests.length,0,'connection and review navigation never start the original send loop');
    });
    await t.test('primary five entry routes a wrong chain or account to the original control without selecting authority or granting consent', async () => {
      const chain=await mount({visible:true,chainId:1});let switches=0;
      chain.node('switch-bsc').click=()=>{switches++;return chain.node('switch-bsc').onclick();};
      assert.match(chain.node('five-start').textContent,/BSC 56/);
      await chain.node('five-start').onclick();await settleWallet();
      assert.equal(switches,1);assert.equal(chain.state.chainId,56);assert.equal(chain.requests.length,0);
      assert.equal(chain.node('five-ack').checked,false);
      const account=await mount({visible:true,account:alternate}), before=account.rpc.length;
      await account.node('five-start').onclick();
      assert.equal(account.node('account').focused,true);assert.equal(account.node('account').scrolled,true);
      assert.equal(account.node('advanced').open,true);assert.equal(account.state.account,alternate);
      assert.equal(account.rpc.length,before);assert.equal(account.requests.length,0);
      assert.equal(account.node('five-ack').checked,false);
    });
    await t.test('primary five entry reconciles a saved original intent read-only, then stops at an unacknowledged main entry', async () => {
      const original=buildLifeResourcePlan({beneficiary:'0x60Ed5A562642cbC303D720507a37170116707259',amount:'1080000'});
      const intent={flowType:'FIXED_ALLOCATION',plan:original,kind:'ALLOCATION_EXECUTE',hash:transactionHash,transaction:{from:formal.mother}};
      const ui=await mount({visible:true,guided:{pending:intent}});
      const before=ui.receiptCalls.length;
      ui.node('receipt').click=()=>ui.node('receipt').onclick();
      assert.match(ui.node('five-start').textContent,/核對原交易/);
      await ui.node('five-start').onclick();await settleWallet();
      assert.equal(ui.receiptCalls.length,before+1);assert.equal(ui.requests.length,0);assert.equal(ui.pending(),null);
      assert.equal(ui.node('five-ack').checked,false);assert.match(ui.node('five-start').textContent,/確認原五筆/);
      await ui.node('five-start').onclick();
      assert.equal(ui.node('five-ack').focused,true);assert.equal(ui.requests.length,0);
    });
    await t.test('primary five entry returns canonical pending to its original cap or fixed wallet while foreign intents stay untouched', async () => {
      const original=buildLifeResourcePlan({beneficiary:'0x60Ed5A562642cbC303D720507a37170116707259',amount:'1080000'});
      for(const [mode,flowType,plan,kind] of [['cap','FIXED_ALLOCATION',original,'ALLOCATION_EXECUTE'],['fixed','SHARED_CAP',buildSharedCapPlan(),'CAP_EXECUTE']]) {
        const pending={flowType,plan,kind,hash:transactionHash,transaction:{from:formal.mother}}, seen=[];
        const ui=await mount({mode,visible:true,guided:{pending,onReconcile:(hash,wallet)=>seen.push({hash,flowType:wallet.flowType})}});
        assert.equal(ui.receiptCalls.length,0);
        assert.match(ui.node('five-start').textContent,/切回原交易流程/);
        await ui.node('five-start').onclick();await settleWallet();
        assert.equal(ui.node('mode').value,mode==='cap'?'fixed':'cap');
        if(ui.pending()) {ui.node('receipt').click=()=>ui.node('receipt').onclick();await ui.node('five-start').onclick();await settleWallet();}
        assert.deepEqual(seen,[{hash:mode==='cap'?undefined:transactionHash,flowType}]);
        assert.equal(ui.requests.length,0);assert.equal(ui.node('five-ack').checked,false);
        assert.equal(ui.pending(),null,'only the original reconciler, in the correct flow, consumes this mock-confirmed record');
      }
      const foreign={flowType:'SEVEN_FLOOR_CLAIM',kind:'FLOOR_CLAIM',plan:{type:'SEVEN_FLOOR_CLAIM'},hash:transactionHash};
      const ui=await mount({visible:true,guided:{pending:foreign}});
      await ui.node('five-start').onclick();
      assert.equal(ui.node('mode').value,'fixed');assert.equal(ui.pending(),foreign);assert.equal(ui.node('status').focused,true);
      assert.equal(ui.receiptCalls.length,0);assert.equal(ui.requests.length,0);assert.match(ui.node('five-next').textContent,/另一流程/);
    });
    await t.test('primary five entry preserves pending storage errors and never turns a scripted checkbox or stale label into consent', async () => {
      const ui=await mount({visible:true,guided:{}});
      ui.node('five-ack').checked=true;
      await ui.node('five-start').onclick();
      assert.equal(ui.requests.length,0);assert.equal(ui.node('five-ack').checked,false);
      ui.node('five-ack').checked=true;ui.node('five-ack').emit('change');
      const reads=ui.prepareCalls.length;
      ui.wallets.at(-1).readPending=()=>{throw Error('PENDING_STORAGE_CORRUPT_DO_NOT_RESEND');};
      await ui.node('five-start').onclick();
      assert.match(ui.node('five-next').textContent,/紀錄讀取失敗/);assert.equal(ui.node('status').focused,true);
      assert.equal(ui.requests.length,0);assert.equal(ui.prepareCalls.length,reads);
      const changed=await mount({visible:true,guided:{}});
      changed.node('five-ack').checked=true;changed.node('five-ack').emit('change');
      changed.node('role').value='jade';
      await changed.node('five-start').onclick();
      assert.equal(changed.node('account').focused,true);assert.equal(changed.requests.length,0,'click re-evaluates the actual role instead of an old ready label');
    });
    await t.test('primary five entry blocks a second click during the original receipt watcher and updates the entry when the watch settles', async () => {
      const ui=await mount({visible:true,receiptResults:['CONFIRMED']}), wait=deferred();
      const intent={flowType:'FIXED_ALLOCATION',kind:'CAP_PROPOSE',plan:buildSharedCapPlan(),hash:transactionHash,transaction:{from:formal.mother}};
      ui.wallets.at(-1).readPending=()=>intent;ui.wallets.at(-1).nextReceipt=wait;
      const watching=ui.probe.watchReceipt();await settleWallet();
      assert.equal(ui.node('five-start').disabled,true);assert.match(ui.node('five-start').textContent,/正在核對原交易/);
      await ui.node('five-start').onclick();await ui.node('five-start').onclick();
      assert.equal(ui.receiptCalls.length,1);assert.equal(ui.requests.length,0);
      wait.resolve();await watching;
      assert.equal(ui.node('five-start').disabled,false);assert.equal(ui.receiptCalls.length,1);
      assert.equal(ui.wallets.at(-1).readPending(),intent,'entry routing does not clear the saved record itself');
    });
    await t.test('primary five entry keeps the original financial busy guard and cannot reconnect or resume while hidden', async () => {
      const cfg={},ui=await mount({visible:true,guided:cfg}),wait=deferred();
      cfg.onRequest=()=>wait.promise;
      ui.node('five-ack').checked=true;ui.node('five-ack').emit('change');
      const sending=ui.node('five-start').onclick();await settleWallet();
      assert.equal(ui.requests.length,1);assert.equal(ui.node('five-start').disabled,true);
      await ui.node('five-start').onclick();assert.equal(ui.requests.length,1);
      ui.setVisibility('hidden');const reads=ui.rpc.length;
      await ui.node('five-start').onclick();assert.equal(ui.rpc.length,reads);
      wait.resolve();await sending;
      assert.equal(ui.requests.length,1);assert.ok(ui.pending());assert.equal(ui.node('five-ack').checked,false);
      assert.equal(ui.node('five-start').disabled,true);
    });
    const startFive = async ui => {
      ui.node('five-ack').checked = true; ui.node('five-ack').emit('change');
      assert.equal(ui.node('five-start').disabled, false);
      await ui.node('five-start').onclick();
      assert.equal(ui.node('five').getAttribute('aria-busy'), 'false');
    };
    await t.test('guided original five: one consent proposes all eligible Mother cases, independent of imported cases', async () => {
      const ui = await mount({visible:true,guided:{}});
      await ui.node('five-start').onclick();
      assert.equal(ui.requests.length,0,'a click without reviewed bulk consent cannot send');
      const arbitrary = buildLifeResourcePlan({beneficiary:alternate,amount:'2'});
      ui.probe.setCases([{...arbitrary,name:'not an original case'}]);
      await startFive(ui);
      assert.equal(ui.requests.length,5,ui.node('five-status').textContent);
      assert.ok(ui.requests.every(p=>p.step.kind==='ALLOCATION_PROPOSE' && p.plan.amountKaios==='1080000'));
      assert.equal(new Set(ui.requests.map(p=>p.plan.allocationId)).size,5);
      assert.ok(ui.requests.every(p=>p.plan.beneficiary.toLowerCase()!==alternate.toLowerCase()));
      assert.equal(ui.receiptCalls.length,5);
      assert.match(ui.node('five-status').textContent,/本角色目前可辦步驟已完成.*玉帝/);
      assert.match(ui.node('five-paid-count').textContent,/0 \/ 5/);
      assert.equal(ui.node('ack').checked,false,'bulk consent never checks the original per-case acknowledgment');
      await settleWallet(); ui.pageShow(); await settleWallet();
      assert.equal(ui.requests.length,5,'passive restoration never resumes a finished send session');
    });
    await t.test('guided original five: cap execution is followed by real case roles, never claimed as five payouts', async () => {
      const ui = await mount({visible:true,role:'jade',account:formal.jade,guided:{cap:'approved'}});
      await startFive(ui);
      assert.deepEqual(ui.requests.map(p=>p.step.kind),['CAP_EXECUTE'],ui.node('five-status').textContent);
      assert.equal(ui.receiptCalls.length,1);
      assert.match(ui.node('five-status').textContent,/Mother|王母/);
      assert.match(ui.node('five-paid-count').textContent,/0 \/ 5/);
      assert.doesNotMatch(ui.node('five-status').textContent,/付款回執全部核對通過/);
      const waiting = await mount({visible:true,role:'jade',account:formal.jade,guided:{phase:'approved',eta:timestamp+3600}});
      await startFive(waiting);
      assert.equal(waiting.requests.length,0); assert.match(waiting.node('five-status').textContent,/等待.*治理|等待到期/);
      assert.match(waiting.node('five-case-0').textContent,/最早可執行/);
    });
    await t.test('guided original five: mature approved allocations create then pay five exact cases with full verified receipts', async () => {
      const ui=await mount({visible:true,role:'jade',account:formal.jade,guided:{phase:'approved'}});
      await startFive(ui);
      assert.equal(ui.requests.length,10,ui.node('five-status').textContent); assert.equal(ui.receiptCalls.length,10);
      for(let index=0;index<5;index++) {
        const [create,pay]=ui.requests.slice(index*2,index*2+2);
        assert.equal(create.step.kind,'ALLOCATION_EXECUTE'); assert.equal(pay.step.kind,'PAYOUT');
        assert.equal(create.plan.allocationId,pay.plan.allocationId); assert.equal(pay.plan.amountKaios,'1080000');
        assert.match(ui.node('five-case-'+index).textContent,/付款回執核對通過.*0x/);
      }
      assert.match(ui.node('five-paid-count').textContent,/5 \/ 5/);
      assert.match(ui.node('five-chain-count').textContent,/5 \/ 5/);
      assert.doesNotMatch(ui.node('five-chain-count').textContent,/10 \/ 5/,'observed execution and verified receipts count each original case once');
      assert.match(ui.node('five-status').textContent,/付款回執全部核對通過.*5,400,000/);
      assert.equal(ui.pending(),null);
      ui.node('role').value='mother';ui.node('role').emit('change');
      assert.match(ui.node('five-paid-count').textContent,/5 \/ 5/,'context changes preserve already verified receipt evidence');
      assert.match(ui.node('five-chain-count').textContent,/5 \/ 5/);
      const bounded=await mount({visible:true,role:'jade',account:formal.jade,guided:{cap:'approved',phase:'proposed'}});
      await startFive(bounded);
      assert.equal(bounded.requests.length,16,bounded.node('five-status').textContent);
      assert.equal(bounded.receiptCalls.length,16);
      assert.match(bounded.node('five-paid-count').textContent,/5 \/ 5/);
      assert.match(bounded.node('five-status').textContent,/付款回執全部核對通過.*5,400,000/);
      assert.equal(bounded.pending(),null);
      const observed=await mount({visible:true,guided:{phase:'done'}});
      await startFive(observed);
      assert.equal(observed.requests.length,0); assert.match(observed.node('five-paid-count').textContent,/0 \/ 5/);
      assert.match(observed.node('five-chain-count').textContent,/5 \/ 5/);
      assert.match(observed.node('five-paid-count').textContent,/本頁對帳數.*不是錢包餘額/);
      assert.match(observed.node('five-status').textContent,/沒有待撥原案.*請勿重送/);
      assert.doesNotMatch(observed.node('five-status').textContent,/付款回執全部核對通過/);
      assert.match(observed.node('five-case-0').textContent,/待原付款回執.*不重送/);
      observed.node('role').value='jade';observed.node('role').emit('change');
      assert.match(observed.node('five-chain-count').textContent,/尚未讀查/,'context invalidation clears volatile chain observations');
      assert.match(observed.node('five-paid-count').textContent,/0 \/ 5/);
    });
    await t.test('guided original five: active selection names the actual remaining recipient while the advanced case stays Gao', async () => {
      const phases=Object.fromEntries([
        '0x75a5aaf0a27ce1b009f71e28319a587feaacbb8bf1204cf4b4a1fc53da70e428',
        '0xbb183e13332a2594ffdf45b0501f4a26561378e167450b9de19ebf70cdd9f3c7',
        '0x2ac4cf224f86e93394833036e96068523e5b71295c5c535d82f2efa3f2827359'
      ].map(id=>[id,'done']));
      const names=new Map([
        ['0x21ce2065b0171a26b5f9efe2268cbdce08e94922','白寧'],
        ['0x651ff5e7c183d0d3d40c9ce8a86be246111521cd','澄序']
      ]);
      const cfg={phase:'approved',phases},ui=await mount({visible:true,role:'jade',account:formal.jade,guided:cfg});
      await ui.node('load-five').onclick();await settleWallet();assert.equal(ui.node('case').value,'0');
      assert.match(ui.node('selection-status').textContent,/單案檢查選擇.*高翠蘭.*不決定原五案接續順序/);
      cfg.onRequest=candidate=>{
        const name=names.get(candidate.plan.beneficiary.toLowerCase());assert.ok(name,'only the two unpaid fixture cases may request confirmation');
        assert.equal(ui.node('case').value,'0','bulk steps do not change the separate advanced selection');
        assert.ok(ui.node('selection-status').textContent.includes(name),ui.node('selection-status').textContent);
        assert.match(ui.node('selection-status').textContent,/原五案目前步驟.*1,080,000/);
        assert.ok(ui.node('selection-status').textContent.includes(ui.node('five-status').textContent));
      };
      await startFive(ui);
      assert.deepEqual(ui.requests.map(p=>p.step.kind),['ALLOCATION_EXECUTE','PAYOUT','ALLOCATION_EXECUTE','PAYOUT']);
      assert.match(ui.node('five-chain-count').textContent,/5 \/ 5/);
      assert.match(ui.node('five-paid-count').textContent,/2 \/ 5/,'the first three observed DONE cases do not manufacture receipt evidence');
      assert.match(ui.node('selection-status').textContent,/單案檢查選擇.*高翠蘭/);
    });
    await t.test('guided original five: scan past another-role case and stop unchanged confirmed actions without resending', async () => {
      const first='0x75a5aaf0a27ce1b009f71e28319a587feaacbb8bf1204cf4b4a1fc53da70e428';
      const mixed=await mount({visible:true,guided:{phases:{[first]:'proposed'}}});
      await startFive(mixed);
      assert.equal(mixed.requests.length,4); assert.ok(mixed.requests.every(p=>p.plan.allocationId!==first));
      const stale=await mount({visible:true,guided:{staleState:true}});
      await startFive(stale);
      assert.equal(stale.requests.length,1); assert.match(stale.node('five-status').textContent,/鏈上狀態尚未更新.*不會重送/);
    });
    await t.test('guided original five: pending or noncanonical outcomes stop, and only the exact saved intent can resume', async () => {
      for(const outcome of ['PENDING','MISMATCH','REVERTED','EVIDENCE_INCOMPLETE']) {
        const cfg={results:outcome==='PENDING'?Array(4).fill('PENDING'):[outcome]}, ui=await mount({visible:true,guided:cfg});
        await startFive(ui);
        assert.equal(ui.requests.length,1); assert.equal(ui.receiptCalls.length,outcome==='PENDING'?4:1); assert.ok(ui.pending());
        assert.match(ui.node('five-paid-count').textContent,/0 \/ 5/);
        if(outcome==='PENDING') {
          const saved=ui.pending(); cfg.results=['CONFIRMED']; await startFive(ui);
          assert.equal(ui.requests.length,5,'recovery confirms the saved case, then proposes only the other four');
          assert.equal(ui.receiptCalls[4].hash,saved.hash);
          assert.equal(ui.pending(),null);
        }
      }
      const foreign={flowType:'SEVEN_FLOOR_CLAIM',plan:{type:'SEVEN_FLOOR_CLAIM'},kind:'FLOOR_CLAIM',hash:transactionHash,transaction:{from:formal.mother}};
      const ui=await mount({visible:true,guided:{pending:foreign}});
      await startFive(ui);
      assert.equal(ui.requests.length,0); assert.equal(ui.pending(),foreign);
      assert.match(ui.node('five-status').textContent,/另一流程/);
    });
    await t.test('guided original five: wallet rejection, explicit stop and external contexts never continue a send session', async () => {
      for(const code of [4001,-32603]) {
        const ui=await mount({visible:true,guided:{onRequest:()=>{throw Object.assign(Error('wallet unavailable'),{code});}}});
        await startFive(ui); assert.equal(ui.requests.length,1); assert.equal(ui.receiptCalls.length,0);
        assert.equal(Boolean(ui.pending()),code!==4001);
        assert.equal(ui.node('five-ack').checked,false);
      }
      for(const change of ['stop','accountsChanged','chainChanged','role','mode','case','background']) {
        const cfg={}, ui=await mount({visible:true,guided:cfg});
        cfg.onRequest=()=>{
          if(change==='stop') ui.node('five-stop').onclick();
          else if(change==='accountsChanged') {ui.state.accounts=[formal.jade];ui.providerListeners.get(change)([formal.jade]);}
          else if(change==='chainChanged') {ui.state.chainId=1;ui.providerListeners.get(change)('0x1');}
          else if(change==='background') ui.setVisibility('hidden');
          else {ui.node(change).value=change==='role'?'jade':change==='mode'?'cap':'';ui.node(change).emit('change');}
        };
        await startFive(ui);
        assert.equal(ui.requests.length,1,change); assert.equal(ui.receiptCalls.length,0,change); assert.ok(ui.pending(),change);
        if(['accountsChanged','chainChanged','role','mode','case'].includes(change)) assert.match(ui.node('five-chain-count').textContent,/尚未讀查/,'context clears observed rows: '+change);
        assert.equal(ui.node('five-ack').checked,false,change);
        ui.setVisibility('visible'); await settleWallet();
        assert.equal(ui.requests.length,1,'foreground never restores bulk mutation consent: '+change);
      }
    });
    await t.test('guided original five: stale preparation and silent consent changes cannot reach a wallet request', async () => {
      const cfg={}, ui=await mount({visible:true,guided:cfg}), wait=deferred();
      cfg.onPrepare=()=>wait.promise;
      ui.node('five-ack').checked=true;ui.node('five-ack').emit('change');
      const running=ui.node('five-start').onclick();
      await settleWallet();ui.pageHide();wait.resolve();await running;
      assert.equal(ui.requests.length,0);assert.equal(ui.node('five-ack').checked,false);
      assert.match(ui.node('five-chain-count').textContent,/尚未讀查/,'late preparation cannot refill observations after invalidation');
      const silent=await mount({visible:true,guided:{}});
      silent.node('five-ack').checked=true;silent.node('five-ack').emit('change');
      silent.node('amount').value='2';await silent.node('five-start').onclick();
      assert.equal(silent.requests.length,0,'bulk consent binds the original current context, even without an input event');
    });
    await t.test('guided original five: original bounded receipt waiter rechecks one hash and advances only on final evidence', async () => {
      for(const [role,phase,terminal] of [['mother','absent','CONFIRMED'],['jade','created','VERIFIED_PAID']]) {
        const ui=await mount({visible:true,role,account:formal[role],guided:{phase,results:['PENDING',terminal]}});
        await startFive(ui);
        assert.equal(ui.requests.length,5);assert.equal(ui.receiptCalls.length,6);
        assert.equal(ui.receiptCalls[0].hash,ui.receiptCalls[1].hash,'PENDING rechecks the saved hash without another request');
        assert.match(ui.node('five-paid-count').textContent,role==='jade'?/5 \/ 5/:/0 \/ 5/);
      }
    });
    await t.test('guided original five: read deadlines stop stale preparation or receipt completion and retain pending', async () => {
      for(const phase of ['prepare','receipt']) {
        const cfg={},ui=await mount({visible:true,guided:cfg}),wait=deferred();
        if(phase==='prepare') cfg.onPrepare=()=>wait.promise; else cfg.onReconcile=()=>wait.promise;
        ui.node('five-ack').checked=true;ui.node('five-ack').emit('change');
        const running=ui.node('five-start').onclick();await settleWallet();
        assert.equal(ui.connectionTimers.size,1);[...ui.connectionTimers][0]();await running;
        assert.match(ui.node('five-status').textContent,/唯讀查核逾時/);
        assert.equal(ui.node('five-ack').checked,false);
        const pending=ui.pending();wait.resolve();await settleWallet();
        assert.equal(ui.requests.length,phase==='prepare'?0:1);
        assert.equal(ui.pending(),pending,'late receipt cannot clear the durable intent after its watch expired');
        assert.equal(Boolean(pending),phase==='receipt');
        assert.match(ui.node('five-paid-count').textContent,/0 \/ 5/);
      }
    });
    await t.test("OKX foreground and cold reload only restore current authorization", async () => {
      const ui = await mount({ okxOnly: true, role: "guanyin", account: formal.guanyin, pauser: true, skipConnect: true, visible: true });
      await settleWallet();
      assert.match(ui.node("role-status").textContent, /鏈上角色讀查通過/);
      assert.ok(ui.probe.preview(), "authorized cold reload automatically reads the current pause preview");
      assert.equal(JSON.parse(ui.node("preview").textContent).unsignedTransaction.data, "0x8456cb59");
      ui.pageShow();
      assert.doesNotMatch(ui.node("preview").textContent, /0x8456cb59/);
      await settleWallet();
      assert.equal(JSON.parse(ui.node("preview").textContent).unsignedTransaction.data, "0x8456cb59");
      const wait = deferred();
      ui.wallets.at(-1).next = wait;
      const pendingPreview = ui.node("prepare").onclick();
      ui.setVisibility("hidden");
      ui.state.accounts = [alternate];
      ui.setVisibility("visible"); ui.pageShow();
      wait.resolve(); await pendingPreview;
      await settleWallet();
      assert.doesNotMatch(ui.node("preview").textContent, /0x8456cb59/);
      assert.doesNotMatch(ui.node("connection").textContent, new RegExp(formal.guanyin, "i"));
      assert.doesNotMatch(ui.node("role-status").textContent, /鏈上角色讀查通過/);
      ui.state.accounts = [formal.guanyin]; ui.state.chainId = 1;
      ui.pageShow();
      await settleWallet();
      assert.match(ui.node("connection").textContent, /chainId=1\b/);
      await ui.node("prepare").onclick();
      assert.equal(ui.probe.preview(), null);
      assert.equal(ui.requests.length, 0);
      assert.ok(ui.rpc.every(call => ["eth_accounts", "eth_chainId"].includes(call.method)));
      const revoked = await mount({ okxOnly: true, role: "guanyin", account: formal.guanyin, needsAuthorization: true, skipConnect: true, visible: true });
      await settleWallet();
      assert.match(revoked.node("role-status").textContent, /實際帳戶：尚未連接/);
      assert.ok(revoked.rpc.every(call => call.method !== "eth_requestAccounts"));
    });
    await t.test("role changes during passive OKX reread cannot restore stale wallet state", async () => {
      const wait = deferred();
      const ui = await mount({ okxOnly: true, accountsWait: wait, role: "guanyin", skipConnect: true, visible: true });
      ui.node("role").value = "mother"; ui.node("role").emit("change");
      wait.resolve([formal.mother]);
      await settleWallet();
      assert.match(ui.node("role-status").textContent, /鏈上角色讀查通過/);
      assert.match(ui.node("connection").textContent, new RegExp(formal.mother, "i"));
      assert.equal(ui.requests.length, 0);
    });
    await t.test("passive WalletConnect requires the same live previously confirmed topic and BSC grant", async () => {
      for (const options of [{ savedTopic: "cached-topic" }, { savedTopic: "old-topic" },
        { savedTopic: "cached-topic", mobileExpired: true }, { savedTopic: "cached-topic", mobileForeign: true }, {}]) {
        const ui = await mount({ mobile: true, mobileCached: true, role: "guanyin", account: formal.guanyin, pauser: true, skipConnect: true, visible: true, ...options });
        await settleWallet();
        const confirmed = options.savedTopic === "cached-topic" && !options.mobileExpired && !options.mobileForeign;
        assert.match(ui.node("role-status").textContent, confirmed ? /鏈上角色讀查通過/ : /實際帳戶：尚未連接/);
        assert.ok(ui.mobileLog.every(method => ["init", "eth_accounts", "eth_chainId"].includes(method)));
        if (!confirmed) continue;
        await ui.node("prepare").onclick();
        assert.ok(ui.probe.preview());
        ui.mobileListeners.get("disconnect")({ data: "old-topic" });
        assert.ok(ui.probe.preview(), "stale disconnect cannot remove the confirmed session");
        ui.mobile.session.namespaces.eip155.accounts = [`eip155:56:${alternate}`];
        ui.mobileListeners.get("session_update")();
        assert.equal(ui.probe.preview(), null);
        await settleWallet();
        assert.match(ui.node("role-status").textContent, /實際帳戶：尚未連接/);
        assert.equal(ui.requests.length, 0);
      }
    });

    await t.test("chain switching cannot confirm a replacement WalletConnect session", async () => {
      const ui = await mount({ mobile: true, mobileCached: true, role: "guanyin", account: formal.guanyin,
        skipConnect: true, visible: true, savedTopic: "cached-topic" });
      await settleWallet();
      ui.state.chainId = 1; ui.mobileListeners.get("chainChanged")("0x1");
      ui.mobile.session.topic = "unconfirmed-topic";
      await ui.node("switch-bsc").onclick();
      assert.equal(ui.storageFixture.getItem("kaios18888.walletconnect.confirmedTopic.v1"), "cached-topic");
      assert.match(ui.node("role-status").textContent, /實際帳戶：尚未連接/);
      assert.equal(ui.requests.length, 0);
    });

    const noLocks = await mount({ account: formal.guanyin, pauser: true, webLocks: false });
    noLocks.node("role").value = "guanyin"; noLocks.node("role").emit("change");
    await noLocks.node("prepare").onclick();
    const blockedPause = JSON.parse(noLocks.node("preview").textContent);
    assert.equal(blockedPause.plan.type, "BANK_PAUSE");
    assert.equal(blockedPause.review?.reason, "WEB_LOCKS_REQUIRED_NO_SEND");
    assert.equal(blockedPause.step.ready, false);
    assert.match(noLocks.node("summary").textContent, /缺少安全跨分頁鎖/);
    noLocks.node("ack").checked = true; noLocks.node("ack").emit("change");
    assert.equal(noLocks.node("send").disabled, true);
    await noLocks.node("send").onclick();
    assert.equal(noLocks.requests.length, 0);

    const pause = await mount({ account: formal.guanyin, pauser: true });
    pause.node("role").value = "guanyin"; pause.node("role").emit("change");
    pause.node("beneficiary").value = ""; pause.node("amount").value = "";
    await pause.node("prepare").onclick();
    assert.equal(pause.requests.length, 0, "selecting and inspecting a role never transacts");
    assert.equal(pause.probe.preview()?.plan.type, "BANK_PAUSE", "pause does not require or reuse applicant payment fields");
    pause.node("ack").checked = true; pause.node("ack").emit("change");
    await pause.node("send").onclick(); await pause.node("send").onclick();
    assert.equal(pause.requests.length, 1, "each separately acknowledged wallet confirmation requests exactly one action");
    assert.equal(pause.requests[0].plan.type, "BANK_PAUSE");
    await pause.node("receipt").onclick();
    assert.match(pause.node("summary").textContent, /暫停/);
    assert.doesNotMatch(pause.node("summary").textContent, /本案付款事件及狀態通過|VERIFIED_PAID/);

    for (const href of ["http://localhost:8080/KLINE/temples/18888/index.html",
      "https://klineodyssey.github.io.attacker.invalid/kline-odyssey/KLINE/temples/18888/index.html",
      "http://klineodyssey.github.io/kline-odyssey/KLINE/temples/18888/index.html"]) {
      const ui = await mount({ href });
      for (const name of ["native-metamask", "native-trust"]) {
        assert.equal(ui.node(name).getAttribute("href"), null, href);
        assert.equal(ui.node(name).getAttribute("aria-disabled"), "true", href);
      }
      for (const name of ["native-okx", "native-okx-app"]) {
        assert.equal(ui.node(name).getAttribute("href"), null, href);
        assert.equal(ui.node(name).getAttribute("aria-disabled"), "true", href);
        assert.equal(ui.node(name).onclick, undefined, href);
      }
      assert.equal(ui.requests.length, 0);
    }
    const publicHref = "https://klineodyssey.github.io/kline-odyssey/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/18888/index.html";
    const linked = await mount({ href: `${publicHref}?beneficiary=${beneficiary}&amount=1080000&txhash=${transactionHash}&role=guanyin#private-case` });
    for (const name of ["native-metamask", "native-trust"]) {
      const href = linked.node(name).getAttribute("href"); assert.ok(href, name);
      assert.match(href, /18888/); assert.doesNotMatch(href, /12345\.html/);
      const decoded = decodeURIComponent(href);
      for (const privateValue of [beneficiary, transactionHash, "1080000", "private-case", "role=guanyin"]) assert.equal(decoded.includes(privateValue), false, name);
    }
    assert.equal(linked.requests.length, 0, "constructing wallet links never submits a transaction");

    await t.test("all three role routes authorize explicitly, require BSC, and produce only a read-only result", async () => {
      for (const [role, route, stage] of [["mother", "native-metamask", "CAP_PROPOSE"], ["jade", "native-okx-app", "CAP_APPROVE"],
        ["guanyin", "native-okx", "BANK_PAUSE"]]) {
        const ui = await mount({ href: publicHref, role, mode: "cap", account: formal[role], pauser: role === "guanyin",
          chainId: 1, stepKind: stage, skipConnect: true, needsAuthorization: true, metaMask: role === "mother", okxOnly: role !== "mother" });
        assert.equal(ui.node(route).getAttribute("data-recommended"), "true");
        for (const button of ["prepare", "receipt", "ack", "send"]) assert.equal(ui.node(button).disabled, true, role + "/" + button);
        await ui.node("prepare").onclick();
        assert.doesNotMatch(ui.node("preview").textContent, /OFFLINE_DRAFT/);
        assert.equal(ui.rpc.length, 0);
        await ui.node(route).onclick({ preventDefault() {} });
        assert.equal(ui.rpc[0].method, "eth_requestAccounts");
        assert.match(ui.node("connect-next").textContent, /切至 BSC 56/);
        assert.equal(ui.node("prepare").disabled, true);
        await ui.node("switch-bsc").onclick();
        assert.equal(ui.node("prepare").disabled, false);
        assert.equal(ui.node("ack").disabled, true);
        await ui.node("prepare").onclick();
        const shown = JSON.parse(ui.node("preview").textContent);
        assert.equal(shown.step.kind, stage);
        assert.equal(shown.snapshot.account.toLowerCase(), formal[role].toLowerCase());
        assert.equal(shown.snapshot.chainId, 56);
        if (role === "guanyin") {
          assert.equal(shown.unsignedTransaction.data, "0x8456cb59"); assert.equal(shown.unsignedTransaction.value, "0x0");
          assert.equal(ui.node("ack").disabled, false);
        } else {
          assert.equal(shown.review?.reason, undefined);
          assert.equal(shown.step.ready, true);
          assert.equal(ui.node("ack").disabled, false);
        }
        assert.equal(ui.node("send").disabled, true);
        assert.equal(ui.requests.length, 0);
        ui.providerListeners.get("accountsChanged")([alternate]);
        assert.match(ui.node("connect-next").textContent, /已授權清單/);
        assert.equal(ui.node("prepare").disabled, true);
        assert.equal(ui.node("ack").disabled, true);
        assert.equal(ui.probe.preview(), null);
      }
    });
    await t.test("Jade cancellation auto-previews after connection and return, then needs an explicit wallet click", async () => {
      const options = { mode: "legacy-cancel", role: "jade", account: formal.jade,
        stepKind: "LEGACY_CANCEL_EXECUTE", visible: true };
      const ui = await mount(options);
      assert.equal(ui.node("beneficiary").disabled, true);
      assert.equal(ui.node("amount").disabled, true);
      assert.equal(ui.probe.preview().plan.type, "LEGACY_CAP_CANCEL");
      assert.equal(ui.probe.preview().step.kind, "LEGACY_CANCEL_EXECUTE");
      assert.equal(ui.node("ack-row").hidden, true);
      assert.equal(ui.node("ack").checked, false);
      assert.equal(ui.node("send").disabled, false);
      assert.equal(ui.requests.length, 0, "automatic preview never requests a transaction");

      const firstPreview = ui.probe.preview();
      ui.setVisibility("hidden");
      assert.equal(ui.probe.preview(), null);
      ui.setVisibility("visible");
      await new Promise(resolve => setImmediate(resolve));
      assert.ok(ui.probe.preview());
      assert.notEqual(ui.probe.preview(), firstPreview);
      assert.equal(ui.node("send").disabled, false);
      assert.equal(ui.requests.length, 0, "returning never requests a transaction");
      ui.node("mode").value = "cap";
      ui.node("mode").emit("change");
      await ui.node("send").onclick();
      assert.equal(ui.requests.length, 0);
      assert.equal(ui.node("send").disabled, true);
      assert.equal(ui.node("ack-row").hidden, false);

      ui.node("mode").value = "legacy-cancel";
      ui.node("mode").emit("change");
      await new Promise(resolve => setImmediate(resolve));
      await ui.node("send").onclick();
      assert.equal(ui.requests.length, 1);
      assert.equal(ui.requests[0].plan.type, "LEGACY_CAP_CANCEL");
      assert.equal(ui.requests[0].step.kind, "LEGACY_CANCEL_EXECUTE");
      assert.equal(ui.node("send").disabled, true, "an explicit send consumes the preview");

      for (const patch of [{ account: formal.mother }, { chainId: 1 }, { webLocks: false }, { pending: {} }]) {
        const blocked = await mount({ ...options, ...patch });
        assert.equal(blocked.node("send").disabled, true);
        await blocked.node("send").onclick();
        assert.equal(blocked.requests.length, 0);
      }
      const pending = await mount({ ...options, pending: {} });
      assert.equal(pending.node("legacy-next").href, "#funding-receipt");
      assert.match(pending.node("legacy-next-help").textContent, /待確認意圖/);
    });

    await t.test("Jade recovery checks the exact saved or reviewed approval receipt before showing the next action", async () => {
      const plan = buildLegacyCapCancelPlan();
      const approval = "0x8d8ebca221cd41f84d7e493cd9adba1430b8a14b699f9f833e39682461085a67";
      const other = "0x" + "ab".repeat(32);
      const intent = { plan, flowType: "LEGACY_CAP_CANCEL", kind: "LEGACY_CANCEL_APPROVE",
        state: "AWAITING_HUMAN_WALLET", proposalId: plan.cancellation.proposalId, transaction: { from: formal.jade } };
      const opts = { mode: "legacy-cancel", role: "jade", account: formal.jade, visible: true,
        stepKind: "LEGACY_CANCEL_EXECUTE" };
      for (const [pending, expected] of [[intent, approval], [{...intent, hash: other}, other]]) {
        const ui = await mount({ ...opts, pending, receiptResults: ["CONFIRMED"] });
        assert.deepEqual(ui.receiptCalls.map(call => call.hash), [expected]);
        assert.equal(ui.node("send").disabled, false);
        assert.equal(ui.requests.length, 0);
        assert.match(ui.node("status").textContent, /回執已核對/);
        assert.match(ui.node("preview").textContent, /previousReceipt/);
      }

      for (const [pending, expected] of [
        [{ ...intent, kind: "LEGACY_CANCEL_EXECUTE" }, /複製.*交易雜湊/],
        [{ ...intent, hash: "broken" }, /雜湊格式不正確/],
        [{ ...intent, proposalId: other }, /複製.*交易雜湊/],
        [{ ...intent, transaction: { from: formal.mother } }, /送出上一筆操作的錢包帳戶/],
      ]) {
        const ui = await mount({ ...opts, pending });
        assert.match(ui.node("legacy-next-help").textContent, expected);
        if (pending.kind === "LEGACY_CANCEL_EXECUTE") assert.equal(ui.node("legacy-next").href, "#funding-txhash");
        if (pending.hash === "broken") assert.equal(ui.node("legacy-next").hidden, true);
        assert.equal(ui.receiptCalls.length, 0);
        assert.equal(ui.node("send").disabled, true);
        assert.equal(ui.requests.length, 0);
      }

      const failed = await mount({ ...opts, pending: {...intent, hash: other}, receiptResults: ["MISMATCH", "CONFIRMED"] });
      assert.match(failed.node("legacy-next-help").textContent, /回執.*不符/);
      assert.equal(failed.node("send").disabled, true);
      failed.node("txhash").value = approval;
      await failed.node("receipt").onclick();
      assert.deepEqual(failed.receiptCalls.map(call => call.hash), [other, other], "stale typed hash never overrides the stored transaction");
      assert.equal(failed.node("send").disabled, false);
      assert.equal(failed.requests.length, 0);

      for (const leave of [ui => ui.setVisibility("hidden"), ui => ui.pageHide()]) {
        const stale = await mount({ ...opts, visible: false, pending: intent, receiptResults: ["CONFIRMED"] });
        const waiting = deferred();
        const originalWallet = stale.wallets.at(-1);
        originalWallet.nextReceipt = waiting;
        stale.setVisibility("visible");
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(stale.receiptCalls.length, 1);
        leave(stale);
        waiting.resolve();
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(originalWallet.readPending(), intent, "leaving the page cannot clear an in-flight pending intent");
        assert.equal(stale.node("send").disabled, true);
        assert.equal(stale.requests.length, 0);
      }

      const completed = await mount({ ...opts, pending: {...intent, kind: "LEGACY_CANCEL_EXECUTE", hash: other},
        receiptResults: ["LEGACY_CANCELLED"] });
      assert.equal(completed.node("legacy-next").hidden, true);
      assert.match(completed.node("legacy-next-help").textContent, /已取消/);
      assert.equal(completed.node("send").disabled, true);
      assert.equal(completed.node("send").hidden, true);
      assert.equal(completed.requests.length, 0);

      const recovered = await mount({ ...opts, pending: {...intent, kind: "LEGACY_CANCEL_EXECUTE"},
        executionHash: other, receiptResults: ["LEGACY_CANCELLED"] });
      assert.deepEqual(recovered.receiptCalls.map(call => call.hash), [other]);
      assert.equal(recovered.node("send").hidden, true);
      assert.match(recovered.node("legacy-next-help").textContent, /已取消/);

      const mined = await mount({ ...opts, pending: {...intent, hash: other},
        receiptResults: ["PENDING", "PENDING", "CONFIRMED"] });
      assert.deepEqual(mined.receiptCalls.map(call => call.hash), [other, other, other]);
      assert.equal(mined.node("send").disabled, false);
      assert.equal(mined.requests.length, 0);

      const exhausted = await mount({ ...opts, pending: {...intent, hash: other},
        receiptResults: Array(4).fill("PENDING") });
      assert.equal(exhausted.receiptCalls.length, 4);
      assert.match(exhausted.node("legacy-next-help").textContent, /仍待鏈上確認/);
      assert.equal(exhausted.node("send").hidden, true);
      assert.equal(exhausted.requests.length, 0);

      const alreadyDone = await mount({ ...opts, stepKind: "LEGACY_CANCEL_DONE", forceReady: false });
      assert.match(alreadyDone.node("summary").textContent, /鏈上顯示.*已取消/);
      assert.equal(alreadyDone.node("send").hidden, true);
      assert.equal(alreadyDone.requests.length, 0);
    });

    await t.test("funding recovery next to the acknowledgment reuses read-only controls and stops duplicate busy clicks", async () => {
      for (const options of [{mode:"fixed"}, {mode:"cap"}, {role:"guanyin",account:formal.guanyin,pauser:true}]) {
        const ui = await mount(options), wait = deferred();
        ui.node("amount").emit("input");
        assert.equal(ui.node("legacy-guide").hidden,false);
        assert.equal(ui.node("legacy-next").hidden,false);
        assert.equal(ui.node("legacy-next").href,"#funding-prepare");
        assert.match(ui.node("legacy-next").textContent,/重新唯讀核對/);
        let reading, clicks=0, prevented=0;
        ui.wallets.at(-1).next=wait;
        ui.node("prepare").click=()=>{clicks++;reading=ui.node("prepare").onclick();};
        ui.node("legacy-next").onclick({preventDefault(){prevented++;}});
        assert.equal(clicks,1);
        assert.equal(ui.node("legacy-next").attrs["aria-disabled"],"true");
        ui.node("legacy-next").onclick({preventDefault(){prevented++;}});
        assert.equal(clicks,1,"a busy recovery click cannot start another read");
        wait.resolve(); await reading;
        assert.equal(prevented,2);
        assert.equal(ui.requests.length,0,"recovery cannot request a financial confirmation");
        assert.equal(ui.node("ack").checked,false);
        assert.equal(ui.node("send").disabled,true);
        assert.equal(ui.node("legacy-next").hidden,true,"valid preview returns to the original acknowledgment");
        ui.node("wallet").emit("input");
        assert.match(ui.node("preview").textContent,/舊預覽已作廢.*下方入口/);
        assert.equal(ui.node("legacy-next").hidden,false);
        assert.equal(ui.node("legacy-next").href,"#funding-connect");
        assert.equal(ui.node("prepare").disabled,true);
        assert.equal(ui.node("ack").disabled,true);
        assert.equal(ui.requests.length,0);
      }
    });

    await t.test("funding recovery routes incorrect chain, account and pending state to the original controls", async () => {
      const chain=await mount();
      chain.state.chainId=1; chain.providerListeners.get("chainChanged")("0x1");
      assert.equal(chain.node("legacy-next").href,"#funding-switch-bsc");
      const account=await mount();
      account.state.account=alternate; account.providerListeners.get("accountsChanged")([alternate]);
      assert.equal(account.node("legacy-next").href,"#funding-account");
      const pending=await mount({forceReady:false,stepKind:"BLOCKED",stepBlockers:["PENDING_INTENT_RECONCILE_FIRST"]});
      await pending.node("prepare").onclick();
      assert.equal(pending.node("legacy-next").href,"#funding-receipt");
      for(const ui of [chain,account,pending]){
        assert.equal(ui.node("ack").checked,false); assert.equal(ui.node("send").disabled,true);
        assert.equal(ui.requests.length,0); assert.equal(ui.receiptCalls.length,0);
      }
      const original={flowType:"FIXED_ALLOCATION",kind:"ALLOCATION_PROPOSE",hash:"0x"+"12".repeat(32)};
      const saved=await mount({pending:original});
      saved.wallets.at(-1).prepare=async()=>{throw Error("PENDING_INTENT_RECONCILE_FIRST");};
      await saved.node("prepare").onclick();
      assert.equal(saved.probe.preview(),null,"a real pending preparation failure leaves no preview");
      assert.equal(saved.node("legacy-next").href,"#funding-receipt");
      assert.equal(saved.wallets.at(-1).readPending(),original,"recovery preserves the original record");
      assert.equal(saved.requests.length,0); assert.equal(saved.receiptCalls.length,0);
      saved.wallets.at(-1).readPending=()=>{throw Error("PENDING_STORAGE_CORRUPT_DO_NOT_RESEND");};
      saved.node("ack").emit("change");
      assert.equal(saved.node("legacy-next").href,"#funding-status");
      assert.match(saved.node("legacy-next").textContent,/紀錄讀取失敗/);
      assert.equal(saved.node("send").disabled,true); assert.equal(saved.requests.length,0);
    });

    await t.test("legacy cancellation gives the disconnected holder the canonical MetaMask next step", async () => {
      const href = publicHref + "?fundingRole=mother&fundingFlow=legacy-cancel#funding-panel";
      const ui = await mount({ href, lateMetaMask: true, skipConnect: true, visible: true });
      const next = ui.node("legacy-next");
      assert.equal(ui.node("legacy-guide").hidden, false);
      assert.equal(next.href, "https://link.metamask.io/dapp/" + href.slice("https://".length));
      assert.ok(ui.node("legacy-next-help").textContent.trim());
      assert.equal(ui.node("ack").disabled, true);
      assert.equal(ui.node("send").disabled, true);
      assert.equal(ui.rpc.length, 0);
    });

    await t.test("late MetaMask discovery reads authorization passively, or prompts once on the native link", async () => {
      const href = publicHref + "?fundingRole=mother&fundingFlow=legacy-cancel#funding-panel";
      const settings = { href, lateMetaMask: true, skipConnect: true, visible: true };
      const announced = await mount(settings);
      assert.equal(announced.node("prepare").disabled, true);
      announced.injectMetaMask(true);
      await new Promise(resolve => setImmediate(resolve));
      assert.match(announced.node("connection").textContent, /MetaMask.*chainId=56/);
      assert.equal(announced.node("prepare").disabled, false);
      assert.equal(announced.node("legacy-next").hidden, true);
      assert.equal(announced.node("ack").disabled, true);
      assert.equal(announced.requests.length, 0);
      assert.ok(announced.rpc.some(call => call.method === "eth_accounts"));
      assert.ok(announced.rpc.every(call => ["eth_accounts", "eth_chainId"].includes(call.method)));

      const clicked = await mount({ ...settings, needsAuthorization: true });
      clicked.injectMetaMask();
      assert.equal(clicked.rpc.length, 0);
      let cancelledNavigation = false;
      await clicked.node("native-metamask").onclick({ preventDefault() { cancelledNavigation = true; } });
      assert.equal(cancelledNavigation, true);
      assert.equal(clicked.rpc.filter(call => call.method === "eth_requestAccounts").length, 1);
      assert.match(clicked.node("connection").textContent, /MetaMask.*chainId=56/);
      assert.equal(clicked.node("prepare").disabled, false);
      assert.equal(clicked.node("ack").disabled, true);
      assert.equal(clicked.requests.length, 0);
    });

    await t.test("canonical role and flow selection survives a missing or changed scroll fragment without granting wallet authority", async () => {
      for (const hash of ["", "#funding-panel", "#funding-five"]) {
        for (const role of ["mother", "jade"]) {
          const href=publicHref+"?fundingRole="+role+"&fundingFlow=cap&txhash="+transactionHash+"&amount=888&beneficiary="+alternate+hash;
          const ui=await mount({href,skipConnect:true});
          assert.equal(ui.node("role").value,role);
          assert.equal(ui.node("mode").value,"cap");
          await ui.node("draft").onclick();
          assert.equal(JSON.parse(ui.node("preview").textContent).type,"SHARED_CAP");
          assert.equal(ui.node("txhash").value,"");
          assert.equal(ui.node("amount").value,"1080000");
          assert.equal(ui.node("beneficiary").value,beneficiary);
          assert.equal(ui.node("ack").checked,false); assert.equal(ui.node("send").disabled,true);
          assert.equal(ui.rpc.length,0); assert.equal(ui.requests.length,0);
        }
      }
      for (const href of [publicHref.replace("klineodyssey.github.io","foreign.invalid"), publicHref.replace("/18888/","/16888/")]) {
        const ui=await mount({href:href+"?fundingRole=jade&fundingFlow=cap",skipConnect:true});
        assert.equal(ui.node("role").value,"mother"); assert.equal(ui.node("mode").value,"fixed");
        assert.equal(ui.rpc.length,0); assert.equal(ui.requests.length,0);
      }
      const invalid=await mount({href:publicHref+"?fundingRole=unknown&fundingFlow=cap",skipConnect:true});
      assert.equal(invalid.node("role").value,"mother"); assert.equal(invalid.node("mode").value,"fixed");
      const unknownFlow=await mount({href:publicHref+"?fundingRole=jade&fundingFlow=send-all",skipConnect:true});
      assert.equal(unknownFlow.node("role").value,"jade"); assert.equal(unknownFlow.node("mode").value,"fixed");
      assert.equal(unknownFlow.requests.length,0);
    });

    await t.test("canonical app handoff restores only role and flow and passively reads MetaMask", async () => {
      const href = publicHref + "?fundingRole=mother&fundingFlow=cap&txhash=" + transactionHash + "#funding-panel";
      const ui = await mount({ href, metaMask: true, skipConnect: true, visible: true, accounts: [alternate, formal.mother] });
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(ui.node("role").value, "mother");
      assert.equal(ui.node("mode").value, "cap");
      assert.match(ui.node("connection").textContent, /MetaMask.*chainId=56/);
      assert.ok(ui.rpc.every(call => ["eth_accounts", "eth_chainId"].includes(call.method)));
      ui.node("account").value = formal.mother; ui.node("account").emit("change");
      await settleWallet();
      await ui.node("native-metamask").onclick({ preventDefault() {} });
      assert.equal(ui.node("account").value, formal.mother, "same provider preserves a selected non-first account");
      assert.ok(ui.rpc.every(call => ["eth_accounts", "eth_chainId"].includes(call.method)));
      await ui.node("prepare").onclick();
      assert.match(ui.node("summary").textContent, /操作帳戶/);
      const failed = deferred(); ui.wallets.at(-1).next = failed;
      const rereading = ui.node("prepare").onclick();
      failed.reject(Error("RPC_READ_UNAVAILABLE")); await rereading;
      assert.doesNotMatch(ui.node("summary").textContent, /操作帳戶/);
      assert.equal(ui.probe.preview(), null);
      assert.doesNotMatch(ui.node("native-metamask").href, /txhash/);
      ui.node("role").value = "guanyin"; ui.node("role").emit("change");
      assert.equal(ui.node("okx-route-url").value, publicHref + "?fundingRole=guanyin#funding-panel");
      assert.equal(ui.node("prepare").disabled, true);
    });

    const inApp = await mount({ href: publicHref, lateOkx: true, skipConnect: true, role: "guanyin", account: formal.guanyin, pauser: true });
    assert.equal(inApp.rpc.length, 0, "opening the page does not prompt the wallet");
    assert.equal(inApp.node("native-okx").getAttribute("aria-disabled"), "false");
    let redirected = true;
    await inApp.node("native-okx").onclick({ preventDefault() { redirected = false; } });
    assert.equal(redirected, false, "an injected wallet stays in the current app");
    assert.equal(inApp.node("okx-route").hidden, true, "connect within the standalone wallet");
    assert.equal(inApp.rpc.filter(call => call.method === "eth_requestAccounts").length, 1, "explicitly authorize the late injected wallet");
    assert.match(inApp.node("connection").textContent, /目前的 OKX 錢包.*chainId=56/);
    await inApp.node("prepare").onclick();
    assert.equal(inApp.probe.preview()?.step.kind, "BANK_PAUSE");
    assert.equal(inApp.probe.preview()?.step.ready, true);
    assert.equal(inApp.requests.length, 0, "connecting and previewing never submits a transaction");

    const firstUse = await mount({ href: publicHref, okxOnly: true, okxDirect: true, skipConnect: true, needsAuthorization: true });
    assert.equal(firstUse.node("native-okx-app").getAttribute("aria-disabled"), "false");
    await firstUse.node("native-okx-app").onclick({ preventDefault() {} });
    assert.equal(firstUse.node("okx-route").hidden, true, "connect within the main app Web3 browser");
    assert.match(firstUse.node("connection").textContent, /目前的 OKX 錢包.*chainId=56/);
    assert.equal(firstUse.rpc.filter(call => call.method === "eth_requestAccounts").length, 1, "ask once if the origin has no authorized accounts");
    assert.equal(firstUse.requests.length, 0);

    const accountWait = deferred();
    const cancelled = await mount({ href: publicHref, okxOnly: true, skipConnect: true, needsAuthorization: true, accountsWait: accountWait });
    const connecting = cancelled.node("native-okx").onclick({ preventDefault() {} });
    await Promise.resolve();
    assert.equal(cancelled.rpc.at(-1)?.method, "eth_requestAccounts", "the user gesture starts authorization directly");
    cancelled.node("cancel-connect").onclick();
    await connecting;
    accountWait.resolve([formal.guanyin]);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(cancelled.rpc.filter(call => call.method === "eth_requestAccounts").length, 1, "a cancelled request never prompts again");
    assert.equal(cancelled.node("prepare").disabled, true);
    assert.match(cancelled.node("status").textContent, /已取消本頁等待/);

    const priorRpc = linked.rpc.length;
    const externalClick = { preventDefault() { assert.fail("explicit external app launch must navigate"); } };
    assert.equal(linked.node("native-okx").href, "https://web3link.okx.com/ul/connect");
    assert.equal(linked.node("native-okx-app").href, "https://link.okx.com/ul/connect");
    await linked.node("native-okx").onclick(externalClick);
    assert.equal(linked.node("okx-route").hidden, false);
    assert.match(linked.node("okx-route-text").textContent, /獨立的 OKX Wallet App/);
    assert.equal(linked.node("okx-route-url").value, publicHref + "#funding-panel");
    assert.equal(linked.node("okx-alt-link").href, "okxwallet://web3/wallet/connect");
    await linked.node("native-okx-app").onclick(externalClick);
    assert.equal(linked.node("okx-alt-link").href, "okx://web3/wallet/connect");
    assert.match(linked.node("okx-route-text").textContent, /OKX 主 App.*Web3/);
    assert.equal(linked.node("okx-route-url").value, publicHref + "#funding-panel");
    assert.equal(linked.rpc.length, priorRpc, "do not use another provider to open an OKX route");

    const copied = [];
    const android = await mount({ href: publicHref, skipConnect: true, userAgent: "Android Chrome", clipboard: { writeText(url) { copied.push(url); } } });
    assert.equal(android.node("native-okx").href, "okxwallet://web3?stack=true");
    assert.equal(android.node("native-okx-app").href, "okx://web3?stack=true");
    await android.node("native-okx").onclick(externalClick);
    assert.equal(android.node("okx-alt-link").href, "https://web3link.okx.com/ul/connect");
    await android.node("okx-copy-url").onclick();
    assert.deepEqual(copied, [publicHref + "#funding-panel"]);
    assert.equal(android.rpc.length, 0);

    const iosChrome = await mount({ href: publicHref, skipConnect: true, userAgent: "iPhone CriOS" });
    assert.equal(iosChrome.node("native-okx").href, "okxwallet://web3/wallet/connect");
    assert.equal(iosChrome.node("native-okx-app").href, "okx://web3/wallet/connect");
  });
});


test("shared cap: beneficiary-free governance preserves original bytes, accounting and receipt locks", async (t) => {
  const api = await inlineBankApi(), { Interface } = await import("ethers"), { createHash } = await import("node:crypto");
  const F = api.FUNDING_FORMAL, plan = api.buildSharedCapPlan(), bank = new Interface(api.bankAbi), gov = new Interface(api.governanceAbi), alloc = new Interface(api.allocationAbi);
  const zero = "0x" + "0".repeat(40), tag = "0x1234", timestamp = 1_700_000_000, hash = "0x" + "11".repeat(32), blockHash = "0x" + "22".repeat(32);
  const absent = () => ({ target: zero, value: "0", dataHash: "0x" + "0".repeat(64), executableAt: "0", proposer: zero, approver: zero, executed: false, cancelled: false });
  const snapshot = () => ({ chainId: 56, account: F.mother, timestamp: String(timestamp), codeOk: true, token: F.kaios, decimals: 18,
    identityErrors: [], roles: { proposer: true, approver: false, moduleAdmin: true, allocationGovernance: true },
    module: { module: F.allocation, versionHash: F.versionHash, active: true, perTransactionLimit: "1", epochLimit: "1", epochSpent: "0", epochIndex: String(Math.floor(timestamp / 86400)) },
    health: { healthy: true, paused: false, available: "0" }, capProposal: absent() });
  const storage = () => { const map = new Map(); return { getItem: k => map.get(k) ?? null, setItem: (k,v) => map.set(k,v), removeItem: k => map.delete(k) }; };
  const make = (options = {}) => {
    const calls = [], listeners = new Map(), records = options.storage ?? storage(); let current = snapshot(), receipt = null, now = timestamp * 1000;
    const provider = { on: (event, listener) => listeners.set(event, listener), request: async ({method, params = []}) => {
      calls.push({method, params});
      if (method === "eth_sendTransaction") { if (options.rejected) throw Object.assign(Error("rejected"), {code:4001}); return hash; }
      if (method === "eth_chainId") return "0x38";
      if (method === "eth_getTransactionReceipt") return receipt;
      if (method === "eth_getTransactionByHash") { const tx = calls.find(c => c.method === "eth_sendTransaction")?.params[0]; return tx ? {...tx,input:tx.data} : null; }
      if (method === "eth_getBlockByNumber") return {number:tag,hash:options.noncanonical ? id("wrong block") : blockHash};
      throw Error(`No external RPC in cap wallet test: ${method}`);
    }};
    const wallet = new api.SharedCapWallet({provider,storage:records,now:()=>now,locks:{request:async(_key,_opts,fn)=>fn({})}});
    wallet.inspect = async () => structuredClone(current);
    return {wallet,provider,calls,listeners,storage:records,state:()=>current,change:s=>{current=s;},expire:()=>{now+=120001;},sends:()=>calls.filter(c=>c.method==="eth_sendTransaction"),
      confirm(mode="exact") {
        current.capProposal = {...absent(),target:plan.cap.target,dataHash:plan.cap.dataHash,proposer:F.mother,approver:F.jade,executed:true};
        current.module.perTransactionLimit = F.capWei; current.module.epochLimit = mode === "cap" ? "1" : F.capWei;
        if (mode === "pin") current.identityErrors = ["ALLOCATION_RUNTIME_HASH_MISMATCH"];
        if (mode === "code") current.codeOk = false;
        if (mode === "linkage") current.roles.allocationGovernance = false;
        if (mode === "module") current.module.versionHash = id("changed module version");
        if (mode === "proposer") current.capProposal.proposer = F.jade;
        if (mode === "value") current.capProposal.value = "1";
        const kind = wallet.readPending().kind, name = kind.endsWith("PROPOSE") ? "GovernanceProposalCreated" : kind.endsWith("APPROVE") ? "GovernanceProposalApproved" : "GovernanceProposalExecuted";
        const args = name === "GovernanceProposalCreated" ? [plan.cap.proposalId,plan.cap.target,plan.cap.dataHash,timestamp+3600,F.mother] : name === "GovernanceProposalApproved" ? [plan.cap.proposalId,F.jade] : [plan.cap.proposalId,plan.cap.target,mode === "hash" ? id("wrong data") : plan.cap.dataHash];
        const log = {address:mode === "emitter" ? F.bank : F.governance,...gov.encodeEventLog(gov.getEvent(name),args)};
        receipt = {status:"0x1",transactionHash:hash,blockNumber:tag,blockHash,logs:mode === "status" ? [] : [log]};
      }};
  };
  await t.test("shared-cap read-only results preserve a pending transaction and cannot be sent", async () => {
    const m = make();
    const key = api.FUNDING_STORAGE_KEY, pending = JSON.stringify({ flowType: "SHARED_CAP", state: "AWAITING_HUMAN_WALLET" });
    m.storage.setItem(key, pending);
    const result = await m.wallet.prepare();
    assert.equal(result.snapshot.account, F.mother);
    assert.equal(result.step.kind, "CAP_PROPOSE");
    assert.equal(result.step.ready, false);
    assert.ok(result.step.blockers.includes("PENDING_INTENT_RECONCILE_FIRST"));
    await assert.rejects(m.wallet.request(result), /STEP_NOT_READY/);
    assert.equal(m.storage.getItem(key), pending);
    assert.equal(m.sends().length, 0);
  });
  await t.test("original shared cap ID and inner/propose bytes are independently pinned with no case fields", () => {
    assert.equal(plan.type,"SHARED_CAP"); assert.equal(plan.chainId,56); assert.ok(Object.isFrozen(plan.cap));
    for (const key of ["beneficiary","amountKaios","amountWei","allocationId","paymentId","allocation","payout"]) assert.equal(Object.hasOwn(plan,key),false,key);
    assert.equal(plan.cap.proposalId,"0x04b32971499320d4618243fca4b1ed68e18d19181b45550922b248e9c00d37eb");
    assert.equal(plan.cap.dataHash,"0xa0c986f3a7ccd75216e4e5fb626a54aa38121d0684769deeef60d6676c33fa9a");
    const digest = data => createHash("sha256").update(Buffer.from(data.slice(2),"hex")).digest("hex");
    assert.equal(digest(plan.cap.data),"3139db4a62146c1772e02fcad3b2601d57833d57a121226cc3e3ff8dd9331840");
    assert.equal(digest(api.deriveSharedCapStep(plan,snapshot()).data),"f6b8337dfca0f65de86017bae0d83c92c7b5b81e5bd38ee4d955826619391584");
    for (const beneficiary of [F.mother,F.jade,F.guanyin]) equalInline(api.buildLifeResourcePlan({beneficiary,amount:"1080000"}).cap,plan.cap);
  });
  await t.test("real fixed-block inspector reads shared governance and three pins, never individual cases", async (t) => {
    const calls = [], token = new Interface(["function decimals() view returns(uint8)"]);
    let exposed = [F.mother], selected;
    const provider = { request:async({method,params=[]})=>{
      calls.push({method,params});
      if (method === "eth_chainId") return "0x38";
      if (method === "eth_accounts") return exposed;
      if (method === "eth_getBlockByNumber") return {number:tag,timestamp:"0x"+timestamp.toString(16)};
      if (method === "eth_getStorageAt") { assert.equal(params[1],api.FUNDING_IMPLEMENTATION_SLOT); assert.equal(params[2],tag); const pin = Object.values(api.FUNDING_RUNTIME_PINS).find(p=>p.proxy.toLowerCase()===params[0].toLowerCase()); assert.ok(pin); return "0x"+pin.implementation.slice(2).padStart(64,"0"); }
      if (method === "eth_getCode") { assert.equal(params[1],tag); return "0x6000"; }
      if (method === "eth_call") {
        assert.equal(params[1],tag); const address = params[0].to.toLowerCase();
        const iface = address===F.bank.toLowerCase()?bank:address===F.governance.toLowerCase()?gov:address===F.allocation.toLowerCase()?alloc:token;
        const parsed = iface.parseTransaction({data:params[0].data}); assert.ok(parsed);
        assert.ok(!["allocation","modulePaymentConsumed","createAllocation","executeAllocation"].includes(parsed.name),`forbidden individual-case selector ${parsed.name}`);
        if (parsed.name === "proposal") assert.equal(parsed.args[0],plan.cap.proposalId,"only the shared cap proposal can be read");
        const values = {kaios:[F.kaios],decimals:[18],module:[[F.allocation,F.versionHash,1,1,0,Math.floor(timestamp/86400),true]],bankHealth:[0,0,0,0,0,true,false],
          proposal:[[zero,0,"0x"+"0".repeat(64),0,zero,zero,false,false]],hasRole:[true],bank:[F.bank],governanceDelay:[3600]};
        assert.ok(Object.hasOwn(values,parsed.name),parsed.name); return iface.encodeFunctionResult(parsed.name,values[parsed.name]);
      }
      throw Error(`Forbidden shared inspector RPC: ${method}`);
    }};
    const wallet = new api.SharedCapWallet({provider,storage:storage(),selectedAccount:()=>selected,locks:{request:async(_key,_opts,fn)=>fn({})}});
    const state = await wallet.inspect(plan);
    assert.equal(calls.filter(c=>c.method==="eth_getStorageAt").length,3);
    assert.equal(calls.filter(c=>c.method==="eth_call" && c.params[0].data.startsWith(gov.getFunction("proposal").selector)).length,1);
    assert.ok(state.identityErrors.length>=3,"synthetic runtime bytes must fail the actual reviewed pins");
    assert.equal(api.deriveSharedCapStep(plan,state).ready,false);
    for (const key of ["allocationProposal","allocation","paymentConsumed"]) assert.equal(Object.hasOwn(state,key),false,key);
    equalInline(state.health,{balance:"0",reserve:"0",available:"0",accountedInflow:"0",totalOutflow:"0",healthy:true,paused:false});
    assert.equal(calls.some(c=>/send|sign/i.test(c.method)),false);
    await t.test("selected second account supplies role reads and silent revocation blocks a ready request", async () => {
      calls.length = 0; exposed = [F.mother,F.jade]; selected = F.jade;
      assert.equal((await wallet.inspect(plan)).account,F.jade);
      const roleReads = calls.filter(c=>c.method==="eth_call" && c.params[0].to===F.governance)
        .map(c=>gov.parseTransaction({data:c.params[0].data})).filter(c=>c.name==="hasRole");
      assert.equal(roleReads.length,2);
      assert.ok(roleReads.every(c=>c.args[1]===F.jade), "role lookup must use the selected account, not the first exposed account");

      // Seed only the reviewed preflight snapshot. The actual send-time
      // inspector below must detect account loss without a provider event.
      selected = F.mother; exposed = [F.jade,F.mother];
      const inspect = wallet.inspect;
      wallet.inspect = async () => snapshot();
      const preview = await wallet.prepare();
      wallet.inspect = inspect;
      assert.equal(preview.step.ready,true);
      calls.length = 0; exposed = [F.jade];
      await assert.rejects(wallet.request(preview),/CONNECT_EXISTING_HOLDER_EXPLICITLY/);
      assert.equal(calls.some(c=>/send|sign/i.test(c.method)),false);
      assert.equal(wallet.readPending(),null);
    });
  });
  await t.test("unknown identity, accounting, roles, cap lowering and current UTC spend fail closed", () => {
    assert.equal(api.deriveSharedCapStep(plan,snapshot()).kind,"CAP_PROPOSE");
    for (const mutate of [s=>{s.chainId=1;},s=>{s.account=F.guanyin;},s=>{s.codeOk=false;},s=>{s.token=F.bank;},s=>{s.decimals=6;},
      s=>{s.identityErrors=["PIN_MISMATCH"];},s=>{delete s.identityErrors;},s=>{s.roles.proposer=false;},s=>{s.roles.moduleAdmin=false;},s=>{s.roles.allocationGovernance=false;},
      s=>{s.health.paused=true;},s=>{s.health.healthy=false;},s=>{s.module.active=false;},s=>{s.module.versionHash=id("wrong version");},
      s=>{s.module.perTransactionLimit=String(BigInt(F.capWei)+1n);},s=>{s.module.epochSpent="1";},s=>{delete s.module.epochSpent;},s=>{delete s.capProposal;},s=>{delete s.capProposal.cancelled;}]) {
      const state=snapshot();mutate(state);assert.equal(api.deriveSharedCapStep(plan,state).ready,false);
    }
    const old=snapshot();old.module.epochSpent="1";old.module.epochIndex=String(Math.floor(timestamp/86400)-1);
    assert.equal(api.deriveSharedCapStep(plan,old).ready,true,"old UTC epoch does not erase current-day spending");
    const done=snapshot();done.module.perTransactionLimit=done.module.epochLimit=F.capWei;
    const step=api.deriveSharedCapStep(plan,done);assert.equal(step.kind,"CAP_ALREADY_CONFIGURED");assert.equal(step.ready,false);
    assert.equal(api.deriveSharedCapStep({...plan,beneficiary:F.mother},snapshot()).ready,false);
  });
  await t.test("only exact distinct Jade approval and chain ETA advance the original proposal", () => {
    const state=snapshot();state.capProposal={...absent(),target:plan.cap.target,dataHash:plan.cap.dataHash,proposer:F.mother,executableAt:String(timestamp+3600)};
    assert.equal(api.deriveSharedCapStep(plan,state).ready,false);
    state.account=F.jade;state.roles.approver=true;assert.equal(api.deriveSharedCapStep(plan,state).kind,"CAP_APPROVE");
    state.capProposal.approver=F.jade;assert.equal(api.deriveSharedCapStep(plan,state).kind,"WAIT_ETA");
    state.capProposal.executableAt=String(timestamp);assert.equal(api.deriveSharedCapStep(plan,state).kind,"CAP_EXECUTE");
    for(const patch of [{dataHash:id("wrong")},{proposer:F.jade},{approver:F.mother},{cancelled:true},{executed:true},{target:F.allocation}]) {
      assert.equal(api.deriveSharedCapStep(plan,{...state,capProposal:{...state.capProposal,...patch}}).ready,false,JSON.stringify(patch));
    }
  });
  await t.test("fresh state, generation, expiry, locks and wallet refusal never bypass one explicit send", async () => {
    for(const mutate of [m=>{m.state().account=F.jade;},m=>{m.state().chainId=1;},m=>{m.state().module.epochSpent="1";},m=>{m.state().identityErrors=["PIN_CHANGED"];},m=>m.wallet.invalidate(),m=>m.expire(),m=>m.listeners.get("accountsChanged")([F.jade])]) {
      const m=make(),preview=await m.wallet.prepare();assert.equal(preview.step.ready,true);mutate(m);await assert.rejects(m.wallet.request(preview));assert.equal(m.sends().length,0);assert.equal(m.wallet.readPending(),null);
    }
    const held=make();held.wallet.locks={request:async(_key,_opts,fn)=>fn(null)};await assert.rejects(held.wallet.request(await held.wallet.prepare()));assert.equal(held.sends().length,0);
    const rejected=make({rejected:true});await assert.rejects(rejected.wallet.request(await rejected.wallet.prepare()));assert.equal(rejected.sends().length,1);assert.equal(rejected.wallet.readPending(),null);
    const exact=make(),preview=await exact.wallet.prepare();await Promise.allSettled([exact.wallet.request(preview),exact.wallet.request(preview)]);assert.equal(exact.sends().length,1);
    assert.equal(exact.wallet.readPending().flowType,"SHARED_CAP");
    equalInline(exact.sends()[0].params[0],{from:F.mother,to:F.governance,data:api.deriveSharedCapStep(plan,snapshot()).data,value:"0x0",chainId:"0x38"});
  });
  await t.test("all five flows and unknown pending types remain isolated before provider reads", async () => {
    const flows=[[api.SharedCapWallet,plan,"CAP_PROPOSE"],[api.LegacyCapCancelWallet,api.buildLegacyCapCancelPlan(),"LEGACY_CANCEL_PROPOSE"],[api.HumanFundingWallet,api.buildLifeResourcePlan({beneficiary:F.mother,amount:"1"}),"CAP_PROPOSE"],
      [api.HumanBankPauseWallet,api.buildBankPausePlan(),"BANK_PAUSE"],[api.SevenFloorClaimWallet,api.buildSevenFloorPlan({characterId:id("CAP-ISOLATION"),floor:1,amount:"1"}),"FLOOR_CLAIM"]];
    for(const[Owner,ownerPlan,kind]of flows)for(const[Other]of flows)if(Owner!==Other){
      const records=storage(),raw=JSON.stringify({plan:ownerPlan,kind});records.setItem(api.FUNDING_STORAGE_KEY,raw);
      const wallet=new Other({storage:records,locks:{request:async(_k,_o,fn)=>fn({})},provider:{request(){throw Error("NO_RPC");}}});
      await assert.rejects(wallet.reconcile(hash),/PENDING_OTHER_FLOW/);assert.equal(records.getItem(api.FUNDING_STORAGE_KEY),raw);
    }
    for(const pending of [{plan:{...plan,type:"UNKNOWN"},kind:"CAP_PROPOSE"},{plan,kind:"PAYOUT"},{plan,kind:"CAP_PROPOSE",transaction:{}}]) {
      const m=make();m.storage.setItem(api.FUNDING_STORAGE_KEY,JSON.stringify(pending));await assert.rejects(m.wallet.reconcile(hash),/UNKNOWN_TRANSACTION_FLOW|PENDING_TRANSACTION_INVALID/);assert.equal(m.calls.length,0);assert.ok(m.wallet.readPending());
    }
  });
  await t.test("automatic reconciliation binds the stored intent under the lock and retains it after invalidation", async () => {
    const m = make();
    await m.wallet.request(await m.wallet.prepare());
    const pending = JSON.stringify(m.wallet.readPending());
    m.confirm();
    m.storage.setItem(api.FUNDING_STORAGE_KEY, JSON.stringify({...m.wallet.readPending(), hash:undefined, intentId:"replacement"}));
    const before = m.calls.length;
    assert.equal((await m.wallet.reconcile(hash, {pending, isCurrent:()=>true})).status, "WATCH_STOPPED");
    assert.equal(m.calls.length, before);
    assert.equal(m.wallet.readPending().intentId, "replacement");
    m.storage.setItem(api.FUNDING_STORAGE_KEY, pending);
    let checks = 0;
    assert.equal((await m.wallet.reconcile(hash, {pending, isCurrent:()=>++checks === 1})).status, "WATCH_STOPPED");
    assert.equal(m.storage.getItem(api.FUNDING_STORAGE_KEY), pending);
    assert.equal(m.sends().length, 1);
  });
  await t.test("exact canonical governance receipts confirm only cap steps; failed pins and effects retain pending", async () => {
    for(const kind of ["CAP_PROPOSE","CAP_APPROVE","CAP_EXECUTE"])for(const mode of ["exact","status","hash","emitter","pin","code","linkage","module","proposer","value","cap","canonical"]) {
      if ((mode==="hash"||mode==="cap") && kind!=="CAP_EXECUTE") continue;
      const m=make({noncanonical:mode==="canonical"}),state=m.state();
      if(kind!=="CAP_PROPOSE") {state.capProposal={...absent(),target:plan.cap.target,dataHash:plan.cap.dataHash,proposer:F.mother,executableAt:String(timestamp)};state.account=F.jade;state.roles.approver=true;}
      if(kind==="CAP_EXECUTE")state.capProposal.approver=F.jade;
      const preview=await m.wallet.prepare();assert.equal(preview.step.kind,kind);await m.wallet.request(preview);m.confirm(mode);
      const result=await m.wallet.reconcile(hash);assert.equal(result.status,mode==="exact"?"CONFIRMED":"MISMATCH",`${kind}/${mode}`);
      assert.notEqual(result.status,"VERIFIED_PAID");assert.equal(m.wallet.readPending()===null,mode==="exact");assert.equal(m.sends().length,1);
    }
  });
});

test("legacy cap cancellation: fixed self-call, distinct holders and old proposal races", async (t) => {
  const api = await inlineBankApi();
  const { Interface, ZeroAddress, ZeroHash } = await import("ethers");
  const F = api.FUNDING_FORMAL;
  const plan = api.buildLegacyCapCancelPlan();
  const { original, cancellation } = plan;
  const gov = new Interface(api.governanceAbi);
  const timestamp = 1794165839;
  const blockNumber = "0x7e50ce3";
  const blockHash = id("legacy cancel receipt block");
  const transactionHash = id("legacy cancel wallet transaction");
  const absent = () => ({
    target: ZeroAddress, value: "0", dataHash: ZeroHash, executableAt: "0",
    proposer: ZeroAddress, approver: ZeroAddress, executed: false, cancelled: false,
  });
  const snapshot = () => ({
    chainId: 56, account: F.mother, blockNumber, blockHash, timestamp: String(timestamp),
    codeOk: true, identityErrors: [], roles: { proposer: true, approver: false, governanceAdmin: true },
    originalProposal: {
      target: original.target, value: "0", dataHash: original.dataHash,
      executableAt: String(original.executableAt), proposer: F.mother, approver: F.jade,
      executed: false, cancelled: false,
    },
    cancellationProposal: absent(), delay: "3600",
  });
  const afterPropose = () => {
    const s = snapshot();
    s.account = F.jade;
    s.roles.proposer = false;
    s.roles.approver = true;
    s.cancellationProposal = {
      ...absent(), target: cancellation.target, dataHash: cancellation.dataHash,
      proposer: F.mother, executableAt: String(timestamp + 3600),
    };
    return s;
  };
  const afterApprove = () => {
    const s = afterPropose();
    s.cancellationProposal.approver = F.jade;
    return s;
  };
  const atEta = () => {
    const s = afterApprove();
    s.timestamp = s.cancellationProposal.executableAt;
    return s;
  };
  const derive = state => api.deriveLegacyCapCancelStep(plan, state);
  const encoded = (name, args) => gov.encodeFunctionData(name, args);

  await t.test("canonical plan pins the old cap and its only zero-value governance self-call", () => {
    assert.equal(plan.type, "LEGACY_CAP_CANCEL");
    assert.equal(plan.chainId, 56);
    assert.equal(original.proposalId, "0xc0d6f14daa902e7a74bf3cd93e0a842297760895abff63bc02adaa2716933ab7");
    assert.equal(original.target, F.bank);
    assert.equal(original.dataHash, "0x42c66729ff7bb242fc7bb7401248b15772cce26e523ed5f86e4541d01d07861d");
    assert.equal(String(original.executableAt), "1788108660");
    assert.equal(cancellation.proposalId, "0xe14e7f573c2ee8a1f7a0e598dc7fff2c13c36c2e20de55845e3ba1f924110b07");
    assert.equal(cancellation.target, F.governance);
    assert.equal(cancellation.data, new Interface(["function cancel(bytes32)"]).encodeFunctionData("cancel", [original.proposalId]));
    assert.equal(cancellation.dataHash, "0xc53b67431b1546ed0b55b5b8c0393562801738ee52eccad49990fa9063b8f1fc");
    assert.equal(keccak256(cancellation.data), cancellation.dataHash);
    for (const key of ["beneficiary", "allocationId", "paymentId", "cap", "allocation", "payout"]) {
      assert.equal(Object.hasOwn(plan, key), false, key);
    }
    const step = derive(snapshot());
    assert.equal(step.kind, "LEGACY_CANCEL_PROPOSE");
    assert.equal(step.ready, true);
    assert.equal(step.to, F.governance);
    assert.equal(step.data, encoded("propose", [cancellation.proposalId, F.governance, 0, cancellation.data]));
  });

  await t.test("independent Jade approval and the chain ETA advance the only cancellation", () => {
    const approval = derive(afterPropose());
    assert.equal(approval.kind, "LEGACY_CANCEL_APPROVE");
    assert.equal(approval.ready, true);
    assert.equal(approval.data, encoded("approve", [cancellation.proposalId]));
    const justBeforeEta = afterApprove();
    justBeforeEta.timestamp = String(timestamp + 3599);
    const waiting = derive(justBeforeEta);
    assert.equal(waiting.kind, "WAIT_ETA");
    assert.equal(waiting.ready, false);
    const ready = atEta();
    const execution = derive(ready);
    assert.equal(execution.kind, "LEGACY_CANCEL_EXECUTE");
    assert.equal(execution.ready, true);
    assert.equal(execution.data, encoded("execute", [cancellation.proposalId, cancellation.data]));
    ready.originalProposal.cancelled = true;
    ready.cancellationProposal.executed = true;
    const done = derive(ready);
    assert.equal(done.kind, "LEGACY_CANCEL_DONE");
    assert.equal(done.ready, false);
  });

  await t.test("wrong account, changed proposal, closed original, and unavailable chain state fail closed", () => {
    const mutations = [
      ["wrong chain", s => { s.chainId = 1; }],
      ["wrong proposer wallet", s => { s.account = F.guanyin; }],
      ["proposer role lost", s => { s.roles.proposer = false; }],
      ["missing self admin", s => { s.roles.governanceAdmin = false; }],
      ["code mismatch", s => { s.codeOk = false; }],
      ["unknown code pin", s => { s.identityErrors = ["GOVERNANCE_RUNTIME_HASH_MISMATCH"]; }],
      ["delay changed", s => { s.delay = "0"; }],
      ["old not yet mature", s => { s.timestamp = String(Number(original.executableAt) - 1); }],
      ["old target changed", s => { s.originalProposal.target = F.allocation; }],
      ["old value changed", s => { s.originalProposal.value = "1"; }],
      ["old data changed", s => { s.originalProposal.dataHash = id("foreign cap"); }],
      ["old proposer changed", s => { s.originalProposal.proposer = F.jade; }],
      ["old approver changed", s => { s.originalProposal.approver = F.mother; }],
      ["old execution won the race", s => { s.originalProposal.executed = true; }],
      ["old already cancelled", s => { s.originalProposal.cancelled = true; }],
      ["old missing", s => { s.originalProposal = absent(); }],
      ["cancellation state unknown", s => { delete s.cancellationProposal; }],
    ];
    for (const [label, mutate] of mutations) {
      const state = snapshot();
      mutate(state);
      assert.equal(derive(state).ready, false, label);
    }
    for (const patch of [
      { target: F.bank }, { value: "1" }, { dataHash: id("foreign cancellation") },
      { proposer: F.jade }, { approver: F.mother }, { cancelled: true }, { executed: true },
    ]) {
      const s = afterPropose();
      Object.assign(s.cancellationProposal, patch);
      assert.equal(derive(s).ready, false, JSON.stringify(patch));
    }
    const wrongApprover = afterPropose();
    wrongApprover.account = F.mother;
    assert.equal(derive(wrongApprover).ready, false);
    assert.equal(api.deriveLegacyCapCancelStep({
      ...plan, cancellation: { ...cancellation, data: encoded("approve", [original.proposalId]) },
    }, snapshot()).ready, false);
  });

  const mockGovernanceRuntime = "0x600160005260206000f3";
  const walletFixture = (current = snapshot(), Wallet = api.LegacyCapCancelWallet, { realInspect = false } = {}) => {
    const calls = [];
    const storage = new Map();
    const records = {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key),
    };
    let receipt = null, executionLogs = [], runtime = mockGovernanceRuntime, canonicalHash = blockHash;
    let latestHash = blockHash, reorgDuringStateReads = false;
    const provider = {
      request: async ({ method, params = [] }) => {
        calls.push({ method, params });
        if (method === "eth_sendTransaction") return transactionHash;
        if (method === "eth_chainId") return "0x38";
        if (method === "eth_accounts") return [current.account];
        if (method === "eth_getTransactionReceipt") return receipt;
        if (method === "eth_getLogs") {
          assert.equal(params[0].address, F.governance);
          assert.equal(params[0].toBlock, current.blockNumber);
          assert.deepEqual(Array.from(params[0].topics), [gov.getEvent("GovernanceProposalExecuted").topicHash, cancellation.proposalId]);
          return executionLogs;
        }
        if (method === "eth_getTransactionByHash") {
          const sent = calls.find(call => call.method === "eth_sendTransaction")?.params[0];
          return sent ? { ...sent, input: sent.data } : null;
        }
        if (method === "eth_getBlockByNumber") {
          if (params[0] !== "latest" || !realInspect) assert.equal(params[0], blockNumber);
          const hash = params[0] === "latest" ? latestHash : canonicalHash;
          return { number: blockNumber, hash, timestamp: "0x" + BigInt(current.timestamp).toString(16) };
        }
        const pin = api.FUNDING_RUNTIME_PINS.governance;
        if (method === "eth_getStorageAt") {
          assert.deepEqual(Array.from(params), [F.governance, api.FUNDING_IMPLEMENTATION_SLOT, blockNumber]);
          return "0x" + pin.implementation.slice(2).padStart(64, "0");
        }
        if (method === "eth_getCode") {
          assert.equal(params[0].toLowerCase(), pin.implementation);
          assert.equal(params[1], blockNumber);
          return runtime;
        }
        if (method === "eth_call") {
          assert.equal(params[0].to, F.governance);
          assert.equal(params[1], blockNumber);
          if (reorgDuringStateReads) canonicalHash = id("changed block during legacy proposal reads");
          const decoded = gov.parseTransaction({ data: params[0].data });
          if (decoded.name === "proposal") {
            assert.ok([original.proposalId, cancellation.proposalId].includes(decoded.args[0]));
            const state = decoded.args[0] === original.proposalId ? current.originalProposal : current.cancellationProposal;
            return gov.encodeFunctionResult("proposal", [[state.target, state.value, state.dataHash, state.executableAt,
              state.proposer, state.approver, state.executed, state.cancelled]]);
          }
          if (decoded.name === "bank") return gov.encodeFunctionResult("bank", [F.bank]);
          if (decoded.name === "governanceDelay") return gov.encodeFunctionResult("governanceDelay", [current.delay]);
          assert.equal(decoded.name, "hasRole");
          const [role, account] = decoded.args;
          if (role === ZeroHash) {
            assert.equal(account, F.governance);
            return gov.encodeFunctionResult("hasRole", [current.roles.governanceAdmin]);
          }
          assert.ok(realInspect, "receipt verification reads the governance self-admin role only");
          assert.equal(account, current.account);
          assert.ok([id("PROPOSER_ROLE"), id("APPROVER_ROLE")].includes(role));
          return gov.encodeFunctionResult("hasRole", [role === id("PROPOSER_ROLE") ? current.roles.proposer : current.roles.approver]);
        }
        throw Error(`No external RPC in legacy cancellation test: ${method}`);
      },
    };
    const wallet = new Wallet({
      provider, storage: records, now: () => timestamp * 1000,
      locks: { request: async (_key, _options, fn) => fn({}) },
    });
    if (!realInspect) wallet.inspect = async () => structuredClone(current);
    return {
      wallet, setReceipt: value => { receipt = value; },
      setExecutionLogs: value => { executionLogs = value; },
      logReads: () => calls.filter(call => call.method === "eth_getLogs").length,
      setLatestHash: value => { latestHash = value; },
      reorgDuringStateReads: () => { reorgDuringStateReads = true; },
      changeRuntime: () => { runtime = "0x6000"; },
      changeCanonicalHash: () => { canonicalHash = id("changed receipt block"); },
      sends: () => calls.filter(call => call.method === "eth_sendTransaction"),
    };
  };

  await t.test("an old-proposal race blocks the fresh send, while one explicit confirmation stays zero-value", async () => {
    const raced = snapshot();
    const blocked = walletFixture(raced);
    const preview = await blocked.wallet.prepare();
    assert.equal(preview.step.ready, true);
    assert.equal(blocked.sends().length, 0);
    raced.originalProposal.executed = true;
    await assert.rejects(blocked.wallet.request(preview));
    assert.equal(blocked.sends().length, 0);
    assert.equal(blocked.wallet.readPending(), null);

    const exact = walletFixture();
    const ready = await exact.wallet.prepare();
    await Promise.allSettled([exact.wallet.request(ready), exact.wallet.request(ready)]);
    assert.equal(exact.sends().length, 1);
    assert.equal(exact.wallet.readPending().flowType, "LEGACY_CAP_CANCEL");
    equalInline(exact.sends()[0].params[0], {
      from: F.mother, to: F.governance, chainId: "0x38", value: "0x0",
      data: encoded("propose", [cancellation.proposalId, F.governance, 0, cancellation.data]),
    });
  });

  await t.test("legacy preview needs a valid block hash that survives the fixed-block reads", async () => {
    const { LegacyCapCancelWallet } = await inlineBankApi({ mockGovernanceRuntime });
    const fixture = () => walletFixture(snapshot(), LegacyCapCancelWallet, { realInspect: true });
    const exact = fixture();
    assert.equal((await exact.wallet.prepare()).step.kind, "LEGACY_CANCEL_PROPOSE");
    assert.equal(exact.sends().length, 0);
    for (const hash of [undefined, ZeroHash]) {
      const invalid = fixture();
      invalid.setLatestHash(hash);
      await assert.rejects(invalid.wallet.prepare(), /BLOCK/);
      assert.equal(invalid.sends().length, 0);
    }
    const reorg = fixture();
    reorg.reorgDuringStateReads();
    await assert.rejects(reorg.wallet.prepare(), /BLOCK|FRESH_STATE/);
    assert.equal(reorg.sends().length, 0);
    assert.equal(reorg.wallet.readPending(), null);
  });

  await t.test("hashless cancellation only searches for the exact execution after verified on-chain completion", async () => {
    const state = atEta();
    state.blockNumber = "0x" + (132778867 + 5000).toString(16);
    const { wallet, setExecutionLogs, logReads, sends } = walletFixture(state);
    const log = { address: F.governance, topics: [gov.getEvent("GovernanceProposalExecuted").topicHash, cancellation.proposalId], transactionHash };
    setExecutionLogs([log]);
    assert.equal(await wallet.findExecutionHash(plan), undefined);
    assert.equal(logReads(), 0);
    state.originalProposal.cancelled = true;
    assert.equal(await wallet.findExecutionHash(plan), undefined);
    assert.equal(logReads(), 0);
    state.cancellationProposal.executed = true;
    assert.equal(await wallet.findExecutionHash(plan), transactionHash);
    for (const logs of [[{ ...log, removed: true }], [{ ...log, topics: [log.topics[0], original.proposalId] }], [log, log]]) {
      setExecutionLogs(logs);
      assert.equal(await wallet.findExecutionHash(plan), undefined);
    }
    assert.equal(logReads(), 4);
    assert.equal(sends().length, 0);
    assert.equal(wallet.readPending(), null);
  });

  await t.test("cancellation reconciliation needs both exact governance events and exact receipt-block state", async () => {
    const { LegacyCapCancelWallet } = await inlineBankApi({ mockGovernanceRuntime });
    const event = (name, args, address = F.governance) => ({
      address, ...gov.encodeEventLog(gov.getEvent(name), args),
    });
    const execution = event("GovernanceProposalExecuted", [cancellation.proposalId, F.governance, cancellation.dataHash]);
    const cancelled = event("GovernanceProposalCancelled", [original.proposalId]);
    for (const mode of ["both", "only-execution", "wrong-old-id", "wrong-emitter", "old-open", "outer-open", "pin", "noncanonical", "reorg-during-read"]) {
      const state = atEta();
      const m = walletFixture(state, LegacyCapCancelWallet);
      const preview = await m.wallet.prepare();
      assert.equal(preview.step.kind, "LEGACY_CANCEL_EXECUTE");
      await m.wallet.request(preview);
      state.originalProposal.cancelled = mode !== "old-open";
      state.cancellationProposal.executed = mode !== "outer-open";
      const cancelEvent = mode === "wrong-old-id" ? event("GovernanceProposalCancelled", [cancellation.proposalId])
        : mode === "wrong-emitter" ? { ...cancelled, address: F.bank } : cancelled;
      const logs = mode === "only-execution" ? [execution] : [cancelEvent, execution];
      if (mode === "pin") m.changeRuntime();
      if (mode === "noncanonical") m.changeCanonicalHash();
      if (mode === "reorg-during-read") m.reorgDuringStateReads();
      m.setReceipt({ status: "0x1", transactionHash, blockNumber, blockHash, logs });
      assert.equal((await m.wallet.reconcile(transactionHash)).status, mode === "both" ? "LEGACY_CANCELLED" : "MISMATCH", mode);
      assert.equal(m.wallet.readPending() === null, mode === "both", mode);
      assert.equal(m.sends().length, 1);
    }
  });
});

test("bank pause wallet: only verified Guanyin can request one pause and receipts never imply payment", async (t) => {
  const { Interface } = await import("ethers");
  const { FUNDING_FORMAL: formal, FUNDING_RUNTIME_PINS, FUNDING_IMPLEMENTATION_SLOT,
    FUNDING_STORAGE_KEY, FUNDING_LOCK_KEY, buildBankPausePlan, deriveBankPauseStep,
    HumanBankPauseWallet, HumanFundingWallet, buildLifeResourcePlan } =
    await inlineBankApi();
  const compiled = await compiledArchivedBank(), bank = new Interface(compiled.abi);
  const pin = FUNDING_RUNTIME_PINS.bank;
  const runtime = patchBankTestSelfAddress(compiled.deployedBytecode, compiled.immutableReferences, pin.implementation);
  const timestamp = 1_700_000_000, tag = "0x1234", hash = `0x${"71".repeat(32)}`, blockHash = `0x${"72".repeat(32)}`;
  const make = (options = {}) => {
    const calls = [], locks = [], records = new Map(), listeners = new Map();
    const state = { chainId: 56, account: formal.guanyin, pauser: true, paused: false, pinFault: null };
    let receipt = null, now = timestamp * 1000;
    const storage = { getItem: key => records.get(key) ?? null,
      setItem: (key, value) => records.set(key, value), removeItem: key => records.delete(key) };
    const provider = { on: (name, listener) => listeners.set(name, listener), request: async ({ method, params = [] }) => {
      calls.push({ method, params });
      if (method === "eth_chainId") return `0x${state.chainId.toString(16)}`;
      if (method === "eth_accounts") return [state.account];
      if (method === "eth_getBlockByNumber") return { number: tag, timestamp: `0x${timestamp.toString(16)}`,
        hash: options.noncanonical ? `0x${"73".repeat(32)}` : blockHash };
      if (method === "eth_getStorageAt") {
        assert.equal(params[0].toLowerCase(), formal.bank.toLowerCase(), "pause must not depend on Allocation/Governance implementation slots");
        assert.equal(params[1], FUNDING_IMPLEMENTATION_SLOT); assert.equal(params[2], tag);
        if (state.pinFault === "unknown") throw Error("OFFLINE_BANK_SLOT_UNKNOWN");
        const implementation = state.pinFault === "implementation" ? formal.allocation : pin.implementation;
        return `0x${implementation.slice(2).toLowerCase().padStart(64, "0")}`;
      }
      if (method === "eth_getCode") {
        assert.equal(params[1], tag);
        if (state.pinFault === "implementation") return "0x6000";
        assert.equal(params[0].toLowerCase(), pin.implementation.toLowerCase());
        return state.pinFault === "runtime" ? "0x6000" : runtime;
      }
      if (method === "eth_call") {
        assert.equal(params[0].to.toLowerCase(), formal.bank.toLowerCase()); assert.equal(params[1], tag);
        const parsed = bank.parseTransaction({ data: params[0].data }); assert.ok(parsed);
        if (parsed.name === "hasRole") {
          assert.equal(parsed.args[0], id("PAUSER_ROLE")); assert.equal(parsed.args[1].toLowerCase(), state.account.toLowerCase());
          return bank.encodeFunctionResult("hasRole", [state.pauser]);
        }
        if (parsed.name === "paused") return bank.encodeFunctionResult("paused", [state.paused]);
        throw Error(`Pause must not query unrelated state: ${parsed.name}`);
      }
      if (method === "eth_sendTransaction") {
        if (options.rejected) throw Object.assign(Error("OFFLINE_WALLET_REJECTED"), { code: 4001 });
        return hash;
      }
      if (method === "eth_getTransactionReceipt") return receipt;
      if (method === "eth_getTransactionByHash") {
        const sent = calls.find(call => call.method === "eth_sendTransaction")?.params[0];
        return sent ? { ...sent, input: sent.data, blockNumber: tag, blockHash } : null;
      }
      throw Error(`Forbidden offline pause RPC: ${method}`);
    } };
    const lockManager = { request: async (name, config, callback) => { locks.push({ name, config }); return callback({ name }); } };
    const wallet = new HumanBankPauseWallet({ provider, storage, locks: lockManager, now: () => now });
    return { wallet, provider, storage, state, calls, locks, listeners, lockManager,
      sends: () => calls.filter(call => call.method === "eth_sendTransaction"),
      expire: () => { now += 120001; },
      confirm: (mode = "exact") => {
        state.paused = mode !== "state-not-paused";
        const actor = mode === "wrong-actor" ? formal.mother : formal.guanyin;
        const log = { address: mode === "wrong-emitter" ? formal.allocation : formal.bank,
          ...bank.encodeEventLog(bank.getEvent("BankPaused"), [actor]) };
        receipt = { transactionHash: hash, status: "0x1", blockNumber: tag, blockHash,
          logs: mode === "status-only" ? [] : [log] };
      },
    };
  };
  await t.test("canonical pause targets only Bank.pause and incomplete role/pin/state never grants authority", async () => {
    const plan = buildBankPausePlan();
    assert.equal(plan.type, "BANK_PAUSE"); assert.equal(plan.chainId, 56); assert.ok(Object.isFrozen(plan));
    assert.equal(plan.pause.to, formal.bank); assert.equal(plan.pause.data, bank.encodeFunctionData("pause"));
    const valid = make(), inspected = await valid.wallet.inspect(plan);
    assert.equal(deriveBankPauseStep(plan, inspected).ready, true);
    assert.equal(inspected.account.toLowerCase(), formal.guanyin.toLowerCase());
    assert.equal(inspected.roles.pauser, true); assert.equal(inspected.paused, false);
    for (const change of [
      s => { s.chainId = 1; }, s => { s.account = formal.mother; }, s => { s.roles.pauser = false; },
      s => { s.roles = {}; }, s => { s.roles = null; }, s => { s.codeOk = false; },
      s => { s.identityErrors = ["BANK_RUNTIME_PIN_UNKNOWN"]; }, s => { delete s.paused; },
    ]) {
      const altered = structuredClone(inspected); change(altered);
      assert.equal(deriveBankPauseStep(plan, altered).ready, false);
    }
    assert.equal(deriveBankPauseStep({ ...plan, pause: { ...plan.pause, data: bank.encodeFunctionData("unpause") } }, inspected).ready, false);
    const paused = deriveBankPauseStep(plan, { ...inspected, paused: true });
    assert.equal(paused.kind, "BANK_ALREADY_PAUSED"); assert.equal(paused.ready, false);
    for (const pinFault of ["implementation", "runtime", "unknown"]) {
      const broken = make(); broken.state.pinFault = pinFault;
      const preview = await broken.wallet.prepare();
      assert.equal(preview.step.ready, false, pinFault); await assert.rejects(broken.wallet.request(preview));
      assert.equal(broken.sends().length, 0);
    }
    assert.equal(valid.sends().length, 0, "read-only inspection never starts a wallet transaction");
  });
  await t.test("pending storage does not block read-only pause evidence or allow a send", async () => {
    const plan = buildBankPausePlan();
    for (const [raw, reason] of [[JSON.stringify({ state: "AWAITING_HUMAN_WALLET" }), "PENDING_INTENT_RECONCILE_FIRST"],
      ["invalid-json", "PENDING_STORAGE_CORRUPT_DO_NOT_RESEND"], [null, "DURABLE_STORAGE_REQUIRED"]]) {
      const m = make();
      if (raw !== null) m.storage.setItem(FUNDING_STORAGE_KEY, raw);
      const wallet = raw === null ? new HumanBankPauseWallet({ provider: m.provider, storage: null, locks: m.lockManager }) : m.wallet;
      const preview = await wallet.prepare(plan);
      assert.equal(preview.snapshot.roles.pauser, true);
      assert.equal(preview.step.ready, false);
      assert.ok(preview.step.blockers.includes(reason));
      await assert.rejects(wallet.request(preview), /STEP_NOT_READY/);
      assert.equal(m.storage.getItem(FUNDING_STORAGE_KEY), raw);
      assert.equal(m.sends().length, 0);
    }
  });
  await t.test("an account change during the fixed-block role read discards the pause preview", async () => {
    const m = make();
    const request = m.provider.request;
    m.provider.request = async args => {
      const result = await request(args);
      if (args.method === "eth_call" && bank.parseTransaction({ data: args.params[0].data }).name === "hasRole") m.state.account = formal.mother;
      return result;
    };
    await assert.rejects(m.wallet.prepare(), /FRESH_STATE_OR_ACCOUNT_CHANGED/);
    assert.equal(m.sends().length, 0);
  });
  await t.test("fresh-state changes invalidate a pause; rejection never retries; an explicit request sends once", async () => {
    for (const mutate of [
      m => { m.state.account = formal.jade; }, m => { m.state.chainId = 1; },
      m => { m.state.pauser = false; }, m => { m.state.paused = true; },
      m => { m.state.pinFault = "runtime"; }, m => m.expire(),
      m => m.listeners.get("accountsChanged")([formal.mother]), m => m.listeners.get("chainChanged")("0x1"),
    ]) {
      const m = make(), preview = await m.wallet.prepare(); assert.equal(preview.step.ready, true);
      mutate(m); await assert.rejects(m.wallet.request(preview)); assert.equal(m.sends().length, 0);
      assert.equal(m.storage.getItem(FUNDING_STORAGE_KEY), null);
    }
    const rejected = make({ rejected: true }); await assert.rejects(rejected.wallet.request(await rejected.wallet.prepare()));
    assert.equal(rejected.sends().length, 1); assert.equal(rejected.storage.getItem(FUNDING_STORAGE_KEY), null);
    const exact = make(), preview = await exact.wallet.prepare(); assert.equal(exact.sends().length, 0);
    await Promise.allSettled([exact.wallet.request(preview), exact.wallet.request(preview)]);
    assert.equal(exact.sends().length, 1); assert.ok(exact.locks.every(lock => lock.name === FUNDING_LOCK_KEY));
    const tx = exact.sends()[0].params[0];
    assert.equal(tx.from.toLowerCase(), formal.guanyin.toLowerCase()); assert.equal(tx.to, formal.bank);
    assert.equal(tx.chainId, "0x38"); assert.equal(tx.value, "0x0"); assert.equal(tx.data, bank.encodeFunctionData("pause"));
  });
  await t.test("shared pending pause, payout and floor receipts cannot cross flow boundaries", async () => {
    const m = make(); await m.wallet.request(await m.wallet.prepare());
    const original = m.storage.getItem(FUNDING_STORAGE_KEY), before = m.calls.length;
    for (const Wallet of [HumanFundingWallet]) {
      const wrong = new Wallet({ provider: m.provider, storage: m.storage, locks: m.lockManager });
      await assert.rejects(wrong.reconcile(hash), /PENDING_OTHER_FLOW_RECONCILE_AT_ORIGINAL_PANEL/);
      assert.equal(m.storage.getItem(FUNDING_STORAGE_KEY), original); assert.equal(m.calls.length, before);
    }
    const pending = JSON.parse(original);
    m.storage.setItem(FUNDING_STORAGE_KEY, JSON.stringify({ ...pending, flowType: "SEVEN_FLOOR_CLAIM",
      kind: "FLOOR_CLAIM", plan: { type: "SEVEN_FLOOR_CLAIM", characterId: id("OFFLINE-OLD-FLOOR"), floor: 1 } }));
    const wrongFixed = new HumanFundingWallet({ provider: m.provider, storage: m.storage, locks: m.lockManager });
    for (const wallet of [m.wallet, wrongFixed]) {
      await assert.rejects(wallet.reconcile(hash), /PENDING_OTHER_FLOW_RECONCILE_AT_ORIGINAL_PANEL/);
      assert.equal(m.calls.length, before, "an old reserved flow cannot be reinterpreted as a fixed payment or pause");
    }
    const fixed = buildLifeResourcePlan({ beneficiary: formal.mother, amount: "1" });
    m.storage.setItem(FUNDING_STORAGE_KEY, JSON.stringify({ ...pending, flowType: "FIXED_ALLOCATION", kind: "PAYOUT", plan: fixed }));
    await assert.rejects(m.wallet.reconcile(hash), /PENDING_OTHER_FLOW_RECONCILE_AT_ORIGINAL_PANEL/);
    assert.equal(m.calls.length, before);
    m.storage.setItem(FUNDING_STORAGE_KEY, JSON.stringify({ ...pending, flowType: "UNKNOWN", kind: "UNKNOWN" }));
    await assert.rejects(m.wallet.reconcile(hash)); assert.equal(m.calls.length, before);
  });
  await t.test("only canonical BankPaused plus exact paused state confirms pause, never VERIFIED_PAID", async () => {
    for (const mode of ["status-only", "wrong-actor", "wrong-emitter", "state-not-paused", "noncanonical", "changed-runtime", "exact"]) {
      const m = make({ noncanonical: mode === "noncanonical" });
      await m.wallet.request(await m.wallet.prepare()); m.confirm(mode);
      if (mode === "changed-runtime") m.state.pinFault = "runtime";
      const result = await m.wallet.reconcile(hash);
      assert.equal(result.status, mode === "exact" ? "BANK_PAUSED" : "MISMATCH", mode);
      assert.notEqual(result.status, "VERIFIED_PAID", mode);
      assert.equal(m.storage.getItem(FUNDING_STORAGE_KEY) === null, mode === "exact", mode);
      assert.equal(m.sends().length, 1, "receipt inspection cannot send a second transaction");
    }
  });
});


// Values cross a VM realm; compare their data without weakening product guards.
const equalInline = (actual, expected, message) => assert.deepEqual(structuredClone(actual), structuredClone(expected), message);

test("seven floor inline inspection: fixed-block funding and unavailable release never grant payment", async (t) => {
  const api = await inlineBankApi(), { Interface } = await import("ethers");
  const F = api.FUNDING_FORMAL, pins = api.FUNDING_RUNTIME_PINS, tag = "0x1234", timestamp = 1_700_000_000;
  const bank = new Interface(api.bankAbi), floor = api.floorInterface;
  const token = new Interface(["function decimals() view returns(uint8)"]);
  const plan = api.buildSevenFloorPlan({ characterId: id("INLINE-INSPECT-FIXTURE"), floor: 1, amount: "1.08" });
  await t.test("actual inspector preserves complete Bank ABI fields and never reads unreviewed character selectors", async () => {
    for (const fault of [null, "health", "module"]) {
      const calls = [];
      const provider = { request: async ({ method, params = [] }) => {
        calls.push({ method, params });
        if (method === "eth_chainId") return "0x38";
        if (method === "eth_accounts") return [F.mother];
        if (method === "eth_getBlockByNumber") return { number: tag, timestamp: `0x${timestamp.toString(16)}` };
        if (method === "eth_getStorageAt") {
          assert.equal(params[1], api.FUNDING_IMPLEMENTATION_SLOT); assert.equal(params[2], tag);
          const pin = Object.values(pins).find(pin => pin.proxy.toLowerCase() === params[0].toLowerCase()); assert.ok(pin);
          return `0x${pin.implementation.slice(2).padStart(64, "0")}`;
        }
        if (method === "eth_getCode") { assert.equal(params[1], tag); return "0x6000"; }
        if (method === "eth_call") {
          assert.equal(params[1], tag);
          const iface = params[0].to.toLowerCase() === F.bank.toLowerCase() ? bank
            : params[0].to.toLowerCase() === F.allocation.toLowerCase() ? floor : token;
          const parsed = iface.parseTransaction({ data: params[0].data });
          const values = { kaios: [F.kaios], decimals: [18], version: ["1.0.0"],
            module: [[F.allocation, F.versionHash, F.capWei, F.capWei, 0, Math.floor(timestamp / 86400), true]],
            bankHealth: [11n * BANK_TEST_ETHER, BANK_TEST_ETHER, 10n * BANK_TEST_ETHER, 12n * BANK_TEST_ETHER, BANK_TEST_ETHER, true, false] };
          assert.ok(Object.hasOwn(values, parsed.name), `unreviewed selector ${parsed.name} must not be called`);
          if (fault === "health" && parsed.name === "bankHealth" || fault === "module" && parsed.name === "module") throw Error("OFFLINE_READ_FAILED");
          return iface.encodeFunctionResult(parsed.name, values[parsed.name]);
        }
        throw Error(`No wallet or external RPC allowed: ${method}`);
      } };
      const wallet = new api.SevenFloorClaimWallet({ provider, storage: {} });
      const snapshot = await wallet.inspect(plan), step = api.deriveSevenFloorStep(plan, snapshot);
      assert.equal(snapshot.releaseVerified, false); assert.equal(snapshot.binding, null); assert.equal(snapshot.floor, null);
      assert.equal(snapshot.codeOk, false, "synthetic bytes do not pass the formal historical pins");
      assert.equal(step.ready, false); assert.ok(step.blockers.includes("SEVEN_FLOOR_NOT_DEPLOYED"));
      assert.equal(step.fundingPrecheck.status, fault ? "UNKNOWN" : "SUFFICIENT");
      if (!fault) {
        assert.equal(snapshot.health.balance, String(11n * BANK_TEST_ETHER)); assert.equal(snapshot.health.reserve, String(BANK_TEST_ETHER));
        assert.equal(snapshot.health.available, String(10n * BANK_TEST_ETHER)); assert.equal(snapshot.health.isPaused, false); assert.equal(snapshot.health.paused, false);
        assert.equal(snapshot.health.accountedInflow, String(12n * BANK_TEST_ETHER)); assert.equal(snapshot.health.totalOutflow, String(BANK_TEST_ETHER));
      }
      assert.equal(calls.some(call => call.method === "eth_sendTransaction"), false);
    }
  });
  await t.test("only complete reviewed metadata can resolve a future Allocation pin; production stays undeployed", () => {
    assert.equal(api.SEVEN_FLOOR_RELEASE.status, "NOT_DEPLOYED");
    for (const field of ["implementation", "runtimeHash", "moduleVersionHash"]) assert.equal(api.SEVEN_FLOOR_RELEASE[field], null);
    assert.throws(() => api.sevenFloorRuntimePins(), /NOT_REVIEWED/);
    const release = { status: "DEPLOYED_AND_REVIEWED", version: "1.1.0", implementation: `0x${"44".repeat(20)}`,
      runtimeHash: id("SYNTHETIC-RUNTIME"), moduleVersionHash: id("SYNTHETIC-MODULE") };
    const resolved = api.sevenFloorRuntimePins(release);
    assert.equal(resolved.bank, pins.bank); assert.equal(resolved.governance, pins.governance); assert.equal(resolved.allocation.proxy, F.allocation);
    for (const change of [{ status: "DEPLOYED" }, { version: "1.0.0" }, { implementation: null }, { runtimeHash: null }, { moduleVersionHash: null }]) {
      assert.throws(() => api.sevenFloorRuntimePins({ ...release, ...change }), /SEVEN_FLOOR_RELEASE_/);
    }
  });
  await t.test("all three flows reject another flow's pending receipt before any provider request", async () => {
    const flows = [[api.HumanFundingWallet, api.buildLifeResourcePlan({ beneficiary: F.mother, amount: "1" }), "PAYOUT"],
      [api.HumanBankPauseWallet, api.buildBankPausePlan(), "BANK_PAUSE"], [api.SevenFloorClaimWallet, plan, "FLOOR_CLAIM"]];
    for (const [Owner, ownerPlan, kind] of flows) {
      const raw = JSON.stringify({ plan: ownerPlan, kind }), storage = { getItem: () => raw, setItem() {}, removeItem() { throw Error("retain pending lock"); } };
      for (const [Other] of flows) if (Owner !== Other) {
        const wallet = new Other({ storage, locks: { request: async (_name, _options, callback) => callback({}) },
          provider: { request() { throw Error("NO_PROVIDER_REQUEST"); } } });
        await assert.rejects(wallet.reconcile(`0x${"11".repeat(32)}`), /PENDING_OTHER_FLOW_RECONCILE_AT_ORIGINAL_PANEL/);
        assert.equal(storage.getItem(api.FUNDING_STORAGE_KEY), raw);
      }
    }
  });
});

test("seven floor controller: actual handlers reject stale context and preserve exact user intent", async (t) => {
  const fs = await import("node:fs/promises");
  const vm = await import("node:vm");
  const { FUNDING_FORMAL, SEVEN_FLOORS, validateSevenFloorAmount, buildSevenFloorPlan, deriveSevenFloorStep, projectSevenFloorPlayerContext } = await inlineBankApi();
  const html = await fs.readFile(new URL("../../K線西遊記/temples/18888/index.html", import.meta.url), "utf8");
  const source = html.split(SEVEN_CONTROLLER_MARKER)[1]?.split(SEVEN_CONTROLLER_END)[0];
  assert.ok(source, "test the actual scoped controller from the sole inline owner");
  const controller = `0x${"22".repeat(20)}`;
  const beneficiary = `0x${"33".repeat(20)}`;
  const transactionHash = `0x${"11".repeat(32)}`;
  const roleA = id("EXISTING-GAME-CHARACTER-A"), roleB = id("EXISTING-GAME-CHARACTER-B");
  const deferred = () => {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
  };
  const candidate = (input, ready = true) => ({ plan: buildSevenFloorPlan(input),
    step: { ready, blockers: ready ? [] : ["SEVEN_FLOOR_NOT_DEPLOYED"] },
    snapshot: { chainId: 56, account: controller, blockNumber: "0x100",
      binding: { controller, beneficiary, currentFloor: input.floor },
      floor: { taskEvidenceHash: id("FORMAL-TASK-EVIDENCE"), claimed: false, executableAt: "0", amount: "0" },
      // Explicit synthetic fixture wei, never a substituted production reserve.
      health: { healthy: true, paused: false, balance: String(11_000_000n * BANK_TEST_ETHER), reserve: String(1_000_000n * BANK_TEST_ETHER), available: String(10_000_000n * BANK_TEST_ETHER) } }, fee: null });

  function harness() {
    const nodes = new Map(), events = new Map(), requests = [], preparations = [], instances = [];
    const waiting = { prepare: null, send: null, receipt: null };
    let liveRequests = 0;
    const buttons = [];
    class Element {
      constructor(value = "") { this.value = value; this.checked = false; this.disabled = false;
        this.dataset = {}; this.listeners = new Map(); this.children = []; this.attrs = {}; this.textContent = ""; }
      addEventListener(name, listener) { this.listeners.set(name, listener); }
      append(child) { this.children.push(child); }
      setAttribute(name, value) { this.attrs[name] = value; }
      querySelectorAll() { return buttons; }
    }
    for (let index = 0; index < 7; index++) {
      const button = new Element(); button.dataset.floor = String(index + 1); buttons.push(button);
    }
    const element = name => {
      const key = name.startsWith("seven-floor-") ? name : `seven-floor-${name}`;
      if (!nodes.has(key)) nodes.set(key, new Element());
      return nodes.get(key);
    };
    element("amount").value = "1.08";
    element("result").textContent = "目前未送出領取交易，未付款。";
    element("claimed").textContent = "未知；不能以本機記錄宣稱鏈上未領";
    class FakeWallet {
      constructor(options) { this.provider = options.provider; this.invalidations = 0; instances.push(this); }
      invalidatePreview() { this.invalidations++; }
      async prepare(input) {
        preparations.push(structuredClone(input));
        return waiting.prepare ? await waiting.prepare.promise : candidate(input);
      }
      async request(preview) {
        requests.push(preview);
        return waiting.send ? await waiting.send.promise : { hash: transactionHash, status: "SUBMITTED_UNCONFIRMED" };
      }
      async reconcile() {
        return waiting.receipt ? await waiting.receipt.promise : { hash: transactionHash, status: "PENDING" };
      }
    }
    const context = {
      document: { getElementById: element, createElement: () => new Element() },
      window: { localStorage: {}, addEventListener: (name, listener) => events.set(name, listener),
        dispatchEvent: event => events.get(event.type)?.(event) },
      navigator: { locks: {} },
      Option: class { constructor(text, value) { this.text = text; this.value = value; } },
      Event: class { constructor(type) { this.type = type; } },
      SEVEN_FLOORS, validateSevenFloorAmount, buildSevenFloorPlan, projectSevenFloorPlayerContext, SevenFloorClaimWallet: FakeWallet,
    };
    vm.runInNewContext(source, context, { filename: "actual-seven-floor-controller.mjs" });
    const emit = (name, detail) => events.get(name)?.({ detail });
    const role = (characterId = roleA) => emit("kaios18888:character", { characterId, displayName: "既有角色" });
    const connect = () => {
      const listeners = new Map();
      const provider = { request: () => { liveRequests++; throw Error("NO_LIVE_PROVIDER_ALLOWED"); },
        on: (name, listener) => listeners.set(name, listener) };
      emit("kaios18888:wallet", { provider, account: controller, chainId: 56 });
      return { provider, listeners };
    };
    const choose = floor => {
      if (floor > 0) buttons[floor - 1].listeners.get("click")();
      else { element("basement").value = String(floor); element("basement").listeners.get("change")(); }
    };
    const click = name => element(name).onclick();
    const acknowledge = () => { element("ack").checked = true; element("ack").listeners.get("change")(); };
    const edit = (value, event = true) => {
      element("amount").value = value;
      if (event) element("amount").listeners.get("input")();
    };
    return { element, buttons, waiting, role, connect, choose, click, acknowledge, edit, emit,
      requests, preparations, instances, liveRequests: () => liveRequests };
  }

  await t.test("first screen is explicitly unconnected; seven caps and every basement remain distinct", async () => {
    assert.match(html, /LOCAL_CANDIDATE_NOT_MAINNET_CONNECTED/);
    assert.match(html, /尚未收到原遊戲角色資料/);
    assert.ok(html.indexOf('id="seven-floor-panel"') < html.indexOf('class="bank-hero"'));
    const ui = harness();
    assert.equal(ui.requests.length, 0);
    assert.equal(ui.element("send").disabled, true);
    assert.equal(ui.element("basement").children.length, 18);
    for (const row of SEVEN_FLOORS) {
      ui.choose(row.floor);
      assert.equal(ui.element("amount").value, row.maxKaios);
      assert.equal(ui.element("position").textContent, row.position);
      assert.equal(ui.buttons[row.floor - 1].attrs["aria-pressed"], "true");
    }
    for (let floor = -1; floor >= -18; floor--) {
      ui.choose(floor);
      assert.equal(ui.element("amount").disabled, true);
      assert.equal(ui.element("max").disabled, true);
      assert.equal(ui.element("send").disabled, true);
      await ui.click("prepare");
    }
    assert.equal(ui.preparations.length, 0);
    assert.equal(ui.liveRequests(), 0);
  });

  await t.test("missing and zero character context never invent eligibility or ask for a LifeID", async () => {
    const ui = harness(); ui.connect();
    await ui.click("prepare");
    ui.role(`0x${"00".repeat(32)}`); await ui.click("prepare");
    assert.equal(ui.preparations.length, 0);
    assert.equal(ui.requests.length, 0);
    assert.equal(ui.element("send").disabled, true);
    assert.match(ui.element("character").textContent, /未收到有效原遊戲角色/);
    assert.equal(ui.liveRequests(), 0);
  });

  await t.test("funding precheck UI: actual handlers show exact funding, block insufficient or unknown, and clear stale pool values", async () => {
    const input = { characterId: roleA, floor: 1, amount: "1.08" }, moduleVersion = id("SYNTHETIC-UI-FUNDING-MODULE");
    for (const scenario of ["sufficient", "insufficient", "unknown"]) {
      const ui = harness(); ui.role(); ui.connect();
      const prepared = candidate(input);
      Object.assign(prepared.snapshot, { timestamp: "1700000000", releaseVerified: true, codeOk: true, token: FUNDING_FORMAL.kaios,
        decimals: 18, identityErrors: [], expectedModuleVersionHash: moduleVersion, paymentConsumed: false,
        module: { module: FUNDING_FORMAL.allocation, versionHash: moduleVersion, active: true, perTransactionLimit: String(3n * BANK_TEST_ETHER),
          epochLimit: String(10n * BANK_TEST_ETHER), epochSpent: String(BANK_TEST_ETHER), epochIndex: String(Math.floor(1700000000 / 86400)) },
        health: { healthy: true, paused: false, isPaused: false, balance: String(11n * BANK_TEST_ETHER), reserve: String(BANK_TEST_ETHER),
          available: String(10n * BANK_TEST_ETHER), accountedInflow: String(11n * BANK_TEST_ETHER), totalOutflow: "0" } });
      if (scenario === "insufficient") Object.assign(prepared.snapshot.health, { balance: String(BANK_TEST_ETHER), available: "0" });
      if (scenario === "unknown") prepared.snapshot.health = null;
      prepared.step = deriveSevenFloorStep(prepared.plan, prepared.snapshot);
      ui.waiting.prepare = deferred(); const pending = ui.click("prepare"); ui.waiting.prepare.resolve(prepared); await pending;
      const text = ui.element("pool").textContent;
      if (scenario === "sufficient") {
        for (const [label, amount] of [["銀行餘額", "11"], ["合約保留額", "1"], ["銀行可用額", "10"], ["共享單筆上限", "3"], ["UTC當日上限", "10"], ["本日有效已用", "1"], ["當日剩餘", "9"]]) {
          assert.match(text, new RegExp(`${label}：${amount}(?:\\.0+)?(?:；| KAIOS|$)`), label);
        }
        assert.match(text, /本次資金與共享限額足額/); assert.match(text, /尚未付款/);
        assert.match(text, /觀測區塊：0x100/); assert.match(text, /區塊時間戳：1700000000/);
        ui.acknowledge(); assert.equal(ui.element("send").disabled, false, "the isolated ready fixture can offer only explicit confirmation");
      } else {
        ui.acknowledge(); assert.equal(ui.element("send").disabled, true);
        if (scenario === "insufficient") { assert.match(text, /本次資金或共享限額不足/); assert.match(text, /銀行可用資金不足/); }
        else { assert.match(text, /未知，停止送單/); assert.match(text, /銀行餘額：未知/); assert.match(text, /合約保留額：未知/); }
      }
      assert.equal(ui.element("result").textContent, "目前未送出領取交易，未付款。");
      ui.edit("0.5"); assert.match(ui.element("pool").textContent, /未知或已作廢/);
      assert.doesNotMatch(ui.element("pool").textContent, /銀行餘額：11/); assert.equal(ui.element("send").disabled, true);
      assert.equal(ui.requests.length, 0); assert.equal(ui.liveRequests(), 0);
    }
  });
  await t.test("late prepare cannot restore readiness after form, floor, character or wallet changes", async () => {
    for (const change of [
      ui => ui.edit("0.5"), ui => ui.choose(2), ui => ui.role(roleB), ui => ui.connect(),
    ]) {
      const ui = harness(); ui.role(); ui.connect(); ui.waiting.prepare = deferred();
      const pending = ui.click("prepare");
      change(ui);
      ui.waiting.prepare.resolve(candidate({ characterId: roleA, floor: 1, amount: "1.08" }));
      await pending; ui.acknowledge();
      assert.equal(ui.element("send").disabled, true);
      assert.equal(ui.requests.length, 0);
      assert.equal(ui.liveRequests(), 0);
    }
  });

  await t.test("silent amount edits are rejected; one fresh explicit confirmation requests only once", async () => {
    const ui = harness(); ui.role(); const connected = ui.connect();
    await ui.click("prepare"); ui.acknowledge();
    assert.equal(ui.element("send").disabled, false);
    ui.edit("0.5", false); await ui.click("send");
    assert.equal(ui.requests.length, 0);
    await ui.click("prepare"); ui.acknowledge(); await ui.click("send");
    assert.equal(ui.requests.length, 1);
    assert.equal(ui.requests[0].plan.amountKaios, "0.5");
    assert.equal(ui.element("ack").checked, false);
    assert.equal(ui.element("send").disabled, true);
    assert.match(ui.element("result").textContent, /不代表成功或入帳/);
    await ui.click("prepare"); ui.acknowledge();
    connected.listeners.get("chainChanged")("0x1");
    assert.equal(ui.element("send").disabled, true);
    assert.ok(ui.instances[0].invalidations > 0, "invalidate the actual wallet preview capability too");
    assert.equal(ui.liveRequests(), 0);
  });

  await t.test("skip and unchecked acknowledgment cannot request or mark a floor paid", async () => {
    const ui = harness(); ui.role(); ui.connect();
    await ui.click("prepare");
    assert.equal(ui.element("send").disabled, true);
    await ui.click("send"); // Exercise the handler too, beyond the disabled button.
    assert.equal(ui.requests.length, 0);
    await ui.click("prepare"); ui.acknowledge();
    assert.equal(ui.element("send").disabled, false);
    ui.element("ack").checked = false; ui.element("ack").listeners.get("change")();
    assert.equal(ui.element("send").disabled, true);
    await ui.click("send"); assert.equal(ui.requests.length, 0);
    await ui.click("prepare"); ui.acknowledge();
    const beforeResult = ui.element("result").textContent;
    const beforePrepares = ui.preparations.length;
    ui.click("skip");
    assert.equal(ui.element("amount").value, "");
    assert.equal(ui.element("ack").checked, false);
    assert.equal(ui.element("send").disabled, true);
    assert.equal(ui.element("result").textContent, beforeResult);
    assert.equal(ui.preparations.length, beforePrepares);
    assert.match(ui.element("status").textContent, /這次不領/);
    await ui.click("send");
    assert.equal(ui.requests.length, 0);
    assert.equal(ui.liveRequests(), 0);
  });

  await t.test("invalid player amounts stop before wallet preparation or sending", async () => {
    for (const amount of ["", "0", "-1", "1e0", "1,000", "1.080000000000000001", "0.0000000000000000001"]) {
      const ui = harness(); ui.role(); ui.connect(); ui.edit(amount);
      assert.equal(ui.element("amount").attrs["aria-invalid"], "true", amount);
      assert.equal(ui.element("prepare").disabled, true, amount);
      await ui.click("prepare"); ui.acknowledge(); await ui.click("send");
      assert.equal(ui.preparations.length, 0, amount);
      assert.equal(ui.requests.length, 0, amount);
      assert.equal(ui.element("send").disabled, true, amount);
      assert.equal(ui.element("result").textContent, "目前未送出領取交易，未付款。", amount);
      assert.equal(ui.liveRequests(), 0, amount);
    }
  });

  await t.test("late wallet send return cannot overwrite a new role, floor or wallet context", async () => {
    for (const change of [ui => ui.choose(2), ui => ui.role(roleB), ui => ui.connect()]) {
      const ui = harness(); ui.role(); ui.connect();
      await ui.click("prepare"); ui.acknowledge(); ui.waiting.send = deferred();
      const pending = ui.click("send");
      change(ui);
      const kept = { result: ui.element("result").textContent, status: ui.element("status").textContent,
        preview: ui.element("preview").textContent, claimed: ui.element("claimed").textContent };
      ui.waiting.send.resolve({ hash: transactionHash, status: "SUBMITTED_UNCONFIRMED" }); await pending;
      for (const [field, text] of Object.entries(kept)) assert.equal(ui.element(field).textContent, text, field);
      assert.equal(ui.element("send").disabled, true);
      assert.equal(ui.requests.length, 1, "one old mock request, never a retry in the new context");
      assert.equal(ui.liveRequests(), 0);
    }
  });

  await t.test("late paid receipt cannot mark a different role, floor or wallet as paid", async () => {
    for (const change of [ui => ui.choose(2), ui => ui.role(roleB), ui => ui.connect()]) {
      const ui = harness(); ui.role(); ui.connect(); ui.waiting.receipt = deferred();
      const pending = ui.click("receipt");
      change(ui);
      const kept = { result: ui.element("result").textContent, status: ui.element("status").textContent,
        preview: ui.element("preview").textContent, claimed: ui.element("claimed").textContent };
      ui.waiting.receipt.resolve({ hash: transactionHash, status: "VERIFIED_PAID" }); await pending;
      for (const [field, text] of Object.entries(kept)) assert.equal(ui.element(field).textContent, text, field);
      assert.equal(ui.requests.length, 0);
      assert.equal(ui.element("send").disabled, true);
      assert.equal(ui.liveRequests(), 0);
    }
  });
  await t.test("original PlayerLife display context cannot prepare a claim without a separate matching financial character", async () => {
    const ui = harness(); ui.connect();
    const playerId = `KAIOS-P-${"ab".repeat(16)}`;
    const snapshot = { scope: "LOCAL_CANDIDATE_NOT_ECONOMIC_AUTHORITY", status: "READY", revision: 1, persistent: true,
      player: { playerId, displayName: "原玩家", lastWorld: "11520", xp: 1_000_000, level: 7, dailyTaskComplete: true } };
    ui.emit("kaios18888:playerLife", { snapshot, coordinates: { distanceUnit: "METERS", physical: { x: 18888, y: 7, z: 0 } } });
    assert.match(ui.element("character").textContent, /僅展示/);
    await ui.click("prepare"); assert.equal(ui.preparations.length, 0);
    ui.emit("kaios18888:character", { characterId: roleA, sourcePlayerId: "DIFFERENT-PLAYER", displayName: "錯誤映射" });
    await ui.click("prepare"); assert.equal(ui.preparations.length, 0);
    assert.equal(ui.requests.length, 0); assert.equal(ui.element("send").disabled, true);
    ui.emit("kaios18888:character", { characterId: roleA, sourcePlayerId: playerId, displayName: "正式角色接點" });
    await ui.click("prepare"); assert.equal(ui.preparations.length, 1, "matching context may reach only the offline formal-state seam");
    assert.equal(ui.requests.length, 0); assert.equal(ui.liveRequests(), 0);
  });
});

// Human-operated funding UI checks are deliberately offline: no RPC, signer,
// private key, real applicant address, or chain mutation is used here.

test("seven floor player context: original PlayerLife is a display projection, never financial identity or eligibility", async (t) => {
  const { projectSevenFloorPlayerContext } = await inlineBankApi();
  const snapshot = () => ({ scope: "LOCAL_CANDIDATE_NOT_ECONOMIC_AUTHORITY", revision: 7, status: "READY", persistent: true,
    player: { playerId: `KAIOS-P-${"ab".repeat(16)}`, displayName: "原遊戲角色", lastWorld: "11520",
      lastXYZ: { x: 18888, y: 7, z: 0 }, walletLinks: [{ chainId: 56, address: "0x1000000000000000000000000000000000000001" }],
      xp: 1_000_000, level: 7, dailyTaskComplete: true } });
  await t.test("wallet rotation and display-name changes retain the original local player ID without deriving a financial key", () => {
    const source = snapshot(); const before = JSON.stringify(source);
    const original = projectSevenFloorPlayerContext(source);
    assert.equal(JSON.stringify(source), before, "projection never mutates original PlayerLife state");
    assert.equal(original.scope, "DISPLAY_ONLY_NOT_ENTITLEMENT");
    assert.equal(original.source, "KAIOS_PLAYER_LIFE_V1");
    assert.equal(original.playerId, source.player.playerId);
    assert.equal(original.displayName, "原遊戲角色");
    assert.equal(original.revision, 7); assert.equal(original.persistent, true);
    assert.equal(original.worldId, "11520"); assert.equal(original.physicalPosition, null);
    source.player.displayName = "改名後"; source.player.walletLinks = [{ chainId: 56, address: "0x2000000000000000000000000000000000000002" }];
    const rotated = projectSevenFloorPlayerContext(source);
    assert.equal(rotated.playerId, original.playerId); assert.equal(rotated.displayName, "改名後");
    for (const value of [original, rotated]) {
      assert.equal(value.financialCharacterId, null); assert.equal(value.taskEvidenceHash, null);
      assert.equal(value.floorQualification, null); assert.equal("walletLinks" in value, false);
    }
  });
  await t.test("physical coordinates are display-only; matching palace position, XP and daily tasks grant nothing", () => {
    const source = snapshot();
    source.player.financialCharacterId = id("LOCAL-UNTRUSTED-CHARACTER");
    source.player.taskEvidenceHash = id("LOCAL-UNTRUSTED-TASK"); source.player.floorQualification = 7;
    const physical = { x: 18888, y: 1, z: 0 };
    const projected = projectSevenFloorPlayerContext(source, { distanceUnit: "METERS", physical, intent: { x: 1888800, y: 7, z: 0 } });
    equalInline(projected.physicalPosition, { ...physical, unit: "METERS" });
    assert.equal(projected.financialCharacterId, null); assert.equal(projected.taskEvidenceHash, null);
    assert.equal(projected.floorQualification, null);
    for (const coordinates of [null, { distanceUnit: "METERS", intent: physical }, { distanceUnit: "K_INDEX", physical },
      { distanceUnit: "METERS", physical: { ...physical, x: NaN } },
      { distanceUnit: "METERS", physical: { ...physical, y: Infinity } }, { distanceUnit: "METERS", physical: { ...physical, z: "0" } }]) {
      assert.equal(projectSevenFloorPlayerContext(source, coordinates).physicalPosition, null);
    }
    source.persistent = false;
    assert.equal(projectSevenFloorPlayerContext(source).persistent, false, "memory-only source is not promoted to durable financial evidence");
  });
  await t.test("wrong source, missing player, non-ready state and unsafe revision are rejected", () => {
    for (const invalid of [null, {}, { ...snapshot(), scope: "MAINNET_VERIFIED" }, { ...snapshot(), status: "LOADING" },
      { ...snapshot(), player: null }, { ...snapshot(), revision: -1 }, { ...snapshot(), revision: 0.5 },
      { ...snapshot(), revision: Number.MAX_SAFE_INTEGER + 1 }, { ...snapshot(), revision: "7" },
      { ...snapshot(), persistent: "true" }, { ...snapshot(), player: { ...snapshot().player, lastWorld: "18888" } },
      { ...snapshot(), player: { ...snapshot().player, playerId: "KAIOS-P-ABCDEF" } },
      { ...snapshot(), player: { ...snapshot().player, displayName: 42 } },
    ]) assert.throws(() => projectSevenFloorPlayerContext(invalid));
  });
});

test("seven floor amounts: every exact cap, scale interval and 18-decimal boundary remains separate from eligibility", async () => {
  const { SEVEN_FLOORS, validateSevenFloorAmount, buildSevenFloorPlan } =
    await inlineBankApi();
  for (const row of SEVEN_FLOORS) {
    assert.equal(row.scaleStart, String(10 ** (row.floor - 1)));
    assert.equal(row.scaleEnd, String(10 ** row.floor));
    const smallest = validateSevenFloorAmount({ floor: row.floor, amount: "0.000000000000000001" });
    assert.equal(smallest.amountWei, "1"); assert.equal(smallest.floor, row.floor);
    assert.equal(smallest.maxKaios, row.maxKaios); assert.ok(Object.isFrozen(smallest));
    const maximum = validateSevenFloorAmount({ floor: row.floor, amount: row.maxKaios });
    assert.equal(maximum.amountWei, String(parseUnits(row.maxKaios, 18)));
    assert.equal(maximum.amountKaios, row.maxKaios);
    const excessive = String(parseUnits(row.maxKaios, 18) + 1n).padStart(19, "0");
    const excessiveAmount = `${excessive.slice(0, -18)}.${excessive.slice(-18)}`;
    assert.throws(() => validateSevenFloorAmount({ floor: row.floor, amount: excessiveAmount }));
    assert.throws(() => buildSevenFloorPlan({ floor: row.floor, amount: row.maxKaios }), /CHARACTER_UNBOUND/,
      "valid presentation amount cannot invent a financial character or entitlement");
  }
  for (const amount of ["", "0", "-1", "1e0", "1,000", "01", "0.0000000000000000001", 1]) {
    assert.throws(() => validateSevenFloorAmount({ floor: 1, amount }), undefined, String(amount));
  }
  for (const floor of [-18, -1, 0, 8, 1.5, "1"]) assert.throws(() => validateSevenFloorAmount({ floor, amount: "1" }));
});

test("seven floor wallet: exact plans, fail-closed previews, asynchronous guards and canonical payment receipts", async (t) => {
  const { Interface } = await import("ethers");
  const { FUNDING_FORMAL: formal, FUNDING_LOCK_KEY, FUNDING_STORAGE_KEY, FUNDING_EVIDENCE_PREFIX, SEVEN_FLOORS, SEVEN_FLOOR_RELEASE,
    buildSevenFloorPlan, deriveSevenFloorStep, SevenFloorClaimWallet, HumanFundingWallet, buildLifeResourcePlan } = await inlineBankApi();
  const sevenFloorPaymentId = (characterId, floor) => keccak256(AbiCoder.defaultAbiCoder().encode(
    ["bytes32", "bytes32", "bytes32", "uint8"],
    [id("KAIOS.CIVILIZATION.FLOOR_CLAIM.ONCE"), formal.moduleId, characterId, floor]));
  const controller = "0x1000000000000000000000000000000000000001";
  const receiver = "0x2000000000000000000000000000000000000002";
  const alternate = "0x3000000000000000000000000000000000000003";
  const characterId = id("CANONICAL-GAME-CHARACTER:OFFLINE-FIXTURE");
  const zero = "0x0000000000000000000000000000000000000000";
  const timestamp = 1_700_000_000;
  const hash = `0x${"11".repeat(32)}`, blockHash = `0x${"22".repeat(32)}`;
  const input = { characterId, floor: 1, amount: "1.08" };
  const plan = buildSevenFloorPlan(input);
  const snapshot = () => ({ chainId: 56, account: controller, timestamp: String(timestamp), blockNumber: "0x100",
    releaseVerified: true, codeOk: true, token: formal.kaios, decimals: 18, identityErrors: [],
    expectedModuleVersionHash: id("SEVEN-FLOOR:REVIEWED-OFFLINE-FIXTURE"),
    binding: { controller, beneficiary: receiver, currentFloor: "1" },
    floor: { taskEvidenceHash: id("VERIFIED-TASK:OFFLINE-FIXTURE"), executableAt: "0", claimed: false, amount: "0" },
    paymentConsumed: false,
    module: { module: formal.allocation, versionHash: id("SEVEN-FLOOR:REVIEWED-OFFLINE-FIXTURE"), active: true,
      perTransactionLimit: formal.capWei, epochLimit: formal.capWei, epochSpent: "0", epochIndex: String(Math.floor(timestamp / 86400)) },
    // Complete synthetic Bank health; actual inspect must preserve real values.
    health: { healthy: true, paused: false, balance: String(11_000_000n * BANK_TEST_ETHER), reserve: String(1_000_000n * BANK_TEST_ETHER), available: formal.capWei,
      accountedInflow: String(11_000_000n * BANK_TEST_ETHER), totalOutflow: "0", isPaused: false },
  });
  const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
  const eventInterface = new Interface([
    "event Transfer(address indexed from,address indexed to,uint256 value)",
    "event FloorClaimed(bytes32 indexed characterId,uint8 indexed floor,address indexed beneficiary,uint256 amount,bytes32 paymentId)",
    "event ModulePaymentExecuted(bytes32 indexed moduleId,bytes32 indexed paymentId,address indexed beneficiary,uint256 amount)",
  ]);
  const eventLog = (address, name, values) => ({ address, ...eventInterface.encodeEventLog(eventInterface.getEvent(name), values) });
  const paymentLogs = () => [
    eventLog(formal.kaios, "Transfer", [formal.bank, receiver, plan.amountWei]),
    eventLog(formal.allocation, "FloorClaimed", [characterId, 1, receiver, plan.amountWei, plan.paymentId]),
    eventLog(formal.bank, "ModulePaymentExecuted", [formal.moduleId, plan.paymentId, receiver, plan.amountWei]),
  ];
  const mock = (options = {}) => {
    const calls = [], listeners = new Map(), records = new Map(), lockCalls = [];
    let current = snapshot(), feeGate = null, receipt = null, receiptHook = null, time = timestamp * 1000;
    const storage = { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value), removeItem: key => records.delete(key) };
    const provider = { on: (name, listener) => listeners.set(name, listener), request: async ({ method, params }) => {
      calls.push({ method, params });
      if (method === "eth_chainId") return current.chainId === 56 ? "0x38" : "0x1";
      if (method === "eth_accounts" || method === "eth_requestAccounts") return [current.account];
      if (method === "eth_estimateGas") { if (options.failGas) throw Error("OFFLINE_FEE_UNAVAILABLE"); if (feeGate) { feeGate.entered.resolve(); await feeGate.release.promise; } return "0x5208"; }
      if (method === "eth_gasPrice") return "0x3b9aca00";
      if (method === "eth_getBalance") return options.lowGas ? "0x0" : "0xde0b6b3a7640000";
      if (method === "eth_sendTransaction") return hash;
      if (method === "eth_getTransactionReceipt") { receiptHook?.(); return receipt; }
      if (method === "eth_getTransactionByHash") {
        const sent = calls.find(call => call.method === "eth_sendTransaction")?.params[0];
        return sent ? { ...sent, input: sent.data, chainId: "0x38", blockNumber: "0x100", blockHash } : null;
      }
      if (method === "eth_getBlockByNumber") return { number: "0x100", hash: options.noncanonical ? `0x${"33".repeat(32)}` : blockHash };
      throw new Error(`Unexpected offline request: ${method}`);
    } };
    const locks = options.noLocks ? {} : { request: async (name, lockOptions, callback) => {
      lockCalls.push({ name, lockOptions }); return callback(options.lockUnavailable ? null : { name });
    } };
    const wallet = new SevenFloorClaimWallet({ provider, storage, now: () => time, locks });
    wallet.inspect = async () => structuredClone(current);
    return { wallet, provider, storage, calls, listeners, lockCalls, state: () => current,
      mutate: fn => fn(current), setTime: next => { time = next; },
      pauseFee: () => { feeGate = { entered: deferred(), release: deferred() }; return feeGate; },
      confirm: (logs = paymentLogs()) => { receipt = { transactionHash: hash, status: "0x1", blockNumber: "0x100", blockHash, logs };
        current.floor.claimed = true; current.floor.amount = plan.amountWei; current.paymentConsumed = true; },
      onReceipt: fn => { receiptHook = fn; },
      sends: () => calls.filter(call => call.method === "eth_sendTransaction"),
    };
  };
  await t.test("seven exact plans retain character/floor payment identity across amount changes", () => {
    assert.equal(SEVEN_FLOOR_RELEASE.status, "NOT_DEPLOYED", "a source candidate must not silently become a mainnet release");
    equalInline(SEVEN_FLOORS.map(row => [row.position, row.maxKaios]), [
      ["1.8888", "1.08"], ["18.888", "10.8"], ["188.88", "108"], ["1888.8", "1080"],
      ["18888", "10800"], ["188880", "108000"], ["1888800", "1080000"],
    ]);
    for (const row of SEVEN_FLOORS) {
      const maximum = buildSevenFloorPlan({ characterId, floor: row.floor, amount: row.maxKaios });
      const smaller = buildSevenFloorPlan({ characterId, floor: row.floor, amount: "0.000000000000000001" });
      assert.equal(maximum.amountWei, String(parseUnits(row.maxKaios, 18)));
      assert.equal(maximum.paymentId, smaller.paymentId, "lesser amount cannot create a second entitlement ID");
      assert.equal(maximum.paymentId, sevenFloorPaymentId(characterId, row.floor));
      assert.throws(() => buildSevenFloorPlan({ characterId, floor: row.floor, amount: String(Number(row.maxKaios) + 1) }));
    }
    for (const floor of [-18, -1, 0, 8, 1.5, "1"]) assert.throws(() => buildSevenFloorPlan({ characterId, floor, amount: "1" }));
    for (const amount of ["0", "-1", "1e0", "1.080000000000000001", "1.0000000000000000001", 1]) assert.throws(() => buildSevenFloorPlan({ ...input, amount }));
  });
  await t.test("undeployed, binding, task, amount, pool, module and pause states are fail-closed", () => {
    assert.equal(deriveSevenFloorStep(plan, snapshot()).ready, true);
    for (const change of [s => { s.releaseVerified = false; }, s => { s.chainId = 1; },
      s => { s.account = alternate; }, s => { s.binding.beneficiary = zero; },
      s => { s.binding.currentFloor = "-18"; }, s => { s.binding.currentFloor = "2"; },
      s => { s.floor.taskEvidenceHash = `0x${"00".repeat(32)}`; }, s => { s.floor.claimed = true; },
      s => { s.floor.executableAt = String(timestamp + 1); }, s => { s.paymentConsumed = true; },
      s => { s.health.available = "1"; }, s => { s.health.paused = true; }, s => { s.health.healthy = false; },
      s => { s.module.perTransactionLimit = "1"; }, s => { s.module.epochLimit = "1"; },
      s => { s.module.epochSpent = formal.capWei; }, s => { s.module.active = false; },
      s => { s.module.versionHash = id("WRONG-MODULE-VERSION"); }, s => { s.identityErrors.push("RUNTIME_UNKNOWN"); },
    ]) { const state = snapshot(); change(state); assert.equal(deriveSevenFloorStep(plan, state).ready, false); }
    assert.equal(deriveSevenFloorStep({ ...plan, position: "18888" }, snapshot()).ready, false);
  });
  await t.test("funding precheck: exact Bank, per-transaction and daily one-wei boundaries stay independent", () => {
    const amount = BigInt(plan.amountWei), reserve = 420_000_000_000_000_000n, spent = 15n;
    const exact = () => { const state = snapshot(); Object.assign(state.health, { balance: String(amount + reserve), reserve: String(reserve), available: String(amount) });
      Object.assign(state.module, { perTransactionLimit: String(amount), epochLimit: String(amount + spent), epochSpent: String(spent) }); return state; };
    const state = exact(), step = deriveSevenFloorStep(plan, state), check = step.fundingPrecheck;
    assert.equal(step.ready, true); assert.equal(check.status, "SUFFICIENT"); assert.equal(check.known, true); assert.equal(check.enough, true);
    for (const [field, value] of Object.entries({ amountWei: amount, balance: amount + reserve, reserve, available: amount,
      perTransactionLimit: amount, epochLimit: amount + spent, epochSpent: spent, effectiveEpochSpent: spent, epochRemaining: amount })) assert.equal(BigInt(check[field]), value, field);
    assert.equal(check.blockNumber, state.blockNumber); assert.equal(String(check.timestamp), state.timestamp);
    assert.equal(check.poolSufficient, true); assert.equal(check.perTransactionSufficient, true); assert.equal(check.epochSufficient, true);
    for (const [label, mutate, field, reason, blocker] of [
      ["Bank", s => { s.health.available = String(amount - 1n); s.health.balance = String(amount - 1n + reserve); }, "poolSufficient", "AVAILABLE_FUNDS_INSUFFICIENT", "AVAILABLE_FUNDS_INSUFFICIENT"],
      ["per transaction", s => { s.module.perTransactionLimit = String(amount - 1n); }, "perTransactionSufficient", "PER_TRANSACTION_LIMIT_EXCEEDED", "MODULE_PAYMENT_LIMIT_EXCEEDED"],
      ["daily", s => { s.module.epochLimit = String(amount + spent - 1n); }, "epochSufficient", "DAILY_LIMIT_EXCEEDED", "MODULE_PAYMENT_LIMIT_EXCEEDED"],
    ]) {
      const changed = exact(); mutate(changed); const denied = deriveSevenFloorStep(plan, changed), precheck = denied.fundingPrecheck;
      assert.equal(denied.ready, false, label); assert.equal(precheck.status, "INSUFFICIENT", label);
      assert.equal(precheck.known, true, label); assert.equal(precheck.enough, false, label); assert.equal(precheck[field], false, label);
      assert.ok(precheck.reasons.includes(reason), label); assert.ok(denied.blockers.includes(blocker), label);
    }
  });
  await t.test("funding precheck: UTC rollover preserves raw spent but resets only effective daily use", () => {
    const amount = BigInt(plan.amountWei), epoch = Math.floor(timestamp / 86400), state = snapshot();
    state.timestamp = String(epoch * 86400 + 86399);
    Object.assign(state.module, { epochIndex: String(epoch), epochSpent: String(amount + 1n), epochLimit: String(amount) });
    const sameDay = deriveSevenFloorStep(plan, state).fundingPrecheck;
    assert.equal(sameDay.status, "INSUFFICIENT"); assert.equal(BigInt(sameDay.effectiveEpochSpent), amount + 1n); assert.equal(BigInt(sameDay.epochRemaining), 0n);
    state.timestamp = String((epoch + 1) * 86400);
    const before = structuredClone(state), nextDay = deriveSevenFloorStep(plan, state).fundingPrecheck;
    assert.equal(nextDay.status, "SUFFICIENT"); assert.equal(nextDay.enough, true); assert.equal(BigInt(nextDay.currentEpoch), BigInt(epoch + 1));
    assert.equal(BigInt(nextDay.epochIndex), BigInt(epoch)); assert.equal(BigInt(nextDay.epochSpent), amount + 1n);
    assert.equal(BigInt(nextDay.effectiveEpochSpent), 0n); assert.equal(BigInt(nextDay.epochRemaining), amount);
    equalInline(state, before, "a read-only precheck never rewrites the module's recorded epoch or use");
  });
  await t.test("funding precheck: missing or malformed funding stays unknown; Bank pause stays blocked", () => {
    for (const [label, mutate, missingFields] of [
      ["missing health", s => { s.health = null; }, ["balance", "reserve", "available"]],
      ["missing balance", s => { delete s.health.balance; }, ["balance"]],
      ["malformed reserve", s => { s.health.reserve = "1.5"; }, ["reserve"]],
      ["negative available", s => { s.health.available = "-1"; }, ["available"]],
      ["NaN balance", s => { s.health.balance = "NaN"; }, ["balance"]],
      ["missing module", s => { s.module = null; }, ["perTransactionLimit", "epochLimit", "epochSpent", "epochIndex"]],
      ["missing transaction limit", s => { delete s.module.perTransactionLimit; }, ["perTransactionLimit"]],
      ["malformed daily limit", s => { s.module.epochLimit = "Infinity"; }, ["epochLimit"]],
      ["negative spent", s => { s.module.epochSpent = "-1"; }, ["epochSpent"]],
      ["missing epoch", s => { s.module.epochIndex = null; }, ["epochIndex"]],
      ["invalid timestamp", s => { s.timestamp = "NaN"; }, ["timestamp", "currentEpoch"]],
    ]) {
      const state = snapshot(); mutate(state); const result = deriveSevenFloorStep(plan, state), check = result.fundingPrecheck;
      assert.equal(result.ready, false, label); assert.equal(check.status, "UNKNOWN", label); assert.equal(check.known, false, label); assert.equal(check.enough, false, label);
      for (const field of missingFields) assert.equal(check[field], null, `${label}: ${field} must remain unknown rather than become zero`);
    }
    for (const mutate of [s => { s.health.paused = true; s.health.isPaused = true; }, s => { s.health.healthy = false; }]) {
      const state = snapshot(); mutate(state); const result = deriveSevenFloorStep(plan, state);
      assert.equal(result.ready, false); assert.equal(result.fundingPrecheck.status, "BLOCKED");
    }
    const inactive = snapshot(); inactive.module.active = false;
    const result = deriveSevenFloorStep(plan, inactive);
    assert.equal(result.ready, false); assert.equal(result.fundingPrecheck.status, "SUFFICIENT", "pool sufficiency is not module identity, qualification or payment authority");
  });
  await t.test("funding precheck: insufficient and unknown previews cannot send or persist pending intent", async () => {
    for (const mutate of [
      s => { s.health.balance = s.health.reserve; s.health.available = "0"; },
      s => { s.module.perTransactionLimit = String(BigInt(plan.amountWei) - 1n); },
      s => { s.module.epochSpent = s.module.epochLimit; },
      s => { s.health = null; }, s => { s.module = null; },
    ]) {
      const m = mock(); m.mutate(mutate); const preview = await m.wallet.prepare(input);
      assert.equal(preview.step.ready, false); await assert.rejects(m.wallet.request(preview));
      assert.equal(m.sends().length, 0); assert.equal(m.storage.getItem(FUNDING_STORAGE_KEY), null);
      assert.equal(m.calls.some(call => call.method === "eth_estimateGas"), false, "blocked funding does not proceed to a fee request");
    }
  });
  await t.test("funding precheck: loss of available funds before or during fee recheck causes zero sends", async () => {
    for (const phase of ["before request", "during fee estimation"]) {
      const m = mock(), preview = await m.wallet.prepare(input);
      assert.equal(preview.step.ready, true);
      const gate = phase === "during fee estimation" ? m.pauseFee() : null;
      const dropFunds = () => m.mutate(s => { s.health.balance = s.health.reserve; s.health.available = "0"; });
      if (!gate) dropFunds();
      const request = m.wallet.request(preview);
      if (gate) { await gate.entered.promise; dropFunds(); gate.release.resolve(); }
      await assert.rejects(request, /FRESH_STATE_OR_ACCOUNT_CHANGED/);
      assert.equal(m.sends().length, 0, phase); assert.equal(m.storage.getItem(FUNDING_STORAGE_KEY), null, phase);
    }
  });
  await t.test("prepare quotes BNB only; one explicit request uses original shared lock and durable intent", async () => {
    const m = mock(); const preview = await m.wallet.prepare(input);
    assert.equal(preview.step.ready, true); assert.equal(preview.fee.estimatedWei, "21000000000000");
    assert.equal(preview.fee.asset, "BNB"); assert.equal(m.sends().length, 0);
    assert.equal(m.calls.some(call => call.method === "eth_requestAccounts"), false);
    const result = await m.wallet.request(preview);
    assert.equal(result.status, "SUBMITTED_UNCONFIRMED"); assert.equal(m.sends().length, 1);
    const pending = JSON.parse(m.storage.getItem(FUNDING_STORAGE_KEY));
    assert.equal(pending.kind, "FLOOR_CLAIM"); assert.equal(pending.expectedBeneficiary, receiver);
    assert.equal(pending.plan.paymentId, plan.paymentId); assert.equal(pending.hash, hash);
    assert.equal(m.lockCalls[0].name, FUNDING_LOCK_KEY);
    await assert.rejects(m.wallet.request(preview)); assert.equal(m.sends().length, 1);
    const low = mock({ lowGas: true }); const noFee = await low.wallet.prepare(input);
    assert.equal(noFee.step.ready, false); assert.ok(noFee.step.blockers.includes("BNB_GAS_INSUFFICIENT"));
    assert.equal(noFee.step.blockers.includes("FEE_OR_GAS_BALANCE_UNKNOWN"), false, "known BNB shortage is not an unknown fee");
    await assert.rejects(low.wallet.request(noFee)); assert.equal(low.sends().length, 0);
    const unknownFee = mock({ failGas: true }), unknownPreview = await unknownFee.wallet.prepare(input);
    assert.equal(unknownPreview.step.ready, false); assert.ok(unknownPreview.step.blockers.includes("FEE_OR_GAS_BALANCE_UNKNOWN"));
    await assert.rejects(unknownFee.wallet.request(unknownPreview)); assert.equal(unknownFee.sends().length, 0);
  });
  await t.test("account, chain, form invalidation, beneficiary and expiry changes during fees stop all sends", async () => {
    for (const change of [
      m => { m.mutate(s => { s.account = alternate; }); m.listeners.get("accountsChanged")([alternate]); },
      m => { m.mutate(s => { s.chainId = 1; }); m.listeners.get("chainChanged")("0x1"); },
      m => { m.wallet.invalidatePreview(); },
      m => { m.mutate(s => { s.binding.beneficiary = alternate; }); },
      m => { m.setTime(timestamp * 1000 + 120001); },
    ]) {
      const m = mock(); const preview = await m.wallet.prepare(input); const gate = m.pauseFee();
      const request = m.wallet.request(preview); await gate.entered.promise; change(m); gate.release.resolve();
      await assert.rejects(request, /FRESH_STATE_OR_ACCOUNT_CHANGED/); assert.equal(m.sends().length, 0);
      assert.equal(m.storage.getItem(FUNDING_STORAGE_KEY), null, "no intent can be installed from a stale fee request");
    }
  });
  await t.test("canonical three-event receipt and claimed/consumed state are required, not status1 alone", async () => {
    for (const invalid of ["status-only", "wrong-beneficiary", "wrong-payment", "noncanonical", "state-unknown"]) {
      const m = mock({ noncanonical: invalid === "noncanonical" }); await m.wallet.request(await m.wallet.prepare(input));
      let logs = paymentLogs();
      if (invalid === "status-only") logs = [];
      if (invalid === "wrong-beneficiary") logs[0] = eventLog(formal.kaios, "Transfer", [formal.bank, alternate, plan.amountWei]);
      if (invalid === "wrong-payment") logs[2] = eventLog(formal.bank, "ModulePaymentExecuted", [formal.moduleId, id("WRONG-ID"), receiver, plan.amountWei]);
      m.confirm(logs); if (invalid === "state-unknown") m.mutate(s => { s.paymentConsumed = false; });
      assert.equal((await m.wallet.reconcile(hash)).status, "MISMATCH", invalid);
      assert.notEqual(m.storage.getItem(FUNDING_STORAGE_KEY), null);
    }
    const m = mock(); await m.wallet.request(await m.wallet.prepare(input)); m.confirm();
    assert.equal((await m.wallet.reconcile(hash)).status, "VERIFIED_PAID");
    assert.equal(m.storage.getItem(FUNDING_STORAGE_KEY), null);
    const saved=JSON.parse(m.storage.getItem(FUNDING_EVIDENCE_PREFIX+hash));
    assert.equal(saved.evidence.intent.expectedBeneficiary,receiver.toLowerCase(),'the original floor recipient binding survives pending release');
    assert.equal(saved.evidence.intent.plan.characterId,characterId);
    assert.ok(m.lockCalls.every(call => call.name === FUNDING_LOCK_KEY), "request and reconciliation use the same original cross-tab mutex");
  });
  await t.test("reconcile A never clears a newer pending B; unavailable lock yields zero sends", async () => {
    const m = mock(); await m.wallet.request(await m.wallet.prepare(input)); m.confirm();
    const pendingA = JSON.parse(m.storage.getItem(FUNDING_STORAGE_KEY));
    const pendingB = { ...pendingA, intentId: "NEWER-PENDING-B", hash: `0x${"44".repeat(32)}` };
    const rawB = JSON.stringify(pendingB); m.onReceipt(() => m.storage.setItem(FUNDING_STORAGE_KEY, rawB));
    await assert.rejects(m.wallet.reconcile(hash), /PENDING_CHANGED_RETAIN_LOCK/);
    assert.equal(m.storage.getItem(FUNDING_STORAGE_KEY), rawB);
    for (const options of [{ noLocks: true }, { lockUnavailable: true }]) {
      const locked = mock(options); const preview = await locked.wallet.prepare(input);
      await assert.rejects(locked.wallet.request(preview), /WEB_LOCKS_REQUIRED_NO_SEND|ANOTHER_TAB_REQUEST_IN_PROGRESS/);
      assert.equal(locked.sends().length, 0); assert.equal(locked.storage.getItem(FUNDING_STORAGE_KEY), null);
    }
  });
  await t.test("shared pending receipt cannot cross between old fixed cases and seven-floor player flow", async () => {
    const m = mock(); await m.wallet.request(await m.wallet.prepare(input));
    const floorPending = m.storage.getItem(FUNDING_STORAGE_KEY);
    const legacyWallet = new HumanFundingWallet({ provider: m.provider, storage: m.storage,
      locks: { request: async (_name, _options, callback) => callback({}) } });
    const beforeLegacy = m.calls.length;
    await assert.rejects(legacyWallet.reconcile(hash), /PENDING_OTHER_FLOW_RECONCILE_AT_ORIGINAL_PANEL/);
    assert.equal(m.calls.length, beforeLegacy, "wrong-panel reconciliation stops before any provider request");
    assert.equal(m.storage.getItem(FUNDING_STORAGE_KEY), floorPending);
    const fixedPlan = buildLifeResourcePlan({ beneficiary: receiver, amount: "1080000" });
    const fixedPending = JSON.stringify({ ...JSON.parse(floorPending), plan: fixedPlan, kind: "PAYOUT" });
    m.storage.setItem(FUNDING_STORAGE_KEY, fixedPending);
    const beforeFloor = m.calls.length;
    await assert.rejects(m.wallet.reconcile(hash), /PENDING_OTHER_FLOW_RECONCILE_AT_ORIGINAL_PANEL/);
    assert.equal(m.calls.length, beforeFloor);
    assert.equal(m.storage.getItem(FUNDING_STORAGE_KEY), fixedPending);
  });
});
