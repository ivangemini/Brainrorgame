import { CrazyGamesAdapter } from './CrazyGamesAdapter';
import type { PlatformAdapter } from './PlatformAdapter';
import { PokiAdapter, type PokiSdkLike } from './PokiAdapter';
import { WebAdapter } from './WebAdapter';
import { YandexAdapter, type YandexGamesLoaderLike } from './YandexAdapter';

interface PlatformGlobalLike {
  readonly YaGames?: YandexGamesLoaderLike;
  readonly PokiSDK?: PokiSdkLike;
}

export interface PlatformEnvironment {
  readonly globalScope: PlatformGlobalLike;
  readonly hostname: string;
  readonly search: string;
  readonly referrer: string;
}

export function createPlatformAdapter(environment: PlatformEnvironment = browserEnvironment()): PlatformAdapter {
  const yandex = environment.globalScope.YaGames;
  if (yandex) return new YandexAdapter(yandex);
  if (shouldUseCrazyGames(environment.hostname, environment.search)) return new CrazyGamesAdapter();
  if (environment.globalScope.PokiSDK || shouldUsePoki(environment.hostname, environment.search, environment.referrer)) {
    return new PokiAdapter();
  }
  return new WebAdapter();
}

export function shouldUseCrazyGames(hostname: string, search: string): boolean {
  const hint = platformHint(search);
  if (hint) return hint === 'crazygames';
  const normalizedHost = hostname.trim().toLowerCase();
  return normalizedHost === 'crazygames.com' || normalizedHost.endsWith('.crazygames.com');
}

export function shouldUsePoki(hostname: string, search: string, referrer = ''): boolean {
  const hint = platformHint(search);
  if (hint) return hint === 'poki';
  if (isPokiHost(hostname)) return true;
  try {
    return isPokiHost(new URL(referrer).hostname);
  } catch {
    return false;
  }
}

function platformHint(search: string): string | null {
  try {
    return new URLSearchParams(search).get('platform')?.trim().toLowerCase() ?? null;
  } catch {
    return null;
  }
}

function isPokiHost(hostname: string): boolean {
  const normalizedHost = hostname.trim().toLowerCase();
  return normalizedHost === 'poki.com' || normalizedHost.endsWith('.poki.com');
}

function browserEnvironment(): PlatformEnvironment {
  const location = typeof globalThis.location === 'undefined' ? null : globalThis.location;
  const documentRef = typeof globalThis.document === 'undefined' ? null : globalThis.document;
  return {
    globalScope: globalThis as PlatformGlobalLike,
    hostname: location?.hostname ?? '',
    search: location?.search ?? '',
    referrer: documentRef?.referrer ?? ''
  };
}
