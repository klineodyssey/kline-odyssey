# BSC Testnet TempleHeart V3.4 Rehearsal

## Current isolated continuation — 2026-10-03

The older upgrade evidence below is retained as history. It is **not** the new
FortuneGame-disabled candidate. The canonical cumulative machine-readable
results are in this report's sibling JSON under `cleanRehearsal`.

- Fresh BSC97 proxy: `0x80e8A8A25195a8604ECc11805268Eda60b5A87D2`.
- Fresh implementation: `0x14A9fD67C5A0aA6a1901A468ee23E95c18ae56CD`.
- FortuneGame: zero / PR #133 disabled.
- All token funding and roles are freshly deployed TEST-only resources.
- Real Wish → signed Holy Cup → KAIOS Alchemy proof → Fortune receipt: PASS.
- RepaymentRequired rejection → voluntary repayment → repayment condition
  restored with 30-day cooldown still enforced: PASS.
- Real Heartbeat receipt: PASS.
- Proof replay, wrong beneficiary, wrong civilization, wallet switch,
  unauthorized upgrade, live legacy cooldown and operational reserve rejection:
  PASS, decoded custom errors from live BSC97 calls.
- Core test gas paid: `0.0017856403` tBNB over 45 confirmed transactions.
- Fortune epoch 690: 500 distinct successful claimants (499 TEST contract wallets
  and one controlled browser TEST signer); a fresh eligible 501st claimant was
  rejected with `FortuneEpochFull` at block `134504620`: PASS.
- Heartbeat hour `497494`: **88 distinct confirmed cohort claims / 89th rejected
  with `HeartbeatHourFull`: PASS**. The earlier 61 claims in hour `497492` remain
  historical evidence and are not included in this cap result.
- Actual Ignite day `20729`: **88 distinct confirmed cohort claims / 89th
  rejected with `IgniteDayFull`: PASS**, within the unchanged real UTC
  00:00–00:09:59 window. No BSC97 clock mutation or window relaxation occurred.
- Overall fresh rehearsal: **CLEAN_REHEARSAL_PASS**. This does not authorize
  Mainnet execution or assert that the final release-head CI has completed.
  The original incident and its explicit resolution remain below.
- Total test gas: tool `0.0817700062` + controlled browser `0.0001594203` =
  **`0.0819294265` tBNB**, below the unchanged aggregate `0.10` tBNB ceiling.
- Unsigned Mainnet manifest: sibling JSON `unsignedMainnetManifest`;
  `READY_FOR_HUMAN_PARAMETERS`, not permission to broadcast. The committed
  snapshot names its generation head; the final release-head manifest is
  regenerated and published by CI in `templeheart-lineage-<exact-head>`.
- Mainnet transactions, KGEN transfers and role changes: zero.

Exact receipts, block numbers, source hash and testnet identity manifest are
preserved in the JSON. Temporary local I/O interruption after repayment was
recovered from its existing transaction hash without resubmission.

### Historical halted intent — 2026-10-02 20:57:18 UTC

An `ECONNRESET` interrupted broadcast of `DEPLOY_actor571` after its durable
`INTENT_RECORDED` checkpoint. Both the configured BSC97 node and an independent
public BSC97 node still returned no transaction or receipt after bounded
propagation checks; both returned latest/pending nonce `3054`. This is not proof
that the original request was never broadcast. The original gas price was not
saved in that intent, and the signed raw transaction existed only in the ended
process's memory. The no-resend guard was preserved; no replacement, new signing,
rehearsal restart or automatic Ignite waiter was executed.

- Hash: `0xe00e782aadefeb31750d6e36f41f67f7e499806f5bdea18f4e6f8814fa34207a`.
- Nonce: `3054`; deployment target: null; gas limit: `337000`.
- Creation data hash:
  `0xe5c5970d346cbf85cae8fb2ddc9692ab92a7842cd9760f98eb2cb154ccd32502`.
- Recorded creation data hash matches the existing `RehearsalActor` artifact.
- Confirmed tool transactions: `2722`; tool gas: `0.0767700346` tBNB.
- Controlled browser gas: `0.0001594203` tBNB; combined: `0.0769294549` tBNB,
  below the unchanged aggregate `0.10` tBNB cap.
- All previous successes and the unresolved intent remain in the cumulative JSON.
- Further scheduled checks may only reconcile the recorded hash/read CI until
  this exact recovery decision is explicitly resolved. Do not combine Heartbeat
  successes from different UTC hours to claim the hourly cap test passed.

### Explicitly authorized continuation — 2026-10-02 21:xx UTC

