import type { CreatureFamily, CreatureLevel } from '../content/creatures';
import { hasMergeablePair, type BoardState, type BoardUnit } from './board';

export interface RecruitPlan {
  readonly family: CreatureFamily;
  readonly level: CreatureLevel;
  readonly protectedPair: boolean;
}

function normalizedRoll(roll: number): number {
  if (!Number.isFinite(roll)) return 0;
  return Math.min(0.999999, Math.max(0, roll));
}

function pick<T>(values: readonly T[], roll: number): T | null {
  if (values.length === 0) return null;
  return values[Math.floor(normalizedRoll(roll) * values.length)] ?? null;
}

function emptySlots(board: BoardState): number {
  return board.reduce((count, slot) => count + (slot === null ? 1 : 0), 0);
}

function weightedStarterPool(board: BoardState, availableFamilies: readonly CreatureFamily[]): CreatureFamily[] {
  const weighted: CreatureFamily[] = [];
  for (const family of availableFamilies) {
    const matchingTierOne = board.reduce(
      (count, unit) => count + (unit?.family === family && unit.level === 1 ? 1 : 0),
      0
    );
    const copies = 1 + Math.min(3, matchingTierOne * 2);
    for (let index = 0; index < copies; index += 1) weighted.push(family);
  }
  return weighted;
}

function rescueCandidates(board: BoardState): BoardUnit[] {
  return board.filter((unit): unit is BoardUnit => Boolean(unit && unit.level < 3));
}

export function planRecruit(
  board: BoardState,
  availableFamilies: readonly CreatureFamily[],
  roll = 0
): RecruitPlan | null {
  if (availableFamilies.length === 0 || emptySlots(board) === 0) return null;

  const remainingSlots = emptySlots(board);
  if (remainingSlots > 1 || hasMergeablePair(board)) {
    const family = pick(weightedStarterPool(board, availableFamilies), roll);
    return family ? { family, level: 1, protectedPair: false } : null;
  }

  // One slot remains and the board currently has no legal merge. A normal
  // random T1 pull could seal the board permanently, so the recruiter instead
  // creates a same-family/same-level twin of an existing non-capped unit.
  // Existing board families are valid rescue targets even if an unlock cursor
  // is temporarily stale: the rescue does not introduce a new family, it only
  // guarantees a legal continuation of a lineage the player already owns.
  const candidates = rescueCandidates(board);
  if (candidates.length === 0) return null;
  const lowestLevel = Math.min(...candidates.map((unit) => unit.level));
  const preferred = candidates.filter((unit) => unit.level === lowestLevel);
  const selected = pick(preferred, roll);
  return selected
    ? { family: selected.family, level: selected.level, protectedPair: true }
    : null;
}
