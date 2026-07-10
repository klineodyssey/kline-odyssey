# Dispatch Priority Policy

**Document ID:** KAIOS-V9.3-DISPATCH-PRIORITY  
**Version:** V9.3  
**Status:** Draft for Review

Codex does not release tasks by WorkQueue line number alone. Release order must consider risk, dependency status, worker availability, and domain priority.

## Priority Order

| Priority | Domain |
|---|---|
| P0 | Critical Governance / Security |
| P1 | Core Runtime / Canon |
| P2 | Product / Economy / Temple / Land |
| P3 | Documentation / Dashboard / Publishing |
| P4 | Research / Experimental |

## Tie Breakers

For equal priority, release order is:

1. Dependencies done.
2. Lower risk first.
3. Oldest approved first.
4. Asset conflict free.
5. Worker available.

`AI-ECONOMY-2026-0001` is P1/P2 boundary work: it is an economy task generated from V9 AI review, but it only asks for an advisory resource reserve report and has no protected-path or financial execution authority.

