# KUFO V4 Whitepaper — cumulative annual-cohort candidate

Status: REVIEW CANDIDATE / NOT DEPLOYED / NO LIVE ACTIVATION
Current candidate core version: `4.1.0-candidate`
Solidity: `0.8.24`; OpenZeppelin Contracts: `5.0.2`
Architecture: non-upgradeable token; no proxy or calendar setter
Primary lineage: KAIOS → K18911 furnace → K168888 outlet → K511111 KUFO → KSHIP

This is a complete current description followed by the preserved historical edition.
It integrates the existing PR #201 candidate at
`8b4ccd8c008886f82853ba0f0c064b9217e73894` and the calendar/zodiac research from
PR #600 at `2062b7b94959cf5e0d4aaf408677505bb4bcb6e1`. It does not replace a
deployed V1 contract, rewrite historical KAIOS, or assert that candidate addresses
are live. The current main `KAIOS.sol`, `KSHIP.sol` and `KSHIPConverter.sol` sources
are retained. K511111 and K168888 are world coordinates, not literal EVM addresses.

## 1. Immediate protocol issuance

The holder supplies KAIOS and authorizes the current furnace through a KAIOS
allowance. KAIOS verifies that furnace, spends that allowance, burns the holder's
authorized KAIOS and records its alchemy proof. The V4 furnace requires the
holder's current KGEN balance to be at least `KAIOS input / 1000` and immediately
outputs `KAIOS input × 1000` KUFO to the beneficiary chosen for that proof.

For example, `0.001 KAIOS` plus a current balance of at least `0.000001 KGEN`
produces `1 KUFO`. KGEN is observed only: no KGEN transfer, burn, lock, allowance,
holding-age or tax-history requirement is introduced. There is no 49-epoch or
130-day delivery wait. Current-balance observation proves neither durable
ownership nor that the balance was not borrowed.

The K168888 output consumes the furnace's proof once. Its release API cannot
substitute another beneficiary or amount. KUFO separately rejects a reused mint
proof. Reverts anywhere in the synchronous furnace/output/mint path roll back
the KAIOS burn and all associated state, including a closed-calendar or cap failure.

The furnace accepts at least 1,000 KAIOS wei in multiples of 1,000. Consequently
protocol-issued KUFO amounts are multiples of 1,000,000 wei and divisible by four.

## 2. Shared annual cohorts and terminal Three-Autumn rule

Every issuance within the same configured birth-year interval belongs to the
same annual cohort. Birth-year boundaries are common calendar timestamps, not
the anniversary of each receipt. Conversion becomes eligible as follows:

| Configured boundary crossed since birth year | Cumulative original KUFO eligible | Remaining after full eligible conversion |
|---|---:|---:|
| None | 0% | 100% |
| First | 50% | 50% |
| Second | 75% | 25% |
| Third or later | 100% | 0, including every integer remainder |

A receipt issued one second before a year boundary reaches its first Autumn one
second later. A receipt issued earlier in the same birth year reaches that same
Autumn. This consequence is intentional in the candidate and must be understood
before production approval.

Time passing changes eligibility only. Ordinary transfers, purchases, sales and
new mints do not burn KUFO or mint KSHIP. The holder explicitly calls the existing
`KSHIPConverter.convert(amount, beneficiary)` to settle eligible material; the
converter binds the KUFO owner to its caller. A holder may convert partially,
repeat with newly eligible amounts later, or skip a year and catch up. After the
third boundary, converting the full remaining balance leaves zero KUFO. Previously
consumed tranches cannot be consumed again.

## 3. Explicit immutable calendar and bounded issuance horizon

The constructor takes the registry address plus these calendar inputs:

| Input | Meaning |
|---|---|
| `calendarVersion` | Nonzero version identifier chosen for the reviewed configuration |
| `firstBirthYear` | First year label; year labels increase consecutively |
| `firstBirthZodiac` | Explicit zodiac anchor index in the shared twelve-zodiac order |
| `yearStarts` | Strictly increasing, nonzero `uint64` timestamps |

For `N` issuance years, `1 ≤ N ≤ 32`, the array contains `N + 3` timestamps.
Issuance year `i` uses `[yearStarts[i], yearStarts[i+1])`; its three maturity
boundaries are indices `i+1`, `i+2`, `i+3`. New issuance closes permanently at
`yearStarts[N]`. The last issuance year, index `N-1`, becomes terminal at
`yearStarts[N+2]`. Final conversion remains available forever after that timestamp.
No year index wraps, no old cohort slot is reused, and no calendar can be appended
or changed after construction.

