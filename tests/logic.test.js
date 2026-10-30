import { describe, it, expect } from 'vitest';
import { matches, normalize } from '../src/match.js';
import { dayKey, addDays, daysBetween } from '../src/day.js';

describe('fuzzy answer matching', () => {
  it('treats Xa, FXa, factor 10a, factor Xa as the same', () => {
    for (const a of ['Xa', 'FXa', 'factor 10a', 'factor Xa', 'f xa']) expect([a, matches(a, ['factor Xa'])]).toEqual([a, true]);
  });
  it('ignores case, spaces, hyphens and slashes in receptor names', () => {
    for (const a of ['gp2b3a', 'GP IIb/IIIa', 'gpIIbIIIa', 'glycoprotein IIb/IIIa']) expect([a, matches(a, ['GPIIb/IIIa', 'GP2b3a'])]).toEqual([a, true]);
  });
  it('allows one typo on longer answers but not short ones', () => {
    expect(matches('fibrinogin', ['fibrinogen'])).toBe(true);
    expect(matches('COX-2', ['COX-1'])).toBe(false);
    expect(matches('P2Y1', ['P2Y12'])).toBe(false);
  });
  it('does not turn ordinary words into factor numbers', () => {
    expect(normalize('fibrin')).toBe('fibrin');
  });
});

describe('study days', () => {
  it('rolls over at 04:00, so 03:00 still counts as the previous day', () => {
    expect(dayKey(new Date(2026, 9, 31, 3, 0))).toBe('2026-10-30');
    expect(dayKey(new Date(2026, 9, 31, 5, 0))).toBe('2026-10-31');
  });
  it('adds and diffs days', () => {
    expect(addDays('2026-10-30', 2)).toBe('2026-11-01');
    expect(daysBetween('2026-10-30', '2026-11-29')).toBe(30);
  });
});
