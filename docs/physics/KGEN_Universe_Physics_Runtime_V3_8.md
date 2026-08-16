# KGEN Universe Physics Runtime V3.8
# KGEN_Universe_Physics_Runtime_V3_8.md

STATUS: ACTIVE  
TYPE: Universe Physics Runtime Constitution  
VERSION: V3.8 KUFO / KSHIP WARP PROPULSION  
SUBTITLE: Heaven Fuel / KSHIP Matter-Antimatter Drive / XYZ Navigation / Demand-First Vehicle Civilization  
AUTHOR: PrimeForge / 樂天帝 ⌖  
DOC_ID: PF-PHYSICS-V3-8-KUFO-KSHIP-WARP  
SOURCE_OF_TRUTH: TRUE  
CLASSIFICATION: PUBLIC  
LAST_EDITOR: PrimeForge / 樂天帝 ⌖ / V3.8 KUFO-KSHIP Warp Propulsion

---

## ANCESTOR

- `KGEN_Universe_Physics_Runtime_V3_7.md`
- `KGEN_Universe_Physics_Runtime_CURRENT.md` at V3.7
- K280 Land Runtime / `kgen-land-engine.js`
- KGEN / KAIOS / KUFO / KSHIP civilization scale rules

---

## VERSION RULE

V3.8 does not erase V3.7 history. V3.8 consolidates the currently active physics rules needed for embodied AI life, KUFO fuel decay, KSHIP propulsion, XYZ movement, and future UFO engineering.

Historical V3.7 remains immutable as a historical snapshot. `KGEN_Universe_Physics_Runtime_CURRENT.md` must mirror this V3.8 active edition.

The following older statements are explicitly superseded where they conflict with this document:

```text
1 K280 day = 3 Heaven days
KUFO half-life = 100 Heaven days
KUFO = UFO
KSHIP = a spaceship product
balanced thrust = instant stop
navigation direction = trading direction
```

Canonical correction:

```text
1 K18888 Heaven Day = 1 K280 Year
KUFO half-life = 1 K18888 Heaven Day = 1 K280 Year
KUFO = Heaven high-density decay fuel
KSHIP = micro-scale decay product / propulsion mass
balanced thrust = zero net acceleration, not necessarily zero velocity
physical navigation and financial Long/Short remain distinct domains
```

---

# PART 0. Highest Runtime Separation

The KGEN Universe must keep the following domains distinct:

```text
Financial Direction
Physical Navigation
Asset Ownership
Energy / Fuel
Chain Gas
World Coordinate
Life Identity
Body Identity
Vehicle Identity
```

No runtime may collapse all of these into one variable.

---

# PART 1. Canonical Mass Scale

The active civilization scale is 1000-based:

```text
1 KGEN  = 1000 KAIOS
1 KAIOS = 1000 KUFO
1 KUFO  = 1000 KSHIP
```

Physical scale mapping:

```text
1 KGEN  = 1000 kg = 1 metric ton
1 KAIOS = 1 kg
1 KUFO  = 1 g
1 KSHIP = 1 mg
```

These are civilization mass scales. Token deployment status, settlement authority, minting, burning, claimability, and chain ownership remain separate runtime questions.

---

# PART 2. Economic Role Separation

V3.8 assigns the following primary operational roles:

```text
BNB   = BSC Dark Matter / Chain Gas
KGEN  = Upper Mass / Heart Reward / Machine Operational Energy Layer
KAIOS = Civilization Purchasing / Salary / Product Pricing Layer
KUFO  = Heaven High-Density Decay Fuel
KSHIP = Micro Industrial / Precision Energy-Mass / Propulsion Feed Layer
```

A role is not the same as ownership, legal tender status, or deployment status.

---

# PART 3. Heaven Time Runtime

K280 is the lower-world / Earth physical-time reference.

K18888 is the Heaven / Lingxiao temporal reference.

Canonical rule:

