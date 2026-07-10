# Resource Regeneration

**Document ID:** KAIOS-V8.3-RESOURCE-REGENERATION  
**Status:** Draft for Review / Prototype

## 1. Purpose

Resource Regeneration defines how natural and civilization resources recover, deplete and rebalance over time.

## 2. Resource Classes

V8.3 inherits V8.2 resource classes:

- Food.
- Wood.
- Stone.
- Metal.
- Energy.
- Knowledge.
- Data.
- AI Compute.
- Gold.
- KGEN.
- Temple Point.
- Civilization Point.

## 3. Tick Changes

Each resource may update through:

- Natural recovery.
- Citizen consumption.
- Business consumption.
- Production output.
- Recycling.
- Seasonal modifier.
- Disaster modifier.
- Governance response.

## 4. Regeneration Model

```text
Next Quantity =
  Current Quantity
  + Natural Recovery
  + Production
  + Recycling
  - Consumption
  - Decay
  +/- Event Modifier
```

## 5. Scarcity Signal

When a resource falls below its reserve threshold, the engine emits a scarcity signal. Scarcity can reduce business output, raise market pressure and trigger governance response.

## 6. Boundary

KGEN token references remain accounting or public contract references. V8.3 does not mint, transfer or custody tokens.
