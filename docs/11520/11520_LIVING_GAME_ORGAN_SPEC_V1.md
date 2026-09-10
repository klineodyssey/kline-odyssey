# 11520 Living Game Organ Spec V1

Status: ACTIVE
Scope: `K線西遊記/temples/11520/game-5d.html`

## Principle
11520 is treated as a living game product. Every visible organ must have a stable identity, purpose, input, output, health state, failure mode and mobile test. A visible control that produces no state change is a QA failure.

## Core body map

| Organ | UI / Runtime identity | Purpose | Required response |
|---|---|---|---|
| 3D World | `#three` | Living World renderer | tap, movement, life/object rendering |
| XZ locomotion | `#joy`, `#knob` | move + turn | right = X+, left = X-, up = Z+, down = Z- |
| Y locomotion | `#yJoyV250` -> `#yControl` | altitude | up = Y+, down = Y-, release = stop |
| Camera | camera runtime | player/world view | follows player without changing canonical XYZ meaning |
| KX/KY/KZ market axes | `#axes` | market selection and quotes | quote/state visible and selectable |
| C warp scale | `#cControl` | warp multiplier | selectable and reflected in readout |
| Lots | `#lotsControl` | position size | selectable and reflected in readout |
| Trade sword | `#tradeSword` | arm/disarm trading | visible armed state feedback |
| Order / Fire | `#orderFire` | local simulated order flow | opens confirmation or explicit blocker message |
| Flat | `#flat` | close local position | state change or explicit empty-position message |
| Attack | `#attack` | attack nearby life | hit/miss/settlement feedback |
| Skill | `#skill` | stronger attack skill | hit/miss/settlement feedback |
| Dodge | `#dodge` | movement skill | world movement or collision feedback |
| Minimap | `#minimap` | north-up local map | inspect entity or set waypoint |
| World map | `data-organ="worldmap"` | large navigation map | inspect entity or set waypoint |
| Life HUD | `.monsterHud` | player/life health | live HP and life list |
| 12345/BSC wallet | `#walletPanel`, `#walletToggle` | read-only wallet bridge/status | toggle must expand/collapse; no signing by default |
| Backpack | real backpack button / backpack runtime | inventory and captured life | one visible functional entry only |
| Character | `data-organ="character"` | player body/status | coordinates and body state |
| ATM / Digital Ant | `data-organ="atm"` | logistics simulation | mission creation/status |
| Right dock | `#dock`, `#dockToggle`, `#rail` | organ launcher | toggle remains in place; rail opens above HUD |
| AI / Help | help organ + AI UI | assistance and organ manual | contextual response; organ map available |

## Organ health contract
Each organ must expose or permit verification of:

1. `ORGAN_ID`
2. `NAME`
3. `PURPOSE`
4. `INPUT`
5. `OUTPUT`
6. `STATE`
7. `FAILURE_FALLBACK`
8. `MOBILE_CLICK_TEST`
9. `DEPENDENCIES`
10. `SAFETY_BOUNDARY`

## Product safety boundary
Trading, wallet, ATM and logistics features remain simulation/read-only/local-ledger unless separately authorized. No private-key disclosure, automatic signing, token transfer, treasury action or Mainnet deployment is implied by this organ map.

## Reconstruction rule
A release is reconstructable only when the organ map, runtime files, assets, version label and QA evidence together describe the complete visible body. Missing visible organs or visible dead controls are release defects, not optional polish.
