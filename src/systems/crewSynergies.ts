import type { CreatureFamily } from '../content/creatures';
import type { BoardState } from './board';

export type CrewSynergyTier = 0 | 1 | 2 | 3;
export type CrewSynergyId = 'slipstream-relay' | 'crust-bastion' | 'neon-cascade' | 'quasar-lock';

export interface CrewSynergyDefinition {
  readonly id: CrewSynergyId;
  readonly family: CreatureFamily;
  readonly name: string;
  readonly shortLabel: string;
  readonly accentColor: number;
  readonly effect: string;
}

export interface CrewSynergyState {
  readonly familyPower: Readonly<Record<CreatureFamily, number>>;
  readonly tiers: Readonly<Record<CreatureFamily, CrewSynergyTier>>;
  readonly attackIntervalMultiplier: number;
  readonly incomingDamageMultiplier: number;
  readonly squadDamageMultiplier: number;
  readonly pressureDamageMultiplier: number;
}

export interface ActiveCrewSynergy {
  readonly definition: CrewSynergyDefinition;
  readonly tier: Exclude<CrewSynergyTier, 0>;
  readonly familyPower: number;
}

const DEFINITIONS: Readonly<Record<CreatureFamily, CrewSynergyDefinition>> = {
  pinguino: {
    id: 'slipstream-relay',
    family: 'pinguino',
    name: 'Slipstream Relay',
    shortLabel: 'RELAY',
    accentColor: 0x64d8ff,
    effect: 'Squad attack cadence'
  },
  toastodilo: {
    id: 'crust-bastion',
    family: 'toastodilo',
    name: 'Crust Bastion',
    shortLabel: 'BASTION',
    accentColor: 0xffbd4d,
    effect: 'Fortress damage resistance'
  },
  lampalotl: {
    id: 'neon-cascade',
    family: 'lampalotl',
    name: 'Neon Cascade',
    shortLabel: 'CASCADE',
    accentColor: 0xff86d7,
    effect: 'Squad projectile damage'
  },
  dishnail: {
    id: 'quasar-lock',
    family: 'dishnail',
    name: 'Quasar Lock',
    shortLabel: 'LOCK',
    accentColor: 0xc57dff,
    effect: 'Boss and Chaos Gate damage'
  }
};

const ATTACK_INTERVAL_BY_TIER = [1, 0.97, 0.94, 0.9] as const;
const INCOMING_DAMAGE_BY_TIER = [1, 0.96, 0.91, 0.85] as const;
const SQUAD_DAMAGE_BY_TIER = [1, 1.04, 1.08, 1.14] as const;
const PRESSURE_DAMAGE_BY_TIER = [1, 1.08, 1.16, 1.25] as const;

export function evaluateCrewSynergies(board: BoardState): CrewSynergyState {
  const familyPower: Record<CreatureFamily, number> = {
    pinguino: 0,
    toastodilo: 0,
    lampalotl: 0,
    dishnail: 0
  };

  for (const unit of board) {
    if (!unit) continue;
    familyPower[unit.family] += unitPower(unit.level);
  }

  const tiers: Record<CreatureFamily, CrewSynergyTier> = {
    pinguino: tierForPower(familyPower.pinguino),
    toastodilo: tierForPower(familyPower.toastodilo),
    lampalotl: tierForPower(familyPower.lampalotl),
    dishnail: tierForPower(familyPower.dishnail)
  };

  return {
    familyPower,
    tiers,
    attackIntervalMultiplier: ATTACK_INTERVAL_BY_TIER[tiers.pinguino],
    incomingDamageMultiplier: INCOMING_DAMAGE_BY_TIER[tiers.toastodilo],
    squadDamageMultiplier: SQUAD_DAMAGE_BY_TIER[tiers.lampalotl],
    pressureDamageMultiplier: PRESSURE_DAMAGE_BY_TIER[tiers.dishnail]
  };
}

export function getActiveCrewSynergies(state: CrewSynergyState): readonly ActiveCrewSynergy[] {
  const families: readonly CreatureFamily[] = ['pinguino', 'toastodilo', 'lampalotl', 'dishnail'];
  const active: ActiveCrewSynergy[] = [];
  for (const family of families) {
    const tier = state.tiers[family];
    if (tier === 0) continue;
    active.push({
      definition: DEFINITIONS[family],
      tier,
      familyPower: state.familyPower[family]
    });
  }
  return active;
}

export function getCrewSynergyDefinition(family: CreatureFamily): CrewSynergyDefinition {
  return DEFINITIONS[family];
}

export function unitPower(level: 1 | 2 | 3): number {
  return 2 ** (level - 1);
}

export function tierForPower(power: number): CrewSynergyTier {
  if (power >= 8) return 3;
  if (power >= 4) return 2;
  if (power >= 2) return 1;
  return 0;
}
