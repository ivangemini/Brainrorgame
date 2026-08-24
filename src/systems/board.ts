import type { CreatureFamily } from '../content/creatures';

export interface BoardUnit { readonly id: string; readonly family: CreatureFamily; readonly level: 1 | 2 | 3; }
export type BoardSlot = BoardUnit | null;
export type BoardState = readonly BoardSlot[];
export interface BoardActionResult { readonly board: BoardState; readonly action: 'move' | 'merge' | 'swap' | 'noop'; readonly upgraded?: BoardUnit; }

export function createStarterBoard(size = 12): BoardState {
  if (size < 6) throw new Error('Starter board requires at least 6 slots');
  const board: BoardSlot[] = Array.from({ length: size }, () => null);
  board[0] = { id: 'starter-p1a', family: 'pinguino', level: 1 };
  board[1] = { id: 'starter-p1b', family: 'pinguino', level: 1 };
  board[4] = { id: 'starter-t1a', family: 'toastodilo', level: 1 };
  board[5] = { id: 'starter-t1b', family: 'toastodilo', level: 1 };
  return board;
}

export function firstEmptySlot(board: BoardState): number { return board.findIndex((slot) => slot === null); }
export function addUnit(board: BoardState, unit: BoardUnit): BoardState { const index = firstEmptySlot(board); if (index < 0) return board; const next = [...board]; next[index] = unit; return next; }

export function moveOrMerge(board: BoardState, from: number, to: number): BoardActionResult {
  if (from === to || from < 0 || to < 0 || from >= board.length || to >= board.length) return { board, action: 'noop' };
  const source = board[from]; if (!source) return { board, action: 'noop' };
  const target = board[to]; const next = [...board];
  if (!target) { next[to] = source; next[from] = null; return { board: next, action: 'move' }; }
  if (source.family === target.family && source.level === target.level && source.level < 3) {
    const upgraded: BoardUnit = { id: `${source.family}-${source.level + 1}-${source.id}-${target.id}`, family: source.family, level: (source.level + 1) as 2 | 3 };
    next[from] = null; next[to] = upgraded; return { board: next, action: 'merge', upgraded };
  }
  next[from] = target; next[to] = source; return { board: next, action: 'swap' };
}
