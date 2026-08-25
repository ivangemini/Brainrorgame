import { describe, expect, it } from 'vitest';
import {
  DAILY_CHAOS_CHEST_REWARD_COINS,
  canClaimDailyReward,
  claimDailyMission,
  claimDailyReward,
  createDefaultDailyState,
  getDailyMissionCompletionCount,
  isDailyChaosChestComplete,
  recordDailyAction,
  rollDailyState
} from './dailyRetention';

const day1 = Date.parse('2026-08-25T12:00:00.000Z');
const day2 = Date.parse('2026-08-26T12:00:00.000Z');
const day4 = Date.parse('2026-08-28T12:00:00.000Z');

describe('daily retention', () => {
  it('claims once per UTC day and advances consecutive streaks', () => {
    const initial = createDefaultDailyState(day1);
    const first = claimDailyReward(initial, day1);
    expect(first.claimed).toBe(true);
    expect(first.reward?.day).toBe(1);
    expect(canClaimDailyReward(first.state, day1)).toBe(false);

    const second = claimDailyReward(first.state, day2);
    expect(second.claimed).toBe(true);
    expect(second.reward?.day).toBe(2);
  });

  it('resets reward streak after a missed day', () => {
    const first = claimDailyReward(createDefaultDailyState(day1), day1);
    const resumed = claimDailyReward(first.state, day4);
    expect(resumed.reward?.day).toBe(1);
  });

  it('resets mission counters on a new day', () => {
    const progressed = recordDailyAction(createDefaultDailyState(day1), 'merge', 3, day1);
    const rolled = rollDailyState(progressed, day2);
    expect(rolled.counters.merge).toBe(0);
    expect(rolled.claimed.merge).toBe(false);
  });

  it('only pays completed missions once', () => {
    const progressed = recordDailyAction(createDefaultDailyState(day1), 'recruit', 3, day1);
    const first = claimDailyMission(progressed, 'recruit', day1);
    const second = claimDailyMission(first.state, 'recruit', day1);
    expect(first.claimed).toBe(true);
    expect(first.coins).toBe(60);
    expect(first.chestBonusCoins).toBe(0);
    expect(second.claimed).toBe(false);
  });

  it('pays the Daily Chaos Chest exactly when the third mission is claimed', () => {
    let state = createDefaultDailyState(day1);
    state = recordDailyAction(state, 'merge', 3, day1);
    state = recordDailyAction(state, 'defeat', 6, day1);
    state = recordDailyAction(state, 'recruit', 3, day1);

    const merge = claimDailyMission(state, 'merge', day1);
    expect(merge.chestBonusCoins).toBe(0);
    expect(getDailyMissionCompletionCount(merge.state, day1)).toBe(1);

    const defeat = claimDailyMission(merge.state, 'defeat', day1);
    expect(defeat.chestBonusCoins).toBe(0);
    expect(getDailyMissionCompletionCount(defeat.state, day1)).toBe(2);

    const recruit = claimDailyMission(defeat.state, 'recruit', day1);
    expect(recruit.chestBonusCoins).toBe(DAILY_CHAOS_CHEST_REWARD_COINS);
    expect(recruit.coins).toBe(60 + DAILY_CHAOS_CHEST_REWARD_COINS);
    expect(getDailyMissionCompletionCount(recruit.state, day1)).toBe(3);
    expect(isDailyChaosChestComplete(recruit.state, day1)).toBe(true);

    const retry = claimDailyMission(recruit.state, 'recruit', day1);
    expect(retry.claimed).toBe(false);
    expect(retry.chestBonusCoins).toBe(0);
  });

  it('resets Daily Chaos Chest progress with the UTC daily rollover', () => {
    let state = createDefaultDailyState(day1);
    state = recordDailyAction(state, 'merge', 3, day1);
    state = claimDailyMission(state, 'merge', day1).state;
    expect(getDailyMissionCompletionCount(state, day1)).toBe(1);

    const rolled = rollDailyState(state, day2);
    expect(getDailyMissionCompletionCount(rolled, day2)).toBe(0);
    expect(isDailyChaosChestComplete(rolled, day2)).toBe(false);
  });
});
