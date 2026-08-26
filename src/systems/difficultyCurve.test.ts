import { describe, expect, it } from 'vitest';
import { applyCampaignPressure, getCampaignPressure } from './difficultyCurve';

describe('campaign difficulty curve', () => {
  it('starts with a meaningful durability increase without increasing chapter-one damage', () => {
    expect(getCampaignPressure(1, 'wave')).toEqual({
      hpMultiplier: 1.35,
      damageMultiplier: 1,
      attackIntervalMultiplier: 1,
      rewardMultiplier: 1
    });
    expect(getCampaignPressure(1, 'boss').hpMultiplier).toBe(1.5);
  });

  it('forces stronger merge progression by chapter ten', () => {
    const wave = getCampaignPressure(10, 'wave');
    const boss = getCampaignPressure(10, 'boss');
    expect(wave.hpMultiplier).toBeCloseTo(4.41, 5);
    expect(boss.hpMultiplier).toBeCloseTo(4.2, 5);
    expect(wave.damageMultiplier).toBeCloseTo(1.225, 5);
    expect(wave.attackIntervalMultiplier).toBeCloseTo(0.955, 5);
    expect(wave.rewardMultiplier).toBeCloseTo(1.108, 5);
  });

  it('caps endless pressure instead of growing without bound', () => {
    expect(getCampaignPressure(100, 'wave')).toEqual({
      hpMultiplier: 9.5,
      damageMultiplier: 1.42,
      attackIntervalMultiplier: 0.9,
      rewardMultiplier: 1.18
    });
    expect(getCampaignPressure(100, 'boss').hpMultiplier).toBe(7.5);
  });

  it('respects attack floors while applying the rest of the pressure', () => {
    expect(applyCampaignPressure({ hp: 100, damage: 10, attackMs: 1500, reward: 20 }, 25, 'wave', 1450)).toEqual({
      hp: 950,
      damage: 14,
      attackMs: 1450,
      reward: 24
    });
  });
});
