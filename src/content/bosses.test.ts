import { describe, expect, it } from 'vitest';
import { getAllBosses, getBossForChapter, scaleBoss } from './bosses';

describe('boss roster', () => {
  it('ships three original bosses with unique runtime identities', () => {
    const bosses = getAllBosses();
    expect(bosses).toHaveLength(3);
    expect(new Set(bosses.map((boss) => boss.id)).size).toBe(bosses.length);
    expect(new Set(bosses.map((boss) => boss.texture)).size).toBe(bosses.length);
    expect(new Set(bosses.map((boss) => boss.presentation.telegraphStyle)).size).toBe(bosses.length);
  });

  it('rotates bosses deterministically by chapter', () => {
    const bosses = getAllBosses();
    expect(getBossForChapter(1).id).toBe(bosses[0]?.id);
    expect(getBossForChapter(2).id).toBe(bosses[1]?.id);
    expect(getBossForChapter(3).id).toBe(bosses[2]?.id);
    expect(getBossForChapter(4).id).toBe(bosses[0]?.id);
  });

  it('scales pressure and reward while respecting each boss attack floor', () => {
    const boss = getBossForChapter(1);
    const first = scaleBoss(boss, 1);
    const later = scaleBoss(boss, 8);
    expect(later.hp).toBeGreaterThan(first.hp);
    expect(later.damage).toBeGreaterThanOrEqual(first.damage);
    expect(later.reward).toBeGreaterThan(first.reward);
    expect(later.attackMs).toBeGreaterThanOrEqual(boss.minAttackMs);
  });
});
