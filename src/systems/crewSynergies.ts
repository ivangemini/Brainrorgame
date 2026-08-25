import type { CreatureFamily } from '../content/creatures';
import type { BoardState } from './board';

export type CrewSynergyTier = 0 | 1 | 2 | 3;
export type CrewSynergyId =
  | 'slipstream-relay' | 'crust-bastion' | 'neon-cascade' | 'quasar-lock' | 'mochi-cushion' | 'packet-flock' | 'price-breaker'
  | 'storm-canopy' | 'salvage-sweep' | 'ghost-fan' | 'laundry-barrage' | 'microwave-beam';

export interface CrewSynergyDefinition { readonly id: CrewSynergyId; readonly family: CreatureFamily; readonly name: string; readonly shortLabel: string; readonly accentColor: number; readonly effect: string; }
export interface CrewSynergyState {
  readonly familyPower: Readonly<Record<CreatureFamily, number>>;
  readonly tiers: Readonly<Record<CreatureFamily, CrewSynergyTier>>;
  readonly attackIntervalMultiplier: number;
  readonly incomingDamageMultiplier: number;
  readonly squadDamageMultiplier: number;
  readonly coinRewardMultiplier: number;
  readonly energyGainMultiplier: number;
  readonly bossDamageMultiplier: number;
}
export interface ActiveCrewSynergy { readonly definition: CrewSynergyDefinition; readonly tier: Exclude<CrewSynergyTier, 0>; readonly familyPower: number; }

const DEFINITIONS: Readonly<Record<CreatureFamily, CrewSynergyDefinition>> = {
  pinguino: { id: 'slipstream-relay', family: 'pinguino', name: 'Slipstream Relay', shortLabel: 'RLY', accentColor: 0x64d8ff, effect: 'Squad attack cadence' },
  toastodilo: { id: 'crust-bastion', family: 'toastodilo', name: 'Crust Bastion', shortLabel: 'BST', accentColor: 0xffbd4d, effect: 'Fortress damage resistance' },
  lampalotl: { id: 'neon-cascade', family: 'lampalotl', name: 'Neon Cascade', shortLabel: 'CSC', accentColor: 0xff86d7, effect: 'Squad projectile damage' },
  dishnail: { id: 'quasar-lock', family: 'dishnail', name: 'Quasar Lock', shortLabel: 'LCK', accentColor: 0xc57dff, effect: 'Coin bounty from combat' },
  mochimoth: { id: 'mochi-cushion', family: 'mochimoth', name: 'Mochi Cushion', shortLabel: 'MCH', accentColor: 0xff9acb, effect: 'Additional fortress damage smoothing' },
  routeraptor: { id: 'packet-flock', family: 'routeraptor', name: 'Packet Flock', shortLabel: 'NET', accentColor: 0x42dfe8, effect: 'Chaos Energy generation' },
  vendinguana: { id: 'price-breaker', family: 'vendinguana', name: 'Price Breaker', shortLabel: 'BRK', accentColor: 0xffb858, effect: 'Bonus damage against bosses' },
  umbrellama: { id: 'storm-canopy', family: 'umbrellama', name: 'Storm Canopy', shortLabel: 'CAN', accentColor: 0x8c7dff, effect: 'Extra fortress shielding' },
  mopossum: { id: 'salvage-sweep', family: 'mopossum', name: 'Salvage Sweep', shortLabel: 'MOP', accentColor: 0x7ee6b8, effect: 'Extra combat coin salvage' },
  fanthom: { id: 'ghost-fan', family: 'fanthom', name: 'Ghost Fan', shortLabel: 'FAN', accentColor: 0x7e90ff, effect: 'Additional squad cadence' },
  socktopus: { id: 'laundry-barrage', family: 'socktopus', name: 'Laundry Barrage', shortLabel: 'SOX', accentColor: 0xffbd76, effect: 'Additional squad damage' },
  microwhale: { id: 'microwave-beam', family: 'microwhale', name: 'Microwave Beam', shortLabel: 'MWV', accentColor: 0xffae72, effect: 'Additional boss pressure' }
};

