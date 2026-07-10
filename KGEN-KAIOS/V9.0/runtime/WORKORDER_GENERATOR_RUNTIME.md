# WorkOrder Generator Runtime

Generates Draft WorkOrders from reviewed AI decisions. It must keep status as `DRAFT`. Only Codex can approve a draft into OPEN state.

Every draft must include Decision ID, reason, risk level, dependencies, input state, acceptance criteria, protected paths, owner suggestion, reviewer, branch pattern and report path.
