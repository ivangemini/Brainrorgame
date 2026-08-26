import type { MutationId } from '../content/mutations';
import {
  createDefaultAscensionProgress,
  getAscensionEffects,
  type AscensionEffects,
  type AscensionProgress
} from './ascension';

let currentAscensionProgress: AscensionProgress = createDefaultAscensionProgress();
let currentChapter = 1;
let totalMergesThisAscension = 0;
let recruitCredits = 0;
let mutationCatalystChapter = 0;
let lastStandCharges = 0;
let albumCacheClaimed = false;
const rerollsUsedByChapter = new Set<number>();

export function getCurrentAscensionProgress(): AscensionProgress {
  return clone(currentAscensionProgress);
}

export function getCurrentAscensionEffects(): AscensionEffects {
  return getAscensionEffects(currentAscensionProgress.purchasedNodes);
}

export function syncCurrentAscensionProgress(progress: AscensionProgress): void {
  currentAscensionProgress = clone(progress);
  lastStandCharges = Math.min(lastStandCharges, getCurrentAscensionEffects().fortressLastStandCharges);
}

export function syncAscensionRuntimeChapter(chapter: number): void {
  currentChapter = Math.max(1, Math.floor(chapter));
}

export function getAscensionRuntimeChapter(): number {
  return currentChapter;
}

export function beginAscensionRunRuntime(): void {
  const effects = getCurrentAscensionEffects();
  currentChapter = 1;
  totalMergesThisAscension = 0;
  recruitCredits = effects.startingRecruitCredits;
  mutationCatalystChapter = 0;
  lastStandCharges = effects.fortressLastStandCharges;
  albumCacheClaimed = false;
  rerollsUsedByChapter.clear();
}

export function recordAscensionMerge(resultingLevel: 1 | 2 | 3, mutation: MutationId): {
  readonly mutation: MutationId;
  readonly recruitCreditsEarned: number;
  readonly catalystApplied: boolean;
} {
  const effects = getCurrentAscensionEffects();
  totalMergesThisAscension += 1;
  let recruitCreditsEarned = 0;
  if (effects.mergeEchoInterval && totalMergesThisAscension % effects.mergeEchoInterval === 0) {
    recruitCreditsEarned = effects.mergeEchoRecruitCredits;
    recruitCredits += recruitCreditsEarned;
  }

  const catalystApplied = Boolean(
    effects.tierThreeMutationBoost
    && resultingLevel === 3
    && mutationCatalystChapter !== currentChapter
  );
  if (catalystApplied) mutationCatalystChapter = currentChapter;

  return {
    mutation: catalystApplied ? promoteMutation(mutation) : mutation,
    recruitCreditsEarned,
    catalystApplied
  };
}

export function getAscensionRecruitCredits(): number {
  return recruitCredits;
}

export function consumeAscensionRecruitCredit(): boolean {
  if (recruitCredits <= 0) return false;
  recruitCredits -= 1;
  return true;
}

export function consumeAscensionLastStand(): boolean {
  if (lastStandCharges <= 0) return false;
  lastStandCharges -= 1;
  return true;
}

export function getAscensionLastStandCharges(): number {
  return lastStandCharges;
}

export function canUseAscensionDraftReroll(chapter = currentChapter): boolean {
  const safeChapter = Math.max(1, Math.floor(chapter));
  return getCurrentAscensionEffects().draftRerollsPerChapter > 0 && !rerollsUsedByChapter.has(safeChapter);
}

export function consumeAscensionDraftReroll(chapter = currentChapter): boolean {
  const safeChapter = Math.max(1, Math.floor(chapter));
  if (!canUseAscensionDraftReroll(safeChapter)) return false;
  rerollsUsedByChapter.add(safeChapter);
  return true;
}

export function claimAscensionAlbumCache(): number {
  const reward = getCurrentAscensionEffects().firstAlbumDiscoveryCoreShards;
  if (reward <= 0 || albumCacheClaimed) return 0;
  albumCacheClaimed = true;
  return reward;
}

export function resetCurrentAscensionProgress(): void {
  currentAscensionProgress = createDefaultAscensionProgress();
  currentChapter = 1;
  totalMergesThisAscension = 0;
  recruitCredits = 0;
  mutationCatalystChapter = 0;
  lastStandCharges = 0;
  albumCacheClaimed = false;
  rerollsUsedByChapter.clear();
}

function promoteMutation(mutation: MutationId): MutationId {
  if (mutation === 'none') return 'charged';
  if (mutation === 'charged') return 'prismatic';
  if (mutation === 'prismatic') return 'crowned';
  return 'crowned';
}

function clone(progress: AscensionProgress): AscensionProgress {
  return {
    ...progress,
    purchasedNodes: [...progress.purchasedNodes]
  };
}
