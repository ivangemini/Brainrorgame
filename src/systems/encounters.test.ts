import { describe, expect, it } from 'vitest';
import { BOSS_STEP, getEncounterSpec, nextEncounter } from './encounters';

describe('encounter progression', () => {
  it('runs three waves before the boss', () => {
    expect(getEncounterSpec(1, 0).kind).toBe('wave');
    expect(getEncounterSpec(1, 1).kind).toBe('wave');
    expect(getEncounterSpec(1, 2).kind).toBe('wave');
    expect(getEncounterSpec(1, BOSS_STEP).kind).toBe('boss');
  });

  it('keeps early chapters free of elite waves', () => {
    for (const chapter of [1, 2]) {
      for (const step of [0, 1, 2] as const) {
        const encounter = getEncounterSpec(chapter, step);
        expect(encounter.kind).toBe('wave');
        if (encounter.kind === 'wave') expect(encounter.elite).toBeNull();
      }
    }
  });

  it('integrates one rotating elite wave per chapter from chapter three', () => {
    const chapter3 = [0, 1, 2].map((step) => getEncounterSpec(3, step as 0 | 1 | 2));
    const chapter4 = [0, 1, 2].map((step) => getEncounterSpec(4, step as 0 | 1 | 2));
    const chapter5 = [0, 1, 2].map((step) => getEncounterSpec(5, step as 0 | 1 | 2));
    const elite3 = chapter3.filter((encounter) => encounter.kind === 'wave' && encounter.elite !== null);
    const elite4 = chapter4.filter((encounter) => encounter.kind === 'wave' && encounter.elite !== null);
    const elite5 = chapter5.filter((encounter) => encounter.kind === 'wave' && encounter.elite !== null);
    expect(elite3).toHaveLength(1);
    expect(elite4).toHaveLength(1);
    expect(elite5).toHaveLength(1);
    if (elite3[0]?.kind === 'wave' && elite4[0]?.kind === 'wave' && elite5[0]?.kind === 'wave') {
      expect(elite3[0].elite?.id).toBe('berserk');
      expect(elite4[0].elite?.id).toBe('bulwark');
      expect(elite5[0].elite?.id).toBe('siege');
      expect(elite3[0].reward).toBeGreaterThan(0);
      expect(elite4[0].displaySize).toBeGreaterThan(0);
    }
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
