export const MUTATION_IDS = ['none', 'charged', 'prismatic', 'crowned'] as const;
export type MutationId = (typeof MUTATION_IDS)[number];
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface MutationDefinition {
  readonly id: MutationId;
  readonly rarity: Rarity;
  readonly name: string;
  readonly shortLabel: string;
  readonly description: string;
  readonly rank: 0 | 1 | 2 | 3;
  readonly damageMultiplier: number;
  readonly attackIntervalMultiplier: number;
  readonly accentColor: number;
  readonly projectileColor: number;
  readonly texture: string | null;
  readonly assetPath: string | null;
}

const MUTATIONS: readonly MutationDefinition[] = [
  {
    id: 'none', rarity: 'common', name: 'Stable', shortLabel: '',
    description: 'Standard creature form.', rank: 0,
    damageMultiplier: 1, attackIntervalMultiplier: 1,
    accentColor: 0xb9c8e6, projectileColor: 0xffffff,
    texture: null, assetPath: null
  },
  {
    id: 'charged', rarity: 'rare', name: 'Charged', shortLabel: 'R',
    description: 'Electric coil mutation: +8% damage and 6% faster attacks.', rank: 1,
    damageMultiplier: 1.08, attackIntervalMultiplier: 0.94,
    accentColor: 0x6cf5ff, projectileColor: 0x9dffff,
    texture: 'mutation-charged-coil', assetPath: 'assets/mutations/charged-coil.svg'
  },
  {
    id: 'prismatic', rarity: 'epic', name: 'Prismatic', shortLabel: 'E',
    description: 'Crystal-wing mutation: +20% damage and 10% faster attacks.', rank: 2,
    damageMultiplier: 1.20, attackIntervalMultiplier: 0.90,
    accentColor: 0xd58cff, projectileColor: 0xe5a0ff,
    texture: 'mutation-prismatic-wings', assetPath: 'assets/mutations/prismatic-wings.svg'
  },
  {
    id: 'crowned', rarity: 'legendary', name: 'Crowned', shortLabel: 'L',
    description: 'Chaos-crown mutation: +35% damage and 14% faster attacks.', rank: 3,
    damageMultiplier: 1.35, attackIntervalMultiplier: 0.86,
    accentColor: 0xffd86a, projectileColor: 0xffe999,
    texture: 'mutation-chaos-crown', assetPath: 'assets/mutations/chaos-crown.svg'
  }
] as const;

export const RECRUIT_MUTATION_RATES = {
  common: 0.80,
  rare: 0.15,
  epic: 0.045,
  legendary: 0.005
} as const;

const RARE_START = 0.80;
const EPIC_START = 0.95;
const LEGENDARY_START = 0.995;

export function getMutationDefinition(id: MutationId): MutationDefinition {
  const found = MUTATIONS.find((mutation) => mutation.id === id);
  if (!found) throw new Error(`Unknown mutation: ${id}`);
  return found;
}

export function getAllMutationDefinitions(): readonly MutationDefinition[] {
  return MUTATIONS;
}

export function getMutationOverlayDefinitions(): readonly MutationDefinition[] {
  return MUTATIONS.filter((mutation) => mutation.texture !== null && mutation.assetPath !== null);
}

export function isMutationId(value: unknown): value is MutationId {
  return typeof value === 'string' && (MUTATION_IDS as readonly string[]).includes(value);
}

export function rollMutation(roll: number): MutationId {
  const normalized = Number.isFinite(roll) ? Math.min(0.999999999, Math.max(0, roll)) : 0;
  if (normalized < RARE_START) return 'none';
  if (normalized < EPIC_START) return 'charged';
  if (normalized < LEGENDARY_START) return 'prismatic';
  return 'crowned';
}

export function mergeMutation(a: MutationId, b: MutationId): MutationId {
  const first = getMutationDefinition(a);
  const second = getMutationDefinition(b);
  if (a === b) {
    if (a === 'charged') return 'prismatic';
    if (a === 'prismatic') return 'crowned';
  }
  return first.rank >= second.rank ? first.id : second.id;
}

export function mutatedDamage(baseDamage: number, mutation: MutationId): number {
  return Math.max(1, Math.round(baseDamage * getMutationDefinition(mutation).damageMultiplier));
}

export function mutatedAttackMs(baseAttackMs: number, mutation: MutationId): number {
  return Math.max(180, Math.round(baseAttackMs * getMutationDefinition(mutation).attackIntervalMultiplier));
}
