import { describe, expect, it } from 'vitest';
import {
  calculateOfflineReward,
  OFFLINE_CAP_SECONDS,
  OFFLINE_MIN_SECONDS
} from './offlineProgression';

const noUpgrades = { power: 0, armor: 0, bounty: 0 } as const;

describe('offline progression', () => {
  it('does not reward quick refreshes or future timestamps', () => {
    expect(calculateOfflineReward(0, (OFFLINE_MIN_SECONDS - 1) * 1000, 1, noUpgrades).coins).toBe(0);
    expect(calculateOfflineReward(60_000, 0, 1, noUpgrades).coins).toBe(0);
  });

  it('keeps the starter chapter reward conservative', () => {
    const reward = calculateOfflineReward(0, 60 * 60 * 1000, 1, noUpgrades);
    expect(reward.coins).toBe(61);
    expect(reward.rewardedSeconds).toBe(60 * 60);
  });

  it('lets chapter and Bounty Coil improve coin earnings', () => {
    const base = calculateOfflineReward(0, 60 * 60 * 1000, 5, noUpgrades);
    const laterChapter = calculateOfflineReward(0, 60 * 60 * 1000, 10, noUpgrades);
    const boosted = calculateOfflineReward(0, 60 * 60 * 1000, 5, { power: 0, armor: 0, bounty: 3 });
    expect(laterChapter.coins).toBeGreaterThan(base.coins);
    expect(boosted.coins).toBeGreaterThan(base.coins);
  });

  it('caps rewarded time at six hours', () => {
    const reward = calculateOfflineReward(0, 24 * 60 * 60 * 1000, 10, noUpgrades);
    const atCap = calculateOfflineReward(0, OFFLINE_CAP_SECONDS * 1000, 10, noUpgrades);
    expect(reward.rewardedSeconds).toBe(OFFLINE_CAP_SECONDS);
    expect(reward.coins).toBe(atCap.coins);
  });
});
