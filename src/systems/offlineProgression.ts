import { coinRewardMultiplier, type MetaUpgradeLevels } from './metaProgression';

export const OFFLINE_MIN_SECONDS = 2 * 60;
export const OFFLINE_CAP_SECONDS = 6 * 60 * 60;

export interface OfflineReward {
  readonly elapsedSeconds: number;
  readonly rewardedSeconds: number;
  readonly coins: number;
}

export function calculateOfflineReward(
  lastSavedAt: number,
  now: number,
  chapter: number,
  levels: MetaUpgradeLevels
): OfflineReward {
  const elapsedSeconds = Math.max(0, Math.floor((now - lastSavedAt) / 1000));
  if (elapsedSeconds < OFFLINE_MIN_SECONDS) {
    return { elapsedSeconds, rewardedSeconds: 0, coins: 0 };
  }

  const rewardedSeconds = Math.min(elapsedSeconds, OFFLINE_CAP_SECONDS);
  const safeChapter = Math.min(25, Math.max(1, Math.floor(chapter)));
  const baseCoinsPerMinute = 0.91 + safeChapter * 0.12;
  const rawCoins = (rewardedSeconds / 60) * baseCoinsPerMinute * coinRewardMultiplier(levels);
  const coins = Math.max(1, Math.floor(rawCoins));
  return { elapsedSeconds, rewardedSeconds, coins };
}

export function formatOfflineDuration(seconds: number): string {
  const minutes = Math.max(1, Math.floor(seconds / 60));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`;
}
