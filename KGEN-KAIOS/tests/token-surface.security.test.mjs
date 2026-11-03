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
import { id } from "ethers";
const BANK_CONTROLLER_MARKER = "// BEGIN HUMAN FUNDING CONTROLLER";
const BANK_TEST_ETHER = 10n ** 18n;
async function inlineBankApi() {
  const ethers = await import("ethers"), vm = await import("node:vm");
  const html = fs.readFileSync(path.resolve(root, "../K線西遊記/temples/18888/index.html"), "utf8");
  const source = html.match(/<script\b[^>]*id="funding-controller"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(source?.includes(BANK_CONTROLLER_MARKER), "execute the real retained inline component");
  const adapter = source.split(BANK_CONTROLLER_MARKER)[0].replace(/^import[^\n]+\r?\n/gm, "");
  const context = { ...ethers, window: {}, navigator: {}, structuredClone };
  vm.runInNewContext(adapter + `\nglobalThis.bankTestApi = {
    FUNDING_FORMAL,FUNDING_RUNTIME_PINS,FUNDING_IMPLEMENTATION_SLOT,FUNDING_STORAGE_KEY,FUNDING_LOCK_KEY,
    buildLifeResourcePlan,deriveFundingStep,HumanFundingWallet,
    buildBankPausePlan,deriveBankPauseStep,HumanBankPauseWallet,readFundingRuntimePins
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
    const { buildBankPausePlan } = await inlineBankApi();
    const html = readFileSync(new URL("../../K線西遊記/temples/18888/index.html", import.meta.url), "utf8");
    const source = html.match(/<script\b[^>]*id="funding-controller"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    assert.ok(source, "test the real existing inline funding controller");
    assert.ok(source.includes(BANK_CONTROLLER_MARKER));
    const controller = source.split(BANK_CONTROLLER_MARKER)[1];
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
      node("beneficiary").value = beneficiary; node("amount").value = "1080000"; node("role").value = "mother";
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
            step: { ready: allowed, kind: pause ? "BANK_PAUSE" : "ALLOCATION_PROPOSE",
              blockers: allowed ? [] : ["GUANYIN_PAUSER_REQUIRED"], to: pause ? formal.bank : formal.governance } };
        }
        async request(candidate) { requests.push(candidate); if (this.nextSend) await this.nextSend.promise; return { hash: transactionHash }; }
        async reconcile() { if (this.nextReceipt) await this.nextReceipt.promise;
          return { hash: transactionHash, status: this instanceof FakePauseWallet ? "BANK_PAUSED" : "CONFIRMED" }; }
      }
      class FakePauseWallet extends FakeWallet {
        async prepare() { return super.prepare(buildBankPausePlan()); }
      }
      const window = { ethereum: provider, location: new URL(options.href ?? "http://localhost:8080/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/18888/index.html"),
        localStorage: storage(), addEventListener() {}, dispatchEvent() {} };
      const context = { window, document: { getElementById: (id) => node(id.replace(/^funding-/, "")),
        createElement: () => ({ value: "", textContent: "" }), head: { append() { throw Error("No external scripts in offline UI test"); } } },
        Event: class { constructor(type) { this.type = type; } },
        CustomEvent: class { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } }, URL,
        Option: class { constructor(textContent, value) { this.textContent = textContent; this.value = value; } },
        FUNDING_FORMAL: formal, buildLifeResourcePlan, buildBankPausePlan,
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
