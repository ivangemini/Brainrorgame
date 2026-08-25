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
import {
  isChaosPerkId,
  type ChaosPerkId
} from '../systems/chaosDraft';
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
  createCompletedOnboardingState,
  isValidOnboardingState,
  type OnboardingState
} from '../systems/onboarding';

export const SAVE_VERSION = 10 as const;

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
  readonly version: typeof SAVE_VERSION;
  readonly anomalyHunt: AnomalyHuntState;
}

export type GameSave = GameSaveV10;

export interface GameSaveSnapshot {
  readonly coins: number;
  readonly coreShards: number;
  readonly upgrades: MetaUpgradeLevels;
  readonly daily: DailyRetentionState;
  readonly collection: CollectionProgress;
  readonly onboarding: OnboardingState;
  readonly anomalyHunt: AnomalyHuntState;
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

export function createGameSave(snapshot: GameSaveSnapshot, now = Date.now()): GameSaveV10 {
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
  if (!isRecord(value)) return null;

  if (value.version === 1) {
    const v2 = migrateV1ToV2(value);
    const v3 = v2 ? migrateV2ToV3(v2) : null;
    const v4 = v3 ? migrateV3ToV4(v3) : null;
    const v5 = v4 ? migrateV4ToV5(v4) : null;
    const v6 = v5 ? migrateV5ToV6(v5) : null;
    const v7 = v6 ? migrateV6ToV7(v6) : null;
    const v8 = v7 ? migrateV7ToV8(v7) : null;
    const v9 = v8 ? migrateV8ToV9(v8) : null;
    return v9 ? migrateV9ToV10(v9) : null;
  }
  if (value.version === 2) {
    const v3 = migrateV2ToV3(value);
    const v4 = v3 ? migrateV3ToV4(v3) : null;
    const v5 = v4 ? migrateV4ToV5(v4) : null;
    const v6 = v5 ? migrateV5ToV6(v5) : null;
    const v7 = v6 ? migrateV6ToV7(v6) : null;
    const v8 = v7 ? migrateV7ToV8(v7) : null;
    const v9 = v8 ? migrateV8ToV9(v8) : null;
    return v9 ? migrateV9ToV10(v9) : null;
  }
  if (value.version === 3) {
    const v4 = migrateV3ToV4(value);
    const v5 = v4 ? migrateV4ToV5(v4) : null;
    const v6 = v5 ? migrateV5ToV6(v5) : null;
    const v7 = v6 ? migrateV6ToV7(v6) : null;
    const v8 = v7 ? migrateV7ToV8(v7) : null;
    const v9 = v8 ? migrateV8ToV9(v8) : null;
    return v9 ? migrateV9ToV10(v9) : null;
  }
  if (value.version === 4) {
    const v5 = migrateV4ToV5(value);
    const v6 = v5 ? migrateV5ToV6(v5) : null;
    const v7 = v6 ? migrateV6ToV7(v6) : null;
    const v8 = v7 ? migrateV7ToV8(v7) : null;
    const v9 = v8 ? migrateV8ToV9(v8) : null;
    return v9 ? migrateV9ToV10(v9) : null;
  }
  if (value.version === 5) {
    const v6 = migrateV5ToV6(value);
    const v7 = v6 ? migrateV6ToV7(v6) : null;
    const v8 = v7 ? migrateV7ToV8(v7) : null;
    const v9 = v8 ? migrateV8ToV9(v8) : null;
    return v9 ? migrateV9ToV10(v9) : null;
  }
  if (value.version === 6) {
    const v7 = migrateV6ToV7(value);
    const v8 = v7 ? migrateV7ToV8(v7) : null;
    const v9 = v8 ? migrateV8ToV9(v8) : null;
    return v9 ? migrateV9ToV10(v9) : null;
  }
  if (value.version === 7) {
    const v8 = migrateV7ToV8(value);
    const v9 = v8 ? migrateV8ToV9(v8) : null;
    return v9 ? migrateV9ToV10(v9) : null;
  }
  if (value.version === 8) {
    const v9 = migrateV8ToV9(value);
    return v9 ? migrateV9ToV10(v9) : null;
  }
  if (value.version === 9) return migrateV9ToV10(value);
  if (value.version !== SAVE_VERSION) return null;

  const v5 = parseV5Fields(value, parseCurrentBoard, parseCurrentEncounterStep);
  const chaosPerks = parseChaosPerks(value.chaosPerks);
  const anomalyHunt = parseAnomalyHunt(value.anomalyHunt);
  if (!v5 || !chaosPerks || !anomalyHunt || !isValidOnboardingState(value.onboarding)) return null;
  return {
    version: SAVE_VERSION,
    ...v5,
    onboarding: cloneOnboarding(value.onboarding),
    chaosPerks,
    anomalyHunt
  };
}

function migrateV9ToV10(value: unknown): GameSaveV10 | null {
  if (!isRecord(value)) return null;
  const v5 = parseV5Fields(value, parseCurrentBoard, parseCurrentEncounterStep);
  const chaosPerks = parseChaosPerks(value.chaosPerks);
  if (!v5 || !chaosPerks || !isValidOnboardingState(value.onboarding)) return null;
  return {
    version: SAVE_VERSION,
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
