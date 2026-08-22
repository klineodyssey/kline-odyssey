# Mars-Centered Reference Frame Candidate

Status: `REVIEW_ONLY_CANDIDATE`

Implementer: `codex-gm-01`

Independent review: `REQUIRED`

This directory adds one derived, local Mars coordinate frame without changing the shared Universe map:

- `UNIVERSE/K0` remains the Genesis Singularity.
- `MARS_CENTERED/K0`, displayed as `MARS/K0`, is only the local Mars center.
- `EARTH_CIV/K108000` remains a civilization/wormhole gate, not a physical Earth–Mars distance.
- External-body values are signed-work-order design inputs with timestamp and uncertainty labels, not live ephemerides.
- A Life cannot change its physical position to Mars without route, time, KSHIP, arrival, deceleration, descent and landing evidence.

## Files

- `data/mars-centered-reference-frame.candidate.json` — closed candidate data.
- `schemas/mars-centered-reference-frame.schema.json` — recursively closed formal schema.
- `runtime/mars-coordinate-calculator.mjs` — exact rational coordinate conversion and fail-closed evidence checks.
- `tests/mars-coordinate-calculator.test.mjs` — deterministic frame, evidence and movement tests.
- `MARS_CENTERED_REFERENCE_FRAME_CANDIDATE.md` — cumulative specification.
- `reports/MARS_CENTERED_REFERENCE_FRAME_HANDOFF.md` — durable review handoff.

Nothing here deploys a runtime, changes an existing coordinate, moves a Life, or claims current astronomical position.
