import type { GameAnalyticsEvent } from '../analytics/events';
import type { PlatformAdapter, PlatformLifecycleHandlers, RewardResult } from './PlatformAdapter';

const LOCAL_SAVE_KEY = 'brainrot-merge-boss:save';
const CLOUD_SAVE_KEY = 'brainrorSave';
const ANALYTICS_EVENT_NAME = 'brainror:analytics';
export const CLOUD_SAVE_MIN_INTERVAL_MS = 3_500;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface YandexPlayerLike {
  getData(keys?: string[]): Promise<Record<string, unknown>>;
  setData(data: Record<string, unknown>, flush?: boolean): Promise<void>;
}

interface AdCallbacks {
  readonly onOpen?: () => void;
  readonly onClose?: (wasShown: boolean) => void;
  readonly onError?: (error: unknown) => void;
}

interface RewardedCallbacks extends AdCallbacks {
  readonly onRewarded?: () => void;
}

export interface YandexSdkLike {
  readonly features?: {
    readonly LoadingAPI?: { ready(): void };
    readonly GameplayAPI?: { start(): void; stop(): void };
  };
  readonly adv: {
    showFullscreenAdv(options?: { callbacks?: AdCallbacks }): void;
    showRewardedVideo(options?: { callbacks?: RewardedCallbacks }): void;
  };
  getPlayer(): Promise<YandexPlayerLike>;
  on?(event: 'game_api_pause' | 'game_api_resume', callback: () => void): void;
  off?(event: 'game_api_pause' | 'game_api_resume', callback: () => void): void;
}

export interface YandexGamesLoaderLike {
  init(): Promise<YandexSdkLike>;
}

export class YandexAdapter implements PlatformAdapter {
  public readonly id = 'yandex' as const;

  private sdk: YandexSdkLike | null = null;
  private player: YandexPlayerLike | null = null;
  private lifecycleHandlers: PlatformLifecycleHandlers | null = null;
  private gameplayActive = false;
  private eventPaused = false;
  private adPaused = false;
  private lifecyclePaused = false;
  private pendingCloudSave: unknown | null = null;
  private cloudSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private cloudWriteInFlight = false;
  private lastCloudSaveAt = 0;

  private readonly pauseHandler = (): void => {
    this.eventPaused = true;
    this.syncLifecycleState();
    void this.flushPendingCloudSave(true);
  };

  private readonly resumeHandler = (): void => {
    this.eventPaused = false;
    this.syncLifecycleState();
  };

  public constructor(
    private readonly loader: YandexGamesLoaderLike,
    private readonly storage: StorageLike = globalThis.localStorage,
    private readonly now: () => number = () => Date.now()
  ) {}

  public async initialize(): Promise<void> {
    this.sdk = await this.loader.init();
    try {
      this.player = await this.sdk.getPlayer();
    } catch {
      this.player = null;
    }
    this.sdk.on?.('game_api_pause', this.pauseHandler);
    this.sdk.on?.('game_api_resume', this.resumeHandler);
  }

  public loadingReady(): void {
    this.sdk?.features?.LoadingAPI?.ready();
  }

  public setLifecycleHandlers(handlers: PlatformLifecycleHandlers): void {
    this.lifecycleHandlers = handlers;
    if (this.lifecyclePaused) handlers.pause();
  }

  public gameplayStart(): void {
    if (this.gameplayActive) return;
    this.gameplayActive = true;
    this.sdk?.features?.GameplayAPI?.start();
  }

  public gameplayStop(): void {
    if (!this.gameplayActive) return;
    this.gameplayActive = false;
    this.sdk?.features?.GameplayAPI?.stop();
  }

  public async showInterstitial(): Promise<void> {
    const sdk = this.sdk;
    if (!sdk) return;
    await new Promise<void>((resolve) => {
      let opened = false;
      let settled = false;
      const finish = (): void => {
        if (settled) return;
        settled = true;
        if (opened) {
          this.adPaused = false;
          this.syncLifecycleState();
        }
        resolve();
      };
      try {
        sdk.adv.showFullscreenAdv({
          callbacks: {
            onOpen: () => {
              opened = true;
              this.adPaused = true;
              this.syncLifecycleState();
            },
            onClose: () => finish(),
            onError: () => finish()
          }
        });
      } catch {
        finish();
      }
    });
  }

