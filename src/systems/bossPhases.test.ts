import { afterEach, describe, expect, it } from 'vitest';
import { getBossForChapter } from '../content/bosses';
import { createDefaultAscensionProgress } from './ascension';
import { resetCurrentAscensionProgress, syncCurrentAscensionProgress } from './ascensionRuntime';
import {
  applyBossAttackInterval,
  applyBossIncomingDamage,
  applyBossOutgoingDamage,
  clearBossPhaseRuntime,
  currentBossOpeningDelayMs,
  currentBossOutgoingDamageMultiplier,
  getBossPhaseState,
  syncBossPhaseRuntime
} from './bossPhases';

afterEach(() => {
  clearBossPhaseRuntime();
  resetCurrentAscensionProgress();
});

describe('boss phases', () => {
  const boss = getBossForChapter(1);

  it('moves through open, shield, weak and enraged windows from HP alone', () => {
    expect(getBossPhaseState(boss.phases, 800, 1000)).toMatchObject({ phase: 1, window: 'open', enrage: false });
    expect(getBossPhaseState(boss.phases, 650, 1000)).toMatchObject({ phase: 2, window: 'shield', enrage: false });
    expect(getBossPhaseState(boss.phases, 500, 1000)).toMatchObject({ phase: 2, window: 'weak', enrage: false });
    expect(getBossPhaseState(boss.phases, 350, 1000)).toMatchObject({ phase: 3, window: 'shield', enrage: true });
    expect(getBossPhaseState(boss.phases, 200, 1000)).toMatchObject({ phase: 3, window: 'weak', enrage: true });
  });

  it('makes shield windows resistant and weak windows reward burst timing', () => {
    const shield = getBossPhaseState(boss.phases, 650, 1000);
    const weak = getBossPhaseState(boss.phases, 500, 1000);
    expect(applyBossIncomingDamage(100, shield)).toBeLessThan(100);
    expect(applyBossIncomingDamage(100, weak)).toBeGreaterThan(100);
  });

  it('ramps attack pressure in phases two and three', () => {
    const phaseOne = getBossPhaseState(boss.phases, 900, 1000);
    const phaseTwo = getBossPhaseState(boss.phases, 600, 1000);
    const phaseThree = getBossPhaseState(boss.phases, 300, 1000);
    expect(applyBossAttackInterval(4000, phaseTwo)).toBeLessThan(applyBossAttackInterval(4000, phaseOne));
    expect(applyBossAttackInterval(4000, phaseThree)).toBeLessThan(applyBossAttackInterval(4000, phaseTwo));
    expect(applyBossOutgoingDamage(10, phaseTwo)).toBeGreaterThanOrEqual(10);
    expect(applyBossOutgoingDamage(10, phaseThree)).toBeGreaterThanOrEqual(applyBossOutgoingDamage(10, phaseTwo));
  });

  it('delays only the opening boss attack when Boss Window is owned', () => {
    syncCurrentAscensionProgress({
      ...createDefaultAscensionProgress(),
      purchasedNodes: ['combat-last-stand', 'combat-boss-window']
    });
    syncBossPhaseRuntime(boss.phases, 1000, 1000);
    expect(currentBossOpeningDelayMs()).toBe(1500);
    currentBossOutgoingDamageMultiplier();
    expect(currentBossOpeningDelayMs()).toBe(0);
  });

  it('keeps every configured boss profile ordered and tactically bounded', () => {
    for (let chapter = 1; chapter <= 4; chapter += 1) {
      const profile = getBossForChapter(chapter).phases;
      expect(profile.phaseTwoRatio).toBeGreaterThan(profile.phaseThreeRatio);
      expect(profile.phaseTwoWeakRatio).toBeLessThan(profile.phaseTwoRatio);
      expect(profile.phaseTwoWeakRatio).toBeGreaterThan(profile.phaseThreeRatio);
      expect(profile.phaseThreeWeakRatio).toBeLessThan(profile.phaseThreeRatio);
      expect(profile.shieldDamageTakenMultiplier).toBeGreaterThanOrEqual(0.45);
      expect(profile.shieldDamageTakenMultiplier).toBeLessThan(0.7);
      expect(profile.weakDamageTakenMultiplier).toBeGreaterThan(1.25);
      expect(profile.weakDamageTakenMultiplier).toBeLessThanOrEqual(1.5);
    }
  });
});
