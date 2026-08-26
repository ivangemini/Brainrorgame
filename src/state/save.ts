import { isCreatureFamily, type CreatureFamily } from '../content/creatures';
import { isMutationId } from '../content/mutations';
import type { PlatformAdapter } from '../platform/PlatformAdapter';
import {
  ANOMALY_PITY_MAX,
  ANOMALY_SECRET_PITY_MAX,
  createDefaultAnomalyHuntState,
  type AnomalyHuntState
} from '../systems/anomalyHunt';
import type { BoardState, BoardUnit } from '../systems/board';
import { isChaosPerkId, type ChaosPerkId } from '../systems/chaosDraft';
import {
  backfillCollectionProgress,
  isAchievementId,
  isCollectionKey,
  type AchievementId,
  type CollectionKey,
  type CollectionProgress
} from '../systems/collectionProgression';
import { createDefaultDailyState, type DailyRetentionState } from '../systems/dailyRetention';
import { BOSS_STEP, type EncounterStep } from '../systems/encounters';
import {
  createDefaultMetaUpgradeLevels,
  getMetaUpgradeDefinition,
  type MetaUpgradeLevels
} from '../systems/metaProgression';
import {
  backfillMutationAlbumProgress,
  isMutationAlbumKey,
  MUTATION_ALBUM_MILESTONES,
  type MutationAlbumKey,
  type MutationAlbumProgress
} from '../systems/mutationAlbum';
import {
  createCompletedOnboardingState,
  isValidOnboardingState,
  type OnboardingState
} from '../systems/onboarding';
import {
  WEEKLY_CHAOS_MAX_DEPTH,
  WEEKLY_CHAOS_MILESTONES,
  createDefaultWeeklyChaosProgress,
  type WeeklyChaosProgress
} from '../systems/weeklyChaos';

export const SAVE_VERSION = 12 as const;

type LegacyEncounterStep = 0 | 1 | 2 | 3;

export interface LegacyBoardUnit {
  readonly id: string;
  readonly family: CreatureFamily;
  readonly level: 1 | 2 | 3;
}
export type LegacyBoardState = readonly (LegacyBoardUnit | null)[];

export interface GameSaveV1 {
  readonly version: 1;
  readonly updatedAt: number;
  readonly coins: number;
  readonly baseHp: number;
  readonly bossRound: number;
  readonly bossHpMax: number;
  readonly bossHp: number;
  readonly recruitSerial: number;
  readonly board: LegacyBoardState;
}

export interface GameSaveV2 {
  readonly version: 2;
  readonly updatedAt: number;
  readonly coins: number;
  readonly baseHp: number;
  readonly chapter: number;
  readonly encounterStep: LegacyEncounterStep;
  readonly targetHpMax: number;
  readonly targetHp: number;
  readonly recruitSerial: number;
  readonly board: LegacyBoardState;
}

export interface GameSaveV3 extends Omit<GameSaveV2, 'version'> {
  readonly version: 3;
  readonly coreShards: number;
  readonly upgrades: MetaUpgradeLevels;
}

export interface GameSaveV4 extends Omit<GameSaveV3, 'version'> {
  readonly version: 4;
  readonly daily: DailyRetentionState;
}

export interface GameSaveV5 extends Omit<GameSaveV4, 'version'> {
  readonly version: 5;
  readonly collection: CollectionProgress;
}

export interface GameSaveV6 extends Omit<GameSaveV5, 'version'> {
  readonly version: 6;
  readonly onboarding: OnboardingState;
}

export interface GameSaveV7 extends Omit<GameSaveV6, 'version' | 'board'> {
  readonly version: 7;
  readonly board: BoardState;
}

export interface GameSaveV8 extends Omit<GameSaveV7, 'version' | 'encounterStep'> {
  readonly version: 8;
  readonly encounterStep: EncounterStep;
}

