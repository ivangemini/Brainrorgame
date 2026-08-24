import type { PlatformAdapter } from '../platform/PlatformAdapter';
import type { BoardState, BoardUnit } from '../systems/board';
import type { EncounterStep } from '../systems/encounters';
import {
  createDefaultMetaUpgradeLevels,
  getMetaUpgradeDefinition,
  type MetaUpgradeLevels
} from '../systems/metaProgression';

export const SAVE_VERSION = 3 as const;

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

export interface GameSaveV3 {
  readonly version: typeof SAVE_VERSION;
  readonly updatedAt: number;
  readonly coins: number;
  readonly coreShards: number;
  readonly upgrades: MetaUpgradeLevels;
  readonly baseHp: number;
  readonly chapter: number;
  readonly encounterStep: EncounterStep;
  readonly targetHpMax: number;
  readonly targetHp: number;
  readonly recruitSerial: number;
  readonly board: BoardState;
}

export type GameSave = GameSaveV3;

export interface GameSaveSnapshot {
  readonly coins: number;
  readonly coreShards: number;
  readonly upgrades: MetaUpgradeLevels;
  readonly baseHp: number;
  readonly chapter: number;
  readonly encounterStep: EncounterStep;
  readonly targetHpMax: number;
  readonly targetHp: number;
  readonly recruitSerial: number;
  readonly board: BoardState;
}

export function createGameSave(snapshot: GameSaveSnapshot, now = Date.now()): GameSaveV3 {
  return {
    version: SAVE_VERSION,
    updatedAt: now,
    coins: snapshot.coins,
    coreShards: snapshot.coreShards,
    upgrades: { ...snapshot.upgrades },
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
    return v2 ? migrateV2ToV3(v2) : null;
  }
  if (value.version === 2) return migrateV2ToV3(value);
  if (value.version !== SAVE_VERSION) return null;

  const common = parseV2Fields(value);
  const upgrades = parseUpgrades(value.upgrades);
  if (!common || !upgrades || !isFiniteNumber(value.coreShards)) return null;
  return {
    version: SAVE_VERSION,
    ...common,
    coreShards: clamp(Math.floor(value.coreShards), 0, 1_000_000),
    upgrades
  };
}

function migrateV2ToV3(value: Record<string, unknown>): GameSaveV3 | null {
  const common = parseV2Fields(value);
  if (!common) return null;
  return {
    version: SAVE_VERSION,
    ...common,
    coreShards: Math.max(0, common.chapter - 1),
    upgrades: createDefaultMetaUpgradeLevels()
  };
}

function migrateV1ToV2(value: Record<string, unknown>): Record<string, unknown> | null {
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

function parseV2Fields(value: Record<string, unknown>): Omit<GameSaveV3, 'version' | 'coreShards' | 'upgrades'> | null {
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

function parseUpgrades(value: unknown): MetaUpgradeLevels | null {
  if (!isRecord(value)) return null;
  if (!isFiniteNumber(value.power) || !isFiniteNumber(value.armor) || !isFiniteNumber(value.bounty)) return null;
  return {
    power: clamp(Math.floor(value.power), 0, getMetaUpgradeDefinition('power').maxLevel),
    armor: clamp(Math.floor(value.armor), 0, getMetaUpgradeDefinition('armor').maxLevel),
    bounty: clamp(Math.floor(value.bounty), 0, getMetaUpgradeDefinition('bounty').maxLevel)
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
