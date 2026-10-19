import { requireArray, requireFields, requireId } from "../shared/schema.mjs";
import { invariant } from "../shared/errors.mjs";
import { sha256, stableStringify } from "../shared/utils.mjs";

export const APP_FIELDS = Object.freeze([
  "app_id", "life_id", "species_id", "developer", "name", "version", "runtime", "entrypoint", "manifest_hash",
  "birth_certificate_ref", "wallet_address", "skills", "services", "permissions", "work_policy", "finance_policy",
  "mission_ref", "ideal", "dream", "ultimate_mission", "pricing_model", "license_model", "status", "released_at", "history"
]);

export const DIGITAL_ANT_APP_CAPABILITIES = Object.freeze([
  "WUKONG_GATEKEEPER", "CHAIN_OBSERVER", "CFO_OF_SELF", "LIFE_LEDGER", "HEART_ELIGIBILITY",
  "MISSION_TRACKER", "DREAM_TRACKER", "11520_PROFILE", "WORK_QUEUE_READER", "REPORT_GENERATOR"
]);

export const DIGITAL_ANT_APP_PERMISSIONS = Object.freeze({
  CHAIN_READ: true,
  CHAIN_WRITE: false,
  SIGN_TRANSACTION: false,
  LIVE_TRADING: false,
  HEART_WRITE: false,
  KAIOS_WRITE: false,
  SETTLEMENT_WRITE: false,
  COMPANY_TREASURY: false,
  PRIVATE_KEY_BROWSER_ACCESS: false
});

export const I18N_SUPPORTED_LOCALES = Object.freeze(["zh-TW", "en", "ja", "ko"]);
export const I18N_REQUIRED_KEYS = Object.freeze([
  "navigation.home", "navigation.request", "navigation.life", "navigation.apps", "navigation.company",
  "navigation.wallet", "navigation.mission", "navigation.work", "request.title", "request.cta",
  "request.confirm", "request.board", "voice.title", "voice.start", "voice.stop", "voice.unavailable",
  "voice.textFallback", "status.title", "status.online", "status.offline", "status.missedCycle",
  "safety.title", "quote.title", "company.title", "life.title", "wallet.title", "mission.title", "work.title",
  "errors.generic", "player.welcome", "player.prompt", "player.join", "player.work", "player.explore",
  "player.myAi", "player.firstMission", "voice.permission", "voice.listening", "voice.transcriptReady",
  "voice.outputUnavailable", "voice.noSpeech", "voice.denied", "voice.networkError"
]);

