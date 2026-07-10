# Codex Release Runtime

**Runtime ID:** KAIOS-V9.3-RUNTIME-CODEX-RELEASE  
**Purpose:** Apply the 20-point release checklist before Codex unlocks a dispatch-held task.

## Release Steps

1. Load WorkQueue.
2. Load V9.2 sync evidence.
3. Load V9.1 promotion evidence.
4. Run dependency, risk, priority and worker eligibility gates.
5. Produce release review.
6. If all gates pass, mark the task released and claimable.

The runtime is advisory. The final mutation is a Codex-reviewed commit.

