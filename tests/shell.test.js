import { describe, it, expect } from 'vitest';
import { STORES } from '../src/db.js';

// Placeholder until content tests land in step 5.
describe('shell', () => {
  it('declares the progress stores', () => {
    expect(STORES).toContain('settings');
    expect(STORES).toContain('defineList');
  });
});