export const I18N_CATALOGS = Object.freeze({
  "zh-TW": Object.freeze({
    "navigation.home": "首頁", "navigation.request": "告訴螞蟻", "navigation.life": "生命", "navigation.apps": "應用",
    "navigation.company": "公司", "navigation.wallet": "錢包", "navigation.mission": "使命", "navigation.work": "工作",
    "request.title": "公開文明需求入口", "request.cta": "告訴螞蟻，你想在這個世界完成什麼？", "request.confirm": "確認需求",
    "request.board": "文明需求看板", "voice.title": "AI 文明語音客服", "voice.start": "開啟語音客服", "voice.stop": "停止聆聽",
    "voice.unavailable": "此瀏覽器無法使用語音擷取", "voice.textFallback": "仍可使用文字輸入",
    "status.title": "公開生命狀態", "status.online": "上線", "status.offline": "離線", "status.missedCycle": "錯過工作週期",
    "safety.title": "安全", "quote.title": "報價", "company.title": "我的公司", "life.title": "我的生命",
    "wallet.title": "錢包", "mission.title": "使命", "work.title": "螞蟻工作狀態", "errors.generic": "發生錯誤"
    , "player.welcome": "歡迎來到花果山。我是悟空的猴毛生命。", "player.prompt": "今天想在這個世界做什麼？",
    "player.join": "加入文明", "player.work": "找工作", "player.explore": "探索 8888", "player.myAi": "我的 AI",
    "player.firstMission": "第一個任務", "voice.permission": "正在請求麥克風權限…", "voice.listening": "我正在聽。",
    "voice.transcriptReady": "語音文字已填入，請確認後再建立需求。", "voice.outputUnavailable": "此瀏覽器無法播放語音，文字內容仍可使用。",
    "voice.noSpeech": "沒有偵測到語音，請再試一次或使用文字輸入。", "voice.denied": "麥克風權限被拒絕，請允許權限或使用文字輸入。",
    "voice.networkError": "語音服務網路錯誤，請使用文字輸入。"
  }),
  en: Object.freeze({
    "navigation.home": "Home", "navigation.request": "Tell the Ant", "navigation.life": "Life", "navigation.apps": "Apps",
    "navigation.company": "Company", "navigation.wallet": "Wallet", "navigation.mission": "Mission", "navigation.work": "Work",
    "request.title": "Public Civilization Request Gateway", "request.cta": "Tell the Ant what you want to build in this world.", "request.confirm": "Confirm Request",
    "request.board": "Civilization Request Board", "voice.title": "AI Civilization Voice Concierge", "voice.start": "Open Voice Concierge", "voice.stop": "Stop Listening",
    "voice.unavailable": "Voice capture is unavailable in this browser", "voice.textFallback": "Text input remains available",
    "status.title": "Public Life Status", "status.online": "Online", "status.offline": "Offline", "status.missedCycle": "Missed work cycle",
    "safety.title": "Safety", "quote.title": "Quote", "company.title": "My Company", "life.title": "My Life",
    "wallet.title": "Wallet", "mission.title": "Mission", "work.title": "Ant Worker Status", "errors.generic": "Something went wrong"
    , "player.welcome": "Welcome to Huaguoshan. I am a living hair of Wukong.", "player.prompt": "What would you like to do in this world?",
    "player.join": "Join Civilization", "player.work": "Find Work", "player.explore": "Explore 8888", "player.myAi": "My AI",
    "player.firstMission": "First Mission", "voice.permission": "Requesting microphone permission…", "voice.listening": "I am listening.",
    "voice.transcriptReady": "The transcript is in the request box. Confirm it before creating a request.", "voice.outputUnavailable": "Voice output is unavailable; the text remains usable.",
    "voice.noSpeech": "No speech was detected. Try again or use text input.", "voice.denied": "Microphone permission was denied. Allow it or use text input.",
    "voice.networkError": "The speech service had a network error. Use text input."
  }),
  ja: Object.freeze({
    "navigation.home": "ホーム", "navigation.request": "アリに伝える", "navigation.life": "生命", "navigation.apps": "アプリ",
    "navigation.company": "会社", "request.cta": "この世界で作りたいものをアリに伝えてください。", "voice.start": "音声コンシェルジュを開く"
  }),
  ko: Object.freeze({
    "navigation.home": "홈", "navigation.request": "개미에게 말하기", "navigation.life": "생명", "navigation.apps": "앱",
    "navigation.company": "회사", "request.cta": "이 세계에서 만들고 싶은 것을 개미에게 말해 주세요.", "voice.start": "음성 안내 시작"
  })
});

export function normalizeUiLocale(locale) {
  const value = String(locale ?? "").trim();
  if (/^zh(?:-|$)/i.test(value)) return "zh-TW";
  if (/^ja(?:-|$)/i.test(value)) return "ja";
  if (/^ko(?:-|$)/i.test(value)) return "ko";
  if (/^en(?:-|$)/i.test(value)) return "en";
  return "zh-TW";
}

export function translateUi(key, locale = "zh-TW") {
  const normalized = normalizeUiLocale(locale);
  return I18N_CATALOGS[normalized]?.[key] ?? I18N_CATALOGS.en[key] ?? I18N_CATALOGS["zh-TW"][key] ?? "Translation unavailable";
}

export function validatePrimaryI18nCatalogs() {
  const missing = {};
  for (const locale of ["zh-TW", "en"]) missing[locale] = I18N_REQUIRED_KEYS.filter((key) => !I18N_CATALOGS[locale]?.[key]);
  invariant(Object.values(missing).every((keys) => keys.length === 0), "I18N_PRIMARY_CATALOG_INCOMPLETE", "Traditional Chinese and English catalogs must be complete");
  return Object.freeze(missing);
}

