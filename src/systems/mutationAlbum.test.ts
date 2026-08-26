import { describe, expect, it } from 'vitest';
import { createStarterBoard } from './board';
import { COLLECTION_KEYS, createDefaultCollectionProgress, discoverCreature } from './collectionProgression';
import {
  MUTATION_ALBUM_TOTAL,
  backfillMutationAlbumProgress,
  claimMutationAlbumMilestone,
  createDefaultMutationAlbumProgress,
  discoverMutationAlbumEntry,
  hasMutationAlbumClaimAvailable,
  isMutationAlbumKey,
  mutationAlbumCompletion,
  mutationAlbumCountForCreature,
  mutationAlbumKey,
  nextMutationAlbumMilestone
} from './mutationAlbum';

describe('mutation album', () => {
  it('derives 4 collectible mutation states from every live creature form', () => {
    expect(MUTATION_ALBUM_TOTAL).toBe(COLLECTION_KEYS.length * 4);
    expect(MUTATION_ALBUM_TOTAL).toBe(144);
  });

  it('records each creature/mutation combination once', () => {
    const creature = COLLECTION_KEYS[0];
    let progress = createDefaultMutationAlbumProgress();
    progress = discoverMutationAlbumEntry(progress, creature, 'charged');
    const duplicate = discoverMutationAlbumEntry(progress, creature, 'charged');
    const crowned = discoverMutationAlbumEntry(duplicate, creature, 'crowned');
    expect(duplicate).toBe(progress);
    expect(crowned.discovered).toHaveLength(2);
    expect(mutationAlbumCountForCreature(crowned, creature)).toBe(2);
    expect(isMutationAlbumKey(mutationAlbumKey(creature, 'crowned'))).toBe(true);
    expect(isMutationAlbumKey('fake-1:crowned')).toBe(false);
  });

  it('backfills legacy discoveries as Normal and preserves rarities visible on the board', () => {
    const starter = createStarterBoard();
    const board = [...starter];
    board[2] = { id: 'rare-lamp', family: 'lampalotl', level: 2, mutation: 'prismatic' };
    let collection = createDefaultCollectionProgress(starter);
    collection = discoverCreature(collection, 'lampalotl-2');

    const progress = backfillMutationAlbumProgress(collection, board);
    expect(progress.discovered).toContain('pinguino-1:none');
    expect(progress.discovered).toContain('toastodilo-1:none');
    expect(progress.discovered).toContain('lampalotl-2:none');
    expect(progress.discovered).toContain('lampalotl-2:prismatic');
  });

  it('exposes completion and finite claimable milestones', () => {
    let progress = createDefaultMutationAlbumProgress();
    for (const creature of COLLECTION_KEYS.slice(0, 3)) {
      for (const mutation of ['none', 'charged', 'prismatic', 'crowned'] as const) {
        progress = discoverMutationAlbumEntry(progress, creature, mutation);
      }
    }
    expect(mutationAlbumCompletion(progress)).toEqual({ current: 12, total: 144, percent: 8 });
    expect(nextMutationAlbumMilestone(progress)?.target).toBe(12);
    expect(hasMutationAlbumClaimAvailable(progress)).toBe(true);
    const claimed = claimMutationAlbumMilestone(progress, 12);
    expect(claimed.claimed).toBe(true);
    expect(claimed.reward.coins).toBe(150);
    expect(nextMutationAlbumMilestone(claimed.progress)?.target).toBe(36);
    expect(hasMutationAlbumClaimAvailable(claimed.progress)).toBe(false);
    expect(claimMutationAlbumMilestone(claimed.progress, 12).claimed).toBe(false);
  });
});
