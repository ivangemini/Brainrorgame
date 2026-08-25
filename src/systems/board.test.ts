import { describe, expect, it } from 'vitest';
import { addUnit, createStarterBoard, firstEmptySlot, moveOrMerge } from './board';

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

  it('will not merge max-tier units', () => {
    const board: Array<null | { id: string; family: 'pinguino'; level: 3; mutation: 'none' }> = Array.from({ length: 4 }, () => null);
    board[0] = { id: 'a', family: 'pinguino', level: 3, mutation: 'none' };
    board[1] = { id: 'b', family: 'pinguino', level: 3, mutation: 'none' };
    expect(moveOrMerge(board, 0, 1).action).toBe('swap');
  });

  it('adds a recruit into the first empty slot', () => {
    const board = createStarterBoard();
    const empty = firstEmptySlot(board);
    const next = addUnit(board, { id: 'new', family: 'lampalotl', level: 1, mutation: 'charged' });
    expect(next[empty]).toMatchObject({ id: 'new', mutation: 'charged' });
  });
});
