import { describe, expect, it } from 'vitest';
import { createStarterBoard } from './board';
import {
  achievementProgress,
  claimAchievement,
  createDefaultCollectionProgress,
  discoverCreature,
  discoverFromBoard,
  recordLifetimeEvent
} from './collectionProgression';

describe('collection progression', () => {
  it('discovers starter creatures from the board without duplicates', () => {
    const progress = discoverFromBoard(createDefaultCollectionProgress(), createStarterBoard());
    expect(progress.discovered).toEqual(['pinguino-1', 'toastodilo-1']);
  });

  it('backfills lower tiers when a higher tier is present', () => {
    const board = createStarterBoard().map(() => null);
    board[0] = { id: 'legacy', family: 'pinguino', level: 3 };
    const progress = discoverFromBoard(createDefaultCollectionProgress(), board);
    expect(progress.discovered).toEqual(['pinguino-1', 'pinguino-2', 'pinguino-3']);
  });

  it('rejects unknown collection keys', () => {
    const progress = createDefaultCollectionProgress();
    expect(discoverCreature(progress, 'stolen-meme-999')).toBe(progress);
  });

  it('unlocks and claims an achievement once', () => {
    const progress = recordLifetimeEvent(createDefaultCollectionProgress(), 'merge');
    expect(achievementProgress(progress, 'first-fusion').ready).toBe(true);
    const first = claimAchievement(progress, 'first-fusion');
    const second = claimAchievement(first.progress, 'first-fusion');
    expect(first.claimed).toBe(true);
    expect(first.reward.coins).toBe(50);
    expect(second.claimed).toBe(false);
  });
});
