import type { BoardState } from './board';

export const ASCENSION_BRANCHES = ['merge', 'combat', 'chaos', 'collection'] as const;
export type AscensionBranch = (typeof ASCENSION_BRANCHES)[number];

export const ASCENSION_NODE_IDS = [
  'fusion-rebate',
  'recruit-catalyst',
  'fortress-reboot',
  'execution-protocol',
  'rift-capacitor',
  'ability-recycler',
  'mutation-lens',
  'album-resonance'
] as const;
export type AscensionNodeId = (typeof ASCENSION_NODE_IDS)[number];

export interface AscensionNodeDefinition {
  readonly id: AscensionNodeId;
  readonly branch: AscensionBranch;
  readonly name: string;
  readonly description: string;
  readonly cost: number;
  readonly prerequisite: AscensionNodeId | null;
  readonly accentColor: number;
}

export interface AscensionState {
  readonly chaosStars: number;
  readonly totalAscensions: number;
  readonly highestChapter: number;
  readonly unlockedNodes: readonly AscensionNodeId[];
}

export interface AscensionEffects {
  readonly mergeCoinRefund: number;
  readonly recruitCostDiscount: number;
  readonly bossVictoryHealBonus: number;
  readonly bossExecuteRatio: number;
  readonly bossExecuteDamageMultiplier: number;
  readonly startingChaosEnergy: number;
  readonly abilityEnergyRefund: number;
  readonly mutationLuckShift: number;
  readonly albumMilestoneStarBonus: number;
}

export interface AscensionResult {
  readonly ascended: boolean;
  readonly starsGained: number;
  readonly next: AscensionState;
}

const NODE_DEFINITIONS: readonly AscensionNodeDefinition[] = [
  { id: 'fusion-rebate', branch: 'merge', name: 'Fusion Rebate', description: 'Every successful merge refunds 4 coins.', cost: 1, prerequisite: null, accentColor: 0x7be7ff },
  { id: 'recruit-catalyst', branch: 'merge', name: 'Recruit Catalyst', description: 'Recruit cost is permanently reduced by 4 coins.', cost: 3, prerequisite: 'fusion-rebate', accentColor: 0x43c7ff },
  { id: 'fortress-reboot', branch: 'combat', name: 'Fortress Reboot', description: 'Boss victories restore 20 additional fortress HP.', cost: 1, prerequisite: null, accentColor: 0xffb866 },
  { id: 'execution-protocol', branch: 'combat', name: 'Execution Protocol', description: 'Bosses below 12% HP take 50% more damage.', cost: 3, prerequisite: 'fortress-reboot', accentColor: 0xff786f },
  { id: 'rift-capacitor', branch: 'chaos', name: 'Rift Capacitor', description: 'Start every encounter with 15 Chaos Energy.', cost: 1, prerequisite: null, accentColor: 0xc88cff },
  { id: 'ability-recycler', branch: 'chaos', name: 'Ability Recycler', description: 'Successful active ability casts refund 8 Chaos Energy.', cost: 3, prerequisite: 'rift-capacitor', accentColor: 0x9d73ff },
  { id: 'mutation-lens', branch: 'collection', name: 'Mutation Lens', description: 'Recruit mutation rolls gain +3 percentage points of non-Common chance.', cost: 1, prerequisite: null, accentColor: 0x73f1be },
  { id: 'album-resonance', branch: 'collection', name: 'Album Resonance', description: 'Mutation Album milestones grant +1 bonus Chaos Star.', cost: 3, prerequisite: 'mutation-lens', accentColor: 0xffda75 }
] as const;

const EMPTY_EFFECTS: AscensionEffects = {
  mergeCoinRefund: 0,
  recruitCostDiscount: 0,
  bossVictoryHealBonus: 0,
  bossExecuteRatio: 0,
  bossExecuteDamageMultiplier: 1,
  startingChaosEnergy: 0,
  abilityEnergyRefund: 0,
  mutationLuckShift: 0,
  albumMilestoneStarBonus: 0
};

let currentState: AscensionState = createDefaultAscensionState();

export function createDefaultAscensionState(): AscensionState {
  return { chaosStars: 0, totalAscensions: 0, highestChapter: 1, unlockedNodes: [] };
}

