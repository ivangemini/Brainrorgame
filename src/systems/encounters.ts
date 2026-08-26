import { getBossForChapter, scaleBoss, type BossPhaseProfile, type BossPresentation } from '../content/bosses';
import {
  applyChapterMutator,
  getChapterMutator,
  type ChapterMutatorDefinition
} from '../content/chapterMutators';
import { syncRecruitProgressChapter } from '../content/creatures';
import {
  applyEliteModifier,
  getEliteModifierForWave,
  type EliteModifierDefinition
} from '../content/eliteModifiers';
import { getEnemyForWave, scaleEnemy, type EnemyWaveNumber } from '../content/enemies';
import {
  applyWorldPressure,
  getWorldEnergyGainMultiplier,
  getWorldForChapter,
  isWorldFinalChapter
} from '../content/worlds';
import { beginActiveAbilityEncounter } from './activeAbilities';
import { syncAscensionRuntimeChapter } from './ascensionRuntime';
import {
  currentBossAttackIntervalMultiplier,
  currentBossOpeningDelayMs,
  currentBossOutgoingDamageMultiplier
} from './bossPhases';
import { applyCampaignPressure } from './difficultyCurve';

export const WAVES_PER_CHAPTER = 5 as const;
export const GAUNTLET_STEP = 4 as const;
export const BOSS_STEP = 5 as const;
export type EncounterStep = 0 | 1 | 2 | 3 | 4 | 5;

interface EncounterSpecBase {
  readonly id: string;
  readonly name: string;
  readonly texture: string;
  readonly hp: number;
  readonly damage: number;
  readonly attackMs: number;
  readonly reward: number;
  readonly accentColor: number;
  readonly projectileColor: number;
  readonly displaySize: number;
  readonly mutator: ChapterMutatorDefinition | null;
}

export interface WaveEncounterSpec extends EncounterSpecBase {
  readonly kind: 'wave';
  readonly elite: EliteModifierDefinition | null;
  readonly waveNumber: EnemyWaveNumber;
  readonly gauntlet: boolean;
}

export interface BossEncounterSpec extends EncounterSpecBase {
  readonly kind: 'boss';
  readonly presentation: BossPresentation;
  readonly phases: BossPhaseProfile;
}

export type EncounterSpec = WaveEncounterSpec | BossEncounterSpec;

export interface EncounterPosition {
  readonly chapter: number;
  readonly step: EncounterStep;
}

interface LateWavePressure {
  readonly hp: number;
  readonly damage: number;
  readonly attackMs: number;
  readonly reward: number;
  readonly display: number;
}

const LATE_WAVE_PRESSURE: Readonly<Record<EncounterStep, LateWavePressure>> = {
  0: { hp: 1, damage: 1, attackMs: 1, reward: 1, display: 1 },
  1: { hp: 1, damage: 1, attackMs: 1, reward: 1, display: 1 },
  2: { hp: 1, damage: 1, attackMs: 1, reward: 1, display: 1 },
  3: { hp: 1.18, damage: 1.06, attackMs: 0.96, reward: 1.12, display: 1.03 },
  4: { hp: 1.45, damage: 1.12, attackMs: 0.92, reward: 1.38, display: 1.07 },
  5: { hp: 1, damage: 1, attackMs: 1, reward: 1, display: 1 }
};

export function isBossStep(step: EncounterStep): boolean {
  return step === BOSS_STEP;
}

export function getEncounterSpec(chapter: number, step: EncounterStep): EncounterSpec {
  const safeChapter = Math.max(1, Math.floor(chapter));
  syncRecruitProgressChapter(safeChapter);
  syncAscensionRuntimeChapter(safeChapter);
  const mutator = getChapterMutator(safeChapter);
  const energyGainMultiplier = getWorldEnergyGainMultiplier(safeChapter);
  if (step === BOSS_STEP) {
    beginActiveAbilityEncounter(`chapter:${safeChapter}:boss`, energyGainMultiplier);
    const boss = getBossForChapter(safeChapter);
    const mutated = applyChapterMutator(scaleBoss(boss, safeChapter), mutator);
    const worldScaled = applyWorldPressure(mutated, safeChapter, 1200);
    const scaled = applyCampaignPressure(worldScaled, safeChapter, 'boss', 1200);
    const worldBonus = isWorldFinalChapter(safeChapter)
      ? getWorldForChapter(safeChapter).completionCoins
      : 0;
    return {
      kind: 'boss',
      id: boss.id,
      name: boss.name,
      texture: boss.texture,
      hp: scaled.hp,
      get damage(): number {
        return Math.max(1, Math.round(scaled.damage * currentBossOutgoingDamageMultiplier()));
      },
      get attackMs(): number {
        return Math.max(1200, Math.round(
          scaled.attackMs * currentBossAttackIntervalMultiplier() + currentBossOpeningDelayMs()
        ));
      },
      reward: scaled.reward + worldBonus,
      accentColor: boss.accentColor,
      projectileColor: boss.projectileColor,
      displaySize: boss.displaySize,
      presentation: boss.presentation,
      phases: boss.phases,
      mutator
    };
  }

  const waveNumber = (step + 1) as EnemyWaveNumber;
  beginActiveAbilityEncounter(`chapter:${safeChapter}:wave:${waveNumber}`, energyGainMultiplier);
  const enemy = getEnemyForWave(safeChapter, waveNumber);
  const base = scaleEnemy(enemy, safeChapter);
  const elite = waveNumber <= 3
    ? getEliteModifierForWave(safeChapter, waveNumber as 1 | 2 | 3)
    : null;
  const eliteScaled = elite ? applyEliteModifier(base, elite) : { ...base, displayScale: 1 };
  const pressure = LATE_WAVE_PRESSURE[step];
  const gauntlet = step === GAUNTLET_STEP;
  const pressured = {
    hp: Math.max(1, Math.round(eliteScaled.hp * pressure.hp)),
    damage: Math.max(1, Math.round(eliteScaled.damage * pressure.damage)),
    attackMs: Math.max(1450, Math.round(eliteScaled.attackMs * pressure.attackMs)),
    reward: Math.max(1, Math.round(eliteScaled.reward * pressure.reward))
  };
  const mutated = applyChapterMutator(pressured, mutator);
  const worldScaled = applyWorldPressure(mutated, safeChapter, 1450);
  const scaled = applyCampaignPressure(worldScaled, safeChapter, 'wave', 1450);
  return {
    kind: 'wave',
    id: enemy.id,
    name: gauntlet ? `Chaos Gate ${enemy.name}` : enemy.name,
    texture: enemy.texture,
    hp: scaled.hp,
    damage: scaled.damage,
    attackMs: scaled.attackMs,
    reward: scaled.reward,
    accentColor: elite?.accentColor ?? enemy.accentColor,
    projectileColor: elite?.projectileColor ?? enemy.projectileColor,
    displaySize: Math.round(enemy.displaySize * eliteScaled.displayScale * pressure.display),
    elite,
    waveNumber,
    gauntlet,
    mutator
  };
}

export function nextEncounter(chapter: number, step: EncounterStep): EncounterPosition {
  const safeChapter = Math.max(1, Math.floor(chapter));
  if (step === BOSS_STEP) return { chapter: safeChapter + 1, step: 0 };
  return { chapter: safeChapter, step: (step + 1) as EncounterStep };
}
