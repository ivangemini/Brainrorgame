import { describe, expect, it } from 'vitest';
import { canMerge, mergedLevel } from './merge';

describe('merge rules', () => {
  it('merges identical family and level', () => {
    expect(canMerge({ family: 'gator', level: 1 }, { family: 'gator', level: 1 })).toBe(true);
    expect(mergedLevel({ family: 'gator', level: 1 }, { family: 'gator', level: 1 })).toBe(2);
  });

  it('rejects different levels', () => {
    expect(canMerge({ family: 'gator', level: 1 }, { family: 'gator', level: 2 })).toBe(false);
  });
});
