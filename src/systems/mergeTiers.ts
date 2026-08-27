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

interface PrestigeScaling {
  readonly damageMultiplier: number;
  readonly attackIntervalMultiplier: number;
  readonly nameSuffix: string;
}

const PRESTIGE_SCALING: Readonly<Record<4 | 5, PrestigeScaling>> = {
  4: { damageMultiplier: 2.05, attackIntervalMultiplier: 0.96, nameSuffix: 'Sovraccarico' },
  5: { damageMultiplier: 4.20, attackIntervalMultiplier: 0.92, nameSuffix: 'Imperiale' }
};

export interface MergeTierCreatureDefinition extends CreatureDefinition {
  readonly mergeTier: MergeTier;
}

export function isMergeTier(value: unknown): value is MergeTier {
  return typeof value === 'number'
    && Number.isInteger(value)
    && (MERGE_TIERS as readonly number[]).includes(value);
}

export function artLevelForMergeTier(tier: MergeTier): CreatureLevel {
  return tier <= 3 ? tier : 3;
}

export function collectionKeyForMergeTier(family: CreatureFamily, tier: MergeTier): CreatureKey {
  return `${family}-${artLevelForMergeTier(tier)}` as CreatureKey;
}

/**
 * T4/T5 extend the merge chase without pretending there are already two more
 * authored silhouette sets. They deliberately reuse the T3 character art and
 * receive unmistakable prestige framing in BoardView. Combat scaling stays
 * only slightly better than keeping the two source units separate (~7% DPS),
 * so merging remains rewarding without exploding encounter balance.
 */
export function getMergeTierCreature(family: CreatureFamily, tier: MergeTier): MergeTierCreatureDefinition {
  const base = getCreature(family, artLevelForMergeTier(tier));
  if (tier <= 3) return { ...base, mergeTier: tier };

  const scaling = PRESTIGE_SCALING[tier];
  return {
    ...base,
    mergeTier: tier,
    name: `${base.name} ${scaling.nameSuffix}`,
    damage: Math.max(1, Math.round(base.damage * scaling.damageMultiplier)),
    attackMs: Math.max(180, Math.round(base.attackMs * scaling.attackIntervalMultiplier))
  };
}

export function nextMergeTier(tier: MergeTier): MergeTier | null {
  return tier >= MAX_MERGE_TIER ? null : (tier + 1) as MergeTier;
}

export function mergesRequiredForTier(tier: MergeTier): number {
  return (2 ** (tier - 1)) - 1;
}
