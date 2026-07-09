// SDK-009 KGEN Game Loop API
// TypeScript interface draft for documentation and future SDK alignment.

export interface GameLoopStep {
  documentId: string;
  version: string;
  canonRefs: string[];
  stepId: string;
  name: string;
  next: string;
  runtimeRef: string;
}
