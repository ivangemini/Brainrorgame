import type { BoardState } from './board';
import type { EncounterStep } from './encounters';
import type { MetaUpgradeLevels } from './metaProgression';

export const COLLECTION_KEYS = [
  'pinguino-1',
  'pinguino-2',
  'pinguino-3',
  'toastodilo-1',
  'toastodilo-2',
  'toastodilo-3'
] as const;

export type CollectionKey = (typeof COLLECTION_KEYS)[number];
export type LifetimeEvent = 'merge' | 'recruit' | 'defeat' | 'boss' | 'upgrade';
export type AchievementId =
  | 'first-fusion'
  | 'merge-maniac'
  | 'weird-recruiter'
  | 'wave-cleaner'
  | 'boss-breaker'
  | 'core-engineer';

export interface LifetimeStats {
  readonly merges: number;
  readonly recruits: number;
  readonly defeats: number;
  readonly bosses: number;
  readonly upgrades: number;
}

export interface CollectionProgress {
  readonly discovered: readonly CollectionKey[];
  readonly stats: LifetimeStats;
  readonly claimedAchievements: readonly AchievementId[];
}

export interface AchievementReward {
  readonly coins: number;
  readonly coreShards: number;
}

export interface AchievementDefinition {
  readonly id: AchievementId;
  readonly name: string;
  readonly description: string;
  readonly stat: keyof LifetimeStats;
  readonly target: number;
  readonly reward: AchievementReward;
}

export interface AchievementClaimResult {
  readonly claimed: boolean;
  readonly reward: AchievementReward;
  readonly progress: CollectionProgress;
}

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  { id: 'first-fusion', name: 'FIRST FUSION', description: 'Complete 1 merge', stat: 'merges', target: 1, reward: { coins: 50, coreShards: 0 } },
  { id: 'merge-maniac', name: 'MERGE MANIAC', description: 'Complete 10 merges', stat: 'merges', target: 10, reward: { coins: 0, coreShards: 1 } },
  { id: 'weird-recruiter', name: 'WEIRD RECRUITER', description: 'Recruit 10 weirdos', stat: 'recruits', target: 10, reward: { coins: 100, coreShards: 0 } },
  { id: 'wave-cleaner', name: 'WAVE CLEANER', description: 'Defeat 20 targets', stat: 'defeats', target: 20, reward: { coins: 150, coreShards: 0 } },
  { id: 'boss-breaker', name: 'BOSS BREAKER', description: 'Defeat 5 bosses', stat: 'bosses', target: 5, reward: { coins: 0, coreShards: 2 } },
  { id: 'core-engineer', name: 'CORE ENGINEER', description: 'Buy 3 Core Lab upgrades', stat: 'upgrades', target: 3, reward: { coins: 0, coreShards: 1 } }
] as const;

export function createDefaultCollectionProgress(board?: BoardState): CollectionProgress {
  const progress: CollectionProgress = {
    discovered: [],
    stats: { merges: 0, recruits: 0, defeats: 0, bosses: 0, upgrades: 0 },
    claimedAchievements: []
  };
  return board ? discoverFromBoard(progress, board) : progress;
}

export function backfillCollectionProgress(
  board: BoardState,
  chapter: number,
  encounterStep: EncounterStep,
  recruitSerial: number,
  upgrades: MetaUpgradeLevels
): CollectionProgress {
  const minimumMergeCount = board.reduce((total, unit) => {
    if (!unit) return total;
    return total + (unit.level === 3 ? 3 : unit.level === 2 ? 1 : 0);
  }, 0);
  const completedChapters = Math.max(0, Math.floor(chapter) - 1);
  const completedTargets = completedChapters * 4 + Math.max(0, Math.min(3, encounterStep));
  const progress: CollectionProgress = {
    discovered: [],
    stats: {
      merges: minimumMergeCount,
      recruits: Math.max(0, Math.floor(recruitSerial)),
      defeats: completedTargets,
      bosses: completedChapters,
      upgrades: upgrades.power + upgrades.armor + upgrades.bounty
    },
    claimedAchievements: []
  };
  return discoverFromBoard(progress, board);
}

export function discoverFromBoard(progress: CollectionProgress, board: BoardState): CollectionProgress {
  let next = progress;
  for (const unit of board) {
    if (!unit) continue;
    for (let level = 1; level <= unit.level; level += 1) {
      next = discoverCreature(next, `${unit.family}-${level}`);
    }
  }
  return next;
}

export function discoverCreature(progress: CollectionProgress, key: string): CollectionProgress {
  if (!isCollectionKey(key) || progress.discovered.includes(key)) return progress;
  return { ...progress, discovered: [...progress.discovered, key] };
}

export function recordLifetimeEvent(progress: CollectionProgress, event: LifetimeEvent, amount = 1): CollectionProgress {
  const increment = Math.max(0, Math.floor(amount));
  if (increment === 0) return progress;
  const stat = statForEvent(event);
  return {
    ...progress,
    stats: { ...progress.stats, [stat]: Math.min(1_000_000_000, progress.stats[stat] + increment) }
  };
}

export function achievementProgress(progress: CollectionProgress, id: AchievementId): { current: number; target: number; ready: boolean; claimed: boolean } {
  const definition = getAchievement(id);
  const current = progress.stats[definition.stat];
  const claimed = progress.claimedAchievements.includes(id);
  return { current: Math.min(current, definition.target), target: definition.target, ready: current >= definition.target && !claimed, claimed };
}

export function hasAchievementClaimAvailable(progress: CollectionProgress): boolean {
  return ACHIEVEMENTS.some((achievement) => achievementProgress(progress, achievement.id).ready);
}

export function claimAchievement(progress: CollectionProgress, id: AchievementId): AchievementClaimResult {
  const definition = getAchievement(id);
  const status = achievementProgress(progress, id);
  if (!status.ready) {
    return { claimed: false, reward: { coins: 0, coreShards: 0 }, progress };
  }
  return {
    claimed: true,
    reward: definition.reward,
    progress: { ...progress, claimedAchievements: [...progress.claimedAchievements, id] }
  };
}

export function getAchievement(id: AchievementId): AchievementDefinition {
  const definition = ACHIEVEMENTS.find((achievement) => achievement.id === id);
  if (!definition) throw new Error(`Unknown achievement: ${id}`);
  return definition;
}

export function isCollectionKey(value: unknown): value is CollectionKey {
  return typeof value === 'string' && (COLLECTION_KEYS as readonly string[]).includes(value);
}

export function isAchievementId(value: unknown): value is AchievementId {
  return typeof value === 'string' && ACHIEVEMENTS.some((achievement) => achievement.id === value);
}

function statForEvent(event: LifetimeEvent): keyof LifetimeStats {
  if (event === 'merge') return 'merges';
  if (event === 'recruit') return 'recruits';
  if (event === 'defeat') return 'defeats';
  if (event === 'boss') return 'bosses';
  return 'upgrades';
}
