# KAIOS Backup / Recovery V1

CURRENT is `player_state`; every accepted sync increments its revision and writes a
state revision plus immutable versioned snapshot. Snapshot metadata contains
snapshotId, playerId, schemaVersion, createdAt, sourceRevision, SHA-256 contentHash,
reason and payloadReference. Reasons: sync, manual, milestone, pre-migration,
pre-restore, import-candidate, conflict-candidate. Caller-controlled milestone requests are supported;
they are not emitted each frame. Retention policy recommends 30 recent versions
while protecting pre-restore/pre-migration copies; automatic deletion is disabled.
No delete API or administrator edit-XP endpoint exists in V1.

## Atomic boundary and failure recovery

1. Validate ownership, schema, base revision and idempotency content fingerprint.
2. Journal PREPARING; write the unique immutable object and read/hash it back.
3. Journal OBJECT_READY.
4. In one DB transaction / D1 batch, assert exact current revision with a SQL trigger,
   publish snapshot metadata, CURRENT, state revision, projections, recovery receipt,
   preview consumption and idempotent response; journal COMMITTED.

An object outage leaves CURRENT and published snapshots unchanged. A partial DB
write rolls back all publication. Orphan objects and PREPARING/OBJECT_READY rows
remain recoverable diagnostic evidence, never substituted for CURRENT. Retry uses
a new staged object if nothing committed; a committed request replays its response.
Diagnostic queue jobs report only phase counts. V1 does not automatically finalize
or delete orphan staging entries: operator diagnostics must compare published object
references and request results before any later authorized cleanup. Immutable object
storage plus revision history prevents CURRENT and all backup copies being destroyed
by one failed mutation.

## Restore and import

Select snapshot or preserved conflict candidate → verify canonical SHA-256 → migrate candidate if supported →
validate with canonical Player Life owner → preview current/candidate game progress →
explicit checkbox confirmation → recheck preview expiry/hash/player/current revision →
create pre-restore snapshot → atomically restore and increment revision → receipt.
Preview expires in five minutes and is single-use. A retry with the same key returns
the same receipt; a different key cannot consume it twice. Stale previews require a
new preview. Wrong-player IDs return no foreign metadata. Corrupted/unsupported
schemas are rejected with CURRENT unchanged. A migration registry supports a
minimal schema-0 envelope to schema 1; unknown future schemas fail closed. For an
old import, retain the sanitized original schema as the candidate snapshot and
create a pre-migration copy at commit. Never rewrite the original object.

Export is `KAIOS_PLAYER_BACKUP` with versioned manifest + payload + canonical
cryptographic hash. Import first validates format/manifest/hash/session ownership,
then creates a candidate/preview. Arbitrary JSON never replaces CURRENT. Hash proves
content integrity relative to the recorded hash; it is not blockchain proof,
anti-cheat evidence or financial entitlement.

Receipt fields: recoveryReceiptId, playerId, fromRevision, toSnapshotId,
newRevision, timestamp, result; scope BACKEND_GAME_ONLY_NOT_BLOCKCHAIN_RECEIPT.

Local application requires another explicit confirmation. The existing local owner
`restoreGameBackup` validates the candidate, same player and exact local revision,
rejects wallet proofs, saves a separate local pre-restore game copy, and performs its
normal validated mutation. It preserves local profile/privacy/wallet links. A new
device imports the same Player Life ID through the existing local import owner.
Cloud sync is not a replacement for the local wallet/backpack runtime.

## Health

| Code | Player-facing meaning |
|---|---|
| HEALTHY | 健康，備份可用 |
| STALE | 較久未同步（超過一天） |
| CONFLICT | 版本衝突；雲端與本機候選都保留 |
| CORRUPTED | 備份損壞；拒絕恢復，請選其他版本 |
| MIGRATION_REQUIRED | 資料版本需要轉換 |
| RECOVERY_AVAILABLE | 尚未有 CURRENT，可建立或載入旅程 |

The UI additionally warns when the local revision is behind the server. It does not
use viewport containment as a substitute for screenshot review.

## Reproducible checks

`npm test`: signed auth, replay/domain/chain/expiry/session, backups A/B and both
restores, pre-copy and receipts, revision-5/revision-4 conflict, two-player isolation,
corruption before and after preview, duplicate/concurrent requests, object outage,
partial DB transaction rollback, DB outage, timeout outbox retry, export/import/hash,
migration failure, strict nonfinancial projections, local recovery and room replay.
`npm run test:browser`: Chromium touch viewport 390×844 full recovery workflow,
plus 360×740, 412×772, 844×390; screenshots under ignored `evidence/` and CI artifacts.
