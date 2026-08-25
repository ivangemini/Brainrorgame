import { CrazyGamesAdapter } from './CrazyGamesAdapter';
import type { PlatformAdapter } from './PlatformAdapter';
import { WebAdapter } from './WebAdapter';
import { YandexAdapter, type YandexGamesLoaderLike } from './YandexAdapter';

interface PlatformGlobalLike {
  readonly YaGames?: YandexGamesLoaderLike;
}

export interface PlatformEnvironment {
  readonly globalScope: PlatformGlobalLike;
  readonly hostname: string;
  readonly search: string;
}

export function createPlatformAdapter(environment: PlatformEnvironment = browserEnvironment()): PlatformAdapter {
  const yandex = environment.globalScope.YaGames;
  if (yandex) return new YandexAdapter(yandex);
  if (shouldUseCrazyGames(environment.hostname, environment.search)) return new CrazyGamesAdapter();
  return new WebAdapter();
}

export function shouldUseCrazyGames(hostname: string, search: string): boolean {
  const normalizedHost = hostname.trim().toLowerCase();
  if (normalizedHost === 'crazygames.com' || normalizedHost.endsWith('.crazygames.com')) return true;
  try {
    return new URLSearchParams(search).get('platform')?.toLowerCase() === 'crazygames';
  } catch {
    return false;
  }
}

function browserEnvironment(): PlatformEnvironment {
  const location = typeof globalThis.location === 'undefined' ? null : globalThis.location;
  return {
    globalScope: globalThis as PlatformGlobalLike,
    hostname: location?.hostname ?? '',
    search: location?.search ?? ''
  };
}
