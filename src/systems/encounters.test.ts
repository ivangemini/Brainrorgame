import { describe, expect, it } from 'vitest';
import { getEnemyForWave, scaleEnemy } from '../content/enemies';
import { BOSS_STEP, GAUNTLET_STEP, WAVES_PER_CHAPTER, getEncounterSpec, nextEncounter } from './encounters';

describe('encounter progression', () => {
  it('runs five waves before the boss', () => {
    expect(WAVES_PER_CHAPTER).toBe(5);
    for (const step of [0, 1, 2, 3, 4] as const) {
      expect(getEncounterSpec(1, step).kind).toBe('wave');
    }
    expect(getEncounterSpec(1, BOSS_STEP).kind).toBe('boss');
  });

  it('keeps early rotating elite modifiers disabled', () => {
    for (const chapter of [1, 2]) {
      for (const step of [0, 1, 2] as const) {
        const encounter = getEncounterSpec(chapter, step);
        expect(encounter.kind).toBe('wave');
        if (encounter.kind === 'wave') expect(encounter.elite).toBeNull();
      }
    }
  });

  it('preserves one rotating elite modifier in the first three waves from chapter three', () => {
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
    }
  });

  it('adds a fifth-wave Chaos Gate without replacing the rotating elite system', () => {
    const gate = getEncounterSpec(3, GAUNTLET_STEP);
    const baseline = scaleEnemy(getEnemyForWave(3, 5), 3);
    expect(gate.kind).toBe('wave');
    if (gate.kind !== 'wave') throw new Error('Expected wave');
    expect(gate.waveNumber).toBe(5);
    expect(gate.gauntlet).toBe(true);
    expect(gate.elite).toBeNull();
    expect(gate.name.startsWith('Chaos Gate ')).toBe(true);
    expect(gate.hp).toBeGreaterThan(baseline.hp);
    expect(gate.damage).toBeGreaterThanOrEqual(baseline.damage);
    expect(gate.attackMs).toBeLessThan(baseline.attackMs);
    expect(gate.reward).toBeGreaterThan(baseline.reward);
  });

  it('walks through all five waves before advancing past the boss', () => {
    expect(nextEncounter(2, 0)).toEqual({ chapter: 2, step: 1 });
    expect(nextEncounter(2, 1)).toEqual({ chapter: 2, step: 2 });
    expect(nextEncounter(2, 2)).toEqual({ chapter: 2, step: 3 });
    expect(nextEncounter(2, 3)).toEqual({ chapter: 2, step: 4 });
    expect(nextEncounter(2, 4)).toEqual({ chapter: 2, step: 5 });
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
