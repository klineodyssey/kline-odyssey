---
TITLE: "KAIOS World Viewer V1 Security and Privacy Review"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "INTERNAL_REVIEW_PROPOSAL"
EXTERNAL_REVIEW: "STILL_REQUIRED"
IMPLEMENTATION: "NOT_STARTED"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "HUMAN_REVIEW_REQUIRED"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-WORLD-VIEWER-INDEPENDENT-REVIEW-001"
CHANGE_REASON: "Review client trust, land proposal authorization, GPS privacy, static hosting and future command boundaries."
ANCESTOR: "KGEN-KAIOS/world-viewer/WORLD_VIEWER_ARCHITECTURE.md"
SOURCE_OF_TRUTH: false
---

# World Viewer Security And Privacy Review

## 1. Security Judgment

The proposal has the correct primary boundary: the browser is a display and intent client, not the ownership registry. Security is strong enough for architecture continuation, but any future proposal submission needs explicit replay, tenant and stale-state controls before baseline freeze.

## 2. Trust Boundaries

```text
Public GitHub Pages assets
  UNTRUSTED CLIENT
  - display public snapshots
  - navigate, select, inspect
  - create local draft intent

Future authenticated projection service
  TRUSTED READ FILTER
  - session-scoped fields
  - owner/governor capability projection

Future command gateway
  TRUSTED COMMAND BOUNDARY
  - authenticate
  - authorize
  - validate snapshot and parcel
  - prevent replay
  - submit governed proposal

Land Registry / Review / Settlement
  AUTHORITATIVE STATE
  - evidence
  - review
  - approval
  - registry update
  - immutable audit
```

GitHub Pages cannot hold private credentials or authorize writes.

## 3. Threat Register

| ID | Threat | Impact | Required control | V1 static behavior |
|---|---|---|---|---|
| WV-SEC-001 | User edits frontend state to claim ownership | Critical | Server-side owner/governor and registry validation | No mutation endpoint |
| WV-SEC-002 | Forged Parcel ID | High | Stable ID lookup plus source revision and geometry validation | Local preview marked unsubmitted |
| WV-SEC-003 | Disabled action manually invoked | High | Authorization independent of UI state | Submission unavailable |
| WV-SEC-004 | Proposal replay | High | Nonce, idempotency key, expiry and audit | No remote submission |
| WV-SEC-005 | Cross-player private data read | Critical | Tenant/session scoped projection and field allowlist | Public projection only |
| WV-SEC-006 | Stale snapshot overwrites newer state | High | Optimistic concurrency with source revision | Preview invalidated on mismatch |
| WV-SEC-007 | Exact GPS leakage | Critical | Coarse conversion, memory-only handling, no URL/log persistence | Mock GPS only |
| WV-SEC-008 | External map provider tracks precise use | Medium | Provider privacy review, proxy/neutral fallback | No provider selected |
| WV-SEC-009 | XSS through labels or metadata | High | Text-only rendering, sanitization and CSP | Architecture requirement |
| WV-SEC-010 | Dependency compromise | High | Version pinning, license/integrity review, minimal dependencies | No dependency selected |
| WV-SEC-011 | Cache exposes session data | High | Public/private cache separation and no persistent sensitive cache | Public snapshots only |
| WV-SEC-012 | Clickjacking or deceptive overlay | Medium | Frame policy and visible source/proposal state | Require hosting headers where available |
| WV-SEC-013 | Parcel overlap hidden by projection | High | Canonical geometry conflict check outside client | Fail closed on invalid geometry |
| WV-SEC-014 | Data freshness disguised as current | High | `generated_at`, `stale_after`, source revision and visible status | Inspector labels freshness |
| WV-SEC-015 | GPS treated as Starter Parcel entitlement | Critical | Separate application/review/grant workflow | GPS focus only |

## 4. Proposal Contract

The local V1 draft should expose:

```text
LandUseProposalDraft {
  proposal_id
  parcel_id
  requester_id
  requested_land_use
  current_land_use
  reason
  estimated_cost
  environment_impact
  neighbor_impact
  required_permissions
  evidence
  source_snapshot_id
  source_geometry_revision
  capability_reference
  created_at
  review_status
}
```

