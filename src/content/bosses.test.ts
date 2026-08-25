import { describe, expect, it } from 'vitest';
import { getAllBosses, getBossForChapter, scaleBoss } from './bosses';

describe('boss roster', () => {
  it('ships six original bosses with unique ids, textures and phase labels', () => {
    const bosses = getAllBosses();
    expect(bosses).toHaveLength(6);
    expect(new Set(bosses.map((boss) => boss.id)).size).toBe(bosses.length);
    expect(new Set(bosses.map((boss) => boss.texture)).size).toBe(bosses.length);
    expect(new Set(bosses.map((boss) => boss.phases.enrageLabel)).size).toBe(bosses.length);
  });

  it('keeps the four core bosses rotating before world-finale overrides', () => {
    const bosses = getAllBosses();
    expect(getBossForChapter(1).id).toBe(bosses[0]?.id);
    expect(getBossForChapter(2).id).toBe(bosses[1]?.id);
    expect(getBossForChapter(3).id).toBe(bosses[2]?.id);
    expect(getBossForChapter(4).id).toBe(bosses[3]?.id);
    expect(getBossForChapter(5).id).toBe(bosses[0]?.id);
  });

  it('routes authored world-finale bosses to Neon Sewer and Appliance Wasteland finales', () => {
    expect(getBossForChapter(10).id).toBe('serverino-stormzilla');
    expect(getBossForChapter(15).id).toBe('washerzilla-drumissimo');
    expect(getBossForChapter(16).id).toBe(getAllBosses()[3]?.id);
  });

  it('scales pressure and reward while respecting each boss attack floor', () => {
    for (const boss of getAllBosses()) {
      const first = scaleBoss(boss, 1);
      const later = scaleBoss(boss, 8);
      expect(later.hp).toBeGreaterThan(first.hp);
      expect(later.damage).toBeGreaterThanOrEqual(first.damage);
      expect(later.reward).toBeGreaterThan(first.reward);
      expect(later.attackMs).toBeGreaterThanOrEqual(boss.minAttackMs);
    }
  });

  it('keeps Kettlestar as a pressure-burst core profile without exceeding its cap', () => {
    const boss = getBossForChapter(4);
    expect(boss.id).toBe('kettlestar-volcanissimo');
    const chapterFour = scaleBoss(boss, 4);
    expect(chapterFour.damage).toBe(17);
    expect(chapterFour.attackMs).toBe(3595);
    expect(scaleBoss(boss, 99).damage).toBe(boss.maxDamage);
    expect(scaleBoss(boss, 99).attackMs).toBe(boss.minAttackMs);
  });

  it('gives the two world finales distinct combat identities', () => {
    const server = getBossForChapter(10);
    const washer = getBossForChapter(15);
    expect(server.phases.weakDamageTakenMultiplier).toBeGreaterThan(washer.phases.weakDamageTakenMultiplier);
    expect(washer.phases.shieldDamageTakenMultiplier).toBeLessThan(server.phases.shieldDamageTakenMultiplier);
    expect(server.baseAttackMs).toBeLessThan(washer.baseAttackMs);
    expect(washer.baseDamage).toBeGreaterThan(server.baseDamage);
  });
});
