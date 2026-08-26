import { describe, expect, it } from 'vitest';
import {
  ASCENSION_NODES,
  createDefaultAscensionProgress,
  getAscensionEffects,
  getLifetimeStarsForMilestone,
  isValidAscensionProgress,
  performAscension,
  previewAscension,
  purchaseAscensionNode
} from './ascension';

describe('Ascension', () => {
  it('unlocks at Chapter 21 and only pays new Rift milestones', () => {
    const base = createDefaultAscensionProgress();
    expect(previewAscension(base, 20)).toMatchObject({ eligible: false, reason: 'chapter', nextChapter: 21 });
    expect(previewAscension(base, 21)).toMatchObject({ eligible: true, starsAwarded: 1, lifetimeStarsAfter: 1, nextChapter: 26 });

    const first = performAscension(base, 21, 1000);
    expect(first.performed).toBe(true);
    expect(first.progress).toMatchObject({ chaosStars: 1, lifetimeChaosStars: 1, ascensions: 1, highestResetChapter: 21, lastAscendedAt: 1000 });
    expect(previewAscension(first.progress, 21)).toMatchObject({ eligible: false, reason: 'push-deeper', starsAwarded: 0, nextChapter: 26 });
    expect(previewAscension(first.progress, 26)).toMatchObject({ eligible: true, starsAwarded: 2, lifetimeStarsAfter: 3, nextChapter: 31 });
  });

  it('uses triangular lifetime awards so repeated resets cannot farm Chaos Stars', () => {
    expect(getLifetimeStarsForMilestone(0)).toBe(0);
    expect(getLifetimeStarsForMilestone(1)).toBe(1);
    expect(getLifetimeStarsForMilestone(2)).toBe(3);
    expect(getLifetimeStarsForMilestone(3)).toBe(6);
    expect(getLifetimeStarsForMilestone(7)).toBe(28);
  });

  it('blocks ascension during an active Weekly Chaos attempt', () => {
    const progress = createDefaultAscensionProgress();
    expect(previewAscension(progress, 31, true)).toMatchObject({ eligible: false, reason: 'weekly-active', starsAwarded: 0 });
    expect(performAscension(progress, 31, 1000, true)).toMatchObject({ performed: false, resetPlan: null });
  });

  it('preserves collection-critical meta systems in the reset contract', () => {
    const result = performAscension(createDefaultAscensionProgress(), 21, 1000);
    expect(result.resetPlan).toMatchObject({
      chapter: 1,
      encounterStep: 0,
      coins: 160,
      clearBoard: true,
      refillFortress: true,
      clearChaosPerks: true,
      preserveCoreLab: true,
      preserveDaily: true,
      preserveCollection: true,
      preserveMutationAlbum: true,
      preserveAchievements: true,
      preserveOnboarding: true
    });
  });

  it('requires branch prerequisites and spends a bounded permanent currency sink', () => {
    const funded = { ...createDefaultAscensionProgress(), chaosStars: 6, lifetimeChaosStars: 6 };
    expect(purchaseAscensionNode(funded, 'merge-echo')).toMatchObject({ purchased: false, reason: 'prerequisite' });

    const tier1 = purchaseAscensionNode(funded, 'merge-seed-cache');
    expect(tier1).toMatchObject({ purchased: true, reason: null });
    expect(tier1.progress.chaosStars).toBe(5);

    const tier2 = purchaseAscensionNode(tier1.progress, 'merge-echo');
    expect(tier2.purchased).toBe(true);
    expect(tier2.progress.chaosStars).toBe(3);

    const tier3 = purchaseAscensionNode(tier2.progress, 'merge-catalyst');
    expect(tier3.purchased).toBe(true);
    expect(tier3.progress.chaosStars).toBe(0);
    expect(purchaseAscensionNode(tier3.progress, 'merge-catalyst')).toMatchObject({ purchased: false, reason: 'owned' });
  });

  it('maps tree ownership to rule-changing effects instead of only stat inflation', () => {
    const effects = getAscensionEffects([
      'merge-seed-cache', 'merge-echo', 'merge-catalyst',
      'combat-last-stand', 'combat-boss-window', 'combat-victory-repair',
      'chaos-reroute', 'chaos-bank', 'chaos-fourth-door',
      'collection-pity-memory', 'collection-album-cache', 'collection-signal-map'
    ]);
    expect(effects).toEqual({
      startingRecruitCredits: 2,
      mergeEchoInterval: 8,
      mergeEchoRecruitCredits: 1,
      tierThreeMutationBoost: true,
      fortressLastStandCharges: 1,
      bossOpeningDelayMs: 1500,
      bossVictoryRepairRatio: 0.2,
      draftRerollsPerChapter: 1,
      chaosEnergyCarryRatio: 0.25,
      extraDraftChoiceEveryChapters: 5,
      anomalyPityCarryRatio: 0.5,
      firstAlbumDiscoveryCoreShards: 1,
      revealUndiscoveredAlbumTarget: true
    });
  });

  it('defines four complete 1/2/3-cost branches for a 24-Star total sink', () => {
    expect(ASCENSION_NODES).toHaveLength(12);
    expect(new Set(ASCENSION_NODES.map((node) => node.branch))).toEqual(new Set(['merge', 'combat', 'chaos', 'collection']));
    expect(ASCENSION_NODES.reduce((sum, node) => sum + node.cost, 0)).toBe(24);
  });

  it('rejects duplicate, dependency-invalid and overspent persisted progress', () => {
    expect(isValidAscensionProgress(createDefaultAscensionProgress())).toBe(true);
    expect(isValidAscensionProgress({
      ...createDefaultAscensionProgress(),
      chaosStars: 0,
      lifetimeChaosStars: 1,
      purchasedNodes: ['merge-echo']
    })).toBe(false);
    expect(isValidAscensionProgress({
      ...createDefaultAscensionProgress(),
      chaosStars: 0,
      lifetimeChaosStars: 1,
      purchasedNodes: ['merge-seed-cache', 'merge-seed-cache']
    })).toBe(false);
  });
});
