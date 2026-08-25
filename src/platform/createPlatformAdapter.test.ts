import { describe, expect, it } from 'vitest';
import { createPlatformAdapter, shouldUseCrazyGames, shouldUsePoki } from './createPlatformAdapter';
import type { PokiSdkLike } from './PokiAdapter';
import type { YandexGamesLoaderLike } from './YandexAdapter';

describe('platform selection', () => {
  it('detects CrazyGames production and preview hosts', () => {
    expect(shouldUseCrazyGames('crazygames.com', '')).toBe(true);
    expect(shouldUseCrazyGames('www.crazygames.com', '')).toBe(true);
    expect(shouldUseCrazyGames('games.crazygames.com', '')).toBe(true);
    expect(shouldUseCrazyGames('example.com', '')).toBe(false);
  });

  it('supports explicit portal query hints for localhost QA', () => {
    expect(shouldUseCrazyGames('localhost', '?platform=crazygames')).toBe(true);
    expect(shouldUseCrazyGames('games.crazygames.com', '?platform=poki')).toBe(false);
    expect(shouldUsePoki('localhost', '?foo=1&platform=POKI')).toBe(true);
    expect(shouldUsePoki('poki.com', '?platform=crazygames')).toBe(false);
  });

  it('detects Poki from host or embedding referrer', () => {
    expect(shouldUsePoki('poki.com', '')).toBe(true);
    expect(shouldUsePoki('game.poki.com', '')).toBe(true);
    expect(shouldUsePoki('cdn.example.com', '', 'https://poki.com/en/g/brainror-game')).toBe(true);
    expect(shouldUsePoki('example.com', '', 'https://example.org/page')).toBe(false);
  });

  it('keeps Yandex SDK detection ahead of portal hints', () => {
    const yandex = { init: async () => { throw new Error('not called'); } } as YandexGamesLoaderLike;
    const adapter = createPlatformAdapter({
      globalScope: { YaGames: yandex },
      hostname: 'games.crazygames.com',
      search: '?platform=poki',
      referrer: 'https://poki.com/en/g/test'
    });
    expect(adapter.id).toBe('yandex');
  });

  it('selects CrazyGames, Poki and Web through the same factory', () => {
    expect(createPlatformAdapter({ globalScope: {}, hostname: 'games.crazygames.com', search: '', referrer: '' }).id).toBe('crazygames');
    expect(createPlatformAdapter({ globalScope: {}, hostname: 'localhost', search: '?platform=poki', referrer: '' }).id).toBe('poki');
    expect(createPlatformAdapter({ globalScope: {}, hostname: 'cdn.example.com', search: '', referrer: 'https://poki.com/en/g/test' }).id).toBe('poki');
    expect(createPlatformAdapter({ globalScope: {}, hostname: 'example.com', search: '', referrer: '' }).id).toBe('web');
  });

  it('selects Poki when an inspector/page already injected PokiSDK', () => {
    const poki = {} as PokiSdkLike;
    expect(createPlatformAdapter({ globalScope: { PokiSDK: poki }, hostname: 'localhost', search: '', referrer: '' }).id).toBe('poki');
  });
});
