# Governance Response

**Document ID:** KAIOS-V8.3-GOVERNANCE-RESPONSE  
**Status:** Draft for Review / Prototype

## 1. Purpose

Governance Response converts time-based signals into civilization review actions. It is the bridge from simulation to Codex review, Cursor WorkOrders and future AI worker dispatch.

## 2. Input Signals

Governance reads:

- GDP.
- Population.
- Unemployment.
- Resource reserve.
- Temple Activity.
- Market Activity.
- Citizen Energy.
- Business Growth.
- Event Severity.
- Disaster Severity.
- AI Activity.

## 3. Response Types

- Observe.
- Warn.
- Recommend.
- Open WorkOrder.
- Pause Simulation.
- Request Codex Review.
- Archive Snapshot.

## 4. Governance Flow

```text
Tick Snapshot
  -> Signal Evaluation
    -> Risk Class
      -> Response Type
        -> Report
          -> Codex Review
```

## 5. Production Boundary

Governance Response may recommend work. It does not automatically merge code, execute trades, move treasury, modify protected paths or override Canon.
