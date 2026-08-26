import { describe, expect, it } from 'vitest';
import { BOARD_SIZE, hasMergeablePair } from '../systems/board';
import { parseGameSave } from './save';
import { createFreshGameSave } from './freshSave';

describe('fresh save', () => {
  it('creates a valid clean run with the expanded board and starter merge pairs', () => {
    const now = Date.parse('2026-08-26T20:00:00.000Z');
    const save = createFreshGameSave(now);

    expect(parseGameSave(save)).toEqual(save);
    expect(save.updatedAt).toBe(now);
    expect(save.coins).toBe(120);
    expect(save.coreShards).toBe(0);
    expect(save.chapter).toBe(1);
    expect(save.encounterStep).toBe(0);
    expect(save.recruitSerial).toBe(0);
    expect(save.board).toHaveLength(BOARD_SIZE);
    expect(save.board.filter(Boolean)).toHaveLength(4);
    expect(hasMergeablePair(save.board)).toBe(true);
    expect(save.collection.stats).toEqual({ merges: 0, recruits: 0, defeats: 0, bosses: 0, upgrades: 0 });
    expect(save.chaosPerks).toEqual([]);
    expect(save.ascension.purchasedNodes).toEqual([]);
    expect(save.bossTrophies.trophies).toEqual({});
  });
});
