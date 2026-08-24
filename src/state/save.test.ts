import { describe, expect, it } from 'vitest';
import { createStarterBoard } from '../systems/board';
import { createGameSave, parseGameSave } from './save';

describe('game save', () => {
  it('round-trips a valid v2 snapshot', () => {
    const save = createGameSave({
      coins: 140,
      baseHp: 77,
      chapter: 3,
      encounterStep: 1,
      targetHpMax: 260,
      targetHp: 180,
      recruitSerial: 4,
      board: createStarterBoard()
    }, 12345);

    expect(parseGameSave(save)).toEqual(save);
  });

  it('clamps target HP to the saved maximum', () => {
    const save = createGameSave({
      coins: 10,
      baseHp: 100,
      chapter: 2,
      encounterStep: 2,
      targetHpMax: 600,
      targetHp: 9999,
      recruitSerial: 0,
      board: createStarterBoard()
    }, 12345);

    expect(parseGameSave(save)?.targetHp).toBe(600);
  });

  it('migrates v1 boss progress into the boss step of the same chapter', () => {
    const legacy = {
      version: 1,
      updatedAt: 12345,
      coins: 90,
      baseHp: 64,
      bossRound: 4,
      bossHpMax: 900,
      bossHp: 321,
      recruitSerial: 7,
      board: createStarterBoard()
    };

    expect(parseGameSave(legacy)).toEqual({
      version: 2,
      updatedAt: 12345,
      coins: 90,
      baseHp: 64,
      chapter: 4,
      encounterStep: 3,
      targetHpMax: 900,
      targetHp: 321,
      recruitSerial: 7,
      board: createStarterBoard()
    });
  });

  it('rejects unsupported versions', () => {
    expect(parseGameSave({ version: 999 })).toBeNull();
  });

  it('rejects malformed board data', () => {
    const save = createGameSave({
      coins: 1,
      baseHp: 100,
      chapter: 1,
      encounterStep: 0,
      targetHpMax: 145,
      targetHp: 145,
      recruitSerial: 0,
      board: createStarterBoard()
    });
    const broken = { ...save, board: [{ id: 'x', family: 'copycat', level: 1 }] };
    expect(parseGameSave(broken)).toBeNull();
  });
});
