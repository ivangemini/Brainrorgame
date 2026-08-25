import type { CreatureFamily } from '../content/creatures';
import type { InterstitialPlacement, RewardedPlacement } from '../systems/adPolicy';
import type { AchievementId } from '../systems/collectionProgression';
import type { DailyMissionId } from '../systems/dailyRetention';
import type { MetaUpgradeId } from '../systems/metaProgression';
import type { OnboardingStep } from '../systems/onboarding';
import type { AnalyticsSink, EncounterKind, GameAnalyticsEvent } from './events';

export class GameAnalytics {
  private readonly sessionStartedAt: number;
  private encounterStartedAt: number;
  private firstMergeSent = false;

  public constructor(
    private readonly sink: AnalyticsSink,
    private readonly now: () => number = () => Date.now()
  ) {
    this.sessionStartedAt = this.now();
    this.encounterStartedAt = this.sessionStartedAt;
  }

  public sessionStart(returning: boolean, chapter: number): void {
    this.send({ name: 'session_start', elapsedMs: this.elapsed(), returning, chapter });
  }

  public onboardingStep(step: OnboardingStep): void {
    if (step === 'complete') {
      this.onboardingComplete();
      return;
    }
    this.send({ name: 'onboarding_step', elapsedMs: this.elapsed(), step });
  }

  public onboardingComplete(): void {
    this.send({ name: 'onboarding_complete', elapsedMs: this.elapsed() });
  }

  public merge(family: CreatureFamily, resultingLevel: number, chapter: number): void {
    if (!this.firstMergeSent) {
      this.firstMergeSent = true;
      this.send({ name: 'first_merge', elapsedMs: this.elapsed(), family, resultingLevel });
    }
    this.send({ name: 'merge', elapsedMs: this.elapsed(), family, resultingLevel, chapter });
  }

  public recruit(family: CreatureFamily, coinsAfter: number): void {
    this.send({ name: 'recruit', elapsedMs: this.elapsed(), family, coinsAfter });
  }

  public encounterStart(kind: EncounterKind, chapter: number, step: number): void {
    this.encounterStartedAt = this.now();
    this.send({ name: 'encounter_start', elapsedMs: this.elapsed(), kind, chapter, step });
  }

  public encounterComplete(kind: EncounterKind, chapter: number, step: number, baseHpRemaining: number): void {
    this.send({
      name: 'encounter_complete',
      elapsedMs: this.elapsed(),
      kind,
      chapter,
      step,
      encounterDurationMs: Math.max(0, this.now() - this.encounterStartedAt),
      baseHpRemaining
    });
  }

  public fortressFailed(kind: EncounterKind, chapter: number, step: number): void {
    this.send({ name: 'fortress_failed', elapsedMs: this.elapsed(), kind, chapter, step });
  }

  public metaUpgradePurchase(upgrade: MetaUpgradeId, level: number, shardsAfter: number): void {
    this.send({ name: 'meta_upgrade_purchase', elapsedMs: this.elapsed(), upgrade, level, shardsAfter });
  }

  public offlineReward(coins: number, rewardedSeconds: number, chapter: number): void {
    this.send({ name: 'offline_reward', elapsedMs: this.elapsed(), coins, rewardedSeconds, chapter });
  }

  public dailyRewardClaim(streakDay: number, coins: number, coreShards: number): void {
    this.send({ name: 'daily_reward_claim', elapsedMs: this.elapsed(), streakDay, coins, coreShards });
  }

  public dailyMissionClaim(mission: DailyMissionId, coins: number): void {
    this.send({ name: 'daily_mission_claim', elapsedMs: this.elapsed(), mission, coins });
  }

  public achievementClaim(achievement: AchievementId, coins: number, coreShards: number): void {
    this.send({ name: 'achievement_claim', elapsedMs: this.elapsed(), achievement, coins, coreShards });
  }

  public rewardedAdResult(placement: RewardedPlacement, rewarded: boolean): void {
    this.send({ name: 'rewarded_ad_result', elapsedMs: this.elapsed(), placement, rewarded });
  }

  public interstitialRequest(placement: InterstitialPlacement, completedChapter: number): void {
    this.send({ name: 'interstitial_ad_request', elapsedMs: this.elapsed(), placement, completedChapter });
  }

  public interstitialComplete(placement: InterstitialPlacement, completedChapter: number): void {
    this.send({ name: 'interstitial_ad_complete', elapsedMs: this.elapsed(), placement, completedChapter });
  }

  private elapsed(): number {
    return Math.max(0, this.now() - this.sessionStartedAt);
  }

  private send(event: GameAnalyticsEvent): void {
    try {
      this.sink.trackEvent(event);
    } catch {
      // Telemetry must never break gameplay.
    }
  }
}
