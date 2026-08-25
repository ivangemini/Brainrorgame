import { describe, expect, it } from 'vitest';
import {
  advanceOnboarding,
  blocksCombatForOnboarding,
  createCompletedOnboardingState,
  createDefaultOnboardingState,
  isOnboardingComplete,
  isValidOnboardingState
} from './onboarding';

describe('onboarding', () => {
  it('advances only on the expected player action', () => {
    let state = createDefaultOnboardingState();
    state = advanceOnboarding(state, 'recruited', 10);
    expect(state.step).toBe('merge');

    state = advanceOnboarding(state, 'merged', 20);
    expect(state.step).toBe('recruit');
    state = advanceOnboarding(state, 'recruited', 30);
    expect(state.step).toBe('fight');
    state = advanceOnboarding(state, 'defeated_target', 40);
    expect(state).toEqual({ step: 'complete', completedAt: 40 });
  });

  it('blocks combat only until the first successful merge', () => {
    const initial = createDefaultOnboardingState();
    expect(blocksCombatForOnboarding(initial)).toBe(true);
    expect(blocksCombatForOnboarding(advanceOnboarding(initial, 'merged'))).toBe(false);
  });

  it('keeps completed onboarding immutable', () => {
    const completed = createCompletedOnboardingState(123);
    expect(advanceOnboarding(completed, 'merged', 456)).toBe(completed);
    expect(isOnboardingComplete(completed)).toBe(true);
  });

  it('validates persisted onboarding state strictly', () => {
    expect(isValidOnboardingState({ step: 'merge', completedAt: null })).toBe(true);
    expect(isValidOnboardingState({ step: 'complete', completedAt: 123 })).toBe(true);
    expect(isValidOnboardingState({ step: 'complete', completedAt: null })).toBe(false);
    expect(isValidOnboardingState({ step: 'fight', completedAt: 123 })).toBe(false);
  });
});
