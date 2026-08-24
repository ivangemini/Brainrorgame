import { describe, expect, it } from 'vitest';
import { createStarterBoard } from '../systems/board';
import { createDefaultDailyState } from '../systems/dailyRetention';
import { createDefaultMetaUpgradeLevels } from '../systems/metaProgression';
import { createGameSave, parseGameSave } from './save';

function makeSnapshot() {
  return {
    coins: 140,
    coreShards: 3,
    upgrades: { power: 2, armor: 1, bounty: 0 },
    daily: createDefaultDailyState(Date.parse('2026-08-25T12:00:00.000Z')),
    baseHp: 77,
    chapter: 3,
    encounterStep: 2 as const,
    targetHpMax: 800,
    targetHp: 520,
    recruitSerial: 4,
    board: createStarterBoard()
  };
}

describe('game save', () => {
  it('round-trips a valid v4 snapshot', () => {
    const save = createGameSave(makeSnapshot(), 12345);
    expect(parseGameSave(save)).toEqual(save);
  });

  it('migrates v2 saves through v3 to v4 and preserves progression', () => {
    const oldSave = {
      version: 2,
      updatedAt: Date.parse('2026-08-24T12:00:00.000Z'),
      coins: 90,
      baseHp: 88,
      chapter: 4,
      encounterStep: 1,
      targetHpMax: 500,
      targetHp: 300,
      recruitSerial: 2,
      board: createStarterBoard()
    };
    const migrated = parseGameSave(oldSave);
    expect(migrated?.version).toBe(4);
    expect(migrated?.coreShards).toBe(3);
    expect(migrated?.upgrades).toEqual(createDefaultMetaUpgradeLevels());
    expect(migrated?.daily.streak).toBe(0);
    expect(migrated?.daily.lastRewardClaimDayKey).toBeNull();
  });

  it('migrates v3 saves with a fresh daily state', () => {
    const oldSave = {
      version: 3,
      updatedAt: Date.parse('2026-08-25T08:00:00.000Z'),
      coins: 220,
      coreShards: 4,
      upgrades: { power: 1, armor: 2, bounty: 3 },
      baseHp: 91,
      chapter: 6,
      encounterStep: 3,
      targetHpMax: 950,
      targetHp: 700,
      recruitSerial: 8,
      board: createStarterBoard()
    };
    const migrated = parseGameSave(oldSave);
    expect(migrated?.version).toBe(4);
    expect(migrated?.daily.dayKey).toBe('2026-08-25');
    expect(migrated?.daily.counters).toEqual({ merge: 0, defeat: 0, recruit: 0 });
  });

  it('clamps upgrade levels and target HP to supported maximums', () => {
    const save = createGameSave(makeSnapshot(), 12345);
    const parsed = parseGameSave({
      ...save,
      targetHp: 9999,
      upgrades: { power: 999, armor: 999, bounty: 999 }
    });
    expect(parsed?.targetHp).toBe(800);
    expect(parsed?.upgrades).toEqual({ power: 10, armor: 8, bounty: 10 });
  });

  it('rejects malformed daily state', () => {
    const save = createGameSave(makeSnapshot());
    expect(parseGameSave({ ...save, daily: { ...save.daily, dayKey: 'not-a-day' } })).toBeNull();
  });

  it('rejects malformed upgrade data', () => {
    const save = createGameSave(makeSnapshot());
    expect(parseGameSave({ ...save, upgrades: { power: 'max', armor: 0, bounty: 0 } })).toBeNull();
  });

  it('rejects malformed board data', () => {
    const save = createGameSave(makeSnapshot());
    const broken = { ...save, board: [{ id: 'x', family: 'copycat', level: 1 }] };
    expect(parseGameSave(broken)).toBeNull();
  });
});