export interface GameSaveV9 extends Omit<GameSaveV8, 'version'> {
  readonly version: 9;
  readonly chaosPerks: readonly ChaosPerkId[];
}

export interface GameSaveV10 extends Omit<GameSaveV9, 'version'> {
  readonly version: 10;
  readonly anomalyHunt: AnomalyHuntState;
}

export interface GameSaveV11 extends Omit<GameSaveV10, 'version'> {
  readonly version: 11;
  readonly mutationAlbum: MutationAlbumProgress;
}

export interface GameSaveV12 extends Omit<GameSaveV11, 'version'> {
  readonly version: typeof SAVE_VERSION;
  readonly weeklyChaos: WeeklyChaosProgress;
}

export type GameSave = GameSaveV12;

export interface GameSaveSnapshot {
  readonly coins: number;
  readonly coreShards: number;
  readonly upgrades: MetaUpgradeLevels;
  readonly daily: DailyRetentionState;
  readonly collection: CollectionProgress;
  readonly onboarding: OnboardingState;
  readonly anomalyHunt: AnomalyHuntState;
  readonly mutationAlbum: MutationAlbumProgress;
  readonly weeklyChaos: WeeklyChaosProgress;
  readonly baseHp: number;
  readonly chapter: number;
  readonly encounterStep: EncounterStep;
  readonly targetHpMax: number;
  readonly targetHp: number;
  readonly recruitSerial: number;
  readonly board: BoardState;
  readonly chaosPerks: readonly ChaosPerkId[];
}

interface CommonProgressFields {
  readonly updatedAt: number;
  readonly coins: number;
  readonly baseHp: number;
  readonly chapter: number;
  readonly encounterStep: EncounterStep;
  readonly targetHpMax: number;
  readonly targetHp: number;
  readonly recruitSerial: number;
  readonly board: BoardState;
}

interface V4ProgressFields extends CommonProgressFields {
  readonly coreShards: number;
  readonly upgrades: MetaUpgradeLevels;
  readonly daily: DailyRetentionState;
}

interface V5ProgressFields extends V4ProgressFields {
  readonly collection: CollectionProgress;
}

type BoardParser = (value: unknown) => BoardState | null;
type StepParser = (value: unknown) => EncounterStep | null;

export function createGameSave(snapshot: GameSaveSnapshot, now = Date.now()): GameSaveV12 {
  return {
    version: SAVE_VERSION,
    updatedAt: now,
    coins: snapshot.coins,
    coreShards: snapshot.coreShards,
    upgrades: { ...snapshot.upgrades },
    daily: cloneDaily(snapshot.daily),
    collection: cloneCollection(snapshot.collection),
    onboarding: cloneOnboarding(snapshot.onboarding),
    anomalyHunt: cloneAnomalyHunt(snapshot.anomalyHunt),
    mutationAlbum: cloneMutationAlbum(snapshot.mutationAlbum),
    weeklyChaos: cloneWeeklyChaos(snapshot.weeklyChaos),
    baseHp: snapshot.baseHp,
    chapter: snapshot.chapter,
    encounterStep: snapshot.encounterStep,
    targetHpMax: snapshot.targetHpMax,
    targetHp: snapshot.targetHp,
    recruitSerial: snapshot.recruitSerial,
    board: cloneBoard(snapshot.board),
    chaosPerks: [...snapshot.chaosPerks]
  };
}

export async function loadGameSave(platform: PlatformAdapter): Promise<GameSave | null> {
  try {
    const raw = await platform.loadSave<unknown>();
    return parseGameSave(raw);
  } catch {
    return null;
  }
}

