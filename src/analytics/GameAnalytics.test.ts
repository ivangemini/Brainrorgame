import { describe, expect, it } from 'vitest';
import { createDefaultWeeklyChaosProgress, startWeeklyChaosRun } from '../systems/weeklyChaos';
import type { AnalyticsSink, GameAnalyticsEvent } from './events';
import { GameAnalytics } from './GameAnalytics';

class CaptureSink implements AnalyticsSink {
  public readonly events: GameAnalyticsEvent[] = [];
  public trackEvent(event: GameAnalyticsEvent): void {
    this.events.push(event);
  }
}

describe('GameAnalytics', () => {
  it('emits first_merge only once per session and records mutation state', () => {
    let now = 1000;
    const sink = new CaptureSink();
    const analytics = new GameAnalytics(sink, () => now);
    now = 1500;
    analytics.merge('pinguino', 2, 'charged', 1);
    now = 2000;
    analytics.merge('toastodilo', 2, 'prismatic', 1);

    expect(sink.events.filter((event) => event.name === 'first_merge')).toHaveLength(1);
    expect(sink.events.filter((event) => event.name === 'merge')).toHaveLength(2);
    expect(sink.events[0]).toMatchObject({ name: 'first_merge', mutation: 'charged' });
    expect(sink.events[1]).toMatchObject({ name: 'merge', mutation: 'charged' });
    expect(sink.events[2]).toMatchObject({ name: 'merge', mutation: 'prismatic' });
  });

  it('records bounded recruit anomaly context without adding player identifiers', () => {
    const sink = new CaptureSink();
    const analytics = new GameAnalytics(sink, () => 1000);
    analytics.recruit('lampalotl', 'crowned', 80, 17, 69, true, true);
    expect(sink.events).toEqual([
      {
        name: 'recruit',
        elapsedMs: 0,
        family: 'lampalotl',
        mutation: 'crowned',
        coinsAfter: 80,
        anomalyChargeBefore: 17,
        crownSignalBefore: 69,
        guaranteed: true,
        secret: true
      }
    ]);
  });

  it('records onboarding funnel timing', () => {
    let now = 1000;
    const sink = new CaptureSink();
    const analytics = new GameAnalytics(sink, () => now);
    analytics.onboardingStep('merge');
    now = 2400;
    analytics.onboardingStep('recruit');
    now = 4100;
    analytics.onboardingStep('fight');
    now = 7600;
    analytics.onboardingComplete();

    expect(sink.events).toEqual([
      { name: 'onboarding_step', elapsedMs: 0, step: 'merge' },
      { name: 'onboarding_step', elapsedMs: 1400, step: 'recruit' },
      { name: 'onboarding_step', elapsedMs: 3100, step: 'fight' },
      { name: 'onboarding_complete', elapsedMs: 6600 }
    ]);
  });

  it('measures encounter duration independently from session elapsed time', () => {
    let now = 1000;
    const sink = new CaptureSink();
    const analytics = new GameAnalytics(sink, () => now);
    now = 2500;
    analytics.encounterStart('wave', 2, 1);
    now = 6000;
    analytics.encounterComplete('wave', 2, 1, 74);

    const complete = sink.events.find((event) => event.name === 'encounter_complete');
    expect(complete?.name).toBe('encounter_complete');
    if (complete?.name === 'encounter_complete') {
      expect(complete.encounterDurationMs).toBe(3500);
      expect(complete.elapsedMs).toBe(5000);
    }
  });

  it('records bounded weekly run start, milestone, build and outcome signals', () => {
    const at = Date.parse('2026-08-25T12:00:00.000Z');
    const sink = new CaptureSink();
    const analytics = new GameAnalytics(sink, () => at);
    const started = startWeeklyChaosRun(createDefaultWeeklyChaosProgress(at), at).progress;
    analytics.weeklyRunStart(started, 8);
    analytics.weeklyRunMilestone(started.weekId, 3);
    analytics.weeklyRunBuildChoice(started.weekId, 3, 8, 'impact-jelly');
    analytics.weeklyRunEnd(started.weekId, 'failed', 4, 4);
    analytics.weeklyRunClaim(started.weekId, 3, 160, 0);

    expect(sink.events[0]).toMatchObject({
      name: 'weekly_run_start',
      weekId: 202635,
      attempt: 1,
      chapter: 8
    });
    const start = sink.events[0];
    if (start?.name === 'weekly_run_start') {
      expect(new Set([start.rule1, start.rule2, start.rule3]).size).toBe(3);
    }
    expect(sink.events[1]).toEqual({ name: 'weekly_run_milestone', elapsedMs: 0, weekId: 202635, depth: 3 });
    expect(sink.events[2]).toEqual({ name: 'weekly_run_build_choice', elapsedMs: 0, weekId: 202635, depth: 3, chapter: 8, perk: 'impact-jelly' });
    expect(sink.events[3]).toEqual({ name: 'weekly_run_end', elapsedMs: 0, weekId: 202635, outcome: 'failed', depth: 4, bestDepth: 4 });
    expect(sink.events[4]).toEqual({ name: 'weekly_run_claim', elapsedMs: 0, weekId: 202635, target: 3, coins: 160, coreShards: 0 });
  });

  it('records low-frequency Ascension outcomes and authored tree choices', () => {
    const sink = new CaptureSink();
    const analytics = new GameAnalytics(sink, () => 1000);
    analytics.ascensionComplete(31, 3, 6, 2);
    analytics.ascensionNodePurchase('chaos-bank', 2);

    expect(sink.events).toEqual([
      {
        name: 'ascension_complete',
        elapsedMs: 0,
        chapter: 31,
        starsAwarded: 3,
        lifetimeStars: 6,
        ascensions: 2
      },
      {
        name: 'ascension_node_purchase',
        elapsedMs: 0,
        node: 'chaos-bank',
        branch: 'chaos',
        tier: 2,
        starsRemaining: 2
      }
    ]);
  });

  it('records monetization placement and rewarded outcome', () => {
    const sink = new CaptureSink();
    const analytics = new GameAnalytics(sink, () => 1000);
    analytics.rewardedAdResult('offline_double', true);
    analytics.interstitialRequest('chapter_break', 3);
    analytics.interstitialComplete('chapter_break', 3);

    expect(sink.events).toEqual([
      { name: 'rewarded_ad_result', elapsedMs: 0, placement: 'offline_double', rewarded: true },
      { name: 'interstitial_ad_request', elapsedMs: 0, placement: 'chapter_break', completedChapter: 3 },
      { name: 'interstitial_ad_complete', elapsedMs: 0, placement: 'chapter_break', completedChapter: 3 }
    ]);
  });

  it('never propagates sink failures into gameplay', () => {
    const sink: AnalyticsSink = {
      trackEvent: () => {
        throw new Error('telemetry down');
      }
    };
    const analytics = new GameAnalytics(sink, () => 1000);
    expect(() => analytics.sessionStart(false, 1)).not.toThrow();
  });
});
