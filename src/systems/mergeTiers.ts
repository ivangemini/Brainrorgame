import {
  getCreature,
  type CreatureDefinition,
  type CreatureFamily,
  type CreatureKey,
  type CreatureLevel
} from '../content/creatures';

export const MERGE_TIERS = [1, 2, 3, 4, 5] as const;
export type MergeTier = (typeof MERGE_TIERS)[number];
export const MAX_MERGE_TIER: MergeTier = 5;

export interface MergeTierCreatureDefinition extends CreatureDefinition {
  readonly mergeTier: MergeTier;
}

export function isMergeTier(value: unknown): value is MergeTier {
  return typeof value === 'number'
    && Number.isInteger(value)
    && (MERGE_TIERS as readonly number[]).includes(value);
}

export function artLevelForMergeTier(tier: MergeTier): CreatureLevel {
  return (tier <= 3 ? tier : 3) as CreatureLevel;
}

export function collectionKeyForMergeTier(family: CreatureFamily, tier: MergeTier): CreatureKey {
  return `${family}-${artLevelForMergeTier(tier)}` as CreatureKey;
}

/**
 * T4/T5 extend the merge chase without pretending there are already two more
 * authored silhouette sets. They reuse the T3 silhouette for now and receive
 * unmistakable prestige framing in BoardView. getCreature owns the combat
 * scaling so every runtime caller sees identical T4/T5 stats.
 */
export function getMergeTierCreature(family: CreatureFamily, tier: MergeTier): MergeTierCreatureDefinition {
  return { ...getCreature(family, tier), mergeTier: tier };
}

export function nextMergeTier(tier: MergeTier): MergeTier | null {
  return tier >= MAX_MERGE_TIER ? null : (tier + 1) as MergeTier;
}

export function mergesRequiredForTier(tier: MergeTier): number {
  return (2 ** (tier - 1)) - 1;
}
