// SDK-010 KGEN Cursor / Codex Agent API
// TypeScript interface draft for documentation and future SDK alignment.

export interface AgentWorkOrder {
  documentId: string;
  version: string;
  canonRefs: string[];
  orderId: string;
  owner: string;
  checks: string[];
  outputReport: string;
}
