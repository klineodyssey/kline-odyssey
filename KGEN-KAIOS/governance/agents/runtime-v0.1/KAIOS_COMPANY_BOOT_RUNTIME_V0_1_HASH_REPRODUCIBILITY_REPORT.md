# KAIOS Company Boot Runtime V0.1 Hash Reproducibility Report

Status: PASS
Review Type: Hash and Canonical Evidence Review

## Implemented Canonicalization

File: `src/company_boot/evidence.py`

The implementation defines:

```python
json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
```

Text is encoded as UTF-8 before SHA-256 calculation.

The `stamp_hashes` helper separates stable semantic content hashing from dynamic record hashing:

- `content_sha256` excludes dynamic fields and hash fields.
- `record_sha256` includes dynamic record metadata but excludes hash fields.
- `result_sha256` remains as a V0.1 compatibility alias for `record_sha256`.

## Positive Results

| Requirement | Result |
|---|---|
| JSON key ordering defined | PASS |
| UTF-8 encoding defined | PASS |
| Whitespace handling defined by compact separators | PASS |
| Newline handling neutralized inside canonical JSON | PASS |
| Hash fields excluded from self-hash | PASS |
| Dynamic timestamp excluded from `content_sha256` | PASS |
| Dynamic timestamp included in `record_sha256` | PASS |
| State SHA excludes `state_sha256` from self-hash | PASS |

## Reproducibility Test

Repair tests confirm:

| Test | Result |
|---|---|
| Same semantic input with different timestamp keeps `content_sha256` stable | PASS |
| Same semantic input with different timestamp changes `record_sha256` | PASS |
| Same record recalculation keeps `record_sha256` stable | PASS |
| Hash field does not hash itself | PASS |
| Key order does not affect `content_sha256` | PASS |

## Repaired Behavior

Dynamic fields excluded from `content_sha256`:

- `timestamp`
- `booted_at`
- `failed_at`
- `created_at`
- `archived_at`
- `uuid`

Hash fields excluded from both `content_sha256` and `record_sha256`:

- `content_sha256`
- `record_sha256`
- `result_sha256`

## Final Result

Hash Reproducibility: PASS

The targeted repair satisfies the approved reproducibility contract.
