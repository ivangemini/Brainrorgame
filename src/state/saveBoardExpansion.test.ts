import { describe, expect, it } from 'vitest';
import { createDefaultAnomalyHuntState } from '../systems/anomalyHunt';
import { BOARD_SIZE, createStarterBoard } from '../systems/board';
import { createDefaultCollectionProgress } from '../systems/collectionProgression';
import { createDefaultDailyState } from '../systems/dailyRetention';
import { createDefaultMetaUpgradeLevels } from '../systems/metaProgression';
import { backfillMutationAlbumProgress } from '../systems/mutationAlbum';
import { createDefaultOnboardingState } from '../systems/onboarding';
import { createDefaultWeeklyChaosProgress } from '../systems/weeklyChaos';
import { createGameSave, parseGameSave } from './save';

describe('expanded board save compatibility', () => {
  it('loads a historical twelve-slot v14 board and appends three empty crew slots', () => {
    const now = Date.parse('2026-08-26T12:00:00.000Z');
    const board = createStarterBoard();
    const collection = createDefaultCollectionProgress(board);
    const current = createGameSave({
      coins: 120,
      coreShards: 0,
      upgrades: createDefaultMetaUpgradeLevels(),
      daily: createDefaultDailyState(now),
      collection,
      onboarding: createDefaultOnboardingState(),
      anomalyHunt: createDefaultAnomalyHuntState(),
      mutationAlbum: backfillMutationAlbumProgress(collection, board),
      weeklyChaos: createDefaultWeeklyChaosProgress(now),
      baseHp: 100,
      chapter: 1,
      encounterStep: 0,
      targetHpMax: 100,
      targetHp: 100,
      recruitSerial: 0,
      board,
      chaosPerks: []
    }, now);

    const historical = { ...current, board: current.board.slice(0, 12) };
    const parsed = parseGameSave(historical);
    expect(parsed?.board).toHaveLength(BOARD_SIZE);
    expect(parsed?.board.slice(0, 12)).toEqual(historical.board);
    expect(parsed?.board.slice(12)).toEqual([null, null, null]);
  });
});
