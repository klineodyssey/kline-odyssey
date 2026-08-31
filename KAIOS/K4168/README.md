# K4168 奈何橋生命循環水庫

Status: `PRODUCT_CANDIDATE / NO_REAL_TRANSFER`

K4168 is the Naihe Bridge reservoir/vault node. Its water assets are **KGEN** and **KAIOS**, tracked independently; their balances are never added together as if they were one unit.

## Product roles

- **Reservoir/Vault** — receives approved inflow from Huaguoshan or another verified public/development source.
- **孟婆 NPC** — vault keeper and matter-conversion gatekeeper.
- **Drink flow** — a Life/organ/resource node requests water; reserve, daily-flow, replay and identity gates run before an entitlement is created.
- **Matter → Dark Matter** — conversion is an entitlement until a separate verified conversion/settlement receipt exists. No receipt means no claim that dark matter was settled.

## Safety invariants

1. Only `KGEN` and `KAIOS` are water assets in V1.
2. Deposits require source, receipt ID and replay key.
3. Outflow cannot cross the configured minimum reserve.
4. Daily outflow cap is per asset.
5. Replay keys are single-use.
6. `DRINK` does not claim an on-chain payment; its state is `ENTITLEMENT_APPROVED_PENDING_SETTLEMENT_RECEIPT`.
7. Matter conversion does not mint or fabricate KGEN/KAIOS or dark matter.
8. Real Huaguoshan release requires a separately verified signer/payment rail and receipt.

## World text

> 君不見，黃河之水天上來，奔流到海不復回。

The quote is world/interface text; it does not change accounting rules.

## Local test

```bash
node KAIOS/K4168/naihe-vault.test.mjs
```

Expected output:

```text
K4168_NAIHE_VAULT_TEST=PASS
```
