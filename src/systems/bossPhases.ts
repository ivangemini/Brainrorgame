import type { BossPhaseProfile } from '../content/bosses';

export type BossPhase = 1 | 2 | 3;
export type BossPhaseWindow = 'open' | 'shield' | 'weak';

export interface BossPhaseState {
  readonly phase: BossPhase;
  readonly window: BossPhaseWindow;
  readonly hpRatio: number;
  readonly incomingDamageMultiplier: number;
  readonly attackIntervalMultiplier: number;
  readonly outgoingDamageMultiplier: number;
  readonly label: string;
  readonly enrage: boolean;
}

let currentState: BossPhaseState | null = null;

export function getBossPhaseState(
  profile: BossPhaseProfile,
  currentHp: number,
  maxHp: number
): BossPhaseState {
  const safeMax = Math.max(1, Number.isFinite(maxHp) ? maxHp : 1);
  const safeHp = Math.max(0, Math.min(safeMax, Number.isFinite(currentHp) ? currentHp : safeMax));
  const hpRatio = safeHp / safeMax;

  if (hpRatio > profile.phaseTwoRatio) {
    return {
      phase: 1,
      window: 'open',
      hpRatio,
      incomingDamageMultiplier: 1,
      attackIntervalMultiplier: 1,
      outgoingDamageMultiplier: 1,
      label: 'PHASE I',
      enrage: false
    };
  }

  if (hpRatio > profile.phaseThreeRatio) {
    const weak = hpRatio <= profile.phaseTwoWeakRatio;
    return {
      phase: 2,
      window: weak ? 'weak' : 'shield',
      hpRatio,
      incomingDamageMultiplier: weak ? profile.weakDamageTakenMultiplier : profile.shieldDamageTakenMultiplier,
      attackIntervalMultiplier: profile.phaseTwoAttackMultiplier,
      outgoingDamageMultiplier: profile.phaseTwoDamageMultiplier,
      label: weak ? profile.weakLabel : profile.shieldLabel,
      enrage: false
    };
  }

  const weak = hpRatio <= profile.phaseThreeWeakRatio;
  return {
    phase: 3,
    window: weak ? 'weak' : 'shield',
    hpRatio,
    incomingDamageMultiplier: weak ? profile.weakDamageTakenMultiplier : profile.shieldDamageTakenMultiplier,
    attackIntervalMultiplier: profile.phaseThreeAttackMultiplier,
    outgoingDamageMultiplier: profile.phaseThreeDamageMultiplier,
    label: weak ? profile.weakLabel : profile.enrageLabel,
    enrage: true
  };
}

export function syncBossPhaseRuntime(
  profile: BossPhaseProfile,
  currentHp: number,
  maxHp: number
): BossPhaseState {
  currentState = getBossPhaseState(profile, currentHp, maxHp);
  return currentState;
}

export function clearBossPhaseRuntime(): void {
  currentState = null;
}

export function getCurrentBossPhaseState(): BossPhaseState | null {
  return currentState;
}

export function currentBossIncomingDamageMultiplier(): number {
  return currentState?.incomingDamageMultiplier ?? 1;
}

export function currentBossAttackIntervalMultiplier(): number {
  return currentState?.attackIntervalMultiplier ?? 1;
}

export function currentBossOutgoingDamageMultiplier(): number {
  return currentState?.outgoingDamageMultiplier ?? 1;
}

export function applyBossIncomingDamage(amount: number, state: BossPhaseState): number {
  const safeAmount = Math.max(0, Number.isFinite(amount) ? amount : 0);
  return Math.max(safeAmount > 0 ? 1 : 0, Math.round(safeAmount * state.incomingDamageMultiplier));
}

export function applyBossAttackInterval(baseAttackMs: number, state: BossPhaseState): number {
  const safeBase = Math.max(180, Number.isFinite(baseAttackMs) ? baseAttackMs : 180);
  return Math.max(1200, Math.round(safeBase * state.attackIntervalMultiplier));
}

export function applyBossOutgoingDamage(baseDamage: number, state: BossPhaseState): number {
  const safeBase = Math.max(0, Number.isFinite(baseDamage) ? baseDamage : 0);
  return Math.max(safeBase > 0 ? 1 : 0, Math.round(safeBase * state.outgoingDamageMultiplier));
}
