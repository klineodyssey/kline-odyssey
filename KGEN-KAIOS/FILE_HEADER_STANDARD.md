# KGEN File Header Standard

## Metadata

| Field | Value |
|---|---|
| VERSION | 1.0 |
| REVISION | 2026-07-11.1 |
| STATUS | ACTIVE |
| LAST_UPDATED | 2026-07-11 |
| UPDATED_BY | Codex |
| REVIEWED_BY | Codex |
| SOURCE_COMMIT | e0acc39c6c1b5d5dead5b619ad48c85a85743262 |
| TASK_ID | KGEN-GOV-BIO-2026-0001 |
| CHANGE_REASON | Define metadata header formats for formal KGEN organs. |
| ANCESTOR | KGEN-KAIOS/VERSIONING_STANDARD.md |
| SOURCE_OF_TRUTH | TRUE |

## Markdown

Markdown files use front matter when the file already supports it, otherwise a `## Metadata` table at the top.

```markdown
---
VERSION: 1.0
REVISION: 2026-07-11.1
STATUS: ACTIVE
LAST_UPDATED: 2026-07-11
UPDATED_BY: Codex
REVIEWED_BY: Codex
SOURCE_COMMIT: <commit-or-base-commit>
TASK_ID: <task-id>
CHANGE_REASON: <reason>
ANCESTOR: <previous-formal-source>
SOURCE_OF_TRUTH: TRUE
---
```

## JSON

JSON files use a top-level `metadata` object. Existing schemas may keep their schema body unchanged, but formal registries must include metadata.

```json
{
  "metadata": {
    "version": "1.0",
    "revision": "2026-07-11.1",
    "status": "ACTIVE",
    "last_updated": "2026-07-11",
    "updated_by": "Codex",
    "reviewed_by": "Codex",
    "source_commit": "<commit-or-base-commit>",
    "task_id": "<task-id>",
    "change_reason": "<reason>",
    "ancestor": "<previous-formal-source>",
    "source_of_truth": true
  }
}
```

## HTML / JS / CSS

HTML, JS, and CSS formal organs use header comments. Do not place secrets or tokens in headers.

```html
<!--
KGEN_META
VERSION: 1.0
REVISION: 2026-07-11.1
STATUS: ACTIVE
LAST_UPDATED: 2026-07-11
UPDATED_BY: Codex
REVIEWED_BY: Codex
SOURCE_COMMIT: <commit-or-base-commit>
TASK_ID: <task-id>
CHANGE_REASON: <reason>
ANCESTOR: <previous-formal-source>
SOURCE_OF_TRUTH: TRUE
-->
```

## Changelog Requirement

When a formal organ changes in a way that affects behavior, governance, schema, routing, public entry, or Canon interpretation, the nearest changelog or release report must record it.
