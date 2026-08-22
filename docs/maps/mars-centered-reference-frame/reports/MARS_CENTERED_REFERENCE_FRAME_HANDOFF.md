# Mars-Centered Reference Frame — Durable Handoff

Task: `KAIOS-MARS-CENTERED-REFERENCE-FRAME-V1-001`

Candidate status: `REVIEW_ONLY_CANDIDATE`

Execution base: `f507724d1876c28e3d24a7316c440ea9304a5228`

Implementer: `codex-gm-01`

Independent review: `REQUIRED`

## Review decision

GO for independent source review as a Draft PR. NO-GO for Canon promotion, runtime loading, deployment, physical movement, or any chain-state operation until an independent reviewer accepts the frame/evidence semantics and exact-head CI passes.

## Evidence boundary

- The V10.2 base remains unchanged and records 123 points.
- `MARS/K0` is local-only; `UNIVERSE/K0` remains Genesis.
- Mars mean surface deterministically calculates to `K148.912268` and displays as `K149` / 赤土人界.
- `EARTH_CIV/K108000` remains a non-distance civilization gate.
- External-body positions are work-order design references, not live ephemerides.
- Missing timestamp or incomplete physical-movement evidence fails closed.
- Neural registration is present but boot/runtime loading is disabled.

## Verification commands

```bash
node --test docs/maps/mars-centered-reference-frame/tests/*.test.mjs
node --test tests/*.test.mjs
find docs/maps/mars-centered-reference-frame neural -type f -name '*.json' -print0 | xargs -0 -n1 jq empty
git diff --check origin/main...HEAD
```

The GitHub workflow emits an artifact named `mars-reference-frame-exact-head-evidence-<sha>` containing `GITHUB_SHA`, file digests and test output. The artifact—not this self-changing source file—is the exact-head binding.

## Prohibited claims and actions

No merge, deployment, proxy upgrade, payment, token transfer, KSHIP burn, governance execution, Mainnet transaction, private-key output, canonical declaration, live ephemeris claim or physical movement occurred.

## Open review items

- P0: none in candidate construction.
- P1: independent reviewer acceptance and exact-head GitHub CI are required before any progression beyond Draft.
- P2: authoritative ephemeris integration and quantified uncertainty remain future work; they are not implied by these design inputs.
