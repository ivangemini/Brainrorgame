import { describe, expect, it } from 'vitest';
import { addUnit, createStarterBoard, firstEmptySlot, moveOrMerge } from './board';

describe('board rules', () => {
  it('starts with two immediately mergeable pairs', () => { const board = createStarterBoard(); expect(board[0]?.family).toBe('pinguino'); expect(board[1]?.family).toBe('pinguino'); expect(board[4]?.family).toBe('toastodilo'); expect(board[5]?.family).toBe('toastodilo'); });
  it('merges matching family and level', () => { const board = createStarterBoard(); const result = moveOrMerge(board, 0, 1); expect(result.action).toBe('merge'); expect(result.board[0]).toBeNull(); expect(result.board[1]?.level).toBe(2); });
  it('will not merge max-tier units', () => { const board = Array.from({ length: 4 }, () => null) as Array<null | { id: string; family: 'pinguino'; level: 3 }>; board[0] = { id: 'a', family: 'pinguino', level: 3 }; board[1] = { id: 'b', family: 'pinguino', level: 3 }; expect(moveOrMerge(board, 0, 1).action).toBe('swap'); });
  it('adds a recruit into the first empty slot', () => { const board = createStarterBoard(); const empty = firstEmptySlot(board); const next = addUnit(board, { id: 'new', family: 'pinguino', level: 1 }); expect(next[empty]?.id).toBe('new'); });
});
