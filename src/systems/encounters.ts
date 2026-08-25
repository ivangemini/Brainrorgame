import { getBossForChapter, scaleBoss, type BossPresentation } from '../content/bosses';
import {
  applyChapterMutator,
  getChapterMutator,
  type ChapterMutatorDefinition
} from '../content/chapterMutators';
import {
  applyEliteModifier,
  getEliteModifierForWave,
  type EliteModifierDefinition
} from '../content/eliteModifiers';
import { getEnemyForWave, scaleEnemy, type EnemyWaveNumber } from '../content/enemies';

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
  const mutator = getChapterMutator(safeChapter);
  if (step === BOSS_STEP) {
    const boss = getBossForChapter(safeChapter);
    const scaled = applyChapterMutator(scaleBoss(boss, safeChapter), mutator);
    return {
      kind: 'boss',
      id: boss.id,
      name: boss.name,
      texture: boss.texture,
      hp: scaled.hp,
      damage: scaled.damage,
      attackMs: scaled.attackMs,
      reward: scaled.reward,
      accentColor: boss.accentColor,
      projectileColor: boss.projectileColor,
      displaySize: boss.displaySize,
      presentation: boss.presentation,
      mutator
    };
  }

  const waveNumber = (step + 1) as EnemyWaveNumber;
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
  return {
    kind: 'wave',
    id: enemy.id,
    name: gauntlet ? `Chaos Gate ${enemy.name}` : enemy.name,
    texture: enemy.texture,
    hp: mutated.hp,
    damage: mutated.damage,
    attackMs: mutated.attackMs,
    reward: mutated.reward,
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
