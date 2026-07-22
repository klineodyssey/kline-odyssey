# KAIOS World Life Law V2.1 P1 Human Decision Packet

Status: `HUMAN_DECISION_REQUIRED`

Purpose: 整理 PR `#36` 尚未解決的五項 P1 Freeze 澄清，供 Human 選擇。本文是非規範性治理資料，不修改、啟用或凍結 World Life Law、Frozen Life OS、CURRENT、Runtime 或 Production。

## Decision Boundary

- Amendment 001 與 Amendment 002：`PRESERVED_PENDING_DECISION`
- Freeze：`NOT_APPROVED`
- PR `#36`：保持 `OPEN / DRAFT / UNMERGED`
- Runtime authority：`false`
- Human 必須逐項選擇或另行提出方案；Codex 推薦不是最終架構決定。

## Evidence

五項 P1 同時出現在 PR `#36` 的：

- `KGEN-KAIOS/life/World_Life_Law_V2_1_Baseline_Review.md`, section 8
- `KGEN-KAIOS/life/World_Life_Law_V2_1_Conflict_Matrix.json`, `clarifications`
- `KGEN-KAIOS/life/World_Life_Law_V2_1_Freeze_Readiness.json`, `p1_pre_freeze_clarifications`

Current main `e4bcd8da90309a9557ce2f8eaba83ef0f8d990d4` does not contain these amendment files. Current canonical World Life Law remains `HUMAN_APPROVED_ARCHITECTURE / NOT_FROZEN`.

## Decision Summary

| P1 ID | Topic | Codex recommendation | Human choice |
|---|---|---|---|
| `FZ-P1-001` | Death body and asset disposition | Option A | Pending |
| `FZ-P1-002` | Reincarnation birth and body binding | Option B | Pending |
| `FZ-P1-003` | Company role facets | Option A | Pending |
| `FZ-P1-004` | Profession vocabulary | Option A | Pending |
| `FZ-P1-005` | Normative source classification | Option A | Pending |

## FZ-P1-001: Death Body And Asset Disposition

**Original issue:** Define a sealed body record and physical-body disposition separately from memory/history preservation; define asset-succession references without granting Life OS ownership authority.

**Affected laws:** Law 02 Life Identity and Continuity, Law 07 Death Is Not Deletion, Law 14 Bloodline and Family Persistence, and Law 19 Life Cycle.

**Why it blocks Freeze:** The law preserves Life history, memory, Soul and succession, but does not make the post-death body record or asset-disposition boundary explicit. A frozen interpretation could incorrectly place property authority in Life OS or leave body evidence mutable.

### Options

- **Option A - Minimum separated records:** Require an immutable or sealed `body_record_id`, a governed body-disposition status, and external `asset_succession_ref` values. Body authority remains in the applicable Body/Species/Civilization domain; ownership and transfer remain in their property domain.
  - Impact: resolves the ambiguity with a small normative contract and no ownership transfer into Life OS.
- **Option B - Reference domain contracts only:** State only that body and asset disposition must be handled by separately approved domain contracts, without defining minimum fields in the law.
  - Impact: minimizes law detail but may leave incompatible implementations and may not fully close the Freeze gate.
- **Option C - Civilization profile policy:** Let each Civilization define body and succession rules under common evidence, consent and rights constraints.
  - Impact: supports cultural variation but requires a mandatory cross-civilization interoperability contract before Freeze.

**Codex recommendation:** Option A.

**Reason:** It closes the authority gap while preserving the frozen Life OS boundary and leaves physical handling and ownership in their proper domains.

| Impact area | Effect |
|---|---|
| Food Lifecycle | No direct change |
| Species Energy | No direct change |
| Guardian | Indirect: a guardian may receive care duties, never automatic ownership |
| NPC Compute Level | No change |
| Offline Protection | No change; offline absence cannot invoke death disposition directly |
| Life Activity | Indirect: terminal activity must reference the sealed death/body record |
| Dream | No direct change |
| Soul Journey | Indirect: cannot mutate sealed body or asset records without separate authority |
| Longevity | Indirect: clarifies the boundary after lifespan termination |
| Frozen Life OS | Compatibility-critical; no frozen file or `DEAD` invariant may change |
| Runtime compatibility | Requires domain adapters and stable references; no Runtime is authorized here |

## FZ-P1-002: Reincarnation Birth And Body Binding

**Original issue:** Require a new birth event and a new body identity for reincarnation, in addition to the already-required new Life ID.

