# Duplicate Task Detection

**Document ID:** KAIOS-V9.1-DUPLICATE-DETECTION  
**Version:** V9.1  
**Status:** Draft for Review  
**Scope:** Detecting duplicate and merge-candidate WorkOrders before promotion.

## 1. Purpose

Duplicate detection prevents KAIOS from opening multiple WorkOrders that compete for the same target, branch, report or unresolved dependency.

## 2. Duplicate Signals

A DRAFT is a duplicate or merge candidate when it shares:

- Same target.
- Same output path.
- Same protected path.
- Same decision source.
- Same asset.
- Same unresolved dependency.
- Same branch pattern.

## 3. Outcomes

| Result | Meaning | Promotion Rule |
|---|---|---|
| `UNIQUE` | No conflicting task found. | May continue review. |
| `DUPLICATE` | Same task already exists or is unresolved. | Do not promote. Reject or archive. |
| `MERGE_CANDIDATE` | Similar task should be merged or grouped. | Request revision before promotion. |

## 4. Report Path Rule

If multiple DRAFT WorkOrders use the same report path, Codex must decide whether the shared path is a valid grouped report or a collision. A collision cannot be promoted until resolved.

## 5. Branch Pattern Rule

Two active WorkOrders cannot share the same handoff branch. If the branch pattern is reused, the newer task must be rejected, revised or assigned a new branch pattern.
