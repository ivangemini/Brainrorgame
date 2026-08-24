import { describe, expect, it } from 'vitest';
import { createStarterBoard } from '../systems/board';
import { createDefaultMetaUpgradeLevels } from '../systems/metaProgression';
import { createGameSave, parseGameSave } from './save';

function makeSnapshot() {
  return {
    coins: 140,
    coreShards: 3,
    upgrades: { power: 2, armor: 1, bounty: 0 },
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
  it('round-trips a valid v3 snapshot', () => {
    const save = createGameSave(makeSnapshot(), 12345);
    expect(parseGameSave(save)).toEqual(save);
  });

  it('migrates v2 saves and backfills one unspent shard per completed chapter', () => {
    const oldSave = {
      version: 2,
      updatedAt: 123,
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
    expect(migrated?.version).toBe(3);
    expect(migrated?.coreShards).toBe(3);
    expect(migrated?.upgrades).toEqual(createDefaultMetaUpgradeLevels());
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
