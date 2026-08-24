import type { PlatformAdapter, RewardResult } from './PlatformAdapter';

const SAVE_KEY = 'brainrot-merge-boss:save';

export class WebAdapter implements PlatformAdapter {
  public readonly id = 'web' as const;

  public async initialize(): Promise<void> {}
  public gameplayStart(): void {}
  public gameplayStop(): void {}
  public async showInterstitial(): Promise<void> {}
  public async showRewarded(): Promise<RewardResult> {
    return { rewarded: true };
  }

  public async loadSave<T>(): Promise<T | null> {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  public async save<T>(value: T): Promise<void> {
    localStorage.setItem(SAVE_KEY, JSON.stringify(value));
  }
}
