# K280 Test Report

Date: 2026-07-30

Status: `PASS`

## Automated Results

| Suite | Result |
|---|---:|
| K280 deterministic runtime | 24 / 24 |
| K280 package and boundary tests | 10 / 10 |
| Canonical organism implementation | 47 / 47 |
| Unique-life identity architecture | 86 / 86 |
| Company Boot runtime | 74 / 74 |
| Land Viewer Schema V2 compatibility | 33 / 33 |
| Existing World Viewer integrity suites | 10 / 10 |
| Existing World Viewer static acceptance | PASS, 76 files and 105 local references |

## Browser Results

Chrome/Playwright verified:

- desktop 1440 x 900
- tablet 820 x 1180
- mobile portrait 390 x 844
- mobile landscape 844 x 390

All four viewports loaded over local HTTP, rendered the K280 organism, exposed
the required controls, accepted a step action, updated the event timeline,
opened the Genome inspector, avoided page-level horizontal overflow, and
contained no wallet-connect control.

## Data and Security

- Repository JSON: 595 / 595 parse
- Changed-file UTF-8: 95 / 95
- Unexpected BOM: 0
- Corruption markers: 0
- Markdown local links: 201 / 201
- Secret-pattern hits: 0
- Unauthorized protected-path violations: 0
- `git diff --check`: PASS
- Production authority: false
- Wallet: none
- Real KGEN: disabled
- K11520 settlement: inactive

## Terminology

- Prohibited-term hits in new content: 0 / 0 / 0
- `神仙文明`: present
- `IMMORTAL_CIVILIZATION`: present
- Ordered high-stage transition: PASS

The browser and repository checks are rerun before merge and after deployment.
