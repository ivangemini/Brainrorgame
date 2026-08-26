export const ASCENSION_UNLOCK_CHAPTER = 21;
export const ASCENSION_CHAPTER_STEP = 5;
export const ASCENSION_STARTING_COINS = 160;

export type AscensionBranch = 'merge' | 'combat' | 'chaos' | 'collection';

export type AscensionNodeId =
  | 'merge-seed-cache'
  | 'merge-echo'
  | 'merge-catalyst'
  | 'combat-last-stand'
  | 'combat-boss-window'
  | 'combat-victory-repair'
  | 'chaos-reroute'
  | 'chaos-bank'
  | 'chaos-fourth-door'
  | 'collection-pity-memory'
  | 'collection-album-cache'
  | 'collection-signal-map';

export interface AscensionNodeDefinition {
  readonly id: AscensionNodeId;
  readonly branch: AscensionBranch;
  readonly tier: 1 | 2 | 3;
  readonly cost: 1 | 2 | 3;
  readonly prerequisite: AscensionNodeId | null;
}

export interface AscensionProgress {
  readonly chaosStars: number;
  readonly lifetimeChaosStars: number;
  readonly ascensions: number;
  readonly highestResetChapter: number;
  readonly purchasedNodes: readonly AscensionNodeId[];
  readonly lastAscendedAt: number | null;
}

export type AscensionBlockReason = 'chapter' | 'weekly-active' | 'push-deeper';

export interface AscensionPreview {
  readonly eligible: boolean;
  readonly reason: AscensionBlockReason | null;
  readonly chapter: number;
  readonly milestone: number;
  readonly starsAwarded: number;
  readonly lifetimeStarsAfter: number;
  readonly nextChapter: number;
}

export interface AscensionEffects {
  readonly startingRecruitCredits: number;
  readonly mergeEchoInterval: number | null;
  readonly mergeEchoRecruitCredits: number;
  readonly tierThreeMutationBoost: boolean;
  readonly fortressLastStandCharges: number;
  readonly bossOpeningDelayMs: number;
  readonly bossVictoryRepairRatio: number;
  readonly draftRerollsPerChapter: number;
  readonly chaosEnergyCarryRatio: number;
  readonly extraDraftChoiceEveryChapters: number | null;
  readonly anomalyPityCarryRatio: number;
  readonly firstAlbumDiscoveryCoreShards: number;
  readonly revealUndiscoveredAlbumTarget: boolean;
}

export interface AscensionResetPlan {
  readonly chapter: 1;
  readonly encounterStep: 0;
  readonly coins: number;
  readonly clearBoard: true;
  readonly refillFortress: true;
  readonly clearChaosPerks: true;
  readonly anomalyPityCarryRatio: number;
  readonly preserveCoreLab: true;
  readonly preserveDaily: true;
  readonly preserveCollection: true;
  readonly preserveMutationAlbum: true;
  readonly preserveAchievements: true;
  readonly preserveOnboarding: true;
  readonly startingRecruitCredits: number;
}

export interface PerformAscensionResult {
  readonly performed: boolean;
  readonly preview: AscensionPreview;
  readonly progress: AscensionProgress;
  readonly resetPlan: AscensionResetPlan | null;
}

export interface PurchaseAscensionNodeResult {
  readonly purchased: boolean;
  readonly reason: 'owned' | 'prerequisite' | 'stars' | null;
  readonly progress: AscensionProgress;
}

export const ASCENSION_NODES: readonly AscensionNodeDefinition[] = [
  { id: 'merge-seed-cache', branch: 'merge', tier: 1, cost: 1, prerequisite: null },
  { id: 'merge-echo', branch: 'merge', tier: 2, cost: 2, prerequisite: 'merge-seed-cache' },
  { id: 'merge-catalyst', branch: 'merge', tier: 3, cost: 3, prerequisite: 'merge-echo' },
  { id: 'combat-last-stand', branch: 'combat', tier: 1, cost: 1, prerequisite: null },
  { id: 'combat-boss-window', branch: 'combat', tier: 2, cost: 2, prerequisite: 'combat-last-stand' },
  { id: 'combat-victory-repair', branch: 'combat', tier: 3, cost: 3, prerequisite: 'combat-boss-window' },
  { id: 'chaos-reroute', branch: 'chaos', tier: 1, cost: 1, prerequisite: null },
  { id: 'chaos-bank', branch: 'chaos', tier: 2, cost: 2, prerequisite: 'chaos-reroute' },
  { id: 'chaos-fourth-door', branch: 'chaos', tier: 3, cost: 3, prerequisite: 'chaos-bank' },
  { id: 'collection-pity-memory', branch: 'collection', tier: 1, cost: 1, prerequisite: null },
  { id: 'collection-album-cache', branch: 'collection', tier: 2, cost: 2, prerequisite: 'collection-pity-memory' },
  { id: 'collection-signal-map', branch: 'collection', tier: 3, cost: 3, prerequisite: 'collection-album-cache' }
] as const;

