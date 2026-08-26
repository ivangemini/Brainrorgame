import { afterEach, describe, expect, it } from 'vitest';
import { createDefaultAscensionProgress } from './ascension';
import {
  beginAscensionRunRuntime,
  getAscensionRecruitCredits,
  resetCurrentAscensionProgress,
  syncAscensionRuntimeChapter,
  syncCurrentAscensionProgress
} from './ascensionRuntime';
import { addUnit, createStarterBoard, firstEmptySlot, moveOrMerge } from './board';

afterEach(() => resetCurrentAscensionProgress());

describe('board rules', () => {
  it('starts with two immediately mergeable common pairs', () => {
    const board = createStarterBoard();
    expect(board[0]).toMatchObject({ family: 'pinguino', mutation: 'none' });
    expect(board[1]).toMatchObject({ family: 'pinguino', mutation: 'none' });
    expect(board[4]).toMatchObject({ family: 'toastodilo', mutation: 'none' });
    expect(board[5]).toMatchObject({ family: 'toastodilo', mutation: 'none' });
  });

  it('merges matching family and level', () => {
    const board = createStarterBoard();
    const result = moveOrMerge(board, 0, 1);
    expect(result.action).toBe('merge');
    expect(result.board[0]).toBeNull();
    expect(result.board[1]).toMatchObject({ level: 2, mutation: 'none' });
    expect(result.ascended).toBe(false);
  });

  it('promotes two matching rare mutations on merge', () => {
    const board = [...createStarterBoard()];
    board[0] = { id: 'rare-a', family: 'pinguino', level: 1, mutation: 'charged' };
    board[1] = { id: 'rare-b', family: 'pinguino', level: 1, mutation: 'charged' };
    const result = moveOrMerge(board, 0, 1);
    expect(result.action).toBe('merge');
    expect(result.upgraded?.mutation).toBe('prismatic');
    expect(result.mutationPromoted).toBe(true);
  });

  it('keeps the stronger mutation when rarities differ', () => {
    const board = [...createStarterBoard()];
    board[0] = { id: 'common', family: 'pinguino', level: 1, mutation: 'none' };
    board[1] = { id: 'epic', family: 'pinguino', level: 1, mutation: 'prismatic' };
    const result = moveOrMerge(board, 0, 1);
    expect(result.upgraded?.mutation).toBe('prismatic');
    expect(result.mutationPromoted).toBe(false);
  });

  it('activates the first tier-three Mutation Catalyst once per chapter', () => {
    syncCurrentAscensionProgress({
      ...createDefaultAscensionProgress(),
      purchasedNodes: ['merge-seed-cache', 'merge-echo', 'merge-catalyst']
    });
    beginAscensionRunRuntime();
    syncAscensionRuntimeChapter(4);
    const board = Array.from({ length: 4 }, () => null) as Array<null | { id: string; family: 'pinguino'; level: 2; mutation: 'none' }>;
    board[0] = { id: 'a', family: 'pinguino', level: 2, mutation: 'none' };
    board[1] = { id: 'b', family: 'pinguino', level: 2, mutation: 'none' };
    const first = moveOrMerge(board, 0, 1);
    expect(first.upgraded?.mutation).toBe('charged');
    expect(first.ascensionCatalystApplied).toBe(true);

    const secondBoard = Array.from({ length: 4 }, () => null) as typeof board;
    secondBoard[0] = { id: 'c', family: 'pinguino', level: 2, mutation: 'none' };
    secondBoard[1] = { id: 'd', family: 'pinguino', level: 2, mutation: 'none' };
    const second = moveOrMerge(secondBoard, 0, 1);
    expect(second.upgraded?.mutation).toBe('none');
    expect(second.ascensionCatalystApplied).toBe(false);
  });

  it('earns and consumes a free Recruit credit every eighth merge with Merge Echo', () => {
    syncCurrentAscensionProgress({
      ...createDefaultAscensionProgress(),
      purchasedNodes: ['merge-seed-cache', 'merge-echo']
    });
    beginAscensionRunRuntime();
    expect(getAscensionRecruitCredits()).toBe(0);
    for (let index = 0; index < 8; index += 1) {
      const board = Array.from({ length: 4 }, () => null) as Array<null | { id: string; family: 'pinguino'; level: 1; mutation: 'none' }>;
      board[0] = { id: `a-${index}`, family: 'pinguino', level: 1, mutation: 'none' };
      board[1] = { id: `b-${index}`, family: 'pinguino', level: 1, mutation: 'none' };
      moveOrMerge(board, 0, 1);
    }
    expect(getAscensionRecruitCredits()).toBe(1);
    addUnit(createStarterBoard(), { id: 'recruit-99-pinguino', family: 'pinguino', level: 1, mutation: 'none' });
    expect(getAscensionRecruitCredits()).toBe(0);
  });

  it('ascends matching common T3 twins into a rare T3 instead of dead-ending', () => {
    const board: Array<null | { id: string; family: 'pinguino'; level: 3; mutation: 'none' }> = Array.from({ length: 4 }, () => null);
    board[0] = { id: 'a', family: 'pinguino', level: 3, mutation: 'none' };
    board[1] = { id: 'b', family: 'pinguino', level: 3, mutation: 'none' };
    const result = moveOrMerge(board, 0, 1);
    expect(result.action).toBe('merge');
    expect(result.board[0]).toBeNull();
    expect(result.upgraded).toMatchObject({ family: 'pinguino', level: 3, mutation: 'charged' });
    expect(result.mutationPromoted).toBe(true);
    expect(result.ascended).toBe(true);
  });

  it('continues T3 ascension through epic and legendary rarity', () => {
    type DishnailT3 = { id: string; family: 'dishnail'; level: 3; mutation: 'charged' | 'prismatic' };
    const charged: Array<null | DishnailT3> = Array.from({ length: 4 }, () => null);
    charged[0] = { id: 'a', family: 'dishnail', level: 3, mutation: 'charged' };
    charged[1] = { id: 'b', family: 'dishnail', level: 3, mutation: 'charged' };
    const epic = moveOrMerge(charged, 0, 1);
    expect(epic.upgraded?.mutation).toBe('prismatic');

    const prismatic = [...epic.board];
    prismatic[0] = { id: 'c', family: 'dishnail', level: 3, mutation: 'prismatic' };
    const legendary = moveOrMerge(prismatic, 0, 1);
    expect(legendary.upgraded?.mutation).toBe('crowned');
  });

  it('does not consume incompatible or already legendary T3 pairs', () => {
    type PinguinoT3 = { id: string; family: 'pinguino'; level: 3; mutation: 'crowned' | 'prismatic' };
    const board: Array<null | PinguinoT3> = Array.from({ length: 4 }, () => null);
    board[0] = { id: 'legend-a', family: 'pinguino', level: 3, mutation: 'crowned' };
    board[1] = { id: 'legend-b', family: 'pinguino', level: 3, mutation: 'crowned' };
    expect(moveOrMerge(board, 0, 1).action).toBe('swap');

    board[0] = { id: 'epic', family: 'pinguino', level: 3, mutation: 'prismatic' };
    board[1] = { id: 'legend', family: 'pinguino', level: 3, mutation: 'crowned' };
    expect(moveOrMerge(board, 0, 1).action).toBe('swap');
  });

  it('adds a recruit into the first empty slot', () => {
    const board = createStarterBoard();
    const empty = firstEmptySlot(board);
    const next = addUnit(board, { id: 'new', family: 'lampalotl', level: 1, mutation: 'charged' });
    expect(next[empty]).toMatchObject({ id: 'new', mutation: 'charged' });
  });
});
