# Recovery: Creator Marketplace V1

Rollback is additive and non-destructive:

1. Revert the implementation merge commit.
2. Remove the homepage, Full Viewer and README links introduced by that revert.
3. Confirm `/world-viewer/player-genesis/`, `/world-viewer/ai-company-v1/`, `/world-viewer/life-energy-payroll/` and their APIs remain unchanged.
4. Rerun the complete World Viewer regression suite.

No Player Genesis state migration, real wallet, KGEN, on-chain state, CURRENT authority or Constitution source is involved.