export function parseGameSave(value: unknown): GameSave | null {
  if (!isRecord(value) || !isFiniteNumber(value.version) || !Number.isInteger(value.version)) return null;
  let current: unknown = value;

  while (isRecord(current) && isFiniteNumber(current.version) && current.version < SAVE_VERSION) {
    switch (current.version) {
      case 1: current = migrateV1ToV2(current); break;
      case 2: current = migrateV2ToV3(current); break;
      case 3: current = migrateV3ToV4(current); break;
      case 4: current = migrateV4ToV5(current); break;
      case 5: current = migrateV5ToV6(current); break;
      case 6: current = migrateV6ToV7(current); break;
      case 7: current = migrateV7ToV8(current); break;
      case 8: current = migrateV8ToV9(current); break;
      case 9: current = migrateV9ToV10(current); break;
      case 10: current = migrateV10ToV11(current); break;
      case 11: current = migrateV11ToV12(current); break;
      default: return null;
    }
    if (current === null) return null;
  }

  if (!isRecord(current) || current.version !== SAVE_VERSION) return null;
  return parseV12(current);
}

function parseV12(value: Record<string, unknown>): GameSaveV12 | null {
  const v11 = parseV11(value);
  const weeklyChaos = parseWeeklyChaos(value.weeklyChaos);
  if (!v11 || !weeklyChaos) return null;
  return { ...v11, version: SAVE_VERSION, weeklyChaos };
}

function parseV11(value: Record<string, unknown>): GameSaveV11 | null {
  const v5 = parseV5Fields(value, parseCurrentBoard, parseCurrentEncounterStep);
  const chaosPerks = parseChaosPerks(value.chaosPerks);
  const anomalyHunt = parseAnomalyHunt(value.anomalyHunt);
  const mutationAlbum = parseMutationAlbum(value.mutationAlbum);
  if (!v5 || !chaosPerks || !anomalyHunt || !mutationAlbum || !isValidOnboardingState(value.onboarding)) return null;
  return {
    version: 11,
    ...v5,
    onboarding: cloneOnboarding(value.onboarding),
    chaosPerks,
    anomalyHunt,
    mutationAlbum
  };
}

function migrateV11ToV12(value: unknown): GameSaveV12 | null {
  if (!isRecord(value)) return null;
  const v11 = parseV11(value);
  if (!v11) return null;
  return {
    ...v11,
    version: SAVE_VERSION,
    weeklyChaos: createDefaultWeeklyChaosProgress(v11.updatedAt)
  };
}

function migrateV10ToV11(value: unknown): GameSaveV11 | null {
  if (!isRecord(value)) return null;
  const v5 = parseV5Fields(value, parseCurrentBoard, parseCurrentEncounterStep);
  const chaosPerks = parseChaosPerks(value.chaosPerks);
  const anomalyHunt = parseAnomalyHunt(value.anomalyHunt);
  if (!v5 || !chaosPerks || !anomalyHunt || !isValidOnboardingState(value.onboarding)) return null;
  return {
    version: 11,
    ...v5,
    onboarding: cloneOnboarding(value.onboarding),
    chaosPerks,
    anomalyHunt,
    mutationAlbum: backfillMutationAlbumProgress(v5.collection, v5.board)
  };
}

function migrateV9ToV10(value: unknown): GameSaveV10 | null {
  if (!isRecord(value)) return null;
  const v5 = parseV5Fields(value, parseCurrentBoard, parseCurrentEncounterStep);
  const chaosPerks = parseChaosPerks(value.chaosPerks);
  if (!v5 || !chaosPerks || !isValidOnboardingState(value.onboarding)) return null;
  return {
    version: 10,
    ...v5,
    onboarding: cloneOnboarding(value.onboarding),
    chaosPerks,
    anomalyHunt: createDefaultAnomalyHuntState()
  };
}

function migrateV8ToV9(value: unknown): GameSaveV9 | null {
  if (!isRecord(value)) return null;
  const v5 = parseV5Fields(value, parseCurrentBoard, parseCurrentEncounterStep);
  if (!v5 || !isValidOnboardingState(value.onboarding)) return null;
  return {
    version: 9,
    ...v5,
    onboarding: cloneOnboarding(value.onboarding),
    chaosPerks: []
  };
}

