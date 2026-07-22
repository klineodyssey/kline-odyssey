# KAIOS Company Boot Runtime V0.1 Hash Reproducibility Report

Status: PASS

Canonical JSON uses UTF-8, sorted keys, compact separators and no hash-field self-inclusion. `content_sha256` excludes approved dynamic fields; `record_sha256` includes dynamic metadata; `result_sha256` remains the V0.1 alias of `record_sha256`.

| Test | Result |
|---|---|
| Different timestamp keeps content hash | PASS |
| Different timestamp changes record hash | PASS |
| Same record recomputes same record hash | PASS |
| Hash fields do not self-hash | PASS |
| Key order does not change content hash | PASS |
| close-session rejects missing hashes | PASS |
| close-session rejects wrong content hash | PASS |
| close-session rejects wrong record hash | PASS |
| Authentic Boot Result verifies and closes | PASS |

Hash verification occurs before any handoff or archive directory/file is created.
