# Recovery: KAIOS Life Energy Cursor Handoff

Task ID: `KAIOS-CURSOR-LIFE-ENERGY-PAYROLL-CANDIDATES-001`

## Recovery Point

- Claim source main: `9f481900eb46ae38dd670d6a1bf8a6b784533f77`.
- Cursor response commit: `f07ebe7cebe90d26540fc50df03f34a6a985551c`.
- Cursor Draft PR: `#118`.
- Prior worker-registry active claims: `0`.
- Claim: `CLAIM-KAIOS-LIFE-ENERGY-PAYROLL-001-cursor-01`.
- Fencing token: `FENCE-KAIOS-LIFE-ENERGY-PAYROLL-001-R1`.

## Fail-Closed Recovery

If the lease expires, the branch diverges from the recorded lineage, a second
claim appears, or protected files are changed, stop Cursor work and open a Codex
revalidation PR. Release the claim in Worker Registry and every queue projection
in the same reviewed mainline transition. Do not delete PR `#118` or rewrite its
Cursor-authored evidence.

The deployed life-energy Runtime is outside this recovery scope and must not be
reverted or rewritten to recover a candidate handoff.

## Safety

Execution is manual only. No `CURSOR_API_KEY`, external wake workflow, wallet,
KGEN, mint, deployment, merge authority or external autonomy is authorized.
Claim activation uses a compare-and-set fast-forward update to `main`; it does
not merge a `codex/*` PR and therefore does not invoke the Cursor wake filter.