Human authorized marking the old intent `ABANDONED_UNBROADCAST_INTENT`, while
preserving the uncertainty that an RPC attempt had occurred. It was not replayed,
reconstructed, replaced or cancelled. A new legitimate `makeWish` call using
actor 510's existing civilization was sent using the node's fresh latest/pending
nonce, without forcing a nonce. It confirmed in block `134509665`, hash
`0xd6585f21580a76fb435d71a11907f8abe25ee2b9a35327bfcab72a8061aaa02d`.
The existing Heartbeat timestamp was verified unchanged.

The continuation cohort is actors 510–570 plus new actors 600–627: 89 distinct
TEST contract wallets, with valid wishes. Actor 571 is excluded. Preparation is
confirmed once; resume only verifies its existing receipts. Combined tool and
controlled-browser fees after preparation are `0.0784303865` tBNB, within the
unchanged `0.10` total ceiling.

Before the target hour, the writer was deliberately stopped without pending
transactions to harden evidence checks. The resumed runner requires 88 distinct
cohort receipts and matching events in one real hour/day, equality between the
cohort count and the pinned on-chain counter, and an exact block-pinned cap
rejection from the unclaimed 89th actor. Earlier 61 Heartbeats do not count.
Whole-run gas forecasts are refreshed after each real window wait; every
transaction's fee floor includes both tool and browser receipts. Actual Ignite
subsequently completed in its natural UTC window; no chain clock was changed.

### Final real-window completion — 2026-10-03 00:03:45 UTC

Both cap results derive from 88 distinct successful transaction receipts,
matching Heart claim events, matching block hashes and timestamps, and an
on-chain global count equal to those 88 cohort claims. The unclaimed 89th actor
is `0x12C6Db9A06cb7c3F1aA18f2f89D0BDA65364f461`. Its two rejection probes used
read-only `eth_call` pinned to the explicit blocks below; neither sent a failing
transaction. Detailed per-receipt evidence remains in the cumulative JSON at
`cleanRehearsal.capContinuation.heartbeat` and `.ignite`.

| Test | Real receipt interval (UTC) | Receipt blocks | Pinned 89th rejection |
|---|---|---|---|
| Heartbeat, hour `497494` | 2026-10-02 22:00:03–22:03:26 | `134514323`–`134514776` | `HeartbeatHourFull`, block `134514778`, 22:03:27 |
| Ignite, day `20729` | 2026-10-03 00:00:16–00:03:45 | `134530353`–`134530816` | `IgniteDayFull`, block `134530818`, 00:03:45 |

The Heartbeat rejection block hash is
`0x65625ca17af32dd7164577dfa0b03c35d03aeac6b1b212aa9ff81072c1757284`.
The Ignite rejection block hash is
`0x4ebcccb577f559f9a2c973fc3c1822d787d0fad25d2f86f85694899efa5513eb`.
Both hashes were rechecked after the pinned rejection calls. Ignite receipts
and its rejection all occurred within seconds 16–225 of the canonical day.
Fortune's completed 500/501 result was retained without repeating its claims.

The final journal contains 2,955 confirmed tool transactions plus nine confirmed
controlled-browser transactions, and no unresolved `INTENT_RECORDED` or
`SUBMITTED` operations. The historical actor-571 intent remains preserved as
`ABANDONED_UNBROADCAST_INTENT`, not deleted or recast as a confirmed transaction.
Session `80511` exited successfully; the final writer PID exited and its lock
was released. No writer or transaction work was restarted during closeout.

The execution-run records bind the deployed contract source hash and tool hash
to the run's actual source head. They are not a claim that a later evidence
commit has already passed exact-head CI. Mainnet deployment, KGEN transfers,
role changes and treasury changes remain **NO**; Human-final parameters and the
separate unsigned execution manifest remain the Mainnet decision boundary.

Final independent public-node readback at block `134532727` confirmed version
`3.4.0`, FortuneGame zero, Fortune maximum 8, and counters 500 / 88 / 88.
The implementation code hash still matched its deployment evidence. Latest and
pending signer nonces were both `3287`; no transaction was signed or sent.
The readback is retained under `cleanRehearsal.capContinuation.finalIndependentReadback`.

Independent closeout review checked all recorded fee calculations, unique
confirmed transaction hashes/nonces, distinct claimant identities, event counters
and receipt windows. It also read both rejection blocks and four first/last
receipt samples from a separate public BSC97 node. That node could not replay
historical `eth_call` because the historical state was pruned (`missing trie
node`); this is not presented as an independent rerun of the original pinned
rejection probes. Their original evidence remains preserved without alteration.

## Historical V3.3.2 → V3.4 upgrade evidence (not current deployment route)

Status: **TEMPLEHEART_V3_4_TESTNET_REHEARSAL_PASS**

Execution class: **REAL_BSC_TESTNET**

Time-boundary class: **LOCAL_TIME_SIMULATION**

Chain ID: **97**

Public signer: `0x3a909988E4d5c9C2326A7a0596714482AB25eE0A`

