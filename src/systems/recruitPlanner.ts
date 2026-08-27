import type { CreatureFamily } from '../content/creatures';
import { hasMergeablePair, type BoardState, type BoardUnit } from './board';
import { MAX_MERGE_TIER, MERGE_TIERS, type MergeTier } from './mergeTiers';

export interface RecruitPlan {
  readonly family: CreatureFamily;
  readonly level: MergeTier;
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

function familyLevelCount(board: BoardState, family: CreatureFamily, level: MergeTier): number {
  return board.reduce(
    (count, unit) => count + (unit?.family === family && unit.level === level ? 1 : 0),
    0
  );
}

function projectedCascadeMerges(board: BoardState, family: CreatureFamily): number {
  const counts = new Map<MergeTier, number>();
  for (const tier of MERGE_TIERS) counts.set(tier, familyLevelCount(board, family, tier));
  counts.set(1, (counts.get(1) ?? 0) + 1);

  let merges = 0;
  for (const tier of MERGE_TIERS) {
    if (tier === MAX_MERGE_TIER) break;
    const count = counts.get(tier) ?? 0;
    const pairs = Math.floor(count / 2);
    if (pairs <= 0) continue;
    merges += pairs;
    const next = (tier + 1) as MergeTier;
    counts.set(next, (counts.get(next) ?? 0) + pairs);
  }
  return merges;
}

/**
 * Recruit remains random, but its bag favors a lineage where one new T1 can
 * unlock a merge cascade. This becomes more important with the five-tier
 * ladder: a useful pull can carry into T2/T3/T4 instead of scattering the last
 * board cells across unrelated families.
 */
export function recruitFamilyWeight(board: BoardState, family: CreatureFamily): number {
  const occupied = board.length - emptySlots(board);
  const crowded = occupied >= Math.max(1, board.length - 4);
  const tierOne = familyLevelCount(board, family, 1);
  const lowerTierCount = MERGE_TIERS
    .filter((tier) => tier < MAX_MERGE_TIER)
    .reduce((total, tier) => total + familyLevelCount(board, family, tier), 0);
  const maxTierCount = familyLevelCount(board, family, MAX_MERGE_TIER);
  const represented = lowerTierCount + maxTierCount > 0;
  const cascadeMerges = projectedCascadeMerges(board, family);

  let weight = crowded ? 2 : 3;

  if (cascadeMerges > 0) {
    // One immediate merge is already valuable; a binary-style carry through
    // several tiers is intentionally much more attractive.
    weight += Math.min(13, 6 + cascadeMerges * 3);
  } else if (tierOne > 0 || lowerTierCount > 0) {
    weight += 2;
  }

  // A family represented only by capped T5 units is still legal because a
  // second T5 can feed mutation ascension/consolidation, but it should not
  // dominate ordinary Recruit rolls.
  if (maxTierCount > 0 && lowerTierCount === 0) {
    weight = Math.max(1, weight - Math.min(2, maxTierCount));
  }

  if (crowded && !represented) weight = 1;

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
  return board.filter((unit): unit is BoardUnit => Boolean(unit && unit.level < MAX_MERGE_TIER));
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
