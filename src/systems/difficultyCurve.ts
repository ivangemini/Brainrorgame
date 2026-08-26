export type EncounterDifficultyKind = 'wave' | 'boss';

export interface CampaignPressure {
  readonly hpMultiplier: number;
  readonly damageMultiplier: number;
  readonly attackIntervalMultiplier: number;
  readonly rewardMultiplier: number;
}

interface DifficultyStats {
  readonly hp: number;
  readonly damage: number;
  readonly attackMs: number;
  readonly reward: number;
}

export function getCampaignPressure(chapter: number, kind: EncounterDifficultyKind): CampaignPressure {
  const safeChapter = Math.max(1, Math.floor(chapter));
  const depth = safeChapter - 1;
  const hpMultiplier = kind === 'boss'
    ? Math.min(7.5, 1.50 + depth * 0.30)
    : Math.min(9.5, 1.35 + depth * 0.34);

  return {
    hpMultiplier,
    damageMultiplier: Math.min(1.42, 1 + depth * 0.025),
    attackIntervalMultiplier: Math.max(0.90, 1 - depth * 0.005),
    rewardMultiplier: Math.min(1.18, 1 + depth * 0.012)
  };
}

export function applyCampaignPressure<T extends DifficultyStats>(
  stats: T,
  chapter: number,
  kind: EncounterDifficultyKind,
  attackFloorMs: number
): T {
  const pressure = getCampaignPressure(chapter, kind);
  return {
    ...stats,
    hp: Math.max(1, Math.round(stats.hp * pressure.hpMultiplier)),
    damage: Math.max(1, Math.round(stats.damage * pressure.damageMultiplier)),
    attackMs: Math.max(attackFloorMs, Math.round(stats.attackMs * pressure.attackIntervalMultiplier)),
    reward: Math.max(1, Math.round(stats.reward * pressure.rewardMultiplier))
  };
}
