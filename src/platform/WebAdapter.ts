import type { GameAnalyticsEvent } from '../analytics/events';
import type { PlatformAdapter, RewardResult } from './PlatformAdapter';

const SAVE_KEY = 'brainrot-merge-boss:save';
const ANALYTICS_EVENT_NAME = 'brainror:analytics';

export class WebAdapter implements PlatformAdapter {
  public readonly id = 'web' as const;

  public async initialize(): Promise<void> {}
  public gameplayStart(): void {}
  public gameplayStop(): void {}
  public async showInterstitial(): Promise<void> {}
  public async showRewarded(): Promise<RewardResult> {
    return { rewarded: true };
  }

  public trackEvent(event: GameAnalyticsEvent): void {
    window.dispatchEvent(new CustomEvent<GameAnalyticsEvent>(ANALYTICS_EVENT_NAME, { detail: event }));
  }

  public async loadSave<T>(): Promise<T | null> {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  public async save<T>(value: T): Promise<void> {
    localStorage.setItem(SAVE_KEY, JSON.stringify(value));
  }
}
