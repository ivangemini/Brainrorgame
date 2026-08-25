import { describe, expect, it } from 'vitest';
import { createStarterBoard, moveOrMerge, type BoardState } from './board';
import {
  evaluateCrewSynergies,
  getCurrentCrewSynergyState,
  resetCrewSynergyState,
  syncCrewSynergyState,
  tierForPower,
  unitPower
} from './crewSynergies';

describe('crew synergies', () => {
  it('derives merge-stable family power from creature tiers', () => {
    expect(unitPower(1)).toBe(1);
    expect(unitPower(2)).toBe(2);
    expect(unitPower(3)).toBe(4);
    expect(tierForPower(1)).toBe(0);
    expect(tierForPower(2)).toBe(1);
    expect(tierForPower(4)).toBe(2);
    expect(tierForPower(8)).toBe(3);
  });

  it('starts with the original starter synergies and zero new-family power', () => {
    const state = evaluateCrewSynergies(createStarterBoard());
    expect(state.familyPower).toEqual({
      pinguino: 2, toastodilo: 2, lampalotl: 0, dishnail: 0, mochimoth: 0, routeraptor: 0, vendinguana: 0
    });
    expect(state.tiers.pinguino).toBe(1);
    expect(state.tiers.toastodilo).toBe(1);
    expect(state.tiers.mochimoth).toBe(0);
    expect(state.energyGainMultiplier).toBe(1);
    expect(state.bossDamageMultiplier).toBe(1);
  });

  it('does not punish a normal merge by reducing family power', () => {
    const before = createStarterBoard();
    const merged = moveOrMerge(before, 0, 1);
    expect(merged.action).toBe('merge');
    const beforeState = evaluateCrewSynergies(before);
    const afterState = evaluateCrewSynergies(merged.board);
    expect(afterState.familyPower.pinguino).toBe(beforeState.familyPower.pinguino);
    expect(afterState.tiers.pinguino).toBe(beforeState.tiers.pinguino);
  });

  it('stacks all seven family identities at higher power tiers', () => {
    const board: BoardState = [
      { id: 'p3a', family: 'pinguino', level: 3, mutation: 'none' },
      { id: 'p3b', family: 'pinguino', level: 3, mutation: 'charged' },
      { id: 't3', family: 'toastodilo', level: 3, mutation: 'none' },
      { id: 'l3', family: 'lampalotl', level: 3, mutation: 'none' },
      { id: 'd3a', family: 'dishnail', level: 3, mutation: 'none' },
      { id: 'd3b', family: 'dishnail', level: 3, mutation: 'prismatic' },
      { id: 'm3a', family: 'mochimoth', level: 3, mutation: 'none' },
      { id: 'm3b', family: 'mochimoth', level: 3, mutation: 'none' },
      { id: 'r3a', family: 'routeraptor', level: 3, mutation: 'none' },
      { id: 'r3b', family: 'routeraptor', level: 3, mutation: 'none' },
      { id: 'v3a', family: 'vendinguana', level: 3, mutation: 'none' },
      { id: 'v3b', family: 'vendinguana', level: 3, mutation: 'none' }
    ];
    const state = evaluateCrewSynergies(board);
    expect(state.tiers.pinguino).toBe(3);
    expect(state.tiers.dishnail).toBe(3);
    expect(state.tiers.mochimoth).toBe(3);
    expect(state.tiers.routeraptor).toBe(3);
    expect(state.tiers.vendinguana).toBe(3);
    expect(state.attackIntervalMultiplier).toBe(0.9);
    expect(state.incomingDamageMultiplier).toBeCloseTo(0.91 * 0.91);
    expect(state.squadDamageMultiplier).toBe(1.08);
    expect(state.coinRewardMultiplier).toBe(1.18);
    expect(state.energyGainMultiplier).toBe(1.28);
    expect(state.bossDamageMultiplier).toBe(1.30);
  });

  it('keeps a resettable runtime snapshot for combat consumers', () => {
    resetCrewSynergyState();
    expect(getCurrentCrewSynergyState().tiers.pinguino).toBe(0);
    const synced = syncCrewSynergyState(createStarterBoard());
    expect(synced.tiers.pinguino).toBe(1);
    expect(getCurrentCrewSynergyState()).toBe(synced);
    resetCrewSynergyState();
  });
});
