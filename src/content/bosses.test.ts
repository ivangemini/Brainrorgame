import { describe, expect, it } from 'vitest';
import { getAllBosses, getBossForChapter, scaleBoss } from './bosses';

describe('boss content', () => {
  it('ships three distinct bosses and rotates by chapter', () => {
    expect(getAllBosses().map((boss) => boss.id)).toEqual([
      'fridgino-maximo',
      'disco-moon-ox',
      'volcano-toaster-rex'
    ]);
    expect(getBossForChapter(1).id).toBe('fridgino-maximo');
    expect(getBossForChapter(2).id).toBe('disco-moon-ox');
    expect(getBossForChapter(3).id).toBe('volcano-toaster-rex');
    expect(getBossForChapter(4).id).toBe('fridgino-maximo');
  });

  it('keeps boss profiles mechanically distinct', () => {
    const bosses = getAllBosses();
    expect(new Set(bosses.map((boss) => boss.baseAttackMs)).size).toBe(3);
    expect(new Set(bosses.map((boss) => boss.baseDamage)).size).toBe(3);
    expect(new Set(bosses.map((boss) => boss.displaySize)).size).toBe(3);
  });

  it('scales bosses while respecting each cadence floor', () => {
    for (const boss of getAllBosses()) {
      const early = scaleBoss(boss, 1);
      const late = scaleBoss(boss, 30);
      expect(late.hp).toBeGreaterThan(early.hp);
      expect(late.damage).toBeGreaterThan(early.damage);
      expect(late.reward).toBeGreaterThan(early.reward);
      expect(late.attackMs).toBeGreaterThanOrEqual(boss.minAttackMs);
    }
  });
});
