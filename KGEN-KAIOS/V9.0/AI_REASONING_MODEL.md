# AI Reasoning Model

**Document ID:** KAIOS-V9.0-AI-REASONING-MODEL  
**Status:** Draft for Review / Prototype

## 1. Purpose

The AI Reasoning Model defines how V9.0 converts observations into explainable recommendations.

## 2. Reasoning Steps

```text
Collect Observations
  -> Normalize State
    -> Identify Tension
      -> Generate Alternatives
        -> Score Risk
          -> Compare Impact
            -> Recommend
              -> Mark Review Requirements
```

## 3. Assumptions

Every decision must list assumptions. Assumptions cannot be hidden. If an assumption controls the recommendation, the decision must lower confidence and request review.

## 4. Alternatives

AI must propose alternatives before recommending one action. A proper decision includes at least one rejected alternative and a reason why it was rejected.

## 5. Confidence

Confidence is a numeric value from 0 to 1. Confidence must consider:

- Source quality.
- Data freshness.
- Canon alignment.
- Risk level.
- Dependency completeness.
- Review history.

## 6. Explainability

The recommendation must be understandable without reading hidden chain-of-thought. It must expose evidence, assumptions, risks, alternatives and review gates.
