import type { GameAnalyticsEvent } from '../analytics/events';
import type { PlatformAdapter, PlatformLifecycleHandlers, RewardResult } from './PlatformAdapter';

const SAVE_KEY = 'brainrot-merge-boss:save';
const ANALYTICS_EVENT_NAME = 'brainror:analytics';
export const GAME_DISTRIBUTION_SDK_SRC = 'https://html5.api.gamedistribution.com/main.min.js';

export interface GameDistributionEvent {
  readonly name: string;
}

export interface GameDistributionSdkLike {
  showAd(type?: 'rewarded'): Promise<unknown>;
  preloadAd?(type: 'rewarded'): Promise<unknown>;
}

export interface GameDistributionLoaderLike {
  load(onEvent: (event: GameDistributionEvent) => void): Promise<GameDistributionSdkLike>;
}

export interface GameDistributionStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface GameDistributionOptionsLike {
  readonly gameId: string;
  readonly advertisementSettings?: { readonly autoplay?: boolean };
  readonly onEvent: (event: GameDistributionEvent) => void;
}

interface GameDistributionGlobalLike {
  GD_OPTIONS?: GameDistributionOptionsLike;
  GD_GAME_ID?: string;
  gdsdk?: GameDistributionSdkLike;
}

interface PendingAdvertisement {
  readonly kind: 'interstitial' | 'rewarded';
  rewarded: boolean;
  readonly finish: () => void;
}

export class GameDistributionAdapter implements PlatformAdapter {
  public readonly id = 'gamedistribution' as const;

  private sdk: GameDistributionSdkLike | null = null;
  private lifecycleHandlers: PlatformLifecycleHandlers | null = null;
  private lifecyclePaused = false;
  private adPaused = false;
  private pendingAd: PendingAdvertisement | null = null;

  public constructor(
    private readonly loader: GameDistributionLoaderLike = new BrowserGameDistributionLoader(),
    private readonly storage: GameDistributionStorageLike | null = safeLocalStorage()
  ) {}

  public async initialize(): Promise<void> {
    this.sdk = await this.loader.load((event) => this.handleSdkEvent(event));
    this.preloadRewarded();
  }

  public loadingReady(): void {}

  public setLifecycleHandlers(handlers: PlatformLifecycleHandlers): void {
    this.lifecycleHandlers = handlers;
    if (this.lifecyclePaused) handlers.pause();
  }

  public gameplayStart(): void {}

  public gameplayStop(): void {}

