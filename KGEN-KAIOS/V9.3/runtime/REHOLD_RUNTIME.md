# Re-Hold Runtime

**Runtime ID:** KAIOS-V9.3-RUNTIME-REHOLD  
**Purpose:** Return a released task to hold when a release problem appears before or after claim.

Before claim, re-hold returns `OPEN + RELEASED` to `OPEN + HOLD`. After claim, Codex blocks the task, preserves the branch and report, and creates a follow-up review.

