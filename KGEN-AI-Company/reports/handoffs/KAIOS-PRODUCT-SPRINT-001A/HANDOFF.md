# Handoff: KAIOS-PRODUCT-SPRINT-001A

**Task ID:** KAIOS-PRODUCT-SPRINT-001A  
**Worker:** cursor-01  
**Claim ID:** CLAIM-KAIOS-PRODUCT-SPRINT-001A-20260717T1721-cursor-01  
**Branch:** cursor-handoff/KAIOS-PRODUCT-SPRINT-001A  
**Base SHA:** 97165d9520f0608e04567c20dade5cdb647fd9eb  
**Reviewer:** codex-gm-01  

## Summary

Product Sprint 001A integrates the official homepage with KAIOS World Viewer and Web App entry points, adds safe-area-aware fixed product navigation (Home / World / Life / Market / Temple / Company / Settings + Back / Prev / Next), and supports full-page feature expansion with return navigation.

## Deliverables

- Report: `KGEN-AI-Company/reports/KAIOS_PRODUCT_SPRINT_001A_REPORT.md`
- Homepage + assets: `index.html`, `assets/product-shell.css`, `assets/product-shell.js`
- Viewer return link: `KGEN-KAIOS/world-viewer/index.html`, `KGEN-KAIOS/world-viewer/ui/styles.css`

## Review Checklist

- [ ] World Viewer reachable from hero and `#kaios-world`
- [ ] Product dock visible on phone and desktop without covering system status areas
- [ ] Full-page demo opens and closes via Back / Escape
- [ ] No protected path or governance file edits in diff
- [ ] Static Pages compatibility preserved

## Stop Condition

Worker stops after push; Codex owns merge, WorkQueue transition, and 001B activation.