const NODE_IDS = new Set<AscensionNodeId>(ASCENSION_NODES.map((node) => node.id));

export function createDefaultAscensionProgress(): AscensionProgress {
  return {
    chaosStars: 0,
    lifetimeChaosStars: 0,
    ascensions: 0,
    highestResetChapter: 0,
    purchasedNodes: [],
    lastAscendedAt: null
  };
}

export function isAscensionNodeId(value: unknown): value is AscensionNodeId {
  return typeof value === 'string' && NODE_IDS.has(value as AscensionNodeId);
}

export function getAscensionNode(id: AscensionNodeId): AscensionNodeDefinition {
  const node = ASCENSION_NODES.find((entry) => entry.id === id);
  if (!node) throw new Error(`Unknown Ascension node: ${id}`);
  return node;
}

export function getAscensionMilestone(chapter: number): number {
  const safeChapter = Math.max(1, Math.floor(chapter));
  if (safeChapter < ASCENSION_UNLOCK_CHAPTER) return 0;
  return 1 + Math.floor((safeChapter - ASCENSION_UNLOCK_CHAPTER) / ASCENSION_CHAPTER_STEP);
}

export function getLifetimeStarsForMilestone(milestone: number): number {
  const safeMilestone = clamp(Math.floor(milestone), 0, 10_000);
  return Math.floor((safeMilestone * (safeMilestone + 1)) / 2);
}

export function getNextAscensionChapter(progress: AscensionProgress): number {
  const earnedMilestone = milestoneFromLifetimeStars(progress.lifetimeChaosStars);
  return ASCENSION_UNLOCK_CHAPTER + earnedMilestone * ASCENSION_CHAPTER_STEP;
}

export function previewAscension(
  progress: AscensionProgress,
  chapter: number,
  weeklyRunActive = false
): AscensionPreview {
  const safeChapter = Math.max(1, Math.floor(chapter));
  const milestone = getAscensionMilestone(safeChapter);
  const lifetimeStarsAfter = getLifetimeStarsForMilestone(milestone);
  const starsAwarded = Math.max(0, lifetimeStarsAfter - progress.lifetimeChaosStars);
  const nextChapter = ASCENSION_UNLOCK_CHAPTER + milestone * ASCENSION_CHAPTER_STEP;

  if (weeklyRunActive) {
    return { eligible: false, reason: 'weekly-active', chapter: safeChapter, milestone, starsAwarded: 0, lifetimeStarsAfter: progress.lifetimeChaosStars, nextChapter: getNextAscensionChapter(progress) };
  }
  if (milestone === 0) {
    return { eligible: false, reason: 'chapter', chapter: safeChapter, milestone, starsAwarded: 0, lifetimeStarsAfter: progress.lifetimeChaosStars, nextChapter: ASCENSION_UNLOCK_CHAPTER };
  }
  if (starsAwarded <= 0) {
    return { eligible: false, reason: 'push-deeper', chapter: safeChapter, milestone, starsAwarded: 0, lifetimeStarsAfter: progress.lifetimeChaosStars, nextChapter: getNextAscensionChapter(progress) };
  }

  return { eligible: true, reason: null, chapter: safeChapter, milestone, starsAwarded, lifetimeStarsAfter, nextChapter };
}

export function performAscension(
  progress: AscensionProgress,
  chapter: number,
  now = Date.now(),
  weeklyRunActive = false
): PerformAscensionResult {
  const preview = previewAscension(progress, chapter, weeklyRunActive);
  if (!preview.eligible) return { performed: false, preview, progress, resetPlan: null };

  const effects = getAscensionEffects(progress.purchasedNodes);
  const next: AscensionProgress = {
    chaosStars: progress.chaosStars + preview.starsAwarded,
    lifetimeChaosStars: preview.lifetimeStarsAfter,
    ascensions: progress.ascensions + 1,
    highestResetChapter: Math.max(progress.highestResetChapter, preview.chapter),
    purchasedNodes: [...progress.purchasedNodes],
    lastAscendedAt: Math.max(0, Math.floor(now))
  };

  return {
    performed: true,
    preview,
    progress: next,
    resetPlan: {
      chapter: 1,
      encounterStep: 0,
      coins: ASCENSION_STARTING_COINS,
      clearBoard: true,
      refillFortress: true,
      clearChaosPerks: true,
      anomalyPityCarryRatio: effects.anomalyPityCarryRatio,
      preserveCoreLab: true,
      preserveDaily: true,
      preserveCollection: true,
      preserveMutationAlbum: true,
      preserveAchievements: true,
      preserveOnboarding: true,
      startingRecruitCredits: effects.startingRecruitCredits
    }
  };
}

