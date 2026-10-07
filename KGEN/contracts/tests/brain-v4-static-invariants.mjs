import fs from 'node:fs';
import assert from 'node:assert/strict';

const path = 'KGEN/contracts/KGEN_BrainExchange.sol';
const src = fs.readFileSync(path, 'utf8');

const mustContain = [
  'contract KGEN_BrainExchange_V4_0_0',
  'UUPSUpgradeable',
  'totalPrincipal',
  'totalRewardLiability',
  'function reservedBalance()',
  'function freeSurplus()',
  'function solvent()',
  'BRAIN_CAPACITY_EXCEEDED',
  'require(amountWei <= freeSurplus(), "SURPLUS_ONLY")',
  'MIN_UPGRADE_DELAY = 24 hours',
  'function withdrawMargin(uint256 amountWei) external nonReentrant',
  'function claimProfit() external nonReentrant',
  'function fundSettlementCapital(uint256 requestedWei)',
  'function fundInsurance(uint256 requestedWei)',
  'function reservePositionRisk(bytes32 positionKey',
  'function claimSettlement(bytes32 positionKey) external nonReentrant',
  'function custodyReservedBalance()',
  'settlementCapital + reservedSettlementLiability',
  'return custodyReservedBalance() + totalPlayerClaimable',
  'return settlementCapital - totalPlayerClaimable',
  'uint256[29] private __gap',
];
for (const needle of mustContain) assert.ok(src.includes(needle), `missing invariant marker: ${needle}`);

for (const fn of ['withdrawMargin', 'claimProfit', 'claimSettlement']) {
  const m = src.match(new RegExp(`function ${fn}\\([^)]*\\)[^{]*\\{`));
  assert.ok(m, `missing function header: ${fn}`);
  assert.ok(!m[0].includes('whenNotPaused'), `${fn} must remain available while paused`);
}