  public async showInterstitial(): Promise<void> {
    const sdk = this.sdk;
    if (!sdk || this.pendingAd) return;

    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = (): void => {
        if (settled) return;
        settled = true;
        this.pendingAd = null;
        this.adPaused = false;
        this.syncLifecycleState();
        resolve();
      };
      this.pendingAd = { kind: 'interstitial', rewarded: false, finish };
      try {
        void sdk.showAd().then(finish).catch(finish);
      } catch {
        finish();
      }
    });
  }

  public async showRewarded(): Promise<RewardResult> {
    const sdk = this.sdk;
    if (!sdk || this.pendingAd) return { rewarded: false };

    return await new Promise<RewardResult>((resolve) => {
      let settled = false;
      const pending: PendingAdvertisement = {
        kind: 'rewarded',
        rewarded: false,
        finish: () => {
          if (settled) return;
          settled = true;
          this.pendingAd = null;
          this.adPaused = false;
          this.syncLifecycleState();
          resolve({ rewarded: pending.rewarded });
          this.preloadRewarded();
        }
      };
      this.pendingAd = pending;
      try {
        void sdk.showAd('rewarded').then(pending.finish).catch(pending.finish);
      } catch {
        pending.finish();
      }
    });
  }

  public trackEvent(event: GameAnalyticsEvent): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent<GameAnalyticsEvent>(ANALYTICS_EVENT_NAME, { detail: event }));
  }

  public async loadSave<T>(): Promise<T | null> {
    if (!this.storage) return null;
    try {
      const raw = this.storage.getItem(SAVE_KEY);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  public async save<T>(value: T): Promise<void> {
    if (!this.storage) return;
    try {
      this.storage.setItem(SAVE_KEY, JSON.stringify(value));
    } catch {
      // GameDistribution has no general cloud-save API; local persistence must fail soft.
    }
  }

  private handleSdkEvent(event: GameDistributionEvent): void {
    switch (event.name) {
      case 'SDK_GAME_PAUSE':
        this.adPaused = true;
        this.syncLifecycleState();
        break;
      case 'SDK_GAME_START':
        this.adPaused = false;
        this.syncLifecycleState();
        this.pendingAd?.finish();
        break;
      case 'SDK_REWARDED_WATCH_COMPLETE':
        if (this.pendingAd?.kind === 'rewarded') this.pendingAd.rewarded = true;
        break;
      case 'SDK_ERROR':
        this.adPaused = false;
        this.syncLifecycleState();
        this.pendingAd?.finish();
        break;
      default:
        break;
    }
  }

  private preloadRewarded(): void {
    try {
      void this.sdk?.preloadAd?.('rewarded').catch(() => undefined);
    } catch {
      // Rewarded availability is optional; gameplay must continue without it.
    }
  }

  private syncLifecycleState(): void {
    const shouldPause = this.adPaused;
    if (shouldPause === this.lifecyclePaused) return;
    this.lifecyclePaused = shouldPause;
    if (shouldPause) this.lifecycleHandlers?.pause();
    else this.lifecycleHandlers?.resume();
  }
}

export class BrowserGameDistributionLoader implements GameDistributionLoaderLike {
  public constructor(
    private readonly gameId: string = configuredGameId(),
    private readonly globalScope: GameDistributionGlobalLike = globalThis as GameDistributionGlobalLike,
    private readonly documentRef: Document = globalThis.document
  ) {}

  public async load(onEvent: (event: GameDistributionEvent) => void): Promise<GameDistributionSdkLike> {
    const gameId = this.gameId.trim();
    if (!gameId) throw new Error('GameDistribution Game ID is not configured');

    const existing = this.globalScope.gdsdk;
    if (existing) return existing;
    if (!this.documentRef) throw new Error('GameDistribution SDK requires a browser document');

    return await new Promise<GameDistributionSdkLike>((resolve, reject) => {
      let settled = false;
      const finishReady = (): void => {
        if (settled) return;
        const sdk = this.globalScope.gdsdk;
        if (!sdk) return;
        settled = true;
        resolve(sdk);
      };
      const finishError = (message: string): void => {
        if (settled) return;
        settled = true;
        reject(new Error(message));
      };

      this.globalScope.GD_OPTIONS = {
        gameId,
        advertisementSettings: { autoplay: false },
        onEvent: (event) => {
          onEvent(event);
          if (event.name === 'SDK_READY') finishReady();
          else if (event.name === 'SDK_ERROR') finishError('GameDistribution SDK reported an error');
        }
      };

      const existingScript = this.documentRef.querySelector<HTMLScriptElement>(`script[src="${GAME_DISTRIBUTION_SDK_SRC}"]`);
      if (existingScript) {
        existingScript.addEventListener('error', () => finishError('GameDistribution SDK failed to load'), { once: true });
        finishReady();
        return;
      }

      const script = this.documentRef.createElement('script');
      script.id = 'gamedistribution-jssdk';
      script.src = GAME_DISTRIBUTION_SDK_SRC;
      script.async = true;
      script.addEventListener('load', () => finishReady(), { once: true });
      script.addEventListener('error', () => finishError('GameDistribution SDK failed to load'), { once: true });
      this.documentRef.head.appendChild(script);
    });
  }
}

export function configuredGameId(search = typeof globalThis.location === 'undefined' ? '' : globalThis.location.search): string {
  try {
    const queryId = new URLSearchParams(search).get('gd_game_id')?.trim();
    if (queryId) return queryId;
  } catch {
    // Ignore malformed QA query strings.
  }
  const globalId = (globalThis as GameDistributionGlobalLike).GD_GAME_ID?.trim();
  if (globalId) return globalId;
  return import.meta.env.VITE_GAMEDISTRIBUTION_GAME_ID?.trim() ?? '';
}

function safeLocalStorage(): GameDistributionStorageLike | null {
  try {
    return typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage;
  } catch {
    return null;
  }
}
