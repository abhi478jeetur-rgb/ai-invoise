import { describe, it, expect } from 'vitest';

// A simple helper function that would typically live in src/lib/utils.ts
function calculateDiscount(subtotal: number, discountValue: number, isPercentage: boolean): number {
  if (isPercentage) {
    return (subtotal * discountValue) / 100;
  }
  return discountValue;
}

describe('Invoice Calculations - Unit Tests', () => {
  it('should correctly calculate a flat discount', () => {
    const result = calculateDiscount(1000, 150, false);
    expect(result).toBe(150);
  });

  it('should correctly calculate a percentage discount', () => {
    const result = calculateDiscount(1000, 15, true);
    expect(result).toBe(150); // 15% of 1000
  });

  it('should return 0 if discount is 0', () => {
    const result = calculateDiscount(1000, 0, false);
    expect(result).toBe(0);
  });
});
