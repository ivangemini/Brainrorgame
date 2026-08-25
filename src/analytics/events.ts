import type { CreatureFamily } from '../content/creatures';
import type { MutationId } from '../content/mutations';
import type { InterstitialPlacement, RewardedPlacement } from '../systems/adPolicy';
import type { AchievementId } from '../systems/collectionProgression';
import type { DailyMissionId } from '../systems/dailyRetention';
import type { MetaUpgradeId } from '../systems/metaProgression';
import type { OnboardingStep } from '../systems/onboarding';

export type EncounterKind = 'wave' | 'boss';

export type GameAnalyticsEvent =
  | {
      readonly name: 'session_start';
      readonly elapsedMs: number;
      readonly returning: boolean;
      readonly chapter: number;
    }
  | {
      readonly name: 'onboarding_step';
      readonly elapsedMs: number;
      readonly step: Exclude<OnboardingStep, 'complete'>;
    }
  | {
      readonly name: 'onboarding_complete';
      readonly elapsedMs: number;
    }
  | {
      readonly name: 'first_merge';
      readonly elapsedMs: number;
      readonly family: CreatureFamily;
      readonly resultingLevel: number;
      readonly mutation: MutationId;
    }
  | {
      readonly name: 'merge';
      readonly elapsedMs: number;
      readonly family: CreatureFamily;
      readonly resultingLevel: number;
      readonly mutation: MutationId;
      readonly chapter: number;
    }
  | {
      readonly name: 'recruit';
      readonly elapsedMs: number;
      readonly family: CreatureFamily;
      readonly mutation: MutationId;
      readonly coinsAfter: number;
    }
  | {
      readonly name: 'encounter_start';
      readonly elapsedMs: number;
      readonly kind: EncounterKind;
      readonly chapter: number;
      readonly step: number;
    }
  | {
      readonly name: 'encounter_complete';
      readonly elapsedMs: number;
      readonly kind: EncounterKind;
      readonly chapter: number;
      readonly step: number;
      readonly encounterDurationMs: number;
      readonly baseHpRemaining: number;
    }
  | {
      readonly name: 'fortress_failed';
      readonly elapsedMs: number;
      readonly kind: EncounterKind;
      readonly chapter: number;
      readonly step: number;
    }
  | {
      readonly name: 'meta_upgrade_purchase';
      readonly elapsedMs: number;
      readonly upgrade: MetaUpgradeId;
      readonly level: number;
      readonly shardsAfter: number;
    }
  | {
      readonly name: 'offline_reward';
      readonly elapsedMs: number;
      readonly coins: number;
      readonly rewardedSeconds: number;
      readonly chapter: number;
    }
  | {
      readonly name: 'daily_reward_claim';
      readonly elapsedMs: number;
      readonly streakDay: number;
      readonly coins: number;
      readonly coreShards: number;
    }
  | {
      readonly name: 'daily_mission_claim';
      readonly elapsedMs: number;
      readonly mission: DailyMissionId;
      readonly coins: number;
    }
  | {
      readonly name: 'achievement_claim';
      readonly elapsedMs: number;
      readonly achievement: AchievementId;
      readonly coins: number;
      readonly coreShards: number;
    }
  | {
      readonly name: 'rewarded_ad_result';
      readonly elapsedMs: number;
      readonly placement: RewardedPlacement;
      readonly rewarded: boolean;
    }
  | {
      readonly name: 'interstitial_ad_request';
      readonly elapsedMs: number;
      readonly placement: InterstitialPlacement;
      readonly completedChapter: number;
    }
  | {
      readonly name: 'interstitial_ad_complete';
      readonly elapsedMs: number;
      readonly placement: InterstitialPlacement;
      readonly completedChapter: number;
    };

export interface AnalyticsSink {
  trackEvent(event: GameAnalyticsEvent): void;
}
