// SDK-007 KGEN DNA / GA API
// TypeScript interface draft for documentation and future SDK alignment.

export interface DNAGenome {
  documentId: string;
  version: string;
  canonRefs: string[];
  genomeId: string;
  genes: Record<string, unknown>;
  fitness: number;
  generation: number;
}