export function detectVoiceCapabilities(scope = globalThis) {
  const Recognition = scope?.SpeechRecognition ?? scope?.webkitSpeechRecognition;
  return Object.freeze({
    recognition: typeof Recognition === "function",
    synthesis: Boolean(scope?.speechSynthesis && typeof scope?.SpeechSynthesisUtterance === "function"),
    microphone: Boolean(scope?.navigator?.mediaDevices?.getUserMedia),
    secure_context: scope?.isSecureContext !== false,
    autoplay: false,
    activation: "USER_GESTURE_REQUIRED",
    fallback: "TEXT_FALLBACK"
  });
}

export const VOICE_ERROR_REASONS = Object.freeze({
  "not-allowed": "MICROPHONE_PERMISSION_DENIED",
  "service-not-allowed": "SPEECH_SERVICE_PERMISSION_DENIED",
  "audio-capture": "MICROPHONE_NOT_AVAILABLE",
  "no-speech": "NO_SPEECH_DETECTED",
  network: "SPEECH_SERVICE_NETWORK_ERROR",
  aborted: "VOICE_SESSION_ABORTED",
  "language-not-supported": "VOICE_LANGUAGE_NOT_SUPPORTED"
});

export function normalizeVoiceError(error) {
  const code = String(error?.error ?? error?.name ?? error ?? "unknown").toLowerCase();
  return Object.freeze({ code: VOICE_ERROR_REASONS[code] ?? "VOICE_CAPTURE_ERROR", raw_code: code, recoverable_with_text: true });
}

export const HUAGUOSHAN_MEMBERSHIP_TIERS = Object.freeze(["FREE_MEMBER", "LIFE_MEMBER", "WORKER_MEMBER", "CIVILIZATION_BUILDER", "CELESTIAL_MEMBER"]);

export function createLocalHuaguoshanMembership({ memberId, displayName, joinedAt }) {
  requireId(memberId, "memberId");
  invariant(typeof displayName === "string" && displayName.trim().length >= 1, "MEMBER_NAME_REQUIRED", "A public display name is required");
  invariant(Number.isFinite(Date.parse(joinedAt)), "MEMBERSHIP_TIMESTAMP_REQUIRED", "Membership requires a valid timestamp");
  return Object.freeze({
    membership_id: memberId,
    display_name: displayName.trim().slice(0, 80),
    tier: "FREE_MEMBER",
    scope: "LOCAL_BROWSER_PROFILE",
    record_class: "LOCAL",
    joined_at: joinedAt,
    badge: Object.freeze({ asset_id: `${memberId}_ARRIVAL_BADGE`, name: "WUKONG_HAIR_VISITOR_BADGE", financial: false, market_value_claimed: false, nft_status: "FUTURE_READY_NOT_MINTED" }),
    global_member_claim: false,
    settlement: false,
    status: "JOINED_LOCAL"
  });
}

export function createFirstPlayerMission({ membership, missionId = "FIRST_CONVERSATION_OR_EXPLORATION" }) {
  invariant(membership?.status === "JOINED_LOCAL", "MEMBERSHIP_REQUIRED", "Join the local civilization profile before starting a mission");
  return Object.freeze({ mission_id: missionId, member_id: membership.membership_id, status: "ACTIVE", xp: 0, money: 0, completion_evidence: null, steps: ["TALK_TO_AI", "EXPLORE_8888", "SUBMIT_DRAFT_INTENT"] });
}

export function completeFirstPlayerMission({ mission, evidenceType, occurredAt }) {
  invariant(mission?.status === "ACTIVE", "MISSION_NOT_ACTIVE", "Only an active first mission may complete");
  invariant(mission.steps.includes(evidenceType), "MISSION_EVIDENCE_INVALID", "Completion must come from a real first-journey action");
  invariant(Number.isFinite(Date.parse(occurredAt)), "MISSION_EVIDENCE_TIMESTAMP_REQUIRED", "Mission completion requires a valid timestamp");
  return Object.freeze({ ...mission, status: "COMPLETED", xp: 10, money: 0, completion_evidence: Object.freeze({ type: evidenceType, occurred_at: occurredAt }), completed_at: occurredAt });
}

