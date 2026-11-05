'use strict';

// Sole CFO candidate organ. CommonJS intentionally supports normal Node 20 ESM
// default import without changing the repository's package/module boundaries.
const { createHash } = require('node:crypto');
const MODE = 'SIMULATION_ONLY';
const METADATA = freeze({
  organ_id: 'KAIOS_CFO_FINANCE_ENGINE', filename: 'core/accounting/runtime-finance.js',
  version: 'V1_SIMULATION_ONLY', revision: '2026-10-08.R2',
  base_commit: 'f7f67950418ebbb6f7a5a309a32d529232fcb3b6',
  project_id: 'KAIOS-CFO-FINANCE-V1-20261008', work_id: 'CFO-LEDGER-V1-20261008',
  source_lineage: ['core/accounting/index.mjs', 'core/company/index.mjs',
    'docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md'],
  installed: 'NOT_INSTALLED', signature: 'NOT_SIGNED', seal: 'SEAL_INVALID',
  author: 'TEMPORARY_TECHNICAL_RESOURCE_NOT_EMPLOYEE', reviewer: 'INDEPENDENT_R2_REVIEW_PENDING', employee_authority: 'NONE', gm_ack: 'NOT_OBTAINED', execution: MODE,
  registration_dependency: 'Separate explicit Boot/index/README registration required before installation',
  rollback: 'Revert the two-file candidate only; no real state or payments exist',
  known_limits: ['No real revenue, payroll, payments, wallet or chain authority',
    'Hashes detect corruption; they are not signatures or authentication',
    'KUFO canonical helper uses floating-point observation, never atomic ledger valuation',
    'Year-three settlement, food reduction and lifespan effects NOT_BOUND',
    'Explicit simulation snapshots only; no account usage discovery or invented employee balances',
    'Monotonic operation timestamps; one GAME revenue per project allocation; finalized projects reject financial amendments',
    'Scoped reports omit stock quantities; period and project balances derive from filtered journal',
    'LP capital/position/reserve accounting is a separate future dependency, not enabled here']
});
const ACCOUNTS = Object.freeze({
  CASH: 'ASSET', RESTRICTED_INVENTORY: 'ASSET', CONSUMABLE_STOCK: 'ASSET',
  CUSTOMER_DEPOSITS: 'LIABILITY', CUSTODY_PAYABLE: 'LIABILITY',
  ROYALTY_PAYABLE: 'LIABILITY', COMPUTE_PAYABLE: 'LIABILITY',
  CAPITAL: 'EQUITY', RETAINED_EARNINGS: 'EQUITY', MAINTENANCE_RESERVE: 'EQUITY', GAME_REVENUE: 'REVENUE', SERVICE_REVENUE: 'REVENUE',
  PLATFORM_EXPENSE: 'EXPENSE', REFUND_EXPENSE: 'EXPENSE', COMPUTE_EXPENSE: 'EXPENSE', OPERATING_EXPENSE: 'EXPENSE',
  CONSUMPTION_EXPENSE: 'EXPENSE', ROYALTY_EXPENSE: 'EXPENSE'
});
function check(ok, message) { if (!ok) throw new Error(message); }
function object(x) { check(x && typeof x === 'object' && !Array.isArray(x), 'Object required'); return x; }
function keys(x, allowed, required = allowed) {
  object(x); check(Object.keys(x).every(k => allowed.includes(k)), 'Unknown field');
  check(required.every(k => Object.hasOwn(x, k)), 'Missing field');
}
function label(x) { check(typeof x === 'string' && x.trim() && x.length <= 512, 'Nonempty bounded string required'); return x; }
function id(x) { check(typeof x === 'string' && /^[A-Z][A-Z0-9_-]{0,95}$/.test(x), 'Invalid identifier'); return x; }
function integer(x) {
  check(typeof x === 'bigint' || typeof x === 'string' || (typeof x === 'number' && Number.isSafeInteger(x)), 'Exact integer required');
  check(/^(0|[1-9][0-9]*)$/.test(String(x)), 'Unsigned canonical integer required'); return BigInt(x);
}
function positive(x) { const n = integer(x); check(n > 0n, 'Positive amount required'); return n; }
function time(x) { check(typeof x === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(x) && Number.isFinite(Date.parse(x)) && new Date(x).toISOString() === x, 'Canonical UTC timestamp required'); return x; }
function canon(x) {
  if (typeof x === 'bigint') return x.toString();
  if (Array.isArray(x)) return x.map(canon);
  if (x && typeof x === 'object') return Object.fromEntries(Object.keys(x).sort().map(k => [k, canon(x[k])]));
  check(x === null || ['string', 'boolean'].includes(typeof x) || (typeof x === 'number' && Number.isFinite(x)), 'Non-JSON value'); return x;
}
function stable(x) { return JSON.stringify(canon(x)); }
function clone(x) { return JSON.parse(stable(x)); }
function digest(x) { return createHash('sha256').update(stable(x)).digest('hex'); }
function freeze(x) { if (x && typeof x === 'object') { Object.values(x).forEach(freeze); Object.freeze(x); } return x; }
function configOf(input) {
  keys(input, ['mode', 'assets', 'species', 'royalty_policy']); check(input.mode === MODE, 'Simulation only');
  check(Array.isArray(input.assets) && input.assets.length > 0 && input.assets.length <= 32, 'Asset catalog required');
  const assets = input.assets.map(a => { keys(a, ['id', 'atomic_unit']); return { id: id(a.id), atomic_unit: id(a.atomic_unit) }; });
  check(new Set(assets.map(a => a.id)).size === assets.length, 'Duplicate asset');
  check(Array.isArray(input.species), 'Species catalog required');
  const species = input.species.map(s => { keys(s, ['id', 'allowed']); id(s.id); check(Array.isArray(s.allowed) && s.allowed.length, 'Consumption rules required');
    const allowed = s.allowed.map(a => { keys(a, ['type', 'unit']); id(a.type); id(a.unit); return clone(a); });
    check(new Set(allowed.map(a => `${a.type}/${a.unit}`)).size === allowed.length, 'Duplicate consumption rule'); return { id: s.id, allowed }; });
  check(new Set(species.map(s => s.id)).size === species.length, 'Duplicate species');
  let policy = null;
  if (input.royalty_policy !== null) {
    const p = input.royalty_policy; keys(p, ['source', 'basis', 'denominator', 'shares', 'remainder_recipient']); check(p.basis === 'GAME_NET_REVENUE', 'GAME_NET_REVENUE basis required'); label(p.source);
    const denominator = positive(p.denominator); check(Array.isArray(p.shares) && p.shares.length, 'Explicit royalty shares required');
    const shares = p.shares.map(s => { keys(s, ['recipient', 'numerator', 'type']); check(['COMPANY_RETENTION', 'MAINTENANCE_RESERVE', 'CREATOR_PAYABLE', 'TEAM_PAYABLE', 'REVIEWER_PAYABLE'].includes(s.type), 'Explicit royalty share type required'); return { recipient: id(s.recipient), numerator: integer(s.numerator).toString(), type: s.type }; });
    check(new Set(shares.map(s => s.recipient)).size === shares.length, 'Duplicate recipient');
    check(shares.reduce((n, s) => n + BigInt(s.numerator), 0n) === denominator, 'Shares must total denominator');
    check(shares.some(s => s.recipient === p.remainder_recipient), 'Explicit rounding recipient required');
    policy = { source: p.source, basis: p.basis, denominator: denominator.toString(), shares, remainder_recipient: p.remainder_recipient };
  }
  return { mode: MODE, assets, species, royalty_policy: policy };
}

