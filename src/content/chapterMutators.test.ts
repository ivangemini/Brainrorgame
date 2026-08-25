import { describe, expect, it } from 'vitest';
import { applyChapterMutator, getChapterMutator } from './chapterMutators';

describe('chapter mutators', () => {
  it('protects the first three chapters from mutator pressure', () => {
    expect(getChapterMutator(1)).toBeNull();
    expect(getChapterMutator(2)).toBeNull();
    expect(getChapterMutator(3)).toBeNull();
  });

  it('rotates deterministically from chapter four', () => {
    expect(getChapterMutator(4)?.id).toBe('turbo-swarm');
    expect(getChapterMutator(5)?.id).toBe('heavy-weather');
    expect(getChapterMutator(6)?.id).toBe('gold-rush');
    expect(getChapterMutator(7)?.id).toBe('turbo-swarm');
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
