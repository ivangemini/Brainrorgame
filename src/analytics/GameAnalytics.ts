import type { CreatureFamily } from '../content/creatures';
import type { BossId } from '../content/bosses';
import type { MutationId } from '../content/mutations';
import type { InterstitialPlacement, RewardedPlacement } from '../systems/adPolicy';
import { getAscensionNode, type AscensionNodeId } from '../systems/ascension';
import type { BossTrophyTier } from '../systems/bossHunt';
import type { ChaosPerkId } from '../systems/chaosDraft';
import type { AchievementId } from '../systems/collectionProgression';
import type { DailyMissionId } from '../systems/dailyRetention';
import type { MetaUpgradeId } from '../systems/metaProgression';
import type { OnboardingStep } from '../systems/onboarding';
import { getWeeklyChaosRules, type WeeklyChaosProgress } from '../systems/weeklyChaos';
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

  public merge(family: CreatureFamily, resultingLevel: number, mutation: MutationId, chapter: number): void {
    if (!this.firstMergeSent) {
      this.firstMergeSent = true;
      this.send({ name: 'first_merge', elapsedMs: this.elapsed(), family, resultingLevel, mutation });
    }
    this.send({ name: 'merge', elapsedMs: this.elapsed(), family, resultingLevel, mutation, chapter });
  }

  public recruit(
    family: CreatureFamily,
    mutation: MutationId,
    coinsAfter: number,
    anomalyChargeBefore: number,
    crownSignalBefore: number,
    guaranteed: boolean,
    secret: boolean
  ): void {
    this.send({
      name: 'recruit',
      elapsedMs: this.elapsed(),
      family,
      mutation,
      coinsAfter,
      anomalyChargeBefore,
      crownSignalBefore,
      guaranteed,
      secret
    });
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

  public weeklyRunStart(progress: WeeklyChaosProgress, chapter: number): void {
    const [rule1, rule2, rule3] = getWeeklyChaosRules(progress.weekId);
    if (!rule1 || !rule2 || !rule3) return;
    this.send({
      name: 'weekly_run_start',
      elapsedMs: this.elapsed(),
      weekId: progress.weekId,
      attempt: progress.runsStarted,
      chapter,
      rule1: rule1.id,
      rule2: rule2.id,
      rule3: rule3.id
    });
  }

  public weeklyRunMilestone(weekId: number, depth: number): void {
    this.send({ name: 'weekly_run_milestone', elapsedMs: this.elapsed(), weekId, depth });
  }

  public weeklyRunBuildChoice(weekId: number, depth: number, chapter: number, perk: ChaosPerkId): void {
    this.send({ name: 'weekly_run_build_choice', elapsedMs: this.elapsed(), weekId, depth, chapter, perk });
  }

  public weeklyRunEnd(
    weekId: number,
    outcome: 'completed' | 'failed',
    depth: number,
    bestDepth: number
  ): void {
    this.send({ name: 'weekly_run_end', elapsedMs: this.elapsed(), weekId, outcome, depth, bestDepth });
  }

  public weeklyRunClaim(weekId: number, target: number, coins: number, coreShards: number): void {
    this.send({ name: 'weekly_run_claim', elapsedMs: this.elapsed(), weekId, target, coins, coreShards });
  }

  public ascensionComplete(chapter: number, starsAwarded: number, lifetimeStars: number, ascensions: number): void {
    this.send({
      name: 'ascension_complete',
      elapsedMs: this.elapsed(),
      chapter,
      starsAwarded,
      lifetimeStars,
      ascensions
    });
  }

  public ascensionNodePurchase(node: AscensionNodeId, starsRemaining: number): void {
    const definition = getAscensionNode(node);
    this.send({
      name: 'ascension_node_purchase',
      elapsedMs: this.elapsed(),
      node,
      branch: definition.branch,
      tier: definition.tier,
      starsRemaining
    });
  }

  public bossHuntAttempt(
    huntId: number,
    boss: BossId,
    tier: BossTrophyTier,
    attempt: number,
    damage: number,
    totalDamage: number,
    completionPercent: number
  ): void {
    this.send({
      name: 'boss_hunt_attempt', elapsedMs: this.elapsed(), huntId, boss, tier,
      attempt, damage, totalDamage, completionPercent
    });
  }

  public bossHuntMilestone(
    huntId: number,
    boss: BossId,
    tier: BossTrophyTier,
    percent: 25 | 50 | 75 | 100
  ): void {
    this.send({ name: 'boss_hunt_milestone', elapsedMs: this.elapsed(), huntId, boss, tier, percent });
  }

  public bossHuntClaim(
    huntId: number,
    boss: BossId,
    percent: 25 | 50 | 75 | 100,
    coins: number,
    coreShards: number
  ): void {
    this.send({ name: 'boss_hunt_claim', elapsedMs: this.elapsed(), huntId, boss, percent, coins, coreShards });
  }

  public bossHuntTrophy(huntId: number, boss: BossId, trophy: BossTrophyTier): void {
    this.send({ name: 'boss_hunt_trophy', elapsedMs: this.elapsed(), huntId, boss, trophy });
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
