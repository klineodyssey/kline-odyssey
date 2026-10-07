import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import finance from '../core/accounting/runtime-finance.js';
const { createFinanceRuntime, runSyntheticDemo } = finance;
const at = '2026-10-08T12:00:00.000Z';
const config = () => ({ mode: 'SIMULATION_ONLY', assets: ['USD','KGEN','KAIOS'].map(id => ({ id, atomic_unit: 'SYNTHETIC_ATOM' })), species: [{ id: 'ANT', allowed: [{ type: 'FOOD', unit: 'PACKET' }, { type: 'ENERGY', unit: 'JOULE' }] }, { id: 'ROBOT', allowed: [{ type: 'MATERIAL', unit: 'GRAM' }] }], royalty_policy: { source: 'PRIVATE_SYNTHETIC_POLICY', basis: 'GAME_NET_REVENUE', denominator: '3', shares: [{ recipient: 'CREATOR', numerator: '1', type: 'CREATOR_PAYABLE' }, { recipient: 'MAINTAINER', numerator: '2', type: 'MAINTENANCE_RESERVE' }], remainder_recipient: 'CREATOR' } });
const capital = (id = 'CAPITAL_1', amount = '10000', asset = 'KAIOS') => ({ id, at, classification: 'CAPITAL', source: 'PRIVATE_SYNTHETIC_SOURCE', lines: [{ asset, account: 'CASH', debit: amount, credit: '0' }, { asset, account: 'CAPITAL', debit: '0', credit: amount }] });
const revenue = (id = 'REVENUE_1') => ({ kind: 'REVENUE', id, at, project: 'PROJECT_1', asset: 'KAIOS', amount: '101', category: 'GAME', evidence: { synthetic: true, customer_accepted: true, delivered: true, order_id: 'ORDER_1', invoice_id: 'INVOICE_1', settlement_id: 'SETTLEMENT_1', source: 'PRIVATE_SYNTHETIC_CUSTOMER' } });
const usage = () => ({ kind: 'COMPUTE', id: 'COMPUTE_1', at, project: 'PROJECT_1', work: 'WORK_1', worker: 'WORKER_1', model: 'PRIVATE_MODEL', source: 'PRIVATE_METER', unit: 'TOKEN', start: '0', end: '10', delta: '10', started_at: '2026-10-08T11:00:00.000Z', ended_at: '2026-10-08T11:01:00.000Z', duration_ms: '60000', rework: false, blocked: false, price: null });
const purchase = () => ({ kind: 'PURCHASE', id: 'PURCHASE_1', at, project: 'PROJECT_1', stock_id: 'STOCK_1', species: 'ANT', type: 'FOOD', unit: 'PACKET', quantity: '3', cost: { asset: 'KAIOS', amount: '10' }, source: 'PRIVATE_VENDOR' });
const consume = (id = 'CONSUME_1', quantity = '1') => ({ kind: 'CONSUME', id, at, project: 'PROJECT_1', stock_id: 'STOCK_1', species: 'ANT', unit: 'PACKET', quantity, consumer: 'CONSUMER_1' });
function canonical(x) { if (Array.isArray(x)) return x.map(canonical); if (x && typeof x === 'object') return Object.fromEntries(Object.keys(x).sort().map(k => [k, canonical(x[k])])); return x; }
const stable = x => JSON.stringify(canonical(x));
function repack(v) { const { integrity_sha256, ...payload } = v; return stable({ ...payload, integrity_sha256: createHash('sha256').update(stable(payload)).digest('hex') }); }

test('CommonJS default import works; large integer atomic double entry and currency isolation', async () => {
  const r = await createFinanceRuntime(config());
  r.postJournal(capital('BIG', 900719925474099312345n)); r.postJournal(capital('USD', '123', 'USD'));
  assert.equal(r.report().per_asset.KAIOS.balance_sheet.cash, '900719925474099312345');
  assert.equal(r.report().per_asset.USD.balance_sheet.cash, '123');
  assert.equal(r.report().per_asset.KGEN.balance_sheet.cash, '0');
  assert.equal(r.integrityReport().per_asset_balanced, true);
  const before = r.exportState(); const bad = capital('BAD'); bad.lines[1].asset = 'USD';
  assert.throws(() => r.postJournal(bad), /Unbalanced per asset/); assert.equal(r.exportState(), before);
  assert.throws(() => r.postJournal(capital('UNSAFE', 9007199254740992)), /Exact integer/);
});

