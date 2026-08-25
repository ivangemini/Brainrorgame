import { describe, expect, it, vi } from 'vitest';
import { PokiAdapter, type PokiLoaderLike, type PokiSdkLike } from './PokiAdapter';

function createHarness(initRejects = false) {
  let commercialStart: (() => void) | undefined;
  let rewardedStart: (() => void) | undefined;
  let resolveCommercial: (() => void) | undefined;
  let resolveRewarded: ((value: boolean) => void) | undefined;
  const sdk: PokiSdkLike = {
    init: vi.fn(async () => {
      if (initRejects) throw new Error('debug init failure');
    }),
    gameLoadingFinished: vi.fn(),
    gameplayStart: vi.fn(),
    gameplayStop: vi.fn(),
    commercialBreak: vi.fn((onStart) => {
      commercialStart = onStart;
      return new Promise<void>((resolve) => { resolveCommercial = resolve; });
    }),
    rewardedBreak: vi.fn((options) => {
      rewardedStart = typeof options === 'function' ? options : options?.onStart;
      return new Promise<boolean>((resolve) => { resolveRewarded = resolve; });
    })
  };
  const loader: PokiLoaderLike = { load: vi.fn(async () => sdk) };
  return {
    sdk,
    loader,
    startCommercial: () => commercialStart?.(),
    finishCommercial: () => resolveCommercial?.(),
    startRewarded: () => rewardedStart?.(),
    finishRewarded: (value: boolean) => resolveRewarded?.(value)
  };
}

describe('PokiAdapter', () => {
  it('initializes and reports loading completion', async () => {
    const harness = createHarness();
    const adapter = new PokiAdapter(harness.loader, null);
    await adapter.initialize();
    expect(harness.loader.load).toHaveBeenCalledTimes(1);
    expect(harness.sdk.init).toHaveBeenCalledTimes(1);
    adapter.loadingReady();
    expect(harness.sdk.gameLoadingFinished).toHaveBeenCalledTimes(1);
  });

  it('continues with the Poki adapter when SDK init rejects after the script loaded', async () => {
    const harness = createHarness(true);
    const adapter = new PokiAdapter(harness.loader, null);
    await expect(adapter.initialize()).resolves.toBeUndefined();
    adapter.loadingReady();
    expect(harness.sdk.gameLoadingFinished).toHaveBeenCalledTimes(1);
  });

  it('keeps gameplay lifecycle calls idempotent', async () => {
    const harness = createHarness();
    const adapter = new PokiAdapter(harness.loader, null);
    await adapter.initialize();
    adapter.gameplayStart();
    adapter.gameplayStart();
    expect(harness.sdk.gameplayStart).toHaveBeenCalledTimes(1);
    adapter.gameplayStop();
    adapter.gameplayStop();
    expect(harness.sdk.gameplayStop).toHaveBeenCalledTimes(1);
  });

  it('pauses only when a commercial actually starts and resumes after the break', async () => {
    const harness = createHarness();
    const adapter = new PokiAdapter(harness.loader, null);
    const pause = vi.fn();
    const resume = vi.fn();
    await adapter.initialize();
    adapter.setLifecycleHandlers({ pause, resume });
    const pending = adapter.showInterstitial();
    expect(pause).not.toHaveBeenCalled();
    harness.startCommercial();
    expect(pause).toHaveBeenCalledTimes(1);
    harness.finishCommercial();
    await pending;
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('returns Poki rewardedBreak success and resumes after an actual rewarded ad', async () => {
    const harness = createHarness();
    const adapter = new PokiAdapter(harness.loader, null);
    const pause = vi.fn();
    const resume = vi.fn();
    await adapter.initialize();
    adapter.setLifecycleHandlers({ pause, resume });
    const pending = adapter.showRewarded();
    expect(harness.sdk.rewardedBreak).toHaveBeenCalledWith(expect.objectContaining({ size: 'medium', onStart: expect.any(Function) }));
    harness.startRewarded();
    expect(pause).toHaveBeenCalledTimes(1);
    harness.finishRewarded(true);
    await expect(pending).resolves.toEqual({ rewarded: true });
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('does not grant a reward when Poki reports no rewarded ad', async () => {
    const harness = createHarness();
    const adapter = new PokiAdapter(harness.loader, null);
    await adapter.initialize();
    const pending = adapter.showRewarded();
    harness.finishRewarded(false);
    await expect(pending).resolves.toEqual({ rewarded: false });
  });

  it('uses incognito-safe localStorage so Poki cloud gamesaves can mirror progress', async () => {
    const harness = createHarness();
    const data = new Map<string, string>();
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => { data.set(key, value); }
    };
    const adapter = new PokiAdapter(harness.loader, storage);
    await adapter.initialize();
    await adapter.save({ version: 9, chapter: 12 });
    await expect(adapter.loadSave()).resolves.toEqual({ version: 9, chapter: 12 });

    const blockedStorage = {
      getItem: () => { throw new Error('SecurityError'); },
      setItem: () => { throw new Error('SecurityError'); }
    };
    const blocked = new PokiAdapter(harness.loader, blockedStorage);
    await blocked.initialize();
    await expect(blocked.loadSave()).resolves.toBeNull();
    await expect(blocked.save({ version: 9 })).resolves.toBeUndefined();
  });
});
