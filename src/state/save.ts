import type { PlatformAdapter } from '../platform/PlatformAdapter';
import type { BoardState, BoardUnit } from '../systems/board';
import {
  backfillCollectionProgress,
  isAchievementId,
  isCollectionKey,
  type AchievementId,
  type CollectionKey,
  type CollectionProgress
} from '../systems/collectionProgression';
import {
  createDefaultDailyState,
  type DailyRetentionState
} from '../systems/dailyRetention';
import type { EncounterStep } from '../systems/encounters';
import {
  createDefaultMetaUpgradeLevels,
  getMetaUpgradeDefinition,
  type MetaUpgradeLevels
} from '../systems/metaProgression';

export const SAVE_VERSION = 5 as const;

export interface GameSaveV1 {
  readonly version: 1;
  readonly updatedAt: number;
  readonly coins: number;
  readonly baseHp: number;
  readonly bossRound: number;
  readonly bossHpMax: number;
  readonly bossHp: number;
  readonly recruitSerial: number;
  readonly board: BoardState;
}

export interface GameSaveV2 {
  readonly version: 2;
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

export interface GameSaveV3 extends GameSaveV2 {
  readonly version: 3;
  readonly coreShards: number;
  readonly upgrades: MetaUpgradeLevels;
}

export interface GameSaveV4 extends GameSaveV3 {
  readonly version: 4;
  readonly daily: DailyRetentionState;
}

export interface GameSaveV5 extends Omit<GameSaveV4, 'version'> {
  readonly version: typeof SAVE_VERSION;
  readonly collection: CollectionProgress;
}

export type GameSave = GameSaveV5;

export interface GameSaveSnapshot {
  readonly coins: number;
  readonly coreShards: number;
  readonly upgrades: MetaUpgradeLevels;
  readonly daily: DailyRetentionState;
  readonly collection: CollectionProgress;
  readonly baseHp: number;
  readonly chapter: number;
  readonly encounterStep: EncounterStep;
  readonly targetHpMax: number;
  readonly targetHp: number;
  readonly recruitSerial: number;
  readonly board: BoardState;
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

export function createGameSave(snapshot: GameSaveSnapshot, now = Date.now()): GameSaveV5 {
  return {
    version: SAVE_VERSION,
    updatedAt: now,
    coins: snapshot.coins,
    coreShards: snapshot.coreShards,
    upgrades: { ...snapshot.upgrades },
    daily: cloneDaily(snapshot.daily),
    collection: cloneCollection(snapshot.collection),
    baseHp: snapshot.baseHp,
    chapter: snapshot.chapter,
    encounterStep: snapshot.encounterStep,
    targetHpMax: snapshot.targetHpMax,
    targetHp: snapshot.targetHp,
    recruitSerial: snapshot.recruitSerial,
    board: cloneBoard(snapshot.board)
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
    return v4 ? migrateV4ToV5(v4) : null;
  }
  if (value.version === 2) {
    const v3 = migrateV2ToV3(value);
    const v4 = v3 ? migrateV3ToV4(v3) : null;
    return v4 ? migrateV4ToV5(v4) : null;
  }
  if (value.version === 3) {
    const v4 = migrateV3ToV4(value);
    return v4 ? migrateV4ToV5(v4) : null;
  }
  if (value.version === 4) return migrateV4ToV5(value);
  if (value.version !== SAVE_VERSION) return null;

  const v4 = parseV4Fields(value);
  const collection = parseCollection(value.collection);
  if (!v4 || !collection) return null;
  return { version: SAVE_VERSION, ...v4, collection };
}

function migrateV4ToV5(value: unknown): GameSaveV5 | null {
  if (!isRecord(value)) return null;
  const v4 = parseV4Fields(value);
  if (!v4) return null;
  const collection = backfillCollectionProgress(
    v4.board,
    v4.chapter,
    v4.encounterStep,
    v4.recruitSerial,
    v4.upgrades
  );
  return { version: SAVE_VERSION, ...v4, collection };
}

function migrateV3ToV4(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const common = parseCommonFields(value);
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
  const common = parseCommonFields(value);
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
  const board = parseBoard(value.board);
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

function parseV4Fields(value: Record<string, unknown>): V4ProgressFields | null {
  const common = parseCommonFields(value);
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

function parseCommonFields(value: Record<string, unknown>): CommonProgressFields | null {
  const board = parseBoard(value.board);
  if (!board) return null;
  if (!isFiniteNumber(value.updatedAt) || !isFiniteNumber(value.coins) || !isFiniteNumber(value.baseHp)) return null;
  if (!isFiniteNumber(value.chapter) || !isEncounterStep(value.encounterStep)) return null;
  if (!isFiniteNumber(value.targetHpMax) || !isFiniteNumber(value.targetHp) || !isFiniteNumber(value.recruitSerial)) return null;

  const targetHpMax = Math.max(1, Math.floor(value.targetHpMax));
  return {
    updatedAt: Math.max(0, value.updatedAt),
    coins: Math.max(0, Math.floor(value.coins)),
    baseHp: clamp(Math.floor(value.baseHp), 0, 100),
    chapter: Math.max(1, Math.floor(value.chapter)),
    encounterStep: value.encounterStep,
    targetHpMax,
    targetHp: clamp(Math.floor(value.targetHp), 0, targetHpMax),
    recruitSerial: Math.max(0, Math.floor(value.recruitSerial)),
    board
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

function parseBoard(value: unknown): BoardState | null {
  if (!Array.isArray(value) || value.length !== 12) return null;
  const board: Array<BoardUnit | null> = [];
  for (const slot of value) {
    if (slot === null) {
      board.push(null);
      continue;
    }
    if (!isBoardUnit(slot)) return null;
    board.push({ id: slot.id, family: slot.family, level: slot.level });
  }
  return board;
}

function cloneBoard(board: BoardState): BoardState {
  return board.map((unit) => (unit ? { ...unit } : null));
}

function isBoardUnit(value: unknown): value is BoardUnit {
  if (!isRecord(value) || typeof value.id !== 'string' || value.id.length === 0 || value.id.length > 160) return false;
  if (value.family !== 'pinguino' && value.family !== 'toastodilo') return false;
  return value.level === 1 || value.level === 2 || value.level === 3;
}

function isEncounterStep(value: unknown): value is EncounterStep {
  return value === 0 || value === 1 || value === 2 || value === 3;
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
