# Duplicate Detection Runtime

**Runtime ID:** KAIOS-V9.1-RUNTIME-DUPLICATE-DETECTION  
**Status:** Prototype  
**Mode:** Read-only analysis.

The Duplicate Detection Runtime compares a DRAFT against active and reviewed WorkOrders.

## Signals

- Same target.
- Same output path.
- Same protected path.
- Same decision source.
- Same asset.
- Same unresolved dependency.
- Same branch pattern.

## Result

The result is `UNIQUE`, `DUPLICATE` or `MERGE_CANDIDATE`.
