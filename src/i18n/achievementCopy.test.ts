import { afterEach, describe, expect, it } from 'vitest';
import { getAchievementCopy } from './achievementCopy';

describe('achievement localization', () => {
  const previousLocation = globalThis.location;
  afterEach(() => { Object.defineProperty(globalThis, 'location', { value: previousLocation, configurable: true }); });

  it('returns English copy by default', () => {
    Object.defineProperty(globalThis, 'location', { value: { search: '?lang=en' }, configurable: true });
    expect(getAchievementCopy('boss-breaker', 5)).toEqual({ name: 'BOSS BREAKER', description: 'Defeat 5 bosses' });
  });

  it('returns Russian copy through QA locale override', () => {
    Object.defineProperty(globalThis, 'location', { value: { search: '?lang=ru' }, configurable: true });
    expect(getAchievementCopy('codex-complete', 36)).toEqual({ name: 'КОДЕКС ЗАВЕРШЁН', description: 'Открой все 36 форм' });
  });
});
