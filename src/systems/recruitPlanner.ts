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

function familyLevelCount(board: BoardState, family: CreatureFamily, level: CreatureLevel): number {
  return board.reduce(
    (count, unit) => count + (unit?.family === family && unit.level === level ? 1 : 0),
    0
  );
}

/**
 * Recruit remains random, but the bag strongly favors pulls that advance an
 * existing merge chain and de-emphasizes families that only have max-tier
 * units left. A maxed family is never hard-banned because a second T3 can
 * still feed mutation ascension/consolidation.
 */
export function recruitFamilyWeight(board: BoardState, family: CreatureFamily): number {
  const tierOne = familyLevelCount(board, family, 1);
  const tierTwo = familyLevelCount(board, family, 2);
  const tierThree = familyLevelCount(board, family, 3);
  const occupied = board.length - emptySlots(board);
  const crowded = occupied >= Math.max(1, board.length - 4);

  let weight = crowded ? 2 : 3;

  // The strongest signal: one T1 means the next recruit creates an immediate pair.
  if (tierOne % 2 === 1) weight += 9;
  else if (tierOne > 0) weight += 4;

  // Keep promising lineages moving toward a T2/T3 pair instead of scattering
  // the last few cells across new families.
  if (tierTwo % 2 === 1) weight += tierOne > 0 ? 4 : 2;
  else if (tierTwo > 0) weight += 1;

  // Once a family is represented only by T3s, lower its normal recruit odds.
  // It stays in the pool because duplicate T3s are still strategically useful.
  if (tierThree > 0 && tierOne === 0 && tierTwo === 0) {
    weight = Math.max(1, weight - Math.min(2, tierThree));
  }

  // On a crowded board avoid opening a brand-new lineage unless RNG reaches
  // its deliberately small slice of the bag.
  if (crowded && tierOne === 0 && tierTwo === 0 && tierThree === 0) {
    weight = 1;
  }

  return Math.max(1, Math.min(18, weight));
}

function smartRecruitPool(board: BoardState, availableFamilies: readonly CreatureFamily[]): CreatureFamily[] {
  const weighted: CreatureFamily[] = [];
  for (const family of availableFamilies) {
    const copies = recruitFamilyWeight(board, family);
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
  const remainingSlots = emptySlots(board);
  if (remainingSlots === 0) return null;

  if (remainingSlots === 1 && !hasMergeablePair(board)) {
    // A normal random pull could seal the board permanently, so the final slot
    // becomes a deterministic safety valve: duplicate an existing non-capped
    // lineage at the same level. This does not unlock a new family and remains
    // valid even if the normal recruit-unlock cursor is temporarily stale.
    const candidates = rescueCandidates(board);
    if (candidates.length === 0) return null;
    const lowestLevel = Math.min(...candidates.map((unit) => unit.level));
    const preferred = candidates.filter((unit) => unit.level === lowestLevel);
    const selected = pick(preferred, roll);
    return selected
      ? { family: selected.family, level: selected.level, protectedPair: true }
      : null;
  }

  if (availableFamilies.length === 0) return null;
  const family = pick(smartRecruitPool(board, availableFamilies), roll);
  return family ? { family, level: 1, protectedPair: false } : null;
}
