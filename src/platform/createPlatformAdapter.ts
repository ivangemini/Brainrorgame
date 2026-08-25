import { CrazyGamesAdapter } from './CrazyGamesAdapter';
import { GameDistributionAdapter } from './GameDistributionAdapter';
import type { PlatformAdapter } from './PlatformAdapter';
import { PlaygamaAdapter } from './PlaygamaAdapter';
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
  if (shouldUsePlaygama(environment.hostname, environment.search, environment.referrer)) return new PlaygamaAdapter();
  if (shouldUseGameDistribution(environment.hostname, environment.search, environment.referrer)) {
    return new GameDistributionAdapter();
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
  if (isPortalHost(hostname, 'poki.com')) return true;
  return referrerMatches(referrer, 'poki.com');
}

export function shouldUsePlaygama(hostname: string, search: string, referrer = ''): boolean {
  const hint = platformHint(search);
  if (hint) return hint === 'playgama';
  if (isPortalHost(hostname, 'playgama.com')) return true;
  return referrerMatches(referrer, 'playgama.com');
}

export function shouldUseGameDistribution(hostname: string, search: string, referrer = ''): boolean {
  const hint = platformHint(search);
  if (hint) return hint === 'gamedistribution';
  if (hasGameDistributionReferrerParam(search)) return true;
  if (isPortalHost(hostname, 'gamedistribution.com')) return true;
  return referrerMatches(referrer, 'gamedistribution.com');
}

function platformHint(search: string): string | null {
  try {
    return new URLSearchParams(search).get('platform')?.trim().toLowerCase() ?? null;
  } catch {
    return null;
  }
}

function hasGameDistributionReferrerParam(search: string): boolean {
  try {
    return new URLSearchParams(search).has('gd_sdk_referrer_url');
  } catch {
    return false;
  }
}

function isPortalHost(hostname: string, domain: string): boolean {
  const normalizedHost = hostname.trim().toLowerCase();
  return normalizedHost === domain || normalizedHost.endsWith(`.${domain}`);
}

function referrerMatches(referrer: string, domain: string): boolean {
  try {
    return isPortalHost(new URL(referrer).hostname, domain);
  } catch {
    return false;
  }
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
