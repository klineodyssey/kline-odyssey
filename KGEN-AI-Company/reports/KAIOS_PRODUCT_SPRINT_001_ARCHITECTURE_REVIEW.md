# KAIOS Product Sprint 001 Architecture Review

**Decision ID:** `KAIOS PRODUCT SPRINT 001`  
**Sprint:** Official Website x World Viewer Integration  
**Date:** 2026-07-18  
**Status:** APPROVED_FOR_CURSOR_IMPLEMENTATION  
**Reviewer:** Codex / `codex-gm-01`  

## Codex Boundary

Codex is Chief Architect, Mainline Controller, Reviewer, Merger, and Releaser for this sprint.

Codex must not directly implement:

- product UI
- frontend application code
- runtime logic
- official website product screens

All product construction is assigned to Cursor through formal WorkOrders.

## Product Goal

Integrate the current KAIOS World Viewer demo, Web App, and Official Website into one coherent product entry.

## Sprint Scope

Cursor implementation must address:

- professional landing page refresh
- brand consistency across KGEN and KAIOS
- direct connection to KAIOS World Viewer, demo, and web app
- safe-area aware mobile UX
- fixed navigation that does not drift or cover content
- human-friendly navigation: Home, World, Life, Market, Temple, Company, Settings, Back, Previous, Next
- full-page expansion for primary features
- desktop, tablet, and phone consistency
- performance and accessibility evidence

## WorkOrder Split

| WorkOrder ID | Status | Purpose |
|---|---|---|
| `KAIOS-PRODUCT-SPRINT-001A` | OPEN_ASSIGNED | Official Website shell refresh, World Viewer entry integration, navigation, safe-area layout, responsive QA |
| `KAIOS-PRODUCT-SPRINT-001B` | DRAFT | Deeper World Viewer/Web App page expansion and feature routing after 001A review |
| `KAIOS-PRODUCT-SPRINT-001C` | DRAFT | Performance, accessibility, visual regression and release hardening after 001A/001B |

## Acceptance Gates For 001A

- Official website has a polished product entry.
- World Viewer / Web App / Demo are directly reachable.
- Navigation remains fixed and does not obscure content.
- Mobile safe areas are respected.
- Primary sections can expand to full page and return.
- Desktop, tablet, and phone layouts are checked.
- No Universe Law, Genesis, PrimeForge, Token, Runtime CURRENT, Universe Map CURRENT, or protected path changes.
- Cursor produces PR/handoff evidence and stops for Codex review.

## Review Result

PASS. `KAIOS-PRODUCT-SPRINT-001A` is authorized for Cursor implementation. Codex must review the Cursor handoff before merge/release.