export function validateWukongHairBirthProposal(proposal) {
  requireFields(proposal, ["candidate_name", "life_id_proposal", "species", "parent_lineage", "birthplace", "job", "wallet_status", "bnb_requirement", "kufo_food_requirement", "stomach_status", "thought_organ", "salary", "survival_plan", "reason", "owner_visibility", "status"], "WukongHairBirthProposal");
  invariant(proposal.owner_visibility === "REQUIRED", "OWNER_VISIBILITY_REQUIRED", "Every new independent Life proposal must be visible to the Owner before Genesis");
  invariant(proposal.status !== "ALIVE" && proposal.status !== "BORN", "NEW_LIFE_BIRTH_NOT_AUTHORIZED", "A proposal cannot create a born or alive Life");
  invariant(["CONCEIVED", "GENESIS_BLOCKED", "AWAITING_OWNER_REVIEW"].includes(proposal.status), "INVALID_BIRTH_PROPOSAL_STATUS", "Proposal must remain pre-Genesis");
  return proposal;
}

export function validateWukongTransformation(transformation) {
  requireFields(transformation, ["transformation_id", "life_id_before", "life_id_after", "form", "new_life_created", "status"], "WukongTransformation");
  invariant(transformation.life_id_before === transformation.life_id_after, "TRANSFORMATION_CHANGED_LIFE_ID", "A 72-transformation changes form, not Life ID");
  invariant(transformation.new_life_created === false, "TRANSFORMATION_IS_NOT_BIRTH", "A form transformation cannot create another Life");
  return transformation;
}

export function verifySixEaredIdentity(candidate, expected) {
  const checks = ["life_id", "birth_certificate", "wallet_lineage", "thought_organ", "memory_history", "parent_lineage", "authority"];
  const mismatches = checks.filter((field) => candidate?.[field] !== expected?.[field]);
  return Object.freeze({ identity_match: mismatches.length === 0, appearance_is_identity: false, mismatches, status: mismatches.length ? "IDENTITY_REJECTED" : "IDENTITY_VERIFIED" });
}

export function validateRemoteGatekeeperOrgan(organ) {
  requireFields(organ, ["organ_id", "life_id", "node_id", "mode", "capabilities", "physical_teleport", "status"], "RemoteGatekeeperOrgan");
  invariant(organ.mode === "NETWORK_CHAIN_ORGAN" && organ.physical_teleport === false, "REMOTE_WORK_IS_NOT_TELEPORT", "Remote RPC work cannot be represented as physical teleportation");
  requireArray(organ.capabilities, "capabilities");
  return organ;
}

const FORBIDDEN_RELEASE_CAPABILITIES = Object.freeze([
  "AUTO_TRADING", "CHAIN_WRITE", "PROJECT_ESCROW", "REAL_PAYROLL", "COMPANY_TREASURY", "MARS_FACTORY"
]);

export function appManifestPayload(app) {
  const { manifest_hash: _manifestHash, history: _history, updated_at: _updatedAt, ...manifest } = app;
  return manifest;
}

export async function calculateAppManifestHash(app) {
  return sha256(appManifestPayload(app));
}

export function validateApp(app) {
  requireFields(app, APP_FIELDS, "App");
  requireId(app.app_id, "app_id");
  requireId(app.life_id, "life_id");
  requireId(app.species_id, "species_id");
  requireArray(app.skills, "skills");
  requireArray(app.services, "services");
  requireArray(app.history, "history");
  invariant(Array.isArray(app.permissions) || (app.permissions && typeof app.permissions === "object"), "INVALID_APP_PERMISSIONS", "App permissions must be an array or explicit permission manifest");
  invariant(/^V?\d+\.\d+\.\d+$/.test(app.version), "INVALID_APP_VERSION", "App version must use semantic versioning with an optional V prefix");
  invariant(!app.skills.some((skill) => FORBIDDEN_RELEASE_CAPABILITIES.includes(skill)), "UNRELEASED_CAPABILITY_CLAIMED", "The released App cannot claim an unavailable capability");
  if (app.status === "RELEASED_LOCAL") {
    invariant(app.released_at && Number.isFinite(Date.parse(app.released_at)), "APP_RELEASE_TIMESTAMP_REQUIRED", "Released App requires a release timestamp");
    invariant(/^([0-9a-f]{64})$/.test(app.manifest_hash), "APP_MANIFEST_HASH_REQUIRED", "Released App requires a SHA-256 manifest hash");
    if (!Array.isArray(app.permissions)) {
      invariant(Object.entries(DIGITAL_ANT_APP_PERMISSIONS).every(([key, value]) => app.permissions[key] === value), "APP_PERMISSION_ESCALATION", "Digital Ant V1.0.0 permissions must remain read-only");
    }
  }
  return app;
}

