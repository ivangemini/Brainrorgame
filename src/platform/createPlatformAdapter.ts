import type { PlatformAdapter } from './PlatformAdapter';
import { WebAdapter } from './WebAdapter';
import { YandexAdapter, type YandexGamesLoaderLike } from './YandexAdapter';

interface GlobalWithYandex {
  readonly YaGames?: YandexGamesLoaderLike;
}

export function createPlatformAdapter(): PlatformAdapter {
  const loader = (globalThis as GlobalWithYandex).YaGames;
  return loader ? new YandexAdapter(loader) : new WebAdapter();
}
