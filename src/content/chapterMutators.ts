export type ChapterMutatorId = 'turbo-swarm' | 'heavy-weather' | 'gold-rush';

export interface ChapterMutatorDefinition {
  readonly id: ChapterMutatorId;
  readonly name: string;
  readonly description: string;
  readonly hpMultiplier: number;
  readonly damageMultiplier: number;
  readonly attackMsMultiplier: number;
  readonly rewardMultiplier: number;
  readonly accentColor: number;
}

const CHAPTER_MUTATORS: readonly ChapterMutatorDefinition[] = [
  {
    id: 'turbo-swarm',
    name: 'Turbo Swarm',
    description: 'Enemies attack much faster, but the chapter pays a larger coin bounty.',
    hpMultiplier: 0.96,
    damageMultiplier: 1,
    attackMsMultiplier: 0.82,
    rewardMultiplier: 1.24,
    accentColor: 0x5ff4ff
  },
  {
    id: 'heavy-weather',
    name: 'Heavy Weather',
    description: 'Enemies gain mass and impact while rewards rise with the pressure.',
    hpMultiplier: 1.28,
    damageMultiplier: 1.1,
    attackMsMultiplier: 1.04,
    rewardMultiplier: 1.32,
    accentColor: 0xb594ff
  },
  {
    id: 'gold-rush',
    name: 'Gold Rush',
    description: 'A richer but sharper chapter with modest pressure and a large coin premium.',
    hpMultiplier: 1.1,
    damageMultiplier: 1.06,
    attackMsMultiplier: 0.95,
    rewardMultiplier: 1.46,
    accentColor: 0xffd45f
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
  return CHAPTER_MUTATORS[(safeChapter - 4) % CHAPTER_MUTATORS.length] ?? null;
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
