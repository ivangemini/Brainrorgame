import { describe, expect, it } from 'vitest';
import {
  createPlatformAdapter,
  shouldUseCrazyGames,
  shouldUseGameDistribution,
  shouldUsePlaygama,
  shouldUsePoki
} from './createPlatformAdapter';
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
    expect(shouldUseCrazyGames('games.crazygames.com', '?platform=playgama')).toBe(false);
    expect(shouldUsePoki('localhost', '?foo=1&platform=POKI')).toBe(true);
    expect(shouldUsePoki('poki.com', '?platform=playgama')).toBe(false);
    expect(shouldUsePlaygama('localhost', '?platform=playgama')).toBe(true);
    expect(shouldUsePlaygama('playgama.com', '?platform=poki')).toBe(false);
    expect(shouldUseGameDistribution('localhost', '?platform=gamedistribution')).toBe(true);
    expect(shouldUseGameDistribution('gamedistribution.com', '?platform=poki')).toBe(false);
  });

  it('detects Poki, Playgama and GameDistribution from portal context', () => {
    expect(shouldUsePoki('poki.com', '')).toBe(true);
    expect(shouldUsePoki('game.poki.com', '')).toBe(true);
    expect(shouldUsePoki('cdn.example.com', '', 'https://poki.com/en/g/brainror-game')).toBe(true);
    expect(shouldUsePlaygama('playgama.com', '')).toBe(true);
    expect(shouldUsePlaygama('games.playgama.com', '')).toBe(true);
    expect(shouldUsePlaygama('cdn.example.com', '', 'https://playgama.com/game/brainror')).toBe(true);
    expect(shouldUseGameDistribution('html5.gamedistribution.com', '')).toBe(true);
    expect(shouldUseGameDistribution('cdn.example.com', '?gd_sdk_referrer_url=https%3A%2F%2Fportal.example%2Fgame')).toBe(true);
    expect(shouldUseGameDistribution('cdn.example.com', '', 'https://gamedistribution.com/games/brainror')).toBe(true);
    expect(shouldUseGameDistribution('example.com', '', 'https://example.org/page')).toBe(false);
  });

  it('keeps Yandex SDK detection ahead of portal hints', () => {
    const yandex = { init: async () => { throw new Error('not called'); } } as YandexGamesLoaderLike;
    const adapter = createPlatformAdapter({
      globalScope: { YaGames: yandex },
      hostname: 'html5.gamedistribution.com',
      search: '?platform=gamedistribution',
      referrer: 'https://gamedistribution.com/games/test'
    });
    expect(adapter.id).toBe('yandex');
  });

  it('selects every implemented portal and Web through the same factory', () => {
    expect(createPlatformAdapter({ globalScope: {}, hostname: 'games.crazygames.com', search: '', referrer: '' }).id).toBe('crazygames');
    expect(createPlatformAdapter({ globalScope: {}, hostname: 'localhost', search: '?platform=poki', referrer: '' }).id).toBe('poki');
    expect(createPlatformAdapter({ globalScope: {}, hostname: 'localhost', search: '?platform=playgama', referrer: '' }).id).toBe('playgama');
    expect(createPlatformAdapter({ globalScope: {}, hostname: 'localhost', search: '?platform=gamedistribution', referrer: '' }).id).toBe('gamedistribution');
    expect(createPlatformAdapter({ globalScope: {}, hostname: 'cdn.example.com', search: '?gd_sdk_referrer_url=https%3A%2F%2Fportal.example', referrer: '' }).id).toBe('gamedistribution');
    expect(createPlatformAdapter({ globalScope: {}, hostname: 'example.com', search: '', referrer: '' }).id).toBe('web');
  });

  it('selects Poki when an inspector/page already injected PokiSDK', () => {
    const poki = {} as PokiSdkLike;
    expect(createPlatformAdapter({ globalScope: { PokiSDK: poki }, hostname: 'localhost', search: '', referrer: '' }).id).toBe('poki');
  });
});