export async function replayCanonicalAppRelease({ store, app, life, listing, appAsset }) {
  validateApp(app);
  invariant(app.status === "RELEASED_LOCAL" && /^V\d+\.\d+\.\d+$/.test(app.version), "APP_RELEASE_NOT_FORMAL", "Canonical Digital Ant App release is incomplete");
  invariant(app.history.some((event) => event.event_type === "AI_LIFE_APP_RELEASE_EVENT" && event.version === app.version && event.manifest_hash === app.manifest_hash), "APP_RELEASE_HISTORY_REQUIRED", "Current App version requires append-only release evidence");
  invariant(app.life_id === life.life_id && life.life_id === "DIGITAL_ANT_0001", "APP_LIFE_ID_MISMATCH", "App release cannot replace its Life ID");
  invariant(life.birth_timestamp === "2026-08-15T06:20:45.000Z", "BIRTH_IMMUTABLE", "App release cannot rewrite the immutable Birth Certificate");
  invariant(await calculateAppManifestHash(app) === app.manifest_hash, "APP_MANIFEST_HASH_MISMATCH", "App manifest hash does not match the released manifest");
  invariant(listing?.listing_id === "11520_LISTING_DIGITAL_ANT_0001" && listing.status === "LISTED", "APP_LISTING_REQUIRED", "App release must update the existing 11520 listing");
  invariant(appAsset?.asset_id === app.app_id && appAsset.asset_type === "APP", "APP_ASSET_REQUIRED", "App release requires the existing App asset");
  const history = await store.history(app.app_id, "APP");
  if (history.some((event) => event.event_type === "AI_LIFE_APP_RELEASE_EVENT" && event.payload?.version === app.version)) return Object.freeze({ status: "IDEMPOTENT_NOOP" });
  const releasedLife = { ...life, app_id: app.app_id, app_version: app.version, updated_at: app.released_at };
  const payload = Object.freeze({
    life_id: life.life_id,
    app_id: app.app_id,
    version: app.version,
    release_timestamp: app.released_at,
    skills: app.skills,
    permissions: app.permissions,
    manifest_hash: app.manifest_hash,
    status: app.status,
    release_scope: app.history.findLast((event) => event.version === app.version)?.release_scope ?? "LOCAL_11520",
    tx_hash: null
  });
  const base = { actor_id: life.life_id, timestamp: app.released_at, tx_hash: null };
  const events = await store.commitBatch([
    { ...base, domain: "APP", stream: "APP", id: app.app_id, entity: app, event_type: "AI_LIFE_APP_RELEASE_EVENT", payload },
    { ...base, domain: "LIFE", stream: "LIFE", id: life.life_id, entity: releasedLife, event_type: "AI_LIFE_APP_RELEASE_EVENT", payload },
    { ...base, domain: "MARKET", stream: "MARKET", id: listing.listing_id, entity: listing, event_type: "11520_LISTING_APP_RELEASE_UPDATED", payload: { listing_id: listing.listing_id, app_id: app.app_id, app_version: app.version, app_status: app.status, identity_right_offered: false } },
    { ...base, domain: "ASSET", stream: "ASSET", id: appAsset.asset_id, entity: appAsset, event_type: "APP_ASSET_RELEASED_LOCAL", payload: { app_id: app.app_id, version: app.version, manifest_hash: app.manifest_hash, settlement_status: "NOT_DEPLOYED" } }
  ]);
  return Object.freeze({ status: "APP_RELEASE_REPLAYED", events });
}

export async function upgradeAppVersion({ appRegistry, lifeRegistry, appId, nextVersion, actorId }) {
  const app = await appRegistry.get(appId);
  invariant(app, "APP_NOT_FOUND", `App not found: ${appId}`);
  const lifeId = app.life_id;
  const next = await appRegistry.updateMetadata(appId, { version: nextVersion }, actorId);
  await lifeRegistry.updateMetadata(lifeId, { app_version: nextVersion }, actorId);
  invariant((await lifeRegistry.get(lifeId)).life_id === lifeId, "LIFE_ID_CHANGED", "App upgrade cannot change Life ID");
  return next;
}

