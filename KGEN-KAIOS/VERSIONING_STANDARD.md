# KGEN Versioning Standard

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
| CHANGE_REASON | Establish file version, provenance, and biological evolution governance baseline. |
| ANCESTOR | KAIOS V10 Operating System standards |
| SOURCE_OF_TRUTH | TRUE |

## Purpose

This standard defines how KGEN formal organs record versions without putting versions in formal filenames. A formal organ is any current Boot, Canon, Runtime, Manifest, Registry, Dashboard entry, schema, WorkQueue, review protocol, or production-facing HTML / JS / CSS / JSON / Markdown file that serves as an active source for KGEN operation.

## Filename Rule

Formal organ filenames must remain stable. Do not add `v2`, `v3`, `final`, `hotfix`, `patch`, `stable`, or similar words to the formal active filename. Version and revision belong inside the file metadata.

Historical files may keep old names only when explicitly classified as `Archive`, `Legacy`, `Ancestor`, or `Reference Alias`.

## Required Metadata Fields

Every formal organ should expose these fields in the format appropriate to its file type:

| Field | Required | Meaning |
|---|---|---|
| VERSION | Yes | Public semantic version or `CURRENT` when the file is the active rolling entry. |
| REVISION | Yes | Incremented for any meaningful content, link, metadata, schema, or wording change. |
| STATUS | Yes | `ACTIVE`, `DRAFT`, `REFERENCE_ALIAS`, `LEGACY`, `ARCHIVE`, or `DEPRECATED`. |
| LAST_UPDATED | Yes | ISO date of the latest formal edit. |
| UPDATED_BY | Yes | Human or agent who authored the change. |
| REVIEWED_BY | Yes | Reviewer who accepted the change. |
| SOURCE_COMMIT | Yes | Commit or base commit that introduced or governed the metadata state. |
| TASK_ID | Yes | WorkOrder or human-request task ID. |
| CHANGE_REASON | Yes | Short reason for the change. |
| ANCESTOR | Yes | Prior formal file, version, or lineage source. |
| SOURCE_OF_TRUTH | Yes | `TRUE` only for the current authoritative entry. |

## Revision Rules

- Typo, link, route, or metadata-only changes may update `REVISION` without changing major `VERSION`.
- Rule, schema, runtime, Canon, or public behavior changes must update `VERSION` or `REVISION` and update the local `CHANGELOG`.
- A file with changed behavior but unchanged metadata is considered governance-incomplete until Codex records the reason.
- A formal filename does not change when the content evolves.

## Review Rule

Codex must reject a handoff merge when a formal organ changes but its metadata, changelog, or provenance evidence is missing. Exceptions require an explicit Human decision and a follow-up WorkOrder.
