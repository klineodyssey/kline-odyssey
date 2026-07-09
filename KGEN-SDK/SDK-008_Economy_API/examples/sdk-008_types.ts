// SDK-008 KGEN Economy API
// TypeScript interface draft for documentation and future SDK alignment.

export interface EconomyEvent {
  documentId: string;
  version: string;
  canonRefs: string[];
  eventId: string;
  asset: string;
  amount: string;
  tokenFacts: Record<string, unknown>;
}
