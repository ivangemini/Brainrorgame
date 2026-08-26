import { getAllBosses, scaleBoss, type BossId } from '../content/bosses';
import { weeklyChaosWeekId } from './weeklyChaos';

export type BossTrophyTier = 'normal' | 'enraged' | 'nightmare';

export interface BossTrophyRoomProgress {
  readonly trophies: Readonly<Partial<Record<BossId, BossTrophyTier>>>;
}

export interface BossHuntProgress {
  readonly huntId: number;
  readonly bossId: BossId;
  readonly tier: BossTrophyTier;
  readonly maxHp: number;
  readonly hpRemaining: number;
  readonly attempts: number;
  readonly totalDamage: number;
  readonly bestAttemptDamage: number;
  readonly claimedMilestones: readonly number[];
  readonly defeated: boolean;
}

export interface BossHuntMilestone {
  readonly percent: 25 | 50 | 75 | 100;
  readonly coins: number;
  readonly coreShards: number;
}

export interface BossHuntDamageResult {
  readonly appliedDamage: number;
  readonly newlyReachedMilestones: readonly BossHuntMilestone[];
  readonly defeatedNow: boolean;
  readonly progress: BossHuntProgress;
}

export interface BossHuntClaimResult {
  readonly claimed: boolean;
  readonly reward: { readonly coins: number; readonly coreShards: number };
  readonly progress: BossHuntProgress;
}

export interface BossHuntVictoryResult {
  readonly upgraded: boolean;
  readonly trophy: BossTrophyTier;
  readonly trophyRoom: BossTrophyRoomProgress;
}

export const BOSS_HUNT_MILESTONES: readonly BossHuntMilestone[] = [
  { percent: 25, coins: 220, coreShards: 0 },
  { percent: 50, coins: 360, coreShards: 1 },
  { percent: 75, coins: 520, coreShards: 1 },
  { percent: 100, coins: 800, coreShards: 2 }
] as const;

const TIER_HP_MULTIPLIER: Readonly<Record<BossTrophyTier, number>> = {
  normal: 1,
  enraged: 1.55,
  nightmare: 2.2
};

export function createDefaultBossTrophyRoomProgress(): BossTrophyRoomProgress {
  return { trophies: {} };
}

export function bossHuntId(now = Date.now()): number {
  return weeklyChaosWeekId(now);
}

export function getBossHuntBossId(huntId: number): BossId {
  const bosses = getAllBosses();
  if (bosses.length === 0) throw new Error('Boss Hunt requires at least one boss');
  const index = stableHash(`brainror-boss-hunt-${Math.floor(huntId)}`) % bosses.length;
  return bosses[index]!.id;
}

export function getNextBossHuntTier(trophyRoom: BossTrophyRoomProgress, bossId: BossId): BossTrophyTier {
  const current = trophyRoom.trophies[bossId];
  if (current === 'normal') return 'enraged';
  if (current === 'enraged' || current === 'nightmare') return 'nightmare';
  return 'normal';
}

export function createBossHuntProgress(
  trophyRoom: BossTrophyRoomProgress,
  now = Date.now()
): BossHuntProgress {
  const huntId = bossHuntId(now);
  const bossId = getBossHuntBossId(huntId);
  const tier = getNextBossHuntTier(trophyRoom, bossId);
  const boss = getAllBosses().find((entry) => entry.id === bossId);
  if (!boss) throw new Error(`Unknown Boss Hunt boss ${bossId}`);
  const baseline = scaleBoss(boss, 18).hp;
  const maxHp = Math.max(1, Math.round(baseline * TIER_HP_MULTIPLIER[tier]));
  return {
    huntId,
    bossId,
    tier,
    maxHp,
    hpRemaining: maxHp,
    attempts: 0,
    totalDamage: 0,
    bestAttemptDamage: 0,
    claimedMilestones: [],
    defeated: false
  };
}

export function rollBossHuntProgress(
  progress: BossHuntProgress,
  trophyRoom: BossTrophyRoomProgress,
  now = Date.now()
): BossHuntProgress {
  return progress.huntId === bossHuntId(now) ? progress : createBossHuntProgress(trophyRoom, now);
}

