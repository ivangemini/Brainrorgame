export interface RewardResult {
  readonly rewarded: boolean;
}

export interface PlatformAdapter {
  readonly id: 'web' | 'yandex' | 'crazygames' | 'poki' | 'playgama' | 'gamedistribution';
  initialize(): Promise<void>;
  gameplayStart(): void;
  gameplayStop(): void;
  showInterstitial(): Promise<void>;
  showRewarded(): Promise<RewardResult>;
  loadSave<T>(): Promise<T | null>;
  save<T>(value: T): Promise<void>;
}