The source fixes a complexity ceiling, not an approved economic duration.
**This finite issuance horizon is a candidate design choice requiring explicit
production approval.** It is how this implementation bounds dormant historical
cohorts as well as currently active ones. It must not be silently presented as
perpetual issuance or an already approved universe rule.

`calendarHash = keccak256(abi.encode(calendarVersion, firstBirthYear,
firstBirthZodiac, yearStarts))`; the registry address is excluded from that calendar
hash. Reviewers can reproduce it from the complete configuration. No Gregorian,
lunar or fixed K280 year boundary is selected by this source. Test calendar dates
and accelerated clocks are fixtures, not canon. Formal production configuration
is absent and deployment remains blocked until it is approved and verified.

Before calendar activation, contract `currentYear()` reports the first year and
`currentAutumn()` reports zero; minting still rejects. Pure policy helpers instead
reject times before their calendar with `TIME_BEFORE_CALENDAR`. After the final
boundary, the contract and policy projections clamp their settlement year to the
final configured year so expired issuance never expires the conversion right.

## 4. One cohort balance, exact tranches and transfer behavior

Each holder/year stores only three remaining integer tranches: `first`, `second`
and `terminal`. A mint of amount `A` adds `floor(A/2)`,
`floor(3A/4)-floor(A/2)`, and `A-floor(3A/4)` respectively. Same-year receipts merge
by addition. Already settled state and incoming unsettled state can therefore
merge without recalculating old targets or recreating consumed entitlement.

Rounding is fixed per mint proof and never recomputed from a merged balance.
For real furnace outputs, divisibility by four makes the 50% and 75% targets exact.
Artificial smallest-unit test mints can round early targets down, and all remaining
units still belong to the third tranche. For example, a one-wei proof becomes
fully convertible at the third boundary rather than persisting forever.

For a partial transfer of `x` from live balance `L`, let remaining tranches be
`F`, `S`, `T`, with `L = F+S+T`. The recipient receives:

```text
childFirst = floor(F × x / L)
childFirstPlusSecond = floor((F+S) × x / L)
childSecond = childFirstPlusSecond - childFirst
childTerminal = x - childFirstPlusSecond
```

The sender subtracts exactly those amounts. `Math.mulDiv` handles intermediate
products safely. Every child tranche stays within the corresponding parent
tranche, every tranche total is conserved, and the child balance sums to `x`.
Transfers keep the birth-year key, never settle decay, and never reset age. The
receiver's same-year balance coalesces by addition, including partial or mature
receipts. Self-transfers and zero-value ERC-20 transfers create no extra cohort.

No operation walks a receipt list. A transfer or carrier burn examines at most
the immutable `N ≤ 32` issuance-year slots, even after malicious repeated dusting
or decades of skipped settlement. More than 64 receipts therefore cannot create
the old 64-lot lock. Repeated receipts increase immutable proof history, but proof
history is not traversed by transfer or conversion.

## 5. Birth metadata and provenance limits

Each mint proof permanently records its original beneficiary, amount, timestamp,
birth year, birth zodiac and birth constellation. The birth zodiac follows the
configured anchor and remains source information. An active zodiac can be derived
offchain from the configured anchor and `currentYear()` reference; it does not
rewrite birth zodiac. After the configured horizon that reference is clamped,
not a claim that the real-world calendar stopped.

`birthConstellation = 0` means **UNCONFIGURED**, not a guessed star sign. Missing
precise constellation boundaries does not block this candidate token core.

The immutable proof origin and emitted events preserve issuance provenance.
Balances are fungible within birth-year cohorts: coalescing does not provide a
cryptographic per-coin trail from each later recipient back to one particular
mint proof. No such tracing guarantee is claimed.

`threeAutumnState` in the pure policy module projects an unsplit origin proof.
Actual holder entitlement after transfers or coalescing is calculated from
remaining tranches (`claimableTranches` offchain, `claimableDecay` or
`claimableTotal` on the contract), not by projecting the original proof again.

## 6. Carrier conversion, conservation and supply

