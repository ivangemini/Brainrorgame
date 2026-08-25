import type { CreatureFamily } from '../content/creatures';
import type { CrewSynergyTier } from './crewSynergies';

export const MAX_COMBAT_ENERGY = 100 as const;

export const ACTIVE_ABILITY_IDS = [
  'slipstream-burst',
  'crust-mend',
  'neon-nova',
  'quasar-lock'
] as const;
export type ActiveAbilityId = (typeof ACTIVE_ABILITY_IDS)[number];

export interface ActiveAbilityDefinition {
  readonly id: ActiveAbilityId;
  readonly family: CreatureFamily;
  readonly name: string;
  readonly shortLabel: string;
  readonly description: string;
  readonly energyCost: number;
  readonly cooldownMs: number;
  readonly accentColor: number;
}

export interface ActiveAbilityRuntimeState {
  readonly energy: number;
  readonly cooldowns: Readonly<Record<ActiveAbilityId, number>>;
  readonly hasteRemainingMs: number;
  readonly hasteMultiplier: number;
  readonly stunRemainingMs: number;
}

export type ActiveAbilityEffect =
  | { readonly kind: 'haste'; readonly durationMs: number; readonly attackIntervalMultiplier: number }
  | { readonly kind: 'heal'; readonly amount: number }
  | { readonly kind: 'burst'; readonly damage: number }
  | { readonly kind: 'stun'; readonly durationMs: number };

export type AbilityBlockReason = 'locked' | 'energy' | 'cooldown' | 'full-fortress' | 'no-target';

export interface ActiveAbilityCastResult {
  readonly cast: boolean;
  readonly state: ActiveAbilityRuntimeState;
  readonly effect: ActiveAbilityEffect | null;
  readonly reason: AbilityBlockReason | null;
}

const DEFINITIONS: Readonly<Record<ActiveAbilityId, ActiveAbilityDefinition>> = {
  'slipstream-burst': {
    id: 'slipstream-burst',
    family: 'pinguino',
    name: 'Slipstream Burst',
    shortLabel: 'SLIP',
    description: 'Temporarily accelerates the entire crew.',
    energyCost: 42,
    cooldownMs: 14_000,
    accentColor: 0x64d8ff
  },
  'crust-mend': {
    id: 'crust-mend',
    family: 'toastodilo',
    name: 'Crust Mend',
    shortLabel: 'MEND',
    description: 'Instantly repairs the fortress.',
    energyCost: 38,
    cooldownMs: 17_000,
    accentColor: 0xffbd4d
  },
  'neon-nova': {
    id: 'neon-nova',
    family: 'lampalotl',
    name: 'Neon Nova',
    shortLabel: 'NOVA',
    description: 'Deals an instant percentage burst to the current target.',
    energyCost: 50,
    cooldownMs: 16_000,
    accentColor: 0xff86d7
  },
  'quasar-lock': {
    id: 'quasar-lock',
    family: 'dishnail',
    name: 'Quasar Lock',
    shortLabel: 'LOCK',
    description: 'Freezes the enemy attack clock for a short duration.',
    energyCost: 46,
    cooldownMs: 18_000,
    accentColor: 0xc57dff
  }
};

const HASTE_DURATION_MS = [0, 4_000, 4_600, 5_200] as const;
const HASTE_MULTIPLIER = [1, 0.78, 0.72, 0.66] as const;
const FORTRESS_HEAL = [0, 18, 26, 36] as const;
const NOVA_MAX_HP_RATIO = [0, 0.10, 0.135, 0.17] as const;
const NOVA_MIN_DAMAGE = [0, 24, 36, 52] as const;
const STUN_DURATION_MS = [0, 2_200, 3_000, 3_900] as const;

export function createActiveAbilityRuntimeState(energy = 0): ActiveAbilityRuntimeState {
  return {
    energy: clampEnergy(energy),
    cooldowns: emptyCooldowns(),
    hasteRemainingMs: 0,
    hasteMultiplier: 1,
    stunRemainingMs: 0
  };
}

export function tickActiveAbilityRuntime(
  state: ActiveAbilityRuntimeState,
  deltaMs: number
): ActiveAbilityRuntimeState {
  const delta = Math.max(0, Number.isFinite(deltaMs) ? deltaMs : 0);
  const cooldowns = Object.fromEntries(
    ACTIVE_ABILITY_IDS.map((id) => [id, Math.max(0, state.cooldowns[id] - delta)])
  ) as Record<ActiveAbilityId, number>;
  const hasteRemainingMs = Math.max(0, state.hasteRemainingMs - delta);
  return {
    ...state,
    cooldowns,
    hasteRemainingMs,
    hasteMultiplier: hasteRemainingMs > 0 ? state.hasteMultiplier : 1,
    stunRemainingMs: Math.max(0, state.stunRemainingMs - delta)
  };
}

