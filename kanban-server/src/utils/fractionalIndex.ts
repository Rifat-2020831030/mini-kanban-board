import { Decimal } from '@prisma/client';

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
    // Target position is AFTER all items (moving to END)
    return after.plus(1);
  }
  
  if (after === null && before !== null) {
    // Target position is BEFORE all items (moving to START)
    return before.dividedBy(2);
  }
  
  // Target position is BETWEEN 'after' and 'before'
  return before!.plus(after!).dividedBy(2);
}
