import { describe, expect, it } from 'vitest';
import {
  applyWorldPressure,
  getAllWorlds,
  getNextWorld,
  getWorldEnergyGainMultiplier,
  getWorldForChapter,
  getWorldStage,
  isWorldFinalChapter
} from './worlds';

describe('world progression', () => {
  it('ships three ordered biome worlds', () => {
    const worlds = getAllWorlds();
    expect(worlds.map((world) => world.id)).toEqual(['candy-crater', 'neon-sewer', 'appliance-wasteland']);
    expect(worlds.map((world) => world.startChapter)).toEqual([1, 6, 11]);
    expect(worlds.map((world) => world.finalChapter)).toEqual([5, 10, 15]);
  });

  it('maps chapters into five-chapter worlds and leaves world three as endless endgame', () => {
    expect(getWorldForChapter(1).id).toBe('candy-crater');
    expect(getWorldForChapter(5).id).toBe('candy-crater');
    expect(getWorldForChapter(6).id).toBe('neon-sewer');
    expect(getWorldForChapter(10).id).toBe('neon-sewer');
    expect(getWorldForChapter(11).id).toBe('appliance-wasteland');
    expect(getWorldForChapter(25).id).toBe('appliance-wasteland');
    expect(getWorldStage(8)).toBe(3);
  });

  it('marks only authored world finales and exposes the next world', () => {
    expect(isWorldFinalChapter(5)).toBe(true);
    expect(isWorldFinalChapter(10)).toBe(true);
    expect(isWorldFinalChapter(15)).toBe(true);
    expect(isWorldFinalChapter(16)).toBe(false);
    expect(getNextWorld(5)?.id).toBe('neon-sewer');
    expect(getNextWorld(10)?.id).toBe('appliance-wasteland');
    expect(getNextWorld(15)).toBeNull();
  });

  it('gives each later biome a distinct combat/economy rule', () => {
    const base = { hp: 100, damage: 10, attackMs: 3000, reward: 100 };
    expect(applyWorldPressure(base, 1)).toEqual(base);
    const neon = applyWorldPressure(base, 6);
    expect(neon.hp).toBe(96);
    expect(neon.damage).toBe(11);
    expect(neon.attackMs).toBe(2700);
    expect(neon.reward).toBe(112);
    expect(getWorldEnergyGainMultiplier(6)).toBe(1.18);
    const waste = applyWorldPressure(base, 11);
    expect(waste.hp).toBe(118);
    expect(waste.damage).toBe(11);
    expect(waste.attackMs).toBe(3060);
    expect(waste.reward).toBe(118);
    expect(getWorldEnergyGainMultiplier(11)).toBe(0.92);
  });
});
