// SDK-006 KGEN AI Runtime API
// TypeScript interface draft for documentation and future SDK alignment.

export interface AIRuntimePolicy {
  documentId: string;
  version: string;
  canonRefs: string[];
  agentId: string;
  readOrder: string[];
  forbiddenPaths: string[];
  reportPath: string;
}