function migrateV7ToV8(value: unknown): GameSaveV8 | null {
  if (!isRecord(value)) return null;
  const v5 = parseV5Fields(value, parseCurrentBoard, parseLegacyEncounterStep);
  if (!v5 || !isValidOnboardingState(value.onboarding)) return null;
  return {
    version: 8,
    ...v5,
    encounterStep: v5.encounterStep === 3 ? BOSS_STEP : v5.encounterStep,
    onboarding: cloneOnboarding(value.onboarding)
  };
}

function migrateV6ToV7(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const v5 = parseV5Fields(value, parseLegacyCompatibleBoard, parseLegacyEncounterStep);
  if (!v5 || !isValidOnboardingState(value.onboarding)) return null;
  return {
    version: 7,
    ...v5,
    onboarding: cloneOnboarding(value.onboarding)
  };
}

function migrateV5ToV6(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const v5 = parseV5Fields(value, parseLegacyCompatibleBoard, parseLegacyEncounterStep);
  if (!v5) return null;
  return {
    version: 6,
    ...v5,
    onboarding: createCompletedOnboardingState(v5.updatedAt)
  };
}

function migrateV4ToV5(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const v4 = parseV4Fields(value, parseLegacyCompatibleBoard, parseLegacyEncounterStep);
  if (!v4) return null;
  const collection = backfillCollectionProgress(
    v4.board,
    v4.chapter,
    v4.encounterStep,
    v4.recruitSerial,
    v4.upgrades
  );
  return { version: 5, ...v4, collection };
}

function migrateV3ToV4(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const common = parseCommonFields(value, parseLegacyCompatibleBoard, parseLegacyEncounterStep);
  const upgrades = parseUpgrades(value.upgrades);
  if (!common || !upgrades || !isFiniteNumber(value.coreShards)) return null;
  return {
    version: 4,
    ...common,
    coreShards: clamp(Math.floor(value.coreShards), 0, 1_000_000),
    upgrades,
    daily: createDefaultDailyState(common.updatedAt)
  };
}

function migrateV2ToV3(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const common = parseCommonFields(value, parseLegacyCompatibleBoard, parseLegacyEncounterStep);
  if (!common) return null;
  return {
    version: 3,
    ...common,
    coreShards: Math.max(0, common.chapter - 1),
    upgrades: createDefaultMetaUpgradeLevels()
  };
}

function migrateV1ToV2(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const board = parseLegacyCompatibleBoard(value.board);
  if (!board) return null;
  if (!isFiniteNumber(value.updatedAt) || !isFiniteNumber(value.coins) || !isFiniteNumber(value.baseHp)) return null;
  if (!isFiniteNumber(value.bossRound) || !isFiniteNumber(value.bossHpMax) || !isFiniteNumber(value.bossHp)) return null;
  if (!isFiniteNumber(value.recruitSerial)) return null;

  const targetHpMax = Math.max(1, Math.floor(value.bossHpMax));
  return {
    version: 2,
    updatedAt: Math.max(0, value.updatedAt),
    coins: Math.max(0, Math.floor(value.coins)),
    baseHp: clamp(Math.floor(value.baseHp), 0, 100),
    chapter: Math.max(1, Math.floor(value.bossRound)),
    encounterStep: 3,
    targetHpMax,
    targetHp: clamp(Math.floor(value.bossHp), 0, targetHpMax),
    recruitSerial: Math.max(0, Math.floor(value.recruitSerial)),
    board
  };
}

function parseV5Fields(value: Record<string, unknown>, boardParser: BoardParser, stepParser: StepParser): V5ProgressFields | null {
  const v4 = parseV4Fields(value, boardParser, stepParser);
  const collection = parseCollection(value.collection);
  if (!v4 || !collection) return null;
  return { ...v4, collection };
}

