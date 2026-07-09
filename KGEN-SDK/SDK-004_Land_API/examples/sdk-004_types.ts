// SDK-004 KGEN Land API
// TypeScript interface draft for documentation and future SDK alignment.

export interface LandRuntimeState {
  documentId: string;
  version: string;
  canonRefs: string[];
  landId: string;
  origin: string;
  state: string;
  building: Record<string, unknown>;
  transferModes: string[];
}