**Affected laws:** Law 02 Life Identity and Continuity, Law 06 Player Spawn, Law 08 Reincarnation Is Governed Technology, and Law 19 Life Cycle.

**Why it blocks Freeze:** A new Life ID alone does not prove a new birth or prevent accidental reuse of the predecessor body. Freeze without an explicit binding rule risks turning reincarnation into resurrection of the same Life record.

### Options

- **Option A - Universal new physical body:** Every reincarnation requires a new Life ID, birth event and physical body ID.
  - Impact: simple for biological species but unsuitable for AI, Robot, Building or other non-biological Life classes.
- **Option B - Species-scoped new embodiment:** Every reincarnation requires a new Life ID and birth event plus a new `embodiment_id`; biological profiles bind it to a new body, while non-biological profiles bind it to a new approved vessel or instance. The predecessor remains sealed.
  - Impact: preserves the new-body invariant across all Life classes without fabricating biological DNA or anatomy.
- **Option C - Permit predecessor-body reuse:** Allow a new Life ID to reuse the former body under special authorization.
  - Impact: creates resurrection and lineage ambiguity and requires a separate exceptional-event architecture.

**Codex recommendation:** Option B.

**Reason:** It satisfies the required new-birth/new-body separation while remaining compatible with the law's biological and non-biological Life classes.

| Impact area | Effect |
|---|---|
| Food Lifecycle | Indirect: the new embodiment receives its own compatibility profile |
| Species Energy | Yes: the new embodiment binds a species/class energy contract |
| Guardian | Indirect: a new birth may require a separately authorized guardian relationship |
| NPC Compute Level | Indirect: a new AI/NPC instance receives an independently assigned compute profile |
| Offline Protection | No inherited offline state without explicit migration authority |
| Life Activity | New Life starts with a valid initial activity, not the predecessor's live activity |
| Dream | Dream records do not prove birth or embodiment |
| Soul Journey | Yes: Soul Journey cannot bypass new Life, birth and embodiment gates |
| Longevity | Yes: longevity does not convert predecessor continuity into reincarnation |
| Frozen Life OS | Preserves `DEAD` as terminal for the predecessor; no frozen mutation |
| Runtime compatibility | Requires species/class adapters and predecessor linkage; no implementation authorized |

## FZ-P1-003: Company Role Facets

**Original issue:** Normalize Company facets for Economic Entity, Employer, Producer, Consumer and Asset Owner, with each facet owned by its proper domain contract.

**Affected laws:** Law 03 Energy Dependency, Law 12 Company Organisms, Law 17 Company Lifecycle, Law 20 Species-Specific Energy, and Law 23 Everything Has Life.

**Why it blocks Freeze:** Company-as-Life does not itself grant employment, production, consumption, ownership or financial authority. Without normalized facets, implementations may infer those powers from Life status and collapse private, company and governance boundaries.

### Options

- **Option A - Facet registry with domain ownership:** Define five versioned facet identifiers and require each active facet to reference its authoritative employment, production, market, asset or legal contract.
  - Impact: clear authority separation, auditable capability activation and compatibility with company failure or liquidation.
- **Option B - Single Company aggregate:** Put all five facets directly inside one Company Life record.
  - Impact: simpler storage but mixes Life identity with legal, economic and ownership authority.
- **Option C - Optional profile tags:** Treat facets as descriptive tags with no fixed registry.
  - Impact: flexible but weakly typed and unsuitable for cross-company validation or Freeze.

**Codex recommendation:** Option A.

**Reason:** It keeps Company Life identity independent from legal powers and matches the already approved wallet, employment and asset-separation principles.

| Impact area | Effect |
|---|---|
| Food Lifecycle | Indirect: Producer and Consumer facets can reference food-domain contracts |
| Species Energy | Indirect: Company operating energy remains separate from Life value |
| Guardian | No direct change |
| NPC Compute Level | Indirect: Company operations may schedule agents but cannot set intelligence or rights |
| Offline Protection | No direct change |
| Life Activity | Indirect: `OPERATING` requires authorized active facets |
| Dream | No change |
| Soul Journey | No change |
| Longevity | No change |
| Frozen Life OS | No modification; Company remains a domain adapter/projection |
| Runtime compatibility | Requires stable facet IDs and domain references; no company Runtime authorized |

## FZ-P1-004: Profession Vocabulary

**Original issue:** Define a versioned profession vocabulary or registry-extension rule covering requested specialist roles, including Temple Keeper, Government, Factory and Feed Producer.

