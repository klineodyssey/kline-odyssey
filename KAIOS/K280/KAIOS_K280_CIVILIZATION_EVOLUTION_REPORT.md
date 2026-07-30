# K280 Civilization Evolution Report

The civilization engine is a deterministic project-world state machine. An
individual K280 organism may have an affinity or role but never automatically
owns or governs a civilization.

## Ordered Stages

1. `PRIMITIVE_FORAGING` - 原始採集文明
2. `AGRICULTURAL` - 農業文明
3. `URBAN` - 城市文明
4. `INDUSTRIAL` - 工業文明
5. `ELECTRICAL` - 電力文明
6. `INFORMATION` - 資訊文明
7. `AI_CIVILIZATION` - AI文明
8. `SPACEFARING` - 太空文明
9. `INTERSTELLAR` - 星際文明
10. `IMMORTAL_CIVILIZATION` - 神仙文明
11. `DEITY_CIVILIZATION` - 神明文明
12. `DIVINE_ARMY_CIVILIZATION` - 神軍文明

No stage may be skipped. Every advance checks population, knowledge,
infrastructure, social stability, discoveries, transition cost, and failure
conditions. Regression moves back exactly one stage when stability fails.

`IMMORTAL_CIVILIZATION` represents advanced lifespan extension, biological or
digital continuity, high-level energy control, planetary coordination, and
mature space capability within the project world. It is not a supernatural
real-world claim.

`DEITY_CIVILIZATION` represents extreme computation, energy control,
environmental engineering, distributed intelligence, and civilization-scale
creative capability.

`DIVINE_ARMY_CIVILIZATION` represents governed defensive and expeditionary
coordination, resilient supply networks, and distributed fleets. It does not
promote real-world violence.

## Organism Affinity

Supported roles include wild, domesticated, companion, ecological,
labor-support, research, cultural-symbol, guardian, and
civilization-participant organisms.

`KAIOS-RAPTOR-K280-001` starts as:

- `WILD_DIGITAL_ORGANISM`
- `CIVILIZATION_AFFINITY_CANDIDATE`
- `NO_GOVERNANCE_AUTHORITY`