test('journal validation is atomic; replay is idempotent and conflicts fail', async () => {
  const r = await createFinanceRuntime(config()); const p = capital(); r.postJournal(p); const before = r.exportState();
  assert.equal(r.postJournal(p).status, 'REPLAY_NO_CHANGE'); assert.equal(r.exportState(), before);
  assert.throws(() => r.postJournal({ ...p, source: 'changed' }), /Idempotency/);
  for (const amount of ['-1', '1.1', '01', 'NaN', '', Infinity]) assert.throws(() => r.postJournal(capital('BAD', amount)));
  const bad = capital('BAD'); bad.lines[1].credit = '9999'; assert.throws(() => r.postJournal(bad));
  assert.equal(r.exportState(), before);
});

test('deterministic export/import, duplicate keys/operations and malicious rehashed imports fail atomically', async () => {
  const r = await createFinanceRuntime(config()); r.postJournal(capital()); const exported = r.exportState();
  const other = await createFinanceRuntime(config()); other.importState(exported); assert.equal(other.exportState(), exported);
  const tampered = JSON.parse(exported); tampered.operations[0].lines[0].debit = '1';
  assert.throws(() => other.importState(stable(tampered)), /Integrity/);
  assert.throws(() => other.importState(repack(tampered)), /Unbalanced/);
  const duplicate = JSON.parse(exported); duplicate.operations.push(duplicate.operations[0]); assert.throws(() => other.importState(repack(duplicate)), /Duplicate/);
  assert.throws(() => other.importState(exported.replace('"schema":', '"schema":"CFO_FINANCE_V1","schema":')), /Canonical/);
  assert.throws(() => other.importState('{')); assert.equal(other.exportState(), exported);
  const malformed = JSON.parse(exported); malformed.operations[0].unexpected = 'SECRET'; assert.throws(() => other.importState(repack(malformed)), /Unknown field/);
});

test('quotes, orders, deposits, cargo and heartbeat cannot become company revenue or salary', async () => {
  const r = await createFinanceRuntime(config());
  for (const classification of ['QUOTE', 'UNACCEPTED_ORDER', 'HEARTBEAT_REWARD', 'SALARY', 'GAME_REVENUE']) assert.throws(() => r.postJournal({ ...capital(), classification }));
  const d = capital('DEPOSIT'); d.classification = 'CUSTOMER_DEPOSIT'; d.lines[1].account = 'CUSTOMER_DEPOSITS'; r.postJournal(d);
  const c = capital('CARGO', '77', 'KGEN'); c.classification = 'CARGO_CUSTODY'; c.lines[0].account = 'RESTRICTED_INVENTORY'; c.lines[1].account = 'CUSTODY_PAYABLE'; r.postJournal(c);
  const a = r.report().per_asset; assert.equal(a.KAIOS.pnl.revenue, '0'); assert.equal(a.KAIOS.balance_sheet.liabilities, '10000');
  assert.equal(a.KGEN.balance_sheet.restricted_inventory, a.KGEN.balance_sheet.custody_liability);
  assert.throws(() => r.postJournal({ ...capital('FAKE'), lines: [{ asset: 'KAIOS', account: 'CASH', debit: '1', credit: '0' }, { asset: 'KAIOS', account: 'GAME_REVENUE', debit: '0', credit: '1' }] }));
  const v = revenue(); v.evidence.customer_accepted = false; assert.throws(() => r.execute(v), /acceptance/);
  r.execute(revenue()); assert.throws(() => r.execute(revenue('DUPLICATE')), /Duplicate settlement/);
});

test('royalty configuration required; exact conservation, explicit rounding, accrual never paid', async () => {
  const r = await createFinanceRuntime(config()); r.execute(revenue());
  r.execute({ kind: 'ROYALTY', id: 'ROYALTY_1', at, project: 'PROJECT_1', revenue_id: 'REVENUE_1' });
  const a = r.report().worker_income.royalties[0]; assert.deepEqual(a.shares.map(s => s.amount), ['34', '67']);
  assert.equal(a.shares.reduce((n,s) => n + BigInt(s.amount), 0n), 101n); assert.equal(a.paid, '0'); assert.equal(a.status, 'FINALIZED_ACCRUAL_NOT_PAID');
  assert.equal(r.report().per_asset.KAIOS.balance_sheet.liabilities, '34');
  assert.throws(() => r.execute({ kind: 'ROYALTY', id: 'ROYALTY_2', at, project: 'PROJECT_1', revenue_id: 'REVENUE_1' }), /finalized/);
  const no = await createFinanceRuntime({ ...config(), royalty_policy: null }); no.execute(revenue()); assert.throws(() => no.execute({ kind: 'ROYALTY', id: 'ROYALTY_1', at, project: 'PROJECT_1', revenue_id: 'REVENUE_1' }), /policy/);
  const bad = config(); bad.royalty_policy.denominator = '4'; await assert.rejects(createFinanceRuntime(bad), /total denominator/);
});

