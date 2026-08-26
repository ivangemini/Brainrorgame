import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  beginActiveAbilityEncounter,
  getCurrentActiveAbilityRuntime,
  recordFortressHitEnergy,
  resetActiveAbilityRuntime
} from './activeAbilities';
import { createDefaultAscensionProgress } from './ascension';
import {
  beginAscensionRunRuntime,
  canUseAscensionDraftReroll,
  claimAscensionAlbumCache,
  consumeAscensionDraftReroll,
  consumeAscensionLastStand,
  getAscensionLastStandCharges,
  getAscensionRecruitCredits,
  getCurrentAscensionProgress,
  recordAscensionMerge,
  resetCurrentAscensionProgress,
  syncAscensionRuntimeChapter,
  syncCurrentAscensionProgress
} from './ascensionRuntime';

beforeEach(() => {
  resetActiveAbilityRuntime();
  resetCurrentAscensionProgress();
});
afterEach(() => {
  resetActiveAbilityRuntime();
  resetCurrentAscensionProgress();
});

function own(nodes: Parameters<typeof syncCurrentAscensionProgress>[0]['purchasedNodes']): void {
  syncCurrentAscensionProgress({ ...createDefaultAscensionProgress(), purchasedNodes: nodes });
  beginAscensionRunRuntime();
}

describe('Ascension runtime bridge', () => {
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

  it('initializes Seed Cache and Last Stand charges for a new run', () => {
    own(['merge-seed-cache', 'combat-last-stand']);
    expect(getAscensionRecruitCredits()).toBe(2);
    expect(getAscensionLastStandCharges()).toBe(1);
    expect(consumeAscensionLastStand()).toBe(true);
    expect(consumeAscensionLastStand()).toBe(false);
  });

  it('grants one Merge Echo Recruit credit every eighth merge', () => {
    own(['merge-seed-cache', 'merge-echo']);
    for (let index = 0; index < 7; index += 1) {
      expect(recordAscensionMerge(2, 'none').recruitCreditsEarned).toBe(0);
    }
    expect(recordAscensionMerge(2, 'none').recruitCreditsEarned).toBe(1);
    expect(getAscensionRecruitCredits()).toBe(3);
  });

  it('applies Mutation Catalyst once per chapter and never exceeds Crowned', () => {
    own(['merge-seed-cache', 'merge-echo', 'merge-catalyst']);
    syncAscensionRuntimeChapter(7);
    expect(recordAscensionMerge(3, 'none')).toMatchObject({ mutation: 'charged', catalystApplied: true });
    expect(recordAscensionMerge(3, 'charged')).toMatchObject({ mutation: 'charged', catalystApplied: false });
    syncAscensionRuntimeChapter(8);
    expect(recordAscensionMerge(3, 'prismatic')).toMatchObject({ mutation: 'crowned', catalystApplied: true });
  });

  it('banks 25% Chaos Energy only across chapter transitions', () => {
    own(['chaos-reroute', 'chaos-bank']);
    beginActiveAbilityEncounter('chapter:4:boss');
    for (let index = 0; index < 20; index += 1) recordFortressHitEnergy();
    expect(getCurrentActiveAbilityRuntime().energy).toBe(80);
    beginActiveAbilityEncounter('chapter:5:wave:1');
    expect(getCurrentActiveAbilityRuntime().energy).toBe(20);
    beginActiveAbilityEncounter('chapter:5:wave:2');
    expect(getCurrentActiveAbilityRuntime().energy).toBe(0);
  });

  it('allows exactly one Chaos Reroute per chapter', () => {
    own(['chaos-reroute']);
    syncAscensionRuntimeChapter(9);
    expect(canUseAscensionDraftReroll()).toBe(true);
    expect(consumeAscensionDraftReroll()).toBe(true);
    expect(canUseAscensionDraftReroll()).toBe(false);
    syncAscensionRuntimeChapter(10);
    expect(canUseAscensionDraftReroll()).toBe(true);
  });

  it('pays Album Cache only once per Ascension run', () => {
    own(['collection-pity-memory', 'collection-album-cache']);
    expect(claimAscensionAlbumCache()).toBe(1);
    expect(claimAscensionAlbumCache()).toBe(0);
  });
});
