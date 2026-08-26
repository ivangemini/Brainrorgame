import {
  bossHuntCompletionPercent,
  createBossHuntProgress,
  createDefaultBossTrophyRoomProgress,
  recordBossHuntAttempt,
  recordBossHuntVictory,
  rollBossHuntProgress,
  type BossHuntDamageResult,
  type BossHuntProgress,
  type BossHuntVictoryResult,
  type BossTrophyRoomProgress
} from './bossHunt';

export interface FinishedBossHuntAttempt {
  readonly result: BossHuntDamageResult;
  readonly trophy: BossHuntVictoryResult | null;
  readonly completionPercent: number;
}

let currentTrophyRoom: BossTrophyRoomProgress = createDefaultBossTrophyRoomProgress();
let currentBossHunt: BossHuntProgress = createBossHuntProgress(currentTrophyRoom);
let attemptDamage = 0;
let attemptOpen = false;

export function getCurrentBossHuntProgress(): BossHuntProgress {
  return cloneHunt(currentBossHunt);
}

export function getCurrentBossTrophyRoomProgress(): BossTrophyRoomProgress {
  return cloneRoom(currentTrophyRoom);
}

export function syncCurrentBossHuntProgress(
  bossHunt: BossHuntProgress,
  trophyRoom: BossTrophyRoomProgress,
  now = Date.now()
): void {
  currentTrophyRoom = cloneRoom(trophyRoom);
  currentBossHunt = cloneHunt(rollBossHuntProgress(bossHunt, currentTrophyRoom, now));
  attemptDamage = 0;
  attemptOpen = false;
}

export function replaceCurrentBossHuntProgress(progress: BossHuntProgress): void {
  currentBossHunt = cloneHunt(progress);
}

export function replaceCurrentBossTrophyRoomProgress(progress: BossTrophyRoomProgress): void {
  currentTrophyRoom = cloneRoom(progress);
}

export function beginCurrentBossHuntAttempt(): void {
  attemptDamage = 0;
  attemptOpen = !currentBossHunt.defeated;
}

export function recordCurrentBossHuntDamage(rawDamage: number): number {
  if (!attemptOpen || currentBossHunt.defeated || !Number.isFinite(rawDamage) || rawDamage <= 0) return attemptDamage;
  const remainingForAttempt = Math.max(0, currentBossHunt.hpRemaining - attemptDamage);
  attemptDamage += Math.min(remainingForAttempt, Math.floor(rawDamage));
  return attemptDamage;
}

export function getCurrentBossHuntAttemptDamage(): number {
  return attemptDamage;
}

export function finishCurrentBossHuntAttempt(): FinishedBossHuntAttempt | null {
  if (!attemptOpen) return null;
  attemptOpen = false;
  const result = recordBossHuntAttempt(currentBossHunt, attemptDamage);
  currentBossHunt = cloneHunt(result.progress);
  attemptDamage = 0;

  let trophy: BossHuntVictoryResult | null = null;
  if (result.defeatedNow) {
    trophy = recordBossHuntVictory(currentTrophyRoom, currentBossHunt);
    currentTrophyRoom = cloneRoom(trophy.trophyRoom);
  }

  return {
    result,
    trophy,
    completionPercent: bossHuntCompletionPercent(currentBossHunt)
  };
}

export function cancelCurrentBossHuntAttempt(): void {
  attemptDamage = 0;
  attemptOpen = false;
}

export function resetCurrentBossHuntRuntime(now = Date.now()): void {
  currentTrophyRoom = createDefaultBossTrophyRoomProgress();
  currentBossHunt = createBossHuntProgress(currentTrophyRoom, now);
  attemptDamage = 0;
  attemptOpen = false;
}

function cloneHunt(progress: BossHuntProgress): BossHuntProgress {
  return {
    ...progress,
    claimedMilestones: [...progress.claimedMilestones]
  };
}

function cloneRoom(progress: BossTrophyRoomProgress): BossTrophyRoomProgress {
  return { trophies: { ...progress.trophies } };
}
