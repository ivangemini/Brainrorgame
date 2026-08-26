import { describe, expect, it } from 'vitest';
import {
  ascensionRequiredChapter,
  ascensionReward,
  canAscend,
  createDefaultAscensionState,
  getAscensionEffects,
  performAscension,
  purchaseAscensionNode
} from './ascension';

describe('Rift Ascension', () => {
  it('opens the first reset at chapter 20 and raises the next requirement', () => {
    const state = createDefaultAscensionState();
    expect(ascensionRequiredChapter(state)).toBe(20);
    expect(canAscend(state, 19)).toBe(false);
    expect(ascensionReward(state, 20)).toBe(3);
    const result = performAscension(state, 20);
    expect(result.ascended).toBe(true);
    expect(result.starsGained).toBe(3);
    expect(result.next.chaosStars).toBe(3);
    expect(result.next.totalAscensions).toBe(1);
    expect(result.next.highestChapter).toBe(20);
    expect(ascensionRequiredChapter(result.next)).toBe(25);
  });

  it('rewards deeper Rift pushes without allowing an early reset', () => {
    const state = createDefaultAscensionState();
    expect(ascensionReward(state, 30)).toBe(5);
    const once = performAscension(state, 30).next;
    expect(ascensionReward(once, 24)).toBe(0);
    expect(ascensionReward(once, 25)).toBe(3);
  });

  it('enforces branch prerequisites and Chaos Star costs', () => {
    let state = { ...createDefaultAscensionState(), chaosStars: 7 };
    const blocked = purchaseAscensionNode(state, 'recruit-catalyst');
    expect(blocked).toBe(state);
    state = purchaseAscensionNode(state, 'fusion-rebate');
    expect(state.chaosStars).toBe(6);
    state = purchaseAscensionNode(state, 'recruit-catalyst');
    expect(state.chaosStars).toBe(3);
    expect(state.unlockedNodes).toEqual(['fusion-rebate', 'recruit-catalyst']);
    expect(getAscensionEffects(state)).toMatchObject({ mergeCoinRefund: 4, recruitCostDiscount: 4 });
  });

  it('turns tree nodes into rule-changing runtime effects', () => {
    const state = {
      ...createDefaultAscensionState(),
      unlockedNodes: ['execution-protocol', 'rift-capacitor', 'ability-recycler', 'mutation-lens', 'album-resonance'] as const
    };
    expect(getAscensionEffects(state)).toMatchObject({
      bossExecuteRatio: 0.12,
      bossExecuteDamageMultiplier: 1.5,
      startingChaosEnergy: 15,
      abilityEnergyRefund: 8,
      mutationLuckShift: 0.03,
      albumMilestoneStarBonus: 1
    });
  });
});
