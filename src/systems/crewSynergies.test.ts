import { describe, expect, it } from 'vitest';
import { createStarterBoard, moveOrMerge, type BoardState } from './board';
import { evaluateCrewSynergies, tierForPower, unitPower } from './crewSynergies';

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

  it('starts with Slipstream Relay and Crust Bastion tier one', () => {
    const state = evaluateCrewSynergies(createStarterBoard());
    expect(state.familyPower).toEqual({ pinguino: 2, toastodilo: 2, lampalotl: 0, dishnail: 0 });
    expect(state.tiers).toEqual({ pinguino: 1, toastodilo: 1, lampalotl: 0, dishnail: 0 });
    expect(state.attackIntervalMultiplier).toBe(0.97);
    expect(state.incomingDamageMultiplier).toBe(0.96);
    expect(state.squadDamageMultiplier).toBe(1);
    expect(state.pressureDamageMultiplier).toBe(1);
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

  it('stacks independent family identities at higher power tiers', () => {
    const board: BoardState = [
      { id: 'p3a', family: 'pinguino', level: 3, mutation: 'none' },
      { id: 'p3b', family: 'pinguino', level: 3, mutation: 'charged' },
      { id: 't3', family: 'toastodilo', level: 3, mutation: 'none' },
      { id: 'l3', family: 'lampalotl', level: 3, mutation: 'none' },
      { id: 'd3a', family: 'dishnail', level: 3, mutation: 'none' },
      { id: 'd3b', family: 'dishnail', level: 3, mutation: 'prismatic' },
      null, null, null, null, null, null
    ];
    const state = evaluateCrewSynergies(board);
    expect(state.tiers).toEqual({ pinguino: 3, toastodilo: 2, lampalotl: 2, dishnail: 3 });
    expect(state.attackIntervalMultiplier).toBe(0.9);
    expect(state.incomingDamageMultiplier).toBe(0.91);
    expect(state.squadDamageMultiplier).toBe(1.08);
    expect(state.pressureDamageMultiplier).toBe(1.25);
  });
});
