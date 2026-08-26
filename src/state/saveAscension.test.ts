import { describe, expect, it } from 'vitest';
import { createDefaultAnomalyHuntState } from '../systems/anomalyHunt';
import { createDefaultAscensionProgress } from '../systems/ascension';
import { createStarterBoard } from '../systems/board';
import { createDefaultCollectionProgress } from '../systems/collectionProgression';
import { createDefaultDailyState } from '../systems/dailyRetention';
import { createDefaultMetaUpgradeLevels } from '../systems/metaProgression';
import { backfillMutationAlbumProgress } from '../systems/mutationAlbum';
import { createDefaultOnboardingState } from '../systems/onboarding';
import { createDefaultWeeklyChaosProgress } from '../systems/weeklyChaos';
import { createGameSave, parseGameSave } from './save';

const NOW = Date.parse('2026-08-26T09:00:00.000Z');

function makeSnapshot() {
  const board = createStarterBoard();
  const collection = createDefaultCollectionProgress(board);
  return {
    coins: 420,
    coreShards: 9,
    upgrades: createDefaultMetaUpgradeLevels(),
    daily: createDefaultDailyState(NOW),
    collection,
    onboarding: createDefaultOnboardingState(),
    anomalyHunt: createDefaultAnomalyHuntState(),
    mutationAlbum: backfillMutationAlbumProgress(collection, board),
    weeklyChaos: createDefaultWeeklyChaosProgress(NOW),
    ascension: createDefaultAscensionProgress(),
    baseHp: 100,
    chapter: 21,
    encounterStep: 0 as const,
    targetHpMax: 1000,
    targetHp: 1000,
    recruitSerial: 2,
    board,
    chaosPerks: [] as const
  };
}

describe('Ascension save v13', () => {
  it('round-trips a valid Ascension tree and Chaos Star ledger', () => {
    const ascension = {
      chaosStars: 3,
      lifetimeChaosStars: 6,
      ascensions: 2,
      highestResetChapter: 26,
      purchasedNodes: ['merge-seed-cache', 'merge-echo'] as const,
      lastAscendedAt: NOW - 1000
    };
    const save = createGameSave({ ...makeSnapshot(), ascension }, NOW);
    expect(save.version).toBe(13);
    expect(parseGameSave(save)).toEqual(save);
  });

  it('migrates v12 to zero Ascension progress without retroactive Stars', () => {
    const current = createGameSave(makeSnapshot(), NOW);
    const legacy: Record<string, unknown> = { ...current, version: 12, chapter: 41 };
    delete legacy.ascension;
    const migrated = parseGameSave(legacy);
    expect(migrated?.version).toBe(13);
    expect(migrated?.chapter).toBe(41);
    expect(migrated?.ascension).toEqual(createDefaultAscensionProgress());
  });

  it('rejects impossible Ascension balances and broken prerequisites', () => {
    const valid = createGameSave(makeSnapshot(), NOW);
    expect(parseGameSave({
      ...valid,
      ascension: {
        chaosStars: 2,
        lifetimeChaosStars: 1,
        ascensions: 0,
        highestResetChapter: 0,
        purchasedNodes: [],
        lastAscendedAt: null
      }
    })).toBeNull();

    expect(parseGameSave({
      ...valid,
      ascension: {
        chaosStars: 0,
        lifetimeChaosStars: 2,
        ascensions: 1,
        highestResetChapter: 21,
        purchasedNodes: ['merge-echo'],
        lastAscendedAt: NOW
      }
    })).toBeNull();
  });
});
