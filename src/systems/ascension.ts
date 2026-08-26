import { getMutationDefinition, type MutationId } from '../content/mutations';
import { createStarterBoard, type BoardState } from './board';

export const ASCENSION_NODE_IDS = [
  'loaded-grid',
  'repair-fusion',
  'boss-fracture',
  'boss-refit',
  'third-draft',
  'chaos-reserve',
  'album-bounty',
  'mutation-anchor'
] as const;

export type AscensionNodeId = (typeof ASCENSION_NODE_IDS)[number];
export type AscensionBranch = 'merge' | 'combat' | 'chaos' | 'collection';

export interface AscensionNodeDefinition {
  readonly id: AscensionNodeId;
  readonly branch: AscensionBranch;
  readonly cost: number;
  readonly requires: AscensionNodeId | null;
  readonly accentColor: number;
}

export interface AscensionProgress {
  readonly chaosStars: number;
  readonly totalChaosStars: number;
  readonly ascensions: number;
  readonly highestRiftTier: number;
  readonly purchased: readonly AscensionNodeId[];
}

export interface AscensionOffer {
  readonly eligible: boolean;
  readonly completedChapter: number;
  readonly riftTier: number;
  readonly rewardStars: number;
}

export interface AscensionResult {
  readonly ascended: boolean;
  readonly rewardStars: number;
  readonly progress: AscensionProgress;
}

export interface AscensionNodePurchaseResult {
  readonly purchased: boolean;
  readonly progress: AscensionProgress;
}

export const FIRST_RIFT_CHAPTER = 16 as const;
export const FIRST_ASCENSION_COMPLETION_CHAPTER = 20 as const;
export const RIFT_CHAPTERS_PER_TIER = 5 as const;
export const ALBUM_BOUNTY_COINS = 25 as const;
export const CHAOS_RESERVE_ENERGY = 20 as const;
export const BOSS_FRACTURE_HP_MULTIPLIER = 0.92 as const;
export const REPAIR_FUSION_HP = 2 as const;

export const ASCENSION_NODES: readonly AscensionNodeDefinition[] = [
  { id: 'loaded-grid', branch: 'merge', cost: 1, requires: null, accentColor: 0xffb65f },
  { id: 'repair-fusion', branch: 'merge', cost: 2, requires: 'loaded-grid', accentColor: 0xffd27a },
  { id: 'boss-fracture', branch: 'combat', cost: 1, requires: null, accentColor: 0xff718d },
  { id: 'boss-refit', branch: 'combat', cost: 2, requires: 'boss-fracture', accentColor: 0xff9eaf },
  { id: 'third-draft', branch: 'chaos', cost: 1, requires: null, accentColor: 0xb88cff },
  { id: 'chaos-reserve', branch: 'chaos', cost: 2, requires: 'third-draft', accentColor: 0xd4adff },
  { id: 'album-bounty', branch: 'collection', cost: 1, requires: null, accentColor: 0x65e6ff },
  { id: 'mutation-anchor', branch: 'collection', cost: 2, requires: 'album-bounty', accentColor: 0x93f2ff }
] as const;

let currentProgress: AscensionProgress = createDefaultAscensionProgress();

export function createDefaultAscensionProgress(): AscensionProgress {
  return { chaosStars: 0, totalChaosStars: 0, ascensions: 0, highestRiftTier: 0, purchased: [] };
}

export function syncCurrentAscensionProgress(progress: AscensionProgress): void {
  currentProgress = cloneAscensionProgress(progress);
}

export function getCurrentAscensionProgress(): AscensionProgress {
  return currentProgress;
}

export function getAscensionNode(id: AscensionNodeId): AscensionNodeDefinition {
  const node = ASCENSION_NODES.find((entry) => entry.id === id);
  if (!node) throw new Error(`Unknown ascension node: ${id}`);
  return node;
}

export function isAscensionNodeId(value: unknown): value is AscensionNodeId {
  return typeof value === 'string' && (ASCENSION_NODE_IDS as readonly string[]).includes(value);
}

export function hasAscensionNode(progress: Pick<AscensionProgress, 'purchased'>, id: AscensionNodeId): boolean {
  return progress.purchased.includes(id);
}

