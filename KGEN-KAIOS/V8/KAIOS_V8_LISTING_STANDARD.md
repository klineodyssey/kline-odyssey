# KAIOS V8.0 Listing Standard

**Status:** Prototype Standard / Regulated Boundary
**Purpose:** 定義資產上市買賣、租賃、下架與爭議規則。

## Listing Market Classes

| Class | Meaning | V8 Status |
|---|---|---|
| A. KGEN Game Market | 遊戲內資產與服務交易 | Prototype |
| B. Blockchain Asset Market | 鏈上 NFT / token / smart contract asset | Requires chain audit |
| C. Real Goods E-Commerce | 實體商品或服務電商 | Requires business, payment, tax, consumer compliance |
| D. Securities / Equity / Regulated Assets | 股權、分紅、收益權、證券型資產 | Future Regulated Module only |

## Listed Asset Types

| Asset Type | Listing Eligibility | Ownership Proof | Transfer Rules | Rental Rules | Legal Restrictions |
|---|---|---|---|---|---|
| Land | claimed or developed land | land record | marketplace transfer | land lease | cannot imply real property unless legally mapped |
| Temple | temple blueprint or active temple | temple_id and owner | transfer governance-sensitive | service lease | religious/brand/legal sensitivity |
| Building | residence/store/warehouse/factory | building_id | transfer with land dependency | building lease | zoning rules |
| Residence | linked to land | residence_id | transfer or rent | residence lease | housing law if real-world linked |
| Store | catalog and business boundary | business_id | business listing | shop lease | consumer and tax compliance |
| App | app DNA and license | app_id/license | license or ownership transfer | app rental | IP and software license |
| AI | AI organ record | ai_id | usage/license transfer | AI service lease | privacy and model rules |
| DNA | DNA metadata | dna_id | transfer or fusion | limited rental | bio metaphor only, no human genetic claim |
| Membership | membership right | membership_id | transfer if terms allow | subscription | consumer and privacy law |
| Virtual Business Twin | real-world link record | legal_entity + authorization | depends on agreement | service lease | must not trade unapproved brand rights |
| Future Equity / NFT Tokenized Rights | regulated rights | legal documents | regulated transfer only | regulated | Future Regulated Module |

## Required Listing Fields

- `listing_id`
- `asset_type`
- `asset_id`
- `seller`
- `ownership_proof`
- `metadata_uri`
- `valuation_method`
- `pricing_model`
- `disclosure`
- `risk_statement`
- `transfer_rules`
- `rental_rules`
- `delisting_rules`
- `dispute_process`
- `legal_restrictions`

## Disclosure Rule

Every listing must disclose whether it is Concept, Prototype, Production, or Regulated. Regulated assets cannot be traded in V8.0 without legal authorization and jurisdiction-specific compliance.