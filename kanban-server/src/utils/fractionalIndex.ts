import { Decimal } from '@prisma/client/runtime/library';

/**
 * Computes the fractional position between two elements.
 * Fractional indexing prevents cascading updates when moving an item.
 * 
 * - If before is null, we are moving to the start (return after / 2)
 * - If after is null, we are moving to the end (return before + 1)
 * - If both are null, this is the first item (return 1)
 * - Otherwise, return (before + after) / 2
 */
export function computePosition(before: Decimal | null, after: Decimal | null): Decimal {
  if (before === null && after === null) {
    return new Decimal(1);
  }
  
  if (before === null && after !== null) {
    return after.dividedBy(2);
  }
  
  if (after === null && before !== null) {
    return before.plus(1);
  }
  
  // Both are not null
  return before!.plus(after!).dividedBy(2);
}
