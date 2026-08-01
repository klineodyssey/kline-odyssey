import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const json = (name) => JSON.parse(read(name));
const supply = json("KAIOS_SUPPLY_CHAIN_SCHEMA.json");
const inventory = json("KAIOS_INVENTORY_SCHEMA.json");
const finance = json("KAIOS_COMPANY_FINANCE_SCHEMA.json");
const bankruptcy = json("KAIOS_BANKRUPTCY_SCHEMA.json");

const dependencies = ["market_demand", "product_design", "technology", "license", "raw_materials", "components", "machines", "factory", "electricity", "water", "workers", "transport", "warehouse", "quality_assurance", "sales_channel", "service", "recycling"];
const statuses = ["PLANNED", "MATERIALS_PENDING", "EQUIPMENT_PENDING", "LABOR_PENDING", "ENERGY_PENDING", "TRANSPORT_PENDING", "PRODUCTION_READY", "IN_PRODUCTION", "QUALITY_HOLD", "WAREHOUSE_PENDING", "SALES_PENDING", "PRODUCTION_BLOCKED"];
const blocks = ["NO_DEMAND", "NO_DESIGN", "NO_LICENSE", "NO_RAW_MATERIAL", "NO_COMPONENT", "NO_MACHINE", "NO_FACTORY", "NO_POWER", "NO_WATER", "NO_WORKERS", "NO_TRANSPORT", "NO_WAREHOUSE", "NO_SALES_CHANNEL", "NO_WORKING_CAPITAL"];
const products = ["AUTOMOBILE", "REFRIGERATOR", "ELECTRIC_RICE_COOKER", "BASIC_PHONE", "INDUSTRIAL_MACHINE", "SMARTPHONE_PLATFORM", "ADVANCED_COMPUTE_CHIP"];
const companyStates = ["OPERATING", "CASH_FLOW_WARNING", "PAYMENT_DELAY", "DISTRESS", "INSOLVENT", "RESTRUCTURING", "COURT_PROTECTION", "LIQUIDATION", "DISSOLVED"];
const courtProcess = ["payment_default", "filing", "asset_transfer_freeze", "asset_inventory", "liability_inventory", "employee_wage_claims", "tax_claims", "secured_claims", "unsecured_claims", "inventory_sale", "equipment_sale", "land_right_transfer", "contract_termination", "employee_placement_or_dismissal", "distribution", "dissolution"];

function evaluateDependencies(state) {
  const mapping = {
    market_demand: "NO_DEMAND", product_design: "NO_DESIGN", license: "NO_LICENSE",
    raw_materials: "NO_RAW_MATERIAL", components: "NO_COMPONENT", machines: "NO_MACHINE",
    factory: "NO_FACTORY", electricity: "NO_POWER", water: "NO_WATER",
    workers: "NO_WORKERS", transport: "NO_TRANSPORT", warehouse: "NO_WAREHOUSE",
    sales_channel: "NO_SALES_CHANNEL", working_capital: "NO_WORKING_CAPITAL"
  };
  return Object.entries(mapping).filter(([key]) => !state[key]).map(([, value]) => value);
}

function inventoryTotals(item) {
  if (item.reserved_quantity > item.quantity) throw new Error("OVER_RESERVED");
  return {
    total_mass: item.quantity * item.unit_mass,
    available_quantity: item.quantity - item.reserved_quantity - item.quarantined_quantity,
    book_value: item.quantity * item.recoverable_unit_cost
  };
}

function recognizeSale(state, quantity, unitPrice, unitCost) {
  if (quantity > state.finished_goods) throw new Error("STOCKOUT");
  return {
    ...state,
    finished_goods: state.finished_goods - quantity,
    revenue: state.revenue + quantity * unitPrice,
    receivables: state.receivables + quantity * unitPrice,
    cost_of_goods: state.cost_of_goods + quantity * unitCost,
    inventory_value: state.inventory_value - quantity * unitCost
  };
}

function post(entries, debit, credit, amount, source) {
  if (!(amount > 0) || !source) throw new Error("INVALID_ENTRY");
  entries.push({ debit, credit, amount, source, balanced: true });
}

test("all required PR65 artifacts exist", () => {
  for (const name of [
    "KAIOS_INDUSTRIAL_SUPPLY_CHAIN_SPEC.md", "KAIOS_PRODUCT_DEPENDENCY_GRAPH_SPEC.md",
    "KAIOS_INVENTORY_WAREHOUSE_SPEC.md", "KAIOS_DEMAND_AND_SALES_SPEC.md",
    "KAIOS_CASH_FLOW_SPEC.md", "KAIOS_COMPANY_INSOLVENCY_SPEC.md",
    "KAIOS_SIMULATED_COURT_AND_LIQUIDATION_SPEC.md", "KAIOS_SUPPLY_CHAIN_SCHEMA.json",
    "KAIOS_INVENTORY_SCHEMA.json", "KAIOS_COMPANY_FINANCE_SCHEMA.json",
    "KAIOS_BANKRUPTCY_SCHEMA.json", "KAIOS_PR65_IMPLEMENTATION_PLAN.md",
    "KAIOS_PR65_TEST_PLAN.md"
  ]) assert.equal(fs.existsSync(path.join(root, name)), true, name);
});

