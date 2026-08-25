import { afterEach, describe, expect, it } from 'vitest';
import {
  addChaosPerk,
  chaosDraftCheckpointForStep,
  getChaosPerkOffers,
  getCurrentChaosPerkMultipliers,
  needsChaosDraft,
  resetCurrentChaosPerks,
  syncCurrentChaosPerks
} from './chaosDraft';

afterEach(() => resetCurrentChaosPerks());

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
