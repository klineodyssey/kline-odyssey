# KAIOS Life Energy, Economy and Payroll V0 Test Plan

## Specification Gates

- all JSON Schemas parse and require simulation boundaries;
- life existence validates with `NO_ACCOUNT`;
- agency and economic capability vary independently;
- no specification equates missing wallet with nonlife or prey status;
- KGEN, chain transfer, private key and issuance commands are absent;
- Cursor envelope is candidate-only and has no active claim.

## Runtime Gates

- balanced reservation, release, refund and transfer entries;
- no duplicate payroll, silent mint or negative resource inventory;
- rejected work has no pay; rework holds escrow;
- missing wallet blocks pay but preserves worker life;
- AI pay enters the AI wallet before contracted transfers;
- ant and bee credits cannot create food, nectar, honey or energy;
- starvation/shortage occurs despite positive credits when inventory is empty;
- deterministic replay, export/import/reset and state hashes;
- public APIs are static/read-only;
- World Viewer desktop/mobile, keyboard navigation and warnings;
- Company Boot, Canonical Life, Player Genesis, AI Company, Physical Labor,
  Supply Chain, Ecology and World Viewer regressions;
- JSON, Markdown links, UTF-8, BOM, corruption, secrets, protected paths and
  `git diff --check`.

Required review gates: `P0=0`, unresolved `P1=0`, unresolved `P2=0`.
