import { describe, expect, it, vi } from 'vitest';
import {
  PlaygamaAdapter,
  type PlaygamaAdvertisementLike,
  type PlaygamaBridgeLike,
  type PlaygamaLoaderLike,
  type PlaygamaPlatformLike
} from './PlaygamaAdapter';

type Listener = (...args: unknown[]) => void;

function emitter() {
  const listeners = new Map<string, Set<Listener>>();
  return {
    on: (event: string, callback: Listener) => {
      const bucket = listeners.get(event) ?? new Set<Listener>();
      bucket.add(callback);
      listeners.set(event, bucket);
    },
    off: (event: string, callback?: Listener) => {
      if (!callback) listeners.delete(event);
      else listeners.get(event)?.delete(callback);
    },
    emit: (event: string, value: unknown) => {
      for (const callback of listeners.get(event) ?? []) callback(value);
    }
  };
}

function createHarness(options: { interstitial?: boolean; rewarded?: boolean } = {}) {
  const platformEvents = emitter();
  const adEvents = emitter();
  const storage = new Map<string, unknown>();

  const platform: PlaygamaPlatformLike = {
    id: 'playgama',
    isPaused: false,
    on: platformEvents.on,
    off: platformEvents.off,
    sendMessage: vi.fn(async () => undefined)
  };
  const advertisement: PlaygamaAdvertisementLike = {
    isInterstitialSupported: options.interstitial ?? true,
    isRewardedSupported: options.rewarded ?? true,
    on: adEvents.on,
    off: adEvents.off,
    showInterstitial: vi.fn(),
    showRewarded: vi.fn()
  };
  const bridge: PlaygamaBridgeLike = {
    initialize: vi.fn(async () => {}),
    platform,
    advertisement,
    storage: {
      get: vi.fn(async (key: string | string[]) => Array.isArray(key) ? key.map((item) => storage.get(item) ?? null) : storage.get(key) ?? null),
      set: vi.fn(async (key: string | string[], value: unknown | unknown[]) => {
        if (Array.isArray(key)) {
          const values = value as unknown[];
          key.forEach((item, index) => storage.set(item, values[index]));
        } else storage.set(key, value);
      })
    }
  };
  const loader: PlaygamaLoaderLike = { load: vi.fn(async () => bridge) };
  return { bridge, loader, platformEvents, adEvents, storage };
}

describe('PlaygamaAdapter', () => {
  it('initializes Bridge and sends the required game lifecycle messages', async () => {
    const harness = createHarness();
    const adapter = new PlaygamaAdapter(harness.loader);
    await adapter.initialize();
    expect(harness.loader.load).toHaveBeenCalledTimes(1);
    expect(harness.bridge.initialize).toHaveBeenCalledTimes(1);

    adapter.loadingReady();
    adapter.gameplayStart();
    adapter.gameplayStart();
    adapter.gameplayStop();
    adapter.gameplayStop();
    await Promise.resolve();

    expect(harness.bridge.platform.sendMessage).toHaveBeenCalledWith('game_ready');
    expect(harness.bridge.platform.sendMessage).toHaveBeenCalledWith('gameplay_started');
    expect(harness.bridge.platform.sendMessage).toHaveBeenCalledWith('gameplay_stopped');
    expect(harness.bridge.platform.sendMessage).toHaveBeenCalledTimes(3);
  });

  it('maps Playgama platform pause state into the shared lifecycle boundary', async () => {
    const harness = createHarness();
    const adapter = new PlaygamaAdapter(harness.loader);
    const pause = vi.fn();
    const resume = vi.fn();
    await adapter.initialize();
    adapter.setLifecycleHandlers({ pause, resume });

    harness.platformEvents.emit('pause_state_changed', true);
    harness.platformEvents.emit('pause_state_changed', true);
    expect(pause).toHaveBeenCalledTimes(1);
    harness.platformEvents.emit('pause_state_changed', false);
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('pauses an interstitial on opened and resumes on closed', async () => {
    const harness = createHarness();
    const adapter = new PlaygamaAdapter(harness.loader);
    const pause = vi.fn();
    const resume = vi.fn();
    await adapter.initialize();
    adapter.setLifecycleHandlers({ pause, resume });

    const pending = adapter.showInterstitial();
    expect(harness.bridge.advertisement.showInterstitial).toHaveBeenCalledWith('chapter_break');
    harness.adEvents.emit('interstitial_state_changed', 'loading');
    expect(pause).not.toHaveBeenCalled();
    harness.adEvents.emit('interstitial_state_changed', 'opened');
    expect(pause).toHaveBeenCalledTimes(1);
    harness.adEvents.emit('interstitial_state_changed', 'closed');
    await pending;
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('grants rewarded value only after the rewarded state and a completed close', async () => {
    const harness = createHarness();
    const adapter = new PlaygamaAdapter(harness.loader);
    const pause = vi.fn();
    const resume = vi.fn();
    await adapter.initialize();
    adapter.setLifecycleHandlers({ pause, resume });

    const pending = adapter.showRewarded();
    expect(harness.bridge.advertisement.showRewarded).toHaveBeenCalledWith('rewarded_gameplay');
    harness.adEvents.emit('rewarded_state_changed', 'opened');
    harness.adEvents.emit('rewarded_state_changed', 'rewarded');
    harness.adEvents.emit('rewarded_state_changed', 'closed');
    await expect(pending).resolves.toEqual({ rewarded: true });
    expect(pause).toHaveBeenCalledTimes(1);
    expect(resume).toHaveBeenCalledTimes(1);

    const failed = adapter.showRewarded();
    harness.adEvents.emit('rewarded_state_changed', 'failed');
    await expect(failed).resolves.toEqual({ rewarded: false });
  });

  it('returns immediately when the requested ad format is unsupported', async () => {
    const harness = createHarness({ interstitial: false, rewarded: false });
    const adapter = new PlaygamaAdapter(harness.loader);
    await adapter.initialize();
    await expect(adapter.showInterstitial()).resolves.toBeUndefined();
    await expect(adapter.showRewarded()).resolves.toEqual({ rewarded: false });
    expect(harness.bridge.advertisement.showInterstitial).not.toHaveBeenCalled();
    expect(harness.bridge.advertisement.showRewarded).not.toHaveBeenCalled();
  });

  it('uses Bridge storage objects directly and fails soft on storage errors', async () => {
    const harness = createHarness();
    const adapter = new PlaygamaAdapter(harness.loader);
    await adapter.initialize();
    const save = { version: 9, chapter: 15, updatedAt: 123 };
    await adapter.save(save);
    expect(harness.storage.get('brainrot-merge-boss:save')).toEqual(save);
    await expect(adapter.loadSave()).resolves.toEqual(save);

    harness.bridge.storage.get = vi.fn(async () => { throw new Error('offline'); });
    harness.bridge.storage.set = vi.fn(async () => { throw new Error('offline'); });
    await expect(adapter.loadSave()).resolves.toBeNull();
    await expect(adapter.save(save)).resolves.toBeUndefined();
  });
});