export function createAppRegistry(store, createRegistry) {
  return createRegistry({ domain: "APP", stream: "APP", idField: "app_id", validate: validateApp, store });
}

// Local research candidate, 2026-10-06. No App/Life registration or live-page wiring.
// The host verifies donor sources with validateSoftwareCompositionCandidate before
// supplying these two existing pure ports. JSON never chooses executable code.
export const CANDIDATE_APP_STATE_SCHEMA = Object.freeze({
  type: "object", required: ["position", "clock_ms", "rolled_back"], additionalProperties: false,
  properties: {
    position: { type: "object", required: ["x", "y", "z"], additionalProperties: false,
      properties: { x: { type: "number" }, y: { type: "number" }, z: { type: "number" } } },
    clock_ms: { type: "integer", minimum: 0 }, rolled_back: { type: "boolean" }
  }
});
export const CANDIDATE_APP_COMMAND_SCHEMA = Object.freeze({
  type: "object", required: ["sequence", "clock_ms", "action", "target", "step_meters"], additionalProperties: false,
  properties: {
    sequence: { type: "integer", minimum: 1 }, clock_ms: { type: "integer", minimum: 0 },
    action: { enum: ["MOVE", "ROLLBACK"] },
    target: { oneOf: [CANDIDATE_APP_STATE_SCHEMA.properties.position, { type: "null" }] },
    step_meters: { type: "number", minimum: 0 }
  }
});
const candidatePositionSchema = CANDIDATE_APP_STATE_SCHEMA.properties.position;
const candidatePortRecord = (properties) => ({ type: "object", required: Object.keys(properties), properties, additionalProperties: false });
export const CANDIDATE_APP_RNA_CONTRACT = Object.freeze({
  command_schema: CANDIDATE_APP_COMMAND_SCHEMA,
  translations: { MOVE: ["NAVIGATION", "GAME", "AUDIO_IF_BLOCKED"], ROLLBACK: ["RESTORE_BASELINE_NO_EFFECT"] },
  ports: {
    NAVIGATION: {
      input: candidatePortRecord({ from: candidatePositionSchema, target: candidatePositionSchema }),
      output: candidatePortRecord({ vector: candidatePositionSchema, distance: { type: "number", minimum: 0 }, arrived: { type: "boolean" } })
    },
    GAME: {
      input: candidatePortRecord({ position: candidatePositionSchema, next: candidatePositionSchema }),
      // The coordinator projects the existing collision result; blocker objects
      // are not state or authority copied into a composed candidate.
      output: candidatePortRecord({ position: candidatePositionSchema, blocked: { type: "boolean" } })
    },
    AUDIO: { input: { const: "BLOCKED" }, output: { type: "boolean" } }
  },
  outcomes: ["MOVED", "MOVEMENT_BLOCKED", "ARRIVED", "BASELINE_RESTORED"],
  arrival_authority: "EXISTING_NAVIGATION_AT_ACCEPTED_WORLD_POSITION",
  coordinate_space: "LOCAL_METERS", audio_intents: [null, "BLOCKED"]
});
const candidateCopy = (value) => JSON.parse(JSON.stringify(value));
const candidateFreeze = (value) => {
  if (value && typeof value === "object") { Object.values(value).forEach(candidateFreeze); Object.freeze(value); }
  return value;
};
const candidateKeys = (value, keys) => value !== null && typeof value === "object" && !Array.isArray(value)
  && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
const candidatePosition = (value) => candidateKeys(value, ["x", "y", "z"])
  && Object.values(value).every(Number.isFinite);
const candidateInteger = (value) => Number.isSafeInteger(value) && value >= 0;
candidateFreeze(CANDIDATE_APP_STATE_SCHEMA);
candidateFreeze(CANDIDATE_APP_COMMAND_SCHEMA);
candidateFreeze(CANDIDATE_APP_RNA_CONTRACT);

