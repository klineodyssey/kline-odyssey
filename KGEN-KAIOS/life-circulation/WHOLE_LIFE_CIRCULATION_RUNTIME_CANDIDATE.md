# KAIOS Whole-Life Circulation Runtime Candidate

**Task:** `KAIOS-WHOLE-LIFE-CIRCULATION-12345-HEART-V1-001`
**Execution base:** `f507724d1876c28e3d24a7316c440ea9304a5228`
**Implementer:** `codex-gm-01`
**Independent review:** `REQUIRED`
**Authority:** review-only candidate; no merge, deployment, asset transfer, payment, governance execution, or private-key handling

## 1. Permanent separation of hearts

- `K12345` is Wukong's civilization reference heart. It emits Wish, Holy Cup, Heartbeat, Ignite, Fortune, and civilization-contribution events.
- `LifeHeart` is one Life's own heart or Pulsar. It advances that Life's deterministic circulation policy.
- `Heartbeat Reward` is a TempleHeart civilization event. `Life Pulse` is a per-Life circulation event.
- TempleHeart does not become a common wallet for all Lives. The circulation package does not mint KGEN or KAIOS and cannot call TempleHeart.

The existing Solidity `KAIOSOrganRegistry` remains the governed address registry for replaceable contracts. The candidate's per-Life Organ account records have a different identity, asset, health, and position scope; they do not create a parallel Solidity address registry.

## 2. Layered runtime

| Layer | Responsibility | Forbidden responsibility |
|---|---|---|
| TempleHeart | Wish, Holy Cup, Heartbeat, Ignite, Fortune, civilization contribution | Per-Life blood custody and organ balances |
| Life Circulatory Runtime | Per-Life heart, blood bank, vessels, organ balances, pulse result, health derivation | Minting, signing, broadcasting, beneficiary replacement |
| Life Organ Account Registry | Bind Life ID, organ ID, point, scale, beneficiary, balance, policy, health, and position | Private-key custody or contract-address governance |
| Medical Recovery Runtime | Ischemia evidence, failed work, resources, service time, and recovery proof | Instant cure or Life death declaration |

Blood Bank is not the Heart. Heart is not an asset creator. Vessel is not a private key. Brain may calculate and propose routing but cannot mint or transfer without the fixed policy and funded ledger.

## 3. Required organs

The closed schema and example include:

- Life Heart / Pulsar at the fractal 12345 reference;
- Brain / decision organ at 11520;
- reproduction organ at 16888;
- external authorized bank boundary at 18888;
- alchemy and matter-conversion organ at 18911;
- Energy Wallet for native BNB gas and energy operability;
- Communication / neural organ;
- Mobility organ;
- Immune / Medical organ;
- Blood Bank.

Every Organ record contains the requested Life binding, point, scale exponent, beneficiary, available/reserved/incoming/outgoing KAIOS, reserve thresholds, metabolic rate, priority, health, pulse/flow evidence, physical-position reference, and status. Amounts are non-negative decimal strings representing the smallest integer unit.

## 4. Blood vessels and pulse

Each vessel binds one Life, source Organ, destination Organ, asset, per-pulse capacity, minimum and maximum transfer, priority, cooldown, enablement, in-transit balance, last transfer, and replay-protection ID.

Pulse states are closed:

`PULSE_DUE → PULSE_EXECUTING → PULSE_COMPLETED`

Failure or communication branches are `PULSE_MISSED` and `PULSE_RECOVERY_REQUIRED`. Neither means death.

An on-chain contract does not wake itself. A future deployment may use a permissionless caller or a governed keeper, but the result must be deterministic. The caller cannot choose beneficiaries or allocation amounts. The same Life and epoch can succeed only once. No funded bank means no transfer. Caller reward remains exactly zero until a separate authorized budget exists.

The candidate persists successful pulse IDs in an fsynced JSONL journal with monotonic sequence, previous-record hash, record hash, Life/epoch uniqueness, and replay-protection uniqueness. A trusted expected head detects rollback. Production still requires an independently protected checkpoint or chain anchor; this local candidate does not overclaim adversarial filesystem custody.

## 5. Deterministic allocation

For each Organ:

```text
need_i = max(0, targetReserve_i - availableKaios_i
                + scheduledWorkCost_i + verifiedRecoveryCost_i)
```

For the Blood Bank:

```text
distributable = max(0, bloodBankAvailable
                       - bloodBankMinimumReserve
                       - alreadyReserved)
```

Priority is strict: P0 before P1 before P2. Within one priority, the candidate computes integer weighted-gap shares:

```text
rawShare_i = distributable × weight_i × need_i
             ÷ Σ(weight_j × need_j)
```

Transfers are bounded by Organ maximum reserve and Vessel capacity, minimum, maximum, cooldown, enablement, and in-transit amount. Division rounds down. Residual smallest units go to eligible `organId` values in fixed lexical order. Capped shares are deterministically redistributed. The algorithm never emits more than distributable, never creates a negative balance, and returns unallocated KAIOS to the Blood Bank.

## 6. Exact accounting and custody

Each asset has an independent ledger satisfying:

```text
openingAssets + verifiedExternalInflow
- verifiedExternalOutflow - explicitFees
= closingBloodBank + Σ(closingOrganBalances)
 + inTransit + settlementEscrow
```

Equality is exact to the smallest unit. Unfunded liability, negative Organ balance, duplicate pulse, double spend, and beneficiary substitution fail closed.

Ledger-purpose isolation is explicit:

- KAIOS Blood → Organ circulation only;
- native BNB → chain gas only;
- WBNB → wrapped-asset custody, never native gas;
- KGEN civilization pass, KGEN Catalyst Escrow, Salary, Reward, 18888 Bond, 18911 Catalyst/Burn, KUFO lineage, and KSHIP fuel each use separate ledger classes.

An Organ with KAIOS but no native BNB and no Gas Sponsor is `ECONOMICALLY_FUNDED_BUT_CHAIN_INOPERABLE`. WBNB cannot satisfy native BNB gas.

Asset scale remains: 1 KGEN = 1000 kg, 1 KAIOS = 1 kg, 1 KUFO = 1 g, and 1 KSHIP = 1 mg. KGOD, KLOVE, KDNA, and KRNA remain `DESIGN_ONLY` unless a separate CURRENT, contract, and Registry exist.

## 7. Health and medical recovery

Health states are closed:

`HEALTHY`, `LOW_BLOOD`, `ISCHEMIA_RISK`, `NO_FLOW`, `ORGAN_FAILURE_RECOVERY_REQUIRED`, `RECOVERING`, `RECOVERED`.

The balance thresholds are deterministic:

- available ≥ target → `HEALTHY`;
- minimum ≤ available < target → `LOW_BLOOD`;
- 0 < available < minimum → `ISCHEMIA_RISK`;
- available = 0 and no valid enabled Vessel → `NO_FLOW`.

Zero balance never automatically means death or permanent necrosis. Recovery requires ischemia evidence, work-failure evidence, positive recorded resources, a medical service event, positive elapsed time, and a recovery proof. K16888 ischemia blocks only new reproduction processes and preserves existing marriages, Lives, and assets.

## 8. Fractal positions

Every reuse of a civilization point records `pointId`, `scaleExponent`, physical reference frame, physical position, timestamp, and evidence ID. The calculator performs integer decimal placement, including:

- 12345 × 10^-6 = `0.012345`;
- 11520 × 10^-6 = `0.011520`;
- 16888 × 10^-6 = `0.016888`;
- 12345 × 10^-19 = `0.0000000000000012345`.

No runtime infers scale by counting zeroes. No position record grants teleportation, land ownership, token rights, or physical-arrival evidence.

## 9. Review and deployment gates

The candidate may advance only after independent review of:

1. TempleHeart ABI allowlist, UUPS append-only storage, EIP-170 size, fuzz, invariant, and integration evidence;
2. persistent replay checkpoint custody and crash behavior;
3. beneficiary Registry authority and future keeper budget;
4. production deployment plan, native BNB gas custody, and signer boundary;
5. exact-head CI on the final reviewed commit.

Until those gates pass, status remains `REVIEW_ONLY_CANDIDATE`; no file here is a CURRENT runtime or deployment instruction.