A future remote command additionally requires server-issued or server-validated:

```text
authentication_context
tenant_id
nonce
idempotency_key
issued_at
expires_at
request_signature_or_session_binding
authorization_result
ownership_validation_result
zone_validation_result
audit_id
```

Client-provided authorization results are hints only and must be recomputed.

## 5. Authorization Rules

Context actions may be enabled only when a trusted projection says the current player has an eligible capability such as Owner, delegated Governor or an explicitly scoped representative. Even then, the action creates a proposal, not approval.

If capability is absent, stale, restricted or disputed:

```text
DISPLAY: DISABLED or READ_ONLY
SUBMISSION: DENIED
REASON: ACCESSIBLE AND NON-SENSITIVE
```

Hiding a menu item is not a security control.

## 6. Inspector Data Classification

| Group | Examples | Display rule |
|---|---|---|
| Canonical Data | Parcel ID, Global UID, canonical coordinate, Surface K, source revision | Display approved public/session projection only |
| Viewer Data | Screen projection, LOD, camera state, freshness | Clearly label as derived/non-authoritative |
| Proposal Data | Requested use, estimated impacts, review status | Separate visually from current land state |
| Unknown Data | Missing, unresolved, stale or restricted values | Use `UNKNOWN`, `STALE` or `RESTRICTED`; never fabricate zero |

Owner, Governor, Tax Authority, Defense Authority and Airspace Authority are distinct fields. The viewer must not collapse them into one owner label.

## 7. GPS And Starter Parcel Privacy

Approved architecture flow:

```text
Mock Login
-> explicit Mock Location Consent
-> coarse Region/City value
-> Viewer focus
-> Synthetic Starter Parcel Application
-> Mock Review
-> Virtual Parcel Grant fixture
```

Rules:

- Real KYC and real GPS providers are out of scope.
- GPS is never ownership, legal address or identity proof.
- Exact coordinates are not placed in URLs, analytics, public logs, static JSON or screenshots by default.
- No continuous tracking or movement history.
- Denial preserves account/manual navigation.
- Consent is purpose-specific, revocable and not bundled with basic map viewing.
- Public maps show no private residence-to-person linkage.

## 8. Privacy Data Minimization

The public viewer may show only fields approved for public disclosure. Session projections must be field-level allowlists and should prefer aggregates for Population and AI Workers.

Never deploy:

- Raw KYC documents or status evidence.
- Precise private GPS.
- Authentication tokens or session cookies in repository assets.
- Private wallet data, seed phrases or signing material.
- Personal email, device IP history or local filesystem paths.
- Unrestricted owner-to-residence mappings.

## 9. Static Hosting Controls

Before implementation review:

- Pin and review external dependencies.
- Prefer vendored or integrity-checked assets where licensing permits.
- Define a restrictive Content Security Policy compatible with static hosting.
- Avoid inline executable code where practical.
- Render repository data as text, not trusted HTML.
- Keep all URLs compatible with `/kline-odyssey/` deployment.
- Do not store secrets in workflow, source, query strings or local storage.
- Provide neutral fallback when external map services fail.

## 10. Accessibility And Security

Security states must remain perceivable:

- Disabled actions expose a non-sensitive reason.
- `PENDING_PROPOSAL` is distinguishable from approved/current use without relying only on color.
- Focus cannot move behind an open context menu or bottom sheet.
- Error messages do not leak private identifiers.
- Screen-reader announcements never include exact private location.

## 11. Security Stop Conditions

Implementation must stop if any requirement needs:

1. Browser-to-GitHub writes.
2. Client-side ownership authority.
3. Real KYC or real GPS without separate Human approval and privacy review.
4. Secrets in the repository or static Pages assets.
5. A direct registry mutation from a context menu.
6. Unreviewed third-party map or analytics code.
7. Cross-player private coordinate exposure.
8. Runtime CURRENT, Universe Map or frozen baseline modification.

## 12. Review Result

Security score: `93/100`. Privacy score: `94/100`.

The static read-only architecture may proceed to Human amendment review. External security/privacy review is still required before any authenticated projection, real location adapter or command gateway is planned.

