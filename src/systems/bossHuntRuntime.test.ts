import { afterEach, describe, expect, it } from 'vitest';
import { createBossHuntProgress, createDefaultBossTrophyRoomProgress } from './bossHunt';
import {
  beginCurrentBossHuntAttempt,
  finishCurrentBossHuntAttempt,
  getCurrentBossHuntAttemptDamage,
  getCurrentBossHuntProgress,
  getCurrentBossTrophyRoomProgress,
  recordCurrentBossHuntDamage,
  resetCurrentBossHuntRuntime,
  syncCurrentBossHuntProgress
} from './bossHuntRuntime';

const NOW = Date.parse('2026-08-25T12:00:00.000Z');

afterEach(() => resetCurrentBossHuntRuntime(NOW));

describe('Boss Hunt runtime', () => {
  it('aggregates projectile damage and commits one persistent attempt', () => {
    const room = createDefaultBossTrophyRoomProgress();
    const hunt = createBossHuntProgress(room, NOW);
    syncCurrentBossHuntProgress(hunt, room, NOW);
    beginCurrentBossHuntAttempt();
    recordCurrentBossHuntDamage(100);
    recordCurrentBossHuntDamage(240);
    expect(getCurrentBossHuntAttemptDamage()).toBe(340);
    expect(getCurrentBossHuntProgress().attempts).toBe(0);

    const finished = finishCurrentBossHuntAttempt();
    expect(finished?.result.appliedDamage).toBe(340);
    expect(getCurrentBossHuntProgress().attempts).toBe(1);
    expect(getCurrentBossHuntProgress().totalDamage).toBe(340);
    expect(getCurrentBossHuntAttemptDamage()).toBe(0);
  });

  it('clamps an attempt to persistent remaining HP and grants the trophy on defeat', () => {
    const room = createDefaultBossTrophyRoomProgress();
    const hunt = createBossHuntProgress(room, NOW);
    syncCurrentBossHuntProgress(hunt, room, NOW);
    beginCurrentBossHuntAttempt();
    recordCurrentBossHuntDamage(hunt.maxHp * 2);
    expect(getCurrentBossHuntAttemptDamage()).toBe(hunt.maxHp);
    const finished = finishCurrentBossHuntAttempt();
    expect(finished?.result.defeatedNow).toBe(true);
    expect(finished?.trophy?.upgraded).toBe(true);
    expect(getCurrentBossHuntProgress().hpRemaining).toBe(0);
    expect(getCurrentBossTrophyRoomProgress().trophies[hunt.bossId]).toBe('normal');
  });

  it('does not create duplicate attempts after the hunt is already defeated', () => {
    const room = createDefaultBossTrophyRoomProgress();
    const hunt = createBossHuntProgress(room, NOW);
    syncCurrentBossHuntProgress({ ...hunt, hpRemaining: 0, totalDamage: hunt.maxHp, defeated: true }, room, NOW);
    beginCurrentBossHuntAttempt();
    recordCurrentBossHuntDamage(500);
    expect(getCurrentBossHuntAttemptDamage()).toBe(0);
    expect(finishCurrentBossHuntAttempt()).toBeNull();
  });
});
