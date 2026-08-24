import { describe, expect, it } from 'vitest';
import { BOSS_STEP, getEncounterSpec, nextEncounter } from './encounters';

describe('encounter progression', () => {
  it('runs three waves before the boss', () => {
    expect(getEncounterSpec(1, 0).kind).toBe('wave');
    expect(getEncounterSpec(1, 1).kind).toBe('wave');
    expect(getEncounterSpec(1, 2).kind).toBe('wave');
    expect(getEncounterSpec(1, BOSS_STEP).kind).toBe('boss');
  });

  it('advances boss completion into the next chapter first wave', () => {
    expect(nextEncounter(4, BOSS_STEP)).toEqual({ chapter: 5, step: 0 });
  });

  it('scales the boss between chapters', () => {
    const first = getEncounterSpec(1, BOSS_STEP);
    const later = getEncounterSpec(5, BOSS_STEP);
    expect(later.hp).toBeGreaterThan(first.hp);
    expect(later.damage).toBeGreaterThanOrEqual(first.damage);
    expect(later.reward).toBeGreaterThan(first.reward);
  });
});
