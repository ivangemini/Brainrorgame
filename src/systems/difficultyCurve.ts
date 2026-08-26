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

  // Base enemy/boss data already grows by chapter and world modifiers stack on
  // top. Keep campaign pressure meaningful without multiplying those curves
  // into a hard progression wall around world-final bosses.
  const hpMultiplier = kind === 'boss'
    ? Math.min(5, 1.50 + depth * 0.14)
    : Math.min(6, 1.35 + depth * 0.18);

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
