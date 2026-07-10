# KAIOS V8.1 Player Standard

## Definition

Player is the human-facing or account-facing controller in KGEN. A Player may control lands, residences, citizens, temples, Apps, wallets, missions, and businesses. Player is not the same as Citizen.

## Required Fields

| Field | Meaning |
|---|---|
| `player_id` | Unique Player ID. |
| `display_name` | Public display name. |
| `wallets` | Wallet references and chain scope. |
| `owned_entities` | Entity IDs controlled by the player. |
| `active_citizens` | Citizen IDs currently controlled or represented. |
| `permissions` | Build, trade, rent, govern, claim, view. |
| `reputation` | Trust and social score. |
| `missions` | Active mission IDs. |
| `status` | Active, Dormant, Locked, Archived, Disputed. |

## Player to Citizen Rule

A Player can operate multiple Citizens, but a Citizen remains a Universe life record with residence, profession, reputation, DNA, and lifecycle. This allows roleplay, simulation, NPC transition, and AI-assisted civilization without merging human account identity into world population data.

## Security Boundary

Wallet references must not expose private keys. V8.1 demo and examples may include public address-like sample values only. Real wallet operations remain outside V8.1.