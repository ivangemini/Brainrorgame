import { describe, expect, it } from 'vitest';
import { getCreature } from '../content/creatures';
import {
  MAX_MERGE_TIER,
  artLevelForMergeTier,
  collectionKeyForMergeTier,
  getMergeTierCreature,
  isMergeTier,
  mergesRequiredForTier,
  nextMergeTier
} from './mergeTiers';

describe('merge tiers', () => {
  it('extends the merge ladder to five tiers while keeping three authored art forms', () => {
    expect(MAX_MERGE_TIER).toBe(5);
    expect([1, 2, 3, 4, 5].map((tier) => artLevelForMergeTier(tier as 1 | 2 | 3 | 4 | 5)))
      .toEqual([1, 2, 3, 3, 3]);
    expect(collectionKeyForMergeTier('pinguino', 5)).toBe('pinguino-3');
  });

  it('makes each prestige merge a modest DPS improvement over keeping both source units', () => {
    const t3 = getMergeTierCreature('pinguino', 3);
    const t4 = getMergeTierCreature('pinguino', 4);
    const t5 = getMergeTierCreature('pinguino', 5);
    const dps = (damage: number, attackMs: number) => damage / attackMs;

    expect(t4.texture).toBe(getCreature('pinguino', 3).texture);
    expect(t5.texture).toBe(getCreature('pinguino', 3).texture);
    expect(dps(t4.damage, t4.attackMs)).toBeGreaterThan(dps(t3.damage, t3.attackMs) * 2);
    expect(dps(t5.damage, t5.attackMs)).toBeGreaterThan(dps(t4.damage, t4.attackMs) * 2);
    expect(dps(t5.damage, t5.attackMs)).toBeLessThan(dps(t4.damage, t4.attackMs) * 2.25);
  });

  it('requires sixteen tier-one copies to produce one tier-five unit', () => {
    expect(mergesRequiredForTier(1)).toBe(0);
    expect(mergesRequiredForTier(3)).toBe(3);
    expect(mergesRequiredForTier(5)).toBe(15);
    expect(nextMergeTier(4)).toBe(5);
    expect(nextMergeTier(5)).toBeNull();
  });

  it('validates only supported merge tiers', () => {
    for (const tier of [1, 2, 3, 4, 5]) expect(isMergeTier(tier)).toBe(true);
    for (const value of [0, 6, 2.5, '3', null]) expect(isMergeTier(value)).toBe(false);
  });
});
