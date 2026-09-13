# KGEN Universe Physics V4.1 — Active Supersede & Extension Layer

STATUS: READY_FOR_CUMULATIVE_INSTALLATION
SOURCE_OF_TRUTH: FALSE_UNTIL_TWIN_INSTALL
TARGET_VERSION: V4.1
TARGET_FILES:
- docs/physics/KGEN_Universe_Physics_Runtime_V4_1.md
- docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
DATE: 2026-08-20 Asia/Taipei

This layer contains only rules newer than, or explicit clarifications of, the complete V3.8 body. At final installation the complete V3.8 body MUST remain in the same document. This file alone is NOT the Physics Runtime.

## 1. Precedence

At V4.1 installation:

```text
V4.1 ACTIVE SUPERSEDE / EXTENSION RULES
>
V3.8 PART 102+ active supersede/final-law rules
>
older historical rules retained in the cumulative body
```

Historical text is never erased merely because a later rule supersedes it.

## 2. Active mass scale — unchanged from V3.8 PART 102

```text
1 KGEN  = 1000 kg
1 KAIOS = 1 kg
1 KUFO  = 1 g
1 KSHIP = 1 mg

1 KGEN  = 1000 KAIOS
1 KAIOS = 1000 KUFO
1 KUFO  = 1000 KSHIP maximum lineage scale
```

Old `1 KGEN = 1 kg` remains historical Black/Dark Civilization text and MUST NOT be used for CURRENT calculations.

## 3. Three Realms and civilization time aliases

KAIOS Three Realms:

```text
地界
人界 — K280 Earth-surface biological / human reference world
天界 — higher civilization world containing 仙 / 神 ranks
```

Accepted civilization-time equivalence for the same K280 duration:

```text
1 K280 Earth-surface year
= 1 K18888 Heaven day
= 1 Chain-Realm hour
= 1 Solar-Realm minute
= 1 Galactic-Realm second
```

This is a KAIOS civilization-time alias system. It does NOT change BNB Chain `block.timestamp`, and it is not an empirical claim that real astronomical clocks run at those ratios.

The earlier draft idea `1 K111111 Divine-Army hour = 1 K280 year` is NOT active unless separately re-authorized. The currently accepted one-hour alias is the Chain-Realm hour.

## 4. K280 year integer chain implementation

V3.8 defines:

```text
1 K280 year = 365.2422 K280 days
```

For integer-second implementation:

```text
365.2422 × 86400 = 31,556,926.08 seconds
K280_YEAR_SECONDS = 31,556,926
ROUNDING_POLICY = FLOOR_TO_INTEGER_SECOND
```

Therefore the KUFO half-life implementation parameter may use:

```text
KUFO_HALF_LIFE_SECONDS = 31,556,926
```

This is a chain implementation of the existing V3.8 half-life Canon, not a change to BNB Chain time.

## 5. Space Elevator / Time / Genesis separation

Existing Signed Universe map law remains:

```text
for x != 0:
m = |x|
k = floor(log10(m))
alpha = m / 10^k
phase theta = 0 for x>0; pi for x<0
```

V4.1 clarification:

```text
x = 0
```

is outside the ordinary logarithmic formula domain. Project Canon may name K0 / T0 a Genesis boundary, but that naming does not prove a real cosmological singularity location.

`TIME_SCALE_LEVEL_0 = 1 second` may be used for a logarithmic time-scale coordinate if a future Time Elevator is implemented. It MUST NOT be confused with `GENESIS_T0`.

## 6. Planck boundary

Use KPLANCK only as a real-physics reference boundary / quantum-gravity scale concept, not as a smallest material particle and not as experimentally proven discrete spacetime.

Reference values already recorded in project review material:

```text
Planck length ≈ 1.616255e-35 m
Planck time   ≈ 5.391247e-44 s
Planck mass   ≈ 2.176434e-8 kg
```

```text
PLANCK_BOUNDARY != GENESIS_T0
PLANCK_TIME != PROVEN_MINIMUM_TIME
```

Real-physics reference facts and KAIOS civilization Canon must remain separately labelled.

## 7. Coordinate point ID is not a universal physical distance

Historical V3.8 PART 22/63 linearly derives `1 K-index ≈ 22.761724 km` from the K16888 Moon anchor. V4.1 retains that historical derivation but supersedes its use as a universal conversion law.

Active rule:

```text
pointId != distanceKm
GLOBAL_LINEAR_K_INDEX_TO_KM = SUPERSEDED
```

K16888 may remain a Moon civilization anchor associated with the 384400 km Earth-Moon reference, but one anchor does not authorize:

```text
distance(A,B) = |pointIdA-pointIdB| × constantKm
```

for every universe point.

A physical route distance requires an explicit coordinate frame / route function / anchor model. Therefore the historical trial calculation from K280 to K72000 of about 1.632 million km is NOT CURRENT Canon.

## 8. K72000 and real Big Bang separation

```text
K72000 = KAIOS universe-map civilization point named 大爆炸奇點
K0     = project Genesis boundary concept in the inherited Physics body
```

Neither point is a scientifically established physical location of the real cosmological Big Bang relative to Earth.

## 9. Negative coordinates / K-37.63 oil

Using Signed Universe Math:

