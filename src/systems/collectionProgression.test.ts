import { describe, expect, it } from 'vitest';
import { createStarterBoard } from './board';
import {
  COLLECTION_KEYS,
  achievementProgress,
  backfillCollectionProgress,
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

  it('derives the codex keys from the complete creature roster', () => {
    expect(COLLECTION_KEYS).toHaveLength(9);
    expect(COLLECTION_KEYS).toContain('lampalotl-3');
  });

  it('backfills lower tiers and minimum legacy stats', () => {
    const board = [...createStarterBoard()];
    board[0] = { id: 'legacy', family: 'pinguino', level: 3 };
    board[1] = null;
    const progress = backfillCollectionProgress(board, 4, 2, 7, { power: 1, armor: 2, bounty: 0 });
    expect(progress.discovered).toContain('pinguino-3');
    expect(progress.discovered).toContain('pinguino-1');
    expect(progress.stats.bosses).toBe(3);
    expect(progress.stats.defeats).toBe(14);
    expect(progress.stats.recruits).toBe(7);
    expect(progress.stats.upgrades).toBe(3);
  });

  it('discovers new Lampalotl tiers and rejects unknown collection keys', () => {
    const progress = discoverCreature(createDefaultCollectionProgress(), 'lampalotl-2');
    expect(progress.discovered).toEqual(['lampalotl-2']);
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
