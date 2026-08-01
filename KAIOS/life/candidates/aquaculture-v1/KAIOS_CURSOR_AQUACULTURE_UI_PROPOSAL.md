# Cursor Aquaculture UI Proposal

Status: `CURSOR_RESEARCH_CANDIDATE_ONLY`

Mode: `SIMULATION_ONLY`

Food safety: `NO_REAL_FOOD_SAFETY_CERTIFICATION`

## Information Architecture

Use one work-focused Runtime screen with tabs for Land, Construction, Water, Populations, Feed, Oxygen, Health Risk, Harvest, Cold Chain, Orders, Inventory, Ledger, and Timeline. Keep the active blocker and next causal requirement visible near the controls.

## Controls

Commands should be disabled when prerequisites fail and expose the exact reason. Start, pause, resume, advance, reset, export, and import remain separate. Scenario controls should identify drought, flood, power outage, low oxygen, demand loss, and restoration as simulations.

## Responsive Behavior

On narrow screens, use a single-column inspector, horizontal tab scroller, stable control dimensions, and readable ledger rows. On wider screens, use a map or pond state area beside the inspector and timeline. No card should contain another decorative card.

## Accessibility

Use semantic headings, visible focus, live regions for state and error messages, labelled icon controls, keyboard navigation, reduced motion, and text labels in addition to color. Provide loading, empty, partial-data, error, and retry states.

## Boundary Banner

Display `SIMULATION ONLY`, `NO REAL KGEN`, `NO REAL WALLET`, `NO REAL FOOD-SAFETY CERTIFICATION`, and `NO PRODUCTION AUTHORITY` without implying a real aquaculture operation.
