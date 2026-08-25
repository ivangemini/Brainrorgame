import { describe, expect, it } from 'vitest';
import { createActiveAbilityRuntimeState } from '../systems/activeAbilities';
import { isPlaytestMode, PlaytestRecorder } from './PlaytestRecorder';

describe('PlaytestRecorder', () => {
  it('aggregates first-session pacing and health metrics', () => {
    const recorder = new PlaytestRecorder();
    recorder.recordEvent({ name: 'session_start', elapsedMs: 0, returning: false, chapter: 1 });
    recorder.recordEvent({ name: 'onboarding_complete', elapsedMs: 54_000 });
    recorder.recordEvent({ name: 'merge', elapsedMs: 58_000, family: 'pinguino', resultingLevel: 2, mutation: 'none', chapter: 1 });
    recorder.recordEvent({
      name: 'recruit',
      elapsedMs: 63_000,
      family: 'lampalotl',
      mutation: 'none',
      coinsAfter: 100,
      anomalyChargeBefore: 0,
      crownSignalBefore: 0,
      guaranteed: false,
      secret: false
    });
    recorder.recordEvent({ name: 'encounter_start', elapsedMs: 65_000, kind: 'wave', chapter: 1, step: 0 });
    recorder.recordEvent({ name: 'encounter_complete', elapsedMs: 76_000, kind: 'wave', chapter: 1, step: 0, encounterDurationMs: 11_000, baseHpRemaining: 94 });
    recorder.recordEvent({ name: 'encounter_start', elapsedMs: 170_000, kind: 'boss', chapter: 1, step: 5 });
    recorder.recordEvent({ name: 'fortress_failed', elapsedMs: 192_000, kind: 'boss', chapter: 1, step: 5 });
    recorder.recordEvent({ name: 'encounter_start', elapsedMs: 198_000, kind: 'boss', chapter: 1, step: 5 });
    recorder.recordEvent({ name: 'encounter_complete', elapsedMs: 230_000, kind: 'boss', chapter: 1, step: 5, encounterDurationMs: 32_000, baseHpRemaining: 37 });

    const report = recorder.getReport();
    expect(report.returning).toBe(false);
    expect(report.startChapter).toBe(1);
    expect(report.endChapter).toBe(1);
    expect(report.onboardingCompleteMs).toBe(54_000);
    expect(report.firstBossStartMs).toBe(170_000);
    expect(report.firstBossCompleteMs).toBe(230_000);
    expect(report.encountersCompleted).toBe(2);
    expect(report.wavesCompleted).toBe(1);
    expect(report.bossesCompleted).toBe(1);
    expect(report.failures).toBe(1);
    expect(report.recruits).toBe(1);
    expect(report.merges).toBe(1);
    expect(report.averageEncounterDurationMs).toBe(21_500);
    expect(report.medianEncounterDurationMs).toBe(21_500);
    expect(report.minFortressHpAfterWin).toBe(37);
    expect(report.averageFortressHpAfterWin).toBe(66);
  });

  it('detects ability casts from cooldown edges without counting the initial snapshot', () => {
    const recorder = new PlaytestRecorder();
    const idle = createActiveAbilityRuntimeState(100);
    const alreadyCooling = {
      ...idle,
      cooldowns: { ...idle.cooldowns, 'slipstream-burst': 5_000 }
    };
    recorder.sampleCombatState(alreadyCooling, []);
    expect(recorder.getReport().activeAbilityUses['slipstream-burst']).toBe(0);

    const readyAgain = { ...alreadyCooling, cooldowns: { ...alreadyCooling.cooldowns, 'slipstream-burst': 0 } };
    recorder.sampleCombatState(readyAgain, []);
    const castAgain = { ...readyAgain, cooldowns: { ...readyAgain.cooldowns, 'slipstream-burst': 14_000 } };
    recorder.sampleCombatState(castAgain, []);
    expect(recorder.getReport().activeAbilityUses['slipstream-burst']).toBe(1);
  });

  it('detects new Chaos perks but does not count perks restored before the first sample', () => {
    const recorder = new PlaytestRecorder();
    const runtime = createActiveAbilityRuntimeState();
    recorder.sampleCombatState(runtime, ['impact-jelly']);
    expect(recorder.getReport().chaosPerkSelections['impact-jelly']).toBe(0);

    recorder.sampleCombatState(runtime, ['impact-jelly', 'repair-moss']);
    expect(recorder.getReport().chaosPerkSelections['repair-moss']).toBe(1);
  });

  it('tracks rewarded and interstitial outcomes from the existing analytics stream', () => {
    const recorder = new PlaytestRecorder();
    recorder.recordEvent({ name: 'rewarded_ad_result', elapsedMs: 10, placement: 'fortress_revive', rewarded: false });
    recorder.recordEvent({ name: 'rewarded_ad_result', elapsedMs: 20, placement: 'offline_double', rewarded: true });
    recorder.recordEvent({ name: 'interstitial_ad_request', elapsedMs: 30, placement: 'chapter_break', completedChapter: 2 });
    recorder.recordEvent({ name: 'interstitial_ad_complete', elapsedMs: 40, placement: 'chapter_break', completedChapter: 2 });
    const report = recorder.getReport();
    expect(report.rewardedAttempts).toBe(2);
    expect(report.rewardedSuccesses).toBe(1);
    expect(report.interstitialRequests).toBe(1);
    expect(report.endChapter).toBe(2);
  });

  it('recognizes only explicit playtest query modes', () => {
    expect(isPlaytestMode('?playtest=1')).toBe(true);
    expect(isPlaytestMode('?playtest=true')).toBe(true);
    expect(isPlaytestMode('?qa=playtest')).toBe(true);
    expect(isPlaytestMode('?playtest=0')).toBe(false);
    expect(isPlaytestMode('?qa=other')).toBe(false);
  });
});