export function observeAscensionChapter(state: AscensionState, chapter: number): AscensionState {
  const safeChapter = Math.max(1, Math.floor(Number.isFinite(chapter) ? chapter : 1));
  return safeChapter > state.highestChapter ? { ...state, highestChapter: safeChapter } : state;
}

export function ascensionRequiredChapter(state: AscensionState): number {
  return 20 + state.totalAscensions * 5;
}

export function ascensionReward(state: AscensionState, currentChapter: number): number {
  const chapter = Math.max(1, Math.floor(Number.isFinite(currentChapter) ? currentChapter : 1));
  if (chapter < ascensionRequiredChapter(state)) return 0;
  return Math.min(12, 3 + Math.floor((chapter - ascensionRequiredChapter(state)) / 5));
}

export function canAscend(state: AscensionState, currentChapter: number): boolean {
  return ascensionReward(state, currentChapter) > 0;
}

export function performAscension(state: AscensionState, currentChapter: number): AscensionResult {
  const starsGained = ascensionReward(state, currentChapter);
  if (starsGained <= 0) return { ascended: false, starsGained: 0, next: observeAscensionChapter(state, currentChapter) };
  return {
    ascended: true,
    starsGained,
    next: {
      ...observeAscensionChapter(state, currentChapter),
      chaosStars: Math.min(1_000_000, state.chaosStars + starsGained),
      totalAscensions: Math.min(10_000, state.totalAscensions + 1)
    }
  };
}

export function purchaseAscensionNode(state: AscensionState, id: AscensionNodeId): AscensionState {
  if (state.unlockedNodes.includes(id)) return state;
  const definition = getAscensionNode(id);
  if (definition.prerequisite && !state.unlockedNodes.includes(definition.prerequisite)) return state;
  if (state.chaosStars < definition.cost) return state;
  return {
    ...state,
    chaosStars: state.chaosStars - definition.cost,
    unlockedNodes: [...state.unlockedNodes, id]
  };
}

export function addChaosStars(state: AscensionState, amount: number): AscensionState {
  const safe = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0));
  if (safe === 0) return state;
  return { ...state, chaosStars: Math.min(1_000_000, state.chaosStars + safe) };
}

export function getAscensionNode(id: AscensionNodeId): AscensionNodeDefinition {
  const definition = NODE_DEFINITIONS.find((node) => node.id === id);
  if (!definition) throw new Error(`Unknown ascension node: ${id}`);
  return definition;
}

export function getAscensionNodes(): readonly AscensionNodeDefinition[] { return NODE_DEFINITIONS; }

export function isAscensionNodeId(value: unknown): value is AscensionNodeId {
  return typeof value === 'string' && (ASCENSION_NODE_IDS as readonly string[]).includes(value);
}

export function getAscensionEffects(state: AscensionState): AscensionEffects {
  const has = (id: AscensionNodeId): boolean => state.unlockedNodes.includes(id);
  return {
    ...EMPTY_EFFECTS,
    mergeCoinRefund: has('fusion-rebate') ? 4 : 0,
    recruitCostDiscount: has('recruit-catalyst') ? 4 : 0,
    bossVictoryHealBonus: has('fortress-reboot') ? 20 : 0,
    bossExecuteRatio: has('execution-protocol') ? 0.12 : 0,
    bossExecuteDamageMultiplier: has('execution-protocol') ? 1.5 : 1,
    startingChaosEnergy: has('rift-capacitor') ? 15 : 0,
    abilityEnergyRefund: has('ability-recycler') ? 8 : 0,
    mutationLuckShift: has('mutation-lens') ? 0.03 : 0,
    albumMilestoneStarBonus: has('album-resonance') ? 1 : 0
  };
}

export function effectiveRecruitCost(baseCost: number, state: AscensionState = currentState): number {
  return Math.max(5, Math.floor(baseCost) - getAscensionEffects(state).recruitCostDiscount);
}

export function syncCurrentAscensionState(state: AscensionState): void { currentState = state; }
export function getCurrentAscensionState(): AscensionState { return currentState; }
export function getCurrentAscensionEffects(): AscensionEffects { return getAscensionEffects(currentState); }
export function resetCurrentAscensionState(): void { currentState = createDefaultAscensionState(); }

export function createAscensionResetBoard(factory: () => BoardState): BoardState { return factory(); }