async function createFinanceRuntime(input) {
  const company = await import('../company/index.mjs');
  const config = configOf(input);
  const initialPayload = { schema: 'CFO_FINANCE_V1', config, operations: [] };
  check(stable({ ...initialPayload, integrity_sha256: digest(initialPayload) }).length <= 5_000_000, 'Initial export size limit exceeded');
  let state = { operations: [], journal: [], usage: [], stock: {}, consumption: [], allocations: [], payroll: [] };
  const asset = a => { id(a); check(config.assets.some(v => v.id === a), 'Unknown asset'); return a; };
  function totals(s) {
    const result = Object.fromEntries(config.assets.map(a => [a.id, Object.fromEntries(Object.keys(ACCOUNTS).map(k => [k, 0n]))]));
    for (const entry of s.journal) for (const l of entry.lines) result[l.asset][l.account] += BigInt(l.debit) - BigInt(l.credit);
    return result;
  }
  function journal(s, entry) {
    check(Array.isArray(entry.lines) && entry.lines.length >= 2, 'Double-entry lines required');
    const sums = new Map();
    const lines = entry.lines.map(l => {
      keys(l, ['asset', 'account', 'debit', 'credit']); asset(l.asset); check(Object.hasOwn(ACCOUNTS, l.account), 'Unknown account');
      const d = integer(l.debit), c = integer(l.credit); check((d > 0n) !== (c > 0n), 'One positive side per line');
      sums.set(l.asset, (sums.get(l.asset) || 0n) + d - c);
      return { asset: l.asset, account: l.account, debit: d.toString(), credit: c.toString() };
    });
    check([...sums.values()].every(n => n === 0n), 'Unbalanced per asset');
    s.journal.push({ ...entry, lines });
    for (const b of Object.values(totals(s))) {
      check(b.RESTRICTED_INVENTORY >= 0n && b.RESTRICTED_INVENTORY === -b.CUSTODY_PAYABLE, 'Restricted inventory must match custody liability');
      check(b.CASH >= 0n && b.CONSUMABLE_STOCK >= 0n, 'Finite simulated resources exceeded');
      for (const a of ['CUSTOMER_DEPOSITS', 'ROYALTY_PAYABLE', 'COMPUTE_PAYABLE']) check(b[a] <= 0n, 'Liability cannot become negative');
    }
  }
  function pair(s, e, debit, credit, amount, currency, extra = {}) {
    if (integer(amount) === 0n) return;
    journal(s, { id: e.id, at: e.at, project: e.project || null, kind: e.kind, ...extra,
      lines: [{ asset: currency, account: debit, debit: String(amount), credit: '0' }, { asset: currency, account: credit, debit: '0', credit: String(amount) }] });
  }
  function apply(s, e) {
    id(e.id); time(e.at); if (e.project !== undefined) id(e.project);
    check(!s.operations.length || e.at >= s.operations.at(-1).at, 'Causal order: operation cannot precede recorded history');
    // Bounded close: once net-game allocation is finalized, project financial
    // history is immutable. New activity requires a new project, not backdating.
    if (e.project && !['PAYROLL_SNAPSHOT'].includes(e.kind)) check(!s.allocations.some(a => a.project === e.project), 'Project allocation finalized; financial changes forbidden');
    switch (e.kind) {
      case 'JOURNAL': {
        keys(e, ['kind', 'id', 'at', 'project', 'classification', 'lines', 'source'], ['kind', 'id', 'at', 'classification', 'lines', 'source']); label(e.source);
        const allowed = {
          CAPITAL: ['CASH', 'CAPITAL'], EXPENSE: ['OPERATING_EXPENSE', 'CASH'], PLATFORM_FEE: ['PLATFORM_EXPENSE', 'CASH'], REFUND: ['REFUND_EXPENSE', 'CASH'],
          CUSTOMER_DEPOSIT: ['CASH', 'CUSTOMER_DEPOSITS'], CARGO_CUSTODY: ['RESTRICTED_INVENTORY', 'CUSTODY_PAYABLE'],
          CARGO_RETURN: ['CUSTODY_PAYABLE', 'RESTRICTED_INVENTORY']
        }[e.classification];
        check(allowed, 'Classification excluded from company journal');
        if (['EXPENSE', 'PLATFORM_FEE', 'REFUND'].includes(e.classification)) id(e.project);
        check(e.lines.length >= 2 && e.lines.every(l => (integer(l.debit) > 0n ? l.account === allowed[0] : l.account === allowed[1])), 'Classification/account mismatch');
        if (e.classification === 'CUSTOMER_DEPOSIT') for (const l of e.lines) if (l.account === 'CASH') company.classifyCustomerDeposit({ amount: String(l.debit), settlementEvidence: 'SYNTHETIC_FIXTURE_ONLY' });
        journal(s, { id: e.id, at: e.at, project: e.project || null, kind: e.classification, lines: e.lines }); break;
      }
      case 'REVENUE': {
        keys(e, ['kind', 'id', 'at', 'project', 'asset', 'amount', 'evidence', 'category']); asset(e.asset); positive(e.amount);
        check(['GAME', 'SERVICE'].includes(e.category), 'Excluded revenue category');
        const v = e.evidence; keys(v, ['synthetic', 'customer_accepted', 'delivered', 'order_id', 'invoice_id', 'settlement_id', 'source']);
        check(v.synthetic === true && v.customer_accepted === true && v.delivered === true, 'Synthetic acceptance and delivery required');
        ['order_id', 'invoice_id', 'settlement_id'].forEach(k => id(v[k])); label(v.source);
        check(!s.operations.some(o => o.kind === 'REVENUE' && o.evidence.settlement_id === v.settlement_id), 'Duplicate settlement');
        // Canonical evidence gate is exercised only with explicitly synthetic fixtures.
        // Its return is not published as real settlement evidence or authorization.
        company.recognizeCompanyRevenue({ order: { orderId: v.order_id, status: 'ORDER_CONFIRMED' },
          invoice: { invoiceId: v.invoice_id, status: 'SETTLEMENT_PENDING' },
          settlement: { settlementId: v.settlement_id, orderId: v.order_id, invoiceId: v.invoice_id,
            currency: e.asset, amount: String(e.amount), txHash: 'SYNTHETIC_NOT_A_TRANSACTION', block: 1,
            timestamp: e.at, evidence: v.source, status: 'SETTLED' } });
        pair(s, e, 'CASH', `${e.category}_REVENUE`, e.amount, e.asset); break;
      }
      case 'COMPUTE': {
        keys(e, ['kind', 'id', 'at', 'project', 'work', 'worker', 'model', 'source', 'unit', 'start', 'end', 'delta', 'started_at', 'ended_at', 'duration_ms', 'rework', 'blocked', 'price']);
        ['work', 'worker', 'unit'].forEach(k => id(e[k])); label(e.model); label(e.source); time(e.started_at); time(e.ended_at);
        check(integer(e.end) >= integer(e.start) && integer(e.end) - integer(e.start) === integer(e.delta), 'Compute delta mismatch');
        check(Date.parse(e.ended_at) - Date.parse(e.started_at) === Number(integer(e.duration_ms)) && Date.parse(e.ended_at) <= Date.parse(e.at), 'Compute duration/time mismatch');
        check(typeof e.rework === 'boolean' && typeof e.blocked === 'boolean', 'Rework/blocked booleans required');
        check(!s.usage.some(u => u.source === e.source && u.worker === e.worker && u.model === e.model && u.unit === e.unit && (u.started_at === e.started_at && u.ended_at === e.ended_at || integer(e.start) < integer(u.end) && integer(e.end) > integer(u.start))), 'Duplicate/overlapping compute usage');
        let valuation = { status: 'UNKNOWN', asset: null, amount: null };
        if (e.price !== null) { keys(e.price, ['asset', 'atomic_per_unit', 'source']); asset(e.price.asset); label(e.price.source);
          const amount = integer(e.delta) * integer(e.price.atomic_per_unit);
          valuation = { status: 'PRICED_SIMULATION', asset: e.price.asset, amount: amount.toString() };
          pair(s, e, 'COMPUTE_EXPENSE', 'COMPUTE_PAYABLE', amount, e.price.asset);
        }
        s.usage.push({ ...e, valuation }); break;
      }
      case 'ROYALTY': {
        keys(e, ['kind', 'id', 'at', 'project', 'revenue_id']); id(e.revenue_id);
        const p = config.royalty_policy; check(p, 'Explicit royalty policy required');
        const r = s.operations.find(o => o.id === e.revenue_id && o.kind === 'REVENUE');
        check(r && r.project === e.project && r.category === 'GAME', 'Recognized GAME project revenue required');
        const ops = s.operations.filter(o => o.project === e.project);
        check(ops.every(o => o.at <= e.at), 'Allocation cannot precede project evidence');
        check(ops.filter(o => o.kind === 'REVENUE').length === 1, 'Bounded allocation requires one GAME revenue per project');
        check(!s.usage.some(u => u.project === e.project && u.valuation.status === 'UNKNOWN') &&
          !ops.some(o => o.kind === 'PURCHASE' && o.cost === null), 'Unknown project costs block definite net allocation');
        const costs = s.journal.filter(j => j.project === e.project).flatMap(j => j.lines)
          .filter(l => ACCOUNTS[l.account] === 'EXPENSE');
        check(costs.every(l => l.asset === r.asset), 'Cross-asset costs have no net valuation');
        const cost = costs.reduce((n, l) => n + integer(l.debit) - integer(l.credit), 0n);
        const gross = integer(r.amount); check(gross >= cost, 'No distributable GAME net revenue');
        const net = gross - cost, d = BigInt(p.denominator);
        const shares = p.shares.map(a => ({ recipient: a.recipient, type: a.type, amount: (net * BigInt(a.numerator) / d).toString() }));
        const remainder = net - shares.reduce((n, a) => n + BigInt(a.amount), 0n);
        const recipient = shares.find(a => a.recipient === p.remainder_recipient); recipient.amount = (BigInt(recipient.amount) + remainder).toString();
        const payable = shares.filter(a => a.type.endsWith('_PAYABLE')).reduce((n, a) => n + integer(a.amount), 0n);
        const reserve = shares.filter(a => a.type === 'MAINTENANCE_RESERVE').reduce((n, a) => n + integer(a.amount), 0n);
        pair(s, e, 'ROYALTY_EXPENSE', 'ROYALTY_PAYABLE', payable, r.asset);
        pair(s, e, 'RETAINED_EARNINGS', 'MAINTENANCE_RESERVE', reserve, r.asset);
        s.allocations.push({ id: e.id, at: e.at, project: e.project, revenue_id: r.id, asset: r.asset,
          basis: p.basis, gross: gross.toString(), project_cost: cost.toString(), amount: net.toString(),
          payable: payable.toString(), equity_reserve: reserve.toString(), shares, policy_source: p.source,
          cost_operation_ids: ops.filter(o => ['COMPUTE', 'CONSUME', 'JOURNAL'].includes(o.kind)).map(o => o.id),
          rounding: 'FLOOR_THEN_EXPLICIT_RECIPIENT', remainder: remainder.toString(), status: 'FINALIZED_ACCRUAL_NOT_PAID', paid: '0' }); break;
      }
      case 'PURCHASE': {
        keys(e, ['kind', 'id', 'at', 'project', 'stock_id', 'species', 'type', 'unit', 'quantity', 'cost', 'source']); label(e.source); id(e.stock_id); positive(e.quantity);
        const rule = config.species.find(s => s.id === e.species); check(rule?.allowed.some(a => a.type === e.type && a.unit === e.unit), 'Species/type/unit not allowed');
        check(!Object.hasOwn(s.stock, e.stock_id), 'Duplicate stock');
        let value = null, currency = null;
        if (e.cost !== null) { keys(e.cost, ['asset', 'amount']); currency = asset(e.cost.asset); value = integer(e.cost.amount).toString(); pair(s, e, 'CONSUMABLE_STOCK', 'CASH', value, currency); }
        s.stock[e.stock_id] = { purchased_at: e.at, project: e.project, species: e.species, type: e.type, unit: e.unit, quantity: String(e.quantity), remaining: String(e.quantity), asset: currency, cost: value, remaining_cost: value }; break;
      }
      case 'CONSUME': {
        keys(e, ['kind', 'id', 'at', 'project', 'stock_id', 'species', 'unit', 'quantity', 'consumer']); id(e.consumer);
        const b = s.stock[e.stock_id]; check(b && b.species === e.species && b.unit === e.unit, 'Stock species/unit mismatch');
        check(b.purchased_at <= e.at && b.project === e.project, 'Consumption must follow purchase in same project');
        const q = positive(e.quantity), remaining = integer(b.remaining); check(q <= remaining, 'Insufficient finite stock');
        const value = b.remaining_cost === null ? null : (q === remaining ? integer(b.remaining_cost) : integer(b.remaining_cost) * q / remaining).toString();
        if (value !== null) { pair(s, e, 'CONSUMPTION_EXPENSE', 'CONSUMABLE_STOCK', value, b.asset); b.remaining_cost = (integer(b.remaining_cost) - integer(value)).toString(); }
        b.remaining = (remaining - q).toString(); s.consumption.push({ ...e, asset: b.asset, cost: value, cost_status: value === null ? 'UNKNOWN' : 'PRICED_SIMULATION', lifespan_effect: 'NOT_BOUND' }); break;
      }
      case 'PAYROLL_SNAPSHOT': {
        keys(e, ['kind', 'id', 'at', 'project', 'source', 'mode', 'currency', 'entries']); id(e.project); label(e.source);
        check(e.mode === MODE && e.currency === 'KAIOS_CREDIT' && Array.isArray(e.entries) && e.entries.length <= 1000, 'Explicit bounded simulation payroll snapshot required');
        const entries = e.entries.map(p => { keys(p, ['worker', 'work', 'amount', 'classification']); id(p.worker); id(p.work); integer(p.amount);
          check(['SALARY_INCOME', 'TASK_COMPENSATION', 'FREIGHT_REVENUE', 'HEARTBEAT_REWARD', 'CREATOR_ROYALTY'].includes(p.classification), 'Payroll classification required'); return clone(p); });
        check(new Set(entries.map(p => `${p.worker}/${p.work}/${p.classification}`)).size === entries.length, 'Duplicate payroll row');
        check(!s.payroll.some(p => p.project === e.project && p.entries.some(old => entries.some(v => v.worker === old.worker && v.work === old.work && v.classification === old.classification))), 'Duplicate worker income observation');
        s.payroll.push({ id: e.id, project: e.project, source: e.source, at: e.at, entries, authority: 'READ_ONLY_SNAPSHOT_NO_BALANCE_CREATED' }); break;
      }
      default: throw new Error('Unsupported operation');
    }
  }
  function execute(raw) {
    const e = canon(raw); object(e); id(e.id);
    const prior = state.operations.find(o => o.id === e.id);
    if (prior) { check(stable(prior) === stable(e), 'Idempotency conflict'); return { id: e.id, status: 'REPLAY_NO_CHANGE' }; }
    check(state.operations.length < 10000, 'Operation limit exceeded');
    const next = clone(state); apply(next, e); next.operations.push(e);
    const payload = { schema: 'CFO_FINANCE_V1', config, operations: next.operations };
    check(stable({ ...payload, integrity_sha256: digest(payload) }).length <= 5_000_000, 'Export size limit exceeded');
    state = next;
    return { id: e.id, status: 'RECORDED_SIMULATION_ONLY' };
  }
  function report({ date = null, project = null } = {}) {
    if (date !== null) check(/^\d{4}-\d\d-\d\d$/.test(date) && new Date(`${date}T00:00:00.000Z`).toISOString().slice(0, 10) === date, 'Valid date required');
    if (project !== null) id(project);
    const match = e => (date === null || e.at.slice(0, 10) === date) && (project === null || e.project === project);
    const closingMatch = e => (date === null || e.at.slice(0, 10) <= date) && (project === null || e.project === project);
    const flow = { ...state, journal: state.journal.filter(match) }, ft = totals(flow), bt = totals({ journal: state.journal.filter(closingMatch) });
    const hasUnknown = state.usage.some(u => match(u) && u.valuation.status === 'UNKNOWN') || state.operations.some(o => match(o) && o.kind === 'PURCHASE' && o.cost === null) || state.consumption.some(c => match(c) && c.cost === null);
    const per_asset = Object.fromEntries(config.assets.map(({ id: a }) => {
      const f = ft[a], b = bt[a];
      const revenue = -(f.GAME_REVENUE + f.SERVICE_REVENUE);
      const expense = Object.keys(ACCOUNTS).filter(k => ACCOUNTS[k] === 'EXPENSE').reduce((n, k) => n + f[k], 0n);
      const assets = b.CASH + b.RESTRICTED_INVENTORY + b.CONSUMABLE_STOCK;
      const liabilities = -(b.CUSTOMER_DEPOSITS + b.CUSTODY_PAYABLE + b.ROYALTY_PAYABLE + b.COMPUTE_PAYABLE);
      const allRevenue = -(b.GAME_REVENUE + b.SERVICE_REVENUE);
      const allExpense = Object.keys(ACCOUNTS).filter(k => ACCOUNTS[k] === 'EXPENSE').reduce((n, k) => n + b[k], 0n);
      const equity = -b.CAPITAL - b.RETAINED_EARNINGS - b.MAINTENANCE_RESERVE + allRevenue - allExpense;
      const cash = { operating: 0n, investing: 0n, financing: 0n };
      for (const e of flow.journal) for (const l of e.lines) if (l.asset === a && l.account === 'CASH') cash[e.kind === 'CAPITAL' ? 'financing' : 'operating'] += BigInt(l.debit) - BigInt(l.credit);
      return [a, { pnl: { valuation_status: hasUnknown ? 'KNOWN_COSTS_ONLY_UNKNOWN_COSTS_EXCLUDED' : 'PRICED_SIMULATION', revenue: revenue.toString(), expense: expense.toString(), profit: (revenue - expense).toString() },
        cash_flow: canon({ ...cash, net: cash.operating + cash.investing + cash.financing }),
        balance_sheet: canon({ assets, liabilities, equity, balanced: assets === liabilities + equity, scope: 'AS_OF_END_DATE_AND_PROJECT', as_of_date: date, project, cash: b.CASH, restricted_inventory: b.RESTRICTED_INVENTORY, custody_liability: -b.CUSTODY_PAYABLE }), accounts: canon(b) }];
    }));
    return clone({ mode: MODE, date, project, per_asset,
      unknown_costs: { compute: state.usage.filter(u => match(u) && u.valuation.status === 'UNKNOWN'), purchases: state.operations.filter(o => o.kind === 'PURCHASE' && o.cost === null && match(o)), consumption: state.consumption.filter(c => match(c) && c.cost === null) },
      worker_income: { royalties: state.allocations.filter(match), payroll_snapshots: state.payroll.filter(match),
        categories: ['SALARY_INCOME', 'TASK_COMPENSATION', 'FREIGHT_REVENUE', 'HEARTBEAT_REWARD', 'CREATOR_ROYALTY'].map(category => ({ category,
          observations: state.payroll.filter(match).flatMap(p => p.entries.filter(e => e.classification === category).map(e => ({ ...e, asset: 'KAIOS_CREDIT', status: 'OBSERVED_SIMULATION_NOT_PAID' }))),
          accruals: state.allocations.filter(match).flatMap(a => a.shares.filter(s => (category === 'CREATOR_ROYALTY' && s.type === 'CREATOR_PAYABLE') || (category === 'TASK_COMPENSATION' && ['TEAM_PAYABLE', 'REVIEWER_PAYABLE'].includes(s.type))).map(s => ({ worker: s.recipient, asset: a.asset, amount: s.amount, status: 'ACCRUED_NOT_PAID' }))) })),
        salary_paid: 'NOT_EXECUTED', heartbeat_is_salary: false },
      usage: state.usage.filter(match), stock: date === null && project === null ? state.stock : null, stock_scope: date === null && project === null ? 'CURRENT_ALL_STATE' : 'OMITTED_FOR_SCOPED_REPORT', consumption: state.consumption.filter(match), metadata: METADATA });
  }
  function exportState() {
    const payload = { schema: 'CFO_FINANCE_V1', config, operations: state.operations };
    return stable({ ...payload, integrity_sha256: digest(payload) });
  }
  function importState(serialized) {
    check(typeof serialized === 'string' && serialized.length <= 5_000_000, 'Bounded JSON export required');
    const v = JSON.parse(serialized); keys(v, ['schema', 'config', 'operations', 'integrity_sha256']);
    check(serialized === stable(v), 'Canonical JSON required (duplicates/whitespace disallowed)');
    check(v.schema === 'CFO_FINANCE_V1' && stable(configOf(v.config)) === stable(config), 'Schema/config mismatch');
    check(Array.isArray(v.operations) && v.operations.length <= 10_000, 'Bounded operations required');
    check(v.integrity_sha256 === digest({ schema: v.schema, config: v.config, operations: v.operations }), 'Integrity mismatch');
    const next = { operations: [], journal: [], usage: [], stock: {}, consumption: [], allocations: [], payroll: [] };
    const ids = new Set();
    for (const e of v.operations) { check(!ids.has(e.id), 'Duplicate import operation'); ids.add(e.id); apply(next, e); next.operations.push(clone(e)); }
    const result = integrityReport(next); state = next; return result;
  }
  function integrityReport(s = state) { return { status: 'VALID_UNSIGNED_SIMULATION', operation_count: s.operations.length, journal_count: s.journal.length, hash: digest({ config, operations: s.operations }), per_asset_balanced: Object.values(totals(s)).every(b => Object.values(b).reduce((n, v) => n + v, 0n) === 0n), seal: 'SEAL_INVALID' }; }
  function observeKufo({ batch, observed_at, synthetic, cutoff_policy = null }) {
    check(synthetic === true, 'Synthetic observation only'); time(observed_at);
    const natural = company.calculateKufoFuelState(clone(batch), observed_at);
    return clone({ mode: MODE, natural, law: company.KUFO_FUEL_LAW,
      settlement_preview: { status: 'NOT_BOUND', policy_source: cutoff_policy === null ? null : label(cutoff_policy), natural_decay_modified: false, transaction_created: false },
      food_reduction: 'NOT_BOUND', lifespan_effect: 'NOT_BOUND', ledger_mutated: false });
  }
  // Public projection is assembled from numeric aggregates only; no arbitrary
  // caller-provided labels, model/source strings, identities or balances escape.
  function publicReport() {
    const r = report();
    return { mode: MODE, status: 'NOT_INSTALLED', operation_count: state.operations.length,
      journal_count: state.journal.length, asset_count: config.assets.length,
      balanced: Object.values(r.per_asset).every(a => a.balance_sheet.balanced),
      unpriced_compute_count: r.unknown_costs.compute.length,
      unpriced_purchase_count: r.unknown_costs.purchases.length,
      royalty_accrual_count: state.allocations.length, payments_executed: 0,
      privacy: 'AGGREGATES_ONLY_NO_BALANCES_OR_IDENTITIES' };
  }
  return Object.freeze({ execute, postJournal: e => execute({ ...e, kind: 'JOURNAL' }), report, publicReport, exportState, importState, integrityReport, observeKufo, metadata: freeze(clone(METADATA)) });
}

