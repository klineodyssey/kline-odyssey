---
TITLE: "KAIOS World Viewer V1 LOD and Performance Review"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "INTERNAL_REVIEW_PROPOSAL"
IMPLEMENTATION: "NOT_STARTED"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "HUMAN_REVIEW_REQUIRED"
SOURCE_COMMIT: "ORIGIN_MAIN_7a692c34df50861ab10f8bd80959d95251b1071c"
TASK_ID: "HUMAN-WORLD-VIEWER-INDEPENDENT-REVIEW-001"
CHANGE_REASON: "Review semantic LOD, chunking, cache, mobile fallback and measurable performance budgets."
ANCESTOR: "KGEN-KAIOS/world-viewer/WORLD_VIEWER_RUNTIME.md"
SOURCE_OF_TRUTH: false
---

# World Viewer LOD And Performance Review

## 1. Review Judgment

The existing proposal correctly requires semantic LOD, viewport tiling, spatial indexes, lazy Building/Room loading, request cancellation and versioned cache. The architecture is scalable in shape but not yet testable enough to freeze. It needs explicit load, unload and performance budget contracts.

## 2. LOD Contract

| LOD | Semantic view | Minimum data | Explicitly excluded |
|---:|---|---|---|
| 0 | Earth / K280 overview | Earth shell, Region extents, aggregate status | Parcel polygons, Buildings, Rooms, player details |
| 1 | Region | Selected/visible Regions, City clusters, aggregate density | Full Parcel geometry and private population records |
| 2 | City / County / Town overlay | Administrative lineage, Parcel clusters or simplified boundaries | All detailed Parcels, all Buildings |
| 3 | Land Parcels | Visible Parcel polygons, land-use/protection projection, selectable IDs | Off-screen Parcels, Room details |
| 4 | Buildings | Selected Parcel plus visible Building footprints and public aggregates | Other cities' Buildings, Room geometry |
| 5 | Rooms / Interior | Selected Building, floor index and authorized Room projection | Other Buildings' Rooms, private occupancy data |

`CITY` remains a semantic overlay. Source administrative identity and Parcel parent lineage must remain intact.

## 3. Load Window

Each level loads only:

1. The current viewport.
2. A small configurable prefetch margin.
3. The selected object and its parent chain.
4. The minimum child summary needed to indicate drill-down availability.

Leaving a viewport or semantic level cancels in-flight requests. Results arriving after cancellation may enter a versioned cache but may not alter current selection or camera state.

## 4. Tile And Chunk Rules

- Static projections are divided by semantic level and stable spatial key.
- A chunk declares `snapshot_id`, `schema_version`, `source_revision`, `generated_at`, bounds, object count, integrity value and stale policy.
- Chunk boundaries are display/load boundaries, not ownership boundaries.
- A Parcel crossing a tile edge retains one canonical ID and geometry revision.
- Duplicate edge features are deduplicated by stable ID and compatible revision.
- Antimeridian and projection-limit chunks require explicit tests.
- Chunk URLs use the repository's Pages base path and never become Source of Truth.

## 5. Spatial Index

The client may use an R-tree, flat spatial index or map-engine feature index behind `SpatialIndex`. Exact selection still validates the candidate against the appropriate canonical-derived geometry:

```text
coarse viewport index
-> candidate stable IDs
-> active-frame geometry test
-> snapshot/revision validation
-> deterministic selection priority
```

The index cannot grant rights or infer ownership from screen pixels.

## 6. Cache And Unload

Recommended V1 policy:

- Versioned, bounded in-memory LRU cache.
- Optional browser cache only for public immutable snapshots.
- No raw KYC, exact private GPS, auth tokens or private owner projections in persistent cache.
- Keep the active level, parent checkpoint and one adjacent prefetch ring.
- Unload least-recently-used off-screen geometry first.
- Under memory pressure, disable prefetch, simplify geometry, reduce labels, then reduce entity cap.
- A source revision mismatch invalidates dependent child chunks and selection.
- Offline mode may use only version-compatible public snapshots with a visible freshness state.

## 7. Prefetch

Allowed prefetch:

- Adjacent Region/City summaries in the camera direction.
- Child counts and simplified bounds for the focused object.
- The selected Parcel's Building summary.
- The selected Building's floor index only after user intent to drill down.

Forbidden prefetch:

- Whole-Earth Parcels.
- Every Building or Room.
- Private Player or AI Worker details.
- Exact GPS histories.
- Data outside the current permission projection.

## 8. Recommended Performance Budgets

These are proposed review targets. Human baseline review may amend them after profiling.

| Metric | Desktop target | Representative mobile target | Test method |
|---|---:|---:|---|
| Initial critical compressed payload | <= 1.5 MB excluding optional tiles | <= 1.5 MB excluding optional tiles | Cold-cache transfer audit |
| Critical JavaScript gzip | <= 500 KB including map engine | <= 500 KB including map engine | Bundle manifest audit |
| First usable map frame | <= 1.5 s | <= 2.5 s | Performance marks, Fast 4G profile |
| Time to Interactive | <= 3 s | <= 5 s | Lighthouse plus input probe |
| Maximum detailed visible Parcels | 2,000 | 750 | Synthetic viewport stress fixture |
| Pan / zoom target | 60 FPS | 45 FPS | Frame timing during scripted gestures |
| Low-end fallback floor | 30 FPS | 30 FPS | CPU-throttled scripted gestures |
| Mobile JS heap | <= 256 MiB desktop | <= 160 MiB mobile | Browser memory sampling |
| Parcel hit test p95 | <= 16 ms | <= 24 ms | 1,000 deterministic hit tests |
| Inspector open p95 | <= 100 ms | <= 150 ms | Selected object already local |
| Camera input response p95 | <= 50 ms | <= 80 ms | Event-to-frame instrumentation |

The implementation must report device/browser profile, data size, geometry complexity and cache state with every result. A single high-end desktop pass is insufficient.

## 9. Low-End Mobile Fallback

Fallback order:

1. Disable inertia and non-essential easing.
2. Reduce labels and secondary overlays.
3. Simplify display geometry while retaining canonical IDs.
4. Reduce prefetch margin.
5. Lower visible detailed-Parcel cap and cluster summaries.
6. Switch from decorative base map to neutral background if provider cost is excessive.
7. Preserve selection, Home, Back, Inspector and proposal preview before optional decoration.

The fallback may reduce display detail, never coordinate integrity or permission checks.

## 10. GitHub Pages Review

GitHub Pages is suitable for the static viewer and synthetic fixtures if the implementation follows these rules:

- Use relative module and asset URLs or a single explicit Pages base-path helper.
- Do not assume deployment at `/` because production uses `/kline-odyssey/`.
- Preserve case-sensitive paths.
- Avoid SPA-only route fallback; `index.html` remains the actual route entry.
- Content-hash public chunks or version them through the manifest.
- Treat Pages caching as untrusted freshness until source revision validation passes.
- Do not place secrets, auth tokens or private datasets in deployed assets.
- Test local root serving and production subpath serving.

## 11. Renderer Review

| Renderer | Strength | Limit | Recommendation |
|---|---|---|---|
| SVG | Accessibility and inspectability | DOM cost at high feature count | Use for low-count overlays or accessibility proxy |
| Canvas 2D | Efficient batched polygons | Requires separate accessibility model | Preferred V1 dense-layer candidate |
| WebGL | High scale | More complexity and device variance | Future adapter after V1 evidence |
| Three.js | 3D scene support | Not needed for 2D parcel operation | Excluded from V1 |

The map engine must remain behind `MapEngineAdapter`; no renderer may redefine K280 or ownership geometry.

## 12. Synthetic Performance Fixture

The minimum functional fixture contains 12 Parcels, but performance validation also needs generated scale tiers that preserve synthetic-only status:

```text
TIER_A: 12 Parcels
TIER_B: 250 Parcels
TIER_C: 750 Parcels
TIER_D: 2,000 Parcels
TIER_E: overload test above the supported cap
```

Only `TIER_A` is part of the player demo. Higher tiers test loading, clustering, hit tests, cancellation, cache and fallback behavior without claiming real land records.

## 13. Required Evidence Before Baseline

1. Agreed target device/browser matrix.
2. Map engine and license review.
3. Projection/chunk manifest draft.
4. Cache privacy decision.
5. Entity-budget rationale.
6. Scripted pan, zoom, resize and orientation test plan.
7. Memory-pressure and stale-snapshot behavior.
8. Pages root/subpath route test plan.

No implementation is authorized by this review.

