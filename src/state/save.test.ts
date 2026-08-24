import { describe, expect, it } from 'vitest';
import { createStarterBoard } from '../systems/board';
import { createGameSave, parseGameSave } from './save';

describe('game save', () => {
  it('round-trips a valid snapshot', () => {
    const save = createGameSave({
      coins: 140,
      baseHp: 77,
      bossRound: 3,
      bossHpMax: 800,
      bossHp: 520,
      recruitSerial: 4,
      board: createStarterBoard()
    }, 12345);

    expect(parseGameSave(save)).toEqual(save);
  });

  it('clamps boss HP to the saved maximum', () => {
    const save = createGameSave({
      coins: 10,
      baseHp: 100,
      bossRound: 2,
      bossHpMax: 600,
      bossHp: 9999,
      recruitSerial: 0,
      board: createStarterBoard()
    }, 12345);

    expect(parseGameSave(save)?.bossHp).toBe(600);
  });

  it('rejects unsupported versions', () => {
    expect(parseGameSave({ version: 999 })).toBeNull();
  });

  it('rejects malformed board data', () => {
    const save = createGameSave({
      coins: 1,
      baseHp: 100,
      bossRound: 1,
      bossHpMax: 520,
      bossHp: 520,
      recruitSerial: 0,
      board: createStarterBoard()
    });
    const broken = { ...save, board: [{ id: 'x', family: 'copycat', level: 1 }] };
    expect(parseGameSave(broken)).toBeNull();
  });
});