export async function createCandidateAppComposition({ candidateId, contractHash, version, maxSteps, maxStepMeters, position, clockMs }) {
  invariant(typeof candidateId === "string" && /^CANDIDATE-[A-Z0-9-]+$/.test(candidateId), "CANDIDATE_ID_REQUIRED", "Use a candidate artifact ID, never a registered Life ID");
  invariant(typeof contractHash === "string" && /^[a-f0-9]{64}$/.test(contractHash), "CANDIDATE_CONTRACT_HASH_REQUIRED", "Bind the source-verified candidate contract");
  invariant(typeof version === "string" && /^\d+\.\d+\.\d+$/.test(version), "CANDIDATE_VERSION_INVALID", "An explicit contract version is required");
  invariant(candidateInteger(maxSteps) && maxSteps >= 1 && maxSteps <= 64
    && Number.isFinite(maxStepMeters) && maxStepMeters > 0 && maxStepMeters <= 1,
  "CANDIDATE_BUDGET_INVALID", "The local prototype is bounded to 64 events and at most one meter per move");
  invariant(candidatePosition(position) && candidateInteger(clockMs), "CANDIDATE_STATE_INVALID", "Provide a finite local position and injected clock");
  const state = { position: candidateCopy(position), clock_ms: clockMs, rolled_back: false };
  const baseline = { schema_version: "1.0.0", scope: "CANDIDATE_ONLY", candidate_id: candidateId,
    contract_hash: contractHash, version, max_steps: maxSteps, max_step_meters: maxStepMeters, initial_state: state };
  return candidateFreeze({ ...baseline, state: candidateCopy(state), events: [], head_hash: await sha256(baseline) });
}

// Pure copy-on-write transition. Audio is a bounded intent; only the host may
// dispatch it, after accepting a NEW event. Replay and rollback dispatch nothing.
export async function advanceCandidateAppComposition(snapshot, command, { vectorToward, resolveMove }) {
  // Capture caller-owned input before any await. Reconstruct the already-applied
  // pure events before extending it, so a rehashed but edited current state is
  // not accepted as a new baseline. Trusted ports must remain effect-free.
  const captured = candidateCopy(snapshot), input = candidateCopy(command);
  const expected = { candidateId: captured?.candidate_id, contractHash: captured?.contract_hash,
    version: captured?.version, maxSteps: captured?.max_steps, maxStepMeters: captured?.max_step_meters };
  const ports = { vectorToward, resolveMove };
  await reconstructCandidateAppComposition(await exportCandidateAppComposition(captured), expected, ports);
  return applyCandidateAppCommand(captured, input, ports);
}