export function recordBossHuntAttempt(
  progress: BossHuntProgress,
  rawDamage: number
): BossHuntDamageResult {
  if (progress.defeated) {
    return { appliedDamage: 0, newlyReachedMilestones: [], defeatedNow: false, progress };
  }
  const requested = Number.isFinite(rawDamage) ? Math.max(0, Math.floor(rawDamage)) : 0;
  const appliedDamage = Math.min(progress.hpRemaining, requested);
  const previousDamage = progress.totalDamage;
  const totalDamage = Math.min(progress.maxHp, previousDamage + appliedDamage);
  const hpRemaining = Math.max(0, progress.maxHp - totalDamage);
  const defeatedNow = hpRemaining === 0 && progress.hpRemaining > 0;
  const newlyReachedMilestones = BOSS_HUNT_MILESTONES.filter((milestone) => {
    const threshold = milestoneThreshold(progress.maxHp, milestone.percent);
    return previousDamage < threshold && totalDamage >= threshold;
  });
  return {
    appliedDamage,
    newlyReachedMilestones,
    defeatedNow,
    progress: {
      ...progress,
      hpRemaining,
      attempts: Math.min(1_000_000, progress.attempts + 1),
      totalDamage,
      bestAttemptDamage: Math.max(progress.bestAttemptDamage, appliedDamage),
      defeated: defeatedNow || progress.defeated
    }
  };
}

export function hasBossHuntClaimAvailable(progress: BossHuntProgress): boolean {
  return BOSS_HUNT_MILESTONES.some((milestone) => (
    progress.totalDamage >= milestoneThreshold(progress.maxHp, milestone.percent)
    && !progress.claimedMilestones.includes(milestone.percent)
  ));
}

export function claimBossHuntMilestone(progress: BossHuntProgress, percent: number): BossHuntClaimResult {
  const milestone = BOSS_HUNT_MILESTONES.find((entry) => entry.percent === percent);
  if (!milestone || progress.claimedMilestones.includes(percent)) {
    return { claimed: false, reward: { coins: 0, coreShards: 0 }, progress };
  }
  if (progress.totalDamage < milestoneThreshold(progress.maxHp, milestone.percent)) {
    return { claimed: false, reward: { coins: 0, coreShards: 0 }, progress };
  }
  return {
    claimed: true,
    reward: { coins: milestone.coins, coreShards: milestone.coreShards },
    progress: { ...progress, claimedMilestones: [...progress.claimedMilestones, milestone.percent] }
  };
}

export function recordBossHuntVictory(
  trophyRoom: BossTrophyRoomProgress,
  progress: BossHuntProgress
): BossHuntVictoryResult {
  const current = trophyRoom.trophies[progress.bossId];
  if (!progress.defeated) {
    return { upgraded: false, trophy: current ?? 'normal', trophyRoom };
  }
  const earned = progress.tier;
  const upgraded = trophyRank(earned) > trophyRank(current);
  if (!upgraded) return { upgraded: false, trophy: current ?? earned, trophyRoom };
  return {
    upgraded: true,
    trophy: earned,
    trophyRoom: {
      trophies: { ...trophyRoom.trophies, [progress.bossId]: earned }
    }
  };
}

export function bossHuntCompletionPercent(progress: BossHuntProgress): number {
  return Math.min(100, Math.max(0, Math.floor((progress.totalDamage / Math.max(1, progress.maxHp)) * 100)));
}

export function isBossTrophyTier(value: unknown): value is BossTrophyTier {
  return value === 'normal' || value === 'enraged' || value === 'nightmare';
}

function milestoneThreshold(maxHp: number, percent: number): number {
  return Math.max(1, Math.ceil(Math.max(1, maxHp) * percent / 100));
}

function trophyRank(tier: BossTrophyTier | undefined): number {
  if (tier === 'nightmare') return 3;
  if (tier === 'enraged') return 2;
  if (tier === 'normal') return 1;
  return 0;
}

function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
