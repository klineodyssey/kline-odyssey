# KGEN Biological Taxonomy Standard

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
| CHANGE_REASON | Establish formal biological naming for KGEN life organisms. |
| ANCESTOR | PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md taxonomy section |
| SOURCE_OF_TRUTH | TRUE |

## Purpose

KGEN treats formal systems as living organisms. A life organism can be a Temple, Land, App, Runtime, AI organ, Citizen model, Economy engine, or other governed entity that has a canonical file and runtime entry.

## Required Taxonomy

Every formal organism manifest must include the eight biological levels in English and Chinese:

| English | 中文 | Meaning In KGEN |
|---|---|---|
| Domain | 域 | Highest universe domain, for example `KGEN-Universe` |
| Kingdom | 界 | Major life kingdom, for example `Temple`, `Land`, `App`, `AI`, `Runtime` |
| Phylum | 門 | System lineage family, for example `Portal`, `Economy`, `Civilization` |
| Class | 綱 | Functional class, for example `ServiceNode`, `MarketNode`, `Dashboard` |
| Order | 目 | Execution order or operational family |
| Family | 科 | Related organ family |
| Genus | 屬 | Stable formal product or organism group |
| Species | 種 | Exact formal species mapped to `canonical_file` and `runtime_entry` |

## Formal Species Rule

`species` is not a poetic label. A species is formal only when it points to:

1. `canonical_file`
2. `runtime_entry`
3. `dna_schema`
4. `status`
5. `version`
6. `author_agent`
7. `reviewer_agent`
8. `source_commit`

If no canonical file exists, the item is a concept, not a formal species.

## Protected Organisms

Protected organisms such as Temple 12345 may be referenced in an example manifest, but their protected files must not be modified unless a Human explicitly approves a narrow task.