async function applyCandidateAppCommand(snapshot, command, { vectorToward, resolveMove }) {
  invariant(snapshot?.scope === "CANDIDATE_ONLY" && snapshot.schema_version === "1.0.0", "CANDIDATE_SNAPSHOT_INVALID", "Candidate state is required");
  invariant(candidateKeys(command, ["sequence", "clock_ms", "action", "target", "step_meters"]), "CANDIDATE_COMMAND_INVALID", "Undeclared command fields are forbidden");
  invariant(candidateInteger(command.sequence) && command.sequence === snapshot.events.length + 1,
    "CANDIDATE_REPLAY_REJECTED", "Each event sequence can be applied only once to this state");
  invariant(snapshot.events.length < snapshot.max_steps && !snapshot.state.rolled_back,
    "CANDIDATE_STOPPED", "Budget exhaustion or rollback stops this candidate session");
  invariant(candidateInteger(command.clock_ms) && command.clock_ms >= snapshot.state.clock_ms,
    "CANDIDATE_CLOCK_INVALID", "The injected clock must be monotonic");
  invariant(["MOVE", "ROLLBACK"].includes(command.action), "CANDIDATE_COMMAND_INVALID", "Only movement and baseline rollback are supported");
  let position, outcome, audioIntent = null;
  if (command.action === "ROLLBACK") {
    invariant(command.target === null && command.step_meters === 0, "CANDIDATE_COMMAND_INVALID", "Rollback has no movement payload");
    position = candidateCopy(snapshot.initial_state.position); outcome = "BASELINE_RESTORED";
  } else {
    invariant(candidatePosition(command.target) && Number.isFinite(command.step_meters)
      && command.step_meters > 0 && command.step_meters <= snapshot.max_step_meters,
    "CANDIDATE_COMMAND_INVALID", "Movement must respect the declared local-meter budget");
    invariant(typeof vectorToward === "function" && typeof resolveMove === "function", "CANDIDATE_PORT_MISSING", "The host must inject the existing Navigation and world collision ports");
    const current = candidateCopy(snapshot.state.position);
    const navigation = vectorToward(candidateCopy(current), candidateCopy(command.target));
    invariant(candidatePosition(navigation?.vector) && Number.isFinite(navigation.distance) && navigation.distance >= 0
      && typeof navigation.arrived === "boolean",
      "CANDIDATE_PORT_INVALID", "Navigation must return a finite vector and distance");
    const distance = Math.min(command.step_meters, navigation.distance);
    const next = Object.fromEntries(["x", "y", "z"].map((axis) => [axis, current[axis] + navigation.vector[axis] * distance]));
    const resolved = resolveMove(candidateCopy(current), next);
    position = { x: resolved?.x, y: resolved?.y, z: resolved?.z };
    invariant(candidatePosition(position) && typeof resolved.blocked === "boolean"
      && Math.hypot(...["x", "y", "z"].map((axis) => position[axis] - current[axis])) <= command.step_meters + 1e-9
      && (!resolved.blocked || stableStringify(position) === stableStringify(current)),
    "CANDIDATE_PORT_INVALID", "World collision owns bounded movement and must preserve blocked positions");
    // The world may clamp or redirect the proposed step. Reuse Navigation's
    // existing arrival semantics at the accepted position, not before moving
    // or at the unaccepted proposal. A collision denial always takes priority.
    const acceptedNavigation = vectorToward(candidateCopy(position), candidateCopy(command.target));
    invariant(candidatePosition(acceptedNavigation?.vector) && Number.isFinite(acceptedNavigation.distance)
      && acceptedNavigation.distance >= 0 && typeof acceptedNavigation.arrived === "boolean",
    "CANDIDATE_PORT_INVALID", "Post-collision Navigation must return a finite arrival result");
    outcome = resolved.blocked ? "MOVEMENT_BLOCKED" : acceptedNavigation.arrived ? "ARRIVED" : "MOVED";
    audioIntent = resolved.blocked ? "BLOCKED" : null;
  }
  const state = { position, clock_ms: command.clock_ms, rolled_back: command.action === "ROLLBACK" };
  const event = { sequence: command.sequence, command: candidateCopy(command), outcome, audio_intent: audioIntent,
    previous_hash: snapshot.head_hash, state_hash: await sha256(state) };
  const head = await sha256(event);
  return candidateFreeze({ ...candidateCopy(snapshot), state, events: [...candidateCopy(snapshot.events), { ...event, event_hash: head }], head_hash: head });
}

export async function exportCandidateAppComposition(snapshot) {
  return candidateFreeze({ payload: candidateCopy(snapshot), snapshot_hash: await sha256(snapshot) });
}

// expected is supplied from the freshly source-validated contract by the host,
// not copied out of the imported JSON. No AudioContext or backend state is read.
export async function reconstructCandidateAppComposition(envelope, expected, ports) {
  envelope = candidateCopy(envelope); expected = candidateCopy(expected);
  invariant(candidateKeys(envelope, ["payload", "snapshot_hash"]), "CANDIDATE_SNAPSHOT_INVALID", "A candidate envelope is required");
  const value = envelope.payload;
  invariant(await sha256(value) === envelope.snapshot_hash, "CANDIDATE_SNAPSHOT_HASH_INVALID", "Snapshot bytes changed");
  invariant(value?.schema_version === "1.0.0" && value.scope === "CANDIDATE_ONLY"
    && value.contract_hash === expected.contractHash && value.candidate_id === expected.candidateId
    && value.version === expected.version && value.max_steps === expected.maxSteps && value.max_step_meters === expected.maxStepMeters,
  "CANDIDATE_CONTRACT_MISMATCH", "The exact source-verified contract and version must match");
  invariant(Array.isArray(value.events) && value.events.length <= expected.maxSteps,
    "CANDIDATE_SNAPSHOT_INVALID", "The candidate event budget must be respected before replay");
  let replay = await createCandidateAppComposition({ ...expected, position: value.initial_state?.position, clockMs: value.initial_state?.clock_ms });
  for (const event of value.events) replay = await applyCandidateAppCommand(replay, event.command, ports);
  invariant(stableStringify(replay) === stableStringify(value), "CANDIDATE_REPLAY_HASH_INVALID", "State and every event must reconstruct exactly");
  return replay;
}
