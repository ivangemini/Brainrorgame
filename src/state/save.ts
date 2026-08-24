import type { PlatformAdapter } from '../platform/PlatformAdapter';
import type { BoardState, BoardUnit } from '../systems/board';

export const SAVE_VERSION = 1 as const;

export interface GameSaveV1 {
  readonly version: typeof SAVE_VERSION;
  readonly updatedAt: number;
  readonly coins: number;
  readonly baseHp: number;
  readonly bossRound: number;
  readonly bossHpMax: number;
  readonly bossHp: number;
  readonly recruitSerial: number;
  readonly board: BoardState;
}

export interface GameSaveSnapshot {
  readonly coins: number;
  readonly baseHp: number;
  readonly bossRound: number;
  readonly bossHpMax: number;
  readonly bossHp: number;
  readonly recruitSerial: number;
  readonly board: BoardState;
}

export function createGameSave(snapshot: GameSaveSnapshot, now = Date.now()): GameSaveV1 {
  return {
    version: SAVE_VERSION,
    updatedAt: now,
    coins: snapshot.coins,
    baseHp: snapshot.baseHp,
    bossRound: snapshot.bossRound,
    bossHpMax: snapshot.bossHpMax,
    bossHp: snapshot.bossHp,
    recruitSerial: snapshot.recruitSerial,
    board: snapshot.board.map((unit) => (unit ? { ...unit } : null))
  };
}

export async function loadGameSave(platform: PlatformAdapter): Promise<GameSaveV1 | null> {
  try {
    const raw = await platform.loadSave<unknown>();
    return parseGameSave(raw);
  } catch {
    return null;
  }
}

export function parseGameSave(value: unknown): GameSaveV1 | null {
  if (!isRecord(value) || value.version !== SAVE_VERSION) return null;
  if (!isFiniteNumber(value.updatedAt) || !isFiniteNumber(value.coins) || !isFiniteNumber(value.baseHp)) return null;
  if (!isFiniteNumber(value.bossRound) || !isFiniteNumber(value.bossHpMax) || !isFiniteNumber(value.bossHp)) return null;
  if (!isFiniteNumber(value.recruitSerial) || !Array.isArray(value.board) || value.board.length !== 12) return null;

  const board: Array<BoardUnit | null> = [];
  for (const slot of value.board) {
    if (slot === null) {
      board.push(null);
      continue;
    }
    if (!isBoardUnit(slot)) return null;
    board.push({ id: slot.id, family: slot.family, level: slot.level });
  }

  const bossHpMax = Math.max(1, Math.floor(value.bossHpMax));
  return {
    version: SAVE_VERSION,
    updatedAt: Math.max(0, value.updatedAt),
    coins: Math.max(0, Math.floor(value.coins)),
    baseHp: clamp(Math.floor(value.baseHp), 0, 100),
    bossRound: Math.max(1, Math.floor(value.bossRound)),
    bossHpMax,
    bossHp: clamp(Math.floor(value.bossHp), 0, bossHpMax),
    recruitSerial: Math.max(0, Math.floor(value.recruitSerial)),
    board
  };
}

function isBoardUnit(value: unknown): value is BoardUnit {
  if (!isRecord(value) || typeof value.id !== 'string' || value.id.length === 0 || value.id.length > 160) return false;
  if (value.family !== 'pinguino' && value.family !== 'toastodilo') return false;
  return value.level === 1 || value.level === 2 || value.level === 3;
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
