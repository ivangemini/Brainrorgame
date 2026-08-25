import type { GameAnalyticsEvent } from '../analytics/events';
import type { PlatformAdapter, PlatformLifecycleHandlers, RewardResult } from './PlatformAdapter';

const SAVE_KEY = 'brainrot-merge-boss:save';
const ANALYTICS_EVENT_NAME = 'brainror:analytics';
export const CRAZYGAMES_SDK_SRC = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';

export interface CrazyGamesDataLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface CrazyGamesAdCallbacks {
  readonly adStarted?: () => void;
  readonly adError?: (error: unknown) => void;
  readonly adFinished?: () => void;
}

export interface CrazyGamesSdkLike {
  init(): Promise<void>;
  readonly game: {
    loadingStart?(): void;
    loadingStop?(): void;
    gameplayStart(): void;
    gameplayStop(): void;
  };
  readonly ad: {
    requestAd(type: 'midgame' | 'rewarded', callbacks?: CrazyGamesAdCallbacks): void;
  };
  readonly data: CrazyGamesDataLike;
}

export interface CrazyGamesLoaderLike {
  load(): Promise<CrazyGamesSdkLike>;
}

interface CrazyGamesWindowLike {
  CrazyGames?: { readonly SDK?: CrazyGamesSdkLike };
}

export class CrazyGamesAdapter implements PlatformAdapter {
  public readonly id = 'crazygames' as const;

  private sdk: CrazyGamesSdkLike | null = null;
  private lifecycleHandlers: PlatformLifecycleHandlers | null = null;
  private gameplayActive = false;
  private adPaused = false;
  private lifecyclePaused = false;

  public constructor(private readonly loader: CrazyGamesLoaderLike = new BrowserCrazyGamesLoader()) {}

  public async initialize(): Promise<void> {
    const sdk = await this.loader.load();
    await sdk.init();
    this.sdk = sdk;
    sdk.game.loadingStart?.();
  }

  public loadingReady(): void {
    this.sdk?.game.loadingStop?.();
  }

  public setLifecycleHandlers(handlers: PlatformLifecycleHandlers): void {
    this.lifecycleHandlers = handlers;
    if (this.lifecyclePaused) handlers.pause();
  }

  public gameplayStart(): void {
    if (this.gameplayActive) return;
    this.gameplayActive = true;
    this.sdk?.game.gameplayStart();
  }

  public gameplayStop(): void {
    if (!this.gameplayActive) return;
    this.gameplayActive = false;
    this.sdk?.game.gameplayStop();
  }

  public async showInterstitial(): Promise<void> {
    await this.requestAd('midgame');
  }

  public async showRewarded(): Promise<RewardResult> {
    const finished = await this.requestAd('rewarded');
    return { rewarded: finished };
  }

  public trackEvent(event: GameAnalyticsEvent): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent<GameAnalyticsEvent>(ANALYTICS_EVENT_NAME, { detail: event }));
  }

  public async loadSave<T>(): Promise<T | null> {
    const sdk = this.sdk;
    if (!sdk) return null;
    try {
      const raw = sdk.data.getItem(SAVE_KEY);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  public async save<T>(value: T): Promise<void> {
    const sdk = this.sdk;
    if (!sdk) return;
    try {
      sdk.data.setItem(SAVE_KEY, JSON.stringify(value));
    } catch {
      // CrazyGames data errors must not interrupt gameplay.
    }
  }

  private async requestAd(type: 'midgame' | 'rewarded'): Promise<boolean> {
    const sdk = this.sdk;
    if (!sdk) return false;
    return await new Promise<boolean>((resolve) => {
      let settled = false;
      const finish = (completed: boolean): void => {
        if (settled) return;
        settled = true;
        if (this.adPaused) {
          this.adPaused = false;
          this.syncLifecycleState();
        }
        resolve(completed);
      };
      try {
        sdk.ad.requestAd(type, {
          adStarted: () => {
            this.adPaused = true;
            this.syncLifecycleState();
          },
          adFinished: () => finish(true),
          adError: () => finish(false)
        });
      } catch {
        finish(false);
      }
    });
  }

  private syncLifecycleState(): void {
    const shouldPause = this.adPaused;
    if (shouldPause === this.lifecyclePaused) return;
    this.lifecyclePaused = shouldPause;
    if (shouldPause) this.lifecycleHandlers?.pause();
    else this.lifecycleHandlers?.resume();
  }
}

export class BrowserCrazyGamesLoader implements CrazyGamesLoaderLike {
  public constructor(
    private readonly globalScope: CrazyGamesWindowLike = globalThis as CrazyGamesWindowLike,
    private readonly documentRef: Document = globalThis.document
  ) {}

  public async load(): Promise<CrazyGamesSdkLike> {
    const existing = this.globalScope.CrazyGames?.SDK;
    if (existing) return existing;
    if (!this.documentRef) throw new Error('CrazyGames SDK requires a browser document');

    await new Promise<void>((resolve, reject) => {
      const alreadyLoading = this.documentRef.querySelector<HTMLScriptElement>(`script[src="${CRAZYGAMES_SDK_SRC}"]`);
      if (alreadyLoading) {
        alreadyLoading.addEventListener('load', () => resolve(), { once: true });
        alreadyLoading.addEventListener('error', () => reject(new Error('CrazyGames SDK failed to load')), { once: true });
        return;
      }
      const script = this.documentRef.createElement('script');
      script.src = CRAZYGAMES_SDK_SRC;
      script.async = true;
      script.addEventListener('load', () => resolve(), { once: true });
      script.addEventListener('error', () => reject(new Error('CrazyGames SDK failed to load')), { once: true });
      this.documentRef.head.appendChild(script);
    });

    const sdk = this.globalScope.CrazyGames?.SDK;
    if (!sdk) throw new Error('CrazyGames SDK global is unavailable after script load');
    return sdk;
  }
}