The existing holder-authorized converter creates a unique carrier proof and asks
KUFO to consume only eligible tranches. KUFO verifies the current registered
converter, rejects replay and records `owner`, `beneficiary`, `converter`,
`kufoBurned`, `expectedKship`. Existing main KSHIP independently reads that record,
checks the current converter and exact `expectedKship = kufoBurned × 1000`, and
marks the carrier proof consumed before minting to its recorded beneficiary.
The converter checks the returned beneficiary and amount in the same transaction.

The accounting laws are:

```text
KUFO totalSupply + totalDecayedForKship = totalMintedFromAlchemy
Every accepted carrier proof: KSHIP minted = KUFO burned × 1000
Completed converter path: KSHIP totalMintedFromKufo = KUFO totalDecayedForKship × 1000
Terminal lineage: 1 KUFO → 1000 KSHIP
```

`MAX_SUPPLY = 72,000,000,000,000 KUFO`. This candidate also limits **lifetime**
`totalMintedFromAlchemy` to that amount. Decay does not free new issuance capacity;
otherwise repeated burning and reminting could exhaust KSHIP's fixed cap and lock
future conversion. The corresponding KSHIP maximum is
`72,000,000,000,000,000 KSHIP`. Product_05 introduces no KSHIP half-life.

## 7. Protocol ratio, merchant prices and trust boundary

The protocol furnace ratio is fixed at 1,000 KUFO per KAIOS. A restaurant or other
merchant may quote 100, 1,000 or 2,000 KUFO for 1 KAIOS using its own inventory,
margin or subsidy. Such a quote does not modify protocol minting. Inventory
acquisition, profit, subsidy and protocol issuance must be accounted separately.
This candidate adds no restaurant UI or merchant settlement mechanism.

The KUFO token has no owner/admin mint API, blacklist, seizure function, native
transfer tax or proxy upgrade mechanism. Its authorized output and converter are
still resolved through a **mutable external Organ Registry**. Registering a
malicious output or converter can violate issuance or holder-authorization
assumptions. Bytecode immutability does not remove that registry trust. Production
requires reviewed bindings, roles, governance delays and receipt evidence.

## 8. Deployment prerequisites and verification status

No deployment, asset movement, signer use, registry change, real mint/burn,
governance action or main merge is asserted by this edition. Exact candidate
compile and local EVM results are recorded in the product implementation report;
historical CI is not evidence that this candidate passed.

Before production activation, require:

1. Approved calendar, version/hash, zodiac anchor and finite issuance horizon.
2. Reconciliation of Physics CURRENT V3.8 §238, whose continuous decay illustration
   leaves 12.5% after three years, with the user's latest annual 50/75/100% rule.
   This candidate follows the latest explicit engineering instruction; CURRENT
   has not been edited or silently superseded as a deployed constitution.
3. Exact-source compilation and local EVM tests covering boundaries, replay,
   allowance burn, beneficiary binding, partial transfers, dormant years, hostile
   dust, bounded gas, lifetime cap and terminal smallest-unit cleanup.
4. Verified existing KAIOS compatibility and complete KUFO/output/converter/KSHIP
   deployment bindings, with immutable V1 history and deployment lineage retained.
5. Action-specific human authorization and technical checks for deployment,
   registry/governance changes or any live asset operation.

PR #600's unique research files remain preserved. PR #158's old catalyst and
continuous-decay design is not reinstated. PRs #211 and #212 are downstream
products, not duplicate alchemy cases. This edition closes none of them.

## Preserved historical source edition — superseded candidate mechanics

The original PR #201 whitepaper follows verbatim. Its per-receipt anniversary,
31,556,926-second year, linked-list lots, 64-lot traversal behavior, source-overwrite
implications and historical review flow are archival descriptions, not the current
candidate's behavior or additional mandatory approval gates.

---

# KUFO V4 Whitepaper

Status: DRAFT PRODUCT CANDIDATE
Version: 4.0.0
Solidity: 0.8.24
Upgradeable: NO
Mainnet status: NOT DEPLOYED / NOT LIVE
Primary lineage: KAIOS -> K18911 -> K168888 -> K511111 KUFO -> KSHIP

## 1. Purpose

KUFO is the KAIOS civilization mass produced by the K18911 alchemy product and delivered through the K168888 output organ to the K511111 KUFO world coordinate. K511111 is a KAIOS world coordinate and must not be interpreted as a literal EVM address.

