# AI WorkOrder Generator

**Document ID:** KAIOS-V9.0-AI-WORKORDER-GENERATOR  
**Status:** Draft for Review / Prototype

## 1. Purpose

The AI WorkOrder Generator converts a reviewed AI decision into one or more Draft WorkOrders. AI cannot mark drafts as OPEN. Only Codex may approve a draft into OPEN state.

## 2. Required Fields

Every Draft WorkOrder must include:

- `Task ID`
- `Decision ID`
- `Reason`
- `Priority`
- `Risk Level`
- `Dependencies`
- `Input State`
- `Expected Output`
- `Acceptance Criteria`
- `Protected Paths`
- `Owner Suggestion`
- `Reviewer`
- `Branch Pattern`
- `Report Path`
- `Human Review Required`
- `Codex Review Required`
- `Status: DRAFT`

## 3. Draft Rule

AI must not convert `DRAFT` to `OPEN`. Codex reviews draft quality, dependency conflict, duplicate task risk and protected path safety.

## 4. Risk Rule

R0 and R1 drafts can be low-friction review. R2 drafts require Codex Review. R3 drafts require Codex and Human Review. R4 drafts must be `BLOCKED`.