  public async showRewarded(): Promise<RewardResult> {
    const sdk = this.sdk;
    if (!sdk) return { rewarded: false };
    return await new Promise<RewardResult>((resolve) => {
      let opened = false;
      let rewarded = false;
      let settled = false;
      const finish = (): void => {
        if (settled) return;
        settled = true;
        if (opened) {
          this.adPaused = false;
          this.syncLifecycleState();
        }
        resolve({ rewarded });
      };
      try {
        sdk.adv.showRewardedVideo({
          callbacks: {
            onOpen: () => {
              opened = true;
              this.adPaused = true;
              this.syncLifecycleState();
            },
            onRewarded: () => {
              rewarded = true;
            },
            onClose: () => finish(),
            onError: () => finish()
          }
        });
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
    const local = this.readLocalSave<T>();
    const cloud = await this.readCloudSave<T>();
    const selected = selectNewestSave(local, cloud);

    if (selected === cloud && cloud !== null) {
      this.writeLocalSave(cloud);
    } else if (selected === local && local !== null && this.player) {
      this.pendingCloudSave = local;
      this.scheduleCloudSave();
    }
    return selected;
  }

  public async save<T>(value: T): Promise<void> {
    this.writeLocalSave(value);
    if (!this.player) return;
    this.pendingCloudSave = value;
    this.scheduleCloudSave();
  }

  private syncLifecycleState(): void {
    const shouldPause = this.eventPaused || this.adPaused;
    if (shouldPause === this.lifecyclePaused) return;
    this.lifecyclePaused = shouldPause;
    if (shouldPause) this.lifecycleHandlers?.pause();
    else this.lifecycleHandlers?.resume();
  }

  private readLocalSave<T>(): T | null {
    try {
      const raw = this.storage.getItem(LOCAL_SAVE_KEY);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  private writeLocalSave<T>(value: T): void {
    try {
      this.storage.setItem(LOCAL_SAVE_KEY, JSON.stringify(value));
    } catch {
      // Cloud save can still succeed even if local storage is unavailable.
    }
  }

  private async readCloudSave<T>(): Promise<T | null> {
    if (!this.player) return null;
    try {
      const data = await this.player.getData([CLOUD_SAVE_KEY]);
      const value = data[CLOUD_SAVE_KEY];
      return value === undefined || value === null ? null : (value as T);
    } catch {
      return null;
    }
  }

  private scheduleCloudSave(): void {
    if (!this.player || this.pendingCloudSave === null || this.cloudSaveTimer || this.cloudWriteInFlight) return;
    const elapsed = this.now() - this.lastCloudSaveAt;
    const delay = Math.max(0, CLOUD_SAVE_MIN_INTERVAL_MS - elapsed);
    if (delay === 0) {
      void this.flushPendingCloudSave(false);
      return;
    }
    this.cloudSaveTimer = setTimeout(() => {
      this.cloudSaveTimer = null;
      void this.flushPendingCloudSave(false);
    }, delay);
  }

  private async flushPendingCloudSave(flush: boolean): Promise<void> {
    if (!this.player || this.pendingCloudSave === null || this.cloudWriteInFlight) return;
    if (this.cloudSaveTimer) {
      clearTimeout(this.cloudSaveTimer);
      this.cloudSaveTimer = null;
    }
    const value = this.pendingCloudSave;
    this.pendingCloudSave = null;
    this.cloudWriteInFlight = true;
    this.lastCloudSaveAt = this.now();
    try {
      await this.player.setData({ [CLOUD_SAVE_KEY]: value }, flush);
    } catch {
      if (this.pendingCloudSave === null) this.pendingCloudSave = value;
    } finally {
      this.cloudWriteInFlight = false;
      if (this.pendingCloudSave !== null) this.scheduleCloudSave();
    }
  }
}

export function selectNewestSave<T>(local: T | null, cloud: T | null): T | null {
  if (local === null) return cloud;
  if (cloud === null) return local;
  const localUpdatedAt = updatedAtOf(local);
  const cloudUpdatedAt = updatedAtOf(cloud);
  if (cloudUpdatedAt > localUpdatedAt) return cloud;
  return local;
}

function updatedAtOf(value: unknown): number {
  if (typeof value !== 'object' || value === null || !('updatedAt' in value)) return 0;
  const updatedAt = (value as { updatedAt?: unknown }).updatedAt;
  return typeof updatedAt === 'number' && Number.isFinite(updatedAt) ? updatedAt : 0;
}
