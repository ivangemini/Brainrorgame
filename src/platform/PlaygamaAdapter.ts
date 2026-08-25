import type { GameAnalyticsEvent } from '../analytics/events';
import type { PlatformAdapter, PlatformLifecycleHandlers, RewardResult } from './PlatformAdapter';

const SAVE_KEY = 'brainrot-merge-boss:save';
const ANALYTICS_EVENT_NAME = 'brainror:analytics';
export const PLAYGAMA_BRIDGE_SRC = 'https://bridge.playgama.com/v1/stable/playgama-bridge.js';

const INTERSTITIAL_EVENT = 'interstitial_state_changed';
const REWARDED_EVENT = 'rewarded_state_changed';
const PAUSE_EVENT = 'pause_state_changed';

type InterstitialState = 'loading' | 'opened' | 'closed' | 'failed';
type RewardedState = 'loading' | 'opened' | 'closed' | 'failed' | 'rewarded';

type BridgeListener = (...args: unknown[]) => void;

interface BridgeEventEmitterLike {
  on(eventName: string, callback: BridgeListener): void;
  off(eventName: string, callback?: BridgeListener): void;
}

export interface PlaygamaPlatformLike extends BridgeEventEmitterLike {
  readonly id: string;
  readonly isPaused?: boolean;
  sendMessage(message: string, options?: Record<string, unknown>): Promise<unknown>;
}

export interface PlaygamaStorageLike {
  get(key: string | string[], tryParseJson?: boolean): Promise<unknown>;
  set(key: string | string[], value: unknown | unknown[]): Promise<void>;
}

export interface PlaygamaAdvertisementLike extends BridgeEventEmitterLike {
  readonly isInterstitialSupported: boolean;
  readonly isRewardedSupported: boolean;
  showInterstitial(placement?: string | null): void;
  showRewarded(placement?: string | null): void;
}

export interface PlaygamaBridgeLike {
  initialize(): Promise<void>;
  readonly platform: PlaygamaPlatformLike;
  readonly storage: PlaygamaStorageLike;
  readonly advertisement: PlaygamaAdvertisementLike;
}

export interface PlaygamaLoaderLike {
  load(): Promise<PlaygamaBridgeLike>;
}

interface PlaygamaGlobalLike {
  bridge?: PlaygamaBridgeLike;
  playgamaBridge?: PlaygamaBridgeLike;
}

export class PlaygamaAdapter implements PlatformAdapter {
  public readonly id = 'playgama' as const;

  private bridge: PlaygamaBridgeLike | null = null;
  private lifecycleHandlers: PlatformLifecycleHandlers | null = null;
  private gameplayActive = false;
  private platformPaused = false;
  private adPaused = false;
  private lifecyclePaused = false;

  private readonly pauseStateHandler: BridgeListener = (state): void => {
    this.platformPaused = Boolean(state);
    this.syncLifecycleState();
  };

  public constructor(private readonly loader: PlaygamaLoaderLike = new BrowserPlaygamaLoader()) {}

  public async initialize(): Promise<void> {
    const bridge = await this.loader.load();
    await bridge.initialize();
    this.bridge = bridge;
    this.platformPaused = Boolean(bridge.platform.isPaused);
    bridge.platform.on(PAUSE_EVENT, this.pauseStateHandler);
    this.syncLifecycleState();
  }

  public loadingReady(): void {
    void this.sendMessageSoft('game_ready');
  }

  public setLifecycleHandlers(handlers: PlatformLifecycleHandlers): void {
    this.lifecycleHandlers = handlers;
    if (this.lifecyclePaused) handlers.pause();
  }

  public gameplayStart(): void {
    if (this.gameplayActive) return;
    this.gameplayActive = true;
    void this.sendMessageSoft('gameplay_started');
  }

  public gameplayStop(): void {
    if (!this.gameplayActive) return;
    this.gameplayActive = false;
    void this.sendMessageSoft('gameplay_stopped');
  }

