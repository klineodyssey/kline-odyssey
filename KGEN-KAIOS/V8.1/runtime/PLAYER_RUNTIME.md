# KAIOS V8.1 Player Runtime

## Definition

Player Runtime maps a human-facing player or operator account to Universe Graph entities. It controls permissions, ownership references, mission participation, and wallet references without merging Player into Citizen.

## Inputs

- Player entity record
- wallet references
- owned entity IDs
- active citizen IDs
- mission IDs
- permission set

## Outputs

- player snapshot
- ownership relationship proposal
- mission claim proposal
- governance participation record

## Security Rule

No private key, seed phrase, wallet secret, payment credential, or regulated identity credential may be stored in V8.1 examples or frontend viewer.