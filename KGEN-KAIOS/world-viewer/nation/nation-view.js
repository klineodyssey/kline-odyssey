function node(documentRef, tag, className = "", text = "") {
  const element = documentRef.createElement(tag);
  if (className) element.className = className;
  if (text !== "") element.textContent = String(text);
  return element;
}

function label(value, fallback = "UNKNOWN") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value).replaceAll("_", " ");
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function section(documentRef, title, modifier = "") {
  const result = node(documentRef, "section", `civilization-section ${modifier}`.trim());
  result.append(node(documentRef, "h2", "civilization-section__title", title));
  return result;
}

function facts(documentRef, rows, className = "civilization-data") {
  const result = node(documentRef, "dl", className);
  for (const [name, value] of rows) {
    const row = node(documentRef, "div");
    row.append(node(documentRef, "dt", "", name), node(documentRef, "dd", "", label(value)));
    result.append(row);
  }
  return result;
}

function button(documentRef, text, action, callback, disabled = false, primary = false) {
  const result = node(documentRef, "button", `civilization-action${primary ? " civilization-action--primary" : ""}`, text);
  result.type = "button";
  result.dataset.civilizationAction = action;
  result.disabled = disabled;
  result.addEventListener("click", callback);
  return result;
}

function selectField(documentRef, title, options, valueKey, labelKey = valueKey) {
  const wrapper = node(documentRef, "label", "nation-control");
  wrapper.append(node(documentRef, "span", "", title));
  const select = node(documentRef, "select");
  for (const option of options) {
    const item = node(documentRef, "option", "", label(option[labelKey] ?? option[valueKey]));
    item.value = option[valueKey];
    select.append(item);
  }
  wrapper.append(select);
  return { wrapper, select };
}

function numericField(documentRef, title, value, { min = 0, max = 10000, step = 1 } = {}) {
  const wrapper = node(documentRef, "label", "nation-control");
  wrapper.append(node(documentRef, "span", "", title));
  const input = node(documentRef, "input");
  input.type = "number";
  input.value = String(value);
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.inputMode = "decimal";
  wrapper.append(input);
  return { wrapper, input };
}

function statusCards(documentRef, values, idKey, titleKey, detail) {
  const grid = node(documentRef, "div", "nation-status-grid");
  for (const value of values) {
    const card = node(documentRef, "article", "nation-status-card");
    card.dataset.status = value.pass === true || value.status === "ACTIVE_SYNTHETIC" ? "PASS" : value.status ?? "INFO";
    card.append(
      node(documentRef, "strong", "", label(value[titleKey] ?? value[idKey])),
      node(documentRef, "span", "", detail(value))
    );
    grid.append(card);
  }
  return grid;
}

