import type { CreatureFamily } from '../content/creatures';
import type { AchievementId } from '../systems/collectionProgression';
import type { DailyMissionId } from '../systems/dailyRetention';
import type { MetaUpgradeId } from '../systems/metaProgression';

export type EncounterKind = 'wave' | 'boss';

export type GameAnalyticsEvent =
  | {
      readonly name: 'session_start';
      readonly elapsedMs: number;
      readonly returning: boolean;
      readonly chapter: number;
    }
  | {
      readonly name: 'first_merge';
      readonly elapsedMs: number;
      readonly family: CreatureFamily;
      readonly resultingLevel: number;
    }
  | {
      readonly name: 'merge';
      readonly elapsedMs: number;
      readonly family: CreatureFamily;
      readonly resultingLevel: number;
      readonly chapter: number;
    }
  | {
      readonly name: 'recruit';
      readonly elapsedMs: number;
      readonly family: CreatureFamily;
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
    };

export interface AnalyticsSink {
  trackEvent(event: GameAnalyticsEvent): void;
}
