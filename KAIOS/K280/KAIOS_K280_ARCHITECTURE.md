# K280 Digital Life Architecture

## Scope

K280 proves that KAIOS can assemble and run a governed software organism from
a validated species specification. It is a bounded local simulation with no
network dependency, wallet, real KGEN, external agent, or Production Runtime
authority.

## Layers

1. Canonical contract: Organism Manifest Schema V2 and central registries.
2. Species package: taxonomy, genome, body, cells, organs, behavior, memory,
   lifecycle, reproduction, mutation, habitat, energy, rights, and runtime
   binding.
3. Organism package: unique MVP-scoped IDs and current biological-simulation
   state.
4. Birth pipeline: ten fail-closed stages from specification to local release.
5. Runtime: deterministic, serializable state transitions with bounded logs.
6. Habitat: K280 environment and deterministic pressure model.
7. Population: capacity-limited reproduction, death, mutation, and candidate
   branches.
8. Civilization: an ordered state machine separate from individual organisms.
9. Viewer and API: read-only browser projection and static JSON snapshots.
10. K11520 package: simulated listing with ten independent right classes.

## Birth Pipeline

`SPECIFICATION -> VALIDATION -> TAXONOMY -> SPECIES_PROGRAM_BINDING ->
GENOME_GENERATION -> ORGANISM_ID_ASSIGNMENT -> EMBODIMENT_BINDING ->
BIRTH_RECORD -> RELEASE -> DIGITAL_RUNTIME_LIFE`

Every stage records its input, output, timestamp, validation status, source
version, deterministic seed, checksum, and event. Failure terminates the
pipeline. `RELEASE` means release into `LOCAL_DETERMINISTIC_SIMULATION` only.

## Runtime Contract

The engine supports tick, sleep/wake/rest, movement, perception, eating,
drinking, energy and needs updates, health and temperature changes, growth,
behavior selection, memory, social interactions, simulated hunting and escape,
injury and healing, terminal death, mutation, mate selection, and bounded
reproduction.

Fixed inputs and seed produce fixed outputs. Snapshots are serializable,
stoppable, resumable, and replayable. Memory and events are capped, and the
population hard maximum is 500.

## Identity Boundary

The first package has separate life, organism, species, genome, embodiment,
birth-event, and runtime-instance IDs. These identifiers are scoped to the
digital MVP. They do not assert legal personhood, real sentience, biological
life, real ownership, employment, wallet control, or production authority.

## Habitat and Viewer

The K280 viewer consumes static API projections and the same deterministic
engine used by tests. It supports start, pause, resume, step, reset, speed,
replay, genome, organ, rights, civilization, and simulated-listing inspection
across desktop, tablet, and mobile layouts.

## Customer Workflow

The customer workflow is:

`CUSTOMER_REQUEST -> REQUIREMENT_VALIDATION -> SPECIES_MATCH ->
GENOME_GENERATION -> ORGANISM_PACKAGE -> SIMULATION_TEST -> RIGHTS_PACKAGE ->
CUSTOMER_PREVIEW -> SIMULATED_LISTING`

It keeps `CUSTOM_SPECIES_TEMPLATE`, `CUSTOM_ORGANISM_INSTANCE`,
`CUSTOM_VISUAL_ASSET`, `CUSTOM_RUNTIME_PROFILE`, and `CUSTOM_RIGHTS_PACKAGE`
as separate artifacts.
