# AI Human Override

**Document ID:** KAIOS-V9.0-AI-HUMAN-OVERRIDE  
**Status:** Draft for Review / Prototype

## 1. Purpose

Human Override defines how a human operator can approve, reject, pause, reprioritize, block or archive an AI recommendation.

## 2. Allowed Override Actions

- Approve.
- Reject.
- Pause.
- Change Priority.
- Block.
- Archive.

## 3. Required Override Record

Each Human Override must record:

- `who`
- `when`
- `reason`
- `previous_state`
- `new_state`

## 4. Boundary

Human Override does not erase the AI decision. It appends an auditable state transition so future AI and Codex reviews can understand why the decision changed.
