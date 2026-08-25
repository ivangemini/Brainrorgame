import { describe, expect, it } from 'vitest';
import {
  ascendMutationPair,
  getAllMutationDefinitions,
  mergeMutation,
  mutatedAttackMs,
  mutatedDamage,
  rollMutation
} from './mutations';

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

  it('applies bounded combat bonuses', () => {
    expect(mutatedDamage(100, 'charged')).toBe(108);
    expect(mutatedDamage(100, 'prismatic')).toBe(120);
    expect(mutatedDamage(100, 'crowned')).toBe(135);
    expect(mutatedAttackMs(1000, 'charged')).toBe(940);
    expect(mutatedAttackMs(1000, 'prismatic')).toBe(900);
    expect(mutatedAttackMs(1000, 'crowned')).toBe(860);
  });
});