function parseV4Fields(value: Record<string, unknown>, boardParser: BoardParser, stepParser: StepParser): V4ProgressFields | null {
  const common = parseCommonFields(value, boardParser, stepParser);
  const upgrades = parseUpgrades(value.upgrades);
  const daily = parseDaily(value.daily);
  if (!common || !upgrades || !daily || !isFiniteNumber(value.coreShards)) return null;
  return {
    ...common,
    coreShards: clamp(Math.floor(value.coreShards), 0, 1_000_000),
    upgrades,
    daily
  };
}

function parseCommonFields(value: Record<string, unknown>, boardParser: BoardParser, stepParser: StepParser): CommonProgressFields | null {
  const board = boardParser(value.board);
  const encounterStep = stepParser(value.encounterStep);
  if (!board || encounterStep === null) return null;
  if (!isFiniteNumber(value.updatedAt) || !isFiniteNumber(value.coins) || !isFiniteNumber(value.baseHp)) return null;
  if (!isFiniteNumber(value.chapter)) return null;
  if (!isFiniteNumber(value.targetHpMax) || !isFiniteNumber(value.targetHp) || !isFiniteNumber(value.recruitSerial)) return null;

  const targetHpMax = Math.max(1, Math.floor(value.targetHpMax));
  return {
    updatedAt: Math.max(0, value.updatedAt),
    coins: Math.max(0, Math.floor(value.coins)),
    baseHp: clamp(Math.floor(value.baseHp), 0, 100),
    chapter: Math.max(1, Math.floor(value.chapter)),
    encounterStep,
    targetHpMax,
    targetHp: clamp(Math.floor(value.targetHp), 0, targetHpMax),
    recruitSerial: Math.max(0, Math.floor(value.recruitSerial)),
    board
  };
}

function parseChaosPerks(value: unknown): readonly ChaosPerkId[] | null {
  if (!Array.isArray(value) || value.length > 2) return null;
  const perks: ChaosPerkId[] = [];
  for (const id of value) {
    if (!isChaosPerkId(id) || perks.includes(id)) return null;
    perks.push(id);
  }
  return perks;
}

function parseAnomalyHunt(value: unknown): AnomalyHuntState | null {
  if (!isRecord(value)) return null;
  if (!isFiniteNumber(value.charge) || !isFiniteNumber(value.secretPity)) return null;
  if (!isFiniteNumber(value.totalPulls) || !isFiniteNumber(value.secretsFound)) return null;

  const totalPulls = clamp(Math.floor(value.totalPulls), 0, 1_000_000_000);
  return {
    charge: clamp(Math.floor(value.charge), 0, ANOMALY_PITY_MAX - 1),
    secretPity: clamp(Math.floor(value.secretPity), 0, ANOMALY_SECRET_PITY_MAX - 1),
    totalPulls,
    secretsFound: clamp(Math.floor(value.secretsFound), 0, totalPulls)
  };
}

function parseMutationAlbum(value: unknown): MutationAlbumProgress | null {
  if (!isRecord(value) || !Array.isArray(value.discovered) || !Array.isArray(value.claimedMilestones)) return null;

  const discovered: MutationAlbumKey[] = [];
  for (const key of value.discovered) {
    if (!isMutationAlbumKey(key)) return null;
    if (!discovered.includes(key)) discovered.push(key);
  }

  const validTargets = MUTATION_ALBUM_MILESTONES.map((milestone) => milestone.target);
  const claimedMilestones: number[] = [];
  for (const target of value.claimedMilestones) {
    if (!isFiniteNumber(target) || !Number.isInteger(target) || !validTargets.includes(target)) return null;
    if (!claimedMilestones.includes(target)) claimedMilestones.push(target);
  }
  if (claimedMilestones.some((target) => target > discovered.length)) return null;

  return { discovered, claimedMilestones };
}

