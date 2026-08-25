import { describe, expect, it, vi } from 'vitest';
import {
  CrazyGamesAdapter,
  type CrazyGamesLoaderLike,
  type CrazyGamesSdkLike
} from './CrazyGamesAdapter';

function createHarness() {
  const data = new Map<string, string>();
  let adCallbacks: {
    adStarted?: () => void;
    adError?: (error: unknown) => void;
    adFinished?: () => void;
  } | undefined;
  const sdk: CrazyGamesSdkLike = {
    init: vi.fn(async () => {}),
    game: {
      loadingStart: vi.fn(),
      loadingStop: vi.fn(),
      gameplayStart: vi.fn(),
      gameplayStop: vi.fn()
    },
    ad: {
      requestAd: vi.fn((_type, callbacks) => {
        adCallbacks = callbacks;
      })
    },
    data: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => { data.set(key, value); }
    }
  };
  const loader: CrazyGamesLoaderLike = { load: vi.fn(async () => sdk) };
  return { sdk, loader, data, getAdCallbacks: () => adCallbacks };
}

describe('CrazyGamesAdapter', () => {
  it('initializes SDK loading and reports loading completion', async () => {
    const harness = createHarness();
    const adapter = new CrazyGamesAdapter(harness.loader);
    await adapter.initialize();
    expect(harness.loader.load).toHaveBeenCalledTimes(1);
    expect(harness.sdk.init).toHaveBeenCalledTimes(1);
    expect(harness.sdk.game.loadingStart).toHaveBeenCalledTimes(1);
    adapter.loadingReady();
    expect(harness.sdk.game.loadingStop).toHaveBeenCalledTimes(1);
  });

  it('keeps gameplay lifecycle calls idempotent', async () => {
    const harness = createHarness();
    const adapter = new CrazyGamesAdapter(harness.loader);
    await adapter.initialize();
    adapter.gameplayStart();
    adapter.gameplayStart();
    expect(harness.sdk.game.gameplayStart).toHaveBeenCalledTimes(1);
    adapter.gameplayStop();
    adapter.gameplayStop();
    expect(harness.sdk.game.gameplayStop).toHaveBeenCalledTimes(1);
  });

  it('pauses around midgame ads and resumes after completion', async () => {
    const harness = createHarness();
    const adapter = new CrazyGamesAdapter(harness.loader);
    const pause = vi.fn();
    const resume = vi.fn();
    await adapter.initialize();
    adapter.setLifecycleHandlers({ pause, resume });
    const pending = adapter.showInterstitial();
    const callbacks = harness.getAdCallbacks();
    expect(harness.sdk.ad.requestAd).toHaveBeenCalledWith('midgame', expect.any(Object));
    callbacks?.adStarted?.();
    expect(pause).toHaveBeenCalledTimes(1);
    callbacks?.adFinished?.();
    await pending;
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('only grants rewarded completion when the rewarded ad finishes', async () => {
    const successHarness = createHarness();
    const successAdapter = new CrazyGamesAdapter(successHarness.loader);
    await successAdapter.initialize();
    const success = successAdapter.showRewarded();
    successHarness.getAdCallbacks()?.adStarted?.();
    successHarness.getAdCallbacks()?.adFinished?.();
    await expect(success).resolves.toEqual({ rewarded: true });

    const errorHarness = createHarness();
    const errorAdapter = new CrazyGamesAdapter(errorHarness.loader);
    await errorAdapter.initialize();
    const error = errorAdapter.showRewarded();
    errorHarness.getAdCallbacks()?.adStarted?.();
    errorHarness.getAdCallbacks()?.adError?.(new Error('blocked'));
    await expect(error).resolves.toEqual({ rewarded: false });
  });

  it('uses the CrazyGames data module as the canonical save store', async () => {
    const harness = createHarness();
    const adapter = new CrazyGamesAdapter(harness.loader);
    await adapter.initialize();
    await adapter.save({ version: 9, chapter: 7, updatedAt: 42 });
    expect(harness.data.size).toBe(1);
    await expect(adapter.loadSave()).resolves.toEqual({ version: 9, chapter: 7, updatedAt: 42 });
  });

  it('fails soft on malformed or unavailable data', async () => {
    const harness = createHarness();
    const adapter = new CrazyGamesAdapter(harness.loader);
    await adapter.initialize();
    harness.data.set('brainrot-merge-boss:save', '{bad json');
    await expect(adapter.loadSave()).resolves.toBeNull();
  });
});