export function renderNationView(documentRef, model = {}, callbacks = {}) {
  const fragment = documentRef.createDocumentFragment();
  const runtime = model.nation ?? {};
  const nation = runtime.nation ?? {};
  const finance = runtime.public_finance ?? {};
  const treasury = finance.treasury ?? {};
  const established = nation.status === "ESTABLISHED_SYNTHETIC";

  const overview = section(documentRef, "Nation Founding", "civilization-section--nation");
  overview.append(facts(documentRef, [
    ["Nation", nation.label ?? nation.nation_id],
    ["Status", nation.status],
    ["Population", nation.population],
    ["Territory", `${list(nation.territory?.parcel_ids).length} K280 parcels`],
    ["Sovereignty", nation.sovereignty?.review_status],
    ["Authority Boundary", nation.real_sovereignty === false ? "SYNTHETIC ONLY" : "UNKNOWN"]
  ]));
  overview.append(statusCards(
    documentRef,
    list(runtime.founding_requirements),
    "requirement_id",
    "requirement_id",
    (requirement) => `${requirement.status}: ${requirement.evidence}`
  ));
  overview.append(button(
    documentRef,
    established ? "Nation Established" : "Establish Nation",
    "ESTABLISH_NATION",
    () => callbacks.onEstablishNation?.(),
    established || runtime.founding_ready !== true,
    true
  ));
  fragment.append(overview);

  const government = section(documentRef, "Government V2");
  government.append(statusCards(
    documentRef,
    list(runtime.government_v2?.policies),
    "policy_id",
    "policy_id",
    (policy) => `V${policy.version} / ${label(policy.status)}`
  ));
  government.append(button(documentRef, "Run Policy Cycle", "RUN_NATION_GOVERNMENT", () => callbacks.onRunNationGovernment?.(), !established));
  fragment.append(government);

  const fiscal = section(documentRef, "Tax Policy and Treasury", "civilization-section--finance");
  fiscal.append(facts(documentRef, [
    ["Treasury Assets", `${treasury.total_assets ?? 0} ${finance.official_currency?.currency_code ?? "KAIOS_CREDIT"}`],
    ["Operating", treasury.operating_balance],
    ["Reserve", treasury.reserve],
    ["Emergency", treasury.emergency_reserve],
    ["Policy Version", finance.policy_version],
    ["Ledger Entries", list(finance.ledger).length],
    ["Official Currency", finance.official_currency?.currency_name],
    ["Legal Tender", finance.official_currency?.legal_tender]
  ]));
  const taxes = list(finance.tax_policy);
  if (taxes.length) {
    const taxSelect = selectField(documentRef, "Tax", taxes, "tax_id", "label");
    const initialTax = taxes[0];
    const rateInput = numericField(documentRef, "Rate (basis points)", initialTax.rate_bps, {
      min: initialTax.minimum_rate_bps,
      max: initialTax.maximum_rate_bps,
      step: initialTax.step_bps
    });
    taxSelect.select.addEventListener("change", () => {
      const tax = taxes.find(({ tax_id: id }) => id === taxSelect.select.value) ?? initialTax;
      rateInput.input.value = String(tax.rate_bps);
      rateInput.input.min = String(tax.minimum_rate_bps);
      rateInput.input.max = String(tax.maximum_rate_bps);
      rateInput.input.step = String(tax.step_bps);
    });
    const controls = node(documentRef, "div", "nation-controls");
    controls.append(
      taxSelect.wrapper,
      rateInput.wrapper,
      button(documentRef, "Apply Rate", "SET_NATION_TAX", () => callbacks.onSetTax?.(taxSelect.select.value, Number(rateInput.input.value)), !established, true),
      button(documentRef, "Settle 100 Credit Invoice", "SETTLE_NATION_TAX", () => callbacks.onSettleTax?.(taxSelect.select.value, 100), !established)
    );
    fiscal.append(controls);
  }
  const budgetCategories = list(treasury.annual_budget?.categories);
  if (budgetCategories.length) {
    const category = selectField(documentRef, "Budget", budgetCategories, "category_id");
    const amount = numericField(documentRef, "Allocation", 10, { min: 1, max: 500, step: 1 });
    const controls = node(documentRef, "div", "nation-controls");
    controls.append(
      category.wrapper,
      amount.wrapper,
      button(documentRef, "Allocate", "ALLOCATE_NATION_BUDGET", () => callbacks.onAllocateBudget?.(category.select.value, Number(amount.input.value)), !established)
    );
    fiscal.append(controls);
  }
  fragment.append(fiscal);

  const resources = section(documentRef, "Planet Resources");
  const resourceRows = list(runtime.resources?.resources);
  resources.append(statusCards(
    documentRef,
    resourceRows,
    "resource_id",
    "resource_id",
    (resource) => `${resource.quantity} ${resource.unit} / reserve ${resource.minimum_reserve}`
  ));
  if (resourceRows.length) {
    const resource = selectField(documentRef, "Resource", resourceRows, "resource_id");
    const direction = selectField(documentRef, "Trade", [
      { id: "EXPORT", label: "Export" },
      { id: "IMPORT", label: "Import" }
    ], "id", "label");
    const quantity = numericField(documentRef, "Quantity", 1, { min: 1, max: 20, step: 1 });
    const controls = node(documentRef, "div", "nation-controls");
    controls.append(
      resource.wrapper,
      direction.wrapper,
      quantity.wrapper,
      button(documentRef, "Execute Synthetic Trade", "TRADE_NATION_RESOURCE", () => callbacks.onTradeResource?.(
        resource.select.value,
        direction.select.value,
        Number(quantity.input.value)
      ), !established, true)
    );
    resources.append(controls);
  }
  fragment.append(resources);

  const diplomacy = section(documentRef, "Diplomacy");
  const diplomacyTypes = list(runtime.diplomacy?.agreement_types).map((id) => ({ id, label: label(id) }));
  if (diplomacyTypes.length) {
    const type = selectField(documentRef, "Agreement", diplomacyTypes, "id", "label");
    const controls = node(documentRef, "div", "nation-controls");
    controls.append(
      type.wrapper,
      button(documentRef, "Create Proposal", "PROPOSE_NATION_DIPLOMACY", () => callbacks.onProposeDiplomacy?.(type.select.value), !established)
    );
    diplomacy.append(controls);
  }
  const pending = list(runtime.diplomacy?.pending_review);
  if (!pending.length) diplomacy.append(node(documentRef, "p", "civilization-empty", "NO AGREEMENTS PENDING REVIEW"));
  for (const agreement of pending) {
    const row = node(documentRef, "div", "nation-review-row");
    row.append(
      facts(documentRef, [[label(agreement.type), agreement.agreement_id], ["Counterparty", agreement.parties?.[1]], ["Status", agreement.status]], "civilization-data civilization-data--compact"),
      button(documentRef, "Approve", "REVIEW_NATION_DIPLOMACY", () => callbacks.onReviewDiplomacy?.(agreement.agreement_id, "APPROVE"), false, true)
    );
    diplomacy.append(row);
  }
  fragment.append(diplomacy);
  return fragment;
}
