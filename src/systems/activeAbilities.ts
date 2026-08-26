import type { CreatureFamily } from '../content/creatures';
import { currentCombatEnergyReserve } from './ascension';
import { getCurrentChaosPerkMultipliers } from './chaosDraft';
import { getCurrentCrewSynergyState, type CrewSynergyTier } from './crewSynergies';

export const MAX_COMBAT_ENERGY = 100 as const;

export const ACTIVE_ABILITY_IDS = [
  'slipstream-burst',
  'crust-guard',
  'neon-overdrive',
  'quasar-jackpot'
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
  readonly guardRemainingMs: number;
  readonly guardMultiplier: number;
  readonly overdriveRemainingMs: number;
  readonly overdriveMultiplier: number;
  readonly jackpotRemainingMs: number;
  readonly jackpotMultiplier: number;
}

export type ActiveAbilityEffect =
  | { readonly kind: 'haste'; readonly durationMs: number; readonly multiplier: number }
  | { readonly kind: 'guard'; readonly durationMs: number; readonly multiplier: number }
  | { readonly kind: 'overdrive'; readonly durationMs: number; readonly multiplier: number }
  | { readonly kind: 'jackpot'; readonly durationMs: number; readonly multiplier: number };

export type AbilityBlockReason = 'locked' | 'energy' | 'cooldown' | 'no-target';

export interface ActiveAbilityCastResult {
  readonly cast: boolean;
  readonly state: ActiveAbilityRuntimeState;
  readonly effect: ActiveAbilityEffect | null;
  readonly reason: AbilityBlockReason | null;
}

const DEFINITIONS: Readonly<Record<ActiveAbilityId, ActiveAbilityDefinition>> = {
  'slipstream-burst': {
    id: 'slipstream-burst', family: 'pinguino', name: 'Slipstream Burst', shortLabel: 'SLIP',
    description: 'Temporarily accelerates the entire crew.', energyCost: 42, cooldownMs: 14_000, accentColor: 0x64d8ff
  },
  'crust-guard': {
    id: 'crust-guard', family: 'toastodilo', name: 'Crust Guard', shortLabel: 'GUARD',
    description: 'Temporarily reduces fortress damage taken.', energyCost: 38, cooldownMs: 16_000, accentColor: 0xffbd4d
  },
  'neon-overdrive': {
    id: 'neon-overdrive', family: 'lampalotl', name: 'Neon Overdrive', shortLabel: 'NOVA',
    description: 'Temporarily amplifies all crew projectile damage.', energyCost: 50, cooldownMs: 16_000, accentColor: 0xff86d7
  },
  'quasar-jackpot': {
    id: 'quasar-jackpot', family: 'dishnail', name: 'Quasar Jackpot', shortLabel: 'JACK',
    description: 'Temporarily amplifies encounter coin rewards.', energyCost: 46, cooldownMs: 18_000, accentColor: 0xc57dff
  }
};

const HASTE_DURATION_MS = [0, 4_000, 4_600, 5_200] as const;
const HASTE_MULTIPLIER = [1, 0.78, 0.72, 0.66] as const;
const GUARD_DURATION_MS = [0, 4_800, 5_400, 6_000] as const;
const GUARD_MULTIPLIER = [1, 0.78, 0.68, 0.58] as const;
const OVERDRIVE_DURATION_MS = [0, 4_000, 4_600, 5_200] as const;
const OVERDRIVE_MULTIPLIER = [1, 1.25, 1.38, 1.55] as const;
const JACKPOT_DURATION_MS = [0, 5_000, 5_800, 6_600] as const;
const JACKPOT_MULTIPLIER = [1, 1.30, 1.50, 1.80] as const;

let currentState = createActiveAbilityRuntimeState();
let combatActive = false;
let currentEncounterKey = '';
let currentEnergyGainMultiplier = 1;

