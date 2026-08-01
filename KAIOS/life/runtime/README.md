# KAIOS Life Runtime V1

This directory contains the bounded executable simulation layer for the eight PR #69 foundational candidate packages.

The runtime is deterministic, serializable, replayable, and local-only. It models growth or formation, energy, water balance, environmental dependencies, health or integrity, natural change, and death or termination without activating Production Runtime.

Boundaries:

- `LOCAL_DETERMINISTIC_SIMULATION`
- `SIMULATION_ONLY`
- `NO_REAL_KGEN`
- `NO_REAL_WALLET`
- `NO_PRODUCTION_AUTHORITY`
- no settlement, autonomous external process, or canonical promotion

PR #69 packages remain `CANDIDATE_ONLY`. Executability in this sandbox does not make them Canonical.
