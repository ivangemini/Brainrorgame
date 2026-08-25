import { afterEach, describe, expect, it } from 'vitest';
import {
  beginActiveAbilityEncounter,
  recordCrewAttackEnergy,
  resetActiveAbilityRuntime,
  tryCastCurrentActiveAbility
} from '../systems/activeAbilities';
import type { BoardState } from '../systems/board';
import { resetCrewSynergyState, syncCrewSynergyState } from '../systems/crewSynergies';
import {
  ascendMutationPair,
  getAllMutationDefinitions,
  mergeMutation,
  mutatedAttackMs,
  mutatedDamage,
  rollMutation
} from './mutations';

afterEach(() => {
  resetCrewSynergyState();
  resetActiveAbilityRuntime();
});

describe('mutations and rarity', () => {
  it('keeps the four rarity tiers ordered from common to legendary', () => {
    const definitions = getAllMutationDefinitions();
    expect(definitions.map((mutation) => mutation.rarity)).toEqual(['common', 'rare', 'epic', 'legendary']);
    expect(definitions.map((mutation) => mutation.rank)).toEqual([0, 1, 2, 3]);
  });

  it('rolls the documented recruit rarity boundaries', () => {
    expect(rollMutation(0)).toBe('none');
    expect(rollMutation(0.799999)).toBe('none');
    expect(rollMutation(0.80)).toBe('charged');
    expect(rollMutation(0.949999)).toBe('charged');
    expect(rollMutation(0.95)).toBe('prismatic');
    expect(rollMutation(0.994999)).toBe('prismatic');
    expect(rollMutation(0.995)).toBe('crowned');
    expect(rollMutation(1)).toBe('crowned');
  });

  it('promotes matching mutated forms and never loses the stronger rarity', () => {
    expect(mergeMutation('none', 'none')).toBe('none');
    expect(mergeMutation('charged', 'charged')).toBe('prismatic');
    expect(mergeMutation('prismatic', 'prismatic')).toBe('crowned');
    expect(mergeMutation('crowned', 'crowned')).toBe('crowned');
    expect(mergeMutation('none', 'prismatic')).toBe('prismatic');
    expect(mergeMutation('charged', 'crowned')).toBe('crowned');
  });

  it('provides a strict max-tier ascension ladder only for matching rarity pairs', () => {
    expect(ascendMutationPair('none', 'none')).toBe('charged');
    expect(ascendMutationPair('charged', 'charged')).toBe('prismatic');
    expect(ascendMutationPair('prismatic', 'prismatic')).toBe('crowned');
    expect(ascendMutationPair('crowned', 'crowned')).toBeNull();
    expect(ascendMutationPair('none', 'charged')).toBeNull();
  });

  it('applies bounded mutation combat bonuses without crew synergy', () => {
    expect(mutatedDamage(100, 'charged')).toBe(108);
    expect(mutatedDamage(100, 'prismatic')).toBe(120);
    expect(mutatedDamage(100, 'crowned')).toBe(135);
    expect(mutatedAttackMs(1000, 'charged')).toBe(940);
    expect(mutatedAttackMs(1000, 'prismatic')).toBe(900);
    expect(mutatedAttackMs(1000, 'crowned')).toBe(860);
  });

  it('stacks Pinguino haste and Lampalotl damage with mutation bonuses', () => {
    const board: BoardState = [
      { id: 'p3a', family: 'pinguino', level: 3, mutation: 'none' },
      { id: 'p3b', family: 'pinguino', level: 3, mutation: 'none' },
      { id: 'l3a', family: 'lampalotl', level: 3, mutation: 'none' },
      { id: 'l3b', family: 'lampalotl', level: 3, mutation: 'none' },
      null, null, null, null, null, null, null, null
    ];
    syncCrewSynergyState(board);
    expect(mutatedDamage(100, 'charged')).toBe(123);
    expect(mutatedAttackMs(1000, 'charged')).toBe(846);
  });

  it('stacks active Overdrive and Slipstream Burst on top of passive crew bonuses', () => {
    const board: BoardState = [
      { id: 'p3a', family: 'pinguino', level: 3, mutation: 'none' },
      { id: 'p3b', family: 'pinguino', level: 3, mutation: 'none' },
      { id: 'l3a', family: 'lampalotl', level: 3, mutation: 'none' },
      { id: 'l3b', family: 'lampalotl', level: 3, mutation: 'none' },
      null, null, null, null, null, null, null, null
    ];
    syncCrewSynergyState(board);
    beginActiveAbilityEncounter('test-active-stack');
    for (let index = 0; index < 100; index += 1) recordCrewAttackEnergy();
    expect(tryCastCurrentActiveAbility('neon-overdrive', 3).cast).toBe(true);
    for (let index = 0; index < 50; index += 1) recordCrewAttackEnergy();
    expect(tryCastCurrentActiveAbility('slipstream-burst', 3).cast).toBe(true);
    expect(mutatedDamage(100, 'charged')).toBe(191);
    expect(mutatedAttackMs(1000, 'charged')).toBe(558);
  });
});
