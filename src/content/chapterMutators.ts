export type ChapterMutatorId =
  | 'turbo-swarm'
  | 'heavy-weather'
  | 'gold-rush'
  | 'mirror-frenzy'
  | 'scrap-fortress'
  | 'chaos-dividend';

export interface ChapterMutatorDefinition {
  readonly id: ChapterMutatorId;
  readonly name: string;
  readonly description: string;
  readonly hpMultiplier: number;
  readonly damageMultiplier: number;
  readonly attackMsMultiplier: number;
  readonly rewardMultiplier: number;
  readonly accentColor: number;
  readonly endlessTier: number;
}

const STANDARD_MUTATORS: readonly ChapterMutatorDefinition[] = [
  {
    id: 'turbo-swarm',
    name: 'Turbo Swarm',
    description: 'Enemies attack much faster, but the chapter pays a larger coin bounty.',
    hpMultiplier: 0.96,
    damageMultiplier: 1,
    attackMsMultiplier: 0.82,
    rewardMultiplier: 1.24,
    accentColor: 0x5ff4ff,
    endlessTier: 0
  },
  {
    id: 'heavy-weather',
    name: 'Heavy Weather',
    description: 'Enemies gain mass and impact while rewards rise with the pressure.',
    hpMultiplier: 1.28,
    damageMultiplier: 1.1,
    attackMsMultiplier: 1.04,
    rewardMultiplier: 1.32,
    accentColor: 0xb594ff,
    endlessTier: 0
  },
  {
    id: 'gold-rush',
    name: 'Gold Rush',
    description: 'A richer but sharper chapter with modest pressure and a large coin premium.',
    hpMultiplier: 1.1,
    damageMultiplier: 1.06,
    attackMsMultiplier: 0.95,
    rewardMultiplier: 1.46,
    accentColor: 0xffd45f,
    endlessTier: 0
  }
];

const ENDLESS_MUTATORS: readonly ChapterMutatorDefinition[] = [
  ...STANDARD_MUTATORS,
  {
    id: 'mirror-frenzy',
    name: 'Mirror Frenzy',
    description: 'Targets are lighter but dramatically more aggressive. Survive the tempo spike for premium rewards.',
    hpMultiplier: 0.82,
    damageMultiplier: 1.22,
    attackMsMultiplier: 0.88,
    rewardMultiplier: 1.52,
    accentColor: 0xff78c8,
    endlessTier: 0
  },
  {
    id: 'scrap-fortress',
    name: 'Scrap Fortress',
    description: 'Massive armored targets trade speed for extreme durability and a heavy bounty.',
    hpMultiplier: 1.55,
    damageMultiplier: 1.08,
    attackMsMultiplier: 1.08,
    rewardMultiplier: 1.6,
    accentColor: 0x8fc5ff,
    endlessTier: 0
  },
  {
    id: 'chaos-dividend',
    name: 'Chaos Dividend',
    description: 'Every stat rises at once, but the payout rises even faster. Built for high-risk late-game runs.',
    hpMultiplier: 1.22,
    damageMultiplier: 1.16,
    attackMsMultiplier: 0.94,
    rewardMultiplier: 1.72,
    accentColor: 0x9cff7c,
    endlessTier: 0
  }
];

export interface MutableEncounterStats {
  readonly hp: number;
  readonly damage: number;
  readonly attackMs: number;
  readonly reward: number;
}

export function getChapterMutator(chapter: number): ChapterMutatorDefinition | null {
  const safeChapter = Math.max(1, Math.floor(chapter));
  if (safeChapter < 4) return null;

  if (safeChapter <= 15) {
    return STANDARD_MUTATORS[(safeChapter - 4) % STANDARD_MUTATORS.length] ?? null;
  }

  const endlessIndex = safeChapter - 16;
  const base = ENDLESS_MUTATORS[endlessIndex % ENDLESS_MUTATORS.length];
  if (!base) return null;

  const endlessTier = 1 + Math.floor(endlessIndex / 5);
  const pressureSteps = Math.min(8, Math.max(0, endlessTier - 1));
  return {
    ...base,
    endlessTier,
    hpMultiplier: base.hpMultiplier * (1 + pressureSteps * 0.06),
    damageMultiplier: base.damageMultiplier * (1 + pressureSteps * 0.04),
    attackMsMultiplier: base.attackMsMultiplier * Math.max(0.78, 1 - pressureSteps * 0.02),
    rewardMultiplier: base.rewardMultiplier * (1 + pressureSteps * 0.08)
  };
}

export function applyChapterMutator<T extends MutableEncounterStats>(
  stats: T,
  mutator: ChapterMutatorDefinition | null,
  attackMsFloor = 1450
): T {
  if (!mutator) return { ...stats };
  return {
    ...stats,
    hp: Math.max(1, Math.round(stats.hp * mutator.hpMultiplier)),
    damage: Math.max(1, Math.round(stats.damage * mutator.damageMultiplier)),
    attackMs: Math.max(attackMsFloor, Math.round(stats.attackMs * mutator.attackMsMultiplier)),
    reward: Math.max(1, Math.round(stats.reward * mutator.rewardMultiplier))
  };
}
