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
async function inlineBankApi() {
  const vm = await import("node:vm"), { createRequire } = await import("node:module");
  const ethers = createRequire(import.meta.url)(path.resolve(root, "../K線西遊記/temples/12345/assets/ethers-5.7.2.umd.min.js"));
  const html = fs.readFileSync(path.resolve(root, "../K線西遊記/temples/18888/index.html"), "utf8");
  const source = html.match(/<script\b[^>]*id="funding-controller"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(source?.includes(BANK_CONTROLLER_MARKER), "execute the real retained inline component");
  const adapter = source.split(BANK_CONTROLLER_MARKER)[0].replace(/^import[^\n]+\r?\n/gm, "");
  const context = { ...ethers.utils, window: {}, navigator: {}, structuredClone };
  vm.runInNewContext(adapter + `\nglobalThis.bankTestApi = {
    FUNDING_FORMAL,FUNDING_RUNTIME_PINS,FUNDING_IMPLEMENTATION_SLOT,FUNDING_STORAGE_KEY,FUNDING_LOCK_KEY,
    buildLifeResourcePlan,deriveFundingStep,HumanFundingWallet,buildSharedCapPlan,deriveSharedCapStep,SharedCapWallet,
    buildBankPausePlan,deriveBankPauseStep,HumanBankPauseWallet,readFundingRuntimePins,
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
      (s) => { s.module.perTransactionLimit = "1"; s.module.epochLimit = "1"; s.module.epochSpent = "1"; },
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
      assert.equal(mock.sends().length, 1);
    }
  });

  await t.test("cap execute confirms only exact event and exact resulting module caps", async () => {
    for (const mode of ["exact", "wrong-event-hash", "wrong-result-cap"]) {
      const logs = [eventLog(formal.governance, "GovernanceProposalExecuted", [plan.cap.proposalId,
        plan.cap.target, mode === "wrong-event-hash" ? id("incorrect cap calldata") : plan.cap.dataHash])];
      const mock = mockWallet({ receipt: receipt(logs) });
      const state = snapshot();
      state.module.perTransactionLimit = "1"; state.module.epochLimit = "1";
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

  await t.test("actual funding controller discards stale prepare success and failure after form changes", async () => {
    const { readFileSync } = await import("node:fs");
    const { runInNewContext } = await import("node:vm");
    const { buildBankPausePlan, buildSharedCapPlan } = await inlineBankApi();
    const html = readFileSync(new URL("../../K線西遊記/temples/18888/index.html", import.meta.url), "utf8");
    const source = html.match(/<script\b[^>]*id="funding-controller"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    assert.ok(source, "test the real existing inline funding controller");
    assert.ok(source.includes(BANK_CONTROLLER_MARKER));
    const controller = source.split(BANK_CONTROLLER_MARKER)[1].split(BANK_CONTROLLER_END)[0];
    const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
    const mount = async (options = {}) => {
      const nodes = new Map(), providerListeners = new Map(), requests = [], wallets = [];
      const state = { account: options.account ?? formal.mother, chainId: 56, pauser: options.pauser ?? false };
      const node = (name) => {
        if (!nodes.has(name)) {
          const listeners = new Map();
          nodes.set(name, { value: "", checked: false, disabled: false, textContent: "", readOnly: false,
            options: [{ value: "", textContent: "" }], files: [], attrs: {},
            setAttribute(name, value) { this.attrs[name] = String(value); },
            getAttribute(name) { return this.attrs[name] ?? null; },
            removeAttribute(name) { delete this.attrs[name]; },
            get href() { return this.attrs.href ?? ""; }, set href(value) { this.attrs.href = String(value); },
            addEventListener: (event, handler) => listeners.set(event, handler),
            emit: (event) => listeners.get(event)?.(),
            replaceChildren(...children) { this.options = children; },
            append(child) { this.options.push(child); } });
        }
        return nodes.get(name);
      };
      node("beneficiary").value = beneficiary; node("amount").value = "1080000"; node("role").value = "mother"; node("mode").value = "fixed";
      // Match the retained HTML's inert native anchors before the controller boots.
      for (const name of ["native-metamask", "native-trust"]) {
        node(name).setAttribute("aria-disabled", "true"); node(name).tabIndex = -1;
      }
      const provider = { request: async ({ method }) => {
        if (method === "eth_accounts") return [state.account];
        if (method === "eth_chainId") return `0x${state.chainId.toString(16)}`;
        throw Error(`Unexpected offline UI provider request: ${method}`);
      }, on: (event, handler) => providerListeners.set(event, handler) };
      class FakeWallet {
        constructor() { this.next = null; this.invalidations = 0; wallets.push(this); }
        invalidatePreview() { this.invalidations++; }
        invalidate() { this.invalidatePreview(); }
        async connect() { return [state.account]; }
        async prepare(nextPlan) {
          const wait = this.next; this.next = null;
          if (wait) await wait.promise;
          const pause = nextPlan?.type === "BANK_PAUSE";
          const allowed = options.forceReady ?? (!pause || state.account.toLowerCase() === formal.guanyin.toLowerCase() && state.pauser && state.chainId === 56);
          return { plan: nextPlan, account: state.account,
            snapshot: { account: state.account, chainId: state.chainId, codeOk: true, identityErrors: [],
              roles: { proposer: state.account === formal.mother, approver: state.account === formal.jade, pauser: state.pauser },
              ...options.snapshotOverride },
            step: { ready: allowed, kind: pause ? "BANK_PAUSE" : nextPlan?.type === "SHARED_CAP" ? "CAP_PROPOSE" : "ALLOCATION_PROPOSE",
              blockers: allowed ? [] : ["GUANYIN_PAUSER_REQUIRED"], to: pause ? formal.bank : formal.governance } };
        }
        async request(candidate) { requests.push(candidate); if (this.nextSend) await this.nextSend.promise; return { hash: transactionHash }; }
        async reconcile() { if (this.nextReceipt) await this.nextReceipt.promise;
          return { hash: transactionHash, status: this instanceof FakePauseWallet ? "BANK_PAUSED" : "CONFIRMED" }; }
      }
      class FakePauseWallet extends FakeWallet {
        async prepare() { return super.prepare(buildBankPausePlan()); }
      }
      class FakeCapWallet extends FakeWallet { async prepare(plan = buildSharedCapPlan()) { return super.prepare(plan); } }
      const window = { ethereum: provider, location: new URL(options.href ?? "http://localhost:8080/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/18888/index.html"),
        localStorage: storage(), addEventListener() {}, dispatchEvent() {} };
      const context = { window, document: { getElementById: (id) => node(id.replace(/^funding-/, "")),
        createElement: () => ({ value: "", textContent: "" }), head: { append() { throw Error("No external scripts in offline UI test"); } } },
        Event: class { constructor(type) { this.type = type; } },
        CustomEvent: class { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } }, URL,
        Option: class { constructor(textContent, value) { this.textContent = textContent; this.value = value; } },
        FUNDING_FORMAL: formal, buildLifeResourcePlan, buildBankPausePlan, buildSharedCapPlan, SharedCapWallet: FakeCapWallet,
        HumanFundingWallet: FakeWallet, HumanBankPauseWallet: FakePauseWallet };
      runInNewContext(controller + "\nglobalThis.uiProbe = { preview: () => preview, setCases: (cases) => { importedCases = cases; } };", context);
      node("wallet").value = "0";
      await node("connect").onclick();
      return { node, wallets, requests, state, providerListeners, probe: context.uiProbe };
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
      assert.equal(cap.node("send").disabled, false);
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
      assert.equal(cap.probe.preview().plan.type, "BANK_PAUSE", "Guanyin always takes priority over cap mode");
      assert.equal(cap.node("send").disabled, true, "Mother/Jade cannot acquire Guanyin authority by choosing pause");
    }

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
  await t.test("real fixed-block inspector reads shared governance and three pins, never individual cases", async () => {
    const calls = [], token = new Interface(["function decimals() view returns(uint8)"]);
    const provider = { request:async({method,params=[]})=>{
      calls.push({method,params});
      if (method === "eth_chainId") return "0x38";
      if (method === "eth_accounts") return [F.mother];
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
    const wallet = new api.SharedCapWallet({provider,storage:storage()}); const state = await wallet.inspect(plan);
    assert.equal(calls.filter(c=>c.method==="eth_getStorageAt").length,3);
    assert.equal(calls.filter(c=>c.method==="eth_call" && c.params[0].data.startsWith(gov.getFunction("proposal").selector)).length,1);
    assert.ok(state.identityErrors.length>=3,"synthetic runtime bytes must fail the actual reviewed pins");
    assert.equal(api.deriveSharedCapStep(plan,state).ready,false);
    for (const key of ["allocationProposal","allocation","paymentConsumed"]) assert.equal(Object.hasOwn(state,key),false,key);
    assert.equal(calls.some(c=>/send|sign/i.test(c.method)),false);
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
  await t.test("all four flows and unknown pending types remain isolated before provider reads", async () => {
    const flows=[[api.SharedCapWallet,plan,"CAP_PROPOSE"],[api.HumanFundingWallet,api.buildLifeResourcePlan({beneficiary:F.mother,amount:"1"}),"CAP_PROPOSE"],
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
  const { FUNDING_FORMAL: formal, FUNDING_LOCK_KEY, FUNDING_STORAGE_KEY, SEVEN_FLOORS, SEVEN_FLOOR_RELEASE,
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
