import {
  createBossHuntProgress,
  createDefaultBossTrophyRoomProgress,
  rollBossHuntProgress,
  type BossHuntProgress,
  type BossTrophyRoomProgress
} from './bossHunt';

let currentTrophyRoom: BossTrophyRoomProgress = createDefaultBossTrophyRoomProgress();
let currentBossHunt: BossHuntProgress = createBossHuntProgress(currentTrophyRoom);

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
}

export function replaceCurrentBossHuntProgress(progress: BossHuntProgress): void {
  currentBossHunt = cloneHunt(progress);
}

export function replaceCurrentBossTrophyRoomProgress(progress: BossTrophyRoomProgress): void {
  currentTrophyRoom = cloneRoom(progress);
}

export function resetCurrentBossHuntRuntime(now = Date.now()): void {
  currentTrophyRoom = createDefaultBossTrophyRoomProgress();
  currentBossHunt = createBossHuntProgress(currentTrophyRoom, now);
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
