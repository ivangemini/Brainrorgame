import { describe, expect, it } from 'vitest';
import {
  BOSS_HUNT_MILESTONES,
  bossHuntCompletionPercent,
  claimBossHuntMilestone,
  createBossHuntProgress,
  createDefaultBossTrophyRoomProgress,
  getBossHuntBossId,
  getNextBossHuntTier,
  hasBossHuntClaimAvailable,
  recordBossHuntAttempt,
  recordBossHuntVictory,
  rollBossHuntProgress
} from './bossHunt';

const WEEK_A = Date.parse('2026-08-24T12:00:00.000Z');
const WEEK_B = Date.parse('2026-08-31T12:00:00.000Z');

describe('Boss Hunt', () => {
  it('selects the same authored boss deterministically for the same weekly hunt', () => {
    const room = createDefaultBossTrophyRoomProgress();
    const first = createBossHuntProgress(room, WEEK_A);
    const repeated = createBossHuntProgress(room, WEEK_A + 86_400_000);
    expect(first.huntId).toBe(repeated.huntId);
    expect(first.bossId).toBe(repeated.bossId);
    expect(first.bossId).toBe(getBossHuntBossId(first.huntId));
    expect(first.tier).toBe('normal');
  });

  it('persists damage across attempts and emits newly crossed finite milestones', () => {
    const start = createBossHuntProgress(createDefaultBossTrophyRoomProgress(), WEEK_A);
    const quarter = Math.ceil(start.maxHp * 0.25);
    const first = recordBossHuntAttempt(start, quarter - 1);
    expect(first.newlyReachedMilestones).toEqual([]);
    expect(first.progress.hpRemaining).toBe(start.maxHp - (quarter - 1));
    const second = recordBossHuntAttempt(first.progress, 2);
    expect(second.newlyReachedMilestones.map((entry) => entry.percent)).toEqual([25]);
    expect(second.progress.attempts).toBe(2);
    expect(second.progress.totalDamage).toBe(quarter + 1);
    expect(bossHuntCompletionPercent(second.progress)).toBeGreaterThanOrEqual(25);
  });

  it('caps damage at remaining HP and marks defeat exactly once', () => {
    const start = createBossHuntProgress(createDefaultBossTrophyRoomProgress(), WEEK_A);
    const defeated = recordBossHuntAttempt(start, start.maxHp * 10);
    expect(defeated.appliedDamage).toBe(start.maxHp);
    expect(defeated.defeatedNow).toBe(true);
    expect(defeated.progress.hpRemaining).toBe(0);
    expect(defeated.progress.defeated).toBe(true);
    expect(defeated.newlyReachedMilestones.map((entry) => entry.percent)).toEqual([25, 50, 75, 100]);
    const repeat = recordBossHuntAttempt(defeated.progress, 1000);
    expect(repeat.appliedDamage).toBe(0);
    expect(repeat.defeatedNow).toBe(false);
  });

  it('allows each reached reward cache to be claimed only once', () => {
    const start = createBossHuntProgress(createDefaultBossTrophyRoomProgress(), WEEK_A);
    const damaged = recordBossHuntAttempt(start, Math.ceil(start.maxHp * 0.51)).progress;
    expect(hasBossHuntClaimAvailable(damaged)).toBe(true);
    const first = claimBossHuntMilestone(damaged, 25);
    expect(first.claimed).toBe(true);
    expect(first.reward).toEqual(BOSS_HUNT_MILESTONES[0] && {
      coins: BOSS_HUNT_MILESTONES[0].coins,
      coreShards: BOSS_HUNT_MILESTONES[0].coreShards
    });
    expect(claimBossHuntMilestone(first.progress, 25).claimed).toBe(false);
    expect(claimBossHuntMilestone(first.progress, 75).claimed).toBe(false);
  });

  it('upgrades trophies Normal to Enraged to Nightmare for each boss', () => {
    const empty = createDefaultBossTrophyRoomProgress();
    const normal = createBossHuntProgress(empty, WEEK_A);
    const normalWin = recordBossHuntAttempt(normal, normal.maxHp).progress;
    const normalTrophy = recordBossHuntVictory(empty, normalWin);
    expect(normalTrophy.upgraded).toBe(true);
    expect(normalTrophy.trophy).toBe('normal');
    expect(getNextBossHuntTier(normalTrophy.trophyRoom, normal.bossId)).toBe('enraged');

    const forcedEnraged = { ...normal, tier: 'enraged' as const, defeated: true, hpRemaining: 0 };
    const enragedTrophy = recordBossHuntVictory(normalTrophy.trophyRoom, forcedEnraged);
    expect(enragedTrophy.trophy).toBe('enraged');
    expect(getNextBossHuntTier(enragedTrophy.trophyRoom, normal.bossId)).toBe('nightmare');

    const forcedNightmare = { ...normal, tier: 'nightmare' as const, defeated: true, hpRemaining: 0 };
    const nightmareTrophy = recordBossHuntVictory(enragedTrophy.trophyRoom, forcedNightmare);
    expect(nightmareTrophy.trophy).toBe('nightmare');
    expect(getNextBossHuntTier(nightmareTrophy.trophyRoom, normal.bossId)).toBe('nightmare');
  });

  it('rolls to a fresh hunt on the next UTC week', () => {
    const room = createDefaultBossTrophyRoomProgress();
    const start = createBossHuntProgress(room, WEEK_A);
    const damaged = recordBossHuntAttempt(start, 100).progress;
    const rolled = rollBossHuntProgress(damaged, room, WEEK_B);
    expect(rolled.huntId).not.toBe(start.huntId);
    expect(rolled.totalDamage).toBe(0);
    expect(rolled.attempts).toBe(0);
  });
});
