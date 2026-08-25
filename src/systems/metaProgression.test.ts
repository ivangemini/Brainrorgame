import { afterEach, describe, expect, it } from 'vitest';
import {
  beginActiveAbilityEncounter,
  recordCrewAttackEnergy,
  resetActiveAbilityRuntime,
  tryCastCurrentActiveAbility
} from './activeAbilities';
import type { BoardState } from './board';
import { resetCrewSynergyState, syncCrewSynergyState } from './crewSynergies';
import {
  bossCoreReward,
  coinRewardMultiplier,
  createDefaultMetaUpgradeLevels,
  getUpgradeCost,
  incomingDamageMultiplier,
  purchaseMetaUpgrade,
  squadDamageMultiplier
} from './metaProgression';

afterEach(() => {
  resetCrewSynergyState();
  resetActiveAbilityRuntime();
});

describe('meta progression', () => {
  it('makes the first permanent upgrade available after one boss', () => {
    const levels = createDefaultMetaUpgradeLevels();
    expect(getUpgradeCost('power', levels)).toBe(1);
    const result = purchaseMetaUpgrade(1, levels, 'power');
    expect(result.purchased).toBe(true);
    expect(result.shards).toBe(0);
    expect(result.levels.power).toBe(1);
    expect(getUpgradeCost('power', result.levels)).toBe(2);
  });

  it('does not mutate progression when shards are insufficient', () => {
    const levels = createDefaultMetaUpgradeLevels();
    const result = purchaseMetaUpgrade(0, levels, 'armor');
    expect(result).toEqual({ purchased: false, shards: 0, levels });
  });

  it('applies bounded combat and economy multipliers without crew synergy', () => {
    const levels = { power: 3, armor: 8, bounty: 4 };
    expect(squadDamageMultiplier(levels)).toBeCloseTo(1.24);
    expect(incomingDamageMultiplier(levels)).toBeCloseTo(0.52);
    expect(coinRewardMultiplier(levels)).toBeCloseTo(1.4);
  });

  it('stacks Toastodilo armor and Dishnail bounty with meta upgrades', () => {
    const board: BoardState = [
      { id: 't3a', family: 'toastodilo', level: 3, mutation: 'none' },
      { id: 't3b', family: 'toastodilo', level: 3, mutation: 'none' },
      { id: 'd3a', family: 'dishnail', level: 3, mutation: 'none' },
      { id: 'd3b', family: 'dishnail', level: 3, mutation: 'none' },
      null, null, null, null, null, null, null, null
    ];
    syncCrewSynergyState(board);
    expect(incomingDamageMultiplier({ power: 0, armor: 0, bounty: 0 })).toBeCloseTo(0.85);
    expect(incomingDamageMultiplier({ power: 0, armor: 8, bounty: 0 })).toBeCloseTo(0.442);
    expect(coinRewardMultiplier({ power: 0, armor: 0, bounty: 4 })).toBeCloseTo(1.652);
  });

  it('stacks temporary Guard and Jackpot windows with passive and permanent progression', () => {
    const board: BoardState = [
      { id: 't3a', family: 'toastodilo', level: 3, mutation: 'none' },
      { id: 't3b', family: 'toastodilo', level: 3, mutation: 'none' },
      { id: 'd3a', family: 'dishnail', level: 3, mutation: 'none' },
      { id: 'd3b', family: 'dishnail', level: 3, mutation: 'none' },
      null, null, null, null, null, null, null, null
    ];
    syncCrewSynergyState(board);
    beginActiveAbilityEncounter('test-meta-active');
    for (let index = 0; index < 100; index += 1) recordCrewAttackEnergy();
    expect(tryCastCurrentActiveAbility('crust-guard', 3).cast).toBe(true);
    for (let index = 0; index < 100; index += 1) recordCrewAttackEnergy();
    expect(tryCastCurrentActiveAbility('quasar-jackpot', 3).cast).toBe(true);

    expect(incomingDamageMultiplier({ power: 0, armor: 0, bounty: 0 })).toBeCloseTo(0.493);
    expect(coinRewardMultiplier({ power: 0, armor: 0, bounty: 4 })).toBeCloseTo(2.9736);
  });

  it('accelerates normal core rewards while layering authored world-finale bonuses', () => {
    expect(bossCoreReward(1)).toBe(1);
    expect(bossCoreReward(5)).toBe(3);
    expect(bossCoreReward(6)).toBe(2);
    expect(bossCoreReward(10)).toBe(5);
    expect(bossCoreReward(15)).toBe(8);
    expect(bossCoreReward(16)).toBe(4);
    expect(bossCoreReward(26)).toBe(6);
    expect(bossCoreReward(100)).toBe(8);
  });
});