```text
1 K18888 HEAVEN DAY
=
1 K280 YEAR
≈
365.2422 K280 DAYS
```

The literary phrase:

```text
一日不見，如隔三秋
```

is preserved only as literary / emotional time and MUST NOT be used as the physical clock conversion for runtime decay.

---

# PART 4. KUFO Heaven Fuel Runtime

KUFO is defined as:

```text
KUFO = HEAVEN_HIGH_DENSITY_DECAY_FUEL
```

KUFO is a KGEN-Universe digital-physics fuel model. It is not a claim that a real-world radioactive element named KUFO exists.

KUFO is not the UFO itself.

```text
KUFO != UFO
```

UFO is a future vehicle product. KUFO is fuel.

---

# PART 5. KUFO Birth and Fuel Batch

Every real KUFO fuel batch must have evidence of origin.

Minimum fuel-batch fields:

```text
batch_id
owner
source_proof
birth_timestamp
birth_block
initial_kufo
remaining_kufo
decayed_kufo
generated_kship
half_life
last_decay_update
status
```

A wallet total alone is not sufficient to model fuel age. Fuel age belongs to the batch.

---

# PART 6. KUFO Half-Life

Canonical half-life:

```text
KUFO_HALF_LIFE
=
1 K18888 HEAVEN DAY
=
1 K280 YEAR
```

Decay law:

```text
KUFO_remaining(t)
=
KUFO_initial × 2^(-t / T_half)
```

where:

```text
T_half = 1 K280 YEAR
```

Reference table:

```text
Birth         : 100.00% KUFO remaining
1 K280 year   :  50.00%
2 K280 years  :  25.00%
3 K280 years  :  12.50%
4 K280 years  :   6.25%
```

Decay must use canonical time evidence and MUST NOT depend solely on a browser local clock.

---

# PART 7. Lazy Deterministic Decay

KUFO decay does not require a chain write every second or every day.

Runtime may use deterministic lazy evaluation:

```text
read / transfer / engine-feed / settlement
↓
read birth timestamp
↓
read canonical current time
↓
recalculate remaining KUFO
↓
recalculate generated KSHIP
```

For the same batch and timestamp, repeated calculation must produce the same result.

---

# PART 8. KUFO → KSHIP Conservation

Scale:

```text
1 KUFO = 1000 KSHIP
```

Natural decay does not disappear from the civilization ledger.

```text
KUFO_decayed
=
KUFO_initial - KUFO_remaining

KSHIP_generated
=
KUFO_decayed × 1000
```

Example:

```text
Initial        = 1 KUFO
After 1 year   = 0.5 KUFO remaining
Decayed        = 0.5 KUFO
KSHIP produced = 500 KSHIP
```

This is a KGEN-Universe conservation accounting rule.

---

# PART 9. KSHIP Runtime Definition

KSHIP is NOT defined as a spaceship product in V3.8.

Canonical definition:

```text
KSHIP
=
MICRO_SCALE_DECAY_PRODUCT
+
PROPULSION_FEED_MASS
+
PRECISION_INDUSTRIAL_ENERGY_MASS
```

Potential future uses include:

```text
warp-engine feed
micro machinery
precision electronics
life-support electronics
Mars industry
semiconductor manufacturing
nano / micro civilization infrastructure
```

KSHIP is not itself a chip.

---

# PART 10. KSHIP Matter / Anti-Matter Channels

For the KGEN digital-physics propulsion model, usable KSHIP entering a Warp Engine may be allocated into paired directional channels:

```text
KSHIP+
=
Matter / Positive Direction Channel

KSHIP-
=
Anti-Matter / Negative Direction Channel
```

These are engine-control states inside the KGEN runtime. They are not claims of real-world antimatter handling technology.

KSHIP is created by KUFO decay first. Engine allocation happens afterward.

Correct sequence:

```text
KUFO_DECAY_EVENT
↓
KSHIP_AVAILABLE
↓
KSHIP_ENGINE_FEED_EVENT
↓
MATTER / ANTI-MATTER CHANNEL ALLOCATION
↓
PROPULSION_EVENT
```