export function gainCombatEnergy(
  state: ActiveAbilityRuntimeState,
  amount: number
): ActiveAbilityRuntimeState {
  if (!Number.isFinite(amount) || amount <= 0) return state;
  return { ...state, energy: clampEnergy(state.energy + amount) };
}

export function energyGainForUnitAttack(level: 1 | 2 | 3): number {
  return level;
}

export function energyGainForFortressHit(damage: number): number {
  if (!Number.isFinite(damage) || damage <= 0) return 0;
  return Math.min(8, Math.max(3, Math.ceil(damage / 4)));
}

export function getActiveAbilityDefinition(id: ActiveAbilityId): ActiveAbilityDefinition {
  return DEFINITIONS[id];
}

export function getAllActiveAbilityDefinitions(): readonly ActiveAbilityDefinition[] {
  return ACTIVE_ABILITY_IDS.map((id) => DEFINITIONS[id]);
}

export function currentActiveHasteMultiplier(state: ActiveAbilityRuntimeState): number {
  return state.hasteRemainingMs > 0 ? state.hasteMultiplier : 1;
}

export function isTargetStunned(state: ActiveAbilityRuntimeState): boolean {
  return state.stunRemainingMs > 0;
}

export function canCastActiveAbility(
  id: ActiveAbilityId,
  state: ActiveAbilityRuntimeState,
  tier: CrewSynergyTier,
  baseHp: number,
  targetAlive: boolean
): AbilityBlockReason | null {
  const definition = getActiveAbilityDefinition(id);
  if (tier === 0) return 'locked';
  if (!targetAlive) return 'no-target';
  if (state.cooldowns[id] > 0) return 'cooldown';
  if (state.energy < definition.energyCost) return 'energy';
  if (id === 'crust-mend' && baseHp >= 100) return 'full-fortress';
  return null;
}

export function castActiveAbility(
  id: ActiveAbilityId,
  state: ActiveAbilityRuntimeState,
  tier: CrewSynergyTier,
  targetHpMax: number,
  baseHp: number,
  targetAlive: boolean
): ActiveAbilityCastResult {
  const reason = canCastActiveAbility(id, state, tier, baseHp, targetAlive);
  if (reason) return { cast: false, state, effect: null, reason };

  const definition = getActiveAbilityDefinition(id);
  let next: ActiveAbilityRuntimeState = {
    ...state,
    energy: clampEnergy(state.energy - definition.energyCost),
    cooldowns: { ...state.cooldowns, [id]: definition.cooldownMs }
  };
  let effect: ActiveAbilityEffect;

  if (id === 'slipstream-burst') {
    const durationMs = HASTE_DURATION_MS[tier];
    const attackIntervalMultiplier = HASTE_MULTIPLIER[tier];
    next = {
      ...next,
      hasteRemainingMs: Math.max(next.hasteRemainingMs, durationMs),
      hasteMultiplier: Math.min(next.hasteMultiplier, attackIntervalMultiplier)
    };
    effect = { kind: 'haste', durationMs, attackIntervalMultiplier };
  } else if (id === 'crust-mend') {
    effect = { kind: 'heal', amount: FORTRESS_HEAL[tier] };
  } else if (id === 'neon-nova') {
    const safeMaxHp = Math.max(1, Number.isFinite(targetHpMax) ? targetHpMax : 1);
    const damage = Math.max(NOVA_MIN_DAMAGE[tier], Math.round(safeMaxHp * NOVA_MAX_HP_RATIO[tier]));
    effect = { kind: 'burst', damage };
  } else {
    const durationMs = STUN_DURATION_MS[tier];
    next = { ...next, stunRemainingMs: Math.max(next.stunRemainingMs, durationMs) };
    effect = { kind: 'stun', durationMs };
  }

  return { cast: true, state: next, effect, reason: null };
}

function emptyCooldowns(): Record<ActiveAbilityId, number> {
  return {
    'slipstream-burst': 0,
    'crust-mend': 0,
    'neon-nova': 0,
    'quasar-lock': 0
  };
}

function clampEnergy(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MAX_COMBAT_ENERGY, Math.round(value)));
}
