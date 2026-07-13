# Parcel Standard

## Object
A Parcel is a land registry unit with geometry, overlay authorities, and zone classification.

## Fields (Architecture)
- `parcel_id`
- `celestial_body_id` (Earth / Moon / other)
- `geometry_ref` (coordinate system defined in COORDINATE_GEOMETRY_STANDARD)
- `owner_id`
- `governor_id`
- `tax_authority_id`
- `defense_authority_id`
- `airspace_authority_id`
- `orbital_authority_id`
- `zone_type`
- `protection_flags` (e.g. CORE_HOMELAND, RESIDENTIAL_PROTECTED)

## Rules
- Parcel ≠ Player.
- Ownership geometry is Land Runtime exclusive.