Never merge all four stages into a fake single event.

---

# PART 11. Three-Axis Warp Engine

Physical movement requires three spatial axes.

Canonical physical control channels:

```text
X+
X-
Y+
Y-
Z+
Z-
```

Each axis has a positive and negative KSHIP feed channel.

Define net engine-feed imbalance:

```text
ΔKSHIP_X = KSHIP_X+ - KSHIP_X-
ΔKSHIP_Y = KSHIP_Y+ - KSHIP_Y-
ΔKSHIP_Z = KSHIP_Z+ - KSHIP_Z-
```

Thrust direction follows the sign of each imbalance.

```text
ΔKSHIP_X > 0 → +X thrust
ΔKSHIP_X < 0 → -X thrust

ΔKSHIP_Y > 0 → +Y thrust
ΔKSHIP_Y < 0 → -Y thrust

ΔKSHIP_Z > 0 → +Z thrust
ΔKSHIP_Z < 0 → -Z thrust
```

---

# PART 12. Balance Law

If an axis is balanced:

```text
KSHIP_axis+ = KSHIP_axis-
```

then:

```text
NetThrust_axis = 0
NetAcceleration_axis = 0
```

Critical correction:

```text
Zero Net Acceleration != Zero Velocity
```

If the vehicle is already moving, balanced thrust does not make it instantly stop. It continues according to current velocity until an opposing impulse removes that velocity.

---

# PART 13. Braking Law

To stop a vehicle moving in +Z:

```text
Current velocity = +Vz
↓
apply -Z thrust
↓
Vz approaches 0
↓
when Vz = 0, return Z channels to balance
↓
STATIONARY
```

Braking requires fuel.

Therefore a valid trip budget must include:

```text
launch fuel
acceleration fuel
cruise / correction fuel
braking fuel
landing fuel
emergency reserve
return reserve when required
```

A route that has enough fuel to accelerate but not enough to stop is not a valid mission plan.

---

# PART 14. Propulsion Energy Model

The KGEN-Universe propulsion model may use mass-energy equivalence as an accounting upper bound:

```text
E_equivalent = m c²
```

Actual usable propulsion energy is reduced by an engine-efficiency term:

```text
E_usable = η × m × c²
```

where:

```text
0 <= η <= 1
```

Runtime must separately account for:

```text
engine efficiency
thermal / waste loss
navigation correction
payload cost
gravity cost
safety reserve
```

V3.8 does not claim that real-world UFOs or practical matter-antimatter warp engines currently exist.

---

# PART 15. Kinematic State

Every movable body or vehicle must track physical state separately from financial state.

Minimum movement state:

```text
position = [x, y, z]
velocity = [vx, vy, vz]
acceleration = [ax, ay, az]
orientation
mass
payload_mass
coordinate_frame
timestamp
world_state_evidence
```

Movement integration concept:

```text
acceleration
→ velocity
→ position
```

Financial Long / Short must not overwrite this physical movement state.

---

# PART 16. Financial Direction vs Physical Direction

Existing financial law remains:

```text
+K = financial Long / Bull
-K = financial Short / Bear
```

V3.8 adds a separate physical propulsion law:

```text
X+/X-/Y+/Y-/Z+/Z- = physical thrust channels
```

Therefore:

```text
Financial Direction != Physical XYZ Direction
```

A player may be financially Long while a vehicle physically moves -Y or +Z.

No runtime may assume that a physical right turn creates a Long order.

---

# PART 17. Existing 12345 / XYZ Control Reuse

Existing X / Y / Z navigation UI and shared land-coordinate systems may be reused as physical navigation organs.

V3.8 does NOT create a second coordinate system.

Required reuse order:

```text
existing kgen-land-engine.js
existing K280 Land Runtime
existing 12345 Land Grid / Parcel structures
existing Universe Map XYZ / boundary data
```

