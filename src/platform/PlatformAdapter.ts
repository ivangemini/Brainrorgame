import type { AnalyticsSink } from '../analytics/events';

export interface RewardResult {
  readonly rewarded: boolean;
}

export interface PlatformLifecycleHandlers {
  readonly pause: () => void;
  readonly resume: () => void;
}

export interface PlatformAdapter extends AnalyticsSink {
  readonly id: 'web' | 'yandex' | 'crazygames' | 'poki' | 'playgama' | 'gamedistribution';
  initialize(): Promise<void>;
  loadingReady(): void;
  setLifecycleHandlers(handlers: PlatformLifecycleHandlers): void;
  gameplayStart(): void;
  gameplayStop(): void;
  showInterstitial(): Promise<void>;
  showRewarded(): Promise<RewardResult>;
  loadSave<T>(): Promise<T | null>;
  save<T>(value: T): Promise<void>;
}
