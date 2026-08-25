import type { ScaledEnemyStats } from './enemies';

export const ELITE_MODIFIER_IDS = ['berserk', 'bulwark', 'siege'] as const;
export type EliteModifierId = (typeof ELITE_MODIFIER_IDS)[number];

export interface EliteModifierDefinition {
  readonly id: EliteModifierId;
  readonly name: string;
  readonly description: string;
  readonly hpMultiplier: number;
  readonly damageMultiplier: number;
  readonly attackIntervalMultiplier: number;
  readonly rewardMultiplier: number;
  readonly displayScale: number;
  readonly accentColor: number;
  readonly projectileColor: number;
}

const ELITE_MODIFIERS: readonly EliteModifierDefinition[] = [
  {
    id: 'berserk',
    name: 'BERSERK',
    description: 'Lower durability, much faster attacks and a modest damage spike.',
    hpMultiplier: 0.92,
    damageMultiplier: 1.08,
    attackIntervalMultiplier: 0.72,
    rewardMultiplier: 1.28,
    displayScale: 1.03,
    accentColor: 0xff6e8b,
    projectileColor: 0xffc05c
  },
  {
    id: 'bulwark',
    name: 'BULWARK',
    description: 'Heavy health shell with slower attacks and a higher payout.',
    hpMultiplier: 1.55,
    damageMultiplier: 0.92,
    attackIntervalMultiplier: 1.08,
    rewardMultiplier: 1.35,
    displayScale: 1.08,
    accentColor: 0x79c9ff,
    projectileColor: 0xa6f3ff
  },
  {
    id: 'siege',
    name: 'SIEGE',
    description: 'Fortress-breaker with a large damage spike and slightly more health.',
    hpMultiplier: 1.12,
    damageMultiplier: 1.42,
    attackIntervalMultiplier: 1.05,
    rewardMultiplier: 1.32,
    displayScale: 1.05,
    accentColor: 0xffd46e,
    projectileColor: 0xff8d62
  }
] as const;

export interface EliteScaledStats extends ScaledEnemyStats {
  readonly displayScale: number;
}

export function getAllEliteModifiers(): readonly EliteModifierDefinition[] {
  return ELITE_MODIFIERS;
}

export function getEliteModifier(id: EliteModifierId): EliteModifierDefinition {
  const found = ELITE_MODIFIERS.find((modifier) => modifier.id === id);
  if (!found) throw new Error(`Unknown elite modifier: ${id}`);
  return found;
}

export function getEliteModifierForWave(chapter: number, waveNumber: 1 | 2 | 3): EliteModifierDefinition | null {
  const safeChapter = Math.max(1, Math.floor(chapter));
  if (safeChapter < 3) return null;
  const eliteWave = ((safeChapter - 3) % 3) + 1;
  if (waveNumber !== eliteWave) return null;
  const modifier = ELITE_MODIFIERS[(safeChapter - 3) % ELITE_MODIFIERS.length];
  if (!modifier) throw new Error(`No elite modifier configured for chapter ${chapter}`);
  return modifier;
}

export function applyEliteModifier(stats: ScaledEnemyStats, modifier: EliteModifierDefinition): EliteScaledStats {
  return {
    hp: Math.max(1, Math.round(stats.hp * modifier.hpMultiplier)),
    damage: Math.max(1, Math.round(stats.damage * modifier.damageMultiplier)),
    attackMs: Math.max(1450, Math.round(stats.attackMs * modifier.attackIntervalMultiplier)),
    reward: Math.max(1, Math.round(stats.reward * modifier.rewardMultiplier)),
    displayScale: modifier.displayScale
  };
}
