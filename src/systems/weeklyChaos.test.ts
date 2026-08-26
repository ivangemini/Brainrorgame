import { describe, expect, it } from 'vitest';
import {
  WEEKLY_CHAOS_MAX_DEPTH,
  WEEKLY_CHAOS_RULE_COUNT,
  advanceWeeklyChaosRun,
  claimWeeklyChaosMilestone,
  createDefaultWeeklyChaosProgress,
  failWeeklyChaosRun,
  getWeeklyChaosModifiers,
  getWeeklyChaosRules,
  hasWeeklyChaosClaimAvailable,
  rollWeeklyChaosProgress,
  startWeeklyChaosRun,
  weeklyChaosSeed,
  weeklyChaosWeekId,
  weeklyRecruitCost
} from './weeklyChaos';

describe('weekly chaos run', () => {
  it('derives a stable ISO week id in UTC', () => {
    expect(weeklyChaosWeekId(Date.parse('2026-08-24T00:00:00.000Z'))).toBe(202635);
    expect(weeklyChaosWeekId(Date.parse('2026-08-30T23:59:59.999Z'))).toBe(202635);
    expect(weeklyChaosWeekId(Date.parse('2026-08-31T00:00:00.000Z'))).toBe(202636);
  });

  it('selects the same unique rule set for every player in the same week', () => {
    const first = getWeeklyChaosRules(202635);
    const second = getWeeklyChaosRules(202635);
    expect(first.map((rule) => rule.id)).toEqual(second.map((rule) => rule.id));
    expect(new Set(first.map((rule) => rule.id)).size).toBe(WEEKLY_CHAOS_RULE_COUNT);
    expect(first).toHaveLength(WEEKLY_CHAOS_RULE_COUNT);
    expect(weeklyChaosSeed(202635)).toBe(weeklyChaosSeed(202635));
  });

  it('resets progression when the UTC week changes', () => {
    const monday = Date.parse('2026-08-24T12:00:00.000Z');
    let progress = createDefaultWeeklyChaosProgress(monday);
    progress = startWeeklyChaosRun(progress, monday).progress;
    progress = advanceWeeklyChaosRun(progress).progress;
    expect(progress.depth).toBe(1);
    const nextWeek = rollWeeklyChaosProgress(progress, Date.parse('2026-08-31T12:00:00.000Z'));
    expect(nextWeek.weekId).toBe(202636);
    expect(nextWeek.active).toBe(false);
    expect(nextWeek.depth).toBe(0);
    expect(nextWeek.bestDepth).toBe(0);
    expect(nextWeek.claimedMilestones).toEqual([]);
  });

  it('advances to a bounded 12-clear completion and exposes milestones', () => {
    const now = Date.parse('2026-08-25T12:00:00.000Z');
    let progress = startWeeklyChaosRun(createDefaultWeeklyChaosProgress(now), now).progress;
    let milestones: number[] = [];
    let completed = false;
    for (let index = 0; index < WEEKLY_CHAOS_MAX_DEPTH; index += 1) {
      const result = advanceWeeklyChaosRun(progress);
      progress = result.progress;
      completed = result.completed;
      if (result.reachedMilestone) milestones.push(result.reachedMilestone.target);
    }
    expect(progress.bestDepth).toBe(12);
    expect(progress.depth).toBe(12);
    expect(progress.active).toBe(false);
    expect(completed).toBe(true);
    expect(milestones).toEqual([3, 6, 9, 12]);
    expect(advanceWeeklyChaosRun(progress).advanced).toBe(false);
  });

  it('ends an active attempt on failure while preserving best depth', () => {
    const now = Date.parse('2026-08-25T12:00:00.000Z');
    let progress = startWeeklyChaosRun(createDefaultWeeklyChaosProgress(now), now).progress;
    for (let index = 0; index < 5; index += 1) progress = advanceWeeklyChaosRun(progress).progress;
    const failed = failWeeklyChaosRun(progress);
    expect(failed.failed).toBe(true);
    expect(failed.depth).toBe(5);
    expect(failed.progress.active).toBe(false);
    expect(failed.progress.bestDepth).toBe(5);
    const restarted = startWeeklyChaosRun(failed.progress, now);
    expect(restarted.started).toBe(true);
    expect(restarted.progress.depth).toBe(0);
    expect(restarted.progress.bestDepth).toBe(5);
    expect(restarted.progress.runsStarted).toBe(2);
  });

  it('allows each reached milestone reward exactly once per week', () => {
    const now = Date.parse('2026-08-25T12:00:00.000Z');
    let progress = startWeeklyChaosRun(createDefaultWeeklyChaosProgress(now), now).progress;
    for (let index = 0; index < 6; index += 1) progress = advanceWeeklyChaosRun(progress).progress;
    expect(hasWeeklyChaosClaimAvailable(progress)).toBe(true);
    const first = claimWeeklyChaosMilestone(progress, 3);
    expect(first.claimed).toBe(true);
    expect(first.reward.coins).toBe(160);
    const duplicate = claimWeeklyChaosMilestone(first.progress, 3);
    expect(duplicate.claimed).toBe(false);
    const second = claimWeeklyChaosMilestone(first.progress, 6);
    expect(second.claimed).toBe(true);
    expect(second.reward.coreShards).toBe(1);
    expect(hasWeeklyChaosClaimAvailable(second.progress)).toBe(false);
  });

  it('only applies rule modifiers while a run is active', () => {
    const now = Date.parse('2026-08-25T12:00:00.000Z');
    const idle = createDefaultWeeklyChaosProgress(now);
    expect(getWeeklyChaosModifiers(idle)).toEqual({
      squadDamage: 1,
      attackInterval: 1,
      incomingDamage: 1,
      enemyHp: 1,
      coinRewards: 1,
      recruitCost: 1
    });
    const active = startWeeklyChaosRun(idle, now).progress;
    const modifiers = getWeeklyChaosModifiers(active);
    expect(Object.values(modifiers).some((value) => value !== 1)).toBe(true);
    expect(weeklyRecruitCost(20, active)).toBeGreaterThan(0);
  });
});
