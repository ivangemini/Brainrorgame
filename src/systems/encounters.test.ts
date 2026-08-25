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

  it('rotates four boss identities before repeating while scaling later chapter pressure', () => {
    const first = getEncounterSpec(1, BOSS_STEP);
    const second = getEncounterSpec(2, BOSS_STEP);
    const third = getEncounterSpec(3, BOSS_STEP);
    const fourth = getEncounterSpec(4, BOSS_STEP);
    const repeated = getEncounterSpec(5, BOSS_STEP);
    expect(first.kind).toBe('boss');
    expect(second.kind).toBe('boss');
    expect(third.kind).toBe('boss');
    expect(fourth.kind).toBe('boss');
    expect(new Set([first.id, second.id, third.id, fourth.id]).size).toBe(4);
    expect(repeated.id).toBe(first.id);
    expect(repeated.hp).toBeGreaterThan(first.hp);
    expect(repeated.damage).toBeGreaterThanOrEqual(first.damage);
    expect(repeated.reward).toBeGreaterThan(first.reward);
    if (first.kind === 'boss' && fourth.kind === 'boss') {
      expect(first.presentation.telegraphStyle).not.toBe(fourth.presentation.telegraphStyle);
    }
  });
});
