import { getAscensionEffects, performAscension, type PerformAscensionResult } from '../systems/ascension';
import { createStarterBoard } from '../systems/board';
import { getEncounterSpec } from '../systems/encounters';
import { createGameSave, type GameSave } from './save';

const RECRUIT_CREDIT_COIN_VALUE = 20;

export interface ApplyAscensionSaveResult {
  readonly performed: boolean;
  readonly ascension: PerformAscensionResult;
  readonly save: GameSave;
}

export function applyAscensionToSave(save: GameSave, now = Date.now()): ApplyAscensionSaveResult {
  const ascension = performAscension(save.ascension, save.chapter, now, save.weeklyChaos.active);
  if (!ascension.performed || !ascension.resetPlan) {
    return { performed: false, ascension, save };
  }

  const encounter = getEncounterSpec(1, 0);
  const effects = getAscensionEffects(ascension.progress.purchasedNodes);
  const pityRatio = ascension.resetPlan.anomalyPityCarryRatio;
  const next = createGameSave({
    ...save,
    coins: ascension.resetPlan.coins + effects.startingRecruitCredits * RECRUIT_CREDIT_COIN_VALUE,
    ascension: ascension.progress,
    anomalyHunt: {
      ...save.anomalyHunt,
      charge: Math.floor(save.anomalyHunt.charge * pityRatio),
      secretPity: Math.floor(save.anomalyHunt.secretPity * pityRatio)
    },
    baseHp: 100,
    chapter: 1,
    encounterStep: 0,
    targetHpMax: encounter.hp,
    targetHp: encounter.hp,
    recruitSerial: 0,
    board: createStarterBoard(),
    chaosPerks: []
  }, now);

  return { performed: true, ascension, save: next };
}