```text
x = -37.63
m = 37.63
k = 1
alpha = 3.763
theta = pi
```

Therefore K-37.63 is a Mirror-Universe coordinate mapping.

```text
NEGATIVE_K_PHASE != BLACK_HOLE_STATE
NEGATIVE_K_PHASE != WHITE_HOLE_TRANSFORM
```

Mirror phase, Black Hole accounting/state and White Hole transformation are orthogonal classifications unless an explicit runtime links them.

## 10. 18911 KGEN catalyst / PR #158 implementation lineage

Physics semantics accepted for review/integration:

```text
KAIOS alchemy point = 18911
KGEN catalyst ratio = 0.001 KGEN per 1 KAIOS
KGEN catalyst is escrowed per proof and returned after valid maturation/claim flow
KAIOS input is actually burned
maturation count = 49 Alchemy Epochs
KUFO decay start = KUFO birth timestamp
KUFO transfer does not reset age
KSHIP generation comes from newly decayed KUFO mass
KSHIP maximum lineage scale = 1000 per 1 KUFO
mass conservation required
replay / double-generation forbidden
```

Implementation evidence lineage:

```text
PR = #158
branch = codex/kaios-18911-kgen-catalyst-kufo-kship-v1
head = e679a71a0b9ed42d601a739740bf8d59de96f322
status = DRAFT / UNMERGED / UNDEPLOYED
```

Therefore V4.1 may encode the Physics semantics but MUST NOT claim the PR #158 code is deployed or merged.

`49 Alchemy Epochs` is fixed as a count; the duration of an Alchemy Epoch remains a separate runtime parameter unless separately frozen. An older review candidate's `1 epoch = 1 hour` remains historical/candidate material and is NOT automatically active.

## 11. KUFO life support and KSHIP vehicle fuel are separate reservoirs

```text
KUFO = life-support / high-density decaying fuel stock
KSHIP = direct propulsion feed mass / carrier fuel
```

A Life may have enough KUFO while its Vehicle lacks KSHIP, or enough KSHIP while Life-support KUFO is below a health requirement.

No numeric illness / immobility KUFO threshold is CURRENT Canon yet. Until a dedicated Life Physiology organ freezes those thresholds, Runtime must report:

```text
KUFO_HEALTH_THRESHOLD = UNDEFINED_CANON
KUFO_MOBILITY_THRESHOLD = UNDEFINED_CANON
```

and MUST NOT invent values.

## 12. CFO dispatch / cargo-profit invariant

Before a delivery, travel or field-service order is accepted, the CFO/dispatch runtime must have explicit values or approved models for:

```text
origin
destination
route_distance_model
vehicle_empty_mass
body/passenger mass
cargo mass by asset type
KUFO life-support stock and trip-time decay
KSHIP available propulsion feed
engine efficiency eta
acceleration profile
cruise / velocity constraints
navigation losses
gravity/environment cost
braking fuel
landing fuel
emergency reserve
return reserve or backhaul plan
chain gas
maintenance/depreciation
worker compensation
insurance/rescue/tow reserve
minimum company margin
```

Required financial invariant:

```text
quoted_freight >=
propulsion_cost
+ life_support_cost
+ gas
+ labor
+ maintenance
+ insurance/rescue_reserve
+ expected_return_cost
+ minimum_profit
```

If required physical parameters are missing:

```text
QUOTE_STATUS = INCOMPLETE_PHYSICS
DISPATCH = DENIED
```

If fuel is insufficient:

```text
TAKEOFF_DENIED
FUEL_INSUFFICIENT
```

A vehicle must not depart on a route whose arrival + braking + reserve requirement exceeds available KSHIP.

## 13. Rescue / tow trigger

During travel, if projected remaining KSHIP falls below safe-arrival requirement:

```text
LOW_FUEL
→ SAFE_STOP_OR_SAFE_ROUTE
→ DISTRESS_BEACON
→ RESCUE / TOW REQUEST
```

A rescue event must carry evidence and cannot be invented after the fact.

## 14. Validation invariants for V4.1

Every future Physics release must pass:

```text
DIMENSION_CHECK
DOMAIN_CHECK
UNIT_CHECK
REAL_PHYSICS_VS_PROJECT_CANON_LAYER_CHECK
MASS_ENERGY_CONSERVATION_CHECK
ASSET_NON_REPLAY_CHECK
SOURCE_PRECEDENCE_CHECK
NO_UNEXPLAINED_PART_DELETION
VERSION_TWIN_SAME_BLOB
V3_8_HISTORY_UNCHANGED
```

Automatic NO-GO conditions include:

```text
log10(0) evaluated as an ordinary finite floor
seconds directly equated to meters without an explicit propagation law
K72000 stated as real Big Bang physical location
Moon anchor generalized into a universal km ruler
Planck time stated as proven minimum time
PR #158 described as deployed
KUFO and KSHIP treated as the same reservoir
UFO dispatch allowed without braking/reserve fuel
```

## 15. V4.1 installation rule

Final V4.1 MUST be:

```text
V4.1 active layer
+
complete inherited V3.8 body
```

and BOTH paths must reference identical bytes / identical Git blob:

```text
docs/physics/KGEN_Universe_Physics_Runtime_V4_1.md
docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md
```

The historical V3.8 file remains immutable.