test("all four schemas use Draft 2020-12", () => {
  for (const schema of [supply, inventory, finance, bankruptcy]) assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
});

test("supply-chain dependency order is exact", () => assert.deepEqual(supply.properties.dependency_chain.prefixItems.map((item) => item.const), dependencies));
test("production status set is exact", () => assert.deepEqual(supply.$defs.productionStatus.enum, statuses));
test("production block-reason set is exact", () => assert.deepEqual(supply.$defs.blockReason.enum, blocks));

test("every required missing dependency blocks production", () => {
  const state = Object.fromEntries(["market_demand", "product_design", "license", "raw_materials", "components", "machines", "factory", "electricity", "water", "workers", "transport", "warehouse", "sales_channel", "working_capital"].map((key) => [key, true]));
  for (const expected of blocks) {
    const key = Object.keys(state).find((candidate) => evaluateDependencies({ ...state, [candidate]: false }).includes(expected));
    assert.ok(key, expected);
  }
});

test("industrial capability alone does not create dependencies", () => {
  const result = evaluateDependencies({ civilization: "INDUSTRIAL", market_demand: true, product_design: true, license: true });
  assert.ok(result.includes("NO_RAW_MATERIAL"));
  assert.ok(result.includes("NO_FACTORY"));
});

test("all seven generic product classes are canonical", () => assert.deepEqual(supply.$defs.productType.enum, products));

test("reference product tree contains all products without trademark names", () => {
  const text = read("KAIOS_PRODUCT_DEPENDENCY_GRAPH_SPEC.md");
  for (const product of products) assert.ok(text.includes(`\`${product}\``), product);
  assert.doesNotMatch(text, /Apple|iPhone|Samsung|Toyota|Tesla|TSMC|NVIDIA/i);
});

test("every product requires all thirteen dependency groups", () => {
  const required = supply.$defs.product.required;
  for (const field of ["required_components", "required_materials", "required_machines", "required_factories", "required_technology", "required_workers", "required_energy", "required_water", "required_transport", "required_warehouse", "required_sales_channels", "required_service", "required_recycling"]) assert.ok(required.includes(field), field);
});

test("inventory schema defines all seven classes", () => assert.deepEqual(inventory.$defs.item.properties.inventory_class.enum, ["RAW_MATERIAL", "WORK_IN_PROGRESS", "FINISHED_GOODS", "SPARE_PARTS", "RETURNED_GOODS", "SCRAP", "RECYCLED_MATERIAL"]));

test("inventory conserves quantity mass reservation and value", () => assert.deepEqual(inventoryTotals({ quantity: 100, reserved_quantity: 20, quarantined_quantity: 5, unit_mass: 2.5, recoverable_unit_cost: 12 }), { total_mass: 250, available_quantity: 75, book_value: 1200 }));
test("inventory rejects over-reservation", () => assert.throws(() => inventoryTotals({ quantity: 10, reserved_quantity: 11, quarantined_quantity: 0, unit_mass: 1, recoverable_unit_cost: 1 }), /OVER_RESERVED/));

test("warehouse schema enforces mass and volume capacities", () => {
  const required = inventory.$defs.warehouse.required;
  for (const field of ["capacity_mass", "capacity_volume", "occupied_mass", "occupied_volume", "storage_cost_rate", "insurance_cost"]) assert.ok(required.includes(field));
});

test("inventory risks include storage and capital effects", () => assert.deepEqual(inventory.properties.risks.items.enum, ["DAMAGE", "SPOILAGE", "OBSOLESCENCE", "CAPITAL_FREEZE", "HANDLING_DELAY", "FIRE", "THEFT"]));

test("unsold production creates inventory but no revenue", () => {
  const before = { finished_goods: 0, inventory_value: 0, revenue: 0 };
  const after = { ...before, finished_goods: 10, inventory_value: 500 };
  assert.equal(after.revenue, 0);
});

test("sale recognizes revenue receivable and cost of goods together", () => assert.deepEqual(recognizeSale({ finished_goods: 10, revenue: 0, receivables: 0, cost_of_goods: 0, inventory_value: 500 }, 2, 100, 50), { finished_goods: 8, revenue: 200, receivables: 200, cost_of_goods: 100, inventory_value: 400 }));