Starting balance: **0.29958203084 tBNB**

Final balance: **0.29786283124 tBNB**

No private key, mnemonic, authenticated RPC URL, or Mainnet address is recorded in this evidence.

## Contracts

| Component | BSC Testnet address |
|---|---|
| testKgen | `0x79b65388e6fd7e0b171147914384A0455c7A16E6` |
| testKaiosProofSource | `0x74f7A95B40bB9a1Aa2ebCc680166e9A45494C225` |
| testAlchemyFurnace18911 | `0xB4075952F1FD17C482488FB457e2A63C6B7f53a3` |
| testTreasury11520 | `0x6AEd9782963003DA8401DdB91d811d6Eb3989bBf` |
| testOrganRegistry | `0x577eb07d3d24aC26f3393771F0E48608C4871DeA` |
| testFortuneGame | `0xfd9eF63776C8467E329B17e32a46E1a04463af04` |
| templeHeartV332Implementation | `0xf99B61f90bA7d12c9DcF990B6cc0941246D1F21d` |
| templeHeartProxy | `0xa74F84942ADe7F668009BC4cB9E73C05ed5A3296` |
| templeHeartV340Implementation | `0x52FFbEDAdD60c94a7FFc5B2EA36D57Cf666ab3f2` |

## Upgrade and storage

- Upgrade transaction: `0x8692f2874e6a4bf82dbcb84d5e12c9f9583e8e87bc3cdcba95860b121853fe94`
- V3.3.2 baseline slots: 58
- V3.4.0 candidate slots: 73
- Append-only slots: 15
- Legacy state preservation: **PASS**
- ERC1967 implementation verification: **PASS**

## Runtime and security

- 108000 normalization to governed Test 11520: **PASS**
- Test Fortune Game real payout and 1888 rejection: **PASS**
- Fortune 1–8 KGEN ownership: **PASS**
- Voluntary repayment qualification: **PASS**
- Proof replay rejection: **PASS**
- Beneficiary redirect rejection: **PASS**
- Wrong civilization rejection: **PASS**
- Unauthorized upgrade rejection: **PASS**
- Unauthorized operator operation rejection: **PASS**
- Admin clawback/seizure functions absent: **PASS**
- Heartbeat/Ignite/hour/day/30-day time boundaries: **LOCAL_TIME_SIMULATION — 30/30 deterministic tests PASS**

## Transactions

