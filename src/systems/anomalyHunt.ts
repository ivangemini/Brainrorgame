import type { MutationId } from '../content/mutations';
import { getCurrentAscensionEffects } from './ascension';

export const ANOMALY_PITY_MAX = 18 as const;
export const ANOMALY_SECRET_PITY_MAX = 70 as const;

export interface AnomalyHuntState {
  readonly charge: number;
  readonly secretPity: number;
  readonly totalPulls: number;
  readonly secretsFound: number;
}

export interface AnomalyRollResult {
  readonly state: AnomalyHuntState;
  readonly mutation: MutationId;
  readonly secret: boolean;
  readonly guaranteed: boolean;
}

export function createDefaultAnomalyHuntState(): AnomalyHuntState {
  return { charge: 0, secretPity: 0, totalPulls: 0, secretsFound: 0 };
}

export function anomalyChargePercent(state: AnomalyHuntState): number {
  return Math.min(100, Math.round((state.charge / ANOMALY_PITY_MAX) * 100));
}

export function rollAnomalyHunt(state: AnomalyHuntState, roll: number): AnomalyRollResult {
  const normalized = Number.isFinite(roll) ? Math.min(0.999999999, Math.max(0, roll)) : 0;
  const nextCharge = state.charge + 1;
  const nextSecretPity = state.secretPity + 1;
  const guaranteedRare = nextCharge >= ANOMALY_PITY_MAX;
  const guaranteedSecret = nextSecretPity >= ANOMALY_SECRET_PITY_MAX;

  // Secret starts extremely rare but ramps during the final 20 pulls so the hunt feels tangible.
  const secretChance = nextSecretPity >= 50 ? 0.006 + (nextSecretPity - 50) * 0.0022 : 0.0015;
  const secret = guaranteedSecret || normalized < secretChance;
  if (secret) {
    return {
      mutation: 'crowned', secret: true, guaranteed: guaranteedSecret,
      state: { charge: 0, secretPity: 0, totalPulls: state.totalPulls + 1, secretsFound: state.secretsFound + 1 }
    };
  }

  if (guaranteedRare) {
    return {
      mutation: normalized > 0.985 ? 'crowned' : normalized > 0.86 ? 'prismatic' : 'charged',
      secret: false,
      guaranteed: true,
      state: { ...state, charge: 0, secretPity: nextSecretPity, totalPulls: state.totalPulls + 1 }
    };
  }

  const mutationLuck = getCurrentAscensionEffects().mutationLuckShift;
  const chargedChance = 0.055 + nextCharge * 0.006 + mutationLuck;
  const epicChance = 0.010 + nextCharge * 0.0015;
  const legendaryChance = 0.0015 + nextCharge * 0.00035;
  let mutation: MutationId = 'none';
  if (normalized < legendaryChance) mutation = 'crowned';
  else if (normalized < legendaryChance + epicChance) mutation = 'prismatic';
  else if (normalized < legendaryChance + epicChance + chargedChance) mutation = 'charged';

  return {
    mutation,
    secret: false,
    guaranteed: false,
    state: {
      ...state,
      charge: mutation === 'none' ? nextCharge : 0,
      secretPity: nextSecretPity,
      totalPulls: state.totalPulls + 1
    }
  };
}
