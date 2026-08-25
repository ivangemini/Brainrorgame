import { describe, expect, it, vi } from 'vitest';
import {
  configuredGameId,
  GameDistributionAdapter,
  type GameDistributionEvent,
  type GameDistributionLoaderLike,
  type GameDistributionSdkLike,
  type GameDistributionStorageLike
} from './GameDistributionAdapter';

class MemoryStorage implements GameDistributionStorageLike {
  private readonly values = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function createHarness() {
  let emit: (event: GameDistributionEvent) => void = () => undefined;
  let completeAd: () => void = () => undefined;
  const showAd = vi.fn((_type?: 'rewarded') => new Promise<unknown>((resolve) => {
    completeAd = () => resolve(undefined);
  }));
  const preloadAd = vi.fn(async (_type: 'rewarded') => undefined);
  const sdk: GameDistributionSdkLike = { showAd, preloadAd };
  const loader: GameDistributionLoaderLike = {
    load: async (onEvent) => {
      emit = onEvent;
      return sdk;
    }
  };
  const storage = new MemoryStorage();
  const adapter = new GameDistributionAdapter(loader, storage);
  return {
    adapter,
    emit: (name: string) => emit({ name }),
    showAd,
    preloadAd,
    completeAd,
    storage,
    refreshCompleteAd: () => completeAd
  };
}

describe('GameDistributionAdapter', () => {
  it('preloads rewarded inventory after initialization', async () => {
    const { adapter, preloadAd } = createHarness();
    await adapter.initialize();
    expect(preloadAd).toHaveBeenCalledWith('rewarded');
  });

  it('pauses on SDK_GAME_PAUSE and resumes after SDK_GAME_START', async () => {
    const harness = createHarness();
    const pause = vi.fn();
    const resume = vi.fn();
    await harness.adapter.initialize();
    harness.adapter.setLifecycleHandlers({ pause, resume });

    const ad = harness.adapter.showInterstitial();
    expect(harness.showAd).toHaveBeenCalledWith();
    harness.emit('SDK_GAME_PAUSE');
    expect(pause).toHaveBeenCalledTimes(1);
    harness.emit('SDK_GAME_START');
    harness.refreshCompleteAd()();
    await ad;

    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('grants rewarded value only after SDK_REWARDED_WATCH_COMPLETE', async () => {
    const harness = createHarness();
    await harness.adapter.initialize();

    const rewarded = harness.adapter.showRewarded();
    expect(harness.showAd).toHaveBeenCalledWith('rewarded');
    harness.emit('SDK_GAME_PAUSE');
    harness.emit('SDK_REWARDED_WATCH_COMPLETE');
    harness.emit('SDK_GAME_START');
    harness.refreshCompleteAd()();

    await expect(rewarded).resolves.toEqual({ rewarded: true });
    expect(harness.preloadAd).toHaveBeenCalledTimes(2);
  });

  it('does not grant reward when a rewarded ad closes without completion', async () => {
    const harness = createHarness();
    await harness.adapter.initialize();

    const rewarded = harness.adapter.showRewarded();
    harness.emit('SDK_GAME_PAUSE');
    harness.emit('SDK_GAME_START');
    harness.refreshCompleteAd()();

    await expect(rewarded).resolves.toEqual({ rewarded: false });
  });

  it('fails soft when the SDK rejects an ad request', async () => {
    const sdk: GameDistributionSdkLike = {
      showAd: vi.fn(async () => { throw new Error('no fill'); }),
      preloadAd: vi.fn(async () => undefined)
    };
    const loader: GameDistributionLoaderLike = { load: async () => sdk };
    const adapter = new GameDistributionAdapter(loader, new MemoryStorage());
    await adapter.initialize();

    await expect(adapter.showInterstitial()).resolves.toBeUndefined();
    await expect(adapter.showRewarded()).resolves.toEqual({ rewarded: false });
  });

  it('persists saves locally and tolerates malformed data', async () => {
    const harness = createHarness();
    await harness.adapter.initialize();
    await harness.adapter.save({ chapter: 12, updatedAt: 42 });
    await expect(harness.adapter.loadSave()).resolves.toEqual({ chapter: 12, updatedAt: 42 });

    harness.storage.setItem('brainrot-merge-boss:save', '{not-json');
    await expect(harness.adapter.loadSave()).resolves.toBeNull();
  });

  it('accepts an explicit QA Game ID query override', () => {
    expect(configuredGameId('?platform=gamedistribution&gd_game_id=abc123')).toBe('abc123');
  });
});
