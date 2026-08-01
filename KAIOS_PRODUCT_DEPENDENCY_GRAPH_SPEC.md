# KAIOS Product Dependency Graph Specification

Status: `SPECIFICATION_ONLY`

Version: `1.0.0`

## Product Contract

Every product defines:

`required_components, required_materials, required_machines,
required_factories, required_technology, required_workers, required_energy,
required_water, required_transport, required_warehouse,
required_sales_channels, required_service, required_recycling`

Names are generic canonical classes and must not contain real trademarks.

## Reference Product Tree

| Product | Components and materials | Machines and factory | Technology and workers | Utilities, logistics and lifecycle |
|---|---|---|---|---|
| `AUTOMOBILE` | chassis, drivetrain, controls; steel, glass, polymers | stamping, welding, coating, assembly; vehicle factory | industrial transport; metal, electrical, assembly and QA workers | electricity, water, road transport, vehicle warehouse, dealer/direct sales, repair and material recovery |
| `REFRIGERATOR` | compressor, heat exchanger, controller; steel, copper, insulation | forming, brazing, charging and assembly; appliance factory | refrigeration; metal, electrical, assembly and QA workers | electricity, water, truck, appliance warehouse, retail/direct sales, repair and refrigerant/material recovery |
| `ELECTRIC_RICE_COOKER` | heater, vessel, thermostat, enclosure; metal and insulation | forming, wiring, testing and assembly; appliance factory | electrical heating; metal, electrical, assembly and QA workers | electricity, water, truck, appliance warehouse, retail/wholesale, repair and material recovery |
| `BASIC_PHONE` | display, radio board, battery, enclosure; glass, copper and polymers | board assembly and device assembly; electronics factory | basic mobile communication; electronics, assembly and QA workers | controlled electricity/water, secure transport/warehouse, retail/direct sales, repair and battery/e-waste recovery |
| `INDUSTRIAL_MACHINE` | frame, motor, controls, tooling; steel and copper | machining, welding, wiring and calibration; machine factory | industrial machinery; machinists, welders, electricians and QA workers | high electricity, water as required, heavy transport/warehouse, contract sales, field service and metal recovery |
| `SMARTPHONE_PLATFORM` | compute board, radio, display, battery, enclosure and software image | semiconductor input, board assembly and device assembly; electronics factories | advanced mobile computing; hardware, software, assembly, security and QA workers | high-quality utilities, multimodal secure logistics, controlled warehouse, retail/contract sales, update/repair and e-waste recovery |
| `ADVANCED_COMPUTE_CHIP` | wafer, masks, process chemicals and package; silicon and specialty materials | lithography, deposition, etch, metrology, packaging and test; semiconductor facilities | advanced semiconductor process; process, equipment, materials, safety and QA workers | uninterrupted electricity, ultrapure water, controlled transport/storage, contract sales, technical service and hazardous/material recovery |

## Evaluation

Dependencies form a directed acyclic graph. A product lot may start only after
all ancestors are valid. A missing leaf produces its exact block reason; the
engine must not infer or fabricate an alternate supplier. Substitution requires
a separately validated design revision, quality result and provenance record.

Product capability must be checked at the planned quantity. One available
machine or worker does not imply sufficient capacity. Advanced products remain
blocked unless every upstream industrial layer is present.
