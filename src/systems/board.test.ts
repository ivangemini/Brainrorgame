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
  findMergeablePair,
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

  it('returns a deterministic legal pair for board guidance', () => {
    const board = createStarterBoard();
    expect(findMergeablePair(board)).toEqual([0, 1]);
    expect(findMergeablePair(createDeadlockedBoard())).toBeNull();
  });

  it('merges only matching family and level', () => {
    const board = createStarterBoard();
    const result = moveOrMerge(board, 0, 1);
    expect(result.action).toBe('merge');
    expect(result.board[0]).toBeNull();
    expect(result.board[1]).toMatchObject({ family: 'pinguino', level: 2, mutation: 'none' });
  });

  it('continues the ladder through T3 -> T4 -> T5', () => {
    const t3Board: BoardState = [
      { id: 'a3', family: 'pinguino', level: 3, mutation: 'none' },
      { id: 'b3', family: 'pinguino', level: 3, mutation: 'none' },
      ...Array.from({ length: BOARD_SIZE - 2 }, () => null)
    ];
    const t4 = moveOrMerge(t3Board, 0, 1);
    expect(t4.upgraded).toMatchObject({ family: 'pinguino', level: 4 });
    expect(t4.ascended).toBe(false);

    const t4Board: BoardState = [
      { id: 'a4', family: 'pinguino', level: 4, mutation: 'none' },
      { id: 'b4', family: 'pinguino', level: 4, mutation: 'none' },
      ...Array.from({ length: BOARD_SIZE - 2 }, () => null)
    ];
    const t5 = moveOrMerge(t4Board, 0, 1);
    expect(t5.upgraded).toMatchObject({ family: 'pinguino', level: 5 });
    expect(t5.ascended).toBe(false);
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

  it('ascends matching common T5 twins instead of dead-ending the lineage', () => {
    const board: BoardState = [
      { id: 'a', family: 'pinguino', level: 5, mutation: 'none' },
      { id: 'b', family: 'pinguino', level: 5, mutation: 'none' },
      ...Array.from({ length: BOARD_SIZE - 2 }, () => null)
    ];
    const result = moveOrMerge(board, 0, 1);
    expect(result.action).toBe('merge');
    expect(result.upgraded).toMatchObject({ family: 'pinguino', level: 5, mutation: 'charged' });
    expect(result.ascended).toBe(true);
    expect(result.consolidated).toBe(false);
  });

  it('consolidates same-family capped T5 twins when mutation cannot ascend', () => {
    const cappedBoard: BoardState = [
      { id: 'legend-a', family: 'pinguino', level: 5, mutation: 'crowned' },
      { id: 'legend-b', family: 'pinguino', level: 5, mutation: 'crowned' },
      ...Array.from({ length: BOARD_SIZE - 2 }, () => null)
    ];
    const capped = moveOrMerge(cappedBoard, 0, 1);
    expect(capped.action).toBe('merge');
    expect(capped.upgraded).toMatchObject({ family: 'pinguino', level: 5, mutation: 'crowned' });
    expect(capped.ascended).toBe(false);
    expect(capped.consolidated).toBe(true);

    const mixedBoard: BoardState = [
      { id: 'epic', family: 'pinguino', level: 5, mutation: 'prismatic' },
      { id: 'legend', family: 'pinguino', level: 5, mutation: 'crowned' },
      ...Array.from({ length: BOARD_SIZE - 2 }, () => null)
    ];
    const mixed = moveOrMerge(mixedBoard, 0, 1);
    expect(mixed.upgraded?.mutation).toBe('crowned');
    expect(mixed.consolidated).toBe(true);
  });

  it('guarantees a legal pair on a full board made only of max-tier units', () => {
    const families = [
      'pinguino', 'toastodilo', 'lampalotl', 'dishnail', 'mochimoth', 'routeraptor',
      'vendinguana', 'umbrellama', 'mopossum', 'fanthom', 'socktopus', 'microwhale'
    ] as const;
    const board: BoardState = [
      ...families.map((family, index) => ({ id: `max-${index}`, family, level: 5 as const, mutation: 'crowned' as const })),
      { id: 'extra-p', family: 'pinguino', level: 5, mutation: 'prismatic' },
      { id: 'extra-t', family: 'toastodilo', level: 5, mutation: 'charged' },
      { id: 'extra-l', family: 'lampalotl', level: 5, mutation: 'none' }
    ];
    expect(board).toHaveLength(BOARD_SIZE);
    expect(hasMergeablePair(board)).toBe(true);
    expect(isBoardDeadlocked(board)).toBe(false);
  });

  it('activates the Mutation Catalyst on the first tier-five merge each chapter', () => {
    syncCurrentAscensionProgress({
      ...createDefaultAscensionProgress(),
      purchasedNodes: ['merge-seed-cache', 'merge-echo', 'merge-catalyst']
    });
    beginAscensionRunRuntime();
    syncAscensionRuntimeChapter(4);
    const board: BoardState = [
      { id: 'a', family: 'pinguino', level: 4, mutation: 'none' },
      { id: 'b', family: 'pinguino', level: 4, mutation: 'none' },
      ...Array.from({ length: BOARD_SIZE - 2 }, () => null)
    ];
    const first = moveOrMerge(board, 0, 1);
    expect(first.upgraded).toMatchObject({ level: 5, mutation: 'charged' });
    expect(first.ascensionCatalystApplied).toBe(true);

    const secondBoard: BoardState = [
      { id: 'c', family: 'pinguino', level: 4, mutation: 'none' },
      { id: 'd', family: 'pinguino', level: 4, mutation: 'none' },
      ...Array.from({ length: BOARD_SIZE - 2 }, () => null)
    ];
    const second = moveOrMerge(secondBoard, 0, 1);
    expect(second.upgraded).toMatchObject({ level: 5, mutation: 'none' });
    expect(second.ascensionCatalystApplied).toBe(false);
  });

  it('earns and consumes a free Recruit credit every eighth merge with Merge Echo', () => {
    syncCurrentAscensionProgress({
      ...createDefaultAscensionProgress(),
      purchasedNodes: ['merge-seed-cache', 'merge-echo']
    });
    beginAscensionRunRuntime();
    for (let index = 0; index < 8; index += 1) {
      const board: BoardState = [
        { id: `a-${index}`, family: 'pinguino', level: 1, mutation: 'none' },
        { id: `b-${index}`, family: 'pinguino', level: 1, mutation: 'none' },
        ...Array.from({ length: BOARD_SIZE - 2 }, () => null)
      ];
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
