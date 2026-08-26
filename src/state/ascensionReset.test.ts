import { describe, expect, it } from 'vitest';
import { createStarterBoard } from '../systems/board';
import { createDefaultCollectionProgress } from '../systems/collectionProgression';
import { createDefaultDailyState } from '../systems/dailyRetention';
import { createDefaultMetaUpgradeLevels } from '../systems/metaProgression';
import { backfillMutationAlbumProgress } from '../systems/mutationAlbum';
import { createCompletedOnboardingState } from '../systems/onboarding';
import { createDefaultWeeklyChaosProgress } from '../systems/weeklyChaos';
import { createGameSave } from './save';
import { applyAscensionToSave } from './ascensionReset';

const NOW = Date.parse('2026-08-26T10:00:00.000Z');

function makeSave() {
  const board = createStarterBoard();
  const collection = createDefaultCollectionProgress(board);
  return createGameSave({
    coins: 999,
    coreShards: 14,
    upgrades: { ...createDefaultMetaUpgradeLevels(), power: 3 },
    daily: createDefaultDailyState(NOW),
    collection,
    onboarding: createCompletedOnboardingState(NOW - 1000),
    anomalyHunt: { charge: 17, secretPity: 69, totalPulls: 120, secretsFound: 2 },
    mutationAlbum: backfillMutationAlbumProgress(collection, board),
    weeklyChaos: createDefaultWeeklyChaosProgress(NOW),
    ascension: {
      chaosStars: 4,
      lifetimeChaosStars: 6,
      ascensions: 1,
      highestResetChapter: 31,
      purchasedNodes: ['merge-seed-cache', 'collection-pity-memory'],
      lastAscendedAt: NOW - 5000
    },
    baseHp: 37,
    chapter: 36,
    encounterStep: 4,
    targetHpMax: 5000,
    targetHp: 1337,
    recruitSerial: 42,
    board,
    chaosPerks: ['impact-jelly']
  }, NOW);
}

describe('applyAscensionToSave', () => {
  it('resets campaign state while preserving permanent progression', () => {
    const before = makeSave();
    const result = applyAscensionToSave(before, NOW + 1000);
    expect(result.performed).toBe(true);
    expect(result.ascension.preview).toMatchObject({ chapter: 36, starsAwarded: 4, lifetimeStarsAfter: 10 });
    expect(result.save).toMatchObject({
      version: 14,
      coins: 200,
      coreShards: 14,
      chapter: 1,
      encounterStep: 0,
      baseHp: 100,
      recruitSerial: 0,
      chaosPerks: []
    });
    expect(result.save.upgrades).toEqual(before.upgrades);
    expect(result.save.daily).toEqual(before.daily);
    expect(result.save.collection).toEqual(before.collection);
    expect(result.save.mutationAlbum).toEqual(before.mutationAlbum);
    expect(result.save.onboarding).toEqual(before.onboarding);
    expect(result.save.weeklyChaos).toEqual(before.weeklyChaos);
    expect(result.save.bossHunt).toEqual(before.bossHunt);
    expect(result.save.bossTrophies).toEqual(before.bossTrophies);
    expect(result.save.anomalyHunt).toEqual({ charge: 8, secretPity: 34, totalPulls: 120, secretsFound: 2 });
    expect(result.save.ascension).toMatchObject({ chaosStars: 8, lifetimeChaosStars: 10, ascensions: 2, highestResetChapter: 36 });
    expect(result.save.board).toEqual(createStarterBoard());
    expect(result.save.targetHp).toBe(result.save.targetHpMax);
  });

  it('does not mutate the save while Weekly Chaos is active', () => {
    const before = makeSave();
    const weeklyActive = createGameSave({
      ...before,
      weeklyChaos: { ...before.weeklyChaos, active: true, runsStarted: 1 }
    }, NOW);
    const result = applyAscensionToSave(weeklyActive, NOW + 1000);
    expect(result.performed).toBe(false);
    expect(result.ascension.preview.reason).toBe('weekly-active');
    expect(result.save).toBe(weeklyActive);
  });
});
