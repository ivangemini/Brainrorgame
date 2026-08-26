import { afterEach, describe, expect, it } from 'vitest';
import { createDefaultAscensionProgress } from './ascension';
import {
  beginAscensionRunRuntime,
  getAscensionRecruitCredits,
  resetCurrentAscensionProgress,
  syncAscensionRuntimeChapter,
  syncCurrentAscensionProgress
} from './ascensionRuntime';
import {
  addUnit,
  BOARD_SIZE,
  createStarterBoard,
  firstEmptySlot,
  hasMergeablePair,
  isBoardDeadlocked,
  moveOrMerge,
  type BoardState
} from './board';

afterEach(() => resetCurrentAscensionProgress());

function createDeadlockedBoard(): BoardState {
  return [
    { id: 'p1', family: 'pinguino', level: 1, mutation: 'none' },
    { id: 't2', family: 'toastodilo', level: 2, mutation: 'none' },
    { id: 'l3', family: 'lampalotl', level: 3, mutation: 'crowned' },
    { id: 'd1', family: 'dishnail', level: 1, mutation: 'charged' },
    { id: 'm2', family: 'mochimoth', level: 2, mutation: 'none' },
    { id: 'r3', family: 'routeraptor', level: 3, mutation: 'prismatic' },
    { id: 'v1', family: 'vendinguana', level: 1, mutation: 'none' },
    { id: 'u2', family: 'umbrellama', level: 2, mutation: 'charged' },
    { id: 'o3', family: 'mopossum', level: 3, mutation: 'crowned' },
    { id: 'f1', family: 'fanthom', level: 1, mutation: 'prismatic' },
    { id: 's2', family: 'socktopus', level: 2, mutation: 'none' },
    { id: 'w3', family: 'microwhale', level: 3, mutation: 'charged' },
    { id: 'p2', family: 'pinguino', level: 2, mutation: 'charged' },
    { id: 't3', family: 'toastodilo', level: 3, mutation: 'crowned' },
    { id: 'l1', family: 'lampalotl', level: 1, mutation: 'charged' }
  ];
}