function parseWeeklyChaos(value: unknown): WeeklyChaosProgress | null {
  if (!isRecord(value)) return null;
  if (!isFiniteNumber(value.weekId) || !Number.isInteger(value.weekId) || value.weekId < 200001 || value.weekId > 999953) return null;
  if (typeof value.active !== 'boolean') return null;
  if (!isFiniteNumber(value.depth) || !isFiniteNumber(value.bestDepth) || !isFiniteNumber(value.runsStarted)) return null;
  if (!Array.isArray(value.claimedMilestones)) return null;

  const depth = clamp(Math.floor(value.depth), 0, WEEKLY_CHAOS_MAX_DEPTH);
  const bestDepth = clamp(Math.floor(value.bestDepth), 0, WEEKLY_CHAOS_MAX_DEPTH);
  const runsStarted = clamp(Math.floor(value.runsStarted), 0, 1_000_000);
  if (depth > bestDepth || (value.active && depth >= WEEKLY_CHAOS_MAX_DEPTH)) return null;

  const validTargets = WEEKLY_CHAOS_MILESTONES.map((milestone) => milestone.target);
  const claimedMilestones: number[] = [];
  for (const target of value.claimedMilestones) {
    if (!isFiniteNumber(target) || !Number.isInteger(target) || !validTargets.includes(target)) return null;
    if (!claimedMilestones.includes(target)) claimedMilestones.push(target);
  }
  if (claimedMilestones.some((target) => target > bestDepth)) return null;

  return {
    weekId: value.weekId,
    active: value.active,
    depth,
    bestDepth,
    runsStarted,
    claimedMilestones
  };
}

function parseCollection(value: unknown): CollectionProgress | null {
  if (!isRecord(value) || !Array.isArray(value.discovered) || !isRecord(value.stats) || !Array.isArray(value.claimedAchievements)) return null;
  const discovered: CollectionKey[] = [];
  for (const key of value.discovered) {
    if (!isCollectionKey(key)) return null;
    if (!discovered.includes(key)) discovered.push(key);
  }
  const claimedAchievements: AchievementId[] = [];
  for (const id of value.claimedAchievements) {
    if (!isAchievementId(id)) return null;
    if (!claimedAchievements.includes(id)) claimedAchievements.push(id);
  }
  const { merges, recruits, defeats, bosses, upgrades } = value.stats;
  if (!isFiniteNumber(merges) || !isFiniteNumber(recruits) || !isFiniteNumber(defeats) || !isFiniteNumber(bosses) || !isFiniteNumber(upgrades)) return null;
  return {
    discovered,
    stats: {
      merges: clamp(Math.floor(merges), 0, 1_000_000_000),
      recruits: clamp(Math.floor(recruits), 0, 1_000_000_000),
      defeats: clamp(Math.floor(defeats), 0, 1_000_000_000),
      bosses: clamp(Math.floor(bosses), 0, 1_000_000_000),
      upgrades: clamp(Math.floor(upgrades), 0, 1_000_000_000)
    },
    claimedAchievements
  };
}

function parseUpgrades(value: unknown): MetaUpgradeLevels | null {
  if (!isRecord(value)) return null;
  if (!isFiniteNumber(value.power) || !isFiniteNumber(value.armor) || !isFiniteNumber(value.bounty)) return null;
  return {
    power: clamp(Math.floor(value.power), 0, getMetaUpgradeDefinition('power').maxLevel),
    armor: clamp(Math.floor(value.armor), 0, getMetaUpgradeDefinition('armor').maxLevel),
    bounty: clamp(Math.floor(value.bounty), 0, getMetaUpgradeDefinition('bounty').maxLevel)
  };
}

