# KGEN Evolution Lineage Standard

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
| CHANGE_REASON | Define governed evolution events and lineage records. |
| ANCESTOR | KGEN-KAIOS/BIOLOGICAL_TAXONOMY_STANDARD.md |
| SOURCE_OF_TRUTH | TRUE |

## Evolution Events

KGEN organisms may evolve only through governed events:

| Event | Meaning | Review Requirement |
|---|---|---|
| CREATE | Create a new formal organism manifest | Codex review |
| MUTATE | Small internal change | Codex review |
| UPGRADE | Version or capability upgrade | Codex review, Human if protected |
| FORK | Create a separate lineage | Codex + dependency check |
| MERGE | Combine lineages | Codex + compatibility check |
| FUSION | Combine functions into new organism | Codex + security review |
| SPLIT | Divide one organism into children | Codex + migration plan |
| REPRODUCE | Generate child organism conceptually | Codex review; no automatic code generation |
| DEPRECATE | Mark organism superseded | Codex review |
| ARCHIVE | Freeze historical organism | Codex review |
| REVIVE | Restore archived organism | Codex + Human review |

## Required Event Record

Every evolution event must record:

- `evolution_event_id`
- `organism_id`
- `from_version`
- `to_version`
- `parent_species`
- `child_species`
- `source_task`
- `source_commit`
- `author_agent`
- `reviewer_agent`
- `compatibility_result`
- `migration_required`
- `rollback_path`

## Safety Boundaries

Reproduction, fusion, split, and mutation are not unlimited automatic code generation. They are bounded by Canon, security, compatibility, Human / Codex review, protected paths, and WorkOrder provenance.