const depositHeader = src.match(/function depositMargin\([^)]*\)[^{]*\{/);
assert.ok(depositHeader?.[0].includes('whenNotPaused'), 'depositMargin must be pause-gated');
assert.match(src,/newTotalPrincipal\s*=\s*totalPrincipal\s*\+\s*receivedWei[\s\S]*?newTotalPrincipal\s*<=\s*principalCapacityWei\(\)/,'deposit must enforce principal capacity');

for (const fn of ['supplyHeart', 'sweepToTreasury']) {
  const start = src.indexOf(`function ${fn}`);
  assert.ok(start >= 0, `missing ${fn}`);
  const next = src.indexOf('\n    function ', start + 1);
  const body = src.slice(start, next >= 0 ? next : src.length);
  assert.ok(body.includes('amountWei <= freeSurplus()'), `${fn} must be surplus-only`);
  assert.ok(body.includes('_assertSolvent()'), `${fn} must assert solvency after transfer`);
}

const payrollStart = src.indexOf('function rollPayroll');
const payrollEnd = src.indexOf('\n    function ', payrollStart + 1);
const payroll = src.slice(payrollStart, payrollEnd >= 0 ? payrollEnd : src.length);
assert.ok(payroll.includes('totalRewardLiability += marginReward'), 'payroll must reserve margin reward liability');
assert.ok(payroll.includes('_assertSolvent()'), 'payroll must assert solvency');
assert.ok(src.includes('scheduledImplementation'), 'scheduled implementation state missing');
assert.ok(src.includes('scheduledUpgradeEta'), 'scheduled upgrade ETA missing');
assert.ok(src.includes('upgradeDelay'), 'upgrade delay missing');
const funding = src.slice(src.indexOf('function _receiveFunding'), src.indexOf('function fundSettlementCapital'));
assert.ok(funding.includes('receivedWei = afterBal - beforeBal'), 'funding must use actual received tokens');
const settlement = src.slice(src.indexOf('function settlePositionCollateral'), src.indexOf('function custodyReservedBalance'));
assert.ok(!settlement.includes('INSUFFICIENT_REAL_SURPLUS'), 'unfunded profit must become claimable rather than trapping exits');
assert.ok(settlement.includes('_releasePositionRisk(positionKey)'), 'settlement must release liability exactly once');
assert.ok(settlement.includes('settlementCapital += lossWei'), 'realized losses must remain isolated from Treasury');
assert.match(src, /function solvent\(\)[^{]+\{ return kgen.balanceOf\(address\(this\)\) >= custodyReservedBalance\(\)/, 'unfunded debt must not freeze otherwise cash-backed principal exits');

console.log('[brain-v4-static-invariants] PASS');

// Optional compiled-interface gate for the existing BSC56 candidate organs.
// TESTNET_EXECUTION_ABI is a compatibility export name, not the product network.
// Ordinary static invocation above remains dependency-free. No provider/signer.
if (process.argv.includes('--runtime-execution-abi')) {
  fs.rmSync('artifacts/runtime-execution-abi.json', {force: true});
  const {createHash} = await import('node:crypto');
  const {execFileSync} = await import('node:child_process');
  const {Fragment, id} = await import('ethers');
  const {default: solc} = await import('solc');
  const {TESTNET_EXECUTION_ABI, CAPITAL_EXECUTION_ABI} = await import('../../../K線西遊記/temples/11520/runtime/real-trading-order-intent.mjs');
  const sha256 = value => createHash('sha256').update(value).digest('hex');
  const clone = value => JSON.parse(JSON.stringify(value));
  const stable = value => JSON.stringify(value, (_, item) => item && !Array.isArray(item) && typeof item === 'object'
    ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
  const runtimePath = 'K線西遊記/temples/11520/runtime/real-trading-order-intent.mjs';
  const entries = ['BrainExchange', 'MarketRiskKernel', 'PositionEngine', 'OrderTriggerEngine', 'OracleSourceAdapter']
    .map(name => `KGEN/contracts/KGEN_${name}.sol`);
  const contracts = {
    brainProxy: ['KGEN/contracts/KGEN_BrainExchange.sol', 'KGEN_BrainExchange_V4_0_0'],
    orderTriggerEngine: ['KGEN/contracts/KGEN_OrderTriggerEngine.sol', 'KGEN_OrderTriggerEngine'],
    positionEngine: ['KGEN/contracts/KGEN_PositionEngine.sol', 'KGEN_PositionEngine_V1_0_0'],
  };
  // Deliberately independent of the exported arrays: removing a used fragment
  // must fail. Unrelated administrative methods are not frontend requirements.
  const required = {
    TESTNET_EXECUTION_ABI: {
      brainProxy: 'kgen principalOf lockedPrincipalOf availablePrincipal SETTLEMENT_ROLE hasRole depositMargin withdrawMargin MarginDeposited MarginWithdrawn',
      orderTriggerEngine: 'brain engine nextOrderId createOrder cancelOrder closePosition order fillReceipt OrderCreated OrderFilled OrderTerminated',
      positionEngine: 'brainSettlement executor readMarketPrice marketConfig positionSnapshot orderTerms liquidationBoundary markPosition settlementReceipt PositionOpened PositionClosed PositionLiquidated',
    },
    CAPITAL_EXECUTION_ABI: {
      brainProxy: 'playerClaimable settlementCapital reservedSettlementLiability availableRiskCapacity settlementClaims claimSettlement SettlementClaimRecorded SettlementClaimPaid',
      positionEngine: 'previewLiquidationBoundary positionKey',
    },
  };
  // Required decoder property names are independent of current runtime exports.
  // Bare integer return values and intentionally unnamed inputs stay compatible.
  const requiredDecoderFields = {
    "brainProxy.MarginDeposited": "user requestedWei receivedWei",
    "brainProxy.MarginWithdrawn": "user amountWei",
    "orderTriggerEngine.order": "orderId trader market c lots triggerPrice createdAt triggeredAt observedPrice fillPrice positionId status previousPrice observedAt observationSequence",
    "orderTriggerEngine.fillReceipt": "orderId positionId trader market c lots createdAt triggeredAt previousPrice triggerPrice observedPrice fillPrice walletBefore marginLocked walletAfter side observationSequence",
    "orderTriggerEngine.OrderCreated": "orderId trader",
    "orderTriggerEngine.OrderFilled": "orderId positionId price",
    "orderTriggerEngine.OrderTerminated": "orderId status",
    "positionEngine.readMarketPrice": "priceWad observedAt validSources",
    "positionEngine.marketConfig": "initialMarginBps maintenanceMarginBps maxOracleAge minPriceWad maxPriceWad enabled",
    "positionEngine.positionSnapshot": "trader market sizeWad collateralWad entryPriceWad openedAt closedAt exitPriceWad rawPnlWad realizedPnlWad badDebtWad status",
    "positionEngine.orderTerms": "orderId cWad lots lastPrice observedAt observationSequence",
    "positionEngine.markPosition": "unrealizedPnlWad equityWad maintenanceMarginWad liquidatable",
    "positionEngine.settlementReceipt": "positionId orderId market cWad lots entryPrice liquidationTrigger previousPrice observedPrice observedAt settledAt marginBefore marginAfter rawPnl realizedPnl badDebt status trader side settlementPrice triggeredAt observationSequence",
    "positionEngine.PositionOpened": "positionId trader market sizeWad collateralWad entryPriceWad positionKey",
    "positionEngine.PositionClosed": "positionId exitPriceWad rawPnlWad realizedPnlWad badDebtWad",
    "positionEngine.PositionLiquidated": "positionId markPriceWad rawPnlWad realizedPnlWad badDebtWad",
    "brainProxy.settlementClaims": "user orderId positionId dueWei paidWei remainingWei createdAt updatedAt",
    "brainProxy.SettlementClaimRecorded": "positionKey user dueWei paidWei remainingWei",
    "brainProxy.SettlementClaimPaid": "positionKey user paidWei remainingWei"
  };
  const decoderNames = p => [...(p.name ? [p.name] : []), ...(p.components || []).flatMap(decoderNames),
    ...(p.arrayChildren ? decoderNames(p.arrayChildren) : [])];
  const exports = {TESTNET_EXECUTION_ABI, CAPITAL_EXECUTION_ABI};
  const parameter = p => ({type: p.format('sighash'), name: p.name || '',
    ...(p.components ? {components: p.components.map(parameter)} : {}),
    ...(p.arrayChildren ? {arrayChildren: parameter(p.arrayChildren)} : {}),
    ...(p.indexed == null ? {} : {indexed: p.indexed})});
  const shape = f => ({type: f.type, name: f.name,
    inputs: f.inputs.map(parameter),
    ...(f.type === 'function' ? {outputs: f.outputs.map(parameter), stateMutability: f.stateMutability} : {anonymous: f.anonymous})});
  // Input names are not part of calldata. Runtime unnamed inputs are permitted;
  // named tuple fields and named outputs must retain their decoder properties.
  const compatibleParameter = (actual, canonical, label) => {
    assert.equal(actual.type, canonical.type, `${label}: type/width/signedness`);
    if (actual.name) assert.equal(actual.name, canonical.name, `${label}: named field/order`);
    assert.equal(Boolean(actual.indexed), Boolean(canonical.indexed), `${label}: indexed`);
    assert.equal(actual.components?.length, canonical.components?.length, `${label}: tuple arity`);
    assert.equal(Boolean(actual.arrayChildren), Boolean(canonical.arrayChildren), `${label}: array shape`);
    if (actual.arrayChildren) compatibleParameter(actual.arrayChildren, canonical.arrayChildren, `${label}[]`);
    actual.components?.forEach((p, i) => compatibleParameter(p, canonical.components[i], `${label}.${i}`));
  };
  function compareFragment(runtime, canonical) {
    const a = shape(Fragment.from(runtime)), b = shape(Fragment.from(canonical));
    assert.equal(a.type, b.type, 'fragment kind');
    assert.equal(a.name, b.name, 'fragment name');
    assert.equal(a.stateMutability, b.stateMutability, `${a.name}: mutability`);
    assert.equal(a.anonymous, b.anonymous, `${a.name}: anonymous`);
    for (const field of ['inputs', 'outputs']) {
      assert.equal(a[field]?.length, b[field]?.length, `${a.name}: ${field} arity`);
      a[field]?.forEach((p, i) => compatibleParameter(p, b[field][i], `${a.name}.${field}.${i}`));
    }
    const signature = Fragment.from(runtime).format('sighash');
    assert.equal(signature, Fragment.from(canonical).format('sighash'), `${a.name}: signature`);
    const hash = id(signature), canonicalHash = id(Fragment.from(canonical).format('sighash'));
    assert.equal(hash, canonicalHash, `${a.name}: selector/topic`);
    return {signature, ...(a.type === 'event' ? {topic: hash} : {selector: hash.slice(0, 10)})};
  }
  function validateExports(runtimeExports, compiled) {
    const checked = [];
    for (const [exportName, groups] of Object.entries(required)) {
      for (const [organ, names] of Object.entries(groups)) {
        assert.ok(Array.isArray(runtimeExports[exportName]?.[organ]), `${exportName}.${organ}: missing group`);
        const fragments = runtimeExports[exportName][organ].map(text => Fragment.from(text));
        const keys = fragments.map(f => `${f.type}:${f.name}`);
        assert.equal(new Set(keys).size, keys.length, `${exportName}.${organ}: duplicate fragment`);
        for (const name of names.split(' ')) assert.ok(fragments.some(f => f.name === name), `missing required fragment: ${exportName}.${organ}.${name}`);
        for (const fragment of fragments) {
          assert.ok(['function', 'event'].includes(fragment.type), 'unsupported frontend fragment');
          const expectedNames = requiredDecoderFields[`${organ}.${fragment.name}`];
          if (expectedNames) assert.equal((fragment.type === 'event' ? fragment.inputs : fragment.outputs).flatMap(decoderNames).join(' '), expectedNames, `${organ}.${fragment.name}: required decoder fields`);
          const matches = compiled[organ].filter(f => f.type === fragment.type && f.name === fragment.name);
          assert.equal(matches.length, 1, `${organ}.${fragment.name}: missing or ambiguous canonical fragment`);
          checked.push({exportName, organ, ...compareFragment(fragment, matches[0])});
        }
      }
    }
    return checked;
  }
  function assertBinding(expected, actual) {
    assert.equal(actual.sourceDigest, expected.sourceDigest, 'source digest mismatch');
    assert.equal(actual.bytecodeDigest, expected.bytecodeDigest, 'source-bound bytecode digest mismatch');
    assert.equal(actual.artifactDigest, expected.artifactDigest, 'artifact digest mismatch');
  }
  const buildDir = process.env.K11520_ABI_BUILD_DIR || '/tmp/brain-v4-build';
  const readArtifact = file => {
    assert.ok(fs.existsSync(file), `required compiler artifact missing: ${file}`);
    const bytes = fs.readFileSync(file);
    assert.ok(bytes.length, `empty compiler artifact: ${file}`);
    const abi = JSON.parse(bytes);
    assert.ok(Array.isArray(abi) && abi.length, `invalid compiler ABI: ${file}`);
    return {bytes, abi};
  };
  const artifacts = Object.fromEntries(Object.entries(contracts).map(([organ, [source, contract]]) => {
    const file = `${buildDir}/${source.replaceAll('/', '_').replace('.sol', '_sol')}_${contract}.abi`;
    const binaryFile = file.replace(/\.abi$/, '.bin');
    assert.ok(fs.existsSync(binaryFile), `required compiler artifact missing: ${binaryFile}`);
    const binary = fs.readFileSync(binaryFile, 'utf8').trim();
    assert.match(binary, /^(?:[a-fA-F0-9]{2})+$/, `invalid compiler binary: ${binaryFile}`);
    return [organ, {file, binaryFile, binary, ...readArtifact(file)}];
  }));
  assert.match(solc.version(), /^0\.8\.24\+commit\.e11b9ed9\./, 'pinned solc required');
  for (const pkg of ['contracts', 'contracts-upgradeable']) {
    assert.equal(JSON.parse(fs.readFileSync(`node_modules/@openzeppelin/${pkg}/package.json`, 'utf8')).version, '5.0.2', 'pinned OpenZeppelin required');
  }
  // Recompile from exact source bytes with the same canonical entrypoints and
  // optimizer settings. A stale/swapped ABI cannot acquire provenance merely
  // by being hashed after compilation. Capture all transitive imports as well.
  const sources = Object.fromEntries(entries.map(file => [file, {content: fs.readFileSync(file, 'utf8')}]));
  const settings = {optimizer: {enabled: true, runs: 200}, outputSelection: {'*': {'*': ['abi', 'evm.bytecode.object']}}};
  const output = JSON.parse(solc.compile(JSON.stringify({language: 'Solidity', sources, settings}), {import(file) {
    const location = file.startsWith('@openzeppelin/') ? `node_modules/${file}` : file;
    try { const content = fs.readFileSync(location, 'utf8'); sources[file] = {content}; return {contents: content}; }
    catch { return {error: `missing source: ${file}`}; }
  }}));
  assert.deepEqual((output.errors || []).filter(e => e.severity === 'error'), [], 'canonical recompilation failed');
  const sourceHashes = Object.fromEntries(Object.entries(sources).map(([file, {content}]) => [file, sha256(content)]));
  const sourceDigest = sha256(stable({compiler: solc.version(), settings, sourceHashes}));
  const bindings = {}, compiled = {};
  for (const [organ, [source, contract]] of Object.entries(contracts)) {
    const abi = output.contracts[source][contract].abi;
    const artifactDigest = sha256(stable(abi));
    const bytecode = output.contracts[source][contract].evm.bytecode.object;
    const bytecodeDigest = sha256(bytecode);
    assertBinding({sourceDigest, artifactDigest, bytecodeDigest}, {sourceDigest,
      artifactDigest: sha256(stable(artifacts[organ].abi)), bytecodeDigest: sha256(artifacts[organ].binary)});
    compiled[organ] = abi;
    bindings[organ] = {source, contract, sourceSha256: sourceHashes[source], artifact: artifacts[organ].file,
      artifactFileSha256: sha256(artifacts[organ].bytes), binaryFile: artifacts[organ].binaryFile, bytecodeSha256: bytecodeDigest, canonicalAbiSha256: artifactDigest, sourceDigest};
  }
  const checked = validateExports(exports, compiled);
  let negativeFixtures = 0;
  const reject = (label, fn, pattern) => { assert.throws(fn, pattern, label); negativeFixtures++; };
  const mutate = (organ, name, update) => {
    const changed = clone(compiled); update(changed[organ].find(f => f.name === name));
    return () => validateExports(exports, changed);
  };
  const missing = clone(exports);
  missing.CAPITAL_EXECUTION_ABI.brainProxy = missing.CAPITAL_EXECUTION_ABI.brainProxy.filter(f => !f.includes('function claimSettlement('));
  reject('missing declared required runtime fragment', () => validateExports(missing, compiled), /missing required fragment/);
  for (const [organ, name, before, after] of [
    ['positionEngine', 'marketConfig', 'uint16 initialMarginBps', 'uint16'],
    ['positionEngine', 'positionSnapshot', 'address trader', 'address'],
  ]) {
    const changed = clone(exports);
    changed.TESTNET_EXECUTION_ABI[organ] = changed.TESTNET_EXECUTION_ABI[organ].map(f => f.startsWith('function ' + name + '(') ? f.replace(before, after) : f);
    reject('missing decoder field ' + name, () => validateExports(changed, compiled), /required decoder fields/);
  }
  const missingEventName = clone(exports);
  missingEventName.TESTNET_EXECUTION_ABI.brainProxy = missingEventName.TESTNET_EXECUTION_ABI.brainProxy.map(f => f.replace('address indexed user', 'address indexed'));
  reject('missing named event decoder field', () => validateExports(missingEventName, compiled), /required decoder fields/);
  const absent = clone(compiled); absent.brainProxy = absent.brainProxy.filter(f => f.name !== 'depositMargin');
  reject('missing canonical fragment', () => validateExports(exports, absent), /missing or ambiguous canonical/);
  reject('integer width', mutate('brainProxy', 'depositMargin', f => f.inputs[0].type = 'uint128'), /type\/width/);
  reject('signedness', mutate('orderTriggerEngine', 'createOrder', f => f.inputs[1].type = 'uint256'), /type\/width/);
  reject('tuple width', mutate('positionEngine', 'positionSnapshot', f => f.outputs[0].components[5].type = 'uint256'), /type\/width/);
  reject('tuple field order', mutate('orderTriggerEngine', 'order', f => [f.outputs[0].components[0], f.outputs[0].components[2]] = [f.outputs[0].components[2], f.outputs[0].components[0]]), /type\/width|named field/);
  reject('same-type tuple field order', mutate('orderTriggerEngine', 'order', f => [f.outputs[0].components[5], f.outputs[0].components[6]] = [f.outputs[0].components[6], f.outputs[0].components[5]]), /named field/);
  reject('output order', mutate('positionEngine', 'readMarketPrice', f => [f.outputs[0], f.outputs[1]] = [f.outputs[1], f.outputs[0]]), /named field/);
  reject('mutability', mutate('brainProxy', 'depositMargin', f => f.stateMutability = 'payable'), /mutability/);
  reject('event indexing', mutate('brainProxy', 'MarginDeposited', f => f.inputs[0].indexed = false), /indexed/);
  reject('event anonymity', mutate('brainProxy', 'MarginDeposited', f => f.anonymous = true), /anonymous/);
  // Arrays are not currently exposed, but the comparison must not flatten them.
  compareFragment('function arrayFixture(tuple(uint64 n,int256[2] values)[] rows) view returns(uint8[3])', 'function arrayFixture(tuple(uint64 n,int256[2] values)[] rows) view returns(uint8[3])');
  reject('array width', () => compareFragment('function x(uint256[2])', 'function x(uint256[3])'), /type\/width/);
  reject('tuple array width', () => compareFragment('function x(tuple(uint8 n)[2])', 'function x(tuple(uint8 n)[3])'), /type\/width/);
  reject('array signedness', () => compareFragment('function x(int256[])', 'function x(uint256[])'), /type\/width/);
  reject('source digest', () => assertBinding({sourceDigest, artifactDigest: 'a'}, {sourceDigest: 'changed', artifactDigest: 'a'}), /source digest/);
  reject('same-ABI stale source-bound binary', () => assertBinding({sourceDigest, artifactDigest: 'a', bytecodeDigest: 'a'}, {sourceDigest, artifactDigest: 'a', bytecodeDigest: 'changed'}), /source-bound bytecode digest/);
  reject('artifact digest', () => assertBinding({sourceDigest, artifactDigest: 'a'}, {sourceDigest, artifactDigest: 'changed'}), /artifact digest/);
  reject('missing artifact fails closed', () => readArtifact(`${buildDir}/__missing_runtime_execution_abi_fixture__.abi`), /required compiler artifact missing/);
  let testedCommit = null;
  try { testedCommit = execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim(); } catch {}
  if (process.env.CI) assert.match(testedCommit || '', /^[a-f0-9]{40}$/, 'CI requires exact checkout commit');
  const evidence = {schema: 'K11520_RUNTIME_EXECUTION_ABI_EVIDENCE_V1', status: 'PASS', productChainId: 56,
    scope: 'OFFLINE_COMPILED_ABI_ONLY_NOT_DEPLOYMENT_READINESS', testedCommit,
    compiler: solc.version(), optimizer: settings.optimizer, sourceDigest, sourceHashes,
    runtime: {path: runtimePath, sha256: sha256(fs.readFileSync(runtimePath))},
    validatorSha256: sha256(fs.readFileSync('KGEN/contracts/tests/brain-v4-static-invariants.mjs')),
    workflowSha256: sha256(fs.readFileSync('.github/workflows/11520-trading-readiness.yml')),
    bindings, fragments: checked, negativeFixtures, providerRequests: 0, signerRequests: 0, broadcast: false};
  fs.mkdirSync('artifacts', {recursive: true});
  fs.writeFileSync('artifacts/runtime-execution-abi.json', JSON.stringify(evidence, null, 2) + '\n');
  console.log(`[runtime-execution-abi] PASS: ${checked.length} fragments; ${negativeFixtures} negative fixtures; source ${sourceDigest}`);
}

// Separate from the frontend ABI gate: replay the saved unsigned-package input
// with its Paris settings, without an import callback, provider or signer.
if (process.argv.includes('--unsigned-package-reproducibility')) {
  const reportPath = 'artifacts/mainnet-unsigned/reproducibility.json';
  fs.rmSync(reportPath, {force: true});
  const {createHash} = await import('node:crypto');
  const {createRequire} = await import('node:module');
  const {execFileSync} = await import('node:child_process');
  const {default: solc} = await import('solc');
  const {ContractFactory, Interface, getCreateAddress, keccak256} = await import('ethers');
  const require = createRequire(import.meta.url);
  const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
  const stable = value => JSON.stringify(value, (_, item) => item && !Array.isArray(item) && typeof item === 'object'
    ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
  const digest = value => {const {packageDigest, ...body} = value; return 'sha256:' + sha256(stable(body));};
  const canonical = text => text.replace(/\r\n/g, '\n');
  const runnerPath = 'KGEN/scripts/rehearse_bsc_testnet.mjs';
  const runner = canonical(fs.readFileSync(runnerPath, 'utf8'));
  const harness = runner.match(/const harness = `([\s\S]*?)`;/)?.[1];
  assert.ok(harness && !harness.includes('${'), 'literal runner harness required');
  const entries = ['BrainExchange', 'PositionEngine', 'MarketRiskKernel', 'OrderTriggerEngine', 'OracleSourceAdapter']
    .map(name => `KGEN/contracts/KGEN_${name}.sol`);
  const sourceFiles = [...entries, 'K11520TestnetAssets.sol'];
  const settings = {optimizer: {enabled: true, runs: 200}, evmVersion: 'paris',
    outputSelection: {'*': {'*': ['abi', 'evm.bytecode', 'evm.deployedBytecode']}}};
  const buildPath = 'artifacts/mainnet-unsigned/build.json';
  const packagePath = 'artifacts/mainnet-unsigned/synthetic-test-package.json';
  const read = file => {assert.ok(fs.existsSync(file), `missing saved artifact: ${file}`); return JSON.parse(fs.readFileSync(file, 'utf8'));};
  const build = read(buildPath), pkg = read(packagePath);
  function validateInput(value) {
    assert.match(solc.version(), /^0\.8\.24\+commit\.e11b9ed9\./, 'pinned solc required');
    assert.equal(value.compiler, solc.version(), 'saved compiler mismatch');
    assert.equal(value.sourceEncoding, 'UTF-8_LF', 'source encoding');
    assert.deepEqual(value.settings, settings, 'saved compiler settings');
    assert.deepEqual(value.standardJsonInput?.settings, settings, 'standard JSON settings');
    assert.equal(value.standardJsonInput.language, 'Solidity', 'compiler language');
    assert.deepEqual(Object.keys(value.standardJsonInput).sort(), ['language', 'settings', 'sources'], 'standard JSON shape');
    assert.deepEqual(Object.keys(value.dependencies).sort(), ['@openzeppelin/contracts', '@openzeppelin/contracts-upgradeable'], 'dependency set');
    for (const [name, version] of Object.entries(value.dependencies)) {
      assert.equal(version, '5.0.2', 'pinned OpenZeppelin required');
      assert.equal(JSON.parse(fs.readFileSync(`node_modules/${name}/package.json`, 'utf8')).version, version, 'installed dependency version');
    }
    const hashes = {};
    for (const [file, source] of Object.entries(value.standardJsonInput.sources)) {
      assert.deepEqual(Object.keys(source), ['content'], 'fully resolved inline source required');
      assert.equal(typeof source.content, 'string', 'source bytes required');
      assert.ok(sourceFiles.includes(file) || /^@openzeppelin\/(contracts|contracts-upgradeable)\/[A-Za-z0-9_/-]+\.sol$/.test(file), 'unexpected source path');
      const expected = file === 'K11520TestnetAssets.sol' ? harness
        : canonical(fs.readFileSync(file.startsWith('@openzeppelin/') ? `node_modules/${file}` : file, 'utf8'));
      assert.equal(source.content, expected, `checkout/import bytes: ${file}`);
      hashes[file] = sha256(source.content);
    }
    assert.ok(sourceFiles.every(file => Object.hasOwn(hashes, file)), 'missing entry source');
    assert.deepEqual(value.sourceHashes, Object.fromEntries(sourceFiles.map(file => [file, hashes[file]])), 'saved entry hashes');
    return hashes;
  }
  const sourceHashes = validateInput(build);
  // The deliberately absent callback makes incomplete saved imports fail closed.
  const output = JSON.parse(solc.compile(JSON.stringify(build.standardJsonInput)));
  assert.deepEqual((output.errors || []).filter(e => e.severity === 'error'), [], 'offline replay compilation');
  assert.deepEqual(Object.keys(output.sources).sort(), Object.keys(sourceHashes).sort(), 'resolved compiler source set');
  const definitions = {
    testToken: ['K11520TestnetAssets.sol', 'K11520TestToken'],
    brainImplementation: [entries[0], 'KGEN_BrainExchange_V4_0_0'],
    brainProxy: ['K11520TestnetAssets.sol', 'K11520TestProxy'],
    positionEngine: [entries[1], 'KGEN_PositionEngine_V1_0_0'],
    orderTriggerEngine: [entries[3], 'KGEN_OrderTriggerEngine'],
    oracle: ['K11520TestnetAssets.sol', 'K11520TestOracle'],
    productionProxyTemplate: ['@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol', 'ERC1967Proxy'],
    candidateOracleAdapter: [entries[4], 'KGEN_OracleSourceAdapter'],
  };
  const rebuilt = Object.fromEntries(Object.entries(definitions).map(([key, [file, name]]) => {
    const artifact = output.contracts[file][name];
    assert.deepEqual(artifact.evm.bytecode.linkReferences, {}, 'unlinked creation artifact');
    assert.ok(artifact.evm.deployedBytecode.object.length / 2 <= 24576, 'EIP170');
    return [key, {abi: artifact.abi, bytecode: '0x' + artifact.evm.bytecode.object}];
  }));
  function validateArtifacts(value) {
    assert.deepEqual(Object.keys(value.artifacts).sort(), Object.keys(definitions).filter(k => !['productionProxyTemplate', 'candidateOracleAdapter'].includes(k)).sort(), 'artifact set');
    assert.equal(value.productionProxyTemplate.policy, 'BUILD_ONLY_NOT_AUTHORIZED', 'production proxy policy');
    assert.equal(value.productionProxyTemplate.source, definitions.productionProxyTemplate[0], 'production proxy source');
    assert.equal(value.candidateOracleAdapter.policy, 'BUILD_ONLY_NOT_DEPLOYED_NOT_PRODUCTION_READY', 'adapter policy');
    assert.equal(value.candidateOracleAdapter.source, entries[4], 'adapter source');
    for (const [key, expected] of Object.entries(rebuilt)) {
      const actual = value.artifacts[key] || value[key];
      assert.deepEqual(actual.abi, expected.abi, `recompiled ABI: ${key}`);
      assert.equal(actual.bytecode, expected.bytecode, `recompiled creation bytecode: ${key}`);
    }
  }
  validateArtifacts(build);
  const keys = ['brainImplementation', 'brainProxy', 'positionEngine', 'orderTriggerEngine'];
  const production = {...rebuilt, brainProxy: rebuilt.productionProxyTemplate};
  async function validatePackage(value) {
    assert.equal(value.documentType, 'K11520_MAINNET_UNSIGNED_EXECUTION_PACKAGE', 'package type');
    assert.equal(value.schemaVersion, 1, 'package schema');
    assert.equal(value.syntheticFixture, true, 'synthetic fixture only');
    assert.equal(value.mode, 'BUILD_ONLY', 'build only');
    assert.equal(value.broadcast, false, 'no broadcast');
    assert.equal(value.executionAuthorized, false, 'no execution authority');
    assert.equal(value.deploymentReadbacks, 'NOT_PERFORMED', 'no deployment claim');
    assert.equal(value.status, 'UNSIGNED_REQUIRES_HUMAN_APPROVAL', 'unsigned status');
    assert.deepEqual(value.blockers, [], 'valid synthetic package');
    assert.equal(value.chainId, 56, 'package chain');
    assert.equal(value.input.chainId, 56, 'input chain');
    assert.equal(value.input.transactionRoute, 'DIRECT_EOA_UNSIGNED', 'unsigned route');
    assert.equal(value.compiler, build.compiler, 'package compiler');
    assert.deepEqual(value.sourceHashes, build.sourceHashes, 'package source hashes');
    assert.deepEqual(value.input.sourceHashes, build.sourceHashes, 'input source hashes');
    assert.equal(value.packageDigest, digest(value), 'canonical package digest');
    assert.deepEqual(Object.keys(value.artifactDigests).sort(), keys.slice().sort(), 'creation digest set');
    assert.deepEqual(Object.keys(value.predictedAddresses).sort(), keys.slice().sort(), 'prediction set');
    const input = value.input, roles = input.roles, predicted = {}, start = input.startingNonces[input.deployer.toLowerCase()];
    assert.ok(Number.isSafeInteger(start) && start >= 0, 'deployer starting nonce');
    assert.equal(roles.triggerAdmin.toLowerCase(), input.deployer.toLowerCase(), 'immutable trigger admin is deployer');
    keys.forEach((key, i) => {
      predicted[key] = getCreateAddress({from: input.deployer, nonce: start + i});
      assert.equal(value.predictedAddresses[key], predicted[key], `CREATE prediction: ${key}`);
      assert.equal(value.artifactDigests[key], keccak256(production[key].bytecode), `creation digest: ${key}`);
    });
    const init = new Interface(rebuilt.brainImplementation.abi).encodeFunctionData('initialize',
      [input.token.address, roles.brainAdmin, roles.brainKeeper, roles.pauser, roles.upgradeAuthority, roles.treasury, input.nextPayrollAt]);
    const args = [[], [predicted.brainImplementation, init],
      [roles.positionAdmin, predicted.orderTriggerEngine, predicted.brainProxy], [predicted.positionEngine, roles.triggerKeeper]];
    assert.equal(value.transactions.filter(tx => tx.to === null).length, 4, 'four creation transactions');
    assert.equal(value.transactions.length, 23, 'synthetic transaction count');
    const nonces = {...input.startingNonces};
    for (const tx of value.transactions) {
      assert.equal(tx.chainId, 56, 'transaction chain');
      assert.equal(tx.type, 0, 'unsigned transaction type');
      assert.equal(tx.value, '0', 'zero native value');
      assert.ok(Object.hasOwn(nonces, tx.from.toLowerCase()), 'known transaction sender');
      assert.equal(tx.nonce, nonces[tx.from.toLowerCase()]++, 'transaction nonce binding');
      assert.equal(tx.calldataKeccak256, keccak256(tx.data), 'calldata digest');
    }
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i], tx = value.transactions[i];
      const expected = await new ContractFactory(production[key].abi, production[key].bytecode).getDeployTransaction(...args[i]);
      assert.equal(tx.id, 'DEPLOY_' + key, 'creation order');
      assert.equal(tx.method, 'constructor', 'creation method');
      assert.equal(tx.from.toLowerCase(), input.deployer.toLowerCase(), 'creation sender');
      assert.equal(tx.to, null, 'creation destination');
      assert.equal(tx.data, expected.data, `recompiled init payload: ${key}`);
      assert.equal(tx.expectedState.createdAddress, predicted[key], 'predicted only address binding');
      assert.equal(tx.expectedState.initCodeKeccak256, keccak256(expected.data), 'init code digest');
    }
    return {initializerKeccak256: keccak256(init), creationTransactions: keys.map((key, i) => ({organ: key,
      creationBytecodeKeccak256: value.artifactDigests[key], initCodeKeccak256: value.transactions[i].expectedState.initCodeKeccak256,
      predictedAddress: predicted[key]}))};
  }
  const bindings = await validatePackage(pkg);
  const negatives = [];
  const rejectBuild = (label, mutate, validate) => {
    const changed = structuredClone(build); mutate(changed);
    assert.throws(() => validate(changed), {code: 'ERR_ASSERTION'}, label); negatives.push(label);
  };
  rejectBuild('compiler mismatch', b => b.compiler = '0.8.25', validateInput);
  rejectBuild('optimizer mismatch', b => b.standardJsonInput.settings.optimizer.runs++, validateInput);
  rejectBuild('EVM mismatch', b => b.settings.evmVersion = 'shanghai', validateInput);
  rejectBuild('missing source', b => delete b.standardJsonInput.sources[entries[0]], validateInput);
  rejectBuild('changed checkout source', b => b.standardJsonInput.sources[entries[0]].content += '\n', validateInput);
  const imported = Object.keys(sourceHashes).find(file => file.startsWith('@openzeppelin/'));
  rejectBuild('changed import bytes', b => b.standardJsonInput.sources[imported].content += '\n', validateInput);
  rejectBuild('unresolved URL source', b => b.standardJsonInput.sources[imported] = {urls: ['https://example.invalid/source']}, validateInput);
  rejectBuild('entry hash mismatch', b => b.sourceHashes[entries[0]] = '0'.repeat(64), validateInput);
  rejectBuild('creation bytecode mismatch', b => b.artifacts.brainImplementation.bytecode += '00', validateArtifacts);
  rejectBuild('stale ABI artifact', b => b.artifacts.positionEngine.abi = [], validateArtifacts);
  rejectBuild('test proxy substitution', b => b.productionProxyTemplate.bytecode = b.artifacts.brainProxy.bytecode, validateArtifacts);
  for (const [label, mutate, rehash] of [
    ['package digest mismatch', p => p.packageDigest = 'sha256:' + '0'.repeat(64), false],
    ['package source mismatch', p => p.sourceHashes[entries[0]] = '0'.repeat(64), true],
    ['artifact digest mismatch', p => p.artifactDigests.brainImplementation = '0x' + '0'.repeat(64), true],
    ['CREATE prediction mismatch', p => p.predictedAddresses.brainProxy = p.predictedAddresses.brainImplementation, true],
    ['nonce mismatch', p => p.transactions[0].nonce++, true],
    ['wrong chain', p => p.transactions[0].chainId = 97, true],
    ['immutable trigger admin mismatch', p => p.input.roles.triggerAdmin = p.input.roles.treasury, true],
    ['initializer role mismatch', p => p.input.roles.treasury = p.input.roles.brainAdmin, true],
    ['rehashed init payload tamper', p => {p.transactions[1].data += '00'; p.transactions[1].calldataKeccak256 = keccak256(p.transactions[1].data); p.transactions[1].expectedState.initCodeKeccak256 = keccak256(p.transactions[1].data);}, true],
    ['creation order mismatch', p => [p.transactions[0], p.transactions[1]] = [p.transactions[1], p.transactions[0]], true],
    ['extra creation transaction', p => p.transactions.push(p.transactions[0]), true],
    ['false execution authorization', p => p.executionAuthorized = true, true],
  ]) {
    const changed = structuredClone(pkg); mutate(changed); if (rehash) changed.packageDigest = digest(changed);
    await assert.rejects(() => validatePackage(changed), {code: 'ERR_ASSERTION'}, label); negatives.push(label);
  }
  let testedCommit = null;
  try {testedCommit = execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim();} catch {}
  if (process.env.CI) {
    assert.match(testedCommit || '', /^[a-f0-9]{40}$/, 'CI requires exact checkout commit');
    assert.equal(testedCommit, process.env.K11520_REVIEWED_COMMIT, 'CI requires reviewed head checkout');
  }
  const evidence = {schema: 'K11520_UNSIGNED_PACKAGE_REPRODUCIBILITY_V1', status: 'PASS', productChainId: 56,
    scope: 'OFFLINE_SYNTHETIC_CREATION_REPRODUCIBILITY_NOT_DEPLOYMENT_READINESS', testedCommit,
    syntheticReviewedCommit: pkg.input.reviewedCommit, syntheticReviewedCommitIsCheckoutIdentity: false,
    compiler: solc.version(), compilerModuleSha256: sha256(fs.readFileSync(require.resolve('solc/soljson.js'))),
    settings, dependencies: build.dependencies, sourceHashes, standardJsonInputSha256: sha256(stable(build.standardJsonInput)),
    sourceDigest: sha256(stable({compiler: solc.version(), settings, sourceHashes})),
    runnerSha256: sha256(fs.readFileSync(runnerPath)), buildFileSha256: sha256(fs.readFileSync(buildPath)),
    packageFileSha256: sha256(fs.readFileSync(packagePath)), packageDigest: pkg.packageDigest,
    validatorSha256: sha256(fs.readFileSync('KGEN/contracts/tests/brain-v4-static-invariants.mjs')),
    workflowSha256: sha256(fs.readFileSync('.github/workflows/11520-trading-readiness.yml')),
    artifacts: Object.fromEntries(Object.entries(rebuilt).map(([key, a]) => [key, {abiSha256: sha256(stable(a.abi)), creationBytecodeKeccak256: keccak256(a.bytecode)}])),
    bindings, negativeFixtures: negatives, providerRequests: 0, signerRequests: 0, broadcast: false,
    limits: ['Synthetic fixture only; predictions are not deployed addresses.',
      'No deployed runtime, live roles, oracle provenance, funding, gas or activation verified.',
      'Configuration/funding calldata digest integrity checked; semantic execution is not replayed.']};
  fs.writeFileSync(reportPath, JSON.stringify(evidence, null, 2) + '\n');
  console.log(`[unsigned-package-reproducibility] PASS: ${Object.keys(rebuilt).length} artifacts; 4 creation payloads; ${negatives.length} negative fixtures`);
}
