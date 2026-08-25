export type OnboardingStep = 'merge' | 'recruit' | 'fight' | 'complete';

export interface OnboardingState {
  readonly step: OnboardingStep;
  readonly completedAt: number | null;
}

export type OnboardingAction = 'merged' | 'recruited' | 'defeated_target';

export function createDefaultOnboardingState(): OnboardingState {
  return { step: 'merge', completedAt: null };
}

export function createCompletedOnboardingState(completedAt = Date.now()): OnboardingState {
  return { step: 'complete', completedAt: Math.max(0, completedAt) };
}

export function advanceOnboarding(
  state: OnboardingState,
  action: OnboardingAction,
  now = Date.now()
): OnboardingState {
  if (state.step === 'complete') return state;
  if (state.step === 'merge' && action === 'merged') return { step: 'recruit', completedAt: null };
  if (state.step === 'recruit' && action === 'recruited') return { step: 'fight', completedAt: null };
  if (state.step === 'fight' && action === 'defeated_target') {
    return { step: 'complete', completedAt: Math.max(0, now) };
  }
  return state;
}

export function isOnboardingComplete(state: OnboardingState): boolean {
  return state.step === 'complete';
}

export function blocksCombatForOnboarding(state: OnboardingState): boolean {
  return state.step === 'merge' || state.step === 'recruit';
}

export function isValidOnboardingState(value: unknown): value is OnboardingState {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { step?: unknown; completedAt?: unknown };
  const validStep = candidate.step === 'merge'
    || candidate.step === 'recruit'
    || candidate.step === 'fight'
    || candidate.step === 'complete';
  if (!validStep) return false;
  if (candidate.completedAt !== null && (typeof candidate.completedAt !== 'number' || !Number.isFinite(candidate.completedAt))) {
    return false;
  }
  if (candidate.step === 'complete') return typeof candidate.completedAt === 'number' && candidate.completedAt >= 0;
  return candidate.completedAt === null;
}