**Affected laws:** Law 17 Company Lifecycle, Law 18 NPC Integrity, and Law 22 Profession.

**Why it blocks Freeze:** The law permits professions but does not define whether profession names are a fixed enum, an open string or governed extensions. Implementations could create incompatible role names or silently grant authority through a job label.

### Options

- **Option A - Versioned core plus governed extensions:** Publish stable core profession IDs and a registry rule for Civilization-specific extensions. A profession ID describes work and never grants authority by itself.
  - Impact: interoperable core, controlled extensibility and explicit migration/version rules.
- **Option B - Fully open labels:** Permit any UTF-8 profession string with optional metadata.
  - Impact: maximum flexibility but poor validation, translation and cross-civilization compatibility.
- **Option C - Closed fixed enum:** Freeze one complete profession list; every new role requires a law amendment.
  - Impact: strongest uniformity but creates unnecessary constitutional churn and limits Civilization growth.

**Codex recommendation:** Option A.

**Reason:** It balances stable machine identity with cultural vocabulary and prevents profession names from becoming hidden permission grants.

| Impact area | Effect |
|---|---|
| Food Lifecycle | Indirect: Farmer, Fisher and Feed Producer gain stable role IDs only |
| Species Energy | No direct change |
| Guardian | No direct change; profession never creates guardianship |
| NPC Compute Level | Indirect: profession may inform workload but cannot determine compute or intelligence |
| Offline Protection | Indirect: profession tasks remain bounded by offline safety rules |
| Life Activity | Yes: work/training activities can reference stable profession IDs |
| Dream | No change |
| Soul Journey | No change |
| Longevity | No change |
| Frozen Life OS | No modification; profession belongs to Citizen/Civilization domains |
| Runtime compatibility | Requires versioned lookup and unknown-ID failure behavior |

## FZ-P1-005: Normative Source Classification

**Original issue:** Add a normative reference from the law to an approved source-classification contract before Freeze.

**Affected laws:** Cross-cutting across Laws 01-23, especially Law 08 Reincarnation, Law 09 Timeline, Law 20 Species-Specific Energy and Law 23 Everything Has Life.

**Why it blocks Freeze:** Science, KAIOS world setting, mythic interface and future technology are currently classified in review evidence, but the law does not normatively require that classification. Freeze could otherwise allow speculative or mythic statements to be presented as present-day science.

### Options

- **Option A - Versioned normative reference:** Approve a source-classification contract and reference its exact artifact ID, version and integrity hash from the cumulative law. Updates require governed versioning and review.
  - Impact: one authoritative classification source with reproducible evidence and minimal duplication.
- **Option B - Embed classifications in the law:** Copy the full classification rules and concept matrix into the cumulative World Life Law.
  - Impact: self-contained law but duplicated content and higher amendment burden.
- **Option C - Keep classification informative:** Continue treating the current source-classification file as review evidence only.
  - Impact: preserves flexibility but does not close the normative Freeze gap.

**Codex recommendation:** Option A.

**Reason:** A pinned, versioned reference provides semantic integrity without expanding the main law or silently converting review evidence into authority.

| Impact area | Effect |
|---|---|
| Food Lifecycle | Classification only; no nutrition behavior change |
| Species Energy | Yes: distinguishes real science, simulation rules and future energy claims |
| Guardian | Classification only; no relationship authority change |
| NPC Compute Level | Classification only; compute remains distinct from intelligence and rights |
| Offline Protection | Classification only; no safety reduction |
| Life Activity | Classifies simulation activities and future capabilities |
| Dream | Yes: remains a mythic/mental interface, not direct Reality rewrite |
| Soul Journey | Yes: remains mythic-interface behavior unless separately authorized |
| Longevity | Yes: separates current science, world setting and speculative technology |
| Frozen Life OS | Reference must not alter frozen files or invariants |
| Runtime compatibility | Runtime must expose classification/version evidence; no Runtime enabled here |

## Human Decision Form

Human may answer with one selection per item:

```text
FZ-P1-001: A / B / C / CUSTOM
FZ-P1-002: A / B / C / CUSTOM
FZ-P1-003: A / B / C / CUSTOM
FZ-P1-004: A / B / C / CUSTOM
FZ-P1-005: A / B / C / CUSTOM
FREEZE: NOT_APPROVED
```

After Human decides all five items, a separately authorized amendment may update the Architecture candidate. Freeze still requires a repeat baseline review and an explicit Human Freeze decision.
