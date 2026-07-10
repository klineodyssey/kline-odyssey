# KAIOS V8.0 Player Entry Model

**Purpose:** 定義玩家只有部分資產時，KAIOS 如何建立缺口分析與 WorkOrder Roadmap。

## 1. Picture Only

玩家只有一張圖。系統不得直接宣稱圖已成為上鏈神殿，而是建立 Temple Blueprint。

| Field | Purpose |
|---|---|
| `picture_id` | 圖像資產識別碼 |
| `image_hash` | 原圖 hash，供完整性檢查 |
| `ipfs_uri` / `arweave_uri` | 未來去中心化儲存參考欄位 |
| `visual_description` | 圖像描述與可見模組 |
| `suggested_temple_type` | 建議神殿類型 |
| `suggested_civilization_attribute` | 建議文明屬性 |
| `suggested_land_requirement` | 建議土地需求 |
| `generated_workorders` | Temple Blueprint / Land Requirement 等任務 |

### Roadmap

```text
Picture
→ Temple Blueprint
→ Land Requirement
→ Land Assignment
→ Residence
→ Store
→ Bank
→ Exchange
→ Real-World Link
→ Listing
→ Governance
→ Production Readiness
```

## 2. Land Only

玩家只有土地。系統先建立座標與分區，再補建築與神殿。

| Field | Purpose |
|---|---|
| `land_id` | 土地識別碼 |
| `owner` | 所有者或管理者 |
| `x/y/z/c/t/ct` | KGEN 宇宙與時間座標 |
| `land_type` | Wild / Claimed / Developed |
| `zoning` | 住宅、商業、神殿、工業、混合用途 |
| `build_permissions` | 可建設項目 |
| `market_value` | 遊戲內估值，不等同證券估值 |
| `rental_state` | 自用、可出租、租賃中 |
| `development_stage` | 當前生命週期階段 |

### Roadmap

```text
Land
→ Zoning
→ Residence
→ Store
→ Temple
→ App Organism
→ AI
→ DNA
→ Economy
→ Listing
```

## 3. Residence Only

玩家只有民宅。系統判斷其可演化方向：

- 一般住宅。
- 商店。
- 服飾店。
- 餐廳。
- 超商 / 便利商店型態。
- 銀行分行。
- 交易所節點。
- 倉庫。
- 工廠。
- 神殿服務站。

### Roadmap

```text
Residence
→ Business Type Decision
→ Inventory / Catalog
→ Payment Boundary
→ Marketplace
→ Temple Service Node
→ Real-World Twin
```

## 4. Temple Only

玩家只有神殿。系統補全神殿所需的經濟器官：

- 土地。
- 民宅。
- 商店。
- 銀行。
- 交易所。
- App。
- AI。
- DNA。
- Runtime。
- 治理。
- 實體商家連線。

## 5. App Only

玩家只有 App。系統必須建立 App 生命鏈：

```text
App
→ App DNA
→ Runtime Organ
→ Owner / License
→ Marketplace Listing
→ Temple / Store Binding
→ AI Capability
→ Upgrade / Fusion / Rental / Trade
```

## 6. Real Business Only

玩家只有實體商家，例如服飾店、餐廳、便利商店型態、商場、百貨、銀行或服務據點。系統建立 Virtual Twin，但不得宣稱已與任何真實品牌合作。

| Field | Purpose |
|---|---|
| `real_business_id` | 實體商家識別碼 |
| `legal_entity` | 法人或自然人主體 |
| `brand` | 品牌名稱，需授權後才可正式使用 |
| `store_location` | 門市或服務據點地址 |
| `product_catalog` | 商品/服務目錄 |
| `inventory_adapter` | 庫存接入 |
| `payment_adapter` | 付款接入，需金流合規 |
| `loyalty_adapter` | 會員與點數接入 |
| `kgen_virtual_twin` | KGEN 虛擬分身 |
| `listing_conditions` | 上市條件 |
| `trading_conditions` | 交易條件 |

### Compliance Note

7-ELEVEN 只能作為便利商店型態範例。任何品牌名稱、商標、加盟、金流、證券或實體交易都需要 Legal Review / Trademark Authorization / Business Agreement / Regulatory Compliance。