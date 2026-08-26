import { describe, expect, it } from 'vitest';
import { createStarterBoard } from './board';
import {
  albumDiscoveryBounty,
  allowsThirdChaosDraft,
  ascensionOffer,
  bossClearHealToFull,
  bossStartingHp,
  combatEnergyReserve,
  createAscensionStarterBoard,
  createDefaultAscensionProgress,
  fusionRepairAmount,
  performAscension,
  purchaseAscensionNode,
  strongestBoardMutation
} from './ascension';

describe('ascension progression', () => {
  it('unlocks after the first five Endless Rift chapters and scales rewards by rift tier', () => {
    expect(ascensionOffer(20)).toEqual({ eligible: false, completedChapter: 19, riftTier: 0, rewardStars: 0 });
    expect(ascensionOffer(21)).toEqual({ eligible: true, completedChapter: 20, riftTier: 1, rewardStars: 1 });
    expect(ascensionOffer(26)).toEqual({ eligible: true, completedChapter: 25, riftTier: 2, rewardStars: 2 });
    expect(ascensionOffer(36).rewardStars).toBe(4);
  });

  it('awards permanent stars and records the deepest ascended rift tier', () => {
    const first = performAscension(createDefaultAscensionProgress(), 26);
    expect(first.ascended).toBe(true);
    expect(first.rewardStars).toBe(2);
    expect(first.progress).toMatchObject({ chaosStars: 2, totalChaosStars: 2, ascensions: 1, highestRiftTier: 2 });
    const second = performAscension(first.progress, 21);
    expect(second.progress).toMatchObject({ chaosStars: 3, totalChaosStars: 3, ascensions: 2, highestRiftTier: 2 });
  });

  it('enforces branch prerequisites and finite star costs', () => {
    const seeded = { ...createDefaultAscensionProgress(), chaosStars: 5 };
    expect(purchaseAscensionNode(seeded, 'repair-fusion').purchased).toBe(false);
    const root = purchaseAscensionNode(seeded, 'loaded-grid');
    expect(root.purchased).toBe(true);
    expect(root.progress.chaosStars).toBe(4);
    const child = purchaseAscensionNode(root.progress, 'repair-fusion');
    expect(child.purchased).toBe(true);
    expect(child.progress.chaosStars).toBe(2);
    expect(purchaseAscensionNode(child.progress, 'repair-fusion').purchased).toBe(false);
  });

  it('turns purchased nodes into rule changes rather than generic stat levels', () => {
    let progress = { ...createDefaultAscensionProgress(), chaosStars: 20 };
    for (const id of ['loaded-grid', 'repair-fusion', 'boss-fracture', 'boss-refit', 'third-draft', 'chaos-reserve', 'album-bounty', 'mutation-anchor'] as const) {
      const result = purchaseAscensionNode(progress, id);
      expect(result.purchased).toBe(true);
      progress = result.progress;
    }
    expect(fusionRepairAmount(progress)).toBe(2);
    expect(bossStartingHp(1000, progress)).toBe(920);
    expect(bossClearHealToFull(progress)).toBe(true);
    expect(allowsThirdChaosDraft(progress)).toBe(true);
    expect(combatEnergyReserve(progress)).toBe(20);
    expect(albumDiscoveryBounty(progress)).toBe(25);
  });

  it('creates a richer reset board and anchors the strongest mutation when unlocked', () => {
    let progress = { ...createDefaultAscensionProgress(), chaosStars: 4 };
    progress = purchaseAscensionNode(progress, 'loaded-grid').progress;
    progress = purchaseAscensionNode(progress, 'album-bounty').progress;
    progress = purchaseAscensionNode(progress, 'mutation-anchor').progress;
    const board = [...createStarterBoard()];
    board[7] = { id: 'crown', family: 'lampalotl', level: 3, mutation: 'crowned' };
    board[8] = { id: 'epic', family: 'dishnail', level: 3, mutation: 'prismatic' };
    expect(strongestBoardMutation(board)).toBe('crowned');
    const reset = createAscensionStarterBoard(progress, strongestBoardMutation(board));
    expect(reset[0]?.mutation).toBe('crowned');
    expect(reset[8]?.family).toBe('pinguino');
    expect(reset[9]?.family).toBe('pinguino');
  });
});
