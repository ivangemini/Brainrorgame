import type { CreatureFamily } from '../content/creatures';
import {
  ascendMutationPair,
  getMutationDefinition,
  mergeMutation,
  type MutationId
} from '../content/mutations';
import { recordAscensionMerge } from './ascensionRuntime';

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
  readonly ascensionRecruitCreditsEarned?: number;
  readonly ascensionCatalystApplied?: boolean;
}

export function createStarterBoard(size = 12): BoardState {
  if (size < 6) throw new Error('Starter board requires at least 6 slots');
  const board: BoardSlot[] = Array.from({ length: size }, () => null);
  board[0] = { id: 'starter-p1a', family: 'pinguino', level: 1, mutation: 'none' };
  board[1] = { id: 'starter-p1b', family: 'pinguino', level: 1, mutation: 'none' };
  board[4] = { id: 'starter-t1a', family: 'toastodilo', level: 1, mutation: 'none' };
  board[5] = { id: 'starter-t1b', family: 'toastodilo', level: 1, mutation: 'none' };
  return board;
}

export function firstEmptySlot(board: BoardState): number {
  return board.findIndex((slot) => slot === null);
}

export function addUnit(board: BoardState, unit: BoardUnit): BoardState {
  const index = firstEmptySlot(board);
  if (index < 0) return board;
  const next = [...board];
  next[index] = unit;
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
      ascensionRecruitCreditsEarned: ascension.recruitCreditsEarned,
      ascensionCatalystApplied: ascension.catalystApplied
    };
  }

  if (source.family === target.family && source.level === 3 && target.level === 3) {
    const mutation = ascendMutationPair(source.mutation, target.mutation);
    if (mutation) {
      const ascension = recordAscensionMerge(3, mutation, false);
      const upgraded: BoardUnit = {
        id: `ascended-${source.family}-${mutation}-${source.id}-${target.id}`,
        family: source.family,
        level: 3,
        mutation
      };
      next[from] = null;
      next[to] = upgraded;
      return {
        board: next,
        action: 'merge',
        upgraded,
        mutationPromoted: true,
        ascended: true,
        ascensionRecruitCreditsEarned: ascension.recruitCreditsEarned,
        ascensionCatalystApplied: false
      };
    }
  }

  next[from] = target;
  next[to] = source;
  return { board: next, action: 'swap' };
}
