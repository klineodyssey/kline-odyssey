# KAIOS Canonical Life Physics Binding V1

Status: `SPECIFICATION_ONLY`
Authority: subordinate to `docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md`

Every Life records mass, gravity, weight, volume, density, position,
temperature, energy, material conservation, water balance, time progression,
damage, wear, repair and transportability. Velocity is required only when the
Life is movable. Values require explicit units and provenance.

## Invariants

- `weight = mass * local_gravity`; gravity is environment-specific.
- Material input minus output, storage and measured loss must balance.
- Energy-consuming transitions require available energy and elapsed time.
- Water storage changes equal inflow minus outflow, consumption and evaporation.
- Damage and wear cannot improve without a recorded repair, healing or natural
  recovery process with resources and time.
- Transport changes position only through a valid route and elapsed time.

Trees cannot grow without water, energy and time. Fish cannot survive outside a
compatible water body. Rivers cannot reverse a gravity gradient without a
recorded force or engineered system. Mountains cannot form instantly. Soil
fertility cannot increase without a recorded material or biological cause.

This is a deterministic simulation contract, not an engineering certification
or a change to Physics Runtime CURRENT.
