import { describe, expect, it } from 'vitest';
import { getAllEnemies, getEnemyForWave, scaleEnemy } from './enemies';

describe('enemy content', () => {
  it('ships three distinct wave enemies', () => {
    expect(getAllEnemies().map((enemy) => enemy.id)).toEqual([
      'jellini-sprinter',
      'sock-gobblino',
      'wifino-mole'
    ]);
  });

  it('rotates wave order by chapter', () => {
    expect(getEnemyForWave(1, 1).id).toBe('jellini-sprinter');
    expect(getEnemyForWave(2, 1).id).toBe('sock-gobblino');
    expect(getEnemyForWave(3, 1).id).toBe('wifino-mole');
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
