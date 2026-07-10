# Priority Runtime

**Runtime ID:** KAIOS-V9.3-RUNTIME-PRIORITY  
**Purpose:** Rank dispatch-held tasks by impact, dependency completion, risk, age, asset conflict and worker availability.

The runtime prevents a simple first-line dispatch rule. A lower-line P0 security task may release before an older P3 report task. In V9.3, `AI-ECONOMY-2026-0001` is eligible because it is a simulation-only economy review with completed upstream sync evidence.

