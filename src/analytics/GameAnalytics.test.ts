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
  it('emits first_merge only once per session', () => {
    let now = 1000;
    const sink = new CaptureSink();
    const analytics = new GameAnalytics(sink, () => now);
    now = 1500;
    analytics.merge('pinguino', 2, 1);
    now = 2000;
    analytics.merge('toastodilo', 2, 1);

    expect(sink.events.filter((event) => event.name === 'first_merge')).toHaveLength(1);
    expect(sink.events.filter((event) => event.name === 'merge')).toHaveLength(2);
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
