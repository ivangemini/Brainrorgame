import { describe, expect, it } from 'vitest';
import { resolveEncounterPreparation, shouldAdvanceCombat } from './preparationState';

describe('preparation state', () => {
  it('auto-pauses only when entering a new boss encounter', () => {
    expect(resolveEncounterPreparation({
      previousEncounterKey: '10:4', chapter: 10, step: 5, kind: 'boss'
    })).toEqual({ encounterKey: '10:5', changed: true, shouldAutoPause: true });

    expect(resolveEncounterPreparation({
      previousEncounterKey: '10:5', chapter: 10, step: 5, kind: 'boss'
    }).shouldAutoPause).toBe(false);

    expect(resolveEncounterPreparation({
      previousEncounterKey: '10:5', chapter: 11, step: 0, kind: 'wave'
    }).shouldAutoPause).toBe(false);
  });

  it('freezes combat for either explicit preparation or blocking panels', () => {
    expect(shouldAdvanceCombat(false, false)).toBe(true);
    expect(shouldAdvanceCombat(true, false)).toBe(false);
    expect(shouldAdvanceCombat(false, true)).toBe(false);
    expect(shouldAdvanceCombat(true, true)).toBe(false);
  });
});
