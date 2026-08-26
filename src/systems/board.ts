import type { CreatureFamily } from '../content/creatures';
import {
  ascendMutationPair,
  getMutationDefinition,
  mergeMutation,
  type MutationId
} from '../content/mutations';
import { consumeAscensionRecruitCredit, recordAscensionMerge } from './ascensionRuntime';

export const BOARD_COLUMNS = 5 as const;
export const BOARD_ROWS = 3 as const;
export const BOARD_SIZE = BOARD_COLUMNS * BOARD_ROWS;

export interface BoardUnit {
  readonly id: string;
  readonly family: CreatureFamily;
  readonly level: 1 | 2 | 3;
  readonly mutation: MutationId;
}
export type BoardSlot = BoardUnit | null;
export type BoardState = readonly BoardSlot[];
export interface BoardActionResult {
  readonly board: BoardState;
  readonly action: 'move' | 'merge' | 'swap' | 'noop';
  readonly upgraded?: BoardUnit;
  readonly mutationPromoted?: boolean;
  readonly ascended?: boolean;
  readonly consolidated?: boolean;
  readonly ascensionRecruitCreditsEarned?: number;
  readonly ascensionCatalystApplied?: boolean;
}

export function createStarterBoard(size = BOARD_SIZE): BoardState {
  if (size < 7) throw new Error('Starter board requires at least 7 slots');
  const board: BoardSlot[] = Array.from({ length: size }, () => null);
  board[0] = { id: 'starter-p1a', family: 'pinguino', level: 1, mutation: 'none' };
  board[1] = { id: 'starter-p1b', family: 'pinguino', level: 1, mutation: 'none' };
  board[5] = { id: 'starter-t1a', family: 'toastodilo', level: 1, mutation: 'none' };
  board[6] = { id: 'starter-t1b', family: 'toastodilo', level: 1, mutation: 'none' };
  return board;
}

export function firstEmptySlot(board: BoardState): number {
  return board.findIndex((slot) => slot === null);
}

export function canBoardUnitsMerge(a: BoardUnit, b: BoardUnit): boolean {
  return a.family === b.family && a.level === b.level;
}

export function findMergeablePair(board: BoardState): readonly [number, number] | null {
  for (let first = 0; first < board.length; first += 1) {
    const a = board[first];
    if (!a) continue;
    for (let second = first + 1; second < board.length; second += 1) {
      const b = board[second];
      if (b && canBoardUnitsMerge(a, b)) return [first, second] as const;
    }
  }
  return null;
}

export function hasMergeablePair(board: BoardState): boolean {
  return findMergeablePair(board) !== null;
}

export function isBoardDeadlocked(board: BoardState): boolean {
  return firstEmptySlot(board) < 0 && !hasMergeablePair(board);
}

export function addUnit(board: BoardState, unit: BoardUnit): BoardState {
  const index = firstEmptySlot(board);
  if (index < 0) return board;
  const next = [...board];
  next[index] = unit;
  if (unit.id.startsWith('recruit-')) consumeAscensionRecruitCredit();
  return next;
}

export function moveOrMerge(board: BoardState, from: number, to: number): BoardActionResult {
  if (from === to || from < 0 || to < 0 || from >= board.length || to >= board.length) {
    return { board, action: 'noop' };
  }
  const source = board[from];
  if (!source) return { board, action: 'noop' };
  const target = board[to];
  const next = [...board];

  if (!target) {
    next[to] = source;
    next[from] = null;
    return { board: next, action: 'move' };
  }

  if (source.family === target.family && source.level === target.level && source.level < 3) {
    const baseMutation = mergeMutation(source.mutation, target.mutation);
    const resultingLevel = (source.level + 1) as 2 | 3;
    const ascension = recordAscensionMerge(resultingLevel, baseMutation, resultingLevel === 3);
    const previousRank = Math.max(
      getMutationDefinition(source.mutation).rank,
      getMutationDefinition(target.mutation).rank
    );
    const upgraded: BoardUnit = {
      id: `${source.family}-${source.level + 1}-${source.id}-${target.id}`,
      family: source.family,
      level: resultingLevel,
      mutation: ascension.mutation
    };
    next[from] = null;
    next[to] = upgraded;
    return {
      board: next,
      action: 'merge',
      upgraded,
      mutationPromoted: getMutationDefinition(ascension.mutation).rank > previousRank,
      ascended: false,
      consolidated: false,
      ascensionRecruitCreditsEarned: ascension.recruitCreditsEarned,
      ascensionCatalystApplied: ascension.catalystApplied
    };
  }

  if (source.family === target.family && source.level === 3 && target.level === 3) {
    const ascendedMutation = ascendMutationPair(source.mutation, target.mutation);
    const baseMutation = ascendedMutation ?? mergeMutation(source.mutation, target.mutation);
    const previousRank = Math.max(
      getMutationDefinition(source.mutation).rank,
      getMutationDefinition(target.mutation).rank
    );
    const ascension = recordAscensionMerge(3, baseMutation, false);
    const upgraded: BoardUnit = {
      id: `${ascendedMutation ? 'ascended' : 'consolidated'}-${source.family}-${ascension.mutation}-${source.id}-${target.id}`,
      family: source.family,
      level: 3,
      mutation: ascension.mutation
    };
    next[from] = null;
    next[to] = upgraded;
    return {
      board: next,
      action: 'merge',
      upgraded,
      mutationPromoted: getMutationDefinition(ascension.mutation).rank > previousRank,
      ascended: ascendedMutation !== null,
      consolidated: ascendedMutation === null,
      ascensionRecruitCreditsEarned: ascension.recruitCreditsEarned,
      ascensionCatalystApplied: false
    };
  }

  // Different families never merge. Deadlock prevention belongs in recruit
  // planning and same-family max-tier consolidation, not cross-family fusion.
  next[from] = target;
  next[to] = source;
  return { board: next, action: 'swap' };
}
