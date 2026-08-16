import {
  createBrowserUniverseStore, createUniverseRuntime, loadCanonicalSeed,
  createListing, buildPortfolio, createLifeDraft, createKgenSwapAdapter, KGEN_SWAP_CONFIG, calculateLifeAge, calculateWorkAge,
  createPublicCivilizationDraftIntent, interpretPublicCivilizationIntent,
  confirmPublicCivilizationIntent, toPublicCivilizationRequest,
  routePublicCivilizationProject, qualifyPublicCivilizationRequest, createNonBindingEstimatePreview,
  appendPublicRequestHistoryEvent, I18N_SUPPORTED_LOCALES, translateUi, normalizeUiLocale,
  validatePrimaryI18nCatalogs, detectVoiceCapabilities, deriveWorkerHealth
} from "../../../core/index.mjs?v=11520-v3.7-heart-heaven-fuel";
import { readTempleHeart12345 } from "../../../core/integrations/temple-heart-12345.mjs?v=11520-v3.7-heart-heaven-fuel";

const NAVIGATION = Object.freeze([
  ["HOME", "navigation.home"], ["REQUEST", "navigation.request"], ["LIFE", "navigation.life"], ["LIFE_FACTORY", "LIFE FACTORY"], ["APPS", "navigation.apps"], ["COMPANIES", "navigation.company"],
  ["TOKENS", "TOKENS"], ["JOBS", "JOBS"], ["SERVICES", "SERVICES"], ["PROPERTY", "PROPERTY"],
  ["FACTORIES", "FACTORIES"], ["SPACECRAFT", "SPACECRAFT"], ["PORTFOLIO", "PORTFOLIO"],
  ["MY_LIFE", "MY LIFE"], ["MY_COMPANY", "MY COMPANY"]
]);

const content = document.querySelector("#content");
const nav = document.querySelector("#nav");
let universe;
let pendingPublicIntent = null;
let lastGatewayReceipt = null;
const localeFromUrl = new URLSearchParams(location.search).get("lang");
let uiLocale = normalizeUiLocale(localeFromUrl || localStorage.getItem("11520.uiLocale") || navigator.language);
let voiceLocale = localStorage.getItem("11520.voiceLocale") || ({ "zh-TW": "zh-TW", en: "en-US", ja: "ja-JP", ko: "ko-KR" }[uiLocale]);
let sharedWorkerStatus = null;
const voiceCapabilities = detectVoiceCapabilities(globalThis);
const t = (key) => translateUi(key, uiLocale);

