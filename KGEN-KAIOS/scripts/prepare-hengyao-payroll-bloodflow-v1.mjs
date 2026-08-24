import { assertHengyaoPayrollPlan, buildHengyaoPayrollPlan, jsonSafe } from "./hengyao-payroll-bloodflow-v1-plan.mjs";

const plan = buildHengyaoPayrollPlan();
assertHengyaoPayrollPlan(plan);
process.stdout.write(`${JSON.stringify(jsonSafe(plan), null, 2)}\n`);
