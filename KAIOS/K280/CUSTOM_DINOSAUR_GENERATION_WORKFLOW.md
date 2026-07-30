# Custom Dinosaur Generation Workflow

The customer specification is validated against
`CUSTOM_DINOSAUR_REQUEST_SCHEMA.json`.

Required or defaulted inputs are dinosaur type, size, appearance, temperament,
intelligence, diet, habitat, movement, social behavior, lifespan,
reproduction, mutation range, civilization affinity, rights, commercial-use
status, transferability, and simulation limits.

## Pipeline

`CUSTOMER_REQUEST -> REQUIREMENT_VALIDATION -> SPECIES_MATCH ->
GENOME_GENERATION -> ORGANISM_PACKAGE -> SIMULATION_TEST -> RIGHTS_PACKAGE ->
CUSTOMER_PREVIEW -> SIMULATED_LISTING`

## Separate Outputs

- `CUSTOM_SPECIES_TEMPLATE`
- `CUSTOM_ORGANISM_INSTANCE`
- `CUSTOM_VISUAL_ASSET`
- `CUSTOM_RUNTIME_PROFILE`
- `CUSTOM_RIGHTS_PACKAGE`

The workflow creates only software simulations and previews. It does not
promise biological cloning, dinosaur resurrection, ownership of living
animals, blockchain ownership, or automatic commercial rights.
