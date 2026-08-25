import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CLOUD_SAVE_MIN_INTERVAL_MS,
  YandexAdapter,
  selectNewestSave,
  type StorageLike,
  type YandexPlayerLike,
  type YandexSdkLike
} from './YandexAdapter';

type YandexEvent = 'game_api_pause' | 'game_api_resume';

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

interface FakeSdkBundle {
  readonly sdk: YandexSdkLike;
  readonly player: YandexPlayerLike;
  readonly events: Partial<Record<YandexEvent, () => void>>;
  readonly loadingReady: ReturnType<typeof vi.fn>;
  readonly gameplayStart: ReturnType<typeof vi.fn>;
  readonly gameplayStop: ReturnType<typeof vi.fn>;
  readonly setData: ReturnType<typeof vi.fn>;
}

function createFakeSdk(cloudData: Record<string, unknown> = {}): FakeSdkBundle {
  const events: Partial<Record<YandexEvent, () => void>> = {};
  const loadingReady = vi.fn();
  const gameplayStart = vi.fn();
  const gameplayStop = vi.fn();
  const setData = vi.fn(async () => undefined);
  const player: YandexPlayerLike = {
    getData: vi.fn(async () => cloudData),
    setData
  };
  const sdk: YandexSdkLike = {
    features: {
      LoadingAPI: { ready: loadingReady },
      GameplayAPI: { start: gameplayStart, stop: gameplayStop }
    },
    adv: {
      showFullscreenAdv: vi.fn((options) => {
        options?.callbacks?.onOpen?.();
        options?.callbacks?.onClose?.(true);
      }),
      showRewardedVideo: vi.fn((options) => {
        options?.callbacks?.onOpen?.();
        options?.callbacks?.onRewarded?.();
        options?.callbacks?.onClose?.(true);
      })
    },
    getPlayer: vi.fn(async () => player),
    on: vi.fn((event, callback) => {
      events[event] = callback;
    })
  };
  return { sdk, player, events, loadingReady, gameplayStart, gameplayStop, setData };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('YandexAdapter', () => {
  it('initializes SDK, signals loading, and keeps gameplay API idempotent', async () => {
    const bundle = createFakeSdk();
    const adapter = new YandexAdapter({ init: vi.fn(async () => bundle.sdk) }, new MemoryStorage());

    await adapter.initialize();
    adapter.loadingReady();
    adapter.gameplayStart();
    adapter.gameplayStart();
    adapter.gameplayStop();
    adapter.gameplayStop();

    expect(bundle.loadingReady).toHaveBeenCalledTimes(1);
    expect(bundle.gameplayStart).toHaveBeenCalledTimes(1);
    expect(bundle.gameplayStop).toHaveBeenCalledTimes(1);
  });

  it('replays an early platform pause when lifecycle handlers attach later', async () => {
    const bundle = createFakeSdk();
    const adapter = new YandexAdapter({ init: vi.fn(async () => bundle.sdk) }, new MemoryStorage());
    await adapter.initialize();

    bundle.events.game_api_pause?.();
    const pause = vi.fn();
    const resume = vi.fn();
    adapter.setLifecycleHandlers({ pause, resume });
    bundle.events.game_api_resume?.();

    expect(pause).toHaveBeenCalledTimes(1);
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('does not double-resume when ad and game_api pause overlap', async () => {
    const bundle = createFakeSdk();
    let closeAd: (() => void) | null = null;
    bundle.sdk.adv.showFullscreenAdv = vi.fn((options) => {
      options?.callbacks?.onOpen?.();
      closeAd = () => options?.callbacks?.onClose?.(true);
    });
    const adapter = new YandexAdapter({ init: vi.fn(async () => bundle.sdk) }, new MemoryStorage());
    await adapter.initialize();
    const pause = vi.fn();
    const resume = vi.fn();
    adapter.setLifecycleHandlers({ pause, resume });

    const adPromise = adapter.showInterstitial();
    bundle.events.game_api_pause?.();
    closeAd?.();
    expect(resume).toHaveBeenCalledTimes(0);
    bundle.events.game_api_resume?.();
    await adPromise;

    expect(pause).toHaveBeenCalledTimes(1);
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('rewards only after onRewarded, not merely after closing the video', async () => {
    const bundle = createFakeSdk();
    const storage = new MemoryStorage();
    const rewardedAdapter = new YandexAdapter({ init: vi.fn(async () => bundle.sdk) }, storage);
    await rewardedAdapter.initialize();
    await expect(rewardedAdapter.showRewarded()).resolves.toEqual({ rewarded: true });

    bundle.sdk.adv.showRewardedVideo = vi.fn((options) => {
      options?.callbacks?.onOpen?.();
      options?.callbacks?.onClose?.(true);
    });
    const skippedAdapter = new YandexAdapter({ init: vi.fn(async () => bundle.sdk) }, storage);
    await skippedAdapter.initialize();
    await expect(skippedAdapter.showRewarded()).resolves.toEqual({ rewarded: false });
  });

  it('resolves ad errors without granting a rewarded result', async () => {
    const bundle = createFakeSdk();
    bundle.sdk.adv.showRewardedVideo = vi.fn((options) => {
      options?.callbacks?.onOpen?.();
      options?.callbacks?.onError?.(new Error('ad failed'));
    });
    const adapter = new YandexAdapter({ init: vi.fn(async () => bundle.sdk) }, new MemoryStorage());
    await adapter.initialize();

    await expect(adapter.showRewarded()).resolves.toEqual({ rewarded: false });
  });

  it('uses local saves when player initialization is unavailable', async () => {
    const storage = new MemoryStorage();
    storage.setItem('brainrot-merge-boss:save', JSON.stringify({ updatedAt: 50, marker: 'local' }));
    const bundle = createFakeSdk();
    bundle.sdk.getPlayer = vi.fn(async () => { throw new Error('guest player unavailable'); });
    const adapter = new YandexAdapter({ init: vi.fn(async () => bundle.sdk) }, storage);
    await adapter.initialize();

    await expect(adapter.loadSave<{ updatedAt: number; marker: string }>()).resolves.toEqual({ updatedAt: 50, marker: 'local' });
  });

  it('selects the newest cloud save and caches it locally', async () => {
    const storage = new MemoryStorage();
    storage.setItem('brainrot-merge-boss:save', JSON.stringify({ updatedAt: 10, marker: 'local' }));
    const cloudSave = { updatedAt: 20, marker: 'cloud' };
    const bundle = createFakeSdk({ brainrorSave: cloudSave });
    const adapter = new YandexAdapter({ init: vi.fn(async () => bundle.sdk) }, storage);
    await adapter.initialize();

    await expect(adapter.loadSave<typeof cloudSave>()).resolves.toEqual(cloudSave);
    expect(JSON.parse(storage.getItem('brainrot-merge-boss:save') ?? 'null')).toEqual(cloudSave);
  });

  it('throttles repeated cloud writes while keeping local save immediate', async () => {
    vi.useFakeTimers();
    let now = 10_000;
    const storage = new MemoryStorage();
    const bundle = createFakeSdk();
    const adapter = new YandexAdapter(
      { init: vi.fn(async () => bundle.sdk) },
      storage,
      () => now
    );
    await adapter.initialize();

    await adapter.save({ updatedAt: 1, marker: 'first' });
    await Promise.resolve();
    expect(bundle.setData).toHaveBeenCalledTimes(1);

    now += 100;
    await adapter.save({ updatedAt: 2, marker: 'second' });
    expect(bundle.setData).toHaveBeenCalledTimes(1);
    expect(JSON.parse(storage.getItem('brainrot-merge-boss:save') ?? 'null')).toEqual({ updatedAt: 2, marker: 'second' });

    await vi.advanceTimersByTimeAsync(CLOUD_SAVE_MIN_INTERVAL_MS);
    expect(bundle.setData).toHaveBeenCalledTimes(2);
    expect(bundle.setData).toHaveBeenLastCalledWith({ brainrorSave: { updatedAt: 2, marker: 'second' } }, false);
  });
});

describe('selectNewestSave', () => {
  it('prefers the save with the latest updatedAt timestamp', () => {
    const local = { updatedAt: 100, source: 'local' };
    const cloud = { updatedAt: 200, source: 'cloud' };
    expect(selectNewestSave(local, cloud)).toBe(cloud);
    expect(selectNewestSave(cloud, local)).toBe(cloud);
  });
});
