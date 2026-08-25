export type WorldId = 'candy-crater' | 'neon-sewer' | 'appliance-wasteland';

export interface WorldDefinition {
  readonly id: WorldId;
  readonly name: string;
  readonly shortName: string;
  readonly startChapter: number;
  readonly finalChapter: number;
  readonly texture: string;
  readonly assetPath: string;
  readonly accentColor: number;
  readonly hpMultiplier: number;
  readonly damageMultiplier: number;
  readonly attackMsMultiplier: number;
  readonly rewardMultiplier: number;
  readonly energyGainMultiplier: number;
  readonly completionCoins: number;
  readonly completionCoreShards: number;
  readonly ruleLabel: string;
  readonly ruleDescription: string;
}

export interface WorldEncounterStats {
  readonly hp: number;
  readonly damage: number;
  readonly attackMs: number;
  readonly reward: number;
}

const WORLDS: readonly WorldDefinition[] = [
  {
    id: 'candy-crater',
    name: 'Candy Crater',
    shortName: 'CANDY',
    startChapter: 1,
    finalChapter: 5,
    texture: 'bg-candy-crater',
    assetPath: 'assets/backgrounds/candy-crater.svg',
    accentColor: 0xff8ed8,
    hpMultiplier: 1,
    damageMultiplier: 1,
    attackMsMultiplier: 1,
    rewardMultiplier: 1,
    energyGainMultiplier: 1,
    completionCoins: 300,
    completionCoreShards: 2,
    ruleLabel: 'Sugar Baseline',
    ruleDescription: 'Balanced pressure. Learn merges, synergies, drafts and boss windows without a biome tax.'
  },
  {
    id: 'neon-sewer',
    name: 'Neon Sewer',
    shortName: 'NEON',
    startChapter: 6,
    finalChapter: 10,
    texture: 'bg-neon-sewer',
    assetPath: 'assets/backgrounds/neon-sewer.svg',
    accentColor: 0x62f7ff,
    hpMultiplier: 0.96,
    damageMultiplier: 1.05,
    attackMsMultiplier: 0.90,
    rewardMultiplier: 1.12,
    energyGainMultiplier: 1.18,
    completionCoins: 520,
    completionCoreShards: 3,
    ruleLabel: 'Voltage Current',
    ruleDescription: 'Enemies attack faster, but every crew hit charges Chaos Energy 18% faster and bounties rise.'
  },
  {
    id: 'appliance-wasteland',
    name: 'Appliance Wasteland',
    shortName: 'WASTE',
    startChapter: 11,
    finalChapter: 15,
    texture: 'bg-appliance-wasteland',
    assetPath: 'assets/backgrounds/appliance-wasteland.svg',
    accentColor: 0xffb45f,
    hpMultiplier: 1.18,
    damageMultiplier: 1.10,
    attackMsMultiplier: 1.02,
    rewardMultiplier: 1.18,
    energyGainMultiplier: 0.92,
    completionCoins: 850,
    completionCoreShards: 5,
    ruleLabel: 'Scrap Armor',
    ruleDescription: 'Heavy targets have more HP and hit harder. Chaos Energy charges slightly slower, but rewards are richer.'
  }
] as const;

export function getAllWorlds(): readonly WorldDefinition[] {
  return WORLDS;
}

export function getWorldForChapter(chapter: number): WorldDefinition {
  const safeChapter = Math.max(1, Math.floor(chapter));
  for (let index = WORLDS.length - 1; index >= 0; index -= 1) {
    const world = WORLDS[index];
    if (world && safeChapter >= world.startChapter) return world;
  }
  return WORLDS[0]!;
}

export function getWorldStage(chapter: number): number {
  const safeChapter = Math.max(1, Math.floor(chapter));
  const world = getWorldForChapter(safeChapter);
  return safeChapter - world.startChapter + 1;
}

export function isWorldFinalChapter(chapter: number): boolean {
  const safeChapter = Math.max(1, Math.floor(chapter));
  return getWorldForChapter(safeChapter).finalChapter === safeChapter;
}

export function getNextWorld(chapter: number): WorldDefinition | null {
  const safeChapter = Math.max(1, Math.floor(chapter));
  const world = getWorldForChapter(safeChapter);
  const index = WORLDS.findIndex((entry) => entry.id === world.id);
  return WORLDS[index + 1] ?? null;
}

export function applyWorldPressure<T extends WorldEncounterStats>(stats: T, chapter: number, attackMsFloor = 1200): T {
  const world = getWorldForChapter(chapter);
  return {
    ...stats,
    hp: Math.max(1, Math.round(stats.hp * world.hpMultiplier)),
    damage: Math.max(1, Math.round(stats.damage * world.damageMultiplier)),
    attackMs: Math.max(attackMsFloor, Math.round(stats.attackMs * world.attackMsMultiplier)),
    reward: Math.max(1, Math.round(stats.reward * world.rewardMultiplier))
  };
}

export function getWorldEnergyGainMultiplier(chapter: number): number {
  return getWorldForChapter(chapter).energyGainMultiplier;
}
