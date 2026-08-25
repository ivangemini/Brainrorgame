import { getBossForChapter, scaleBoss } from '../content/bosses';
import { getEnemyForWave, scaleEnemy } from '../content/enemies';

export const WAVES_PER_CHAPTER = 3 as const;
export const BOSS_STEP = 3 as const;
export type EncounterStep = 0 | 1 | 2 | 3;

export interface EncounterSpec {
  readonly kind: 'wave' | 'boss';
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
  readonly defeatCallout?: string;
}

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
      defeatCallout: boss.defeatCallout
    };
  }

  const waveNumber = (step + 1) as 1 | 2 | 3;
  const enemy = getEnemyForWave(safeChapter, waveNumber);
  const scaled = scaleEnemy(enemy, safeChapter);
  return {
    kind: 'wave',
    id: enemy.id,
    name: enemy.name,
    texture: enemy.texture,
    hp: scaled.hp,
    damage: scaled.damage,
    attackMs: scaled.attackMs,
    reward: scaled.reward,
    accentColor: enemy.accentColor,
    projectileColor: enemy.projectileColor,
    displaySize: enemy.displaySize
  };
}

export function nextEncounter(chapter: number, step: EncounterStep): EncounterPosition {
  const safeChapter = Math.max(1, Math.floor(chapter));
  if (step === BOSS_STEP) return { chapter: safeChapter + 1, step: 0 };
  return { chapter: safeChapter, step: (step + 1) as EncounterStep };
}
