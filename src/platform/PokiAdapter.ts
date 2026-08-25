import type { GameAnalyticsEvent } from '../analytics/events';
import type { PlatformAdapter, PlatformLifecycleHandlers, RewardResult } from './PlatformAdapter';

const SAVE_KEY = 'brainrot-merge-boss:save';
const ANALYTICS_EVENT_NAME = 'brainror:analytics';
export const POKI_SDK_SRC = 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js';

export interface PokiStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface PokiSdkLike {
  init(): Promise<void>;
  gameLoadingFinished(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  commercialBreak(onStart?: () => void): Promise<void>;
  rewardedBreak(options?: (() => void) | { readonly size?: 'small' | 'medium' | 'large'; readonly onStart?: () => void }): Promise<boolean>;
}

export interface PokiLoaderLike {
  load(): Promise<PokiSdkLike>;
}

interface PokiWindowLike {
  PokiSDK?: PokiSdkLike;
}

export class PokiAdapter implements PlatformAdapter {
  public readonly id = 'poki' as const;

  private sdk: PokiSdkLike | null = null;
  private lifecycleHandlers: PlatformLifecycleHandlers | null = null;
  private gameplayActive = false;
  private adPaused = false;
  private lifecyclePaused = false;

  public constructor(
    private readonly loader: PokiLoaderLike = new BrowserPokiLoader(),
    private readonly storage: PokiStorageLike | null = safeLocalStorage()
  ) {}

  public async initialize(): Promise<void> {
    const sdk = await this.loader.load();
    try {
      await sdk.init();
    } catch {
      // Poki explicitly recommends continuing the game if init reports an error.
    }
    this.sdk = sdk;
  }

  public loadingReady(): void {
    try {
      this.sdk?.gameLoadingFinished();
    } catch {
      // Loading telemetry must never block gameplay.
    }
  }

  public setLifecycleHandlers(handlers: PlatformLifecycleHandlers): void {
    this.lifecycleHandlers = handlers;
    if (this.lifecyclePaused) handlers.pause();
  }

  public gameplayStart(): void {
    if (this.gameplayActive) return;
    this.gameplayActive = true;
    try {
      this.sdk?.gameplayStart();
    } catch {
      // Portal telemetry is non-critical.
    }
  }

  public gameplayStop(): void {
    if (!this.gameplayActive) return;
    this.gameplayActive = false;
    try {
      this.sdk?.gameplayStop();
    } catch {
      // Portal telemetry is non-critical.
    }
  }

  public async showInterstitial(): Promise<void> {
    const sdk = this.sdk;
    if (!sdk) return;
    let started = false;
    const onStart = (): void => {
      if (started) return;
      started = true;
      this.adPaused = true;
      this.syncLifecycleState();
    };
    try {
      await sdk.commercialBreak(onStart);
    } catch {
      // A failed ad opportunity must resume the game without blocking progress.
    } finally {
      if (started) {
        this.adPaused = false;
        this.syncLifecycleState();
      }
    }
  }

  public async showRewarded(): Promise<RewardResult> {
    const sdk = this.sdk;
    if (!sdk) return { rewarded: false };
    let started = false;
    const onStart = (): void => {
      if (started) return;
      started = true;
      this.adPaused = true;
      this.syncLifecycleState();
    };
    let rewarded: boolean;
    try {
      rewarded = await sdk.rewardedBreak({ size: 'medium', onStart });
    } catch {
      rewarded = false;
    } finally {
      if (started) {
        this.adPaused = false;
        this.syncLifecycleState();
      }
    }
    return { rewarded };
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
      // Poki requires incognito-safe LocalStorage access. Cloud sync is automatic when storage works.
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

export class BrowserPokiLoader implements PokiLoaderLike {
  public constructor(
    private readonly globalScope: PokiWindowLike = globalThis as PokiWindowLike,
    private readonly documentRef: Document = globalThis.document
  ) {}

  public async load(): Promise<PokiSdkLike> {
    const existing = this.globalScope.PokiSDK;
    if (existing) return existing;
    if (!this.documentRef) throw new Error('Poki SDK requires a browser document');

    await new Promise<void>((resolve, reject) => {
      const existingScript = this.documentRef.querySelector<HTMLScriptElement>(`script[src="${POKI_SDK_SRC}"]`);
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Poki SDK failed to load')), { once: true });
        return;
      }
      const script = this.documentRef.createElement('script');
      script.src = POKI_SDK_SRC;
      script.async = true;
      script.addEventListener('load', () => resolve(), { once: true });
      script.addEventListener('error', () => reject(new Error('Poki SDK failed to load')), { once: true });
      this.documentRef.head.appendChild(script);
    });

    const sdk = this.globalScope.PokiSDK;
    if (!sdk) throw new Error('Poki SDK global is unavailable after script load');
    return sdk;
  }
}

function safeLocalStorage(): PokiStorageLike | null {
  try {
    return typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage;
  } catch {
    return null;
  }
}
