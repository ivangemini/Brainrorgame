export type MetaUpgradeId = 'power' | 'armor' | 'bounty';

export interface MetaUpgradeLevels {
  readonly power: number;
  readonly armor: number;
  readonly bounty: number;
}

export interface MetaUpgradeDefinition {
  readonly id: MetaUpgradeId;
  readonly name: string;
  readonly shortDescription: string;
  readonly texture: string;
  readonly maxLevel: number;
  readonly accentColor: number;
}

export interface PurchaseResult {
  readonly purchased: boolean;
  readonly shards: number;
  readonly levels: MetaUpgradeLevels;
}

const COST_BY_CURRENT_LEVEL = [1, 2, 3, 5, 7, 10, 14, 19, 25, 32] as const;
const FALLBACK_UPGRADE_COST = 32;

export const META_UPGRADES: readonly MetaUpgradeDefinition[] = [
  {
    id: 'power',
    name: 'CREW REACTOR',
    shortDescription: '+8% crew damage per level',
    texture: 'upgrade-power-core',
    maxLevel: 10,
    accentColor: 0xff8068
  },
  {
    id: 'armor',
    name: 'FORTRESS PLATE',
    shortDescription: '-6% incoming damage per level',
    texture: 'upgrade-fortress-plate',
    maxLevel: 8,
    accentColor: 0x78dcff
  },
  {
    id: 'bounty',
    name: 'BOUNTY COIL',
    shortDescription: '+10% coin rewards per level',
    texture: 'upgrade-bounty-coil',
    maxLevel: 10,
    accentColor: 0xffdc68
  }
] as const;

export function createDefaultMetaUpgradeLevels(): MetaUpgradeLevels {
  return { power: 0, armor: 0, bounty: 0 };
}

export function getMetaUpgradeDefinition(id: MetaUpgradeId): MetaUpgradeDefinition {
  const definition = META_UPGRADES.find((upgrade) => upgrade.id === id);
  if (!definition) throw new Error(`Unknown meta upgrade: ${id}`);
  return definition;
}

export function getUpgradeCost(id: MetaUpgradeId, levels: MetaUpgradeLevels): number | null {
  const definition = getMetaUpgradeDefinition(id);
  const level = levels[id];
  if (level >= definition.maxLevel) return null;
  return COST_BY_CURRENT_LEVEL[level] ?? FALLBACK_UPGRADE_COST;
}

export function purchaseMetaUpgrade(shards: number, levels: MetaUpgradeLevels, id: MetaUpgradeId): PurchaseResult {
  const cost = getUpgradeCost(id, levels);
  if (cost === null || shards < cost) return { purchased: false, shards, levels };
  return {
    purchased: true,
    shards: shards - cost,
    levels: { ...levels, [id]: levels[id] + 1 }
  };
}

export function squadDamageMultiplier(levels: MetaUpgradeLevels): number {
  return 1 + levels.power * 0.08;
}

export function incomingDamageMultiplier(levels: MetaUpgradeLevels): number {
  return Math.max(0.52, 1 - levels.armor * 0.06);
}

export function coinRewardMultiplier(levels: MetaUpgradeLevels): number {
  return 1 + levels.bounty * 0.1;
}

export function bossCoreReward(chapter: number): number {
  return Math.min(8, 1 + Math.floor((Math.max(1, chapter) - 1) / 5));
}

export function effectValueText(id: MetaUpgradeId, level: number): string {
  if (id === 'power') return `+${level * 8}% DAMAGE`;
  if (id === 'armor') return `-${level * 6}% DAMAGE TAKEN`;
  return `+${level * 10}% COINS`;
}
