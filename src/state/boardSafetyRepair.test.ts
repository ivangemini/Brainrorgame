import { describe, expect, it } from 'vitest';
import { hasMergeablePair, isBoardDeadlocked, type BoardState } from '../systems/board';
import { createFreshGameSave } from './freshSave';
import { repairDeadlockedGameSave } from './boardSafetyRepair';

function deadlockedBoard(): BoardState {
  return [
    { id: 'p1', family: 'pinguino', level: 1, mutation: 'none' },
    { id: 't2', family: 'toastodilo', level: 2, mutation: 'charged' },
    { id: 'l3', family: 'lampalotl', level: 3, mutation: 'prismatic' },
    { id: 'd1', family: 'dishnail', level: 1, mutation: 'none' },
    { id: 'm2', family: 'mochimoth', level: 2, mutation: 'charged' },
    { id: 'r3', family: 'routeraptor', level: 3, mutation: 'crowned' },
    { id: 'v1', family: 'vendinguana', level: 1, mutation: 'none' },
    { id: 'u2', family: 'umbrellama', level: 2, mutation: 'charged' },
    { id: 'o3', family: 'mopossum', level: 3, mutation: 'prismatic' },
    { id: 'f1', family: 'fanthom', level: 1, mutation: 'none' },
    { id: 's2', family: 'socktopus', level: 2, mutation: 'charged' },
    { id: 'w3', family: 'microwhale', level: 3, mutation: 'crowned' },
    { id: 'p2', family: 'pinguino', level: 2, mutation: 'prismatic' },
    { id: 't3', family: 'toastodilo', level: 3, mutation: 'crowned' },
    { id: 'l1', family: 'lampalotl', level: 1, mutation: 'none' }
  ];
}

describe('legacy board safety repair', () => {
  it('creates a normal same-family merge pair without cross-family fusion', () => {
    const base = createFreshGameSave(1000);
    const board = deadlockedBoard();
    expect(isBoardDeadlocked(board)).toBe(true);

    const result = repairDeadlockedGameSave({ ...base, board }, 2000);
    expect(result.repaired).toBe(true);
    expect(result.promotedSlot).toBe(0);
    expect(result.partnerSlot).toBe(12);
    expect(result.save).not.toBeNull();
    expect(result.save?.board[0]).toMatchObject({ family: 'pinguino', level: 2, mutation: 'none' });
    expect(result.save?.board[12]).toMatchObject({ family: 'pinguino', level: 2, mutation: 'prismatic' });
    expect(hasMergeablePair(result.save!.board)).toBe(true);
    expect(isBoardDeadlocked(result.save!.board)).toBe(false);
    expect(result.save?.collection.discovered).toContain('pinguino-2');
    expect(result.save?.mutationAlbum.discovered).toContain('pinguino-2:none');
    expect(result.save?.updatedAt).toBe(2000);
  });

  it('can promote a T4 to T5 while normalizing collection evidence to authored T3 art', () => {
    const base = createFreshGameSave(1000);
    const board = [...deadlockedBoard()];
    board[0] = { id: 'p4', family: 'pinguino', level: 4, mutation: 'none' };
    board[12] = { id: 'p5', family: 'pinguino', level: 5, mutation: 'prismatic' };
    expect(isBoardDeadlocked(board)).toBe(true);

    const result = repairDeadlockedGameSave({ ...base, board }, 2000);
    expect(result.repaired).toBe(true);
    expect(result.save?.board[0]).toMatchObject({ family: 'pinguino', level: 5 });
    expect(result.save?.collection.discovered).toContain('pinguino-3');
    expect(result.save?.mutationAlbum.discovered).toContain('pinguino-3:none');
    expect(hasMergeablePair(result.save!.board)).toBe(true);
  });

  it('does not modify a save that already has a legal continuation', () => {
    const save = createFreshGameSave(1000);
    const result = repairDeadlockedGameSave(save, 2000);
    expect(result).toEqual({ save, repaired: false, promotedSlot: null, partnerSlot: null });
  });

  it('passes through a missing save', () => {
    expect(repairDeadlockedGameSave(null)).toEqual({
      save: null,
      repaired: false,
      promotedSlot: null,
      partnerSlot: null
    });
  });
});
