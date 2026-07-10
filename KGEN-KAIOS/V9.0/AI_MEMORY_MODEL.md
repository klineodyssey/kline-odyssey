# AI Memory Model

**Document ID:** KAIOS-V9.0-AI-MEMORY-MODEL  
**Status:** Draft for Review / Prototype

## 1. Purpose

AI Memory stores traceable context for future decisions. It is not private chat memory. It must point to GitHub files, machine-readable state, reports, review logs or explicit Human Overrides.

## 2. Memory Types

| Memory Type | Purpose |
|---|---|
| Short-Term Memory | Current evaluation context and active state. |
| Task Memory | WorkOrder, branch, report and review state. |
| Civilization Memory | Long-running civilization metrics and history. |
| Canon Memory | Canon rules and official policy references. |
| Decision History | Previous AI decisions and outcomes. |
| Failure Memory | Failed, rejected, blocked or risky attempts. |
| Review Memory | Codex and Human review results. |

## 3. Source Traceability

Each memory record must include:

- Memory ID.
- Memory Type.
- Source Path.
- Source Commit.
- Evidence Summary.
- Confidence.
- Expiration or archive rule.

## 4. Memory Boundary

Memory can support recommendations but cannot override Canon, protected paths, Codex Review or Human Override.
