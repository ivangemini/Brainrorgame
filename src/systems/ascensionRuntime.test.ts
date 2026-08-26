import { beforeEach, describe, expect, it } from 'vitest';
import { createDefaultAscensionProgress } from './ascension';
import {
  getCurrentAscensionProgress,
  resetCurrentAscensionProgress,
  syncCurrentAscensionProgress
} from './ascensionRuntime';

describe('Ascension runtime bridge', () => {
  beforeEach(() => resetCurrentAscensionProgress());

  it('starts empty and returns defensive copies', () => {
    const first = getCurrentAscensionProgress();
    expect(first).toEqual(createDefaultAscensionProgress());
    const mutable = first.purchasedNodes as string[];
    mutable.push('merge-seed-cache');
    expect(getCurrentAscensionProgress().purchasedNodes).toEqual([]);
  });

  it('preserves synchronized progress without sharing node arrays', () => {
    const source = {
      chaosStars: 2,
      lifetimeChaosStars: 3,
      ascensions: 1,
      highestResetChapter: 26,
      purchasedNodes: ['merge-seed-cache'] as const,
      lastAscendedAt: 1234
    };
    syncCurrentAscensionProgress(source);
    expect(getCurrentAscensionProgress()).toEqual(source);
  });
});