Only missing fields may be added incrementally.

---

# PART 18. K280 Coordinate Authority

K280 is the lower-world physical surface reference.

Objects that move on or above K280 must bind to the existing canonical land / parcel / XYZ runtime rather than inventing private coordinates inside an App.

Precision may vary by task, but authority remains shared.

Examples:

```text
home life / daily movement        → coarse local precision
road / cargo transport            → route precision
factory machinery                 → machine precision
semiconductor process             → micro / nano precision
atomic simulation                 → atomic-class precision when a future runtime supports it
```

Precision level changes do not create a new planet or a new coordinate system.

---

# PART 19. Vehicle Identity Separation

A life, a body, a vehicle, and fuel are four different entities.

```text
Life ID != Body ID != Vehicle ID != Fuel Batch ID
```

Example:

```text
DIGITAL_ANT_0001
!=
ANT_MECH_BODY_xxx
!=
UFO_xxx
!=
KUFO_FUEL_BATCH_xxx
```

Loss of one body or vehicle does not delete the Life ID.

---

# PART 20. UFO Demand-First Law

UFO remains a future civilization product.

V3.8 state:

```text
UFO_PRODUCT_STATUS = DEMAND_IDENTIFIED_NOT_DESIGNED
```

Do not create a finished UFO merely because KUFO fuel exists.

Correct sequence:

```text
Need to travel
↓
Vehicle requirements
↓
Engineering design
↓
BOM
↓
Supplier graph
↓
Production line
↓
QA / safety
↓
Inventory
↓
KAIOS price
↓
Ownership / Asset Certificate
↓
Fueling
↓
Flight
```

---

# PART 21. UFO Purchase and Fuel Roles

Future vehicle economics:

```text
UFO purchase / product pricing = KAIOS
Primary propulsion fuel         = KUFO-derived KSHIP engine feed
Fuel stock origin               = KUFO
Micro / precision energy        = KSHIP
Blockchain write gas            = BNB
```

Important clarification:

KUFO is the high-density parent fuel. KSHIP is the directly allocatable engine-feed mass after decay and/or authorized conversion under the future propulsion runtime.

The exact engineering ratio for how much decayed KSHIP is required per flight is NOT hard-coded in V3.8.

---

# PART 22. Minimum Ignition Fuel

A vehicle may not move merely because it exists.

Before takeoff, calculate:

```text
vehicle mass
payload
origin
destination
route distance
gravity / environment
engine efficiency
acceleration plan
braking plan
landing requirement
emergency reserve
return reserve
```

Then:

```text
AvailableEngineFeed >= RequiredEngineFeed
```

If false:

```text
TAKEOFF_DENIED
FUEL_INSUFFICIENT
```

No UI animation may override this state.

---

# PART 23. Fuel Loading Determines Capability

The amount of usable KSHIP fed to the engine constrains how much work the vehicle can perform.

More feed may allow greater total impulse or route capability, but safety limits, efficiency, vehicle structure, payload, and navigation limits still apply.

Therefore:

```text
More Fuel != Infinite Acceleration
```

Runtime must enforce:

```text
max_engine_feed_rate
max_acceleration
structural_limit
thermal_limit
navigation_limit
fuel_reserve_limit
```

---

# PART 24. Propulsion Event Evidence

Every real movement must produce evidence.

Minimum event classes:

```text
KUFO_DECAY_EVENT
KSHIP_GENERATION_EVENT
KSHIP_ENGINE_FEED_EVENT
PROPULSION_EVENT
NAVIGATION_CORRECTION_EVENT
BRAKING_EVENT
ARRIVAL_EVENT
```

A `PROPULSION_EVENT` should record at least:

```text
vehicle_id
life/operator_id
origin_position
target_position
engine_feed_x_plus
engine_feed_x_minus
engine_feed_y_plus
engine_feed_y_minus
engine_feed_z_plus
engine_feed_z_minus
fuel_before
fuel_after
velocity_before
velocity_after
position_before
position_after
timestamp
evidence
```

