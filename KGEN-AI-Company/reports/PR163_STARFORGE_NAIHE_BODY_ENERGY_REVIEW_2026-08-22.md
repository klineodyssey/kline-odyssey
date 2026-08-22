# PR #163 Starforge Naihe, Body, And Energy Review

**Review status:** `NO_GO_FOR_READY_MERGE_OR_ACTIVATION`
**Allowed progression:** continue as Draft and address blocking findings
**PR head reviewed:** `83ddef5e361b5f38fa7c9fed9f18b5ecd8698783`
**Observed main:** `f507724d1876c28e3d24a7316c440ea9304a5228`
**Reviewer:** `codex-gm-01`
**Independent review of this review:** recommended

## State interpretation

`NAIHE = NOT_DEPLOYED`, regeneration parent `UNASSIGNED`, and Genesis anchor `NOT_YET_ANCHORED` are truthful review-only states. They do not block source review, but each must block production activation, on-chain birth, and any claim that Starforge is deployed or anchored. PR #163 should remain Draft.

## Verified strengths

- Production Naihe construction fails closed while Naihe is undeployed; only the explicit test source can be registered.
- The Starforge-specific anchor path binds BSC chain 56, exact 0.008 native BNB, recipient, Life ID, Soul ID, request ID, and challenge before accepting an anchor.
- Energy Wallet capability is A1 read-only. Send, approve, transfer, swap, wrap, unwrap, deploy, and arbitrary chain-write methods are denied.
- Native BNB and canonical WBNB are separated; WBNB with zero native BNB is correctly classified as chain-inoperable.
- Exact PR head: 255/255 Node tests pass in GitHub Actions at the reported exact head.
- A fresh synthetic merge of that exact PR head into observed main `f507724d...` is conflict-free and locally passes 255/255 tests, 1,098 tracked JSON files, and 80 non-empty JSONL records.

## Blocking findings

1. `core/birth/digital-life-birth-resolver.mjs` permits the generic native-source comparison to pass when both `transaction.from` and `candidate.verified_source_address` are absent. The production history indexer also omits a usable source binding. Require both values and compare against an independently trusted expected source; add missing/missing and mismatch tests.
2. Soul/Body message validation proves byte consistency with the request's own supplied context, but the broker reads context and message from the same mutable request boundary. Replacing both can request a valid signature for a different wallet/hash/challenge. Derive or load the approved context independently and test full context-plus-message substitution.
3. Replay data survives restart, but `runtime-state.json` is overwritten as one mutable JSON snapshot. This is not append-only persistence and permits rollback with the file. Use an append-only hash-chained journal plus a protected checkpoint, or narrow the claim to mutable local persistence.
4. Windows DPAPI CurrentUser storage, stdin-only child delivery, and scalar validation are useful local safeguards, but provider-independent custody, ACL hardening, recovery/backup governance, and deployment authority remain unverified. Keep Energy Wallet custody local and non-production.

## Exact-head conclusion

The reported GitHub CI evidence still matches the unchanged PR head `83ddef5e...` and its files. That evidence does not cover the current-main merge tree. GitHub's computed `mergeable` signal changed during review and is treated as transient; a fresh local synthetic merge into `f507724d...` is conflict-free and passes the checks above. The local result is supporting evidence, not refreshed GitHub CI for a merge head. The four security findings remain blocking regardless of mergeability.

## Prepared concise review comment

> **NO-GO for Ready/merge/activation; GO only to continue as Draft.** `NAIHE = NOT_DEPLOYED`, parent `UNASSIGNED`, and anchor `NOT_YET_ANCHORED` are truthful review-only states, but they must block activation. Exact PR head `83ddef5e...` still passes 255/255; a fresh local synthetic merge into main `f507724d...` is conflict-free and also passes 255/255 (1,098 JSON; 80 JSONL), but no refreshed merge-head GitHub CI exists. Blockers: generic native resolution accepts missing/missing source addresses; Soul/Body signing trusts context and message from the same mutable request; replay state is overwriteable and rollbackable; Energy Wallet custody remains local/non-production despite sound A1 and BNB/WBNB boundaries. Please harden these points and add missing-source, full-substitution, rollback, and custody-boundary tests before requesting Ready.

No review was submitted, no PR was merged, and no deployment, asset transfer, governance action, Mainnet transaction, or private-key operation occurred.