describe('board rules', () => {
  it('starts on the fifteen-slot board with two readable merge pairs', () => {
    const board = createStarterBoard();
    expect(board).toHaveLength(BOARD_SIZE);
    expect(board[0]).toMatchObject({ family: 'pinguino', level: 1, mutation: 'none' });
    expect(board[1]).toMatchObject({ family: 'pinguino', level: 1, mutation: 'none' });
    expect(board[5]).toMatchObject({ family: 'toastodilo', level: 1, mutation: 'none' });
    expect(board[6]).toMatchObject({ family: 'toastodilo', level: 1, mutation: 'none' });
  });

  it('merges only matching family and level', () => {
    const board = createStarterBoard();
    const result = moveOrMerge(board, 0, 1);
    expect(result.action).toBe('merge');
    expect(result.board[0]).toBeNull();
    expect(result.board[1]).toMatchObject({ family: 'pinguino', level: 2, mutation: 'none' });
  });

  it('never merges different families even when they share a level', () => {
    const board = [...createStarterBoard()];
    board[0] = { id: 'p', family: 'pinguino', level: 1, mutation: 'none' };
    board[1] = { id: 'd', family: 'dishnail', level: 1, mutation: 'none' };
    const result = moveOrMerge(board, 0, 1);
    expect(result.action).toBe('swap');
    expect(result.board[0]).toMatchObject({ family: 'dishnail' });
    expect(result.board[1]).toMatchObject({ family: 'pinguino' });
  });

  it('still refuses cross-family fusion on a completely deadlocked board', () => {
    const board = createDeadlockedBoard();
    expect(firstEmptySlot(board)).toBe(-1);
    expect(hasMergeablePair(board)).toBe(false);
    expect(isBoardDeadlocked(board)).toBe(true);

    const result = moveOrMerge(board, 0, 3);
    expect(result.action).toBe('swap');
    expect(result.board.filter(Boolean)).toHaveLength(BOARD_SIZE);
    expect(isBoardDeadlocked(result.board)).toBe(true);
  });

  it('promotes two matching rare mutations on a normal merge', () => {
    const board = [...createStarterBoard()];
    board[0] = { id: 'rare-a', family: 'pinguino', level: 1, mutation: 'charged' };
    board[1] = { id: 'rare-b', family: 'pinguino', level: 1, mutation: 'charged' };
    const result = moveOrMerge(board, 0, 1);
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

  it('ascends matching common T3 twins instead of dead-ending the lineage', () => {
    const board: Array<null | { id: string; family: 'pinguino'; level: 3; mutation: 'none' }> = Array.from({ length: BOARD_SIZE }, () => null);
    board[0] = { id: 'a', family: 'pinguino', level: 3, mutation: 'none' };
    board[1] = { id: 'b', family: 'pinguino', level: 3, mutation: 'none' };
    const result = moveOrMerge(board, 0, 1);
    expect(result.action).toBe('merge');
    expect(result.upgraded).toMatchObject({ family: 'pinguino', level: 3, mutation: 'charged' });
    expect(result.ascended).toBe(true);
    expect(result.consolidated).toBe(false);
  });

  it('consolidates same-family max-tier twins even when mutation cannot ascend', () => {
    const board = Array.from({ length: BOARD_SIZE }, () => null) as Array<null | { id: string; family: 'pinguino'; level: 3; mutation: 'crowned' | 'prismatic' }>;
    board[0] = { id: 'legend-a', family: 'pinguino', level: 3, mutation: 'crowned' };
    board[1] = { id: 'legend-b', family: 'pinguino', level: 3, mutation: 'crowned' };
    const capped = moveOrMerge(board, 0, 1);
    expect(capped.action).toBe('merge');
    expect(capped.upgraded).toMatchObject({ family: 'pinguino', level: 3, mutation: 'crowned' });
    expect(capped.ascended).toBe(false);
    expect(capped.consolidated).toBe(true);

    const mixed = Array.from({ length: BOARD_SIZE }, () => null) as typeof board;
    mixed[0] = { id: 'epic', family: 'pinguino', level: 3, mutation: 'prismatic' };
    mixed[1] = { id: 'legend', family: 'pinguino', level: 3, mutation: 'crowned' };
    const mixedResult = moveOrMerge(mixed, 0, 1);
    expect(mixedResult.action).toBe('merge');
    expect(mixedResult.upgraded?.mutation).toBe('crowned');
    expect(mixedResult.consolidated).toBe(true);
  });

  it('guarantees a legal pair on a full board made only of max-tier units', () => {
    const families = [
      'pinguino', 'toastodilo', 'lampalotl', 'dishnail', 'mochimoth', 'routeraptor',
      'vendinguana', 'umbrellama', 'mopossum', 'fanthom', 'socktopus', 'microwhale'
    ] as const;
    const board: BoardState = [
      ...families.map((family, index) => ({ id: `max-${index}`, family, level: 3 as const, mutation: 'crowned' as const })),
      { id: 'extra-p', family: 'pinguino', level: 3, mutation: 'prismatic' },
      { id: 'extra-t', family: 'toastodilo', level: 3, mutation: 'charged' },
      { id: 'extra-l', family: 'lampalotl', level: 3, mutation: 'none' }
    ];
    expect(board).toHaveLength(BOARD_SIZE);
    expect(hasMergeablePair(board)).toBe(true);
    expect(isBoardDeadlocked(board)).toBe(false);
  });

  it('activates the first tier-three Mutation Catalyst once per chapter', () => {
    syncCurrentAscensionProgress({
      ...createDefaultAscensionProgress(),
      purchasedNodes: ['merge-seed-cache', 'merge-echo', 'merge-catalyst']
    });
    beginAscensionRunRuntime();
    syncAscensionRuntimeChapter(4);
    const board = Array.from({ length: BOARD_SIZE }, () => null) as Array<null | { id: string; family: 'pinguino'; level: 2; mutation: 'none' }>;
    board[0] = { id: 'a', family: 'pinguino', level: 2, mutation: 'none' };
    board[1] = { id: 'b', family: 'pinguino', level: 2, mutation: 'none' };
    const first = moveOrMerge(board, 0, 1);
    expect(first.upgraded?.mutation).toBe('charged');
    expect(first.ascensionCatalystApplied).toBe(true);

    const secondBoard = Array.from({ length: BOARD_SIZE }, () => null) as typeof board;
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
    for (let index = 0; index < 8; index += 1) {
      const board = Array.from({ length: BOARD_SIZE }, () => null) as Array<null | { id: string; family: 'pinguino'; level: 1; mutation: 'none' }>;
      board[0] = { id: `a-${index}`, family: 'pinguino', level: 1, mutation: 'none' };
      board[1] = { id: `b-${index}`, family: 'pinguino', level: 1, mutation: 'none' };
      moveOrMerge(board, 0, 1);
    }
    expect(getAscensionRecruitCredits()).toBe(1);
    addUnit(createStarterBoard(), { id: 'recruit-99-pinguino', family: 'pinguino', level: 1, mutation: 'none' });
    expect(getAscensionRecruitCredits()).toBe(0);
  });

  it('adds a recruit into the first empty slot', () => {
    const board = createStarterBoard();
    const empty = firstEmptySlot(board);
    const next = addUnit(board, { id: 'new', family: 'lampalotl', level: 1, mutation: 'charged' });
    expect(next[empty]).toMatchObject({ id: 'new', mutation: 'charged' });
  });
});
