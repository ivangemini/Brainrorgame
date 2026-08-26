import { afterEach, describe, expect, it } from 'vitest';
import { createDefaultAscensionProgress } from './ascension';
import { resetCurrentAscensionProgress, syncCurrentAscensionProgress } from './ascensionRuntime';
import {
  addChaosPerk,
  chaosDraftCheckpointForStep,
  getChaosPerkOffers,
  getCurrentChaosPerkMultipliers,
  needsChaosDraft,
  resetCurrentChaosPerks,
  syncCurrentChaosPerks
} from './chaosDraft';

afterEach(() => {
  resetCurrentChaosPerks();
  resetCurrentAscensionProgress();
});

describe('chaos draft', () => {
  it('offers drafts only before waves 3 and 5', () => {
    expect(chaosDraftCheckpointForStep(0)).toBeNull();
    expect(chaosDraftCheckpointForStep(2)).toBe(1);
    expect(chaosDraftCheckpointForStep(4)).toBe(2);
    expect(needsChaosDraft(2, 0)).toBe(true);
    expect(needsChaosDraft(2, 1)).toBe(false);
    expect(needsChaosDraft(4, 1)).toBe(true);
    expect(needsChaosDraft(4, 2)).toBe(false);
  });

  it('generates deterministic three-card offers and excludes owned perks', () => {
    const first = getChaosPerkOffers(7, 1, []);
    const repeated = getChaosPerkOffers(7, 1, []);
    expect(first).toEqual(repeated);
    expect(new Set(first).size).toBe(3);

    const second = getChaosPerkOffers(7, 2, [first[0]]);
    expect(second).not.toContain(first[0]);
    expect(new Set(second).size).toBe(3);
  });

  it('changes deterministic offers when Chaos Reroute uses its alternate seed', () => {
    const first = getChaosPerkOffers(8, 1, [], 0);
    const rerolled = getChaosPerkOffers(8, 1, [], 1);
    expect(rerolled).not.toEqual(first);
    expect(new Set(rerolled).size).toBe(3);
  });

  it('opens a Fourth Door every fifth chapter when the full Chaos branch is owned', () => {
    syncCurrentAscensionProgress({
      ...createDefaultAscensionProgress(),
      purchasedNodes: ['chaos-reroute', 'chaos-bank', 'chaos-fourth-door']
    });
    expect(getChaosPerkOffers(9, 1, [])).toHaveLength(3);
    const chapterTen = getChaosPerkOffers(10, 1, []);
    expect(chapterTen).toHaveLength(4);
    expect(new Set(chapterTen).size).toBe(4);
  });

  it('caps a chapter build at two unique perks', () => {
    let selected = addChaosPerk([], 'impact-jelly');
    selected = addChaosPerk(selected, 'impact-jelly');
    expect(selected).toEqual(['impact-jelly']);
    selected = addChaosPerk(selected, 'repair-moss');
    selected = addChaosPerk(selected, 'tempo-worm');
    expect(selected).toEqual(['impact-jelly', 'repair-moss']);
  });

  it('derives bounded combat and economy multipliers from the selected build', () => {
    syncCurrentChaosPerks(['impact-jelly', 'chaos-capacitor']);
    const multipliers = getCurrentChaosPerkMultipliers();
    expect(multipliers.squadDamageMultiplier).toBeCloseTo(1.09);
    expect(multipliers.energyGainMultiplier).toBeCloseTo(1.25);
    expect(multipliers.attackIntervalMultiplier).toBe(1);
    expect(multipliers.waveHealBonus).toBe(0);
  });
});
