import { createDefaultAnomalyHuntState } from '../systems/anomalyHunt';
import { createDefaultAscensionProgress } from '../systems/ascension';
import { createStarterBoard } from '../systems/board';
import { createBossHuntProgress, createDefaultBossTrophyRoomProgress } from '../systems/bossHunt';
import { createDefaultCollectionProgress } from '../systems/collectionProgression';
import { createDefaultDailyState } from '../systems/dailyRetention';
import { getEncounterSpec } from '../systems/encounters';
import { createDefaultMetaUpgradeLevels } from '../systems/metaProgression';
import { backfillMutationAlbumProgress } from '../systems/mutationAlbum';
import { createDefaultOnboardingState } from '../systems/onboarding';
import { createDefaultWeeklyChaosProgress } from '../systems/weeklyChaos';
import { createGameSave, type GameSave } from './save';

export function createFreshGameSave(now = Date.now()): GameSave {
  const board = createStarterBoard();
  const collection = createDefaultCollectionProgress(board);
  const encounter = getEncounterSpec(1, 0);
  const bossTrophies = createDefaultBossTrophyRoomProgress();

  return createGameSave({
    coins: 120,
    coreShards: 0,
    upgrades: createDefaultMetaUpgradeLevels(),
    daily: createDefaultDailyState(now),
    collection,
    onboarding: createDefaultOnboardingState(),
    anomalyHunt: createDefaultAnomalyHuntState(),
    mutationAlbum: backfillMutationAlbumProgress(collection, board),
    weeklyChaos: createDefaultWeeklyChaosProgress(now),
    ascension: createDefaultAscensionProgress(),
    bossHunt: createBossHuntProgress(bossTrophies, now),
    bossTrophies,
    baseHp: 100,
    chapter: 1,
    encounterStep: 0,
    targetHpMax: encounter.hp,
    targetHp: encounter.hp,
    recruitSerial: 0,
    board,
    chaosPerks: []
  }, now);
}
