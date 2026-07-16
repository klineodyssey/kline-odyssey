---
TITLE: "KAIOS Boot Screen UI Architecture"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_HUMAN_REVIEW"
ARCHITECTURE: "ONLY"
IMPLEMENTATION: "NOT_STARTED"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "HUMAN_REVIEW_REQUIRED"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-KAIOS-BOOT-RUNTIME-001"
HUMAN_DECISION_ID: "HUMAN-KAIOS-BOOT-RUNTIME-001"
CHANGE_REASON: "Define a truthful verification-led Boot Screen instead of a generic loading screen."
ANCESTOR: "KGEN-KAIOS/boot-runtime/KAIOS_BOOT_RUNTIME.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationInterface
PHYLUM: UIArchitecture
CLASS: BootScreen
ORDER: VerificationStatus
FAMILY: KAIOS
GENUS: BootRuntime
SPECIES: KAIOSBootScreenArchitecture
CANONICAL_FILE: "KGEN-KAIOS/boot-runtime/KAIOS_BOOT_UI_FLOW.md"
---

# KAIOS Boot UI Flow

## 1. Product Role

The Boot Screen is a real-time projection of verification evidence. It is not a timer, decorative loading animation or authority source. The UI cannot mark a gate `PASS`, skip a gate or activate a Character.

## 2. Visible Verification Groups

```text
UNIVERSE PHYSICS
LIFE
MIND
CIVILIZATION
PLAYER
LAND
MARKETPLACE
```

Group mapping:

| UI group | Runtime gates |
|---|---|
| Universe Physics | Client, Asset, Physics, Physics Database |
| Life | Species OS, Individual Life OS, DNA, Organ, Body, Integrity |
| Mind | Mind Runtime, Memory |
| Civilization | Civilization Runtime |
| Player | Player Runtime, AI Worker, Save Data, Character |
| Land | Land Registry |
| Marketplace | Marketplace |

## 3. Screen Flow

```text
POWER ON
-> Create Boot Session
-> Show ordered verification timeline
-> Advance only from gate evidence
-> On PASS, expose next gate
-> On FAIL, stop and show safe incident summary
-> On all required PASS, enable ENTER WORLD
-> Revalidate session
-> ENTER WORLD
```

## 4. Gate Presentation States

```text
WAITING
VERIFYING
PASS
PASS_NOT_APPLICABLE
FAIL
BLOCKED
```

Requirements:

- `WAITING` is neutral and does not imply progress.
- `VERIFYING` may show activity but no fake percentage.
- `PASS` includes source/version freshness where disclosure is safe.
- `FAIL` names the affected gate, safe reason and incident ID.
- `BLOCKED` identifies the dependency that failed.
- Color is never the only state indicator; icon, label and pattern/text are required.

## 5. Layout

Desktop:

```text
Top: KAIOS / World / Player-safe identity / Boot Session
Center: ordered verification timeline
Side or lower detail: selected gate source, version, freshness, safe status
Bottom: Retry, Select Character, Recovery Review, Exit
Final: ENTER WORLD
```

Mobile:

- Compact status header.
- Vertical gate timeline.
- Expandable gate details.
- Sticky safe action area.
- `ENTER WORLD` remains disabled until eligibility passes.
- No desktop multi-column shrink that makes status unreadable.

## 6. Failure Screen

Failure displays:

```text
Boot status: FAILED_CLOSED
Failed group
Failed gate
Safe failure code
Incident ID
Completed gate count
Blocked gates
Permitted next actions
```

It must not expose secrets, private DNA, raw memory, exact private GPS, private keys, security internals or unrestricted stack traces.

Permitted actions depend on evidence:

- Retry with a new Boot Session.
- Restore a verified checkpoint.
- Select another verified Character.
- Open recovery/review request.
- Exit safely.

There is no `Continue Anyway` action.

## 7. Enter World Control

`ENTER WORLD` is a command request, not local activation. It is enabled only when:

1. Final status is `READY_TO_ENTER`.
2. All required gates are `PASS`.
3. Every `PASS_NOT_APPLICABLE` has an approved reason.
4. No result is stale.
5. Player and Character IDs match the Boot Session.
6. Life Integrity is `PASS`.
7. Revalidation succeeds.

If any condition changes, the control disables immediately and returns to verification.

## 8. Accessibility

- A semantic ordered list exposes gate order and state.
- Status changes use a polite live region; failure uses an assertive but concise alert.
- Keyboard can inspect gates and activate allowed recovery actions.
- Focus moves to the failed gate summary without trapping the user.
- Reduced motion removes decorative transitions.
- Text scaling preserves status, incident ID and actions.
- High contrast and non-color status labels are mandatory.
- Progress is reported as verified gates, not elapsed animation percentage.

## 9. Offline And Service Failure

Because every listed verification is mandatory in this decision, unavailable required services produce `FAIL` or `BLOCKED`, not a false offline world entry. A future offline-mode proposal would require separate Human architecture approval and an explicit reduced source set.

## 10. Architecture Boundary

No HTML, CSS, JavaScript, artwork, animation, login UI, verifier, network request or world transition is created by this document.

