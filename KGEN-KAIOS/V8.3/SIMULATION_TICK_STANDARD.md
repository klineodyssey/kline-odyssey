# Simulation Tick Standard

**Document ID:** KAIOS-V8.3-SIMULATION-TICK-STANDARD  
**Status:** Draft for Review / Prototype

## 1. Tick Definition

A Tick is the smallest scheduled movement visible to KAIOS governance. It is not necessarily one real-world second. The Tick Rate can be configured for demo, testing, long-running simulation or future production review.

## 2. Official Tick Scales

| Scale | Meaning | Typical Use |
|---|---|---|
| `1 Tick` | Atomic simulation movement | Entity state update |
| `1 Minute` | Short behavior window | Movement, small consumption |
| `1 Hour` | Work and service window | Work, trade, restock |
| `1 Day` | Daily economy loop | Wage, activity, fatigue |
| `1 Week` | Social and business cycle | Ranking, demand, scheduling |
| `1 Month` | Governance cycle | Tax, treasury, population |
| `1 Season` | Resource and event cycle | Weather, harvest, festival |
| `1 Year` | Civilization stage cycle | Growth, archive, history |

## 3. Configurable Tick Rate

Tick Rate may be configured as:

- `Realtime`: one simulation minute follows a real minute.
- `Accelerated`: simulation moves faster for testing.
- `Paused`: no entity updates run.
- `ReviewOnly`: dashboard can render timeline state but not advance it.

## 4. Tick Execution Order

```text
Clock Update
  -> Citizen Behavior
    -> Business Behavior
      -> Temple Activity
        -> Resource Regeneration
          -> Market Signal
            -> Event Engine
              -> Governance Response
                -> Timeline Snapshot
```

## 5. Safety Rules

If a Tick touches regulated concepts, protected systems or production assets, it must be represented as a simulation signal only. It must not execute real transactions, wallet actions, treasury movement or external calls.
