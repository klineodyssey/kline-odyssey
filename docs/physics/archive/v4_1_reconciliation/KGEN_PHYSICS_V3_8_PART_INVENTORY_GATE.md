# KGEN Physics V3.8 — Full PART Preservation Gate for V4.1

STATUS: ACTIVE_RECONCILIATION_GATE
SOURCE_OF_TRUTH: FALSE
TARGET: V4.1 cumulative runtime installation
DATE: 2026-08-20 Asia/Taipei

## Purpose

This gate exists because an earlier V4.1 construction attempt accidentally summarized away thousands of inherited V3.8 lines. That candidate was removed before main was touched. V4.1 must be a cumulative civilization runtime, not a summary.

## Verified mother source

- `docs/physics/KGEN_Universe_Physics_Runtime_V3_8.md`
- `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`
- On protected main these are the inherited V3.8 living Physics source and must remain intact during reconciliation.

Repository search confirms late-numbered PART material (including PART 99) exists in V3.8/CURRENT, so coverage cannot be inferred from the V4.0 publication table of contents or from early PART samples alone.

## Preservation rule

Every V3.8 `# PART ...` top-level section is PRESERVE by default.

A V3.8 section may change only under one of these classifications:

- `PRESERVE_EXACT`: retain inherited text/semantics.
- `PRESERVE_AND_EXPAND`: retain inherited material and append later accepted civilization physics.
- `SUPERSEDE_WITH_HISTORY`: active rule changes, but old rule remains explicitly recorded as historical/superseded and the replacement is named.

There is no `DROP_WITHOUT_RECORD` state.

## Known mandatory supersession / expansion areas

### Mass unit

Historical V3.8 active text contains `1 KGEN = 1 kg`. Later KAIOS executable/candidate lineage establishes the White-Hole civilization scale `1 KGEN = 1000 kg`, `1 KAIOS = 1 kg`, `1 KUFO = 1 g`, `1 KSHIP = 1 mg`.

V4.1 handling: `SUPERSEDE_WITH_HISTORY`, not deletion of the Black/Dark Civilization-era rule.

### Program-life composition

V3.8 contains the early software metaphor `Folder=Body, File=Organ, Function=Cell`. The 2026-08-09 Scale & Planck review candidate adds a richer orthogonal composition axis `KLIFE→KCELL→KORGAN→KMOLECULE→KATOM→KPARTICLE→KQUANTUM` and explicitly says this supersedes simplistic use of `Function=Cell` as the only mapping.

V4.1 handling: preserve the historical metaphor and expand with the newer composition/taxonomy separation; do not erase either context.

### Distance scale

V3.8 K-scale geometry and map anchors remain civilization coordinate material. Later Scale/Planck and Pre-Spacetime material explicitly separates mass scale, coordinate scale, taxonomy and composition and blocks unapproved universal pointId→km inference.

V4.1 handling: `PRESERVE_AND_EXPAND` with a dimensional safety rule.

### KUFO / KSHIP

V3.8 later physics already contains KUFO/KSHIP material absent from the July V4.0 publication summary. The 2026-08-09 candidate contains a direct KUFO burn→KSHIP model, while PR #158 proposes a newer KUFO birth/half-life/decay→KSHIP lineage.

V4.1 handling: preserve history, but do not activate both transformation semantics simultaneously. PR #158 remains unmerged/un-deployed until review resolution.

### Time

V3.8 `T=Time Flow`, CT Time Market and inherited time semantics remain. New civilization-time aliases and Planck/log-time boundaries are additional axes, not replacements for T or CT.

V4.1 handling: `PRESERVE_AND_EXPAND`.

## Full-body acceptance tests

Before creating V4.1/CURRENT twins:

1. Enumerate every top-level V3.8 PART heading from the complete source, not search snippets.
2. Record each heading and its V4.1 disposition.
3. Require 100% disposition coverage.
4. Require no unexplained deletion of inherited text.
5. Require all superseded rules to name replacement and historical status.
6. Require V4.1 byte size / line count sanity check against V3.8; a dramatic shrink is automatic FAIL.
7. Require V4.1 and CURRENT same Git blob.
8. Require V3.8 historical file unchanged.
9. Archive only after all above pass.

## Current status

Mother V3.8 preserved on main: PASS.
Earlier truncated V4.1 candidate removed from active branch: PASS.
Late PART presence (PART 99) independently confirmed: PASS.
Complete machine enumeration of all V3.8 PART headings: PENDING.
Per-PART disposition coverage: PENDING.
True cumulative twin generation: BLOCKED until enumeration/disposition PASS.
