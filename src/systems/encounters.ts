import { getBossForChapter, scaleBoss, type BossPresentation } from '../content/bosses';
import {
  applyEliteModifier,
  getEliteModifierForWave,
  type EliteModifierDefinition
} from '../content/eliteModifiers';
import { getEnemyForWave, scaleEnemy } from '../content/enemies';

export const WAVES_PER_CHAPTER = 3 as const;
export const BOSS_STEP = 3 as const;
export type EncounterStep = 0 | 1 | 2 | 3;

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
}

export interface WaveEncounterSpec extends EncounterSpecBase {
  readonly kind: 'wave';
  readonly elite: EliteModifierDefinition | null;
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

export function isBossStep(step: EncounterStep): boolean {
  return step === BOSS_STEP;
}

export function getEncounterSpec(chapter: number, step: EncounterStep): EncounterSpec {
  const safeChapter = Math.max(1, Math.floor(chapter));
  if (step === BOSS_STEP) {
    const boss = getBossForChapter(safeChapter);
    const scaled = scaleBoss(boss, safeChapter);
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
      presentation: boss.presentation
    };
  }

  const waveNumber = (step + 1) as 1 | 2 | 3;
  const enemy = getEnemyForWave(safeChapter, waveNumber);
  const base = scaleEnemy(enemy, safeChapter);
  const elite = getEliteModifierForWave(safeChapter, waveNumber);
  const scaled = elite ? applyEliteModifier(base, elite) : { ...base, displayScale: 1 };
  return {
    kind: 'wave',
    id: enemy.id,
    name: enemy.name,
    texture: enemy.texture,
    hp: scaled.hp,
    damage: scaled.damage,
    attackMs: scaled.attackMs,
    reward: scaled.reward,
    accentColor: elite?.accentColor ?? enemy.accentColor,
    projectileColor: elite?.projectileColor ?? enemy.projectileColor,
    displaySize: Math.round(enemy.displaySize * scaled.displayScale),
    elite
  };
}

export function nextEncounter(chapter: number, step: EncounterStep): EncounterPosition {
  const safeChapter = Math.max(1, Math.floor(chapter));
  if (step === BOSS_STEP) return { chapter: safeChapter + 1, step: 0 };
  return { chapter: safeChapter, step: (step + 1) as EncounterStep };
}
