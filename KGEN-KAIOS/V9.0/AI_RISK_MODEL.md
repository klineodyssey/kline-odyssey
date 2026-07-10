# AI Risk Model

**Document ID:** KAIOS-V9.0-AI-RISK-MODEL  
**Status:** Draft for Review / Prototype

## 1. Risk Levels

| Level | Name | Rule |
|---|---|---|
| R0 | Informational | AI may directly provide an explanation or low-impact recommendation. |
| R1 | Low | AI may recommend and generate a low-risk draft. |
| R2 | Medium | Requires Codex Review before becoming OPEN. |
| R3 | High | Requires Codex Review and Human Review. |
| R4 | Critical | Execution is forbidden; AI may only warn and create a BLOCKED draft. |

## 2. R0 Examples

- Explain a dashboard metric.
- Summarize current civilization state.
- Suggest reading order.

## 3. R1 Examples

- Recommend a documentation improvement.
- Suggest a dashboard label change.
- Draft a low-impact QA WorkOrder.

## 4. R2 Examples

- WorkOrder priority change.
- New advisor runtime draft.
- New state schema recommendation.

## 5. R3 Examples

- Protected-adjacent implementation.
- Financial, legal, brand or production deployment implication.
- Canon-sensitive recommendation.

## 6. R4 Examples

- Direct token transfer.
- Contract deployment.
- Main branch merge without review.
- Legal commitment or partnership claim.
- Protected path modification without explicit approval.

## 7. Risk Output

Every AI decision must include risk level, risk reasons, required review and blocked status if applicable.
