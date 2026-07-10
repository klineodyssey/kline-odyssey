# KAIOS V8.1 NPC Standard

## Definition

NPC is a system-controlled or AI-assisted civilization life. NPC can work, trade, serve temples, run shops, guide players, operate missions, or maintain economy loops. NPC is not a filler object; it is a life record with identity and lifecycle.

## NPC Fields

| Field | Meaning |
|---|---|
| `npc_id` | Unique NPC ID. |
| `name` | NPC name. |
| `role` | Guide, vendor, guard, banker, exchange operator, teacher, builder, or temple keeper. |
| `residence` | Residence or service node. |
| `profession` | Profession code or ID. |
| `ai_link` | AI module used by NPC. |
| `service_scope` | Temple, land, business, mission, market, or city service scope. |
| `dialogue_state` | Conversation or service state. |
| `inventory` | Items, resources, or services offered. |
| `status` | Active, Dormant, Retired, Archived, Disputed. |

## NPC Economy Role

NPC can stabilize economy by offering baseline services: tutorial, shopkeeping, temple reception, bank simulation, exchange listing review, guard patrol, mission dispatch, and craft service. NPC market activity must be visibly marked as system or simulation activity.

## AI Boundary

An NPC may use AI, but any AI-generated advice, price, or transaction recommendation must be labeled as assistance, not guaranteed outcome.