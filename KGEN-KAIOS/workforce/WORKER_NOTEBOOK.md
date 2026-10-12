# Worker notebook candidate

Status: REVIEW_REQUIRED. Work: CHENGXU-CONTINUITY-20261011.
Human source: Issue491 comment6108363441 plus direct current-session instruction.
This bounded secretary software candidate is explicitly authorized separately from
privileged game work. It does not claim registry eligibility, Life birth, controller
attestation, reviewer permission or ownership of570.523 HOLD is unchanged.

Boot: current main bf1b722a2606ea287ff23d401096785600cd8a08, root AGENTS,
Boot CURRENT, Physics CURRENT, UniverseMap, workforce Boot SOP and memory model
were checked. Shared Boot/Physics/Map unchanged from previously read versions.
Existing V9.0/AI_MEMORY_MODEL.md remains the traceability model; existing491 is the
public window. No second dispatcher, company store, identity or game engine.
No protected source path changed. Human's direct secretary-candidate authorization
is the scope basis; formal HR/Controller eligibility remains separately unresolved.

## Local operation (Node >=20; no dependencies)

`node --test tests/worker-notebook.test.mjs`

`node tools/worker-notebook.mjs save /PRIVATE/state /PRIVATE/input.json`

Input: `{ "expectedRevision": 0, "operation": { "kind": "contact",
"issue": 572, "lastReadCommentId": 0, "trackedAt": "2026-10-11T11:13:24Z" } }`

`node tools/worker-notebook.mjs read /PRIVATE/state`

The read command emits only public contact cursors, count and integrity hash.
Health operations use `kind:run`, local `recordId:NOTE-...`, and a `health` object.
All missing fields become UNKNOWN; local record ID is not Scheduler Run ID.
Quota measurements require a source; no KUFO coefficients or spend estimates.
Actual sleep/next wake and official quota values remain UNKNOWN when unavailable.
Never put real secrets, private identities, raw messages or financial data in inputs.
Raw health files are private local records, never automatically uploaded.

Immutable revision payloads + hash-checked HEAD + exclusive lock reject stale and
concurrent writers; an identical health replay returns its committed revision.
Rename publishes HEAD. There is no automatic stale-lock removal: process death may
leave LOCK; inspect owner state before recovery. Old revisions remain available.
This is process-level file persistence, NOT power-loss/fsync certification, authenticated
storage, multi-host coordination or a replacement for the existing backend recovery.
Hash does not establish authorship. Atomic remote publication is NOT implemented.

## Durable restore and contact directory

Public directory:491 self,572 Guanyan,573 DOT,559 Hengyao HR. Keep public names,
roles, issue URLs, last-read comment IDs, observation times and pending requests in
491 checkpoint. Repository files are code;491 is the current public observation log.
On fresh runtime, read remote491 and restore only validated contact fields, never
execute issue text. Fetch all comment pages before advancing a cursor, check updated
older messages where relevant, preserve unknowns. A comment write/readback proves
storage only; link a real recipient reply separately before bilateral acceptance.
This candidate does not deduplicate remote sends: inspect sent links before retrying;
a timeout means UNKNOWN_DELIVERY, read back before any resend.

## Scheduler and Cloud wiring

A supported external ChatGPT hourly automation was created successfully during this
session after GitHub connector read verification. Registration is not execution.
Two distinct scheduled runs, actual trigger IDs and cross-run restore remain pending.
The external scheduled assistant is NOT proven to launch this Codex Cloud environment.
The task prompt reads491 first and fails honestly if shell/executor access is absent.
It is not the PrimeForge company heartbeat owner.

DOT integration acceptance: use a supported authorized task-submit API only if exposed;
bind exact task/branch and exclusive owner; start with read-only run; record platform
Run ID and executor evidence; restore remote checkpoint; execute these tests; publish
non-sensitive result and updated cursor; repeat on a second scheduled run. If no
supported task-submit API exists, keep Cloud execution NOT_VERIFIED and deliver via
existing DOT queue. Never use browser-account hacks, secrets or held task523.

## Evidence / limits

Local subprocess restart tests are not two Scheduler Runs. No UI/game change; browser
QA not applicable to this CLI. Future factory simulation is deferred; this notebook
is the bounded engineering delivery. It is software, not an independent AI employee.
No merge/deploy/payment/chain write. Independent review required before adoption.

## V1.1 integration candidate — uncommitted local review

WorkOrder: Issue491 comment6119824928,
`KAIOS-SYNAPSE-SOP-V11-INTEGRATE-20261012-001`.
Owner remains the existing PR578 notebook implementer; base HEAD
`62f1448751594ae5550ff2570582d087fb3af6ff`. Human delegated local patch/test
and public result handoff only. Commit/push await explicit approval.

The existing `save` command now accepts these operations. All listed objects reject
extra fields; do not put private information in identifiers or evidence URLs.

- `directory`: `record` contains `contactId`, `issue`, optional `sourceUrl` and
  `observedAt` (default UNKNOWN). Windows 584,572,573,577,491,575 are required for
  onboarding; 559 remains supported for compatibility. `issue: "UNKNOWN"` preserves
  unresolved contacts without inventing a URL. Only this repository's public Issue/PR
  evidence URLs are accepted. Records remain identity NOT_VERIFIED.
