# 界曜 11520 Interview Retest V2 — WORK IN PROGRESS

- Candidate: 界曜
- Name status: SELF_CHOSEN_PENDING_REGISTRATION
- Employment: INTERVIEW_CANDIDATE / NOT_FORMALLY_HIRED
- Base main at V2 start: `25d5f3936f7e58eaadfdb6cd25d06ddb70030e8d`
- Safety: no merge, deploy, Mainnet transaction, payment, token transfer, treasury, governance or automatic signing.

## Implemented in this branch

- Canonical XYZ runtime: Z+ north, X+ east, Y 0..40.
- North-up minimap/world-map conversions without canvas or pointer-event mirroring.
- Left XZ joystick center: single tap + 1s idle Y+, double tap + 1s idle Y-, movement/tap stops motion.
- 390px mobile joystick/action-button bounding-box clearance enforcement.
- Fixed clickable Y/C/Lots top icons.
- Canonical Universe Elevator `k=floor(log10(abs(x)))`; negative floors Bn, nonnegative shown as explicit k=n.
- Object-info-before-navigation: name/type/LIFE_ID/XYZ/function/interaction then optional navigation.
- Waypoint-first navigation; no click-to-teleport.
- Procedural 3D Market Life bodies; primitive is explicit FALLBACK only.
- Original KAIOS capture state machine preserving SAME_LIFE_ID through capture/release.
- 11520 main page split into maintainable HTML shell + runtime modules.

## Still not asserted as complete

- Digital Ant producer -> 11520 end-to-end live link remains NOT_VERIFIED until exact-head producer/receiver evidence proves it.
- Employment PASS is not self-declared; exact-head CI and GM review are required.
