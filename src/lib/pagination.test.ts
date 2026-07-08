import { describe, it, expect } from 'vitest';
import { clampPage, paginate } from './pagination';

describe('clampPage', () => {
  it('defaults to 1 for undefined, NaN, zero, or negative input', () => {
    expect(clampPage(undefined, 5)).toBe(1);
    expect(clampPage(Number.NaN, 5)).toBe(1);
    expect(clampPage(0, 5)).toBe(1);
    expect(clampPage(-3, 5)).toBe(1);
  });

  it('clamps a too-large page number down to totalPages', () => {
    expect(clampPage(999, 5)).toBe(5);
  });

  it('floors a fractional page number', () => {
    expect(clampPage(2.9, 5)).toBe(2);
  });

  it('never returns less than 1, even when totalPages is 0', () => {
    expect(clampPage(1, 0)).toBe(1);
  });
});

describe('paginate', () => {
  const items = Array.from({ length: 25 }, (_, i) => i);

  it('slices the correct page', () => {
    const page1 = paginate(items, 1, 10);
    expect(page1.items).toEqual(items.slice(0, 10));
    expect(page1.hasPrev).toBe(false);
    expect(page1.hasNext).toBe(true);

    const page3 = paginate(items, 3, 10);
    expect(page3.items).toEqual(items.slice(20, 25));
    expect(page3.hasPrev).toBe(true);
    expect(page3.hasNext).toBe(false);
  });

  it('computes totalPages correctly, including a partial last page', () => {
    expect(paginate(items, 1, 10).totalPages).toBe(3);
  });

  it('clamps an out-of-range page instead of returning an empty slice', () => {
    const result = paginate(items, 999, 10);
    expect(result.currentPage).toBe(3);
    expect(result.items.length).toBeGreaterThan(0);
  });

  it('handles an empty list without dividing by zero or crashing', () => {
    const result = paginate([], 1, 10);
    expect(result.items).toEqual([]);
    expect(result.totalPages).toBe(1);
    expect(result.hasNext).toBe(false);
  });
});
