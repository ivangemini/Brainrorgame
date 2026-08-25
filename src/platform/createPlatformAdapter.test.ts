import { describe, expect, it } from 'vitest';
import { createPlatformAdapter, shouldUseCrazyGames } from './createPlatformAdapter';
import type { YandexGamesLoaderLike } from './YandexAdapter';

describe('platform selection', () => {
  it('detects CrazyGames production and preview hosts', () => {
    expect(shouldUseCrazyGames('crazygames.com', '')).toBe(true);
    expect(shouldUseCrazyGames('www.crazygames.com', '')).toBe(true);
    expect(shouldUseCrazyGames('games.crazygames.com', '')).toBe(true);
    expect(shouldUseCrazyGames('example.com', '')).toBe(false);
  });

  it('supports an explicit CrazyGames query hint for localhost QA', () => {
    expect(shouldUseCrazyGames('localhost', '?platform=crazygames')).toBe(true);
    expect(shouldUseCrazyGames('127.0.0.1', '?foo=1&platform=CRAZYGAMES')).toBe(true);
  });

  it('keeps Yandex SDK detection ahead of hostname hints', () => {
    const yandex = { init: async () => { throw new Error('not called'); } } as YandexGamesLoaderLike;
    const adapter = createPlatformAdapter({
      globalScope: { YaGames: yandex },
      hostname: 'games.crazygames.com',
      search: '?platform=crazygames'
    });
    expect(adapter.id).toBe('yandex');
  });

  it('selects CrazyGames when requested and web otherwise', () => {
    expect(createPlatformAdapter({ globalScope: {}, hostname: 'games.crazygames.com', search: '' }).id).toBe('crazygames');
    expect(createPlatformAdapter({ globalScope: {}, hostname: 'localhost', search: '?platform=crazygames' }).id).toBe('crazygames');
    expect(createPlatformAdapter({ globalScope: {}, hostname: 'example.com', search: '' }).id).toBe('web');
  });
});