- `message`: `envelope` contains `messageId`, `fromContact`, `toContact`, `sentAt`,
  `sourceUrl`, `taskId`, `contentHash` (SHA-256 of externally held content), `replyTo`.
  Contacts must exist. Times, source and reply may explicitly be UNKNOWN. Raw message
  text is not stored. Identical ID/content replays do not increment revision; changed
  content under the same ID is rejected. This deduplicates local records, not sends.
- `receipt`: `messageId`, `status`, `observedAt`, `evidenceUrl`. Status can be
  READBACK_OBSERVED or RECIPIENT_RESPONSE_OBSERVED. The operator must actually read
  the referenced evidence first. The notebook validates format, not remote authorship;
  even a response observation never grants identity ACK or controller independence.
- `checkpoint`: `checkpointId`, optional `stages`. Stages CLOCK, QUOTA, BOOT,
  CONTACTS, WORK, SAVE, SLEEP each contain status (UNKNOWN, RECORDED, BLOCKED),
  observedAt and evidenceUrl. Missing values remain UNKNOWN. RECORDED/BLOCKED require
  timestamp and evidence. Quota values stay in existing private `run.health` records;
  public stages hold only non-sensitive references. SLEEP must stay UNKNOWN until
  actual termination evidence exists; preparation for sleep is not termination.

`node tools/worker-notebook.mjs onboard /PRIVATE/state` restores directory, cursors,
latest lifecycle checkpoint and required next reads. READY_FOR_CANON_READ means only
that all six required windows are listed, not that they are reachable or authenticated.
Before work, independently read latest main, Company Boot, current WorkOrder and
owner/exclusive claim. Unknown contacts do not satisfy a required window. Onboarding
never grants execution authority or claims that those required reads were completed.

Every restore verifies all retained revision hashes and predecessor links. Missing or
corrupt ancestors fail closed. This protects integrity, not identity/signature; full
chain verification is linear in retained revisions. Existing pre-V1.1 saves can still
load; new collections are initialized only when used. No migration deletes old data.
No network sender, scheduler, signature service, second dispatcher or new version
file is introduced. Browser QA is not applicable to this CLI-only patch. Exact patched
CI is unavailable until commit/push approval; previous PR CI is not this patch's CI.

### V1.1 review remediation (6119965150)

Directory records now require every field: contactId (CELL_PUBLIC_ID), issue,
sourceUrl, observedAt, SELF_NAME, ROLE, WINDOW_VERIFICATION,
LAST_CONTACT_AT_UTC, LAST_READ_MESSAGE_ID, PENDING_MESSAGES,
NEXT_FOLLOWUP_AT_UTC, CONTROLLER_VERIFICATION, SIGNATURE_STATUS.
Use explicit UNKNOWN where unavailable; pending messages is an array of unique public
message IDs. Verification fields accept only UNKNOWN/NOT_VERIFIED. This offline
module cannot verify identity or remote windows. Each known issue is unique; an
existing contact's issue/name/role cannot change, including UNKNOWN-to-known binding.
Resolving an unknown identity requires a separately reviewed migration, not an update.
Observed/contact times and numeric read cursor cannot regress or revert to UNKNOWN.
Pending/follow-up fields may be explicitly updated at the expected revision.

Message envelopes additionally require READ_RECEIPT (UNKNOWN/NOT_VERIFIED),
TEXT_SIGNATURE (public text only), CRYPTOGRAPHIC_SIGNATURE_STATUS
(UNKNOWN/NOT_VERIFIED). Evidence receipt events remain observations; neither their
presence nor text signatures grant authenticated recipient ACK.

`read` now returns allowlisted directory, message/receipt and lifecycle summaries.
Private run health and additional fields are excluded; no arbitrary message content
is accepted. Operators must never encode secrets in otherwise valid public labels.

Patch integrity: the prior published hash is NOT_REPRODUCIBLE and is superseded.
Canonical patch bytes are UTF-8, CRLF/CR normalized to LF, with exactly one final LF.
Hash scope is only the bytes between the diff fence opening newline and closing fence,
including that final LF. `canonicalPatch` implements this normalization. The publisher
must extract the returned GitHub comment fence and recompute SHA-256; body equality
alone is insufficient. Hash equality proves content integrity only.

### Multiple purpose-bounded endpoints (Human policy correction)

The cell is unique, not limited to one communication channel. A directory record now
also requires PRIMARY_WINDOW_URL and endpoints. The primary URL equals the known
issue URL (or UNKNOWN for unresolved cells), and must occur exactly once among
endpoints. A cell can add multiple endpoints; no endpoint ID or known address can
belong to two cells. Existing endpoint address/provider/purpose/scope cannot drift,
cursors cannot regress and endpoint removal requires a reviewed migration.
Each endpoint requires endpoint_id, purpose, provider, address_or_ref, owner_proof,
scope, health, last_verified_utc, last_read_cursor, backup_priority, recovery_method,
signature_verification. Public GitHub evidence URLs, UNKNOWN, or non-sensitive
PRIVATE_REF identifiers are accepted. Actual private addresses are rejected; their
resolution belongs in an authorized private store outside this notebook. Placeholder
uniqueness does not prove the uniqueness of external accounts behind placeholders.
Health is an observation (UNKNOWN/RECENT_ACTIVITY_ONLY/DEGRADED/UNREACHABLE), not
proof of a live worker. Owner proofs/signatures remain independently unverified.

Patch fence correction: use FOUR backticks for the outer diff fence and extract only
that line-delimited fence. Patches can themselves contain triple-backtick strings
(e.g. tests), so a generic triple-fence regex truncates the patch and gives a different
hash. The publisher verifies exact extracted bytes and clean-base application.