test('compute units are separate from money; UNKNOWN is not zero; dedup and pricing validation', async () => {
  const r = await createFinanceRuntime(config()); const u = usage(); r.execute(u); r.execute(u);
  assert.equal(r.report().unknown_costs.compute.length, 1); assert.equal(r.report().usage[0].valuation.amount, null);
  assert.equal(r.report().per_asset.KAIOS.pnl.expense, '0');
  assert.throws(() => r.execute({ ...u, id: 'DUPE' }), /Duplicate/);
  assert.throws(() => r.execute({ ...u, id: 'BAD_DELTA', delta: '1' }), /delta/);
  assert.throws(() => r.execute({ ...u, id: 'BAD_TIME', duration_ms: '1' }), /duration/);
  const priced = { ...u, id: 'PRICED', start: '10', end: '20', started_at: '2026-10-08T11:01:00.000Z', ended_at: '2026-10-08T11:02:00.000Z', price: { asset: 'USD', atomic_per_unit: '9007199254740993', source: 'SYNTHETIC_PRICE' } }; r.execute(priced);
  assert.equal(r.report().per_asset.USD.pnl.expense, '90071992547409930');
  assert.equal(r.report().per_asset.KAIOS.pnl.expense, '0');
});

test('species, types and units are bounded; finite stock and cost rounding conserve', async () => {
  const r = await createFinanceRuntime(config()); r.postJournal(capital()); r.execute(purchase());
  for (const bad of [{ ...consume(), species: 'ROBOT' }, { ...consume(), unit: 'GRAM' }, consume('TOO_MUCH','4')]) assert.throws(() => r.execute(bad));
  assert.throws(() => r.execute({ ...purchase(), id: 'BAD_PURCHASE', stock_id: 'STOCK_2', type: 'UNIVERSAL_NUTRITION' }));
  r.execute(consume()); r.execute(consume('CONSUME_2')); r.execute(consume('CONSUME_3'));
  const report = r.report(); assert.deepEqual(report.consumption.map(c => c.cost), ['3','3','4']);
  assert.equal(report.stock.STOCK_1.remaining, '0'); assert.equal(report.per_asset.KAIOS.accounts.CONSUMABLE_STOCK, '0');
  assert.equal(report.per_asset.KAIOS.pnl.expense, '10'); assert.throws(() => r.execute(consume('OVERDRAW')));
  r.execute({ ...purchase(), id: 'UNKNOWN_PURCHASE', stock_id: 'STOCK_UNKNOWN', cost: null });
  r.execute({ ...consume('UNKNOWN_CONSUME'), stock_id: 'STOCK_UNKNOWN' }); assert.equal(r.report().unknown_costs.consumption.length, 1);
  assert.equal(r.report().consumption.at(-1).lifespan_effect, 'NOT_BOUND');
});

test('canonical KUFO year-three decay retains 12.5%; settlement and life remain NOT_BOUND', async () => {
  const r = await createFinanceRuntime(config()); const before = r.exportState(); const birth = '2023-01-01T00:00:00.000Z';
  const result = r.observeKufo({ synthetic: true, batch: { batch_id: 'BATCH_1', owner: 'SYNTHETIC_OWNER', alchemy_proof: 'SYNTHETIC_PROOF', birth_timestamp: birth, birth_block: 1, initial_kufo: 8, propulsion_consumed_kufo: 0 }, observed_at: new Date(Date.parse(birth) + 3 * 365.2422 * 86400000).toISOString(), cutoff_policy: 'SYNTHETIC_YEAR3_POLICY' });
  assert.ok(Math.abs(result.natural.remaining_kufo - 1) < 1e-10); assert.ok(Math.abs(result.natural.generated_kship - 7000) < 1e-7);
  assert.equal(result.settlement_preview.status, 'NOT_BOUND'); assert.equal(result.food_reduction, 'NOT_BOUND'); assert.equal(result.lifespan_effect, 'NOT_BOUND'); assert.equal(r.exportState(), before);
});

