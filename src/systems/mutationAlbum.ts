import { MUTATION_IDS, type MutationId } from '../content/mutations';
import type { BoardState } from './board';
import { COLLECTION_KEYS, type CollectionKey } from './collectionProgression';

export type MutationAlbumKey = `${CollectionKey}:${MutationId}`;

export interface MutationAlbumProgress {
  readonly discovered: readonly MutationAlbumKey[];
  readonly claimedMilestones: readonly number[];
}

export interface MutationAlbumMilestone {
  readonly target: number;
  readonly coins: number;
  readonly coreShards: number;
  readonly chaosStars: number;
}

export const MUTATION_ALBUM_TOTAL = COLLECTION_KEYS.length * MUTATION_IDS.length;
export const MUTATION_ALBUM_MILESTONES: readonly MutationAlbumMilestone[] = [
  { target: 12, coins: 150, coreShards: 0, chaosStars: 1 },
  { target: 36, coins: 300, coreShards: 1, chaosStars: 1 },
  { target: 72, coins: 500, coreShards: 2, chaosStars: 2 },
  { target: 108, coins: 750, coreShards: 3, chaosStars: 3 },
  { target: MUTATION_ALBUM_TOTAL, coins: 1000, coreShards: 5, chaosStars: 6 }
] as const;

let currentProgress: MutationAlbumProgress = createDefaultMutationAlbumProgress();

export function createDefaultMutationAlbumProgress(board?: BoardState): MutationAlbumProgress {
  const progress: MutationAlbumProgress = { discovered: [], claimedMilestones: [] };
  return board ? discoverMutationAlbumFromBoard(progress, board) : progress;
}

export function mutationAlbumKey(creature: CollectionKey, mutation: MutationId): MutationAlbumKey {
  return `${creature}:${mutation}`;
}

export function discoverMutationAlbumEntry(
  progress: MutationAlbumProgress,
  creature: CollectionKey,
  mutation: MutationId
): MutationAlbumProgress {
  const key = mutationAlbumKey(creature, mutation);
  if (progress.discovered.includes(key)) return progress;
  return { ...progress, discovered: [...progress.discovered, key] };
}

export function discoverMutationAlbumFromBoard(progress: MutationAlbumProgress, board: BoardState): MutationAlbumProgress {
  let next = progress;
  for (const unit of board) {
    if (!unit) continue;
    const creature = `${unit.family}-${unit.level}` as CollectionKey;
    next = discoverMutationAlbumEntry(next, creature, unit.mutation);
  }
  return next;
}

export function mutationAlbumCountForCreature(progress: MutationAlbumProgress, creature: CollectionKey): number {
  return MUTATION_IDS.reduce((count, mutation) => count + (progress.discovered.includes(mutationAlbumKey(creature, mutation)) ? 1 : 0), 0);
}

export function mutationAlbumCompletion(progress: MutationAlbumProgress): { current: number; total: number; percent: number } {
  const current = Math.min(MUTATION_ALBUM_TOTAL, progress.discovered.length);
  return { current, total: MUTATION_ALBUM_TOTAL, percent: Math.round((current / MUTATION_ALBUM_TOTAL) * 100) };
}

export function nextMutationAlbumMilestone(progress: MutationAlbumProgress): MutationAlbumMilestone | null {
  return MUTATION_ALBUM_MILESTONES.find((milestone) => !progress.claimedMilestones.includes(milestone.target)) ?? null;
}

export function claimMutationAlbumMilestone(progress: MutationAlbumProgress, target: number, bonusChaosStars = 0): {
  readonly claimed: boolean;
  readonly reward: { readonly coins: number; readonly coreShards: number; readonly chaosStars: number };
  readonly progress: MutationAlbumProgress;
} {
  const milestone = MUTATION_ALBUM_MILESTONES.find((entry) => entry.target === target);
  if (!milestone || progress.claimedMilestones.includes(target) || progress.discovered.length < target) {
    return { claimed: false, reward: { coins: 0, coreShards: 0, chaosStars: 0 }, progress };
  }
  const bonus = Math.max(0, Math.floor(Number.isFinite(bonusChaosStars) ? bonusChaosStars : 0));
  return {
    claimed: true,
    reward: { coins: milestone.coins, coreShards: milestone.coreShards, chaosStars: milestone.chaosStars + bonus },
    progress: { ...progress, claimedMilestones: [...progress.claimedMilestones, target] }
  };
}

export function isMutationAlbumKey(value: unknown): value is MutationAlbumKey {
  if (typeof value !== 'string') return false;
  const split = value.lastIndexOf(':');
  if (split <= 0) return false;
  const creature = value.slice(0, split);
  const mutation = value.slice(split + 1);
  return (COLLECTION_KEYS as readonly string[]).includes(creature) && (MUTATION_IDS as readonly string[]).includes(mutation);
}

export function syncCurrentMutationAlbumProgress(progress: MutationAlbumProgress): void { currentProgress = progress; }
export function getCurrentMutationAlbumProgress(): MutationAlbumProgress { return currentProgress; }
export function observeCurrentMutationAlbumBoard(board: BoardState): MutationAlbumProgress {
  currentProgress = discoverMutationAlbumFromBoard(currentProgress, board);
  return currentProgress;
}
export function resetCurrentMutationAlbumProgress(): void { currentProgress = createDefaultMutationAlbumProgress(); }
