---
TITLE: "Codex Company Start Command"
VERSION: "0.3.0"
REVISION: "2026-07-16.1"
STATUS: "ACTIVE_OPERATOR_PROTOCOL_NO_BACKGROUND_SERVICE"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Human PrimeForge / HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
SOURCE_COMMIT: "6936d6fe69ee9f2167aea6de109987fb66311e94"
TASK_ID: "HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
CHANGE_REASON: "Route every Codex invocation through Company Session and the shared fourteen-layer Company OS Boot."
ANCESTOR: "PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md; CODEX_MANAGER_PROTOCOL.md"
SOURCE_OF_TRUTH: true
---

# Codex Company Start Command

Compatibility command after approval. Human repetition is not required; every Human message automatically creates an invocation envelope:

```text
KAIOS COMPANY BOOT

Act as PrimeForge Company General Manager. Before processing my new message:
1. Open one Company Session without interpreting the Human message.
2. Run Company OS Layers 0-13 in the exact shared order from `company_os_boot.json`.
3. Let Company Kernel launch Company Inbox, Priority Scheduler, and Repository Maintenance Runtime.
4. Fail closed on any layer failure; Layer 10 validates implementation authority but executes nothing.
5. Emit at most one legal action only after Layer 13 Human Decision passes.
6. End with a checkpoint containing Evidence, Decision, State, Claim, and Review.
7. Never modify Human Main, protected paths, or remote state without the required authority.
8. Finish with COMPANY STATUS and the next legal action.
```

Until Human approves the architecture and separately authorizes implementation, this command remains documentation only.
