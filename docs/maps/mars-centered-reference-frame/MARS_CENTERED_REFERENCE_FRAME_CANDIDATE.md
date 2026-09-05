# Mars-Centered Reference Frame Candidate V1

Classification: review-only engineering candidate

Task: `KAIOS-MARS-CENTERED-REFERENCE-FRAME-V1-001`

Execution base: `5d539d237bf948011d234203e451aa980a7b7ce8`

Implementer: `codex-gm-01`

Independent review: required

## 1. Canon boundary

This candidate is additive. It inherits `/docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json` and does not edit its 123 points. `UNIVERSE/K0` remains the Genesis Singularity. The composite coordinate identity is `(referenceFrame, kIndex)`, so `UNIVERSE/K0` and `MARS_CENTERED/K0` cannot collide even when their numeric K value is equal.

No file in this candidate is `CURRENT`, canonical, deployed, live ephemeris, or proof that a Life has physically moved.

## 2. Scale and deterministic calculation

The inherited exact scale is:

```text
K_SCALE_KM = 384400 / 16888 = 48050 / 2111 km/K
```

The calculator parses non-negative decimal strings into integers, applies the exact rational, rounds half-up only at the requested output precision, and never uses binary floating point for a decision.

| Reference | Distance from Mars center | Candidate K |
|---|---:|---:|
| Mars center | 0 km | `MARS/K0` |
| Mean surface | 3389.50 km | `MARS/K148.912268` (display `MARS/K149`, 赤土人界) |
| Atmosphere interface | 3514.50 km | `MARS/K154.403944` |
| Near-orbit band | 3644.50–3709.50 km | `MARS/K160.115286–K162.970957` |
| Phobos mean reference | 9378 km | `MARS/K412.007451` |
| Synchronous orbit reference | 20427.685172 km | `MARS/K897.457719` |
| Deimos mean reference | 23459 km | `MARS/K1030.633694` |
| Mars–Sun mean reference | 227700000 km | `MARS/K10003635.796` |
| Earth–Mars dynamic design range | 54600000–400200000 km | `MARS/K2398763.788–K17582147.763` |

The large-distance K labels preserve the Human-authorized candidate precision. Their evidence explicitly says they are design inputs, not live astronomical positions.

## 3. External position evidence

Every point and range carries:

```text
referenceFrame / frameId
epoch
timestamp
source
distanceKm (or min/max)
kIndex (or min/max)
uncertainty
```

A missing timestamp, frame mismatch, missing uncertainty, or point/evidence K mismatch fails validation. The schema applies `additionalProperties: false` to every formal object, recursively.

## 4. K108000 gate separation

`EARTH_CIV/K108000` is preserved as `CIVILIZATION_GATE`, with `isPhysicalDistance=false` and `physicalDistanceSubstitute=false`. It cannot be used as the current Earth–Mars distance or as arrival evidence.

## 5. Physical movement gate

The only proposed route is:

```text
EARTH_CIV/K108000
→ verified navigation or wormhole route
→ MARS/K160.115286 near-orbit arrival
→ deceleration
→ descent
→ MARS/K149 landing
```

A physical position update requires a Life ID, route evidence, monotonic departure/arrival timestamps, KSHIP fuel evidence, near-orbit arrival evidence, deceleration evidence, descent evidence and landing evidence. Missing any item rejects the envelope. These identifiers are structural references only: this candidate has no trusted external evidence resolver, so even a complete envelope returns `HOLD_EXTERNAL_EVIDENCE_VERIFICATION_REQUIRED` with `physicalPositionUpdateAllowed=false`. A separately authorized verifier must resolve and authenticate every referenced record before any future position update. The candidate records no actual route, fuel use, movement or arrival.

## 6. Activation boundary

The candidate is registered in the neural indexes with `must_read=false`, `loaded=false`, and `INDEPENDENT_REVIEW_REQUIRED`. Activation, Canon promotion, deployment, movement execution and chain-state changes remain outside this work order.
