import { describe, expect, it } from 'vitest';
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

  it('records recruit mutation without adding player identifiers', () => {
    const sink = new CaptureSink();
    const analytics = new GameAnalytics(sink, () => 1000);
    analytics.recruit('lampalotl', 'crowned', 80);
    expect(sink.events).toEqual([
      { name: 'recruit', elapsedMs: 0, family: 'lampalotl', mutation: 'crowned', coinsAfter: 80 }
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
