import { describe, expect, it } from 'vitest';
import { applyChapterMutator, getChapterMutator } from './chapterMutators';

describe('chapter mutators', () => {
  it('protects the first three chapters from mutator pressure', () => {
    expect(getChapterMutator(1)).toBeNull();
    expect(getChapterMutator(2)).toBeNull();
    expect(getChapterMutator(3)).toBeNull();
  });

  it('rotates the authored standard set through chapter fifteen', () => {
    expect(getChapterMutator(4)?.id).toBe('turbo-swarm');
    expect(getChapterMutator(5)?.id).toBe('heavy-weather');
    expect(getChapterMutator(6)?.id).toBe('gold-rush');
    expect(getChapterMutator(7)?.id).toBe('turbo-swarm');
    expect(getChapterMutator(15)?.endlessTier).toBe(0);
  });

  it('unlocks the six-mutator endless pool from chapter sixteen', () => {
    expect(getChapterMutator(16)?.id).toBe('turbo-swarm');
    expect(getChapterMutator(19)?.id).toBe('mirror-frenzy');
    expect(getChapterMutator(20)?.id).toBe('scrap-fortress');
    expect(getChapterMutator(21)?.id).toBe('chaos-dividend');
    expect(getChapterMutator(16)?.endlessTier).toBe(1);
  });

  it('raises rift pressure and payout every five endless chapters', () => {
    const tierOne = getChapterMutator(16);
    const tierTwo = getChapterMutator(21);
    const tierThree = getChapterMutator(26);
    expect(tierOne?.endlessTier).toBe(1);
    expect(tierTwo?.endlessTier).toBe(2);
    expect(tierThree?.endlessTier).toBe(3);
    expect((tierThree?.rewardMultiplier ?? 0)).toBeGreaterThan(tierOne?.rewardMultiplier ?? 0);
  });

  it('applies pressure and rewards without breaking the telegraph floor', () => {
    const turbo = getChapterMutator(4);
    const result = applyChapterMutator(
      { hp: 100, damage: 20, attackMs: 1600, reward: 50 },
      turbo
    );
    expect(result.hp).toBe(96);
    expect(result.damage).toBe(20);
    expect(result.attackMs).toBe(1450);
    expect(result.reward).toBe(62);
  });
});