export function createActiveAbilityRuntimeState(energy = 0): ActiveAbilityRuntimeState {
  return {
    energy: clampEnergy(energy), cooldowns: emptyCooldowns(),
    hasteRemainingMs: 0, hasteMultiplier: 1,
    guardRemainingMs: 0, guardMultiplier: 1,
    overdriveRemainingMs: 0, overdriveMultiplier: 1,
    jackpotRemainingMs: 0, jackpotMultiplier: 1
  };
}

export function tickActiveAbilityRuntime(state: ActiveAbilityRuntimeState, deltaMs: number): ActiveAbilityRuntimeState {
  const delta = Math.max(0, Number.isFinite(deltaMs) ? deltaMs : 0);
  const cooldowns = Object.fromEntries(
    ACTIVE_ABILITY_IDS.map((id) => [id, Math.max(0, state.cooldowns[id] - delta)])
  ) as Record<ActiveAbilityId, number>;
  const hasteRemainingMs = Math.max(0, state.hasteRemainingMs - delta);
  const guardRemainingMs = Math.max(0, state.guardRemainingMs - delta);
  const overdriveRemainingMs = Math.max(0, state.overdriveRemainingMs - delta);
  const jackpotRemainingMs = Math.max(0, state.jackpotRemainingMs - delta);
  return {
    ...state, cooldowns,
    hasteRemainingMs, hasteMultiplier: hasteRemainingMs > 0 ? state.hasteMultiplier : 1,
    guardRemainingMs, guardMultiplier: guardRemainingMs > 0 ? state.guardMultiplier : 1,
    overdriveRemainingMs, overdriveMultiplier: overdriveRemainingMs > 0 ? state.overdriveMultiplier : 1,
    jackpotRemainingMs, jackpotMultiplier: jackpotRemainingMs > 0 ? state.jackpotMultiplier : 1
  };
}

export function gainCombatEnergy(state: ActiveAbilityRuntimeState, amount: number): ActiveAbilityRuntimeState {
  if (!Number.isFinite(amount) || amount <= 0) return state;
  return { ...state, energy: clampEnergy(state.energy + amount) };
}

export function getActiveAbilityDefinition(id: ActiveAbilityId): ActiveAbilityDefinition { return DEFINITIONS[id]; }
export function getAllActiveAbilityDefinitions(): readonly ActiveAbilityDefinition[] { return ACTIVE_ABILITY_IDS.map((id) => DEFINITIONS[id]); }

export function canCastActiveAbility(id: ActiveAbilityId, state: ActiveAbilityRuntimeState, tier: CrewSynergyTier, targetAlive: boolean): AbilityBlockReason | null {
  const definition = getActiveAbilityDefinition(id);
  if (tier === 0) return 'locked';
  if (!targetAlive) return 'no-target';
  if (state.cooldowns[id] > 0) return 'cooldown';
  if (state.energy < definition.energyCost) return 'energy';
  return null;
}

export function castActiveAbility(id: ActiveAbilityId, state: ActiveAbilityRuntimeState, tier: CrewSynergyTier, targetAlive: boolean): ActiveAbilityCastResult {
  const reason = canCastActiveAbility(id, state, tier, targetAlive);
  if (reason) return { cast: false, state, effect: null, reason };
  const definition = getActiveAbilityDefinition(id);
  let next: ActiveAbilityRuntimeState = {
    ...state,
    energy: clampEnergy(state.energy - definition.energyCost),
    cooldowns: { ...state.cooldowns, [id]: definition.cooldownMs }
  };
  let effect: ActiveAbilityEffect;
  if (id === 'slipstream-burst') {
    const durationMs = HASTE_DURATION_MS[tier]; const multiplier = HASTE_MULTIPLIER[tier];
    next = { ...next, hasteRemainingMs: Math.max(next.hasteRemainingMs, durationMs), hasteMultiplier: Math.min(next.hasteMultiplier, multiplier) };
    effect = { kind: 'haste', durationMs, multiplier };
  } else if (id === 'crust-guard') {
    const durationMs = GUARD_DURATION_MS[tier]; const multiplier = GUARD_MULTIPLIER[tier];
    next = { ...next, guardRemainingMs: Math.max(next.guardRemainingMs, durationMs), guardMultiplier: Math.min(next.guardMultiplier, multiplier) };
    effect = { kind: 'guard', durationMs, multiplier };
  } else if (id === 'neon-overdrive') {
    const durationMs = OVERDRIVE_DURATION_MS[tier]; const multiplier = OVERDRIVE_MULTIPLIER[tier];
    next = { ...next, overdriveRemainingMs: Math.max(next.overdriveRemainingMs, durationMs), overdriveMultiplier: Math.max(next.overdriveMultiplier, multiplier) };
    effect = { kind: 'overdrive', durationMs, multiplier };
  } else {
    const durationMs = JACKPOT_DURATION_MS[tier]; const multiplier = JACKPOT_MULTIPLIER[tier];
    next = { ...next, jackpotRemainingMs: Math.max(next.jackpotRemainingMs, durationMs), jackpotMultiplier: Math.max(next.jackpotMultiplier, multiplier) };
    effect = { kind: 'jackpot', durationMs, multiplier };
  }
  return { cast: true, state: next, effect, reason: null };
}

