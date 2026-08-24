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
    return {
      kind: 'boss',
      id: 'fridgino-maximo',
      name: 'Fridgino Maximo',
      texture: 'boss-fridgino',
      hp: Math.round(520 * Math.pow(1.22, safeChapter - 1)),
      damage: Math.min(26, 7 + safeChapter * 2),
      attackMs: Math.max(2100, 3900 - safeChapter * 90),
      reward: 85 + safeChapter * 25,
      accentColor: 0x9cfbff,
      projectileColor: 0xff6d85,
      displaySize: 570
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