function parseDaily(value: unknown): DailyRetentionState | null {
  if (!isRecord(value) || !isDayKey(value.dayKey) || !isFiniteNumber(value.streak)) return null;
  if (value.lastRewardClaimDayKey !== null && !isDayKey(value.lastRewardClaimDayKey)) return null;
  if (!isRecord(value.counters) || !isRecord(value.claimed)) return null;
  if (!isFiniteNumber(value.counters.merge) || !isFiniteNumber(value.counters.defeat) || !isFiniteNumber(value.counters.recruit)) return null;
  if (typeof value.claimed.merge !== 'boolean' || typeof value.claimed.defeat !== 'boolean' || typeof value.claimed.recruit !== 'boolean') return null;
  return {
    dayKey: value.dayKey,
    streak: clamp(Math.floor(value.streak), 0, 7),
    lastRewardClaimDayKey: value.lastRewardClaimDayKey,
    counters: {
      merge: clamp(Math.floor(value.counters.merge), 0, 10_000),
      defeat: clamp(Math.floor(value.counters.defeat), 0, 10_000),
      recruit: clamp(Math.floor(value.counters.recruit), 0, 10_000)
    },
    claimed: {
      merge: value.claimed.merge,
      defeat: value.claimed.defeat,
      recruit: value.claimed.recruit
    }
  };
}

function cloneCollection(collection: CollectionProgress): CollectionProgress {
  return {
    discovered: [...collection.discovered],
    stats: { ...collection.stats },
    claimedAchievements: [...collection.claimedAchievements]
  };
}

function cloneDaily(daily: DailyRetentionState): DailyRetentionState {
  return {
    ...daily,
    counters: { ...daily.counters },
    claimed: { ...daily.claimed }
  };
}

function cloneOnboarding(onboarding: OnboardingState): OnboardingState {
  return { step: onboarding.step, completedAt: onboarding.completedAt };
}

function cloneAnomalyHunt(anomalyHunt: AnomalyHuntState): AnomalyHuntState {
  return { ...anomalyHunt };
}

function cloneMutationAlbum(mutationAlbum: MutationAlbumProgress): MutationAlbumProgress {
  return {
    discovered: [...mutationAlbum.discovered],
    claimedMilestones: [...mutationAlbum.claimedMilestones]
  };
}

function cloneWeeklyChaos(weeklyChaos: WeeklyChaosProgress): WeeklyChaosProgress {
  return {
    ...weeklyChaos,
    claimedMilestones: [...weeklyChaos.claimedMilestones]
  };
}

function parseCurrentBoard(value: unknown): BoardState | null {
  return parseBoard(value, true);
}

function parseLegacyCompatibleBoard(value: unknown): BoardState | null {
  return parseBoard(value, false);
}

function parseBoard(value: unknown, requireMutation: boolean): BoardState | null {
  if (!Array.isArray(value) || value.length !== 12) return null;
  const board: Array<BoardUnit | null> = [];
  for (const slot of value) {
    if (slot === null) {
      board.push(null);
      continue;
    }
    const parsed = parseBoardUnit(slot, requireMutation);
    if (!parsed) return null;
    board.push(parsed);
  }
  return board;
}

function parseBoardUnit(value: unknown, requireMutation: boolean): BoardUnit | null {
  if (!isRecord(value) || typeof value.id !== 'string' || value.id.length === 0 || value.id.length > 160) return null;
  if (!isCreatureFamily(value.family)) return null;
  if (value.level !== 1 && value.level !== 2 && value.level !== 3) return null;
  if (requireMutation && !isMutationId(value.mutation)) return null;
  if (value.mutation !== undefined && !isMutationId(value.mutation)) return null;
  return {
    id: value.id,
    family: value.family,
    level: value.level,
    mutation: isMutationId(value.mutation) ? value.mutation : 'none'
  };
}

function cloneBoard(board: BoardState): BoardState {
  return board.map((unit) => (unit ? { ...unit } : null));
}

function parseLegacyEncounterStep(value: unknown): EncounterStep | null {
  return value === 0 || value === 1 || value === 2 || value === 3 ? value : null;
}

function parseCurrentEncounterStep(value: unknown): EncounterStep | null {
  return value === 0 || value === 1 || value === 2 || value === 3 || value === 4 || value === 5 ? value : null;
}

function isDayKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00.000Z`));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