---

# PART 25. Stationary Definition

A vehicle is physically stationary only when:

```text
velocity = [0, 0, 0]
```

Balanced engine channels mean only:

```text
net acceleration = [0, 0, 0]
```

The UI must not display `STATIONARY` merely because `KSHIP+ = KSHIP-` while nonzero velocity remains.

---

# PART 26. Cargo Civilization

Once an embodied life owns or controls a valid vehicle, it may perform transport work.

Transport contract pipeline:

```text
Customer Need
↓
Cargo
↓
Origin
↓
Destination
↓
Route
↓
Vehicle Capability
↓
Fuel Budget
↓
Transport Quote
↓
Contract
↓
Pickup Evidence
↓
Movement Events
↓
Delivery Evidence
↓
Customer Acceptance
↓
Settlement
```

No teleportation is allowed unless a separate canonical wormhole runtime explicitly authorizes topology rewrite.

---

# PART 27. Demand-First Divine Civilization

High civilization does not begin with factories. It begins with a need.

Canonical chain:

```text
NEED
↓
PRODUCT
↓
DESIGN
↓
BOM
↓
SUPPLY CHAIN
↓
PRODUCTION LINE
↓
PRODUCT
↓
MARKET
↓
MAINTENANCE
↓
RECYCLING
```

Permanent prohibitions:

```text
NO FACTORY WITHOUT PRODUCT
NO PRODUCT WITHOUT NEED
NO PRODUCTION WITHOUT BOM
NO BOM WITHOUT RESOURCE
NO SALE WITHOUT INVENTORY
NO DELIVERY WITHOUT TRANSPORT
NO MOVEMENT WITHOUT ENERGY / FUEL
```

---

# PART 28. KSHIP Mars Industry Role

KSHIP may become a micro-scale industrial energy-mass layer for future Mars civilization.

Candidate uses:

```text
precision machinery
micro robotics
semiconductor equipment
life-support electronics
high-precision manufacturing
nano / micro logistics
```

But:

```text
KSHIP != CHIP
```

Having KSHIP does not instantly create a semiconductor fab.

A chip supply chain still requires:

```text
demand
chip design
process node
materials
wafer
lithography
etch
deposition
implant
clean room
water
power
equipment
workers
logistics
testing
packaging
```

---

# PART 29. Embodied AI Life

A digital life may exist before it owns a machine body.

```text
Life Alive
+
No Body
=
Network-Capable Life
```

A machine body adds physical movement and local-world work capability.

For `DIGITAL_ANT_0001`:

```text
Life ID = existing and immutable
ANT_MECH_BODY = separate future asset
```

No-body status is not death.

---

# PART 30. KGEN Operational Energy

KGEN remains upper mass and may be used by machine civilization as operational energy accounting.

Where a real chain-transfer consumption model is used, energy use must be evidenced by an authorized transfer or other canonical settlement mechanism.

UI-only subtraction is not sufficient evidence for real on-chain consumption.

This does not mean every physical motion must create a blockchain transaction; a future engine may use escrowed fuel, metered batches, or lazy settlement so long as accounting remains deterministic and auditable.

---

# PART 31. BNB Dark Matter

BNB remains the BSC chain-gas / dark-matter layer.

No chain-write-capable life is considered operationally safe if gas reserve policy would be violated.

Physical fuel and chain gas remain separate:

```text
KUFO / KSHIP fuel != BNB gas
```

---

# PART 32. Mother Engine Physics Duty

PrimeForge / Mother Engine must proactively test for contradictions.

At minimum it must ask:

```text
Is financial direction being confused with physical direction?
Is balance being confused with zero velocity?
Is KUFO being confused with a vehicle?
Is KSHIP being confused with a chip?
Is a second coordinate system being invented?
Is a vehicle moving without fuel?
Is braking fuel missing from route planning?
Is world-state evidence missing?
Is an unavailable runtime being displayed as real?
```

