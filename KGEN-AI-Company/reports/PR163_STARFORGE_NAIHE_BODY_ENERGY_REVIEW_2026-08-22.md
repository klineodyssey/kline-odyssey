# PR #163 Starforge Naihe, Body, And Energy Review

**Review status:** `NO_GO_FOR_READY_MERGE_OR_ACTIVATION`
**Allowed progression:** continue as Draft and address blocking findings
**PR head reviewed:** `83ddef5e361b5f38fa7c9fed9f18b5ecd8698783`
**Observed main:** `31c8726b7c76a74d0693a1fab4278d5a456eab03`
**Reviewer:** `codex-gm-01`
**Independent review of this review:** recommended

## State interpretation

`NAIHE = NOT_DEPLOYED`, regeneration parent `UNASSIGNED`, and Genesis anchor `NOT_YET_ANCHORED` are truthful review-only states. They do not block source review, but each must block production activation, on-chain birth, and any claim that Starforge is deployed or anchored. PR #163 should remain Draft.

## Verified strengths

- Production Naihe construction fails closed while Naihe is undeployed; only the explicit test source can be registered.
- The Starforge-specific anchor path binds BSC chain 56, exact 0.008 native BNB, recipient, Life ID, Soul ID, request ID, and challenge before accepting an anchor.
- Energy Wallet capability is A1 read-only. Send, approve, transfer, swap, wrap, unwrap, deploy, and arbitrary chain-write methods are denied.
- Native BNB and canonical WBNB are separated; WBNB with zero native BNB is correctly classified as chain-inoperable.
- Exact PR head: 255/255 Node tests pass, 1,090 tracked JSON files parse, and 80 non-empty JSONL records parse.
- A synthetic merge of the PR into the observed current main is conflict-free and also passes 255/255 tests locally.

## Blocking findings

1. `core/birth/digital-life-birth-resolver.mjs` permits the generic native-source comparison to pass when both `transaction.from` and `candidate.verified_source_address` are absent. The production history indexer also omits a usable source binding. Require both values and compare against an independently trusted expected source; add missing/missing and mismatch tests.
2. Soul/Body message validation proves byte consistency with the request's own supplied context, but the broker reads context and message from the same mutable request boundary. Replacing both can request a valid signature for a different wallet/hash/challenge. Derive or load the approved context independently and test full context-plus-message substitution.
3. Replay data survives restart, but `runtime-state.json` is overwritten as one mutable JSON snapshot. This is not append-only persistence and permits rollback with the file. Use an append-only hash-chained journal plus a protected checkpoint, or narrow the claim to mutable local persistence.
4. Windows DPAPI CurrentUser storage, stdin-only child delivery, and scalar validation are useful local safeguards, but provider-independent custody, ACL hardening, recovery/backup governance, and deployment authority remain unverified. Keep Energy Wallet custody local and non-production.

## Exact-head conclusion

The reported CI evidence matches PR head `83ddef5e...`. The PR head is seven commits behind observed main, so it does not yet have GitHub CI for the current merge head. The local current-main merge tree passes, but this is supporting evidence rather than a substitute for refreshed exact-head CI.

## Prepared concise review comment

> **NO-GO for Ready/merge/activation; GO to continue as Draft.** The undeployed Naihe, unassigned regeneration parent, and unanchored Genesis state are intentional review-only truth, but must remain activation blockers. Exact PR head `83ddef5e...` passes 255/255 tests and merges cleanly into observed main locally. Three security gaps still block progression: the generic resolver can accept missing/missing source addresses, Soul/Body signatures trust context and message from the same mutable request boundary, and replay state is an overwriteable snapshot rather than append-only rollback-detecting persistence. Energy Wallet is correctly A1/read-only with BNB/WBNB separation, but custody remains local and non-production. Please harden these points, add substitution/missing-source/rollback tests, sync to current main, and rerun exact-head CI.

No review was submitted, no PR was merged, and no deployment, asset transfer, governance action, Mainnet transaction, or private-key operation occurred.
