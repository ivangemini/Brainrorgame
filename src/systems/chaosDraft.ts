import type { EncounterStep } from './encounters';

export const CHAOS_PERK_IDS = [
  'impact-jelly',
  'tempo-worm',
  'fortress-foam',
  'bounty-magnet',
  'repair-moss',
  'chaos-capacitor'
] as const;

export type ChaosPerkId = (typeof CHAOS_PERK_IDS)[number];
export type ChaosDraftCheckpoint = 1 | 2;

export interface ChaosPerkDefinition {
  readonly id: ChaosPerkId;
  readonly name: string;
  readonly shortLabel: string;
  readonly description: string;
  readonly accentColor: number;
}

export interface ChaosPerkMultipliers {
  readonly squadDamageMultiplier: number;
  readonly attackIntervalMultiplier: number;
  readonly incomingDamageMultiplier: number;
  readonly coinRewardMultiplier: number;
  readonly energyGainMultiplier: number;
  readonly waveHealBonus: number;
}

const DEFINITIONS: Readonly<Record<ChaosPerkId, ChaosPerkDefinition>> = {
  'impact-jelly': {
    id: 'impact-jelly',
    name: 'Impact Jelly',
    shortLabel: 'IMPACT',
    description: '+9% squad damage for the rest of this chapter.',
    accentColor: 0xff829f
  },
  'tempo-worm': {
    id: 'tempo-worm',
    name: 'Tempo Worm',
    shortLabel: 'TEMPO',
    description: 'Crew attacks 8% faster for the rest of this chapter.',
    accentColor: 0x6fe9ff
  },
  'fortress-foam': {
    id: 'fortress-foam',
    name: 'Fortress Foam',
    shortLabel: 'FOAM',
    description: 'Fortress takes 12% less damage this chapter.',
    accentColor: 0x79c8ff
  },
  'bounty-magnet': {
    id: 'bounty-magnet',
    name: 'Bounty Magnet',
    shortLabel: 'BOUNTY',
    description: '+18% combat coin rewards this chapter.',
    accentColor: 0xffdc72
  },
  'repair-moss': {
    id: 'repair-moss',
    name: 'Repair Moss',
    shortLabel: 'REPAIR',
    description: 'Restore +7 extra fortress HP after every cleared wave.',
    accentColor: 0x83f3a5
  },
  'chaos-capacitor': {
    id: 'chaos-capacitor',
    name: 'Chaos Capacitor',
    shortLabel: 'CHARGE',
    description: '+25% Chaos Energy gain for the rest of this chapter.',
    accentColor: 0xc88cff
  }
};

let currentPerks: readonly ChaosPerkId[] = [];

export function getChaosPerkDefinition(id: ChaosPerkId): ChaosPerkDefinition {
  return DEFINITIONS[id];
}

export function getAllChaosPerkDefinitions(): readonly ChaosPerkDefinition[] {
  return CHAOS_PERK_IDS.map((id) => DEFINITIONS[id]);
}

export function isChaosPerkId(value: unknown): value is ChaosPerkId {
  return typeof value === 'string' && (CHAOS_PERK_IDS as readonly string[]).includes(value);
}

export function chaosDraftCheckpointForStep(step: EncounterStep): ChaosDraftCheckpoint | null {
  if (step === 2) return 1;
  if (step === 4) return 2;
  return null;
}

export function needsChaosDraft(step: EncounterStep, selectedCount: number): boolean {
  const checkpoint = chaosDraftCheckpointForStep(step);
  if (checkpoint === null) return false;
  return Math.max(0, Math.floor(selectedCount)) < checkpoint;
}

export function getChaosPerkOffers(
  chapter: number,
  checkpoint: ChaosDraftCheckpoint,
  selected: readonly ChaosPerkId[]
): readonly [ChaosPerkId, ChaosPerkId, ChaosPerkId] {
  const excluded = new Set(selected);
  const candidates = CHAOS_PERK_IDS.filter((id) => !excluded.has(id));
  const seed = Math.max(1, Math.floor(chapter)) * 97 + checkpoint * 41;
  const ordered = [...candidates].sort((a, b) => score(seed, a) - score(seed, b));
  const fallback = CHAOS_PERK_IDS.filter((id) => !ordered.includes(id));
  const pool = [...ordered, ...fallback];
  return [pool[0] ?? 'impact-jelly', pool[1] ?? 'tempo-worm', pool[2] ?? 'fortress-foam'];
}

export function addChaosPerk(selected: readonly ChaosPerkId[], id: ChaosPerkId): readonly ChaosPerkId[] {
  if (selected.includes(id) || selected.length >= 2) return [...selected];
  return [...selected, id];
}

export function syncCurrentChaosPerks(selected: readonly ChaosPerkId[]): void {
  currentPerks = [...selected];
}

export function resetCurrentChaosPerks(): void {
  currentPerks = [];
}

export function getCurrentChaosPerks(): readonly ChaosPerkId[] {
  return currentPerks;
}

export function getCurrentChaosPerkMultipliers(): ChaosPerkMultipliers {
  const has = (id: ChaosPerkId): boolean => currentPerks.includes(id);
  return {
    squadDamageMultiplier: has('impact-jelly') ? 1.09 : 1,
    attackIntervalMultiplier: has('tempo-worm') ? 0.92 : 1,
    incomingDamageMultiplier: has('fortress-foam') ? 0.88 : 1,
    coinRewardMultiplier: has('bounty-magnet') ? 1.18 : 1,
    energyGainMultiplier: has('chaos-capacitor') ? 1.25 : 1,
    waveHealBonus: has('repair-moss') ? 7 : 0
  };
}

function score(seed: number, id: ChaosPerkId): number {
  let value = seed >>> 0;
  for (let index = 0; index < id.length; index += 1) {
    value = Math.imul(value ^ id.charCodeAt(index), 2654435761) >>> 0;
    value ^= value >>> 13;
  }
  return value >>> 0;
}