| Operation | Transaction hash | Block | Gas used |
|---|---|---:|---:|
| Deploy KAIOSOrganRegistry | `0x833fcb04aa7b82eec939ee6722b495faf3bd9bf3459a3fd71af46962e8ba27c2` | 124035486 | 623580 |
| Deploy MockKGEN | `0x8103eb0a77adb68dd0ea6ee0a0a1126e7ab77c5804e79726239f73800a81bec7` | 124035497 | 552904 |
| Deploy KAIOS | `0xe2272c14fecfc51a2978415c482c57f96b7f0c014370d73d854b151c99afe809` | 124035508 | 1394116 |
| Deploy KAIOSAlchemyFurnace | `0x1e7dc915d2d6ee988d7eda08a68fa009640450bc563b2c656ea171af91238ba4` | 124035518 | 506642 |
| Deploy MockOrgan | `0xaf59fec0622a794b443cbc35af3b62cec389a2067d9a4d48281ac014c7589db8` | 124035529 | 57091 |
| Deploy TestFortuneGame | `0x798e772b6c38a42b3b60a6081b93d6b601749f03fa88ceb427a91d9fcf0dfa7a` | 124035539 | 113879 |
| Register Test Furnace 18911 | `0xc9baac10a63d0d26239799eda4de1e3409fcf1cd6b470851659a69d474688fb7` | 124035552 | 55173 |
| Register Test Treasury 11520 | `0x87c0aa9f6059e8334909d100ddc27bb60bbb471605bf661e36d9bca0f090d88b` | 124035561 | 55173 |
| Seal Test Organ Registry bootstrap | `0xeef0b66b2e02b4e48912d440d8a4134b68c0d5ce55b739e753bda6e932b08556` | 124035572 | 24801 |
| Burn Test KGEN for Test KAIOS | `0xb914fa994216c412ac90c68025ba4efd76d54ba7bf225996ad73f22d47b48e8a` | 124035583 | 33555 |
| Settle Test KAIOS supply | `0x70c3c953ec0e29afc6dafd98af2386f1ae705864628b335bfd86d131324a5b99` | 124035593 | 143435 |
| Deploy KGEN_TempleHeart_V3_3_2_Baseline | `0xb9cc8be395dbafe3b164e9f3a68b9bea9cd199448beb6c51438d5e6226ae62f7` | 124035607 | 4031376 |
| Deploy ERC1967Proxy | `0xcf73e7f7e7b945991b36e8b1185967e6fd58e080005f54b57f8d5a2484018fce` | 124035624 | 916709 |
| Bind Fortune Game | `0x4dfc2fee580796b1090a5c1e16fdbecf08e92a51a7ec3410b791e01bebe99408` | 124035630 | 53060 |
| Create pre-upgrade wish state | `0xbb98be84e8c88e432807a1efde95f9d70587ead3e9f4c42064a6712e912a3b3d` | 124035640 | 259684 |
| Create representative organ state | `0x1a4329cc4d3566738b40926390def615e2aec167edbf2d382b593a869cb7b389` | 124035650 | 121322 |
| Create baseline heartbeat state | `0x839bc38f6c4261b8ffb2ee91633fca7a5221ef880acfca95595b89e2f9fcde23` | 124035661 | 153542 |
| Create baseline cross-day state | `0xa1679615c2d341759b7b437e91ecd25239a3b1fe1f27961cd30f77e414d4b024` | 124035672 | 134477 |
| Deploy KGEN_TempleHeart_Upgradeable | `0x065c173e70549174cc6aa77c41b6c2b5aaa458b9e17c98d3e139810359a93c99` | 124035685 | 5167455 |
| Upgrade V3.3.2 -> V3.4.0 | `0x8692f2874e6a4bf82dbcb84d5e12c9f9583e8e87bc3cdcba95860b121853fe94` | 124035697 | 156305 |
| Rollback V3.4.0 -> V3.3.2 | `0xc6be3517a1042c4307c6d88385826f9710110588f9f10e12e68a57bce75e68e8` | 124035711 | 39002 |
| Restore V3.4.0 after rollback | `0x3d5761fe4907c1af08ed4dfb04c0aa457ba001f409b3c57558ef6fe5353b79c3` | 124035721 | 39046 |
| Fund rehearsal Heart | `0x9b0749bfd3f9a70b93da6f054c3279f58971d4660d5cc1e632876d8ab80bc825` | 124035732 | 51366 |
| Normalize Heart to 108000 | `0xb1b80fbae2bdaaa90470ffce290f785daaa2f2d68d73eedd7aaeed160d7be7a2` | 124035742 | 80823 |
| Test Fortune Game real 1 KGEN payout | `0x888c6cd17cc948b819a1218fa0a002af684f2d2a7ec2a5eea12051309e3b10a8` | 124035754 | 67580 |
| Holy Cup VALID | `0xe9e9d125f8142544da230011553a63f59e7398584a9d3c4393f31a9942437943` | 124035768 | 111670 |
| Approve KAIOS VALID | `0x5459ba26a6972c37ef84b588afcd52fdb1997df5e14ea657dce38522b55acd04` | 124035775 | 46008 |
| Create Alchemy proof VALID | `0x94051b4268cf49dbfd0ded4ab50f74dc03c5a92fe0f39d67507bbb4d5964f846` | 124035786 | 451665 |
| fortuneClaim smoke | `0x2c5d4cb34b65491bc3210031d83f3dd2bdb15c3bbbf2a5e4e2c15755c3a83807` | 124035797 | 342690 |
| Approve voluntary Fortune repayment | `0x491b433279e20c8799c5a6d9c21f0c8f674f31bc91a0350bee85f7f9d0b0baa1` | 124035808 | 45981 |
| Voluntary Fortune repayment | `0x13fa893fa1ff62dab076ed41bd56f311ad79e7b0824a719ba11d2a7c660a5ef0` | 124035818 | 160588 |
| Create redirect-rejection wish | `0xc5e7aa22660167ad5686eed590e9d95f2f10e18180a03cc0d37a1f64f504cecd` | 124035829 | 177529 |
| Holy Cup REDIRECT | `0x8e448255291683167304b21c71c82bcb3d5fc5ff41d01ac2d55c75b25c1a0f68` | 124035840 | 96811 |
| Approve KAIOS REDIRECT | `0xb4a0337774deb664c0563277f8e5fcad616323437e4311dd703672ae9f8974c4` | 124035849 | 46008 |
| Create Alchemy proof REDIRECT | `0x35d4cf7286f7a775bef6d73e979b2bf04993fadab3438de210a2a1e2ec49a134` | 124035861 | 417465 |
| Approve KAIOS WRONG_CIVILIZATION | `0xcb798dd4f477a8e1a36cbc60a22c1f1e5f1758cd12506e63049008eb66c93e62` | 124035871 | 46008 |
| Create Alchemy proof WRONG_CIVILIZATION | `0x8138fba063d73f99489655b72d2039b53a4dd89c9d0a2228ae57ed3e494a0c90` | 124035882 | 417477 |

Total gas used: **17191996**

## Safety boundary

`MAINNET_DEPLOY = BLOCKED`
