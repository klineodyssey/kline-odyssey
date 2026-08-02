# KAIOS Cursor Forest Life Package Review Closeout

Task ID: `KAIOS-CURSOR-FOREST-LIFE-PACKAGES-001`

Worker: `cursor-01`

Reviewer: `codex-gm-01`

Final status: `RELEASED / CURSOR_RESEARCH_CANDIDATE_ONLY`

## Delivery

- Branch: `cursor-handoff/KAIOS-CURSOR-FOREST-LIFE-PACKAGES-001`
- Draft/merged PR: `#87`
- Initial candidate commit: `6feccef5d7d9cbeabc74fe2fd02dab2018c6ee2a`
- Model/oracle repair: `6d9548b6e6c48c45d2a0c219d6451e389ec9ae3c`
- Provenance repair: `839f4a9c42375e56e89ca24e3342a4419ebbecd4`
- Final repair: `7d63c7bf64af132bfd83526b21f1b0ab528d411e`
- Merge commit: `176e8b96e40894a542da5823c436e9d49f663f0e`

The six approved files remain candidate research. They compose existing Tree,
Grass, Soil, Water, River and Ecology owners and do not introduce a Runtime or
Canonical Life type.

## Review

Initial independent review found two P1 and two P2 issues: rainfall conversion,
missing numerical replay oracle, missing energy accounting and incomplete
provenance. Re-review then found checkout-dependent hashes and ECMAScript
floating-point replay drift. Cursor repaired the same task and branch without a
parallel claim.

Final independent result:

- `P0 = 0`
- `P1 = 0`
- `P2 = 0`
- Decision: `APPROVED_AS_CANDIDATE_RESEARCH`

## Validation

- Required files: `6 / 6 PASS`
- Numeric parameter contracts: `43 / 43 PASS`
- JSON and duplicate keys: `PASS / 0`
- Git-blob provenance: `5 artifacts x 6 sources PASS`
- Rainfall conversion: `2 L/m2/day x 100 m2 x 2 days = 400 L PASS`
- Fixed-point replay: `PASS`
- Expected SHA-256: `1802f41c085121f051ce165212b762ae2503a7d7153aa1067defe5d8e88afe1e`
- Water, mass, nutrients and energy: `BALANCED`
- UTF-8/BOM: `PASS / 0`
- Secrets/protected violations: `0 / 0`
- `git diff --check`: `PASS`

## Authority

No Canonical promotion, Runtime, CURRENT, Wallet, KGEN, Rights authority,
Economy authority, deployment or Production authority change occurred.

The task is formally closed and its lease is released. The next explicit task
envelope is `KAIOS-CURSOR-CROP-LIFE-PACKAGES-001`.
