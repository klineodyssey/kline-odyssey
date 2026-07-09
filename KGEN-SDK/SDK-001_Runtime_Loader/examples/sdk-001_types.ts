// SDK-001 KGEN Runtime Loader API
// TypeScript interface draft for documentation and future SDK alignment.

export interface RuntimeLoadRequest {
  documentId: string;
  version: string;
  canonRefs: string[];
  documentId: string;
  requiredOrder: string[];
  sourcePaths: string[];
  allowMutation: boolean;
}
