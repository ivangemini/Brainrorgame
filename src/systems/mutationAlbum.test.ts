import { describe, expect, it } from 'vitest';
import { createStarterBoard } from './board';
import { COLLECTION_KEYS, createDefaultCollectionProgress, discoverCreature } from './collectionProgression';
import {
  MUTATION_ALBUM_TOTAL,
  backfillMutationAlbumProgress,
  claimMutationAlbumMilestone,
  createDefaultMutationAlbumProgress,
  discoverMutationAlbumEntry,
  hasMutationAlbumMilestoneClaimAvailable,
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

  it('backfills only evidence that historical saves can prove', () => {
    const board = [...createStarterBoard()];
    board[8] = { id: 'rare-current', family: 'lampalotl', level: 2, mutation: 'prismatic' };
    let collection = createDefaultCollectionProgress(board);
    collection = discoverCreature(collection, 'microwhale-3');
    const progress = backfillMutationAlbumProgress(collection, board);

    expect(progress.discovered).toContain('pinguino-1:none');
    expect(progress.discovered).toContain('toastodilo-1:none');
    expect(progress.discovered).toContain('lampalotl-2:none');
    expect(progress.discovered).toContain('lampalotl-2:prismatic');
    expect(progress.discovered).toContain('microwhale-3:none');
    expect(progress.discovered).not.toContain('microwhale-3:prismatic');
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
    expect(hasMutationAlbumMilestoneClaimAvailable(progress)).toBe(true);
    const claimed = claimMutationAlbumMilestone(progress, 12);
    expect(claimed.claimed).toBe(true);
    expect(claimed.reward.coins).toBe(150);
    expect(nextMutationAlbumMilestone(claimed.progress)?.target).toBe(36);
    expect(hasMutationAlbumMilestoneClaimAvailable(claimed.progress)).toBe(false);
    expect(claimMutationAlbumMilestone(claimed.progress, 12).claimed).toBe(false);
  });
});
