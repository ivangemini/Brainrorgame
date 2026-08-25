import { describe, expect, it } from 'vitest';
import { getAllEnemies, getEnemyForWave, scaleEnemy } from './enemies';

describe('enemy content', () => {
  it('ships six distinct wave enemies', () => {
    expect(getAllEnemies().map((enemy) => enemy.id)).toEqual([
      'jellini-sprinter',
      'sock-gobblino',
      'wifino-mole',
      'noodlini-skipper',
      'vacuum-capybara',
      'cactus-tv-crab'
    ]);
  });

  it('rotates enemy order across all five wave slots', () => {
    expect(getEnemyForWave(1, 1).id).toBe('jellini-sprinter');
    expect(getEnemyForWave(1, 4).id).toBe('noodlini-skipper');
    expect(getEnemyForWave(1, 5).id).toBe('vacuum-capybara');
    expect(getEnemyForWave(2, 1).id).toBe('sock-gobblino');
    expect(getEnemyForWave(2, 5).id).toBe('cactus-tv-crab');
    expect(getEnemyForWave(7, 1).id).toBe('jellini-sprinter');
  });

  it('gives the roster distinct pacing profiles', () => {
    const enemies = getAllEnemies();
    const attackCadences = new Set(enemies.map((enemy) => enemy.attackMs));
    const baseHp = new Set(enemies.map((enemy) => enemy.baseHp));
    expect(attackCadences.size).toBe(6);
    expect(baseHp.size).toBe(6);
  });

  it('scales health, damage and reward without making attacks faster than the floor', () => {
    const enemy = getEnemyForWave(1, 1);
    const chapterOne = scaleEnemy(enemy, 1);
    const chapterTen = scaleEnemy(enemy, 10);

    expect(chapterTen.hp).toBeGreaterThan(chapterOne.hp);
    expect(chapterTen.damage).toBeGreaterThan(chapterOne.damage);
    expect(chapterTen.reward).toBeGreaterThan(chapterOne.reward);
    expect(chapterTen.attackMs).toBeGreaterThanOrEqual(1700);
  });
});