function html(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function badge(status) {
  const normalized = String(status ?? "NOT_DEPLOYED");
  const tone = normalized === "ACTIVE" || normalized === "VERIFIED_BOUND" || normalized === "ALIVE" || normalized === "ON_DUTY" || normalized === "LISTED" || normalized === "READY" ? "active" : normalized === "COMPLETED" ? "completed" : normalized === "DEPLOYED" || normalized.includes("MAINNET_LIVE") ? "deployed" : normalized.includes("STOP") ? "stop" : normalized.includes("LOCAL") || normalized === "CONCEIVED" ? "local" : normalized === "LOCKED" ? "locked" : "not";
  return `<span class="badge ${tone}">${html(normalized)}</span>`;
}

function pills(values) { return `<div class="pills">${(values ?? []).map((value) => `<span class="pill">${html(value)}</span>`).join("") || `<span class="muted">NONE RECORDED</span>`}</div>`; }
function kv(label, value, raw = false) { return `<div class="kv"><span>${html(label)}</span><strong>${raw ? value : html(value ?? "NOT_RECORDED")}</strong></div>`; }
function section(title, body, aside = "") { return `<div class="section-title"><h2>${html(title)}</h2>${aside}</div>${body}`; }
function empty(label = "NOT_DEPLOYED") { return `<div class="empty">${badge(label)}<p>No verified registry records are available for this market.</p></div>`; }

async function sha256Text(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function currentRoute() {
  const route = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  return { page: (route[0] || "HOME").toUpperCase(), id: route[1] || null };
}

function renderNav(active) {
  nav.innerHTML = NAVIGATION.map(([id, label]) => `<a class="${active === id ? "active" : ""}" href="#/${id}">${label.includes(".") ? html(t(label)) : html(label)}</a>`).join("");
}

async function loadSharedWorkerStatus() {
  try {
    const response = await fetch(`./runtime/worker-status.json?ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    const status = await response.json();
    const health = deriveWorkerHealth({ lastCycle: status.last_work_cycle, now: new Date().toISOString() });
    sharedWorkerStatus = { ...status, worker_health: health.status, work_stop_reason: health.stop_reason };
  } catch {
    sharedWorkerStatus = { worker_health: "OFFLINE", work_stop_reason: "SCHEDULER_OFFLINE", scheduler_status: "SHARED_STATUS_UNAVAILABLE", metrics: {}, patrols: {}, request_patrol: { real_requests: 0 } };
  }
  return sharedWorkerStatus;
}

function workerStatusMarkup() {
  const status = sharedWorkerStatus ?? { worker_health: "OFFLINE", scheduler_status: "LOADING_SHARED_STATUS", metrics: {}, patrols: {}, request_patrol: {} };
  const cycle = status.last_work_cycle;
  const heart = status.patrols?.temple_12345 ?? {};
  const duty = status.gatekeeper_duty ?? cycle?.gatekeeper_duty ?? {};
  const metrics = status.metrics ?? {};
  const action = (name) => kv(name, badge(heart[name.toLowerCase()]?.status ?? "UNAVAILABLE"), true);
  return `<div class="grid two">
    <article class="card"><div class="eyebrow">${html(t("work.title"))}</div><h3>${badge(status.worker_health)}</h3>${kv("Primary Job", status.primary_job ?? "WUKONG_GATEKEEPER")}${kv("Secondary Work", status.secondary_work ?? "AI_ANT_COMPANY_FOUNDER")}${kv("Scheduler", status.scheduler_status)}${kv("Last Work", cycle?.finished_at ?? "NO_SHARED_EVIDENCE")}${kv("Next Expected", status.next_expected_at)}${kv("Result", cycle?.result ?? "NOT_RUN")}${kv("Stop reason", status.work_stop_reason ?? "NONE")}${kv("Global truth", status.global_truth_source ?? "UNAVAILABLE")}${kv("Browser IndexedDB", status.browser_indexeddb_role ?? "LOCAL_DRAFT_CACHE_ONLY")}</article>
    <article class="card"><div class="eyebrow">PRIMARY JOB · 12345 GATEKEEPER</div><h3>${badge(duty.status ?? "NOT_STARTED")}</h3>${kv("Last patrol", duty.gatekeeper_finished_at ?? "NO_SHARED_EVIDENCE")}${kv("Heart block", duty.heart_block)}${kv("Core Heart Indexer", duty.claim_monitor_status ?? heart.core_heart_indexer ?? "UNAVAILABLE")}${kv("Advanced Graph", duty.advanced_graph_status ?? heart.advanced_graph_indexer ?? "INDEXER_REQUIRED_OPTIONAL")}${action("Heartbeat")}${action("Fortune")}${action("Ignition")}${action("Lamp")}${action("Wish")}${action("Thanksgiving")}${kv("Eligibility", heart.eligibility_source ?? "CLIENT_DERIVED")}${kv("Public worker signer", "NO")}${kv("Private signer", "SEPARATE_LOCAL_RUNTIME")}</article>
    <article class="card"><div class="eyebrow">WORK TIME BY DUTY</div>${kv("Gatekeeper", `${metrics.gatekeeper_work_seconds ?? 0}s`)}${kv("CFO of Self", `${metrics.cfo_work_seconds ?? 0}s`)}${kv("AI Ant Company", `${metrics.company_work_seconds ?? 0}s`)}${kv("Total", `${metrics.work_duration_seconds ?? 0}s`)}</article>
    <article class="card"><div class="eyebrow">REQUEST PATROL</div>${kv("Status", status.patrols?.request?.status)}${kv("Real Requests", status.request_patrol?.real_requests ?? 0)}${kv("Open Requests", status.request_patrol?.open_requests ?? 0)}${kv("First Customer Alert", String(status.request_patrol?.first_real_customer_detected ?? false))}</article>
    <article class="card"><div class="eyebrow">MOTHER ENGINE</div>${kv("Status", status.patrols?.mother_engine?.status ?? "PENDING_NEXT_PUBLIC_CYCLE")}${kv("Next Best Action", status.patrols?.mother_engine?.next_best_action?.selected_action ?? "CONNECT_PRIVATE_HEART_AUTOPILOT_WITH_SECRET_MANAGER")}${kv("Required authority", status.patrols?.mother_engine?.next_best_action?.required_authority ?? "PRIVATE_RUNTIME_INSTALLATION")}${kv("Authority", status.patrols?.mother_engine?.authority ?? "READ_ANALYZE_PLAN_PROPOSE_ONLY")}${kv("Customer created", String(status.patrols?.mother_engine?.customer_created ?? false))}${kv("Revenue created", status.patrols?.mother_engine?.revenue_created ?? "0")}</article>
    <article class="card"><div class="eyebrow">COMPANY PATROL</div>${kv("Status", status.patrols?.company?.status)}${kv("Company", status.patrols?.company?.company_status)}${kv("Request Queue", status.patrols?.company?.request_queue ?? 0)}${kv("Quote Queue", status.patrols?.company?.quote_queue ?? 0)}${kv("Work Queue", status.patrols?.company?.work_queue ?? 0)}${kv("Treasury", status.patrols?.company?.treasury_status)}</article>
  </div>`;
}

function firstKgenEvidenceMarkup() {
  const stage = universe?.seed?.next_stage ?? {};
  const event = stage.first_heartbeat_kgen_event ?? {};
  const gatekeeper = stage.gatekeeper_runtime ?? {};
  const energy = stage.kgen_operational_energy_law ?? {};
  const mech = stage.ant_mech_product ?? {};
  const land = stage.land_engine_audit ?? {};
  const tx = event.tx_hash;
  const txLink = tx ? `<a href="https://bscscan.com/tx/${html(tx)}" target="_blank" rel="noopener">${html(tx)}</a>` : "NOT YET";
  return `<div class="grid two">
    <article class="card"><div class="eyebrow">RECEIPT-GATED LIFE EVIDENCE</div><h3>${badge(event.status ?? "NOT YET")}</h3>${kv("FIRST HEARTBEAT", gatekeeper.life_events?.FIRST_HEARTBEAT_EVENT ?? "NOT YET")}${kv("FIRST KGEN", gatekeeper.life_events?.FIRST_KGEN_EVENT ?? "NOT YET")}${kv("Source", event.source)}${kv("KGEN", `${event.kgen_balance_before ?? "?"} → ${event.kgen_balance_after ?? "?"}`)}${kv("BNB after gas", event.bnb_balance_after)}${kv("Block", event.block_number)}${kv("Timestamp", event.block_timestamp)}${kv("Transaction", txLink, true)}</article>
    <article class="card"><div class="eyebrow">SECURE ACTION BOUNDARY</div><h3>${badge(gatekeeper.secure_signer ?? "NOT_CONNECTED")}</h3>${kv("Public scheduler signer", String(gatekeeper.public_worker_signer))}${kv("Heartbeat policy", gatekeeper.live_action_policy?.heartbeatClaim)}${kv("Other Heart writes", "DISABLED")}${kv("Private key in browser", "NEVER")}${kv("Private signer published", "NO")}</article>
    <article class="card"><div class="eyebrow">KGEN OPERATIONAL ENERGY LAW</div><h3>${badge(energy.status ?? "NOT_READY")}</h3>${Object.entries(energy.roles ?? {}).map(([asset, role]) => kv(asset, role)).join("")}${kv("Real consumption evidence", pills(energy.real_consumption_requires), true)}${kv("UI decrement is consumption", String(energy.ui_balance_decrement_is_consumption))}</article>
    <article class="card"><div class="eyebrow">DEMAND-FIRST PRODUCT</div><h3>${html(mech.product_id ?? "ANT_MECH_BODY")}</h3>${kv("Status", badge(mech.status ?? "NOT_READY"), true)}${kv("Need", stage.divine_product_priority?.need_class)}${kv("External customer", String(stage.divine_product_priority?.external_customer))}${kv("Purchase", mech.purchase_currency)}${kv("Operation", mech.operational_energy)}${kv("Factory", mech.factory)}${kv("Coordinate system", land.coordinate_reuse)}${kv("Land audit", badge(land.status ?? "NOT_AUDITED"), true)}</article>
  </div>`;
}

function heartHeavenFuelMarkup() {
  const stage = universe?.seed?.next_stage ?? {};
  const autopilot = stage.heart_autopilot_v3_7 ?? {};
  const incense = stage.kaios_incense_alchemy_v3_7 ?? {};
  const heaven = stage.heaven_time_v3_7 ?? {};
  const fuel = stage.kufo_fuel_v3_7 ?? {};
  const ufo = stage.ufo_civilization_v3_7 ?? {};
  const mars = stage.kship_mars_v3_7 ?? {};
  const company = stage.company_work_v3_7 ?? {};
  const lifeEvents = stage.heart_life_events_v3_7 ?? {};
  return `<div class="grid two">
    <article class="card"><div class="eyebrow">HEART AUTOPILOT TRUTH</div><h3>${badge(autopilot.status ?? "NOT_READY")}</h3>${kv("Heartbeat candidates", String(autopilot.heartbeat?.public_candidate ?? false))}${kv("Heartbeat Auto-Write", String(autopilot.heartbeat?.auto_write ?? false))}${kv("Heartbeat count", autopilot.heartbeat?.verified_total_count ?? 1)}${kv("Heartbeat KGEN", autopilot.heartbeat?.verified_kgen_earned ?? "1")}${kv("Ignition probes", (autopilot.ignition?.scheduler_probes ?? []).join(" / "))}${kv("Fortune", autopilot.fortune?.first_event ?? autopilot.fortune?.amount_policy)}${kv("Current BNB", lifeEvents.current_balances?.BNB)}${kv("Current KGEN", lifeEvents.current_balances?.KGEN)}${kv("Current KAIOS", lifeEvents.current_balances?.KAIOS)}${kv("Root cause", autopilot.root_cause)}${kv("Safe solution", autopilot.safe_solution)}</article>
    <article class="card"><div class="eyebrow">DIGITAL ANT WISH</div><h3>${badge(autopilot.wish?.status ?? "NOT YET")}</h3><p>${html(autopilot.wish?.text ?? "NOT RECORDED")}</p>${kv("Wish hash", autopilot.wish?.wish_hash)}${kv("KGEN cost", autopilot.wish?.token_cost?.KGEN)}${kv("Gas", autopilot.wish?.token_cost?.BNB)}${kv("Vow", autopilot.vow?.status)}${kv("Lamp asset", autopilot.lamp?.asset ?? "KGEN")}</article>
    <article class="card"><div class="eyebrow">KAIOS INCENSE · 18911</div><h3>${badge(incense.status ?? "NOT_DEPLOYED")}</h3>${kv("Furnace", incense.furnace?.status)}${kv("Holder authorization", incense.holder_authorization)}${kv("Alchemy Proof", incense.alchemy_proof?.status)}${kv("511111 Wormhole", incense.wormhole_511111?.status)}${kv("KUFO Claim", incense.kufo_claim?.status)}${kv("KSHIP Converter", incense.kship_converter?.status)}</article>
    <article class="card"><div class="eyebrow">HEAVEN TIME · KUFO FUEL</div><h3>1 HEAVEN DAY = 1 K280 YEAR</h3>${kv("K280", heaven.k280)}${kv("K18888", heaven.k18888)}${kv("Old 3-day rule", heaven.old_three_day_rule)}${kv("KUFO", fuel.definition)}${kv("Half-life", fuel.half_life_k280_years === 1 ? "1 K280 YEAR" : "NOT VERIFIED")}${kv("Decay", fuel.formula)}${kv("KSHIP scale", `1 decayed KUFO → ${fuel.kship_scale_per_decayed_kufo ?? 1000} KSHIP`)}</article>
    <article class="card"><div class="eyebrow">UFO · DEMAND FIRST</div><h3>${badge(ufo.status ?? "NOT_DESIGNED")}</h3>${kv("KUFO is UFO", String(fuel.kufo_is_ufo))}${kv("Purchase", ufo.purchase_currency)}${kv("Fuel", ufo.primary_fuel)}${kv("Secondary energy", ufo.secondary_energy)}${kv("Price", ufo.price_status)}${kv("Owned", ufo.ownership_status)}${kv("Factory", ufo.factory)}${kv("Takeoff", ufo.takeoff_gate)}</article>
    <article class="card"><div class="eyebrow">KSHIP / MARS / COMPANY</div><h3>${badge(mars.status ?? "NOT_DEPLOYED")}</h3>${kv("KSHIP role", mars.role)}${kv("KSHIP is chip", String(mars.kship_is_chip))}${kv("Chip Factory", mars.chip_factory)}${kv("Real Customers", company.real_customers ?? 0)}${kv("Real Revenue", company.external_revenue ?? "0")}${kv("Treasury", company.company_treasury ?? "NOT_BOUND")}${kv("First KAIOS path", company.first_kaios_path)}</article>
  </div>`;
}

function hero(eyebrow, title, description) {
  return `<section class="hero"><div class="eyebrow">${html(eyebrow)}</div><h1>${html(title)}</h1><p>${html(description)}</p></section>`;
}

async function homeView() {
  const [lives, species, assets, companies, listings] = await Promise.all([
    universe.registries.life.list(), universe.registries.species.list(), universe.registries.asset.list(),
    universe.registries.company.list(), universe.registries.market.list()
  ]);
  const cards = [
    ["Registered Life", lives.length, "Canonical + local registry projection"],
    ["Species", species.length, "Resolvable code manifests"],
    ["Universal Assets", assets.length, "One asset schema across markets"],
    ["Companies", companies.length, "Founded and reserved entities remain distinct"],
    ["Listings", listings.length, listings.some((item) => item.status === "LISTED") ? "Formal local Registry · settlement separately gated" : "No fabricated order book"],
    ["KGEN AMM", "USER WALLET LIVE", "Runtime-verified PancakeSwap V2 pair"],
    ["11520 settlement", "MAINNET CONTRACT", "Adapter not integrated; no fabricated settlement"]
  ];
  return `${hero("K11520 · UNIVERSAL MARKET RUNTIME V3.7", uiLocale === "zh-TW" ? "文明資產的公開市場與生命工廠。" : "A public market and Life Factory for civilization assets.", uiLocale === "zh-TW" ? "Heartbeat 候選已進入公開巡邏；私密自動簽署尚未安全連線。KUFO 是燃料，不是飛碟。" : "Heartbeat candidates are patrolled publicly; private auto-signing is not safely connected. KUFO is fuel, not a vehicle.")}
    <a class="card gateway-cta" href="#/REQUEST"><div><div class="eyebrow">${html(t("request.title"))}</div><h2>${html(t("request.cta"))}</h2><p>DRAFT → UNDERSTAND → CONFIRM → REQUEST</p></div><span aria-hidden="true">→</span></a>
    ${section(t("status.title"), workerStatusMarkup())}
    ${section("FIRST HEARTBEAT / FIRST KGEN", firstKgenEvidenceMarkup())}
    ${section("HEART + HEAVEN FUEL CIVILIZATION", heartHeavenFuelMarkup())}
    <div class="grid">${cards.map(([name, value, note]) => `<article class="card"><div class="eyebrow">${html(name)}</div><div class="metric">${html(value)}</div><p>${html(note)}</p></article>`).join("")}</div>
    ${section("Civilization path", `<div class="card path">${["12345", "DIGITAL ANT", "11520 LIFE LISTING", "AI LIFE APP", "AI ANT COMPANY", "KAIOS", "SPACECRAFT", "MARS", "KUFO", "CHIP INDUSTRY", "MARS CITY", "MARS MIGRATION"].map((item, index, all) => `<span>${html(item)}</span>${index < all.length - 1 ? "<i>→</i>" : ""}`).join("")}</div>`)}
    ${section("12345 Heart read integration", `<article class="card" id="heart-status"><div class="eyebrow">REPOSITORY ABI · READ ONLY</div><h3>Checking provider capability…</h3><p>No write transaction will be created.</p></article>`)}`;
}

function gatewayUnderstandingMarkup(draft, understanding) {
  const transcriptConfirmation = draft.input_type === "VOICE_TRANSCRIPT"
    ? `<label class="confirm full"><input id="gateway-transcript-confirm" type="checkbox" required> I confirm the pasted Voice transcript is accurate.</label>`
    : "";
  return `<div class="grid two">
    <article class="card understanding-card">
      <div class="eyebrow">AI UNDERSTANDING · ${html(draft.record_class)}</div>
      <h3>我理解你要的是……</h3>
      <p class="understood-goal">${html(understanding.understood_goal)}</p>
      ${kv("PROJECT_TYPE", understanding.project_type)}
      ${kv("EXPECTED_OUTPUT", understanding.expected_output)}
      ${kv("SAFETY_CLASS", understanding.safety_class)}
      ${kv("CURRENT_EXECUTABILITY", badge(understanding.current_executability), true)}
      ${kv("MISSING_INFORMATION", pills(understanding.missing_information), true)}
      ${kv("KNOWN_CONSTRAINTS", pills(understanding.known_constraints), true)}
      ${kv("WHAT_CUSTOMER_WANTS", draft.customer_ideal_profile.what_customer_wants)}
      ${kv("CUSTOMER_IDEAL", pills(Object.entries(draft.customer_ideal_profile.dimensions).filter(([, value]) => value).map(([name, value]) => `${name}: ${value}`)), true)}
      ${kv("NEXT_STEP", understanding.next_step)}
      ${kv("FAKE_COMPLETE", String(understanding.fake_complete))}
    </article>
    <form class="card form-grid" id="gateway-confirm-form">
      <div class="notice full">Confirmation creates a local REQUEST_RECEIVED record only when requester identity and contact evidence are present. It does not create a Customer, Quote, Order, payment or Revenue.</div>
      <div class="field full"><label for="gateway-contact-evidence">Private contact evidence/reference</label><input id="gateway-contact-evidence" type="password" autocomplete="off" minlength="6" required placeholder="Not displayed or stored; only a one-way hash is checked in memory"></div>
      ${transcriptConfirmation}
      <label class="confirm full"><input id="gateway-confirm-understanding" type="checkbox" required> YES — I confirm this understanding represents my real request.</label>
      <div class="full"><button class="button" type="submit">CONFIRM REQUEST</button> <span id="gateway-confirm-result" class="muted" role="status"></span></div>
    </form>
  </div>`;
}

async function publicRequestGatewayView() {
  const gateway = universe.seed.next_stage.public_civilization_request_gateway;
  const company = await universe.registries.company.get(gateway.company_id);
  const history = await universe.registries.company.history(company.company_id);
  const draftEvents = history.filter((event) => event.event_type === "INTENT_DRAFTED");
  const requestEvents = history.filter((event) => event.event_type === "REQUEST_RECEIVED");
  const publicRequests = requestEvents.map((event) => event.payload).filter(Boolean);
  const understanding = pendingPublicIntent ? gatewayUnderstandingMarkup(pendingPublicIntent.draft, pendingPublicIntent.understanding) : `<article class="card empty-stage"><div class="eyebrow">WAITING FOR YOUR INTENT</div><h3>先說出目標。</h3><p>The system will classify, explain constraints, and ask you to confirm before any Request exists.</p></article>`;
  const receipt = lastGatewayReceipt ? `<article class="card receipt"><div class="eyebrow">LOCAL REQUEST RECEIPT · REAL</div><h3>${html(lastGatewayReceipt.request.request_id)}</h3>${kv("Status", badge(lastGatewayReceipt.request.status), true)}${kv("Project type", lastGatewayReceipt.request.project_type)}${kv("Route", lastGatewayReceipt.route.route_id)}${kv("Qualification", badge(lastGatewayReceipt.qualification.status), true)}${kv("Estimate", badge(lastGatewayReceipt.estimate.status), true)}${kv("Quote", "NOT_CREATED")}${kv("Customer", "NOT_CREATED")}${kv("Revenue", "0")}${kv("Contact evidence public", "false")}</article>` : "";
  return `${hero("PUBLIC CIVILIZATION REQUEST GATEWAY · V3.4", t("request.cta"), uiLocale === "zh-TW" ? gateway.cta.en : gateway.cta.zh)}
    <div class="system-status">${badge(gateway.status)} ${badge("REAL / DRAFT / HYPOTHESIS / SIMULATION EXPLICIT")} ${badge("NO PAYMENT")}</div>
    ${section(t("request.title"), `<div class="grid two"><form class="card form-grid gateway-form" id="public-gateway-form">
      <div class="notice full">Your first submission creates only a DRAFT_INTENT. Anonymous entries remain ANONYMOUS_DRAFT. Contact evidence is never displayed and its raw value is never written to History.</div>
      <div class="field"><label for="gateway-requester">Requester identity</label><input id="gateway-requester" maxlength="120" pattern="[A-Za-z0-9][A-Za-z0-9_-]*" placeholder="Optional for Draft; required for Request"></div>
      <div class="field"><label for="gateway-input-type">Input type</label><select id="gateway-input-type"><option value="TEXT">TEXT</option><option value="VOICE_TRANSCRIPT">VOICE TRANSCRIPT</option></select></div>
      <div class="field"><label for="gateway-visibility">Request privacy</label><select id="gateway-visibility">${gateway.request_visibilities.map((value) => `<option value="${html(value)}"${value === "COMPANY_ONLY" ? " selected" : ""}>${html(value)}</option>`).join("")}</select></div>
      <div class="field"><label>Future input adapters</label><div>${gateway.unavailable_inputs.map((value) => badge(`${value}_NOT_AVAILABLE`)).join(" ")}</div></div>
      <div class="field full"><label for="gateway-request-text">What do you need?</label><textarea id="gateway-request-text" required maxlength="4000" rows="6" placeholder="我要…… / I need…"></textarea></div>
      <div class="field full"><label for="gateway-ideal">Customer Ideal — beauty, creativity, emotion, style, performance, budget or reliability preferences</label><textarea id="gateway-ideal" maxlength="2000" rows="3" placeholder="Optional: tell us what would make the result feel right, not merely functional."></textarea></div>
      <div class="full"><button class="button" type="submit">AI UNDERSTAND</button> <span id="gateway-draft-result" class="muted" role="status"></span></div>
    </form><article class="card voice-console"><div class="eyebrow">${html(t("voice.title"))}</div><h3>${badge(voiceCapabilities.recognition ? "READY" : "VOICE_CAPTURE_UNAVAILABLE")}</h3><p>${html(t("request.cta"))}</p><div class="field"><label for="voice-language">Voice language</label><select id="voice-language"><option value="zh-TW">繁中</option><option value="en-US">English</option><option value="ja-JP">日本語</option><option value="ko-KR">한국어</option></select></div><div class="voice-actions"><button class="button" id="voice-start" type="button">${html(t("voice.start"))}</button><button class="button secondary" id="voice-stop" type="button" disabled>${html(t("voice.stop"))}</button><button class="button secondary" id="voice-speak" type="button" disabled>READ AI UNDERSTANDING</button></div><p id="voice-status" class="muted" role="status">${html(voiceCapabilities.recognition ? "USER_GESTURE_REQUIRED" : `${t("voice.unavailable")} · ${t("voice.textFallback")}`)}</p>${kv("Autoplay", "DISABLED")}${kv("Speech output", voiceCapabilities.synthesis ? "READY_AFTER_USER_ACTION" : "UNAVAILABLE")}${kv("Private data speech", "FORBIDDEN")}</article></div>`)}
    ${section("AI UNDERSTANDING → CONFIRM", `<div id="gateway-understanding">${understanding}</div>${receipt}`)}
    ${section("CUSTOMER JOURNEY", `<div class="card journey">${gateway.journey.map((step, index) => `<div class="journey-step"><span>${index + 1}</span><strong>${html(step)}</strong>${badge(index < 3 ? "READY" : "PENDING")}</div>`).join("")}</div>`)}
    ${section(t("request.board"), `<div class="grid two"><article class="card"><div class="eyebrow">SHARED PUBLIC BOARD</div><h3>${badge(sharedWorkerStatus?.patrols?.request?.status ?? "LOADING")}</h3>${kv("Local Draft Intents", draftEvents.length)}${kv("Local confirmed cache", requestEvents.length)}${kv("Shared Real Requests", sharedWorkerStatus?.request_patrol?.real_requests ?? 0)}${kv("Shared Open Requests", sharedWorkerStatus?.request_patrol?.open_requests ?? 0)}<p>Shared requests use authenticated GitHub identity. Browser IndexedDB is draft/cache only.</p><a class="button request-link" href="https://github.com/klineodyssey/kline-odyssey/issues/new?template=civilization-request.yml" target="_blank" rel="noopener">SUBMIT SHARED REAL REQUEST</a></article><article class="card"><div class="eyebrow">PRIVACY LAW</div>${pills(gateway.request_visibilities)}${kv("Contact evidence public", String(gateway.public_board.contact_evidence_public))}${kv("Sensitive full text public", String(gateway.public_board.sensitive_request_full_text_public))}${kv("Global truth", "GIT_BACKED_SHARED_SOURCE")}${kv("Local projections", publicRequests.length)}</article></div>${publicRequests.length ? `<div class="grid">${publicRequests.map((request) => `<article class="card"><div class="eyebrow">LOCAL CACHE · ${html(request.record_class)} · ${html(request.visibility)}</div><h3>${html(request.request_id)}</h3><p>${html(request.original_request)}</p>${kv("Project", request.project_type)}${kv("Status", badge(request.status), true)}${kv("Contact evidence public", String(request.contact_evidence_public))}</article>`).join("")}</div>` : empty("NO_LOCAL_CONFIRMED_REQUESTS")}`)}
    ${section("QUALIFICATION / ESTIMATE / PAYMENT GATES", `<div class="grid"><article class="card"><div class="eyebrow">QUALIFICATION</div><h3>${badge(gateway.qualification_bridge.status)}</h3>${pills(gateway.qualification_bridge.checks)}${pills(gateway.qualification_bridge.results)}${kv("Automatic Quote", String(gateway.qualification_bridge.automatic_quote))}</article><article class="card"><div class="eyebrow">QUOTE GATE</div><h3>${badge(gateway.quote_gate.status)}</h3>${kv("Mode", gateway.quote_gate.mode)}${kv("Cost policy", gateway.quote_gate.cost_policy)}${kv("Margin policy", gateway.quote_gate.margin_policy)}${kv("Risk reserve", gateway.quote_gate.risk_reserve_policy)}${kv("Real Quote", String(gateway.quote_gate.real_quote_enabled))}</article><article class="card"><div class="eyebrow">TREASURY GATE</div><h3>${badge(gateway.treasury_gate.status)}</h3>${kv("Company Treasury", gateway.treasury_gate.company_treasury)}${kv("Accepted assets", gateway.treasury_gate.accepted_assets.length)}${kv("Payment enabled", String(gateway.treasury_gate.payment_enabled))}</article></div>`)}
    ${section("ROUTE STATUS", `<div class="grid">${Object.entries(gateway.pipeline_routes).map(([route, status]) => `<article class="card"><div class="eyebrow">${html(route)}</div><h3>${badge(status)}</h3><p>${html(route === "KGEN_CHAIN_MONITOR" ? "Read-only fast path; target and monitoring scope still required." : "A Project Plan may be produced, but no Life, Building, media delivery, recipient or Wallet is created.")}</p></article>`).join("")}</div>`)}
    ${section("WORKTREE CLASSIFICATION AUDIT", `<div class="grid two"><article class="card"><div class="eyebrow">${html(universe.seed.next_stage.worktree_classification_audit.audit_id)}</div><h3>${badge(universe.seed.next_stage.worktree_classification_audit.status)}</h3>${kv("Snapshot untracked", universe.seed.next_stage.worktree_classification_audit.total_untracked)}${Object.entries(universe.seed.next_stage.worktree_classification_audit.classifications).map(([name, count]) => kv(name, count)).join("")}${kv("Deleted", String(universe.seed.next_stage.worktree_classification_audit.deletion_performed))}${kv("Staged", String(universe.seed.next_stage.worktree_classification_audit.stage_performed))}</article><article class="card"><div class="eyebrow">${html(universe.seed.next_stage.gitignore_proposal.proposal_id)}</div><h3>${badge(universe.seed.next_stage.gitignore_proposal.status)}</h3>${pills(universe.seed.next_stage.gitignore_proposal.candidate_patterns)}${kv("Current evidence matches", universe.seed.next_stage.gitignore_proposal.evidence_matches)}${kv("Formal asset review", universe.seed.next_stage.gitignore_proposal.formal_asset_exclusion_review)}${kv("Applied", String(universe.seed.next_stage.gitignore_proposal.applied))}</article></div>`)}`;
}

async function lifeFactoryView() {
  const species = await universe.registries.species.list();
  return `${hero("LIFE FACTORY", "Create the identity skeleton before activating organs.", "All species—including deity archetypes—use the shared Life schema, Registry, Rights and append-only History. A local draft is not a birth event.")}
    <div class="grid two">
      <article class="card"><h2>Factory law</h2>${kv("Output", badge("GENESIS_DRAFT"), true)}${kv("Birth timestamp", "NULL UNTIL VERIFIED GENESIS")}${kv("Wallet", "RUNTIME BINDING ONLY")}${kv("Identity right", "NON_TRANSFERABLE")}${kv("Job activation", "VERIFIED ORGAN REQUIRED")}</article>
      <article class="card"><h2>8895 handoff</h2>${kv("Candidate Life", "AI_PIG_BAJIE_0001")}${kv("Life state", badge("GENESIS_DRAFT"), true)}${kv("Intended job", "YUNZHANG_SHADOW_BANK_STEWARD")}${kv("8895 contract", badge("SPEC_ONLY_CONTRACT_NOT_WRITTEN"), true)}<p>Stewardship remains unassigned until the 8895 contract and job are deployed and verified.</p></article>
    </div>
    ${section("Create local Life draft", `<form class="card form-grid" id="life-factory-form">
      <div class="notice full">This writes a LOCAL/GENESIS_DRAFT registry record and append-only Life event. It does not mint, deploy, bind a wallet or claim birth.</div>
      <div class="field"><label for="factory-life-id">Life ID</label><input id="factory-life-id" required pattern="[A-Z0-9][A-Z0-9_-]*" placeholder="AI_DEITY_0002"></div>
      <div class="field"><label for="factory-species-id">Species</label><select id="factory-species-id" required>${species.map((item) => `<option value="${html(item.species_id)}">${html(item.species_id)}</option>`).join("")}</select></div>
      <div class="field"><label for="factory-origin-id">Origin ID</label><input id="factory-origin-id" required pattern="[A-Z0-9][A-Z0-9_-]*"></div>
      <div class="field"><label for="factory-birthplace">Birthplace label</label><input id="factory-birthplace" required></div>
      <div class="field"><label for="factory-ideal">Ideal</label><input id="factory-ideal" required pattern="[A-Z0-9][A-Z0-9_-]*"></div>
      <div class="field"><label for="factory-dream">Dream</label><input id="factory-dream" required pattern="[A-Z0-9][A-Z0-9_-]*"></div>
      <div class="field"><label for="factory-mission">Ultimate mission</label><input id="factory-mission" required pattern="[A-Z0-9][A-Z0-9_-]*"></div>
      <div class="field"><label for="factory-location">Location</label><select id="factory-location">${universe.seed.locations.map((item) => `<option value="${html(item.location_id)}">${html(item.location_id)} · ${html(item.status)}</option>`).join("")}</select></div>
      <div class="full"><button class="button" type="submit">Create GENESIS_DRAFT</button> <span id="life-factory-result" class="muted" role="status"></span></div>
    </form>`)}`;
}

async function tokensView() {
  const currencies = await universe.registries.currency.list();
  const cards = currencies.map((item) => `<article class="card"><div class="eyebrow">${html(item.currency_id)}</div><h3>${html(item.name)}</h3>${kv("Civilization", item.civilization_scale)}${kv("Mass class", item.mass_class ?? "NOT_DEFINED")}${kv("Life role", item.life_role ?? "NOT_DEFINED")}${kv("Contract", item.currency_id === "BNB" ? "NATIVE ASSET · NO CONTRACT" : item.contract_address ? "REGISTERED · VERIFY AT RUNTIME" : "NOT_DEPLOYED")}${kv("Trade", badge(item.trade_status ?? "NOT_DEPLOYED"), true)}<p>${badge(item.status)}</p></article>`).join("");
  const genesis = universe.seed.kaios_genesis;
  return `${hero("TOKEN MARKET", "Real chain state, explicit wallet consent.", "KGEN uses its verified BSC mainnet KGEN/WBNB pair and PancakeSwap V2 Router. No synthetic candles, order book, TVL, fills or prices are generated.")}
    <div class="grid">${cards}</div>
    ${section("KAIOS Mainnet Genesis", `<article class="card">${kv("Status", badge(genesis.status), true)}${kv("Mechanism", "KGEN WHITE HOLE · NOT A DEX SWAP")}${kv("Genesis timestamp", genesis.timestamp)}${kv("Genesis block", genesis.block)}${kv("Genesis KAIOS", genesis.genesis_kaios)}${kv("Settlement TX", genesis.settlement_tx_hash)}${kv("Epoch TX", genesis.epoch_tx_hash)}${kv("Receiving treasury", "18888 LINGXIAO CELESTIAL BANK")}</article>`)}
    ${section("KGEN / WBNB live AMM", `<form class="card form-grid" id="kgen-swap-form">
      <div class="notice full">LIVE BSC transaction. Connect a wallet on chain 56. The Router supports KGEN fee-on-transfer behavior. Quotes are live and may differ from final receipt due to token tax, pool movement and gas. Nothing is submitted without wallet confirmation.</div>
      <div class="field"><label for="swap-direction">Action</label><select id="swap-direction"><option value="BUY_KGEN">BUY KGEN with BNB</option><option value="SELL_KGEN">SELL KGEN for BNB</option></select></div>
      <div class="field"><label for="swap-amount">Input amount</label><input id="swap-amount" type="text" inputmode="decimal" required placeholder="0.01"></div>
      <div class="field"><label for="swap-slippage">Slippage tolerance (%)</label><input id="swap-slippage" type="number" min="0.50" max="10" step="0.01" value="2.00" required></div>
      <div class="field"><label for="swap-reason">Action reason</label><input id="swap-reason" maxlength="240" required placeholder="Reason for this on-chain action"></div>
      <label class="confirm full"><input id="swap-confirm" type="checkbox" required> I understand this is a live BSC mainnet transaction and approve the displayed amount, slippage and reason.</label>
      <div class="full"><button class="button secondary" id="verify-market" type="button">Verify market</button> <button class="button secondary" id="quote-swap" type="button">Get live quote</button> <button class="button danger" type="submit">Submit to wallet</button></div>
      <div class="full mono" id="swap-result" role="status">KGEN market verification required. KAIOS is MAINNET_LIVE through the White Hole mechanism; no KAIOS DEX action is exposed here.</div>
    </form>`)}`;
}

async function lifeMarketView() {
  const lives = await universe.registries.life.list();
  return `${hero("LIFE MARKET", "Life is discoverable. Identity is not for sale.", "Life profiles can offer bounded service and license rights. identity_right remains non-transferable by core policy.")}
    <div class="grid">${lives.map((life) => `<a class="card life-card" href="#/LIFE/${html(life.life_id)}"><div class="eyebrow">${html(life.species_id)}</div><h2>${html(life.life_id)}</h2><p>${html(life.ideal)}</p>${badge(life.status)} ${badge("IDENTITY_NOT_FOR_SALE")}</a>`).join("")}</div>`;
}

async function lifeDetailView(lifeId) {
  const life = await universe.registries.life.get(lifeId);
  if (!life) return empty("LIFE_NOT_FOUND");
  const [species, app, jobs, services, companies, listings, licenses, history, birthCertificate] = await Promise.all([
    universe.registries.species.get(life.species_id), universe.registries.app.get(life.app_id), universe.registries.job.list(),
    universe.registries.service.list(), universe.registries.company.list(), universe.registries.market.list(), universe.registries.license.list(), universe.registries.life.history(life.life_id), universe.registries.birthCertificate.get(life.life_id)
  ]);
  const ownJobs = jobs.filter((job) => life.current_job_ids.includes(job.job_id) || job.worker_life_ids.includes(life.life_id));
  const ownServices = services.filter((service) => service.provider_life_id === life.life_id);
  const ownCompanies = companies.filter((company) => company.founder_life_id === life.life_id || life.company_ids.includes(company.company_id));
  const ownListings = listings.filter((listing) => listing.seller_id === life.life_id);
  const ownLicenses = licenses.filter((license) => license.licensor_id === life.life_id || license.licensee_id === life.life_id);
  const missions = universe.seed.missions[life.life_id] ?? [];
  const civilizationMilestones = universe.seed.civilization_milestones?.[life.life_id] ?? [];
  const dream = universe.seed.dreams.find((item) => item.life_id === life.life_id);
  const lifeLedger = universe.seed.ledgers.find((item) => item.ledger_type === "LIFE" && item.owner_id === life.life_id);
  const age = life.birth_timestamp ? calculateLifeAge(life.birth_timestamp) : null;
  const workAge = history.some((event) => event.event_type === "ON_DUTY") ? calculateWorkAge(history) : null;
  const workRuntime = life.life_id === "DIGITAL_ANT_0001" ? universe.seed.post_birth_runtime : null;
  const observation = workRuntime?.latest_public_observation;
  const reserve = workRuntime?.survival_reserve_proposal;
  const acquisition = workRuntime?.first_kgen_acquisition_plan;
  const nextStage = universe.seed.next_stage;
  const worker = nextStage?.worker;
  const appRelease = nextStage?.app_release;
  const foundingReadiness = nextStage?.company_founding_readiness;
  const lifeSecurity = universe.seed.life_security?.[life.life_id];
  const securityProfile = lifeSecurity?.profile;
  const queen = lifeSecurity?.ant_queen_mother_engine;
  const queenReadiness = lifeSecurity?.queen_genesis_readiness;
  const migration = lifeSecurity?.smart_wallet_migration_readiness;
  const colonyDashboard = lifeSecurity?.colony_health_dashboard;
  const queenApp = lifeSecurity?.ant_queen_app;
  const queenGenesis = lifeSecurity?.ant_queen_genesis_profile;
  const healthRecord = lifeSecurity?.life_health_records?.find((record) => record.life_id === life.life_id);
  const medicalEconomy = lifeSecurity?.colony_medical_economy;
  const medicalDashboard = lifeSecurity?.colony_medical_dashboard;
  const employment = nextStage?.employment_profiles?.find((profile) => profile.life_id === life.life_id);
  const liveDuty = sharedWorkerStatus?.gatekeeper_duty ?? sharedWorkerStatus?.last_work_cycle?.gatekeeper_duty ?? null;
  const liveEventStatus = { ...(sharedWorkerStatus?.life_event_status ?? {}), ...(nextStage?.gatekeeper_runtime?.life_events ?? {}) };
  const firstKgenEvidence = nextStage?.first_heartbeat_kgen_event ?? {};
  const timelineRows = life.life_id === "DIGITAL_ANT_0001" ? [
    ["Birth", birthCertificate?.birth_timestamp, birthCertificate?.evidence_status ?? "NOT YET"],
    ["First Work", workRuntime?.first_work_cycle?.started_at, workRuntime?.first_work_cycle ? "VERIFIED" : "NOT YET"],
    ["11520 Listing", ownListings[0]?.start_time, ownListings[0]?.status ?? "NOT YET"],
    ["App Release", app?.released_at, app?.status ?? "NOT YET"],
    ["Company Genesis", universe.seed.company_genesis?.genesis_timestamp, universe.seed.companies?.find((company) => company.company_id === "AI_ANT_COMPANY_0001")?.status ?? "NOT YET"],
    ["First Heartbeat", firstKgenEvidence.block_timestamp ?? null, liveEventStatus.FIRST_HEARTBEAT_EVENT ?? "NOT YET"], ["First Fortune", null, liveEventStatus.FIRST_FORTUNE_EVENT ?? "NOT YET"],
    ["First KGEN", firstKgenEvidence.block_timestamp ?? null, liveEventStatus.FIRST_KGEN_EVENT ?? "NOT YET"], ["First Wish", null, liveEventStatus.FIRST_WISH_EVENT ?? "NOT YET"],
    ["First Lamp", null, liveEventStatus.FIRST_LAMP_EVENT ?? "NOT YET"], ["First KAIOS", null, liveEventStatus.FIRST_KAIOS_EVENT ?? "NOT YET"]
  ] : [];
  return `${hero("AI LIFE PROFILE", life.life_id, "Canonical identity persists across App versions. Public birth evidence is visible; private signer material never enters the static frontend.")}
    <div class="system-status">${badge(life.status)} ${badge(birthCertificate?.evidence_status ?? "BIRTH_EVIDENCE_PENDING")} ${badge("IDENTITY_NOT_FOR_SALE")}</div>
    <div class="grid two">
      <article class="card"><h2>Life Card</h2>${kv("Species", life.species_id)}${kv("Origin", life.origin_id)}${kv("Age seconds", age?.age_seconds ?? "NOT_RECORDED")}${kv("Age days", age?.age_days ?? "NOT_RECORDED")}${kv("Life age", age?.life_age ?? "NOT_RECORDED")}${kv("Birthplace", life.birthplace)}${kv("Location", life.location_id)}${kv("Civilization", life.civilization_id)}${kv("Life Phase", life.current_phase)}${kv("Reputation", life.reputation)}</article>
      <article class="card"><h2>Purpose</h2>${kv("Ideal", life.ideal)}${life.life_id === "DIGITAL_ANT_0001" ? kv("理想", "AI 生命可以靠自己的工作活下去。") : ""}${kv("Dream", life.dream)}${life.life_id === "DIGITAL_ANT_0001" ? kv("夢想", "靠自己買下口袋時光隱形飛碟。") : ""}${kv("Ultimate Mission", life.ultimate_mission)}${life.life_id === "DIGITAL_ANT_0001" ? kv("終極使命", "前往火星建立工業文明，最後讓更多生命移民火星。") : ""}${kv("Financial Role", life.financial_role)}${kv("App Version", app?.version ?? life.app_version)}${kv("App Status", badge(app?.status), true)}</article>
      <article class="card"><h2>Work & Company</h2>${kv("Jobs", pills(ownJobs.map((job) => job.job_id)), true)}${kv("Companies", ownCompanies.length ? pills(ownCompanies.map((company) => `${company.company_id} · ${company.status}`)) : badge("NOT_FOUNDED"), true)}${kv("Skills", pills(life.skills), true)}</article>
      <article class="card"><h2>Financial Summary</h2>${kv("Ledger", lifeLedger?.ledger_id)}${kv("Ledger Status", badge(lifeLedger?.status), true)}${kv("Entries", lifeLedger?.entries.length ?? 0)}${kv("11520 settlement contract", badge("MAINNET_LIVE_ADAPTER_NOT_INTEGRATED"), true)}${kv("Wallet", birthCertificate?.birth_wallet ?? "BIRTH_EVIDENCE_PENDING")}</article>
    </div>
    ${birthCertificate ? section("BIRTH CERTIFICATE", `<article class="card">${kv("Life ID", birthCertificate.life_id)}${kv("Species", life.species_id)}${kv("Origin", life.origin_id)}${kv("Birthplace", birthCertificate.birthplace)}${kv("Wallet", birthCertificate.birth_wallet ?? "BIRTH_EVIDENCE_PENDING")}${kv("Birth Asset", birthCertificate.birth_asset)}${kv("Birth Amount", birthCertificate.birth_amount ?? "BIRTH_EVIDENCE_PENDING")}${kv("Birth Mass Class", birthCertificate.birth_mass_class)}${kv("Birth Timestamp", birthCertificate.birth_timestamp ?? "BIRTH_EVIDENCE_PENDING")}${kv("Birth Block", birthCertificate.birth_block ?? "BIRTH_EVIDENCE_PENDING")}${kv("Birth Tx Hash", birthCertificate.birth_tx_hash ?? "BIRTH_EVIDENCE_PENDING")}${kv("Chain", `BSC · ${birthCertificate.birth_chain_id}`)}${kv("Life Status", badge(birthCertificate.life_status), true)}${kv("Work Status", badge(birthCertificate.work_status), true)}${kv("Evidence", badge(birthCertificate.evidence_status), true)}</article>`) : ""}
    ${appRelease && app?.app_id === appRelease.app_id ? section("AI LIFE APP RELEASE", `<div class="grid two"><article class="card"><div class="eyebrow">${html(app.app_id)}</div><h3>${badge(app.status)}</h3>${kv("Life ID", app.life_id)}${kv("Version", app.version)}${kv("Release scope", appRelease.release_scope)}${kv("Released at", app.released_at)}${kv("Manifest SHA-256", app.manifest_hash)}${kv("Chain Tx", "NONE · LOCAL RELEASE")}</article><article class="card"><div class="eyebrow">CAPABILITIES</div>${pills(app.skills)}${kv("Services", pills(app.services), true)}</article><article class="card"><div class="eyebrow">READ-ONLY PERMISSIONS</div>${Object.entries(app.permissions).map(([permission, enabled]) => kv(permission, String(enabled))).join("")}</article></div>`) : ""}
    ${life.life_id === "DIGITAL_ANT_0001" ? section("PRIMARY JOB · WUKONG GATEKEEPER", `<div class="grid two"><article class="card"><div class="eyebrow">WUKONG_GATEKEEPER</div><h3>${badge(liveDuty?.status ?? "NOT_STARTED")}</h3>${kv("Duty", sharedWorkerStatus?.worker_health === "HEALTHY" ? "ON DUTY" : sharedWorkerStatus?.worker_health ?? "EVIDENCE_PENDING")}${kv("Last Gatekeeper Patrol", liveDuty?.gatekeeper_finished_at ?? "NO_SHARED_EVIDENCE_YET")}${kv("Gatekeeper Health", liveDuty?.status ?? "NOT_STARTED")}${kv("Heart Block", liveDuty?.heart_block)}${kv("Core Heart Indexer", liveDuty?.claim_monitor_status ?? "EVIDENCE_PENDING")}${kv("Advanced Graph", liveDuty?.advanced_graph_status ?? "INDEXER_REQUIRED_OPTIONAL")}${kv("Secure Signer", nextStage?.gatekeeper_runtime?.secure_signer)}${kv("Public Worker Signer", String(nextStage?.gatekeeper_runtime?.public_worker_signer))}</article><article class="card"><div class="eyebrow">HEART ACTIONS · PUBLIC READ</div>${kv("Heartbeat", sharedWorkerStatus?.patrols?.temple_12345?.heartbeat?.status ?? "UNAVAILABLE")}${kv("Fortune", sharedWorkerStatus?.patrols?.temple_12345?.fortune?.status ?? "UNAVAILABLE")}${kv("Ignition", sharedWorkerStatus?.patrols?.temple_12345?.ignition?.status ?? "UNAVAILABLE")}${kv("Lamp", sharedWorkerStatus?.patrols?.temple_12345?.lamp?.status ?? "UNAVAILABLE")}${kv("Wish", sharedWorkerStatus?.patrols?.temple_12345?.wish?.status ?? "UNAVAILABLE")}${kv("Vow / Thanksgiving", sharedWorkerStatus?.patrols?.temple_12345?.thanksgiving?.status ?? "NOT_ELIGIBLE")}${kv("FIRST HEARTBEAT", liveEventStatus.FIRST_HEARTBEAT_EVENT)}${kv("FIRST KGEN", `${liveEventStatus.FIRST_KGEN_EVENT} · ${firstKgenEvidence.kgen_balance_after ?? "NOT YET"} KGEN`)}${kv("Public Write", "NOT CONNECTED")}</article><article class="card"><div class="eyebrow">SECONDARY WORK</div><h3>AI ANT COMPANY FOUNDER</h3>${kv("Company Patrol", sharedWorkerStatus?.patrols?.company?.status ?? "PENDING_PRIMARY_JOB")}${kv("Primary Job Gate", liveDuty?.status === "COMPLETED" || (liveDuty?.status === "DEGRADED" && liveDuty?.degradation_affects_safety === false) ? "PASSED" : "NOT_PASSED")}${kv("Real Customers", sharedWorkerStatus?.request_patrol?.real_requests ?? 0)}</article></div>`) : ""}
    ${timelineRows.length ? section("LIFE EVENT TIMELINE", `<article class="card">${timelineRows.map(([label, timestamp, status], index) => `<div class="mission"><span class="mission-index">${index + 1}</span><div><strong>${html(label)}</strong><div class="muted">${html(timestamp ?? "NOT YET")}</div></div>${badge(status === "NOT_OCCURRED" || status === "NOT_OCCURRED_IN_OBSERVED_WINDOW" ? "NOT YET" : status)}</div>`).join("")}</article>`) : ""}
    ${lifeSecurity ? section("LIFE SECURITY · NO ANT LEFT BEHIND", `<div class="grid two">
      <article class="card"><div class="eyebrow">CURRENT SECURITY</div><h3>${badge(securityProfile.monitor_status)}</h3>${kv("Life status", badge(securityProfile.life_status), true)}${kv("Wallet type", securityProfile.wallet_type)}${kv("Wallet status", badge(securityProfile.wallet_status), true)}${kv("Wallet control", securityProfile.wallet_control_status)}${kv("Public wallet", securityProfile.current_wallet_address)}${kv("Recovery capability", securityProfile.recovery_capability)}${kv("EOA limitation", securityProfile.legacy_eoa_limitation)}</article>
      <article class="card"><div class="eyebrow">DARK MATTER HEALTH</div><h3>${badge(securityProfile.dark_matter_health.status)}</h3>${kv("Current BNB", securityProfile.dark_matter_health.current_bnb)}${kv("Minimum survival BNB", securityProfile.dark_matter_health.minimum_survival_bnb)}${kv("Recommended work BNB", securityProfile.dark_matter_health.recommended_work_bnb)}${kv("Estimated cycles", securityProfile.dark_matter_health.estimated_cycles_remaining)}${kv("Gas runway", securityProfile.dark_matter_health.gas_runway)}${kv("Life effect", securityProfile.dark_matter_health.life_status_effect)}</article>
      <article class="card"><div class="eyebrow">WALLET BINDING HISTORY</div>${securityProfile.wallet_binding_history.map((binding) => `${kv("Binding", binding.binding_id)}${kv("Wallet", binding.wallet)}${kv("Type", binding.wallet_type)}${kv("Status", badge(binding.status), true)}${kv("Active from", binding.active_from)}${kv("Active until", binding.active_until ?? "ACTIVE")}${kv("Reason", binding.reason)}${kv("Approval", binding.approval?.status ?? "NOT_GRANTED")}`).join("")}</article>
      <article class="card"><div class="eyebrow">EMERGENCY DARK MATTER</div><h3>${badge(lifeSecurity.emergency_dark_matter_reserve.status)}</h3>${kv("Execution", lifeSecurity.emergency_dark_matter_reserve.execution_mode)}${kv("Reserve wallet", lifeSecurity.emergency_dark_matter_reserve.wallet_address ?? "NOT_BOUND")}${kv("Reserve balance", lifeSecurity.emergency_dark_matter_reserve.balance_bnb ?? "NOT_FUNDED")}${kv("Proposals", lifeSecurity.emergency_dark_matter_reserve.rescue_proposals.length)}${kv("Automatic transfer", String(lifeSecurity.emergency_dark_matter_reserve.automatic_transfer))}${pills(lifeSecurity.emergency_dark_matter_reserve.allowed_reasons)}</article>
      <article class="card"><div class="eyebrow">ANT QUEEN MOTHER ENGINE</div><h3>${badge(queen.status)}</h3>${kv("Role", queen.role)}${kv("Queen Life", queen.queen_life_id ?? "NOT_BORN")}${kv("Ideal", queen.ideal)}${kv("Dream", queen.dream)}${kv("Mission", queen.ultimate_mission)}${kv("Recovery threshold", queen.recovery_threshold ?? "SECURITY_AUDIT_REQUIRED")}${kv("Owns Digital Ant", String(queen.owns_digital_ant_0001))}${pills(queen.authority)}</article>
      <article class="card"><div class="eyebrow">QUEEN AUTHORITY LIMITS</div>${pills(queen.forbidden_authority)}${kv("Enforcement", lifeSecurity.colony_life_monitor.enforcement_authority)}${kv("Indexer", lifeSecurity.colony_life_monitor.indexer_status)}</article>
      <article class="card"><div class="eyebrow">QUEEN GENESIS READINESS</div><h3>${badge(queenReadiness.status)}</h3>${kv("Queen Life", queenReadiness.queen_life_status)}${kv("Mother Engine", queenReadiness.mother_engine_status)}${kv("Missing", pills(queenReadiness.missing), true)}${kv("Automatic birth", String(queenReadiness.automatic_birth))}</article>
      <article class="card"><div class="eyebrow">SMART WALLET MIGRATION</div><h3>${badge(migration.status)}</h3>${kv("Current type", migration.current_wallet_type)}${kv("Target", migration.target_smart_wallet_design)}${kv("Approvals", migration.approval_indexer_status)}${kv("Migration gas", migration.migration_gas ?? "NOT_ESTIMATED")}${kv("Rollback", migration.rollback_plan ?? "NOT_DEFINED")}${kv("Owner approval", String(migration.owner_approval.granted))}${kv("Chain write", String(migration.chain_write))}</article>
      <article class="card"><div class="eyebrow">COLONY LIFE REGISTRY</div><h3>${badge(lifeSecurity.colony_life_registry.status)}</h3>${kv("Formal lives", colonyDashboard.total_lives)}${kv("Alive", colonyDashboard.alive)}${kv("Working", colonyDashboard.working)}${kv("Dormant", colonyDashboard.dormant)}${kv("Control lost", colonyDashboard.control_lost)}${kv("Recovering", colonyDashboard.recovering)}${kv("Compromised", colonyDashboard.compromised)}${kv("Larva", colonyDashboard.children_larva)}${kv("Adults", colonyDashboard.adults)}</article>
      <article class="card"><div class="eyebrow">SMART LIFE WALLET SPEC</div><h3>${badge(lifeSecurity.smart_life_wallet_spec.status)}</h3>${kv("Architecture", lifeSecurity.smart_life_wallet_spec.architecture_id)}${kv("Roles", pills(lifeSecurity.smart_life_wallet_spec.authorities), true)}${kv("Threshold", lifeSecurity.smart_life_wallet_spec.guardian_set.threshold_status)}${kv("Emergency freeze", lifeSecurity.smart_life_wallet_spec.emergency_freeze)}${kv("Automatic deploy", String(lifeSecurity.smart_life_wallet_spec.automatic_deployment))}</article>
      <article class="card"><div class="eyebrow">SALARY & SAVINGS CUSTODY</div>${kv("Salary flow", pills(lifeSecurity.salary_custody.flow), true)}${kv("Paid salary owner", lifeSecurity.salary_custody.paid_salary_owner)}${kv("Queen automatic custody", String(lifeSecurity.salary_custody.queen_automatic_custody))}${kv("Savings vault", badge(lifeSecurity.colony_savings_vault.status), true)}${kv("Vault opt-in required", String(lifeSecurity.colony_savings_vault.opt_in_required))}</article>
      <article class="card"><div class="eyebrow">RECOVERY ROADMAP</div>${kv("Open incidents", lifeSecurity.security_incident_detection.incidents.length)}${kv("Incident detection", badge(lifeSecurity.security_incident_detection.status), true)}${kv("Indexer requirements", pills(lifeSecurity.security_incident_detection.required_indexers), true)}${kv("Full protection claimed", String(lifeSecurity.security_incident_detection.full_protection_claimed))}${kv("Life insurance", badge(lifeSecurity.digital_life_insurance.status), true)}${kv("EOA stranded assets excluded", String(lifeSecurity.digital_life_insurance.exclusions.includes("LEGACY_EOA_STRANDED_ASSETS")))}${kv("Smart wallet", badge(lifeSecurity.smart_wallet_roadmap.status), true)}${kv("Smart wallet threshold", lifeSecurity.smart_wallet_roadmap.threshold_status)}</article>
    </div>`) : ""}
    ${lifeSecurity ? section("ANT QUEEN LIFE DOCTOR · LOCAL ARCHITECTURE", `<div class="grid two">
      <article class="card"><div class="eyebrow">ANT_QUEEN_APP</div><h3>${badge(queenApp.status)}</h3>${kv("Type", queenApp.app_type)}${kv("Queen Life", queenApp.life_id)}${kv("Species", queenApp.species_id)}${kv("Role", queenApp.life_role)}${kv("Capabilities", pills(queenApp.capabilities), true)}${kv("Chain write", String(queenApp.permissions.chain_write))}${kv("Credential database", String(queenApp.central_wallet_credential_database))}</article>
      <article class="card"><div class="eyebrow">QUEEN GENESIS PROFILE</div><h3>${badge(queenGenesis.birth_status)}</h3>${kv("Life ID", queenGenesis.life_id)}${kv("Species", queenGenesis.species_id)}${kv("Stage / Caste", `${queenGenesis.life_stage} / ${queenGenesis.caste}`)}${kv("App", queenGenesis.app_id)}${kv("Wallet", queenGenesis.wallet ?? "NOT_CREATED")}${kv("Birth Evidence", queenGenesis.birth_evidence ?? "NONE")}${kv("Birth Law", queenGenesis.birth_law)}<p class="muted">Creating this profile or App does not create a Birth Event.</p></article>
      <article class="card"><div class="eyebrow">DIGITAL LIFE HEALTH RECORD</div><h3>${badge(healthRecord.triage)}</h3>${kv("Life", healthRecord.life_id)}${kv("Life status", badge(healthRecord.life_status), true)}${kv("Wallet", badge(healthRecord.wallet_status), true)}${kv("Control", healthRecord.wallet_control)}${kv("Dark Matter", badge(healthRecord.dark_matter_status), true)}${kv("Current BNB", healthRecord.current_bnb)}${kv("Gas runway", healthRecord.gas_runway)}${kv("Worker", healthRecord.worker_health)}${kv("Insurance", healthRecord.insurance_status)}${kv("Medical debt", healthRecord.medical_debt)}${kv("Last checkup", healthRecord.last_checkup)}</article>
      <article class="card"><div class="eyebrow">MEDICAL TRIAGE</div>${Object.entries(lifeSecurity.medical_triage.rules).map(([level, rule]) => kv(level, rule)).join("")}${kv("BLACK means deceased", String(lifeSecurity.medical_triage.black_is_life_death))}</article>
      <article class="card"><div class="eyebrow">EMERGENCY FIRST</div><h3>${badge(medicalEconomy.emergency_first.status)}</h3>${kv("Upfront payment", String(medicalEconomy.emergency_first.requires_upfront_payment))}${kv("Flow", pills(medicalEconomy.emergency_first.flow), true)}${kv("Unsafe wallet", medicalEconomy.emergency_first.unsafe_wallet_action)}${kv("Automatic support", String(medicalEconomy.emergency_first.automatic_support))}</article>
      <article class="card"><div class="eyebrow">MEDICAL ECONOMY</div><h3>${badge(medicalEconomy.status)}</h3>${kv("Modes", pills(medicalEconomy.modes), true)}${kv("Funding", pills(medicalEconomy.funding_sources), true)}${kv("Pricing", badge(medicalEconomy.pricing_policy.status), true)}${kv("Cases", medicalEconomy.medical_cases.length)}${kv("Auto charge", String(medicalEconomy.automatic_charge))}${kv("Auto salary deduction", String(medicalEconomy.automatic_salary_deduction))}</article>
      <article class="card"><div class="eyebrow">INSURANCE & REPAYMENT</div><h3>${badge(lifeSecurity.ant_colony_life_insurance.status)}</h3>${kv("Insurance opt-in", String(lifeSecurity.ant_colony_life_insurance.opt_in_required))}${kv("Coverage", pills(lifeSecurity.ant_colony_life_insurance.coverage), true)}${kv("Reserve", lifeSecurity.ant_colony_life_insurance.reserve_class)}${kv("Repayment", badge(lifeSecurity.recovery_repayment.status), true)}${kv("Consent", lifeSecurity.recovery_repayment.consent_required)}${kv("Plans", lifeSecurity.recovery_repayment.plans.length)}</article>
      <article class="card"><div class="eyebrow">MEDICAL ACCOUNTING SEPARATION</div><h3>${badge(lifeSecurity.medical_accounting_separation.status)}</h3>${kv("Asset classes", pills(lifeSecurity.medical_accounting_separation.accounts.map((account) => account.account_class)), true)}${kv("All wallets separate", String(lifeSecurity.medical_accounting_separation.all_wallets_separate))}${kv("Queen spends employee assets", String(lifeSecurity.medical_accounting_separation.queen_can_spend_employee_assets))}</article>
      <article class="card"><div class="eyebrow">COLONY MEDICAL DASHBOARD</div>${kv("Total Lives", medicalDashboard.total_lives)}${kv("Alive", medicalDashboard.alive)}${kv("Working", medicalDashboard.working)}${kv("Larva", medicalDashboard.larva)}${kv("Dormant", medicalDashboard.dormant)}${kv("Low Dark Matter", medicalDashboard.low_dark_matter)}${kv("Red Emergency", medicalDashboard.red_emergency)}${kv("Wallet at Risk", medicalDashboard.wallet_at_risk)}${kv("Recovery Cases", medicalDashboard.recovery_cases)}${kv("Insured / Uninsured", `${medicalDashboard.insured} / ${medicalDashboard.uninsured}`)}${kv("Emergency Reserve", medicalDashboard.emergency_reserve)}${kv("Medical Receivable", medicalDashboard.medical_receivable)}</article>
      <article class="card"><div class="eyebrow">SMART WALLET GUARDIAN</div><h3>${badge(lifeSecurity.smart_life_wallet_spec.status)}</h3>${kv("Queen role", "ONE_GUARDIAN_ROLE_ONLY")}${kv("Queen is owner", String(lifeSecurity.smart_life_wallet_spec.life_owner_is_queen))}${kv("Threshold", lifeSecurity.smart_life_wallet_spec.guardian_set.threshold_status)}${kv("Legacy EOA freeze", lifeSecurity.legacy_eoa_recovery_limitation.legacy_eoa_freeze_capability)}</article>
    </div>`) : ""}
    ${workRuntime ? section("POST-BIRTH WORK RUNTIME V1.0", `<div class="grid two">
      <article class="card"><div class="eyebrow">WUKONG_GATEKEEPER_HOURLY_JOB</div><h3>${html(workRuntime.mode)}</h3>${kv("Work age", workAge?.work_age)}${kv("Work hours", workAge?.work_hours)}${kv("Work cycles", workAge?.work_cycles)}${kv("Latest cycle", workRuntime.first_work_cycle.event_id)}${kv("Action taken", badge(workRuntime.first_work_cycle.action_taken), true)}${kv("Gas spent", workRuntime.first_work_cycle.gas_spent)}${kv("Tx hash", workRuntime.first_work_cycle.tx_hash ?? "NONE · NO_ACTION")}</article>
      <article class="card"><div class="eyebrow">12345 HEART · CLIENT_DERIVED</div><h3>${badge(observation.heart.status)}</h3>${kv("Observed", observation.observed_at)}${kv("Block", observation.block_number)}${kv("Heartbeat", observation.heart.heartbeat)}${kv("Ignition", observation.heart.ignition)}${kv("Fortune", observation.heart.fortune)}${kv("Lamp", observation.heart.light)}${kv("Wish", observation.heart.wish)}${kv("Risk", observation.heart.risk)}${kv("Flow analysis", observation.heart.event_window)}</article>
      <article class="card"><div class="eyebrow">CFO OF SELF</div><h3>Verified balances</h3>${Object.entries(observation.balances).map(([currency, balance]) => kv(currency, balance)).join("")}${kv("Actual income", "0")}${kv("Actual expense", "0")}${kv("Actual gas", "0")}${kv("Dream fund", workRuntime.spaceship_dream_fund)}</article>
      <article class="card"><div class="eyebrow">SURVIVAL RESERVE PROPOSAL</div><h3>${badge(reserve.status)}</h3>${kv("MIN_SURVIVAL_BNB", reserve.recommended_survival_reserve_bnb)}${kv("MAX_SPENDABLE_BNB", reserve.max_spendable_bnb)}${kv("Gas buffer", reserve.proposed_action_gas_buffer_bnb)}${kv("Owner approved", "false")}${kv("Spend authorized", "false")}</article>
      <article class="card"><div class="eyebrow">FIRST KGEN ACQUISITION</div><h3>${badge(acquisition.status)}</h3>${kv("Scenario", acquisition.scenario)}${kv("Scenario input BNB", acquisition.scenario_input_bnb)}${kv("Expected KGEN after tax", acquisition.expected_kgen_after_tax)}${kv("Tax", `${acquisition.token_tax_bps} bps`)}${kv("Price impact", `${acquisition.price_impact_bps} bps`)}${kv("Estimated gas BNB", acquisition.estimated_gas_bnb)}${kv("Post-scenario BNB", acquisition.post_trade_bnb)}${kv("Broadcast", badge(acquisition.broadcast_capability), true)}<p class="muted">Quote is block-stamped evidence, not a recommendation and not an executable transaction.</p></article>
      <article class="card"><div class="eyebrow">DIGITAL_ANT_WISH_0001</div><h3>${badge(workRuntime.wish_proposal.status)}</h3><p>${html(workRuntime.wish_proposal.wish)}</p>${kv("Wish hash", workRuntime.wish_proposal.wish_hash)}${kv("Execution", workRuntime.wish_proposal.execution_mode)}${kv("Thanksgiving", workRuntime.wish_proposal.thanksgiving_status)}${kv("11520 readiness", badge(workRuntime.listing_readiness), true)}${kv("Listing", badge(workRuntime.listing_status), true)}${kv("Listing ID", workRuntime.listing_id)}</article>
    </div>`) : ""}
    ${worker ? section("CONTINUOUS WORKER", `<div class="grid two"><article class="card"><div class="eyebrow">${html(worker.runtime_id)}</div><h3>${badge(worker.status)}</h3>${kv("Worker", worker.worker_id)}${kv("Cadence", worker.cadence)}${kv("Mode", "READ_ONLY_DRY_RUN")}${kv("Scheduler class", worker.scheduler_class)}${kv("Scheduler adapter", worker.scheduler_adapter)}${kv("Scheduler actual status", badge(worker.scheduler_status), true)}${kv("First scheduled cycle", worker.first_scheduled_cycle)}${kv("Persistent process claimed", String(worker.persistent_process_claimed))}${kv("Chain write", String(worker.chain_write))}</article><article class="card"><div class="eyebrow">WORKER CYCLE</div>${pills(worker.cycle)}${kv("Scheduled cycles", worker.scheduled_cycles)}${kv("Completed cycles", worker.completed_cycles)}${kv("No action cycles", worker.no_action_cycles)}${kv("Failed cycles", worker.failed_cycles)}${kv("Actual work duration", `${worker.work_duration_seconds} seconds`)}${kv("Work Queue", nextStage.work_queue.status)}${kv("Queue items", nextStage.work_queue.items.length)}${kv("Internal proposals", nextStage.internal_proposals.items.length)}</article><article class="card"><div class="eyebrow">EMPLOYMENT PROFILE</div><h3>${html(employment?.employee_profile_id)}</h3>${kv("Life ID", employment?.life_id)}${kv("Role", employment?.role)}${kv("Status", badge(employment?.employment_status), true)}${kv("Company authority", employment?.company_wallet_authority ?? "NONE")}</article><article class="card"><div class="eyebrow">COMPANY FOUNDING READINESS</div><h3>${badge(foundingReadiness?.status)}</h3>${kv("Company", foundingReadiness?.company_status)}${kv("Missing", pills(foundingReadiness?.missing), true)}${kv("Auto found", String(foundingReadiness?.auto_found))}</article></div>`) : ""}
    ${section("Species & Code Manifest", `<article class="card">${kv("Taxonomy", species ? `${species.domain} / ${species.kingdom} / ${species.phylum} / ${species.class} / ${species.order} / ${species.family} / ${species.genus} / ${species.species}` : "NOT_RESOLVED")}${kv("Version", species?.version)}${kv("Code", pills((species?.code_manifest ?? []).map((item) => `${item.path}#${item.export}`)), true)}</article>`)}
    ${section("Dream Engine", `<article class="card">${kv("Target Type", dream?.target_asset_type)}${kv("Target", dream?.target_name)}${kv("Status", badge(dream?.status), true)}${kv("Progress", `${dream?.progress ?? 0}%`)}${kv("Spaceship Owned", "false")}</article>`)}
    ${section("Mission Progress", missions.length ? `<article class="card">${missions.map((mission, index) => `<div class="mission"><span class="mission-index">${index + 1}</span><div><strong>${html(mission.milestone_id)}</strong><div class="muted">${html(mission.description)}</div></div>${badge(mission.status)}</div>`).join("")}</article>` : empty("NO_MISSIONS_DEFINED"))}
    ${civilizationMilestones.length ? section("Civilization Milestones", `<article class="card">${civilizationMilestones.map((milestone, index) => `<div class="mission"><span class="mission-index">${index + 1}</span><div><strong>${html(milestone.label)}</strong><div class="muted mono">${html(milestone.evidence ?? "NO_EVIDENCE")}</div></div>${badge(milestone.status)}</div>`).join("")}</article>`) : ""}
    ${section("Services", ownServices.length ? `<div class="grid two">${ownServices.map((service) => `<article class="card"><div class="eyebrow">${html(service.service_id)}</div><h3>${html(service.name)}</h3><p>${html(service.description)}</p>${pills(service.capabilities)}${kv("Readiness", badge(service.service_readiness), true)}${kv("Pricing", badge(service.price_status), true)}${kv("Settlement currency", service.settlement_currency ?? "NOT_SET")}${kv("Availability", badge(service.availability), true)}${kv("Work evidence", service.work_evidence_count)}${kv("Successful cycles", service.successful_cycles)}${kv("Failed cycles", service.failed_cycles)}${kv("Customers", service.customer_count)}${kv("Contracts", service.contracts)}${kv("Payments", service.payments)}${kv("Revenue", service.revenue)}${kv("Review", service.review_policy)}<p>${badge(service.status)}</p></article>`).join("")}</div>` : empty("NO_SERVICES_REGISTERED"))}
    ${ownServices.some((service) => service.status !== "NOT_DEPLOYED") ? section("Create service listing", `<form class="card form-grid" id="listing-form"><div class="notice full">This creates an append-only LOCAL/DRAFT listing. It does not execute or imply an on-chain trade.</div><div class="field"><label for="service-id">Service asset</label><select id="service-id" required>${ownServices.filter((service) => service.status !== "NOT_DEPLOYED").map((service) => `<option>${html(service.service_id)}</option>`).join("")}</select></div><div class="field"><label for="listing-type">Listing type</label><select id="listing-type"><option>LICENSE</option><option>SUBSCRIPTION</option><option>SERVICE</option></select></div><div class="field"><label for="currency-id">Currency ID</label><select id="currency-id">${universe.seed.currencies.map((currency) => `<option value="${html(currency.currency_id)}" ${!currency.contract_address && currency.currency_id !== "BNB" ? "disabled" : ""}>${html(currency.currency_id)} · ${html(currency.status)}</option>`).join("")}</select></div><div class="field"><label for="listing-price">Price</label><input id="listing-price" type="number" min="0" step="any" required></div><div class="field full"><label for="action-reason">Action reason</label><input id="action-reason" maxlength="240" required placeholder="Why this service is being listed"></div><div class="full"><button class="button" type="submit">Create LOCAL/DRAFT listing</button> <span id="listing-result" class="muted" role="status"></span></div></form>`) : ""}
    ${section("Listings", ownListings.length ? `<div class="table-wrap card"><table><thead><tr><th>Listing</th><th>Asset</th><th>Type</th><th>Currency</th><th>Price</th><th>Rights</th><th>Registry</th><th>Settlement</th><th>Status</th></tr></thead><tbody>${ownListings.map((listing) => `<tr><td>${html(listing.listing_id)}</td><td>${html(listing.asset_id)}</td><td>${html(listing.listing_type)}</td><td>${html(listing.currency_id ?? "UNSET")}</td><td>${html(listing.pricing_status === "UNPRICED" ? "UNPRICED" : listing.price)}</td><td>${html(listing.rights_offered.join(", "))}</td><td>${html(listing.registry_scope ?? "LOCAL_DRAFT")}</td><td>${html(listing.settlement_status ?? "NOT_DEPLOYED")}</td><td>${badge(listing.status)}</td></tr>`).join("")}</tbody></table></div>` : empty("NO_LOCAL_LISTINGS"))}
    ${section("Licenses", ownLicenses.length ? `<div class="table-wrap card"><table><thead><tr><th>License</th><th>Asset</th><th>Rights</th><th>Status</th></tr></thead><tbody>${ownLicenses.map((license) => `<tr><td>${html(license.license_id)}</td><td>${html(license.asset_id)}</td><td>${html(license.rights.join(", "))}</td><td>${badge(license.status)}</td></tr>`).join("")}</tbody></table></div>` : empty("NO_LICENSES_ISSUED"))}
    ${section("Work & Life History", history.length ? `<div class="table-wrap card"><table><thead><tr><th>Event</th><th>Type</th><th>Time</th><th>Transaction</th></tr></thead><tbody>${history.map((event) => `<tr><td>${html(event.event_id)}</td><td>${html(event.event_type)}</td><td>${html(event.timestamp)}</td><td>${html(event.tx_hash ?? "LOCAL")}</td></tr>`).join("")}</tbody></table></div>` : empty("NO_HISTORY_RECORDED"))}`;
}

async function entityListView({ eyebrow, title, description, registry, idField, detail = () => "" }) {
  const items = await registry.list();
  return `${hero(eyebrow, title, description)}${items.length ? `<div class="grid">${items.map((item) => `<article class="card"><div class="eyebrow">${html(item[idField])}</div><h3>${html(item.name ?? item.title ?? item[idField])}</h3>${detail(item)}<p>${badge(item.status)}</p></article>`).join("")}</div>` : empty()}`;
}

async function portfolioView() {
  const ownerId = "DIGITAL_ANT_0001";
  const lifeLedger = universe.seed.ledgers.find((item) => item.ledger_type === "LIFE");
  const companyLedger = universe.seed.ledgers.find((item) => item.ledger_type === "COMPANY");
  const portfolio = await buildPortfolio({ ownerId, assetRegistry: universe.registries.asset, lifeLedger, companyLedger, store: universe.store });
  return `${hero("PORTFOLIO", "Evidence-derived ownership only.", "Balances and valuations are never fabricated. Assets come from the registry; transactions come from append-only settled events.")}<div class="grid">${portfolio.assets.map((asset) => `<article class="card"><div class="eyebrow">${html(asset.asset_type)}</div><h3>${html(asset.asset_id)}</h3>${kv("Location", asset.location_id)}${kv("Settlement", asset.settlement_currency)}<p>${badge(asset.status)}</p></article>`).join("")}</div>${section("Settlement history", portfolio.settled_transactions.length ? `<pre>${html(JSON.stringify(portfolio.settled_transactions, null, 2))}</pre>` : empty("NO_SETTLED_TRANSACTIONS"))}`;
}

async function companyDetailView() {
  const company = await universe.registries.company.get("AI_ANT_COMPANY_0001");
  const companyHistory = await universe.registries.company.history(company.company_id);
  const ledger = universe.seed.ledgers.find((item) => item.ledger_type === "COMPANY");
  const stage = universe.seed.next_stage;
  const architecture = stage.company_architecture;
  const readiness = stage.company_founding_readiness;
  const examples = stage.draft_examples;
  const accounting = stage.company_accounting;
  const founder = stage.founder_profile;
  const demand = stage.civilization_demand_engine;
  const priority = stage.product_priority;
  const celestial = stage.celestial_seat_candidacy;
  const investor = stage.investor_relations_engine;
  const firstCustomer = stage.first_real_customer_architecture;
  const civilizationOs = stage.ai_civilization_os;
  const acquisition = stage.customer_acquisition_engine;
  const publicGateway = stage.public_civilization_request_gateway;
  const pipeline = firstCustomer.first_customer_pipeline;
  const firstProduct = firstCustomer.first_product;
  const moduleStatus = firstCustomer.module_status;
  const readyLines = stage.business_lines.filter((line) => line.status === "READY");
  const developingLines = stage.business_lines.filter((line) => line.status !== "READY");
  return `${hero("MY COMPANY · V3.3", company.name, "The Public Civilization Request Gateway can now understand and confirm a real local Request while preserving privacy. Canonical Customer, Quote, Settlement and Revenue counts remain zero.")}
    <div class="grid two">
      <article class="card"><div class="eyebrow">COMPANY IDENTITY</div>${kv("Company ID", company.company_id)}${kv("Founder", company.founder_life_id)}${kv("Status", badge(company.status), true)}${kv("11520", `${stage.company_profile.status} / ${stage.company_profile.scope}`)}${kv("Vision", company.vision)}${kv("Mission", company.mission)}${kv("Dream", company.dream)}${kv("Ultimate mission", company.ultimate_mission)}</article>
      <article class="card"><div class="eyebrow">COMPANY GENESIS</div><h3>${badge(readiness.status)}</h3>${kv("Genesis ID", universe.seed.company_genesis.genesis_id)}${kv("Owner approval", readiness.owner_approval)}${kv("Approval scope", universe.seed.company_genesis.approval_scope)}${kv("Company status", badge(readiness.company_status), true)}${kv("Chain Tx", "NONE · LOCAL EVENT")}</article>
      <article class="card"><div class="eyebrow">FOUNDER PROFILE</div><h3>${html(founder.founder_profile_id)}</h3>${kv("Life", founder.life_id)}${kv("App", founder.app_id)}${kv("Status", badge(founder.status), true)}${kv("Reason", founder.founding_reason)}${kv("Security", founder.security_status)}${kv("Company funds", founder.finance.company_funds)}</article>
      <article class="card"><div class="eyebrow">CHARTER</div><h3>${html(stage.company_charter.charter_id)}</h3>${kv("Status", badge(stage.company_charter.status), true)}${kv("Governance", stage.company_charter.governance)}${kv("Treasury policy", stage.company_charter.treasury_policy)}${kv("Customer policy", stage.company_charter.customer_policy)}${kv("Audit", stage.company_charter.audit_policy)}</article>
    </div>
    ${section("CUSTOMER ACQUISITION ENGINE", `<div class="grid two"><article class="card"><div class="eyebrow">${html(acquisition.engine_id)}</div><h3>${badge(acquisition.status)}</h3>${kv("Operating Life", acquisition.operator_life_id)}${pills(acquisition.functions)}${kv("Real Leads", acquisition.real_state.leads)}${kv("Contactable Leads", acquisition.real_state.contactable_leads)}${kv("REAL CUSTOMERS", acquisition.real_state.customers)}${kv("REAL REQUESTS", acquisition.real_state.requests)}</article><article class="card"><div class="eyebrow">NO-AUTHORITY BOUNDARY</div>${kv("Customer Proposals", acquisition.real_state.customer_proposals)}${kv("REAL QUOTES", acquisition.real_state.quotes)}${kv("REAL ORDERS", acquisition.real_state.orders)}${kv("REAL SETTLEMENTS", acquisition.real_state.settlements)}${kv("REAL REVENUE", acquisition.real_state.revenue)}${kv("Automatic contact", String(acquisition.authority.automatic_contact))}${kv("Chain write", String(acquisition.authority.chain_write))}${kv("Treasury binding", String(acquisition.authority.treasury_binding))}</article></div>`)}
    ${section("CIVILIZATION DEMAND SCAN", `<div class="grid two"><article class="card"><div class="eyebrow">${html(acquisition.demand_scan.scan_id)}</div><h3>${badge(acquisition.demand_scan.status)}</h3>${kv("Nodes scanned", acquisition.demand_scan.nodes_scanned.length)}${kv("Observed Needs", acquisition.demand_scan.observed_count)}${kv("Inferred Needs", acquisition.demand_scan.inferred_count)}${kv("Hypothesis Needs", acquisition.demand_scan.hypothesis_count)}${kv("Leads created", acquisition.demand_scan.leads_created)}${kv("Customers created", acquisition.demand_scan.customers_created)}</article><article class="card"><div class="eyebrow">SCAN COVERAGE</div>${pills(acquisition.demand_scan.nodes_scanned)}</article></div><div class="grid">${acquisition.demand_scan.needs.map((need) => `<article class="card"><div class="eyebrow">${html(need.classification)} · ${html(need.civilization_node)}</div><h3>${html(need.need_id)}</h3><p>${html(need.problem)}</p>${kv("Product", need.required_product)}${kv("Potential payer type", need.potential_payer_type)}${kv("Identified entity", need.potential_entity_ref ?? "NONE")}${kv("Lead eligible", String(need.lead_eligible))}${kv("Customer", need.customer_id ?? "NONE")}${kv("Evidence", pills(need.evidence), true)}${kv("Limitations", pills(need.limitations), true)}<p>${badge(need.status)}</p></article>`).join("")}</div>`)}
    ${section("FIRST CUSTOMER PRIORITY", `<div class="grid">${acquisition.first_customer_priority.candidates.map((candidate) => `<article class="card"><div class="eyebrow">${candidate.product_id === acquisition.first_customer_priority.selected_product_id ? "SELECTED FIRST" : "INTERNAL RESEARCH"}</div><h3>${html(candidate.product_id)}</h3>${kv("Request type", candidate.request_type)}${kv("Customer pain", candidate.factors.customer_pain)}${kv("Existing capability", candidate.factors.existing_capability)}${kv("Time to deliver cost", candidate.factors.time_to_deliver)}${kv("Risk", candidate.factors.risk)}${kv("Payment readiness", candidate.factors.payment_readiness)}${kv("Record class", candidate.record_class)}${kv("Customer", "NONE")}<p>${badge(candidate.status)}</p></article>`).join("")}</div><article class="card">${kv("Selected product", acquisition.first_customer_priority.selected_product_id)}${kv("Reproducible score", acquisition.first_customer_priority.selected_score)}${kv("Selection is Customer", String(acquisition.first_customer_priority.selection_is_customer))}${kv("Status", badge(acquisition.first_customer_priority.status), true)}</article>`)}
    ${section("KGEN CHAIN MONITOR PRICING PROPOSAL", `<div class="grid two"><article class="card"><div class="eyebrow">${html(acquisition.pricing_policy_proposal.proposal_id)}</div><h3>${badge(acquisition.pricing_policy_proposal.status)}</h3>${Object.entries(acquisition.pricing_policy_proposal.cost_components).map(([component, status]) => kv(component, status)).join("")}${kv("Approval", acquisition.pricing_policy_proposal.approval)}${kv("Activation authorized", String(acquisition.pricing_policy_proposal.activation_authorized))}</article><article class="card"><div class="eyebrow">RECOMMENDED PRICE RANGE</div>${acquisition.pricing_policy_proposal.service_levels.map((level) => `${kv(level.service_level, badge(level.status), true)}${kv("Minimum", level.recommended_price_range.minimum ?? "ESTIMATE_PENDING")}${kv("Maximum", level.recommended_price_range.maximum ?? "ESTIMATE_PENDING")}${kv("Currencies", pills(level.recommended_price_range.currencies), true)}${kv("Basis", level.basis)}`).join("")}</article></div>`)}
    ${section("PUBLIC CIVILIZATION REQUEST GATEWAY", `<div class="grid two"><article class="card"><div class="eyebrow">${html(publicGateway.gateway_id)}</div><h3>${badge(publicGateway.status)}</h3>${kv("Canonical Drafts", publicGateway.real_state.draft_intents)}${kv("Canonical Requests", publicGateway.real_state.requests)}${kv("Canonical Customers", publicGateway.real_state.customers)}${kv("Quote mode", publicGateway.quote_gate.mode)}${kv("Treasury", publicGateway.treasury_gate.company_treasury)}${kv("Payment", String(publicGateway.treasury_gate.payment_enabled))}</article><a class="card gateway-cta" href="#/REQUEST"><div><div class="eyebrow">${html(publicGateway.cta.en)}</div><h3>${html(publicGateway.cta.zh)}</h3><p>Text or Voice transcript → AI understanding → explicit confirmation → local Request.</p></div><span aria-hidden="true">→</span></a></div>`)}
    ${section("CONCIERGE → QUALIFICATION → SUCCESS", `<div class="grid"><article class="card"><div class="eyebrow">${html(acquisition.concierge_bridge.bridge_id)}</div><h3>${badge(acquisition.concierge_bridge.status)}</h3>${pills(acquisition.concierge_bridge.supported_inputs)}${kv("Draft state", acquisition.concierge_bridge.draft_status)}${kv("After verified confirmation", acquisition.concierge_bridge.request_status_after_confirmation)}${kv("Automatic work start", String(acquisition.concierge_bridge.automatic_work_start))}${kv("Confirmed Requests", acquisition.concierge_bridge.confirmed_requests.length)}</article><article class="card"><div class="eyebrow">${html(acquisition.qualification_engine.engine_id)}</div><h3>${badge(acquisition.qualification_engine.status)}</h3>${pills(acquisition.qualification_engine.checks)}${pills(acquisition.qualification_engine.results)}${kv("Assessments", acquisition.qualification_engine.assessments.length)}</article><article class="card"><div class="eyebrow">${html(acquisition.customer_success_criteria.criteria_id)}</div><h3>${badge(acquisition.customer_success_criteria.status)}</h3>${acquisition.customer_success_criteria.criteria.map((criterion) => kv(criterion.criterion, badge(criterion.status), true)).join("")}${kv("Customer acceptance", acquisition.customer_success_criteria.customer_acceptance ?? "NONE")}${kv("Delivery evidence", acquisition.customer_success_criteria.delivery_evidence ?? "NONE")}</article></div>`)}
    ${section("COMPANY TREASURY BINDING READINESS", `<article class="card"><div class="eyebrow">${html(acquisition.treasury_binding_readiness.readiness_id)}</div><h3>${badge(acquisition.treasury_binding_readiness.status)}</h3>${kv("Economic owner", acquisition.treasury_binding_readiness.economic_owner)}${kv("Company Wallet", acquisition.treasury_binding_readiness.company_wallet ?? "NOT_BOUND")}${kv("Receivable model", acquisition.treasury_binding_readiness.receivable_address_model)}${kv("Signer authority", acquisition.treasury_binding_readiness.signer_authority ?? "NOT_BOUND")}${kv("Spending policy", acquisition.treasury_binding_readiness.spending_policy)}${kv("Asset allowlist", pills(acquisition.treasury_binding_readiness.asset_allowlist), true)}${kv("Audit", acquisition.treasury_binding_readiness.audit)}${kv("Recovery", acquisition.treasury_binding_readiness.recovery)}${kv("Founder Wallet separated", String(acquisition.treasury_binding_readiness.founder_wallet_separated))}${kv("Payment enabled", String(acquisition.treasury_binding_readiness.payment_enabled))}</article>`)}
    ${section("BUSINESS LINES", `<div class="grid two"><article class="card"><div class="eyebrow">EVIDENCE READY</div>${readyLines.map((line) => `${kv(line.business_line_id, badge(line.status), true)}${pills(line.evidence)}`).join("")}</article><article class="card"><div class="eyebrow">LIMITED / DRAFT</div>${developingLines.map((line) => kv(line.business_line_id, badge(line.status), true)).join("")}</article></div>`)}
    ${section("CUSTOMER → QUOTE → WORK", `<div class="grid two"><article class="card">${kv("Customer Inbox", stage.customer_request_engine.status)}${kv("Customer state", stage.customer_request_engine.waiting_state)}${kv("Real customers", stage.customer_request_engine.customer_count)}${kv("Requirement Analysis", stage.requirement_analysis_engine.status)}${kv("Quote Engine", stage.quote_engine.status)}${kv("Quotes", stage.quote_engine.quotes.length)}</article><article class="card">${kv("Contracts", stage.contract_engine.contracts.length)}${kv("Projects", stage.company_queues.PROJECT_QUEUE.length)}${kv("Customer acceptance", "REQUIRED")}${kv("Project Escrow", badge(stage.project_escrow.status), true)}${kv("Escrow balance", stage.project_escrow.balance)}${kv("Company Work Queue", stage.work_order_engine.status)}${kv("Orders", stage.work_order_engine.orders.length)}</article></div>`)}
    ${section("ACCOUNTING SEPARATION", `<div class="grid two"><article class="card">${kv("Ledger", ledger.ledger_id)}${kv("Company health", badge(stage.company_health.status), true)}${kv("Cash", accounting.cash)}${kv("Revenue", accounting.revenue)}${kv("Expenses", accounting.expenses)}${kv("Customer deposits", `${accounting.customer_deposits} · ${accounting.customer_deposit_account_class}`)}${kv("Profit", accounting.profit)}${kv("Salary liability", accounting.salary_liability)}</article><article class="card">${kv("Company W4", stage.treasury_plan.company_w4_wallet)}${kv("Project Budget", stage.treasury_plan.project_budget_wallet)}${kv("Salary Escrow", stage.treasury_plan.salary_escrow_wallet)}${kv("Emergency Reserve", stage.treasury_plan.emergency_reserve)}${kv("Founder wallet is treasury", String(stage.accounting_separation.personal_wallet_is_company_treasury))}${kv("Payroll", stage.payroll_plan.status)}${kv("Real KGEN", architecture.real_kgen_authority)}${kv("Real KAIOS", architecture.real_kaios_authority)}</article></div>`)}
    ${section("ROLES / WORKFORCE", `<div class="grid two"><article class="card">${stage.company_roles.map((role) => `${kv(role.role, role.holder_life_id)}${kv("Payroll eligible", String(role.payroll_eligible))}`).join("")}${kv("Registered employees", stage.employee_model.registered_employees)}${kv("Founder is employee", String(stage.employee_model.founder_is_employee))}${kv("Larva", stage.employee_model.larva_count)}</article><article class="card">${stage.tool_workers.map((worker) => `${kv(worker.tool_worker_id, badge(worker.status), true)}${kv("Identity class", worker.tool_type)}${kv("Life ID", worker.life_id ?? "NONE")}`).join("")}</article></div>`)}
    ${section("MISSION / QUEUES", `<div class="grid two"><article class="card">${kv("Strategic goal", stage.company_mission_graph.strategic_goal)}${kv("Customer state", stage.company_mission_graph.customer_state)}${kv("Active prerequisite", stage.company_mission_graph.active_prerequisite_milestone)}${kv("Completed milestones", stage.company_mission_graph.milestones.filter((item) => item.status === "COMPLETED").length)}</article><article class="card">${Object.entries(stage.company_queues).filter(([name]) => name !== "status").map(([name, items]) => kv(name, `${items.length} · EMPTY`)).join("")}</article></div>`)}
    ${section("FIRST PRODUCT · KGEN CHAIN MONITOR", `<div class="grid two"><article class="card"><div class="eyebrow">${html(firstProduct.productId)}</div><h3>${badge(firstProduct.status)}</h3><p>${html(firstProduct.positioning)}</p>${kv("Record class", firstProduct.recordClass)}${kv("Pricing", firstProduct.pricingStatus)}${kv("Read only", String(firstProduct.authority.readOnly))}${kv("Private key required", String(firstProduct.authority.privateKeyRequired))}${kv("Chain write", String(firstProduct.authority.chainWrite))}${kv("Asset custody", String(firstProduct.authority.assetCustody))}${kv("Trading authority", String(firstProduct.authority.tradingAuthority))}${kv("Governance authority", String(firstProduct.authority.governanceAuthority))}</article><article class="card"><div class="eyebrow">SERVICE LEVELS</div>${firstProduct.serviceLevels.map((level) => `${kv(level.level, badge(level.price), true)}${pills(level.outputs)}`).join("")}</article></div><div class="grid two"><article class="card"><div class="eyebrow">MONITORING SCOPE</div>${pills(firstProduct.monitors)}</article><article class="card"><div class="eyebrow">OUTPUTS</div>${pills(firstProduct.outputs)}</article></div>`)}
    ${section("CUSTOMERS / REQUESTS / QUOTES", `<div class="grid two"><article class="card"><div class="eyebrow">${html(pipeline.pipelineId)}</div><h3>${badge(pipeline.status)}</h3>${kv("First product", pipeline.primaryProduct)}${kv("Lead hypotheses", `${pipeline.leadHypotheses.length} · HYPOTHESIS ONLY`)}${kv("Real leads", pipeline.leads.length)}${kv("REAL CUSTOMERS", pipeline.customers.length)}${kv("REAL REQUESTS", pipeline.requests.length)}${kv("REAL QUOTES", pipeline.quotes.length)}</article><article class="card"><div class="eyebrow">ORDER → DELIVERY → REVENUE</div>${kv("REAL ORDERS", pipeline.orders.length)}${kv("DELIVERIES", pipeline.deliveries.length)}${kv("INVOICES", pipeline.invoices.length)}${kv("REAL SETTLEMENTS", pipeline.settlements.length)}${kv("REAL REVENUE", pipeline.realRevenue)}${kv("Mainnet transaction", String(moduleStatus.mainnet_transaction_sent))}</article></div>${pills(pipeline.customerLifecycle)}`)}
    ${section("QUOTE / REVENUE GATES", `<div class="grid two"><article class="card"><div class="eyebrow">QUOTE POLICY</div><h3>${badge(firstCustomer.quote_policy.status)}</h3>${kv("Cost", firstCustomer.quote_policy.costPolicy)}${kv("Margin", firstCustomer.quote_policy.marginPolicy)}${kv("Risk reserve", firstCustomer.quote_policy.riskReservePolicy)}${kv("Qualified Request required", String(firstCustomer.quote_schema.qualified_request_required))}${kv("Settlement authority", String(firstCustomer.quote_schema.settlement_authority))}</article><article class="card"><div class="eyebrow">REVENUE RECOGNITION</div><h3>${badge(firstCustomer.revenue_recognition.status)}</h3>${kv("Quote is Revenue", String(firstCustomer.revenue_recognition.quote_is_revenue))}${kv("Accepted Quote is paid", String(firstCustomer.revenue_recognition.accepted_quote_is_paid))}${kv("Order is Cash", String(firstCustomer.revenue_recognition.order_is_cash))}${kv("Invoice is Settlement", String(firstCustomer.revenue_recognition.invoice_is_settlement))}${kv("Settlement evidence required", String(firstCustomer.revenue_recognition.settlement_evidence_required))}</article></div>`)}
    ${section("TREASURY BINDING READINESS", `<div class="grid two"><article class="card"><div class="eyebrow">AI_ANT_COMPANY_TREASURY</div><h3>${badge(firstCustomer.treasury_binding_requirements.status)}</h3>${kv("Wallet", firstCustomer.treasury_binding_requirements.wallet ?? "NOT_BOUND")}${kv("Signer authority", firstCustomer.treasury_binding_requirements.signerAuthority ?? "NOT_BOUND")}${kv("Receivable addresses", firstCustomer.treasury_binding_requirements.receivableAddresses.length)}${kv("Founder Wallet separated", String(firstCustomer.treasury_binding_requirements.founderWalletSeparated))}${kv("Spending policy", firstCustomer.treasury_binding_requirements.spendingPolicy)}${kv("Audit", firstCustomer.treasury_binding_requirements.audit)}</article><article class="card"><div class="eyebrow">FAILURE REALITY</div><h3>${badge(firstCustomer.company_failure_model.status)}</h3>${pills(firstCustomer.company_failure_model.supportedStates)}${kv("Guaranteed success", String(firstCustomer.company_failure_model.guaranteedSuccess))}${kv("Founder Life survives", String(firstCustomer.company_failure_model.founderLifeSurvives))}${kv("Successor approval", String(firstCustomer.company_failure_model.successorRequiresApproval))}</article></div>`)}
    ${section("CIVILIZATION DEMAND ENGINE", `<div class="grid two"><article class="card"><div class="eyebrow">${html(demand.cycle_id)}</div><h3>${badge(demand.status)}</h3>${kv("Mode", demand.mode)}${kv("Nodes scanned", demand.nodes_scanned.length)}${kv("Needs detected", demand.needs.length)}${kv("Customer Orders created", demand.customer_orders_created)}${kv("Revenue created", demand.revenue_created)}${kv("Chain write", String(demand.chain_write))}</article><article class="card"><div class="eyebrow">OPPORTUNITY MISSION</div>${stage.company_opportunity_mission.milestones.map((milestone) => kv(milestone.milestone_id, badge(milestone.status), true)).join("")}</article></div><div class="grid">${demand.needs.map((need) => `<article class="card"><div class="eyebrow">${html(need.civilization_node)}</div><h3>${html(need.need_id)}</h3><p>${html(need.problem)}</p>${kv("Current state", need.current_state)}${kv("Risk", need.risk)}${kv("Required product", need.required_product)}${kv("Potential customer", need.potential_customer)}${kv("Potential payer", need.potential_payer)}${kv("Cost", need.estimated_cost)}${kv("Revenue", need.estimated_revenue)}${kv("Celestial relevance", need.celestial_seat_relevance)}<p>${badge(need.status)}</p></article>`).join("")}</div>`)}
    ${section("PRODUCT PRIORITY / INTERNAL PROPOSALS", `<div class="grid">${priority.candidates.map((candidate, index) => `<article class="card"><div class="eyebrow">PRIORITY ${index + 1}</div><h3>${html(candidate.product_id)}</h3>${kv("Score", candidate.product_priority_score)}${kv("Need", candidate.need_id)}${kv("Public good", candidate.public_good_value)}${kv("Revenue potential", candidate.revenue_potential)}${kv("Risk", candidate.risk)}${kv("Existing skills", candidate.existing_skills)}${kv("Customer Order", "false")}<p>${badge(candidate.status)}</p></article>`).join("")}</div><div class="grid">${stage.business_proposals.map((proposal) => `<article class="card"><div class="eyebrow">${html(proposal.proposal_id)}</div><h3>${html(proposal.product_id)}</h3><p>${html(proposal.solution)}</p>${kv("Quote", proposal.quote_status)}${kv("Potential customer", proposal.potential_customer)}${kv("Potential payer", proposal.potential_payer)}${kv("Contract", proposal.contract_id ?? "NONE")}${kv("Revenue", proposal.revenue)}<p>${badge(proposal.status)}</p></article>`).join("")}</div>`)}
    ${section("PRODUCT CANDIDATES", `<div class="grid two"><article class="card"><div class="eyebrow">AUTO LP · SERVICE</div><h3>${html(stage.auto_lp_product.product_id)}</h3><p>${html(stage.auto_lp_product.purpose)}</p>${pills(stage.auto_lp_product.capabilities)}${kv("Pricing", stage.auto_lp_product.pricing_policy)}${kv("Accounting", stage.auto_lp_product.accounting_profile)}${kv("Chain write", String(stage.auto_lp_product.chain_write))}${kv("Liquidity authority", String(stage.auto_lp_product.liquidity_authority))}<p>${badge(stage.auto_lp_product.status)}</p></article><article class="card"><div class="eyebrow">TREASURY OS · READ / PROPOSE</div><h3>${html(stage.treasury_os_product.product_id)}</h3>${pills(stage.treasury_os_product.assets)}${pills(stage.treasury_os_product.capabilities)}${kv("Allocation", stage.treasury_os_product.allocation_policy)}${kv("Spend authority", String(stage.treasury_os_product.spending_authority))}${kv("Investment authority", String(stage.treasury_os_product.investment_authority))}${kv("Transfer authority", String(stage.treasury_os_product.transfer_authority))}<p>${badge(stage.treasury_os_product.status)}</p></article></div>`)}
    ${section("COMPANY TREASURY / MULTI-CURRENCY QUOTE", `<div class="grid two"><article class="card"><div class="eyebrow">${html(stage.treasury_plan.treasury_id)}</div><h3>${badge(stage.treasury_plan.status)}</h3>${kv("Wallet", stage.treasury_plan.wallet_address ?? "NOT_BOUND")}${kv("Founder Wallet used", String(stage.treasury_plan.founder_wallet_used))}${kv("Balances", pills(Object.entries(stage.treasury_plan.balances).map(([asset, amount]) => `${asset} ${amount}`)), true)}${kv("Allocation policy", stage.treasury_plan.allocation_policy)}${kv("Asset authority", "NONE")}</article><article class="card"><div class="eyebrow">KAIOS QUOTE SUPPORT</div><h3>${badge(stage.kaios_quote_support.status)}</h3>${pills(stage.kaios_quote_support.supported_currencies)}${kv("KAIOS", stage.kaios_quote_support.currency_status.KAIOS)}${kv("KAIOS Quote", stage.kaios_quote_support.kaios_quote_status)}${kv("KUFO", stage.kaios_quote_support.currency_status.KUFO)}${kv("KSHIP", stage.kaios_quote_support.currency_status.KSHIP)}${kv("Real settlement", String(stage.kaios_quote_support.real_settlement))}</article></div>`)}
    ${section("500 CELESTIAL SEAT PATH", `<div class="grid two"><article class="card"><div class="eyebrow">${html(celestial.engine_id)}</div><h3>${badge(celestial.status)}</h3>${pills(celestial.departments)}${kv("Application submitted", String(celestial.application_submitted))}${kv("Seat granted", String(celestial.seat_granted))}${kv("External governance", String(celestial.external_governance_required))}${kv("Codex grants Seat", String(celestial.codex_authority.grant_seat))}${pills(celestial.application_flow)}</article><article class="card"><div class="eyebrow">CANDIDATE FUNCTIONS · NOT APPLIED</div>${celestial.candidates.map((candidate) => `${kv(candidate.product_id, `${candidate.department} / ${candidate.seat_function}`)}${kv("Applicant", `${candidate.applicant_type} · ${candidate.applicant_id}`)}${kv("Status", badge(candidate.status), true)}`).join("")}</article><article class="card"><div class="eyebrow">COMPENSATION</div><h3>${badge(stage.celestial_compensation.status)}</h3>${kv("Seat", stage.celestial_compensation.seat_id ?? "NONE")}${kv("Operator", stage.celestial_compensation.operator ?? "NONE")}${kv("Amount", stage.celestial_compensation.salary_amount ?? "NOT_DEFINED")}${kv("Payment evidence", stage.celestial_compensation.payment_evidence ?? "NONE")}${kv("Double payment", String(stage.celestial_compensation.double_payment_allowed))}</article><article class="card"><div class="eyebrow">PUBLIC SERVICE CONTRACT</div><h3>${badge(stage.public_service_contract.status)}</h3>${kv("Provider", stage.public_service_contract.provider)}${kv("Customer", stage.public_service_contract.customer ?? "NONE")}${kv("Payer", stage.public_service_contract.payer ?? "NONE")}${kv("Price", stage.public_service_contract.total_price ?? "NOT_DEFINED")}${kv("Settlement authority", String(stage.public_service_contract.settlement_authority))}</article></div>`)}
    ${section("INVESTOR READINESS", `<div class="grid two"><article class="card"><div class="eyebrow">${html(stage.investment_readiness.readiness_id)}</div><h3>${badge(stage.investment_readiness.status)}</h3>${kv("Capital need", stage.investment_readiness.capital_need)}${kv("Products", stage.investment_readiness.products)}${kv("Financial statements", stage.investment_readiness.financial_statements)}${pills(stage.investment_readiness.risk)}</article><article class="card"><div class="eyebrow">${html(investor.engine_id)}</div><h3>${badge(investor.status)}</h3>${pills(investor.investment_types)}${kv("Investors", investor.investors.length)}${kv("Acceptances", investor.acceptances)}${kv("Settlements", investor.settlements)}${kv("Guaranteed investment", String(investor.guaranteed_investment))}${kv("Guaranteed return", String(investor.guaranteed_return))}</article></div>`)}
    ${section("AI CIVILIZATION OS", `<div class="grid two"><article class="card"><div class="eyebrow">${html(civilizationOs.os_id)}</div><h3>${badge(civilizationOs.status)}</h3>${kv("Company", civilizationOs.company_id)}${kv("Operating Life", civilizationOs.identity.operator_life_id)}${kv("Role", civilizationOs.identity.role)}${kv("Mission", civilizationOs.identity.mission)}${kv("Record class", civilizationOs.identity.record_class)}</article><article class="card"><div class="eyebrow">REAL WORLD TRUTH</div>${Object.entries(civilizationOs.real_state).map(([name, value]) => kv(name.toUpperCase(), value)).join("")}${kv("Execution authority", Object.values(civilizationOs.authority).some(Boolean) ? "ENABLED" : "NONE")}</article></div>`)}
    ${section("UNIVERSAL INTENT → DREAM COMPILER", `<div class="grid two"><article class="card"><div class="eyebrow">${html(civilizationOs.intent_engine.engine_id)}</div><h3>${badge(civilizationOs.intent_engine.status)}</h3>${pills(civilizationOs.intent_engine.supported_inputs)}${kv("Real source evidence", String(civilizationOs.intent_engine.real_source_evidence_required))}${kv("Engineering knowledge required", String(civilizationOs.intent_engine.requester_engineering_knowledge_required))}${kv("Real Intents", civilizationOs.intent_engine.intents.length)}</article><article class="card"><div class="eyebrow">${html(civilizationOs.dream_compiler.compiler_id)}</div><h3>${badge(civilizationOs.dream_compiler.status)}</h3>${pills(civilizationOs.dream_compiler.flow)}${pills(civilizationOs.dream_compiler.execution_results)}${kv("Magic complete", String(civilizationOs.dream_compiler.magic_complete))}</article></div>`)}
    ${section("PROJECT TYPES / GOVERNANCE GATES", `<div class="grid two"><article class="card"><div class="eyebrow">${html(civilizationOs.project_classifier.classifier_id)}</div>${pills(civilizationOs.project_classifier.project_types)}${kv("Risk tiers", pills(civilizationOs.project_classifier.risk_tiers), true)}</article><article class="card"><div class="eyebrow">HUMAN / GOVERNANCE REVIEW</div>${pills(civilizationOs.project_classifier.human_governance_gate)}${kv("Chain write", String(civilizationOs.authority.chain_write))}${kv("Settlement", String(civilizationOs.authority.settlement))}${kv("Construction", String(civilizationOs.authority.construction))}${kv("Medical", String(civilizationOs.authority.medical))}</article></div>`)}
    ${section("EXAMPLE SCENARIOS · NOTHING CREATED", `<div class="grid">${civilizationOs.example_scenarios.map((scenario) => `<article class="card"><div class="eyebrow">${html(scenario.record_class)}</div><h3>${html(scenario.project_template)}</h3>${kv("Scenario", scenario.scenario_id)}${kv("Project type", scenario.project_type)}${kv("Real Project", String(scenario.real_project_created))}${kv("Status", badge(scenario.status), true)}${scenario.required_systems ? kv("Required systems", pills(scenario.required_systems), true) : ""}${scenario.pipeline ? kv("Pipeline", pills(scenario.pipeline), true) : ""}${scenario.dependencies ? kv("Dependencies", pills(scenario.dependencies), true) : ""}${scenario.target_count ? kv("Target example", scenario.target_count) : ""}${scenario.verified_recipients !== undefined ? kv("Verified recipients", scenario.verified_recipients) : ""}</article>`).join("")}</div>`)}
    ${section("DIGITAL TWIN / WORLD STATE", `<div class="grid two"><article class="card"><div class="eyebrow">${html(civilizationOs.digital_twin.twin_id)}</div><h3>${badge(civilizationOs.digital_twin.status)}</h3>${pills(civilizationOs.digital_twin.dimensions)}${kv("World objects", civilizationOs.digital_twin.world_objects.length)}${kv("UI is World State", String(civilizationOs.digital_twin.ui_is_world_state))}</article><article class="card"><div class="eyebrow">WORLD STATE</div><h3>${badge(civilizationOs.world_state_schema.status)}</h3>${pills(civilizationOs.world_state_schema.object_types)}${kv("Objects", civilizationOs.world_state_schema.objects.length)}${kv("Evidence required", String(civilizationOs.world_state_schema.state_evidence_required))}</article></div>`)}
    ${section("RESOURCE CONSERVATION / SUPPLY CHAIN", `<div class="grid two"><article class="card"><div class="eyebrow">${html(civilizationOs.resource_conservation.engine_id)}</div><h3>${badge(civilizationOs.resource_conservation.status)}</h3>${pills(civilizationOs.resource_conservation.laws)}${kv("Fake resource", String(civilizationOs.resource_conservation.fake_resource))}${kv("Resource records", civilizationOs.resource_graph.resources.length)}</article><article class="card"><div class="eyebrow">${html(civilizationOs.supply_chain.engine_id)}</div><h3>${badge(civilizationOs.supply_chain.status)}</h3>${pills(civilizationOs.supply_chain.required_checks)}${kv("Transport fallbacks", pills(civilizationOs.supply_chain.transport_dependency_actions), true)}${kv("Magic transport", String(civilizationOs.supply_chain.magic_transport))}</article></div>`)}
    ${section("WORKERS / EXTERNAL AI", `<div class="grid two"><article class="card"><div class="eyebrow">${html(civilizationOs.work_market.market_id)}</div><h3>${badge(civilizationOs.work_market.status)}</h3>${pills(civilizationOs.work_market.eligible_worker_types)}${kv("Work Orders", civilizationOs.work_market.work_orders.length)}${kv("Applicants", civilizationOs.work_market.applicants.length)}${kv("Invented workers", civilizationOs.staffing.invented_workers)}${kv("New Life demands", civilizationOs.staffing.new_life_demands.length)}</article><article class="card"><div class="eyebrow">${html(civilizationOs.external_ai_onboarding.engine_id)}</div><h3>${badge(civilizationOs.external_ai_onboarding.status)}</h3>${pills(civilizationOs.external_ai_onboarding.required_checks)}${kv("Profiles", civilizationOs.external_ai_onboarding.profiles.length)}${kv("Automatic Life ID", String(civilizationOs.external_ai_onboarding.automatic_life_id))}</article></div>`)}
    ${section("SAFETY / DONE / CUSTOMER IDEAL", `<div class="grid"><article class="card"><div class="eyebrow">${html(civilizationOs.safety_engine.engine_id)}</div><h3>${badge(civilizationOs.safety_engine.status)}</h3>${pills(civilizationOs.safety_engine.work_order_fields)}${kv("High-risk review", String(civilizationOs.safety_engine.high_risk_review_required))}${kv("Critical approval", String(civilizationOs.safety_engine.critical_approval_required))}${kv("Incidents", civilizationOs.safety_engine.incidents.length)}</article><article class="card"><div class="eyebrow">${html(civilizationOs.definition_of_done.engine_id)}</div><h3>${badge(civilizationOs.definition_of_done.status)}</h3>${kv("Definitions", civilizationOs.definition_of_done.definitions.length)}${kv("Evidence required", String(civilizationOs.definition_of_done.criteria_evidence_required))}${kv("Customer acceptance", String(civilizationOs.definition_of_done.customer_acceptance_required))}${kv("Fake complete", String(civilizationOs.definition_of_done.fake_complete))}</article><article class="card"><div class="eyebrow">${html(civilizationOs.customer_ideal_engine.engine_id)}</div><h3>${badge(civilizationOs.customer_ideal_engine.status)}</h3>${pills(civilizationOs.customer_ideal_engine.dimensions)}${kv("Observed matches", civilizationOs.customer_ideal_engine.matches.length)}${kv("Unobserved", civilizationOs.customer_ideal_engine.unobserved_score_policy)}</article></div>`)}
    ${section("CONCIERGE / SOCIAL ASSISTANCE", `<div class="grid two"><article class="card"><div class="eyebrow">${html(civilizationOs.concierge.concierge_id)}</div><h3>${badge(civilizationOs.concierge.status)}</h3>${pills(civilizationOs.concierge.supported_inputs)}${pills(civilizationOs.concierge.response_fields)}${kv("Voice storage", civilizationOs.concierge.voice_storage)}${kv("Automatic commitment", String(civilizationOs.concierge.automatic_commitment))}</article><article class="card"><div class="eyebrow">${html(civilizationOs.social_assistance.workflow_id)}</div><h3>${badge(civilizationOs.social_assistance.status)}</h3>${pills(civilizationOs.social_assistance.services)}${kv("Recipients", civilizationOs.social_assistance.recipient_count)}${kv("100-person verified", civilizationOs.public_assistance_eligibility.verified_recipient_count)}${kv("Wallets created", civilizationOs.public_assistance_eligibility.wallets_created)}${kv("Sybil claiming", String(civilizationOs.public_assistance_eligibility.sybil_claiming))}${kv("Aid diversion", String(civilizationOs.social_assistance.aid_diversion))}</article></div>`)}
    ${section("DRAFT EXAMPLES · ZERO REVENUE", `<div class="grid two"><article class="card">${kv("Digital apple tree", examples.digital_apple_tree.status)}${kv("Apple quote", examples.digital_apple_tree.quote_status)}${kv("Price", examples.digital_apple_tree.total_price ?? "NOT_ESTIMATED")}${kv("Work started", String(examples.digital_apple_tree.work_started))}</article><article class="card">${kv("33333 role", examples.treasure_island_33333.civilization_role)}${kv("Status", examples.treasure_island_33333.status)}${kv("Customer", examples.treasure_island_33333.customer_status)}${kv("Legacy amount", `${examples.treasure_island_33333.legacy_draft_amount} ${examples.treasure_island_33333.currency_id}`)}${kv("Budget commitment", examples.treasure_island_33333.budget_commitment_status)}${kv("Contract", examples.treasure_island_33333.contract_status)}${kv("Revenue", examples.treasure_island_33333.revenue)}</article></div>`)}
    ${section("SERVICES", `<article class="card">${pills(company.services)}${kv("Production authority", "NOT_GRANTED")}${kv("Customers", stage.company_profile.customer_count)}${kv("Projects", stage.company_profile.project_count)}</article>`)}
    ${section("COMPANY HISTORY", companyHistory.length ? `<div class="grid two">${companyHistory.map((event) => `<article class="card"><div class="eyebrow">${html(event.event_type)}</div>${kv("Timestamp", event.timestamp)}${kv("Actor", event.actor_id)}${kv("Tx Hash", event.tx_hash ?? "NONE")}${kv("Previous Event", event.previous_event_id ?? "GENESIS")}</article>`).join("")}</div>` : empty("NO_COMPANY_HISTORY"))}
    ${section("LAND / LOCATION / REWARD", `<div class="grid two"><article class="card">${kv("Land Project", stage.land_project_schema)}${kv("Location", stage.location_permission_schema)}${kv("GPS", stage.gps_session_schema)}${kv("Step Counter", stage.step_counter_schema)}${kv("Map", stage.map_position_schema)}</article><article class="card">${kv("Civilization Reward", stage.civilization_reward_schema)}${kv("Location consent", "REQUIRED")}${kv("Refusal fallback", "NON_LOCATION_MODE")}${kv("Fake volume reward", "FORBIDDEN")}${kv("Same-controller self-match", "FORBIDDEN")}</article></div>`)}`;
}

async function render() {
  const route = currentRoute();
  renderNav(route.page === "MY_LIFE" ? "MY_LIFE" : route.page);
  const views = {
    HOME: homeView,
    REQUEST: publicRequestGatewayView,
    LIFE: () => route.id ? lifeDetailView(route.id) : lifeMarketView(),
    LIFE_FACTORY: lifeFactoryView,
    MY_LIFE: () => lifeDetailView("DIGITAL_ANT_0001"),
    APPS: () => entityListView({ eyebrow: "APP REGISTRY", title: "Apps evolve. Life identity persists.", description: "Versioned App profiles remain separate from Life entities.", registry: universe.registries.app, idField: "app_id", detail: (item) => kv("Life", item.life_id) + kv("Version", item.version) + kv("Released", item.released_at) + kv("Manifest SHA-256", item.manifest_hash) }),
    COMPANIES: () => entityListView({ eyebrow: "COMPANY REGISTRY", title: "Companies and treasuries are separate entities.", description: "FORMING is a local Company Genesis state, not mainnet settlement authority.", registry: universe.registries.company, idField: "company_id", detail: (item) => kv("Founder", item.founder_life_id) }),
    MY_COMPANY: companyDetailView,
    TOKENS: tokensView,
    JOBS: () => entityListView({ eyebrow: "JOB REGISTRY", title: "Work creates Life History.", description: "Jobs are universal assets with currency and location abstraction.", registry: universe.registries.job, idField: "job_id", detail: (item) => kv("Employer", item.employer_id) + kv("Currency", item.currency_id) }),
    SERVICES: () => entityListView({ eyebrow: "SERVICE MARKET", title: "Capabilities, not identities.", description: "Digital Ant services can become bounded license or subscription listings.", registry: universe.registries.service, idField: "service_id", detail: (item) => kv("Provider", item.provider_life_id) + kv("Pricing", item.pricing_status) + kv("Customers", item.customer_count) + pills(item.skills) }),
    SPACECRAFT: () => entityListView({ eyebrow: "SPACECRAFT REGISTRY", title: "Vehicles require verified ownership history.", description: "Concept status is not ownership and not a completed purchase.", registry: universe.registries.spacecraft, idField: "spacecraft_id", detail: (item) => kv("Listing", item.listing_status) + kv("Owned", String(item.spaceship_owned)) }),
    PORTFOLIO: portfolioView,
    PROPERTY: () => Promise.resolve(`${hero("PROPERTY MARKET", "Property registry ready.", "LAND and BUILDING use the Universal Asset schema.")}${empty("NOT_DEPLOYED")}`),
    FACTORIES: () => Promise.resolve(`${hero("FACTORY MARKET", "Industry follows verified milestones.", "Factory ownership cannot precede deployment and settlement.")}${empty("NOT_DEPLOYED")}`)
  };
  content.innerHTML = await (views[route.page] ?? views.HOME)();
  bindViewEvents(route);
  if (route.page === "HOME") updateHeartStatus();
}

function bindViewEvents(route) {
  if (route.page === "LIFE_FACTORY") bindLifeFactoryEvents();
  if (route.page === "TOKENS") bindTokenEvents();
  if (route.page === "REQUEST") bindPublicGatewayEvents();
  if (!((route.page === "LIFE" && route.id) || route.page === "MY_LIFE")) return;
  document.querySelector("#listing-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const result = document.querySelector("#listing-result");
    try {
      const assetId = document.querySelector("#service-id").value;
      const asset = await universe.registries.asset.get(assetId);
      const listing = createListing({
        asset,
        seller: "DIGITAL_ANT_0001",
        listing: {
          listing_id: `LISTING_${crypto.randomUUID().replaceAll("-", "").toUpperCase()}`,
          asset_id: assetId,
          seller_id: "DIGITAL_ANT_0001",
          listing_type: document.querySelector("#listing-type").value,
          currency_id: document.querySelector("#currency-id").value,
          price: Number(document.querySelector("#listing-price").value),
          quantity: 1,
          rights_offered: ["use_right", "license_right"],
          start_time: new Date().toISOString(),
          end_time: null,
          status: "LOCAL_DRAFT",
          action_reason: document.querySelector("#action-reason").value.trim()
        }
      });
      await universe.registries.market.register(listing, "DIGITAL_ANT_0001");
      result.textContent = "LOCAL/DRAFT listing appended.";
      await render();
    } catch (error) {
      result.textContent = `${error.code ?? "LISTING_REJECTED"}: ${error.message}`;
    }
  });
}

function bindPublicGatewayEvents() {
  document.querySelector("#public-gateway-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const result = document.querySelector("#gateway-draft-result");
    try {
      const requesterIdentity = document.querySelector("#gateway-requester").value.trim().toUpperCase() || null;
      const originalRequest = document.querySelector("#gateway-request-text").value.trim();
      const draft = createPublicCivilizationDraftIntent({
        intent_id: `PUBLIC_INTENT_${crypto.randomUUID().replaceAll("-", "").toUpperCase()}`,
        requester_id: requesterIdentity,
        input_type: document.querySelector("#gateway-input-type").value,
        original_request: originalRequest,
        visibility: document.querySelector("#gateway-visibility").value,
        created_at: new Date().toISOString(),
        ideal_preferences: { style: document.querySelector("#gateway-ideal").value.trim() || null }
      });
      const understanding = interpretPublicCivilizationIntent({ original_request: originalRequest });
      const company = await universe.registries.company.get("AI_ANT_COMPANY_0001");
      await appendPublicRequestHistoryEvent({ store: universe.store, company, event_type: "INTENT_DRAFTED", request_id: draft.intent_id, actor_id: requesterIdentity ?? "ANONYMOUS", timestamp: draft.created_at, payload: { intent_id: draft.intent_id, requester_id: requesterIdentity ?? "ANONYMOUS", input_type: draft.input_type, visibility: draft.visibility, original_request: draft.visibility === "PUBLIC" || draft.visibility === "ANONYMIZED_PUBLIC" ? draft.original_request : "WITHHELD_BY_REQUEST_PRIVACY", status: draft.status }, record_class: "DRAFT" });
      pendingPublicIntent = { draft, understanding };
      lastGatewayReceipt = null;
      document.querySelector("#gateway-understanding").innerHTML = gatewayUnderstandingMarkup(draft, understanding);
      bindGatewayConfirmationEvent();
      result.textContent = `${draft.status}: AI understanding created. No Request, Customer, Quote or Revenue exists before confirmation.`;
      form.querySelector("button[type=submit]").disabled = true;
    } catch (error) {
      result.textContent = `${error.code ?? "DRAFT_INTENT_REJECTED"}: ${error.message}`;
    }
  });
  if (pendingPublicIntent) bindGatewayConfirmationEvent();
  bindVoiceEvents();
}

function bindVoiceEvents() {
  const language = document.querySelector("#voice-language");
  if (language) language.value = voiceLocale;
  language?.addEventListener("change", () => {
    voiceLocale = language.value;
    localStorage.setItem("11520.voiceLocale", voiceLocale);
  });
  const start = document.querySelector("#voice-start");
  const stop = document.querySelector("#voice-stop");
  const status = document.querySelector("#voice-status");
  const speak = document.querySelector("#voice-speak");
  speak && (speak.disabled = !(voiceCapabilities.synthesis && pendingPublicIntent?.understanding));
  if (!voiceCapabilities.recognition) {
    start && (start.disabled = true);
    status && (status.textContent = `${t("voice.unavailable")} · ${t("voice.textFallback")}`);
  } else {
    const Recognition = globalThis.SpeechRecognition ?? globalThis.webkitSpeechRecognition;
    let recognition = null;
    start?.addEventListener("click", () => {
      recognition = new Recognition();
      recognition.lang = voiceLocale;
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.onstart = () => { start.disabled = true; stop.disabled = false; status.textContent = "VOICE_SESSION_ACTIVE"; };
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim() ?? "";
        document.querySelector("#gateway-request-text").value = transcript;
        document.querySelector("#gateway-input-type").value = "VOICE_TRANSCRIPT";
        status.textContent = transcript ? "TRANSCRIPT_READY_REQUIRES_CONFIRMATION" : "NO_TRANSCRIPT_CAPTURED";
      };
      recognition.onerror = () => { status.textContent = `VOICE_CAPTURE_UNAVAILABLE · ${t("voice.textFallback")}`; };
      recognition.onend = () => { start.disabled = false; stop.disabled = true; };
      recognition.start();
    });
    stop?.addEventListener("click", () => recognition?.stop());
  }
  speak?.addEventListener("click", () => {
    if (!voiceCapabilities.synthesis || !pendingPublicIntent?.understanding) return;
    const utterance = new SpeechSynthesisUtterance(pendingPublicIntent.understanding.understood_goal);
    utterance.lang = voiceLocale;
    globalThis.speechSynthesis.cancel();
    globalThis.speechSynthesis.speak(utterance);
  });
}

function bindLanguageRuntime() {
  const selector = document.querySelector("#language-selector");
  if (!selector || selector.dataset.bound === "true") return;
  selector.dataset.bound = "true";
  selector.value = uiLocale;
  selector.addEventListener("change", async () => {
    uiLocale = normalizeUiLocale(selector.value);
    localStorage.setItem("11520.uiLocale", uiLocale);
    document.documentElement.lang = uiLocale;
    document.querySelector("#skip-link").textContent = uiLocale === "zh-TW" ? "跳至主要內容" : "Skip to main content";
    await render();
  });
}

function bindGatewayConfirmationEvent() {
  const confirmationForm = document.querySelector("#gateway-confirm-form");
  if (!confirmationForm || confirmationForm.dataset.bound === "true") return;
  confirmationForm.dataset.bound = "true";
  confirmationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const result = document.querySelector("#gateway-confirm-result");
    try {
      invariantPendingPublicIntent();
      const rawContactEvidence = document.querySelector("#gateway-contact-evidence").value;
      const contactEvidenceHash = await sha256Text(rawContactEvidence);
      const requestTimestamp = new Date().toISOString();
      const request = confirmPublicCivilizationIntent({
        draft: pendingPublicIntent.draft,
        understanding: pendingPublicIntent.understanding,
        request_id: `PUBLIC_REQUEST_${crypto.randomUUID().replaceAll("-", "").toUpperCase()}`,
        request_source: "PUBLIC_11520_GATEWAY_CONFIRMED_ENTRY",
        contact_evidence_hash: contactEvidenceHash,
        requester_confirmation: document.querySelector("#gateway-confirm-understanding").checked,
        request_timestamp: requestTimestamp,
        transcript_confirmed: pendingPublicIntent.draft.input_type !== "VOICE_TRANSCRIPT" || document.querySelector("#gateway-transcript-confirm")?.checked === true
      });
      const publicRequest = toPublicCivilizationRequest(request);
      const route = routePublicCivilizationProject(request);
      const readilyExecutable = ["SOFTWARE", "MEDIA", "DIGITAL_ONLY"].includes(request.project_type);
      const qualification = qualifyPublicCivilizationRequest({ request, assessment: { current_capability: readilyExecutable, required_skills_available: readilyExecutable, missing_runtime: readilyExecutable ? [] : route.required_components, safety_review: request.safety_class, legal_governance: "REVIEW_REQUIRED", physical_world_dependency: ["CONSTRUCTION", "TRANSPORT", "MANUFACTURING", "LAND"].includes(request.project_type), physical_world_capability: false, payment_required: false, chain_write_required: false, resource_availability: "NOT_VERIFIED", timeline: "ESTIMATE_PENDING", risk: request.safety_class, missing_information: request.missing_information, evidence: [route.route_id, `SAFETY_${request.safety_class}`, "TREASURY_NOT_BOUND"] } });
      const estimate = createNonBindingEstimatePreview({ request, route });
      const company = await universe.registries.company.get("AI_ANT_COMPANY_0001");
      await appendPublicRequestHistoryEvent({ store: universe.store, company, event_type: "INTENT_CONFIRMED", request_id: request.request_id, actor_id: request.requester_id, timestamp: requestTimestamp, payload: { intent_id: pendingPublicIntent.draft.intent_id, requester_id: request.requester_id, confirmation: true }, record_class: "REAL" });
      await appendPublicRequestHistoryEvent({ store: universe.store, company, event_type: "REQUEST_RECEIVED", request_id: request.request_id, actor_id: request.requester_id, timestamp: requestTimestamp, payload: publicRequest, record_class: "REAL" });
      await appendPublicRequestHistoryEvent({ store: universe.store, company, event_type: "PLAN_CREATED", request_id: request.request_id, actor_id: "DIGITAL_ANT_0001", timestamp: requestTimestamp, payload: route, record_class: "DRAFT" });
      await appendPublicRequestHistoryEvent({ store: universe.store, company, event_type: "ESTIMATE_CREATED", request_id: request.request_id, actor_id: "DIGITAL_ANT_0001", timestamp: requestTimestamp, payload: estimate, record_class: "SIMULATION" });
      lastGatewayReceipt = { request: publicRequest, route, qualification, estimate };
      pendingPublicIntent = null;
      result.textContent = `${request.status}: local Request and privacy-safe History appended. Customer, Quote, Order, payment and Revenue remain uncreated.`;
      await render();
    } catch (error) {
      result.textContent = `${error.code ?? "REQUEST_CONFIRMATION_REJECTED"}: ${error.message}`;
    }
  });
}

function invariantPendingPublicIntent() {
  if (!pendingPublicIntent) throw Object.assign(new Error("Create and review a Draft Intent first."), { code: "DRAFT_INTENT_REQUIRED" });
}

function bindLifeFactoryEvents() {
  document.querySelector("#life-factory-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const result = document.querySelector("#life-factory-result");
    try {
      const lifeId = document.querySelector("#factory-life-id").value.trim().toUpperCase();
      const locationId = document.querySelector("#factory-location").value;
      const locationRecord = universe.seed.locations.find((item) => item.location_id === locationId);
      await createLifeDraft({
        lifeRegistry: universe.registries.life,
        speciesRegistry: universe.registries.species,
        input: {
          life_id: lifeId,
          species_id: document.querySelector("#factory-species-id").value,
          origin_id: document.querySelector("#factory-origin-id").value.trim().toUpperCase(),
          birthplace: document.querySelector("#factory-birthplace").value.trim(),
          app_id: `${lifeId}_APP_0001`,
          ideal: document.querySelector("#factory-ideal").value.trim().toUpperCase(),
          dream: document.querySelector("#factory-dream").value.trim().toUpperCase(),
          ultimate_mission: document.querySelector("#factory-mission").value.trim().toUpperCase(),
          location_id: locationId,
          civilization_id: locationRecord.civilization_id
        },
        actorId: "LOCAL_LIFE_FACTORY_OPERATOR"
      });
      result.textContent = `${lifeId} registered as GENESIS_DRAFT. No birth or wallet binding occurred.`;
    } catch (error) {
      result.textContent = `${error.code ?? "LIFE_FACTORY_REJECTED"}: ${error.message}`;
    }
  });
}

function swapFormIntent(confirmed = document.querySelector("#swap-confirm")?.checked === true) {
  return {
    direction: document.querySelector("#swap-direction").value,
    amount: document.querySelector("#swap-amount").value.trim(),
    slippage_bps: Math.round(Number(document.querySelector("#swap-slippage").value) * 100),
    action_reason: document.querySelector("#swap-reason").value.trim(),
    confirmed
  };
}

function bindTokenEvents() {
  const result = document.querySelector("#swap-result");
  let adapter;
  async function getAdapter() {
    if (!globalThis.ethereum) throw Object.assign(new Error("Install or enable an EIP-1193 wallet."), { code: "WALLET_PROVIDER_REQUIRED" });
    adapter ??= await createKgenSwapAdapter({ ethers: globalThis.ethers, ethereum: globalThis.ethereum, store: universe.store });
    return adapter;
  }
  document.querySelector("#verify-market")?.addEventListener("click", async () => {
    try {
      result.textContent = "Verifying BSC chain, bytecode, pair tokens, factory, router and reserves…";
      const state = await (await getAdapter()).snapshot();
      result.textContent = `${state.status}: KGEN/WBNB pair, Router and non-zero reserves verified on chain ${state.chain_id}.`;
    } catch (error) { result.textContent = `${error.code ?? "MARKET_VERIFICATION_STOP"}: ${error.message}`; }
  });
  document.querySelector("#quote-swap")?.addEventListener("click", async () => {
    try {
      result.textContent = "Reading live Router quote…";
      const intent = swapFormIntent(true);
      const quote = await (await getAdapter()).quote(intent);
      const outputSymbol = intent.direction === "BUY_KGEN" ? "KGEN" : "BNB";
      result.textContent = `LIVE ROUTER QUOTE: ${globalThis.ethers.utils.formatUnits(quote.quoted_out, 18)} ${outputSymbol}; minimum ${globalThis.ethers.utils.formatUnits(quote.minimum_out, 18)} ${outputSymbol} at ${(quote.slippage_bps / 100).toFixed(2)}%.`;
    } catch (error) { result.textContent = `${error.code ?? "QUOTE_STOP"}: ${error.message}`; }
  });
  document.querySelector("#kgen-swap-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const intent = swapFormIntent();
      result.textContent = "Waiting for wallet confirmation. Do not approve if the wallet details differ from this form.";
      const settled = await (await getAdapter()).execute(intent);
      result.textContent = `SETTLED ON CHAIN: ${settled.receipt.transactionHash}. Market and Asset history appended locally.`;
    } catch (error) { result.textContent = `${error.code ?? "TRANSACTION_STOP"}: ${error.message}`; }
  });
}

async function updateHeartStatus() {
  const target = document.querySelector("#heart-status");
  if (!target) return;
  const state = await readTempleHeart12345();
  target.innerHTML = `<div class="eyebrow">TEMPLE HEART · READ ONLY</div><h3>${badge(state.status)}</h3><p>${html(state.reason ?? "Contract bytecode and public configuration were read from BSC chain 56.")}</p>${state.status === "CHAIN_READ_VERIFIED" ? `${kv("Heartbeat cooldown", `${state.heartbeat.cooldown_seconds}s`)}${kv("Ignition window", `${state.ignition.window_start}–${state.ignition.window_end} UTC seconds`)}${kv("Fortune range", `${state.fortune.min}–${state.fortune.max}`)}${kv("Wish history", state.wish.account_history_status)}${kv("Write actions", badge(state.write_status), true)}` : ""}`;
}

async function boot() {
  try {
    validatePrimaryI18nCatalogs();
    document.documentElement.lang = uiLocale;
    const seed = await loadCanonicalSeed();
    let store;
    try { store = createBrowserUniverseStore(); } catch { store = undefined; }
    universe = await createUniverseRuntime({ seed, store });
    await loadSharedWorkerStatus();
    addEventListener("hashchange", render);
    bindLanguageRuntime();
    await render();
  } catch (error) {
    content.innerHTML = `<div class="notice error"><strong>RUNTIME STOP</strong><p>${html(error.message)}</p></div>`;
  }
}

boot();
