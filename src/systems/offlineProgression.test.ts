import { describe, expect, it } from 'vitest';
import { calculateOfflineReward, OFFLINE_CAP_SECONDS } from './offlineProgression';

const noUpgrades = { power: 0, armor: 0, bounty: 0 } as const;

describe('offline progression', () => {
  it('does not reward sub-minute absences', () => {
    expect(calculateOfflineReward(0, 59_000, 1, noUpgrades).coins).toBe(0);
  });

  it('scales with chapter and bounty upgrades', () => {
    const base = calculateOfflineReward(0, 60 * 60 * 1000, 5, noUpgrades);
    const boosted = calculateOfflineReward(0, 60 * 60 * 1000, 5, { power: 0, armor: 0, bounty: 3 });
    expect(boosted.coins).toBeGreaterThan(base.coins);
  });

  it('caps rewarded time at eight hours', () => {
    const reward = calculateOfflineReward(0, 24 * 60 * 60 * 1000, 10, noUpgrades);
    expect(reward.rewardedSeconds).toBe(OFFLINE_CAP_SECONDS);
  });
});
