// SDK-002 KGEN Universe Map API
// TypeScript interface draft for documentation and future SDK alignment.

export interface UniverseMapPoint {
  documentId: string;
  version: string;
  canonRefs: string[];
  pointId: string;
  coord: number;
  distanceKm: number;
  runtimeMapping: Record<string, unknown>;
}
