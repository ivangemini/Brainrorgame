import { describe, expect, it } from 'vitest';
import {
  bossCoreReward,
  coinRewardMultiplier,
  createDefaultMetaUpgradeLevels,
  getUpgradeCost,
  incomingDamageMultiplier,
  purchaseMetaUpgrade,
  squadDamageMultiplier
} from './metaProgression';

describe('meta progression', () => {
  it('makes the first permanent upgrade available after one boss', () => {
    const levels = createDefaultMetaUpgradeLevels();
    expect(getUpgradeCost('power', levels)).toBe(1);
    const result = purchaseMetaUpgrade(1, levels, 'power');
    expect(result.purchased).toBe(true);
    expect(result.shards).toBe(0);
    expect(result.levels.power).toBe(1);
    expect(getUpgradeCost('power', result.levels)).toBe(2);
  });

  it('does not mutate progression when shards are insufficient', () => {
    const levels = createDefaultMetaUpgradeLevels();
    const result = purchaseMetaUpgrade(0, levels, 'armor');
    expect(result).toEqual({ purchased: false, shards: 0, levels });
  });

  it('applies bounded combat and economy multipliers', () => {
    const levels = { power: 3, armor: 8, bounty: 4 };
    expect(squadDamageMultiplier(levels)).toBeCloseTo(1.24);
    expect(incomingDamageMultiplier(levels)).toBeCloseTo(0.52);
    expect(coinRewardMultiplier(levels)).toBeCloseTo(1.4);
  });

  it('accelerates core rewards every five chapters with a cap', () => {
    expect(bossCoreReward(1)).toBe(1);
    expect(bossCoreReward(5)).toBe(1);
    expect(bossCoreReward(6)).toBe(2);
    expect(bossCoreReward(26)).toBe(6);
    expect(bossCoreReward(100)).toBe(8);
  });
});