export function ascensionOffer(chapter: number): AscensionOffer {
  const safeChapter = Math.max(1, Math.floor(Number.isFinite(chapter) ? chapter : 1));
  const completedChapter = Math.max(0, safeChapter - 1);
  if (completedChapter < FIRST_ASCENSION_COMPLETION_CHAPTER) {
    return { eligible: false, completedChapter, riftTier: 0, rewardStars: 0 };
  }
  const riftTier = 1 + Math.floor((completedChapter - FIRST_ASCENSION_COMPLETION_CHAPTER) / RIFT_CHAPTERS_PER_TIER);
  return { eligible: true, completedChapter, riftTier, rewardStars: riftTier };
}

export function performAscension(progress: AscensionProgress, chapter: number): AscensionResult {
  const offer = ascensionOffer(chapter);
  if (!offer.eligible) return { ascended: false, rewardStars: 0, progress };
  const rewardStars = offer.rewardStars;
  return {
    ascended: true,
    rewardStars,
    progress: {
      ...progress,
      chaosStars: Math.min(1_000_000, progress.chaosStars + rewardStars),
      totalChaosStars: Math.min(1_000_000_000, progress.totalChaosStars + rewardStars),
      ascensions: Math.min(1_000_000, progress.ascensions + 1),
      highestRiftTier: Math.max(progress.highestRiftTier, offer.riftTier)
    }
  };
}

export function purchaseAscensionNode(progress: AscensionProgress, id: AscensionNodeId): AscensionNodePurchaseResult {
  if (progress.purchased.includes(id)) return { purchased: false, progress };
  const node = getAscensionNode(id);
  if (node.requires && !progress.purchased.includes(node.requires)) return { purchased: false, progress };
  if (progress.chaosStars < node.cost) return { purchased: false, progress };
  return {
    purchased: true,
    progress: {
      ...progress,
      chaosStars: progress.chaosStars - node.cost,
      purchased: [...progress.purchased, id]
    }
  };
}

export function strongestBoardMutation(board: BoardState): MutationId {
  let best: MutationId = 'none';
  let bestRank = 0;
  for (const unit of board) {
    if (!unit) continue;
    const rank = getMutationDefinition(unit.mutation).rank;
    if (rank > bestRank) {
      best = unit.mutation;
      bestRank = rank;
    }
  }
  return best;
}

export function createAscensionStarterBoard(progress: AscensionProgress, carriedMutation: MutationId = 'none'): BoardState {
  const board = [...createStarterBoard()];
  if (hasAscensionNode(progress, 'loaded-grid')) {
    board[8] = { id: 'ascension-p1a', family: 'pinguino', level: 1, mutation: 'none' };
    board[9] = { id: 'ascension-p1b', family: 'pinguino', level: 1, mutation: 'none' };
  }
  if (hasAscensionNode(progress, 'mutation-anchor') && carriedMutation !== 'none') {
    const first = board[0];
    if (first) board[0] = { ...first, id: `anchored-${carriedMutation}-${first.id}`, mutation: carriedMutation };
  }
  return board;
}

export function bossStartingHp(maxHp: number, progress: AscensionProgress): number {
  const safe = Math.max(1, Math.floor(maxHp));
  if (!hasAscensionNode(progress, 'boss-fracture')) return safe;
  return Math.max(1, Math.round(safe * BOSS_FRACTURE_HP_MULTIPLIER));
}

export function fusionRepairAmount(progress: AscensionProgress): number {
  return hasAscensionNode(progress, 'repair-fusion') ? REPAIR_FUSION_HP : 0;
}

export function bossClearHealToFull(progress: AscensionProgress): boolean {
  return hasAscensionNode(progress, 'boss-refit');
}

export function allowsThirdChaosDraft(progress: AscensionProgress): boolean {
  return hasAscensionNode(progress, 'third-draft');
}

export function combatEnergyReserve(progress: AscensionProgress): number {
  return hasAscensionNode(progress, 'chaos-reserve') ? CHAOS_RESERVE_ENERGY : 0;
}

export function currentCombatEnergyReserve(): number {
  return combatEnergyReserve(currentProgress);
}

export function albumDiscoveryBounty(progress: AscensionProgress): number {
  return hasAscensionNode(progress, 'album-bounty') ? ALBUM_BOUNTY_COINS : 0;
}

function cloneAscensionProgress(progress: AscensionProgress): AscensionProgress {
  return { ...progress, purchased: [...progress.purchased] };
}
