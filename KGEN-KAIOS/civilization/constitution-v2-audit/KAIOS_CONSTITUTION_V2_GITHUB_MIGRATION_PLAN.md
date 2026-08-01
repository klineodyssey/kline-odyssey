# KAIOS Constitution V2 GitHub Migration Plan

Task: `KAIOS-CONSTITUTION-V2-FULL-AUDIT-001`

Status: `PLAN_ONLY / NO_IMPORT / HUMAN_APPROVAL_REQUIRED`

## Proposed Structure

```text
docs/kaios-constitution/
  constitution/
  runtime/
  whitepapers/
  biology/
  physics/
  economy/
  civilization/
  government/
  technology/
  archive/
  manifest/
```

This tree is not created by the audit.

## Authority Rules

1. Raw source snapshots go to `archive/` with original SHA-256 and no content edits.
2. Audit manifests and source decisions go to `manifest/`.
3. `constitution/` contains only documents explicitly promoted by Human approval.
4. `runtime/` contains specifications only; active Runtime remains governed by existing `CURRENT` files.
5. `physics/`, `economy/`, `biology/`, and other topic folders contain reconciled reference documents, never duplicate Canonical schemas.
6. Whitepapers must be cumulative editions and cannot be reconstructed from diff-only fragments.
7. No imported chapter may activate wallet, KGEN, settlement, worker autonomy, or Production Runtime.

## Proposed Migration Stages

### Stage 0 - Source Freeze

- Preserve the local 144-file source unchanged.
- Record the manifest SHA and all source hashes.
- Preserve repository V2.1 hashes separately.

### Stage 1 - Human Source Decision

- Select the lineage for V2.1 Chapters 000 and 133-138.
- Decide whether local V2.0 headings or repository V2.1 headings are authoritative.
- Decide navigation and signature metadata explicitly.

### Stage 2 - Structural Repair Copies

- Create migration copies, never edit originals.
- Repair the 41 unbalanced Markdown fence files.
- Validate headings, links, UTF-8, and rendering.

### Stage 3 - Topic Reconciliation

- Reconcile duplicate chapter families as bundles.
- Map each normative assertion to an existing Canonical or protected authority.
- Remove executable implications from draft text unless separately approved.

### Stage 4 - Canonical Review

- Review Constitution, Runtime Specification, Canonical Specification, Whitepaper, and Archive classes separately.
- Require independent P0/P1/P2 review and explicit Human promotion approval.

### Stage 5 - Reference Import

- Import only approved reference/archive material first.
- Preserve source paths, hashes, provenance, and supersession links.
- Do not update CURRENT in this stage.

### Stage 6 - Optional Promotion

- Use one narrowly scoped PR per authority class.
- Never combine Constitution promotion with Runtime activation.
- Require explicit Human approval before merge.

## Rollback

Every future import must be reversible by reverting its migration PR. Original local files and existing Canonical files remain untouched, so rollback never requires history rewriting.

## Current Gate

Migration is blocked by source divergence and Markdown structural failures. This audit does not authorize Stage 1 or later.
