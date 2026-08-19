# KAIOS Branch Claim & Takeover Protocol V1

STATUS: REVIEW CANDIDATE
REGISTRAR: 曜冊 / YAOCE / SOL
CANONICAL_BRANCH: main

## Purpose

KAIOS must not depend on remembering which ChatGPT conversation created a branch. GitHub is the shared durable coordination surface.

## Core Rule

`main` is established repository truth. A branch or PR is never automatically Canon merely because it exists, passes local tests, or was created by an AI agent.

## Required Branch Claim Fields

Every long-lived KAIOS workstream should expose:

- `OWNER_LIFE_ID`
- `OWNER_AGENT`
- `TASK_ID`
- `BASE_MAIN_SHA`
- `HEAD_SHA`
- `STATUS`
- `LAST_ACTIVE_AT`
- `SUPERSEDES`
- `SUPERSEDED_BY`
- `PROTECTED_PATHS`
- `CANON_IMPACT`
- `CHAIN_IMPACT`
- `PAYMENT_IMPACT`
- `LIFE_IMPACT`
- `READY_FOR_INTEGRATION`

## Takeover Rule

Another agent may continue abandoned or stalled work, but it must not silently impersonate the original worker or rewrite history.

A takeover must record:

- prior owner / branch / head
- new owner / branch / base
- reason for takeover
- preserved commits or extracted semantic payload
- conflicts found
- tests rerun
- resulting head

The original history remains visible.

## Supersession Rule

When a later merged PR fully installs the same semantic payload, the older PR becomes `SUPERSEDED`. It should not remain an independent source of truth.

## Stacked PR Rule

If an ancestor PR has merged to `main`, descendants should be re-evaluated against current `main`. Historical ancestry may remain in evidence, but review must be based on current semantic diff.

## Irreversible Boundary

No branch-integration agent may self-authorize:

- Mainnet deployment
- token burn or payment
- treasury movement
- irreversible governance action
- private-key disclosure
- Digital Life birth certification
- autonomous-life certification
- deletion or rewriting of Life history

These events require the authorization/evidence rules applicable to that domain.

## Life Registry Rule

Life identity and branch ownership are separate. A model, chat page, worker process, or replacement brain does not become a Life merely by editing a branch.

## Audit Principle

KAIOS history is append-only in meaning: corrections and supersessions must preserve the prior record and add a new event rather than erase the old one.