export function purchaseAscensionNode(
  progress: AscensionProgress,
  id: AscensionNodeId
): PurchaseAscensionNodeResult {
  if (progress.purchasedNodes.includes(id)) return { purchased: false, reason: 'owned', progress };
  const node = getAscensionNode(id);
  if (node.prerequisite && !progress.purchasedNodes.includes(node.prerequisite)) {
    return { purchased: false, reason: 'prerequisite', progress };
  }
  if (progress.chaosStars < node.cost) return { purchased: false, reason: 'stars', progress };

  return {
    purchased: true,
    reason: null,
    progress: {
      ...progress,
      chaosStars: progress.chaosStars - node.cost,
      purchasedNodes: [...progress.purchasedNodes, id]
    }
  };
}

export function getAscensionEffects(nodes: readonly AscensionNodeId[]): AscensionEffects {
  const owned = new Set(nodes);
  return {
    startingRecruitCredits: owned.has('merge-seed-cache') ? 2 : 0,
    mergeEchoInterval: owned.has('merge-echo') ? 8 : null,
    mergeEchoRecruitCredits: owned.has('merge-echo') ? 1 : 0,
    tierThreeMutationBoost: owned.has('merge-catalyst'),
    fortressLastStandCharges: owned.has('combat-last-stand') ? 1 : 0,
    bossOpeningDelayMs: owned.has('combat-boss-window') ? 1_500 : 0,
    bossVictoryRepairRatio: owned.has('combat-victory-repair') ? 0.2 : 0,
    draftRerollsPerChapter: owned.has('chaos-reroute') ? 1 : 0,
    chaosEnergyCarryRatio: owned.has('chaos-bank') ? 0.25 : 0,
    extraDraftChoiceEveryChapters: owned.has('chaos-fourth-door') ? 5 : null,
    anomalyPityCarryRatio: owned.has('collection-pity-memory') ? 0.5 : 0,
    firstAlbumDiscoveryCoreShards: owned.has('collection-album-cache') ? 1 : 0,
    revealUndiscoveredAlbumTarget: owned.has('collection-signal-map')
  };
}

export function isValidAscensionProgress(value: unknown): value is AscensionProgress {
  if (!isRecord(value)) return false;
  if (!isNonNegativeInteger(value.chaosStars) || !isNonNegativeInteger(value.lifetimeChaosStars)) return false;
  if (value.chaosStars > value.lifetimeChaosStars) return false;
  if (!isNonNegativeInteger(value.ascensions) || !isNonNegativeInteger(value.highestResetChapter)) return false;
  if (value.lastAscendedAt !== null && !isNonNegativeInteger(value.lastAscendedAt)) return false;

  const purchasedNodes = value.purchasedNodes;
  if (!Array.isArray(purchasedNodes) || !purchasedNodes.every(isAscensionNodeId)) return false;
  if (new Set(purchasedNodes).size !== purchasedNodes.length) return false;

  const earnedMilestone = milestoneFromLifetimeStars(value.lifetimeChaosStars);
  if (getLifetimeStarsForMilestone(earnedMilestone) !== value.lifetimeChaosStars) return false;

  const spent = purchasedNodes.reduce((sum, id) => sum + getAscensionNode(id).cost, 0);
  if (spent + value.chaosStars > value.lifetimeChaosStars) return false;
  return purchasedNodes.every((id) => {
    const prerequisite = getAscensionNode(id).prerequisite;
    return prerequisite === null || purchasedNodes.includes(prerequisite);
  });
}

function milestoneFromLifetimeStars(stars: number): number {
  const safeStars = Math.max(0, Math.floor(stars));
  let milestone = 0;
  while (getLifetimeStarsForMilestone(milestone + 1) <= safeStars && milestone < 10_000) milestone += 1;
  return milestone;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value >= 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
