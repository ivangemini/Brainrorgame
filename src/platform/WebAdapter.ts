import type { GameAnalyticsEvent } from '../analytics/events';
import type { PlatformAdapter, PlatformLifecycleHandlers, RewardResult } from './PlatformAdapter';

const SAVE_KEY = 'brainrot-merge-boss:save';
const ANALYTICS_EVENT_NAME = 'brainror:analytics';

export class WebAdapter implements PlatformAdapter {
  public readonly id = 'web' as const;
  private lifecycleHandlers: PlatformLifecycleHandlers | null = null;

  public async initialize(): Promise<void> {}
  public loadingReady(): void {}
  public setLifecycleHandlers(handlers: PlatformLifecycleHandlers): void {
    this.lifecycleHandlers = handlers;
  }
  public gameplayStart(): void {}
  public gameplayStop(): void {}
  public async showInterstitial(): Promise<void> {}
  public async showRewarded(): Promise<RewardResult> {
    return { rewarded: true };
  }

  public trackEvent(event: GameAnalyticsEvent): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent<GameAnalyticsEvent>(ANALYTICS_EVENT_NAME, { detail: event }));
  }

  public async loadSave<T>(): Promise<T | null> {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  public async save<T>(value: T): Promise<void> {
    localStorage.setItem(SAVE_KEY, JSON.stringify(value));
  }

  public pauseForTest(): void {
    this.lifecycleHandlers?.pause();
  }

  public resumeForTest(): void {
    this.lifecycleHandlers?.resume();
  }
}
