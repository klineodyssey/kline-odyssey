---
TITLE: "KAIOS UI Performance Runtime Architecture"
VERSION: "0.1.0"
REVISION: "2026-07-16.1"
STATUS: "ARCHITECTURE_PROPOSAL_UNDER_REVIEW"
ARCHITECTURE: "ONLY"
IMPLEMENTATION: "NOT_STARTED"
LAST_UPDATED: "2026-07-16"
UPDATED_BY: "Codex / codex-gm-01"
REVIEWED_BY: "HUMAN_REVIEW_REQUIRED"
SOURCE_COMMIT: "ORIGIN_MAIN_89f3c351c488a0705f514adba974dd6c3dd3cb3a"
TASK_ID: "KAIOS-UI-GOVERNOR-ARCH-001"
HUMAN_DECISION_ID: "HUMAN-UI-GOVERNOR-001_REPOSITORY_ASSIGNED"
CHANGE_REASON: "Define repeatable loading, frame, resource, console and link performance evidence."
ANCESTOR: "KGEN-KAIOS/ui-governor/UI_GOVERNOR_RUNTIME.md"
SOURCE_OF_TRUTH: false
---

# Performance Runtime

## 1. Measurement Profiles

Performance uses the same eight responsive profiles plus declared network and CPU conditions. A result without environment metadata is invalid. Cold load, warm load and one representative interaction trace are separate samples.

## 2. Metrics

```text
time_to_first_byte
first_contentful_paint
largest_contentful_paint
cumulative_layout_shift
interaction_latency
time_to_surface_ready
long_task_count
main_thread_busy_time
frame_time_p50
frame_time_p95
fps_p50
fps_p05
peak_memory
transfer_bytes
request_count
failed_requests
console_errors
broken_links
```

## 3. Provisional Budgets

The first implementation must calibrate budgets against deterministic fixtures. Initial review candidates are:

| Metric | Candidate budget |
|---|---:|
| Console errors | 0 unexpected |
| Broken canonical links | 0 |
| Largest contentful paint | at or below 2.5 seconds under declared profile |
| Cumulative layout shift | at or below 0.10 |
| Interaction latency | at or below 200 ms |
| Desktop FPS p50 during pan/animation | at least 55 |
| Mobile FPS p50 during pan/animation | at least 45 |
| Inspector/Drawer open | at or below 200 ms |

Budgets are internal architecture candidates, not measured claims. A surface may receive a reviewed stricter or looser budget with reason and expiry.

## 4. Loading States

Loading must keep stable dimensions, expose a truthful state and end in `READY`, `EMPTY`, `DEGRADED`, `OFFLINE`, or `ERROR`. An infinite spinner, blank page, hidden error, fake completion percentage or layout collapse is a failure.

## 5. Frame Sampling

FPS evidence includes sample duration, warm-up, interaction script, frame count, dropped frames and percentile frame times. A single peak FPS is invalid. Background tabs, throttled timers and unsupported browser states invalidate the sample.

## 6. Console and Network

All console errors, unhandled rejections, failed same-origin resources, redirect loops and broken canonical links are recorded. An allowlist is versioned, narrow, expiring and reviewed. Known third-party CORS or wallet absence may be classified, but never silently removed from evidence.

## 7. Regression Policy

Performance compares both absolute budget and baseline-relative drift. A statistically noisy sample reruns within a bounded retry policy. Repeated noise becomes a test-infrastructure Issue rather than an automatic PASS.

## 8. Architecture Boundary

No profiler, browser script, performance workflow, budget enforcement or production optimization is implemented here.
