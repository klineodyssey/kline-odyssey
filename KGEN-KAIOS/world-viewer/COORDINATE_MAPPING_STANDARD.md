---
TITLE: "KAIOS World Viewer Coordinate Mapping Standard"
VERSION: "1.0.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_BASELINE_FROZEN"
ARCHITECTURE: "ONLY"
IMPLEMENTATION: "NOT_STARTED"
LAST_UPDATED: "2026-07-15"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "Codex internal independent UI review; Human delegated approval"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-WORLD-VIEWER-001"
HUMAN_DECISION_ID: "HUMAN-WORLD-VIEWER-001; HUMAN-WORLD-VIEWER-INDEPENDENT-REVIEW-001; HUMAN-PRIMEFORGE-FULL-AUTOPILOT-001"
CHANGE_REASON: "Separate K280 identity, geodetic registry geometry, 2D display projection and local building coordinates."
ANCESTOR: "docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json; KGEN-KAIOS/land/LAND_RUNTIME_ARCHITECTURE_BASELINE.md"
SOURCE_OF_TRUTH: false
DOMAIN: KGENVERSE
KINGDOM: CivilizationInterface
PHYLUM: WebRuntimeArchitecture
CLASS: CoordinateAdapterContract
ORDER: LandInteraction
FAMILY: KAIOS
GENUS: WorldViewer
SPECIES: WorldViewerCoordinateMappingStandard
CANONICAL_FILE: "KGEN-KAIOS/world-viewer/COORDINATE_MAPPING_STANDARD.md"
---

# Coordinate Mapping Standard

## 1. Non-Negotiable K280 Rule

```text
planet_id = EARTH
surface_k = 280
surface_layer = GROUND
```

K280 is the Earth surface K-Sphere anchor. It is not Cartesian `Z=280`.

XYZ remains an observation, computation or rendering frame. It is not the source of Parcel ownership geometry.

## 2. Coordinate Stack

```text
Universe Map K anchor
-> Earth surface geodetic position
-> Region / City geodetic bounds
-> Parcel geodetic polygon
-> 2D display projection
-> Screen pixels
```

For local structures:

```text
Parcel geodetic origin
-> Parcel Local ENU
-> Building footprint
-> Building / Floor local frame
-> Room polygon
-> Screen pixels
```

Every adapter is reversible within its documented precision or reports that reversal is unavailable.

## 3. Earth Surface Position Projection

Viewer draft projection:

```text
EarthSurfacePositionProjection {
  universe_id
  planet_id
  surface_k
  surface_layer
  latitude_deg
  longitude_deg
  altitude_m
  coordinate_epoch
  source_revision
}
```

This is a Viewer projection, not a new Land Runtime schema.

## 4. Derived Earth-Fixed XYZ

For reference radius `R`, latitude `phi`, longitude `lambda` and height `h`:

```text
X = (R + h) cos(phi) cos(lambda)
Y = (R + h) cos(phi) sin(lambda)
Z = (R + h) sin(phi)
```

Invariant:

```text
sqrt(X^2 + Y^2 + Z^2) ~= R + h
```

XYZ is derived and may be cached for computation. The viewer must retain the source geodetic record and coordinate epoch.

## 5. Display Projection

The 2D map engine may use Web Mercator or another reviewed display projection. Display projection is allowed for navigation and rendering only.

It must not be used directly for:

- Parcel area settlement.
- Ownership overlap decisions.
- Legal cadastral claims.
- Altitude or K-index derivation.
- Rewriting geodetic source vertices.

## 6. Parcel Geometry

The Viewer receives a versioned Parcel geometry projection with:

```text
parcel_id
planet_id
surface_k
geometry_type
outer_ring
holes
centroid
area_m2
geometry_revision
source_snapshot_id
```

The Land Runtime remains responsible for authoritative geometry rules. The viewer validates enough to avoid rendering or selecting malformed geometry, then reports failures without repairing source data.

## 7. Local ENU

Building and Room navigation uses a parent-scoped local frame:

```text
E = East
N = North
U = Up
```

Draft frame fields:

```text
frame_id
parent_parcel_id
origin_geodetic
coordinate_epoch
unit = meter
orientation = RIGHT_HANDED_ENU
frame_revision
```

Building footprint points use East / North. Height and floors use Up or an explicit floor frame. A Room cannot exist without a Building parent and floor reference.

## 8. Hierarchy Identity

| Level | Required stable reference |
|---|---|
| Earth | `planet_id=EARTH`, `surface_k=280` |
| Region | `region_id`, geodetic bounds |
| City | `city_id`, `region_id`, geodetic bounds |
| Parcel | `parcel_id`, `city_id` or approved administrative lineage, geodetic polygon |
| Building | `building_id`, `parcel_id`, local footprint |
| Room | `room_id`, `building_id`, `floor_id`, local polygon |

Region, City, Building geometry and Room identity require later baseline or adapter approval. This proposal does not add those fields to frozen Land Runtime files.

`CITY` is a Viewer semantic level, not an authority to rename administrative records. A `CityProjection` may represent an approved City, County, Town, District or equivalent source unit, but it must preserve:

```text
city_id
source_admin_type
source_admin_id
source_admin_lineage
source_revision
```

The adapter must not rewrite an existing Parcel ID, Region code, County code or Town code merely to fit the Viewer hierarchy.

## 9. Screen Mapping

Selection pipeline:

```text
screen_point
-> inverse viewport transform
-> display coordinate
-> geodetic or local coordinate
-> spatial index candidate query
-> exact source-model geometry test
-> stable object ID
```

Rendering pipeline is the forward path. Pixel coordinates are never persisted as entity coordinates.

## 10. Edge Cases

- Normalize antimeridian crossing before display splitting.
- Preserve source ring lineage when a polygon is split for rendering.
- Use reviewed polar handling near projection limits.
- Reject NaN, Infinity and out-of-range latitude / longitude.
- Record units at every local-frame boundary.
- Do not infer missing altitude, epoch or source revision for rights-bearing data.
- Revalidate a selected object after any snapshot or geometry revision.

## 11. GPS Mapping

Browser location may be converted to a coarse Region or City navigation target after explicit consent. It must not be written into Parcel geometry, ownership records or public logs.

Account `starter_parcel_id` is the preferred locator because it identifies the governed Parcel without exposing live location.
