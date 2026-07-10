# Business Behavior

**Document ID:** KAIOS-V8.3-BUSINESS-BEHAVIOR  
**Status:** Draft for Review / Prototype

## 1. Purpose

Business Behavior defines how a business changes every Tick. It turns V8.2 business records into time-aware economy nodes.

## 2. Actions Per Tick

Each Business may perform:

- Produce.
- Restock.
- Receive income signal.
- Pay expense signal.
- Change employee need.
- Update inventory.
- Update customer demand.
- Request governance review if risk rises.

## 3. Required Inputs

- Business type.
- Required profession.
- Employees.
- Required building.
- Production model.
- Consumption model.
- Inventory.
- Revenue.
- Expense.
- Growth.
- Day/night phase.
- Season.
- Market activity.

## 4. Output Signals

- Production output.
- Inventory delta.
- Revenue delta.
- Expense delta.
- Employment delta.
- Growth delta.
- Upgrade readiness.
- Risk warning.

## 5. Business Failure

A business may enter `Dormant`, `Distressed`, `Recovery` or `Archived` state if inventory, employee capacity, demand or governance health falls below thresholds. This is a simulation state and must not delete source records.
