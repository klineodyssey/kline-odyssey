// SDK-005 KGEN App Organism API
// TypeScript interface draft for documentation and future SDK alignment.

export interface AppOrganism {
  documentId: string;
  version: string;
  canonRefs: string[];
  appId: string;
  dna: Record<string, unknown>;
  level: number;
  lifeActions: string[];
}