  public async showInterstitial(): Promise<void> {
    const advertisement = this.bridge?.advertisement;
    if (!advertisement?.isInterstitialSupported) return;

    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = (): void => {
        if (settled) return;
        settled = true;
        advertisement.off(INTERSTITIAL_EVENT, onState);
        this.adPaused = false;
        this.syncLifecycleState();
        resolve();
      };
      const onState: BridgeListener = (value): void => {
        const state = value as InterstitialState;
        if (state === 'opened') {
          this.adPaused = true;
          this.syncLifecycleState();
        } else if (state === 'closed' || state === 'failed') {
          finish();
        }
      };

      advertisement.on(INTERSTITIAL_EVENT, onState);
      try {
        advertisement.showInterstitial('chapter_break');
      } catch {
        finish();
      }
    });
  }

  public async showRewarded(): Promise<RewardResult> {
    const advertisement = this.bridge?.advertisement;
    if (!advertisement?.isRewardedSupported) return { rewarded: false };

    return await new Promise<RewardResult>((resolve) => {
      let settled = false;
      let rewarded = false;
      const finish = (): void => {
        if (settled) return;
        settled = true;
        advertisement.off(REWARDED_EVENT, onState);
        this.adPaused = false;
        this.syncLifecycleState();
        resolve({ rewarded });
      };
      const onState: BridgeListener = (value): void => {
        const state = value as RewardedState;
        if (state === 'opened') {
          this.adPaused = true;
          this.syncLifecycleState();
        } else if (state === 'rewarded') {
          rewarded = true;
        } else if (state === 'closed' || state === 'failed') {
          finish();
        }
      };

      advertisement.on(REWARDED_EVENT, onState);
      try {
        advertisement.showRewarded('rewarded_gameplay');
      } catch {
        finish();
      }
    });
  }

  public trackEvent(event: GameAnalyticsEvent): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent<GameAnalyticsEvent>(ANALYTICS_EVENT_NAME, { detail: event }));
  }

  public async loadSave<T>(): Promise<T | null> {
    const storage = this.bridge?.storage;
    if (!storage) return null;
    try {
      const value = await storage.get(SAVE_KEY, true);
      return value === undefined || value === null ? null : (value as T);
    } catch {
      return null;
    }
  }

  public async save<T>(value: T): Promise<void> {
    const storage = this.bridge?.storage;
    if (!storage) return;
    try {
      await storage.set(SAVE_KEY, value);
    } catch {
      // Playgama Bridge storage has its own cloud/local fallback; errors must not stop gameplay.
    }
  }

  private async sendMessageSoft(message: string): Promise<void> {
    const platform = this.bridge?.platform;
    if (!platform) return;
    try {
      await platform.sendMessage(message);
    } catch {
      // Platform telemetry/lifecycle messages are non-critical to the core loop.
    }
  }

  private syncLifecycleState(): void {
    const shouldPause = this.platformPaused || this.adPaused;
    if (shouldPause === this.lifecyclePaused) return;
    this.lifecyclePaused = shouldPause;
    if (shouldPause) this.lifecycleHandlers?.pause();
    else this.lifecycleHandlers?.resume();
  }
}

export class BrowserPlaygamaLoader implements PlaygamaLoaderLike {
  public constructor(
    private readonly globalScope: PlaygamaGlobalLike = globalThis as PlaygamaGlobalLike,
    private readonly documentRef: Document = globalThis.document
  ) {}

  public async load(): Promise<PlaygamaBridgeLike> {
    const existing = this.bridgeGlobal();
    if (existing) return existing;
    if (!this.documentRef) throw new Error('Playgama Bridge requires a browser document');

    await new Promise<void>((resolve, reject) => {
      const existingScript = this.documentRef.querySelector<HTMLScriptElement>(`script[src="${PLAYGAMA_BRIDGE_SRC}"]`);
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Playgama Bridge failed to load')), { once: true });
        return;
      }
      const script = this.documentRef.createElement('script');
      script.src = PLAYGAMA_BRIDGE_SRC;
      script.async = true;
      script.addEventListener('load', () => resolve(), { once: true });
      script.addEventListener('error', () => reject(new Error('Playgama Bridge failed to load')), { once: true });
      this.documentRef.head.appendChild(script);
    });

    const bridge = this.bridgeGlobal();
    if (!bridge) throw new Error('Playgama Bridge global is unavailable after script load');
    return bridge;
  }

  private bridgeGlobal(): PlaygamaBridgeLike | null {
    return this.globalScope.bridge ?? this.globalScope.playgamaBridge ?? null;
  }
}
