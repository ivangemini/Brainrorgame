import { describe, expect, it } from 'vitest';
import { getWorldForChapter } from '../content/worlds';
import { BOSS_STEP, getEncounterSpec } from './encounters';
import { bossCoreReward } from './metaProgression';

describe('world progression integration', () => {
  it('changes encounter pressure when crossing biome boundaries', () => {
    const candy = getEncounterSpec(5, 0);
    const neon = getEncounterSpec(6, 0);
    const waste = getEncounterSpec(11, 0);
    expect(getWorldForChapter(5).id).toBe('candy-crater');
    expect(getWorldForChapter(6).id).toBe('neon-sewer');
    expect(getWorldForChapter(11).id).toBe('appliance-wasteland');
    expect(neon.reward).toBeGreaterThan(0);
    expect(waste.reward).toBeGreaterThan(neon.reward);
    expect(waste.hp).toBeGreaterThan(candy.hp);
  });

  it('adds authored coin premiums to the three world-finale bosses', () => {
    const chapter4 = getEncounterSpec(4, BOSS_STEP);
    const chapter5 = getEncounterSpec(5, BOSS_STEP);
    const chapter9 = getEncounterSpec(9, BOSS_STEP);
    const chapter10 = getEncounterSpec(10, BOSS_STEP);
    const chapter14 = getEncounterSpec(14, BOSS_STEP);
    const chapter15 = getEncounterSpec(15, BOSS_STEP);
    expect(chapter5.reward).toBeGreaterThan(chapter4.reward + 200);
    expect(chapter10.reward).toBeGreaterThan(chapter9.reward + 300);
    expect(chapter15.reward).toBeGreaterThan(chapter14.reward + 500);
  });

  it('adds Core Shard completion bonuses only on authored world finales', () => {
    expect(bossCoreReward(4)).toBe(1);
    expect(bossCoreReward(5)).toBe(3);
    expect(bossCoreReward(9)).toBe(2);
    expect(bossCoreReward(10)).toBe(5);
    expect(bossCoreReward(14)).toBe(3);
    expect(bossCoreReward(15)).toBe(8);
    expect(bossCoreReward(16)).toBe(4);
  });
});