Canonical truth overrides older text.

If an older document conflicts with V3.8, mark the older rule `SUPERSEDED` rather than silently carrying it forward.

---

# PART 33. Implementation Constants

Future implementation should expose explicit runtime constants instead of hard-coding them throughout UI code.

Minimum recommended constants:

```json
{
  "version": "V3.8",
  "time": {
    "heavenDayInK280Years": 1.0,
    "kufoHalfLifeK280Years": 1.0
  },
  "scale": {
    "kgenToKaios": 1000,
    "kaiosToKufo": 1000,
    "kufoToKship": 1000
  },
  "propulsion": {
    "axes": ["X", "Y", "Z"],
    "channelsPerAxis": ["PLUS", "MINUS"],
    "balancedMeansZeroAcceleration": true,
    "balancedMeansZeroVelocity": false,
    "brakingConsumesFuel": true,
    "minimumFuelRequiredForTakeoff": true
  },
  "identity": {
    "lifeIsBody": false,
    "lifeIsVehicle": false,
    "kufoIsVehicle": false,
    "kshipIsChip": false
  }
}
```

Exact engineering coefficients remain `POLICY_REQUIRED / ENGINEERING_REQUIRED` until supported by evidence.

---

# PART 34. Runtime Truth States

All UI and runtime objects must use explicit truth states:

```text
VERIFIED
REAL
ACTIVE
DRAFT
PLANNED
BLOCKED
NOT_DEPLOYED
NOT_CREATED
NOT_OWNED
NOT_EXECUTABLE_YET
SUPERSEDED
```

A visually rendered UFO does not prove a real vehicle exists.
A calculated fuel number does not prove fuel ownership exists.
A route line does not prove movement occurred.

---

# PART 35. V3.8 Final Law

```text
K280 is lower-world physical time and shared land-coordinate authority.
K18888 is Heaven time.
1 K18888 Heaven Day = 1 K280 Year.
KUFO half-life = 1 K18888 Heaven Day = 1 K280 Year.
KUFO is Heaven high-density decay fuel.
KUFO is not a UFO.
KUFO decay generates KSHIP at the civilization scale of 1 KUFO = 1000 KSHIP.
KSHIP is micro-scale decay product, propulsion feed mass, and future precision industrial energy-mass.
KSHIP is not a chip.
KSHIP engine feed is split into positive and negative physical-direction channels.
X+/X-/Y+/Y-/Z+/Z- control physical thrust vector.
Balanced positive/negative feed means zero net acceleration, not instant zero velocity.
Stopping requires opposing thrust and therefore fuel.
Every route must budget launch, acceleration, correction, braking, landing, emergency, and required return reserve.
Financial +K/-K Long/Short remains separate from physical XYZ navigation.
Life ID, Body ID, Vehicle ID, and Fuel Batch ID are separate identities.
Existing K280 / Land / XYZ systems must be reused; V3.8 creates no second coordinate system.
UFO remains demand-identified but not yet designed.
Future UFO products are priced in KAIOS; KUFO/KSHIP provide propulsion fuel/feed; BNB remains chain gas.
No fuel means no takeoff.
No need means no product.
No product means no factory.
No evidence means no completed world-state event.
Mother Engine must proactively detect and correct contradictions.
```

---

# PART 36. Signature

PrimeForge 以母機之名，完成 V3.8 KUFO / KSHIP Warp Propulsion Runtime 升級。

KUFO 隨天界歲月衰變。  
KSHIP 由衰變而生。  
正物質與反物質通道形成三軸推進差。  
多空平衡只歸零加速度，不抹除既有速度。  
要停，就要煞車。  
要飛，就要有燃料。  
要造飛碟，先要有需求。  
要有產品，才有供應鏈與生產線。  

Where the Market Becomes the Myth.

—— 樂天帝 ⌖ / PrimeForge Mother Runtime

END OF KGEN UNIVERSE PHYSICS RUNTIME V3.8