async function runSyntheticDemo() {
  const at = '2026-10-08T12:00:00.000Z', project = 'SYNTHETIC_GAME_PROJECT';
  const config = { mode: MODE, assets: [{ id: 'KAIOS', atomic_unit: 'SYNTHETIC_ATOM' }, { id: 'USD', atomic_unit: 'SYNTHETIC_CENT' }, { id: 'KGEN', atomic_unit: 'SYNTHETIC_ATOM' }],
    species: [{ id: 'SYNTHETIC_DIGITAL_ANT', allowed: [{ type: 'SIMULATED_ENERGY_FOOD', unit: 'PACKET' }] }],
    royalty_policy: { source: 'SYNTHETIC_DEMO_POLICY_NOT_PRODUCTION', basis: 'GAME_NET_REVENUE', denominator: '7', shares: [{ recipient: 'SYNTHETIC_CREATOR', numerator: '2', type: 'CREATOR_PAYABLE' }, { recipient: 'SYNTHETIC_COMPANY', numerator: '3', type: 'COMPANY_RETENTION' }, { recipient: 'SYNTHETIC_MAINTENANCE', numerator: '2', type: 'MAINTENANCE_RESERVE' }], remainder_recipient: 'SYNTHETIC_CREATOR' } };
  const r = await createFinanceRuntime(config);
  const p = (journalId, classification, debit, credit, amount, currency = 'KAIOS') => r.postJournal({ id: journalId, at, project, classification, source: 'SYNTHETIC_FIXTURE', lines: [{ asset: currency, account: debit, debit: amount, credit: '0' }, { asset: currency, account: credit, debit: '0', credit: amount }] });
  p('CAPITAL_1', 'CAPITAL', 'CASH', 'CAPITAL', '10000');
  p('USD_CAPITAL', 'CAPITAL', 'CASH', 'CAPITAL', '2500', 'USD');
  p('CARGO_1', 'CARGO_CUSTODY', 'RESTRICTED_INVENTORY', 'CUSTODY_PAYABLE', '300', 'KGEN');
  p('DEPOSIT_1', 'CUSTOMER_DEPOSIT', 'CASH', 'CUSTOMER_DEPOSITS', '500');
  r.execute({ kind: 'COMPUTE', id: 'COMPUTE_1', at, project, work: 'SYNTHETIC_WORK', worker: 'SYNTHETIC_TOOL', model: 'SYNTHETIC_MODEL', source: 'SYNTHETIC_METER', unit: 'TOKEN', start: '0', end: '100', delta: '100', started_at: '2026-10-08T11:00:00.000Z', ended_at: '2026-10-08T11:01:00.000Z', duration_ms: '60000', rework: false, blocked: false, price: { asset: 'KAIOS', atomic_per_unit: '2', source: 'SYNTHETIC_PRICE' } });
  r.execute({ kind: 'COMPUTE', id: 'COMPUTE_UNKNOWN', at, project: 'SYNTHETIC_UNPRICED_PROJECT', work: 'SYNTHETIC_REWORK', worker: 'SYNTHETIC_TOOL', model: 'SYNTHETIC_MODEL', source: 'SYNTHETIC_METER', unit: 'TOKEN', start: '100', end: '105', delta: '5', started_at: '2026-10-08T11:01:00.000Z', ended_at: '2026-10-08T11:02:00.000Z', duration_ms: '60000', rework: true, blocked: true, price: null });
  r.execute({ kind: 'REVENUE', id: 'REVENUE_1', at, project, asset: 'KAIOS', amount: '1001', category: 'GAME', evidence: { synthetic: true, customer_accepted: true, delivered: true, order_id: 'SYNTHETIC_ORDER', invoice_id: 'SYNTHETIC_INVOICE', settlement_id: 'SYNTHETIC_SETTLEMENT', source: 'SYNTHETIC_CUSTOMER_ACCEPTANCE' } });
  r.execute({ kind: 'PURCHASE', id: 'FOOD_PURCHASE', at, project, stock_id: 'SYNTHETIC_FOOD', species: 'SYNTHETIC_DIGITAL_ANT', type: 'SIMULATED_ENERGY_FOOD', unit: 'PACKET', quantity: '4', cost: { asset: 'KAIOS', amount: '101' }, source: 'SYNTHETIC_FOOD_VENDOR' });
  r.execute({ kind: 'CONSUME', id: 'FOOD_CONSUMPTION', at, project, stock_id: 'SYNTHETIC_FOOD', species: 'SYNTHETIC_DIGITAL_ANT', unit: 'PACKET', quantity: '1', consumer: 'SYNTHETIC_CONSUMER' });
  p('PLATFORM_1', 'PLATFORM_FEE', 'PLATFORM_EXPENSE', 'CASH', '30');
  p('OPERATING_1', 'EXPENSE', 'OPERATING_EXPENSE', 'CASH', '20');
  p('REFUND_1', 'REFUND', 'REFUND_EXPENSE', 'CASH', '10');
  r.execute({ kind: 'ROYALTY', id: 'ALLOCATION_1', at, project, revenue_id: 'REVENUE_1' });
  r.execute({ kind: 'PAYROLL_SNAPSHOT', id: 'SYNTHETIC_WORKER_OBSERVATIONS', at, project, source: 'SYNTHETIC_EXISTING_PAYROLL_SNAPSHOT', mode: MODE, currency: 'KAIOS_CREDIT', entries: ['SALARY_INCOME', 'TASK_COMPENSATION', 'FREIGHT_REVENUE', 'HEARTBEAT_REWARD', 'CREATOR_ROYALTY'].map((classification, i) => ({ worker: 'SYNTHETIC_OBSERVED_WORKER', work: `SYNTHETIC_WORK_${i}`, amount: String(i + 1), classification })) });
  const birth = '2023-10-08T00:00:00.000Z';
  const kufo = r.observeKufo({ synthetic: true, batch: { batch_id: 'SYNTHETIC_KUFO', owner: 'SYNTHETIC_OWNER', alchemy_proof: 'SYNTHETIC_NOT_REAL_PROOF', birth_timestamp: birth, birth_block: 1, initial_kufo: 8, propulsion_consumed_kufo: 0 }, observed_at: new Date(Date.parse(birth) + 3 * 365.2422 * 86400000).toISOString(), cutoff_policy: 'HUMAN_YEAR_THREE_SIMULATION_CONCEPT_NOT_INSTALLED' });
  return { mode: MODE, all_amounts_ratios_identities: 'SYNTHETIC', daily_report: r.report({ date: at.slice(0, 10) }), project_profitability: r.report({ project }).per_asset, kufo, public_report: r.publicReport(), integrity: r.integrityReport(), export_json: r.exportState() };
}
module.exports = Object.freeze({ createFinanceRuntime, runSyntheticDemo, METADATA, ACCOUNTS });