export function beginActiveAbilityEncounter(key: string, energyGainMultiplier = 1): void {
  currentEnergyGainMultiplier = normalizeEnergyGainMultiplier(energyGainMultiplier);
  if (key === currentEncounterKey) return;
  currentEncounterKey = key;
  currentState = createActiveAbilityRuntimeState(currentCombatEnergyReserve());
  combatActive = true;
}

export function setActiveAbilityCombatActive(active: boolean): void { combatActive = active; }
export function isActiveAbilityCombatActive(): boolean { return combatActive; }
export function getCurrentActiveAbilityRuntime(): ActiveAbilityRuntimeState { return currentState; }
export function tickCurrentActiveAbilityRuntime(deltaMs: number): ActiveAbilityRuntimeState {
  currentState = tickActiveAbilityRuntime(currentState, deltaMs);
  return currentState;
}

export function recordCrewAttackEnergy(): void {
  if (!combatActive) return;
  const perkMultiplier = getCurrentChaosPerkMultipliers().energyGainMultiplier;
  const crewMultiplier = getCurrentCrewSynergyState().energyGainMultiplier;
  currentState = gainCombatEnergy(currentState, perkMultiplier * crewMultiplier * currentEnergyGainMultiplier);
}

export function recordFortressHitEnergy(): void {
  if (!combatActive) return;
  const perkMultiplier = getCurrentChaosPerkMultipliers().energyGainMultiplier;
  const crewMultiplier = getCurrentCrewSynergyState().energyGainMultiplier;
  currentState = gainCombatEnergy(currentState, 4 * perkMultiplier * crewMultiplier * currentEnergyGainMultiplier);
}

export function tryCastCurrentActiveAbility(id: ActiveAbilityId, tier: CrewSynergyTier): ActiveAbilityCastResult {
  const result = castActiveAbility(id, currentState, tier, combatActive);
  if (result.cast) currentState = result.state;
  return result;
}

export function currentActiveHasteMultiplier(): number { return currentState.hasteRemainingMs > 0 ? currentState.hasteMultiplier : 1; }
export function currentActiveGuardMultiplier(): number { return currentState.guardRemainingMs > 0 ? currentState.guardMultiplier : 1; }
export function currentActiveDamageMultiplier(): number { return currentState.overdriveRemainingMs > 0 ? currentState.overdriveMultiplier : 1; }
export function currentActiveRewardMultiplier(): number { return currentState.jackpotRemainingMs > 0 ? currentState.jackpotMultiplier : 1; }

export function resetActiveAbilityRuntime(): void {
  currentState = createActiveAbilityRuntimeState();
  combatActive = false;
  currentEncounterKey = '';
  currentEnergyGainMultiplier = 1;
}

function emptyCooldowns(): Record<ActiveAbilityId, number> {
  return { 'slipstream-burst': 0, 'crust-guard': 0, 'neon-overdrive': 0, 'quasar-jackpot': 0 };
}
function clampEnergy(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MAX_COMBAT_ENERGY, value));
}
function normalizeEnergyGainMultiplier(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return value;
}