KUFO V4 is designed as a non-upgradeable ERC-20 capped material token whose physical law is fixed at deployment. Organ routing remains replaceable through the KAIOS Organ Registry, but the deployed KUFO token implementation itself has no proxy upgrade path.

## 2. Immediate alchemy rule

The current Product_05 rule is:

- INPUT = KAIOS
- KGEN role = current wallet BALANCE PROOF ONLY
- required KGEN balance = KAIOS input / 1000
- KGEN transfer = NO
- KGEN burn = NO
- KGEN lock = NO
- KGEN holding days = 0
- KUFO output = KAIOS input * 1000

Example:

0.001 KAIOS input + wallet balance >= 0.000001 KGEN -> immediate 1 KUFO.

Old tax-proof, 49-epoch wait and 130-day hold requirements are superseded in this Product_05 lineage.

## 3. Three-Autumn decay law

KUFO V4 does not use an infinite exponential half-life. Each lineage lot has a terminal three-autumn schedule.

K280_YEAR_SECONDS = 31,556,926.

For each original KUFO lot:

- Before Year 1: 0% converted.
- First Autumn: cumulative 50% of the original lot converts to KSHIP.
- Second Autumn: cumulative 75% of the original lot converts to KSHIP.
- Third Autumn: 100% cumulative conversion; every remaining smallest unit is terminally consumed.

Final material relation:

1 KUFO -> 1000 KSHIP total.

No nine-autumn KUFO dust is permitted.

## 4. Transfer and market behavior

KUFO is transferable. Transfer does not reset decay age.

Each mint creates a lineage lot recording:

- owner
- initialAmount
- convertedAmount
- firstAutumnTarget
- secondAutumnTarget
- bornAt
- sourceProof

When a holder transfers or sells only part of a lot, the contract partitions the lot. The child lot inherits the original bornAt timestamp. First- and second-autumn cumulative targets are partitioned from the already committed original targets instead of being recomputed from scratch.

This is required so repeated buying, selling, splitting, or wallet movement cannot make KUFO younger and cannot defer its required decay.

Core invariant:

TRANSFER MUST NOT RESET DECAY AGE.

## 5. KSHIP conversion lineage

Matured KUFO can be burned only through the current Organ Registry KSHIP converter.

The converter creates a unique carrier proof. KUFO records:

- owner
- beneficiary
- converter
- kufoBurned
- expectedKship

KSHIP then independently reads that KUFO carrier record and mints only when the proof lineage matches the current converter and the exact 1:1000 relation.

Proof reuse is rejected.

## 6. Conservation

KUFO V4 tracks:

- totalMintedFromAlchemy
- totalDecayedForKship
- current totalSupply

The token exposes the invariant:

totalSupply + totalDecayedForKship == totalMintedFromAlchemy

A normal holder cannot arbitrarily burn KUFO outside the controlled decay path.

## 7. Supply and administrative surface

MAX_SUPPLY = 72,000,000,000,000 KUFO.

KUFO V4 has no owner mint, no arbitrary admin mint, no native transfer tax, no blacklist, no seizure function and no upgradeTo/upgradeToAndCall proxy mechanism.

The Organ Registry can change which external organ is authorized as the current output or KSHIP converter. This changes routing authority; it does not replace the KUFO token bytecode.

## 8. Bounded lineage traversal

One transfer or decay operation traverses at most 64 lots.

MAX_LOTS_PER_OPERATION = 64.

If the required operation would exceed that traversal bound, the operation fails closed instead of silently omitting lineage or decay accounting. High-frequency market use may therefore require future organ-level batching or safe lot-consolidation design, but no consolidation mechanism may reset bornAt or alter already committed decay targets.

## 9. Security boundaries

The V4 candidate requires review for:

- immediate proof replay protection
- current-output authorization
- current-KSHIP-converter authorization
- beneficiary binding
- partial-lot conservation
- Year 1 / Year 2 rounding preservation
- Year 3 terminal dust removal
- 64-lot fail-closed behavior
- KUFO/KSHIP exact conservation
- transfer-age preservation

## 10. Deployment boundary

This whitepaper describes a repository candidate. It does not assert deployment, Mainnet activation, registry mutation, signer execution, token transfer, governance approval or chain write.

The required flow is:

玄曜 Product Engineering -> exact-head CI / EVM tests -> Codex/衡曜 GM independent review -> human-authorized deployment process.