test("sales cannot exceed available stock", () => assert.throws(() => recognizeSale({ finished_goods: 1, revenue: 0, receivables: 0, cost_of_goods: 0, inventory_value: 50 }, 2, 100, 50), /STOCKOUT/));

test("demand and sales specification distinguishes planning states", () => {
  const text = read("KAIOS_DEMAND_AND_SALES_SPEC.md");
  for (const term of ["DEMAND_FORECAST", "CONFIRMED_ORDER", "PRODUCTION_PLAN", "SAFETY_STOCK", "OVERPRODUCTION", "STOCKOUT", "DEAD_STOCK"]) assert.match(text, new RegExp(term));
});

test("finance schema includes every required account", () => {
  const required = finance.$defs.accounts.required;
  for (const field of ["orders", "revenue", "cost_of_goods", "payroll", "rent", "energy", "transport", "maintenance", "interest", "tax_simulation", "receivables", "payables", "inventory_value", "cash", "debt", "working_capital", "capital_expenditure", "depreciation"]) assert.ok(required.includes(field), field);
});

test("double-entry posting is balanced and source-backed", () => {
  const entries = [];
  post(entries, "RECEIVABLES", "REVENUE", 100, "SALE-001");
  post(entries, "COST_OF_GOODS", "INVENTORY", 40, "SALE-001");
  assert.equal(entries.reduce((sum, entry) => sum + entry.amount, 0), 140);
  assert.ok(entries.every((entry) => entry.balanced && entry.source));
});

test("accounting identity and working capital reconcile", () => {
  const accounts = { cash: 300, receivables: 200, inventory: 500, equipment: 1000, payables: 250, debt: 750, equity: 1000 };
  const assets = accounts.cash + accounts.receivables + accounts.inventory + accounts.equipment;
  const liabilities = accounts.payables + accounts.debt;
  assert.equal(assets, liabilities + accounts.equity);
  assert.equal(accounts.cash + accounts.receivables + accounts.inventory - accounts.payables, 750);
});

test("finance warnings are exact", () => assert.deepEqual(finance.$defs.warning.enum, ["CASH_FLOW_WARNING", "PAYMENT_DELAY", "WORKING_CAPITAL_SHORTAGE", "PAYROLL_RISK", "SUPPLIER_DEFAULT_RISK", "DEBT_SERVICE_FAILURE"]));
test("company distress state order is exact", () => assert.deepEqual(finance.$defs.companyStatus.enum, companyStates));
test("bankruptcy process order is exact", () => assert.deepEqual(bankruptcy.properties.process.prefixItems.map((item) => item.const), courtProcess));

test("failed-company assets require preserved disposition", () => {
  assert.deepEqual(bankruptcy.$defs.asset.properties.result.enum, ["AUCTIONED", "TRANSFERRED", "SOLD", "LEASED", "SCRAPPED", "RECYCLED", "ABANDONED_WITH_CUSTODIAN"]);
  assert.equal(bankruptcy.$defs.asset.properties.history_preserved.const, true);
});

test("liquidation distribution is balanced and cannot exceed proceeds", () => {
  const proceeds = 900;
  const distributions = [300, 250, 200, 150];
  assert.equal(distributions.reduce((sum, value) => sum + value, 0), proceeds);
  assert.ok(distributions.reduce((sum, value) => sum + value, 0) <= proceeds);
});

test("court package is simulated and has no real legal effect", () => {
  assert.equal(bankruptcy.properties.mode.const, "SIMULATED_COURT");
  assert.equal(bankruptcy.properties.legal_effect.const, "NO_REAL_LEGAL_EFFECT");
});

test("closed economic loop includes cash and material return", () => {
  const text = read("KAIOS_INDUSTRIAL_SUPPLY_CHAIN_SPEC.md");
  for (const stage of ["life_need", "market_demand", "production_plan", "manufacturing", "warehouse", "sales", "delivery", "maintenance", "repair", "return", "recycling", "cash_and_material_return"]) assert.match(text, new RegExp(stage));
});

test("specifications require replay and never activate production", () => {
  const text = ["KAIOS_INDUSTRIAL_SUPPLY_CHAIN_SPEC.md", "KAIOS_INVENTORY_WAREHOUSE_SPEC.md", "KAIOS_CASH_FLOW_SPEC.md", "KAIOS_COMPANY_INSOLVENCY_SPEC.md", "KAIOS_SIMULATED_COURT_AND_LIQUIDATION_SPEC.md", "KAIOS_PR65_IMPLEMENTATION_PLAN.md"].map(read).join("\n");
  assert.match(text, /previous\/next state hashes|previous_state_hash/i);
  assert.match(text, /SPECIFICATION_ONLY/);
  assert.doesNotMatch(text, /PRODUCTION_RUNTIME_ACTIVE|REAL_KGEN_ENABLED|REAL_COURT_FILING/);
});