test('explicit payroll snapshots do not invent salary or employee balances', async () => {
  const r = await createFinanceRuntime(config()); r.execute({ kind: 'PAYROLL_SNAPSHOT', id: 'PAYROLL_1', at, project: 'PROJECT_1', source: 'SYNTHETIC_EXISTING_RUNTIME', mode: 'SIMULATION_ONLY', currency: 'KAIOS_CREDIT', entries: [{ worker: 'WORKER_1', work: 'WORK_1', amount: '50', classification: 'HEARTBEAT_REWARD' }] });
  assert.equal(r.integrityReport().journal_count, 0); assert.equal(r.report().worker_income.heartbeat_is_salary, false); assert.equal(r.report().worker_income.salary_paid, 'NOT_EXECUTED');
});

test('public projection excludes private strings, identities, asset labels and balances', async () => {
  const r = await createFinanceRuntime(config()); r.postJournal(capital()); r.execute(usage()); r.execute(revenue());
  const p = JSON.stringify(r.publicReport()); for (const text of ['PRIVATE', 'WORKER_1', '10000', 'CUSTOMER', 'KAIOS', 'USD', 'MODEL', 'TOKEN']) assert.ok(!p.includes(text));
  assert.equal(r.publicReport().unpriced_compute_count, 1); assert.equal(r.publicReport().payments_executed, 0);
});