const ATTACK_INTERVAL_BY_TIER = [1, 0.97, 0.94, 0.9] as const;
const FAN_ATTACK_INTERVAL_BY_TIER = [1, 0.98, 0.95, 0.92] as const;
const TOAST_INCOMING_BY_TIER = [1, 0.96, 0.91, 0.85] as const;
const MOCHI_INCOMING_BY_TIER = [1, 0.98, 0.95, 0.91] as const;
const UMBRELLA_INCOMING_BY_TIER = [1, 0.985, 0.96, 0.925] as const;
const SQUAD_DAMAGE_BY_TIER = [1, 1.04, 1.08, 1.14] as const;
const SOCK_DAMAGE_BY_TIER = [1, 1.03, 1.07, 1.12] as const;
const COIN_REWARD_BY_TIER = [1, 1.05, 1.1, 1.18] as const;
const MOP_COIN_BY_TIER = [1, 1.04, 1.09, 1.15] as const;
const ENERGY_GAIN_BY_TIER = [1, 1.08, 1.16, 1.28] as const;
const BOSS_DAMAGE_BY_TIER = [1, 1.08, 1.17, 1.30] as const;
const WHALE_BOSS_BY_TIER = [1, 1.06, 1.14, 1.24] as const;

const EMPTY_POWER: Record<CreatureFamily, number> = {
  pinguino: 0, toastodilo: 0, lampalotl: 0, dishnail: 0, mochimoth: 0, routeraptor: 0, vendinguana: 0,
  umbrellama: 0, mopossum: 0, fanthom: 0, socktopus: 0, microwhale: 0
};
const EMPTY_TIERS: Record<CreatureFamily, CrewSynergyTier> = {
  pinguino: 0, toastodilo: 0, lampalotl: 0, dishnail: 0, mochimoth: 0, routeraptor: 0, vendinguana: 0,
  umbrellama: 0, mopossum: 0, fanthom: 0, socktopus: 0, microwhale: 0
};
const EMPTY_STATE: CrewSynergyState = { familyPower: EMPTY_POWER, tiers: EMPTY_TIERS, attackIntervalMultiplier: 1, incomingDamageMultiplier: 1, squadDamageMultiplier: 1, coinRewardMultiplier: 1, energyGainMultiplier: 1, bossDamageMultiplier: 1 };
let currentState: CrewSynergyState = EMPTY_STATE;

export function evaluateCrewSynergies(board: BoardState): CrewSynergyState {
  const familyPower: Record<CreatureFamily, number> = { ...EMPTY_POWER };
  for (const unit of board) { if (unit) familyPower[unit.family] += unitPower(unit.level); }
  const tiers = Object.fromEntries((Object.keys(familyPower) as CreatureFamily[]).map((family) => [family, tierForPower(familyPower[family])])) as Record<CreatureFamily, CrewSynergyTier>;
  return {
    familyPower, tiers,
    attackIntervalMultiplier: ATTACK_INTERVAL_BY_TIER[tiers.pinguino] * FAN_ATTACK_INTERVAL_BY_TIER[tiers.fanthom],
    incomingDamageMultiplier: TOAST_INCOMING_BY_TIER[tiers.toastodilo] * MOCHI_INCOMING_BY_TIER[tiers.mochimoth] * UMBRELLA_INCOMING_BY_TIER[tiers.umbrellama],
    squadDamageMultiplier: SQUAD_DAMAGE_BY_TIER[tiers.lampalotl] * SOCK_DAMAGE_BY_TIER[tiers.socktopus],
    coinRewardMultiplier: COIN_REWARD_BY_TIER[tiers.dishnail] * MOP_COIN_BY_TIER[tiers.mopossum],
    energyGainMultiplier: ENERGY_GAIN_BY_TIER[tiers.routeraptor],
    bossDamageMultiplier: BOSS_DAMAGE_BY_TIER[tiers.vendinguana] * WHALE_BOSS_BY_TIER[tiers.microwhale]
  };
}
export function syncCrewSynergyState(board: BoardState): CrewSynergyState { currentState = evaluateCrewSynergies(board); return currentState; }
export function getCurrentCrewSynergyState(): CrewSynergyState { return currentState; }
export function resetCrewSynergyState(): void { currentState = EMPTY_STATE; }
export function getActiveCrewSynergies(state: CrewSynergyState): readonly ActiveCrewSynergy[] { const active: ActiveCrewSynergy[] = []; for (const family of Object.keys(DEFINITIONS) as CreatureFamily[]) { const tier = state.tiers[family]; if (tier !== 0) active.push({ definition: DEFINITIONS[family], tier, familyPower: state.familyPower[family] }); } return active; }
export function getCrewSynergyDefinition(family: CreatureFamily): CrewSynergyDefinition { return DEFINITIONS[family]; }
export function unitPower(level: 1 | 2 | 3): number { return 2 ** (level - 1); }
export function tierForPower(power: number): CrewSynergyTier { if (power >= 8) return 3; if (power >= 4) return 2; if (power >= 2) return 1; return 0; }
