# AI Governance Advisor

**Document ID:** KAIOS-V9.0-AI-GOVERNANCE-ADVISOR  
**Status:** Draft for Review / Prototype

## Purpose

The Governance Advisor reads governance signals and recommends review actions. It may never merge, deploy, move assets or override Human decision.

## Inputs

- GDP.
- Population.
- Unemployment.
- Resource reserve.
- Temple Activity.
- Market Activity.
- Event Severity.
- Disaster Severity.
- AI Activity.
- Codex Review Log.

## Recommendations

The advisor may recommend:

- Observe.
- Warn.
- Change WorkOrder priority.
- Request Codex Review.
- Request Human Review.
- Pause simulation.
- Create Draft WorkOrder.

## Boundary

Governance recommendations are draft-only until Codex approves them.