test('deterministic synthetic demo reports A=L+E per asset, unknown costs, P&L and cash flow', async () => {
  const a = await runSyntheticDemo(), b = await runSyntheticDemo(); assert.deepEqual(a,b);
  for (const asset of Object.values(a.daily_report.per_asset)) { const bs = asset.balance_sheet; assert.equal(BigInt(bs.assets), BigInt(bs.liabilities) + BigInt(bs.equity)); }
  assert.equal(a.daily_report.per_asset.KAIOS.pnl.profit, '510');
  assert.equal(a.daily_report.per_asset.KAIOS.cash_flow.net, '11340');
  assert.equal(a.daily_report.unknown_costs.compute.length, 1); assert.equal(a.integrity.seal, 'SEAL_INVALID');
  const source = await readFile(new URL('../core/accounting/runtime-finance.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\b(fetch|setTimeout|setInterval|WebSocket|createWalletClient|sendTransaction|signTransaction)\s*\(/);
  assert.doesNotMatch(source, /import\(['"](?:\.\.\/index|.*wallet-binding)/);
});

test('GAME_NET_REVENUE deducts platform, compute, operating, refund and consumption before shares', async () => {
  const c = config(); c.royalty_policy = { source: 'SYNTHETIC_NET_POLICY', basis: 'GAME_NET_REVENUE', denominator: '10', shares: [{ recipient: 'COMPANY', numerator: '4', type: 'COMPANY_RETENTION' }, { recipient: 'MAINTENANCE', numerator: '2', type: 'MAINTENANCE_RESERVE' }, { recipient: 'CREATOR', numerator: '2', type: 'CREATOR_PAYABLE' }, { recipient: 'TEAM', numerator: '1', type: 'TEAM_PAYABLE' }, { recipient: 'REVIEWER', numerator: '1', type: 'REVIEWER_PAYABLE' }], remainder_recipient: 'COMPANY' };
  const r = await createFinanceRuntime(c); r.postJournal({ ...capital(), project: 'PROJECT_1' });
  r.execute({ ...revenue(), amount: '1000' });
  for (const [classification, account, amount] of [['PLATFORM_FEE','PLATFORM_EXPENSE','100'], ['EXPENSE','OPERATING_EXPENSE','50'], ['REFUND','REFUND_EXPENSE','25']]) r.postJournal({ id: classification, at, project: 'PROJECT_1', source: 'SYNTHETIC_COST', classification, lines: [{ asset: 'KAIOS', account, debit: amount, credit: '0' }, { asset: 'KAIOS', account: 'CASH', debit: '0', credit: amount }] });
  r.execute({ ...usage(), price: { asset: 'KAIOS', atomic_per_unit: '10', source: 'SYNTHETIC_PRICE' } });
  r.execute(purchase()); r.execute(consume('ALL_FOOD', '3'));
  r.execute({ kind: 'ROYALTY', id: 'NET_ALLOCATION', at, project: 'PROJECT_1', revenue_id: 'REVENUE_1' });
  const a = r.report().worker_income.royalties[0]; assert.equal(a.project_cost, '285'); assert.equal(a.amount, '715');
  assert.equal(a.shares.reduce((n,s) => n + BigInt(s.amount), 0n), 715n); assert.equal(a.payable, '285'); assert.equal(a.equity_reserve, '143');
  assert.equal(r.report().per_asset.KAIOS.pnl.profit, '430'); assert.equal(r.report().per_asset.KAIOS.accounts.MAINTENANCE_RESERVE, '-143');
  const before = r.exportState(); assert.throws(() => r.execute({ ...usage(), id: 'LATE_COST', at: '2026-10-09T12:00:00.000Z' }), /finalized/); assert.equal(r.exportState(), before);
  assert.throws(() => r.execute({ kind: 'ROYALTY', id: 'REUSE_COSTS', at, project: 'PROJECT_1', revenue_id: 'REVENUE_1' }), /finalized/);
});

test('SERVICE, unpriced usage and cross-currency costs cannot claim distributable GAME net revenue', async () => {
  for (const scenario of ['SERVICE', 'UNKNOWN', 'CROSS_ASSET']) {
    const r = await createFinanceRuntime(config()); r.execute({ ...revenue(), category: scenario === 'SERVICE' ? 'SERVICE' : 'GAME' });
    if (scenario !== 'SERVICE') r.execute({ ...usage(), price: scenario === 'UNKNOWN' ? null : { asset: 'USD', atomic_per_unit: '1', source: 'SYNTHETIC_PRICE' } });
    const before = r.exportState(); assert.throws(() => r.execute({ kind: 'ROYALTY', id: 'ALLOCATION', at, project: 'PROJECT_1', revenue_id: 'REVENUE_1' }), /GAME|Unknown|Cross-asset/); assert.equal(r.exportState(), before);
  }
});

test('as-of date/project reports exclude future and unrelated balances, income and stock', async () => {
  const r = await createFinanceRuntime(config());
  r.postJournal({ ...capital('P1_CAPITAL','100'), project: 'PROJECT_1' });
  r.execute(revenue());
  const payroll = { kind: 'PAYROLL_SNAPSHOT', id: 'PAYROLL_P1', at, project: 'PROJECT_1', source: 'SYNTHETIC_SNAPSHOT', mode: 'SIMULATION_ONLY', currency: 'KAIOS_CREDIT', entries: [{ worker: 'WORKER_1', work: 'WORK_1', amount: '7', classification: 'SALARY_INCOME' }] }; r.execute(payroll);
  const tomorrow = '2026-10-09T12:00:00.000Z';
  r.execute({ kind: 'ROYALTY', id: 'NEXT_DAY_ROYALTY', at: tomorrow, project: 'PROJECT_1', revenue_id: 'REVENUE_1' });
  r.postJournal({ ...capital('P2_CAPITAL', '999'), at: tomorrow, project: 'PROJECT_2' });
  r.execute({ ...payroll, id: 'PAYROLL_P2', at: tomorrow, project: 'PROJECT_2' });
  const past = r.report({ date: '2026-10-08', project: 'PROJECT_1' });
  assert.equal(past.per_asset.KAIOS.balance_sheet.cash, '201'); assert.equal(past.per_asset.KAIOS.balance_sheet.liabilities, '0');
  assert.equal(past.worker_income.royalties.length, 0); assert.equal(past.worker_income.payroll_snapshots.length, 1); assert.equal(past.stock, null);
  const p2 = r.report({ project: 'PROJECT_2' }); assert.equal(p2.per_asset.KAIOS.balance_sheet.cash, '999'); assert.equal(p2.worker_income.royalties.length, 0);
  assert.equal(r.report({ date: '2026-10-09', project: 'PROJECT_1' }).worker_income.payroll_snapshots.length, 0);
  assert.equal(r.report({ date: '2026-10-07' }).per_asset.KAIOS.balance_sheet.assets, '0');
});

test('causal timestamps reject backdated allocation and stock consumption, including rehashed imports', async () => {
  const r = await createFinanceRuntime(config()); r.postJournal(capital()); r.execute(purchase()); r.execute(revenue());
  const yesterday = '2026-10-07T12:00:00.000Z';
  assert.throws(() => r.execute({ ...consume(), at: yesterday }), /Causal|follow purchase/);
  assert.throws(() => r.execute({ kind: 'ROYALTY', id: 'PAST_ALLOCATION', at: yesterday, project: 'PROJECT_1', revenue_id: 'REVENUE_1' }), /Causal|precede/);
  r.execute(consume()); const exported = r.exportState(), v = JSON.parse(exported); v.operations.at(-1).at = yesterday;
  assert.throws(() => r.importState(repack(v)), /Causal/); assert.equal(r.exportState(), exported);
});

test('five worker income categories stay distinct observations/accruals, never paid', async () => {
  const d = await runSyntheticDemo(); const categories = d.daily_report.worker_income.categories;
  assert.deepEqual(categories.map(c => c.category), ['SALARY_INCOME', 'TASK_COMPENSATION', 'FREIGHT_REVENUE', 'HEARTBEAT_REWARD', 'CREATOR_ROYALTY']);
  assert.ok(categories.every(c => c.observations.length === 1 && c.observations[0].status === 'OBSERVED_SIMULATION_NOT_PAID'));
  assert.equal(categories.find(c => c.category === 'CREATOR_ROYALTY').accruals[0].status, 'ACCRUED_NOT_PAID');
  assert.equal(d.daily_report.worker_income.heartbeat_is_salary, false);
});

test('deep frozen metadata and symmetric bounded roundtrip preserve failure atomicity', async () => {
  assert.ok(Object.isFrozen(finance.METADATA.source_lineage)); assert.throws(() => finance.METADATA.source_lineage.push(undefined), TypeError);
  const r = await createFinanceRuntime(config()); r.postJournal(capital()); const before = r.exportState();
  const entries = Array.from({ length: 40000 }, (_, i) => ({ worker: 'WORKER', work: `WORK_${i}`, amount: '1', classification: 'SALARY_INCOME' }));
  assert.throws(() => r.execute({ kind: 'PAYROLL_SNAPSHOT', id: 'HUGE', at, project: 'PROJECT_1', source: 'SYNTHETIC', mode: 'SIMULATION_ONLY', currency: 'KAIOS_CREDIT', entries }), /bounded/);
  assert.equal(r.exportState(), before); const imported = await createFinanceRuntime(config()); imported.importState(before); assert.equal(imported.exportState(), before);
  const v = JSON.parse(before); v.operations = Array.from({ length: 10001 }, (_, i) => ({ ...v.operations[0], id: `CAP_${i}` })); assert.throws(() => r.importState(repack(v)), /Bounded/); assert.equal(r.exportState(), before);
});

test('demo performs no fetch or timer execution', async () => {
  const old = { fetch: globalThis.fetch, setTimeout: globalThis.setTimeout, setInterval: globalThis.setInterval };
  try { for (const k of Object.keys(old)) globalThis[k] = () => { throw new Error(`Forbidden side effect: ${k}`); }; await runSyntheticDemo(); }
  finally { Object.assign(globalThis, old); }
});


test('unknown stock consumption keeps later-day P&L provisional even without same-day purchase', async () => {
  const r = await createFinanceRuntime(config());
  r.execute({ ...purchase(), cost: null });
  r.execute({ ...consume(), at: '2026-10-09T12:00:00.000Z' });
  const nextDay = r.report({ date: '2026-10-09', project: 'PROJECT_1' });
  assert.equal(nextDay.unknown_costs.purchases.length, 0);
  assert.equal(nextDay.unknown_costs.compute.length, 0);
  assert.equal(nextDay.unknown_costs.consumption.length, 1);
  assert.equal(nextDay.per_asset.KAIOS.pnl.valuation_status, 'KNOWN_COSTS_ONLY_UNKNOWN_COSTS_EXCLUDED');
  assert.equal(nextDay.per_asset.KAIOS.pnl.expense, '0');
  const unrelated = r.report({ date: '2026-10-09', project: 'PROJECT_2' });
  assert.equal(unrelated.per_asset.KAIOS.pnl.valuation_status, 'PRICED_SIMULATION');
});

test('oversized initial configuration is rejected before creating an unimportable runtime', async () => {
  const c = config();
  c.species = Array.from({ length: 35000 }, (_, i) => ({ id: `SPECIES_${String(i).padStart(86, '0')}`, allowed: [{ type: 'FOOD', unit: 'PACKET' }] }));
  await assert.rejects(createFinanceRuntime(c), /Initial export size limit/);
  const r = await createFinanceRuntime(config()); const exported = r.exportState();
  r.importState(exported); assert.equal(r.exportState(), exported);
});
