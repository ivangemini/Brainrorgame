import { afterEach, describe, expect, it } from 'vitest';
import {
  CREATURE_FAMILIES,
  getAllCreatures,
  getCreature,
  getCreatureFamilyProgression,
  getRecruitableFamilies,
  isCreatureFamily,
  resetRecruitProgressChapter,
  syncRecruitProgressChapter
} from './creatures';

afterEach(() => resetRecruitProgressChapter());

describe('creature roster', () => {
  it('contains seven complete three-tier families', () => {
    expect(CREATURE_FAMILIES).toEqual([
      'pinguino', 'toastodilo', 'lampalotl', 'dishnail', 'mochimoth', 'routeraptor', 'vendinguana'
    ]);
    expect(getAllCreatures()).toHaveLength(21);
    for (const family of CREATURE_FAMILIES) {
      expect([1, 2, 3].map((level) => getCreature(family, level).level)).toEqual([1, 2, 3]);
    }
  });

  it('unlocks recruit families progressively across the three worlds', () => {
    expect(getRecruitableFamilies(1)).toEqual(['pinguino', 'toastodilo', 'lampalotl', 'dishnail']);
    expect(getRecruitableFamilies(3)).toContain('mochimoth');
    expect(getRecruitableFamilies(5)).not.toContain('routeraptor');
    expect(getRecruitableFamilies(6)).toContain('routeraptor');
    expect(getRecruitableFamilies(10)).not.toContain('vendinguana');
    expect(getRecruitableFamilies(11)).toEqual(CREATURE_FAMILIES);
    expect(getCreatureFamilyProgression().map((entry) => entry.unlockChapter)).toEqual([1, 1, 1, 1, 3, 6, 11]);
  });

  it('keeps the runtime recruit pool synchronized by the current encounter chapter', () => {
    syncRecruitProgressChapter(6);
    expect(getRecruitableFamilies()).toContain('routeraptor');
    expect(getRecruitableFamilies()).not.toContain('vendinguana');
  });

  it('keeps Lampalotl and Routeraptor as distinct rapid-fire profiles', () => {
    const lamp = getCreature('lampalotl', 1);
    const router = getCreature('routeraptor', 1);
    expect(lamp.attackMs).toBeLessThan(getCreature('pinguino', 1).attackMs);
    expect(router.attackMs).toBeLessThan(lamp.attackMs);
    expect(router.damage).toBeLessThan(lamp.damage);
    expect(getCreature('routeraptor', 3).damage).toBeGreaterThan(router.damage);
  });

  it('keeps Dishnail as the highest alpha-strike baseline', () => {
    const quasar = getCreature('dishnail', 3);
    expect(quasar.attackMs).toBeGreaterThan(getCreature('toastodilo', 3).attackMs);
    expect(quasar.damage).toBeGreaterThan(getCreature('vendinguana', 3).damage);
  });

  it('keeps the new support and boss-breaker families below artillery baseline DPS before synergies', () => {
    const mochi = getCreature('mochimoth', 3);
    const vending = getCreature('vendinguana', 3);
    const dish = getCreature('dishnail', 3);
    expect(mochi.damage / mochi.attackMs).toBeLessThan(dish.damage / dish.attackMs);
    expect(vending.damage / vending.attackMs).toBeLessThan(dish.damage / dish.attackMs);
  });

  it('validates all authored family identifiers', () => {
    expect(isCreatureFamily('mochimoth')).toBe(true);
    expect(isCreatureFamily('routeraptor')).toBe(true);
    expect(isCreatureFamily('vendinguana')).toBe(true);
    expect(isCreatureFamily('copied-meme')).toBe(false);
  });
});
