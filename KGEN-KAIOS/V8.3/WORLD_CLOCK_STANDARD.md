# World Clock Standard

**Document ID:** KAIOS-V8.3-WORLD-CLOCK-STANDARD  
**Status:** Draft for Review / Prototype  
**Purpose:** Define the official time layers used by KAIOS V8.3.

## 1. Clock Layers

KAIOS V8.3 uses nested clocks:

```text
Universe Time
  -> Civilization Time
    -> World Time
      -> Temple Time
        -> Business Time
          -> Citizen Time
```

Each layer can inherit from its parent while keeping a local offset and cycle.

## 2. Universe Time

Universe Time is the highest simulation clock. It defines the global epoch, absolute tick index and universal season reference. It is read-only for normal workers.

## 3. Civilization Time

Civilization Time tracks the social and economic rhythm of one civilization. It can pause or slow if governance review marks the civilization as blocked.

## 4. World Time

World Time maps the civilization clock into a playable world. It controls day/night, seasonal weather, travel conditions and public event windows.

## 5. Temple Time

Temple Time determines ritual windows, service activity, population attraction and civilization influence. Each Temple may have a local activity curve while still respecting World Time.

## 6. Business Time

Business Time defines opening hours, production shifts, restock windows, wage cycles, inventory decay and customer flow.

## 7. Citizen Time

Citizen Time defines work, rest, learning, movement, trade, sleep and upgrade opportunities. Citizen Time must not force player action; it is a simulation state.

## 8. Clock Record

Every clock record should include:

- `clock_id`
- `clock_scope`
- `parent_clock`
- `epoch`
- `tick_index`
- `tick_rate`
- `local_time`
- `cycle`
- `timezone_model`
- `status`

## 9. Governance Boundary

Clock changes that affect economy, population, bank, exchange, war concept or disaster simulation must be recorded as governance-visible events.
