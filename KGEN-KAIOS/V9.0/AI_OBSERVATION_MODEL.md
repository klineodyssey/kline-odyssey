# AI Observation Model

**Document ID:** KAIOS-V9.0-AI-OBSERVATION-MODEL  
**Status:** Draft for Review / Prototype

## 1. Purpose

The AI Observation Model defines how V9.0 reads state. Observation is not action. AI observes public repository records, machine-readable state, reports and review logs, then produces traceable findings.

## 2. Approved Input Sources

AI may read:

- Universe State.
- Civilization State.
- World Clock.
- Citizen State.
- Profession State.
- Business State.
- Market State.
- Exchange State.
- Bank State.
- Resource State.
- Temple Activity.
- Land Development.
- Governance Signals.
- Event Stream.
- Worker Reports.
- Codex Review Log.

## 3. Source Citation Rule

Every observation must contain a source path, source type and confidence note. If the source is stale, malformed, incomplete or simulation-only, the observation must say so.

## 4. Observation Quality

Observation quality is classified as:

- `Verified`: parseable machine-readable state or reviewed report.
- `Partial`: readable but incomplete state.
- `Inferred`: derived from multiple sources.
- `Unverified`: needs Codex or Human Review.

## 5. Forbidden Observation Pattern

AI must not use hidden chat memory as the only evidence. Conversation context can help interpret the task, but GitHub documents and machine-readable records are the formal source of truth.
