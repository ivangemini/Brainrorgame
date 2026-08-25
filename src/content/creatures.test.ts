import { describe, expect, it } from 'vitest';
import {
  CREATURE_FAMILIES,
  getAllCreatures,
  getCreature,
  getRecruitableFamilies,
  isCreatureFamily
} from './creatures';

describe('creature roster', () => {
  it('contains three complete three-tier families', () => {
    expect(CREATURE_FAMILIES).toEqual(['pinguino', 'toastodilo', 'lampalotl']);
    expect(getAllCreatures()).toHaveLength(9);
    for (const family of CREATURE_FAMILIES) {
      expect([1, 2, 3].map((level) => getCreature(family, level).level)).toEqual([1, 2, 3]);
    }
  });

  it('exposes every family to recruiting', () => {
    expect(getRecruitableFamilies()).toEqual(CREATURE_FAMILIES);
  });

  it('keeps Lampalotl as the rapid-fire family', () => {
    const glow = getCreature('lampalotl', 1);
    const nova = getCreature('lampalotl', 3);
    expect(glow.attackMs).toBeLessThan(getCreature('pinguino', 1).attackMs);
    expect(nova.attackMs).toBeLessThan(glow.attackMs);
    expect(nova.damage).toBeGreaterThan(glow.damage);
  });

  it('validates supported family identifiers', () => {
    expect(isCreatureFamily('lampalotl')).toBe(true);
    expect(isCreatureFamily('copied-meme')).toBe(false);
  });
});
