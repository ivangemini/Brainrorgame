import { afterEach, describe, expect, it } from 'vitest';
import { CREATURE_FAMILIES, getAllCreatures, getCreature, getCreatureFamilyProgression, getRecruitableFamilies, isCreatureFamily, resetRecruitProgressChapter, syncRecruitProgressChapter } from './creatures';
afterEach(() => resetRecruitProgressChapter());
describe('creature roster', () => {
  it('contains twelve complete three-form authored families', () => {
    expect(CREATURE_FAMILIES).toHaveLength(12);
    expect(CREATURE_FAMILIES).toEqual(['pinguino','toastodilo','lampalotl','dishnail','mochimoth','routeraptor','vendinguana','umbrellama','mopossum','fanthom','socktopus','microwhale']);
    expect(getAllCreatures()).toHaveLength(36);
    for (const family of CREATURE_FAMILIES) expect([1,2,3].map((level) => getCreature(family, level).level)).toEqual([1,2,3]);
  });
  it('reuses the authored T3 silhouette for T4/T5 while scaling prestige combat stats', () => {
    const t3 = getCreature('pinguino', 3);
    const t4 = getCreature('pinguino', 4);
    const t5 = getCreature('pinguino', 5);
    expect(t4.texture).toBe(t3.texture);
    expect(t5.texture).toBe(t3.texture);
    expect(t4.damage).toBeGreaterThan(t3.damage * 2);
    expect(t5.damage).toBeGreaterThan(t4.damage * 2);
    expect(t4.attackMs).toBeLessThan(t3.attackMs);
    expect(t5.attackMs).toBeLessThan(t4.attackMs);
  });
  it('unlocks launch-candidate families progressively into endless chapters', () => {
    expect(getRecruitableFamilies(1)).toEqual(['pinguino','toastodilo','lampalotl','dishnail']);
    expect(getRecruitableFamilies(3)).toContain('mochimoth');
    expect(getRecruitableFamilies(6)).toContain('routeraptor');
    expect(getRecruitableFamilies(11)).toContain('vendinguana');
    expect(getRecruitableFamilies(12)).not.toContain('umbrellama');
    expect(getRecruitableFamilies(13)).toContain('umbrellama');
    expect(getRecruitableFamilies(16)).toContain('mopossum');
    expect(getRecruitableFamilies(18)).toContain('fanthom');
    expect(getRecruitableFamilies(21)).toContain('socktopus');
    expect(getRecruitableFamilies(24)).toEqual(CREATURE_FAMILIES);
    expect(getCreatureFamilyProgression().map((entry) => entry.unlockChapter)).toEqual([1,1,1,1,3,6,11,13,16,18,21,24]);
  });
  it('keeps the runtime recruit pool synchronized by the current encounter chapter', () => { syncRecruitProgressChapter(18); expect(getRecruitableFamilies()).toContain('fanthom'); expect(getRecruitableFamilies()).not.toContain('socktopus'); });
  it('keeps rapid-fire and artillery profiles distinct', () => { const fan = getCreature('fanthom',3); const dish = getCreature('dishnail',3); expect(fan.attackMs).toBeLessThan(getCreature('lampalotl',3).attackMs); expect(dish.damage).toBeGreaterThan(fan.damage); expect(dish.attackMs).toBeGreaterThan(fan.attackMs); });
  it('gives the endless boss-pressure family high alpha but slower cadence', () => { const whale = getCreature('microwhale',3); const sock = getCreature('socktopus',3); expect(whale.damage).toBeGreaterThan(sock.damage); expect(whale.attackMs).toBeGreaterThan(sock.attackMs); });
  it('validates all authored family identifiers', () => { for (const family of CREATURE_FAMILIES) expect(isCreatureFamily(family)).toBe(true); expect(isCreatureFamily('copied-meme')).toBe(false); });
});
