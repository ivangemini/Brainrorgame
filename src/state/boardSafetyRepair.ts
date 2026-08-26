import type { CreatureLevel } from '../content/creatures';
import {
  canBoardUnitsMerge,
  isBoardDeadlocked,
  type BoardState,
  type BoardUnit
} from '../systems/board';
import {
  discoverCreature,
  type CollectionKey
} from '../systems/collectionProgression';
import { discoverMutationAlbumEntry } from '../systems/mutationAlbum';
import type { GameSave } from './save';

export interface BoardSafetyRepairResult {
  readonly save: GameSave | null;
  readonly repaired: boolean;
  readonly promotedSlot: number | null;
  readonly partnerSlot: number | null;
}

interface RescuePair {
  readonly lowerSlot: number;
  readonly higherSlot: number;
  readonly targetLevel: CreatureLevel;
  readonly gap: number;
}

/**
 * Repairs only historical/corrupt saves that are already completely full and
 * have no legal same-family + same-level merge. Normal gameplay should never
 * reach this path because Recruit protects the last free slot.
 *
 * With 15 slots and 12 creature families, a valid full board necessarily has
 * at least one repeated family. We promote the lower-level member of the best
 * repeated-family pair to its partner's level. That creates a normal legal
 * merge without ever allowing cross-family fusion or deleting a creature.
 */
export function repairDeadlockedGameSave(
  save: GameSave | null,
  now = Date.now()
): BoardSafetyRepairResult {
  if (!save || !isBoardDeadlocked(save.board)) {
    return { save, repaired: false, promotedSlot: null, partnerSlot: null };
  }

  const rescue = findBestRescuePair(save.board);
  if (!rescue) {
    return { save, repaired: false, promotedSlot: null, partnerSlot: null };
  }

  const source = save.board[rescue.lowerSlot];
  const partner = save.board[rescue.higherSlot];
  if (!source || !partner) {
    return { save, repaired: false, promotedSlot: null, partnerSlot: null };
  }

  const promoted: BoardUnit = { ...source, level: rescue.targetLevel };
  const board = [...save.board];
  board[rescue.lowerSlot] = promoted;
  if (!canBoardUnitsMerge(promoted, partner)) {
    return { save, repaired: false, promotedSlot: null, partnerSlot: null };
  }

  const collectionKey = `${promoted.family}-${promoted.level}` as CollectionKey;
  const collection = discoverCreature(save.collection, collectionKey);
  const mutationAlbum = discoverMutationAlbumEntry(
    save.mutationAlbum,
    collectionKey,
    promoted.mutation
  );
  const repairedSave: GameSave = {
    ...save,
    updatedAt: Math.max(now, save.updatedAt + 1),
    board,
    collection,
    mutationAlbum
  };

  return {
    save: repairedSave,
    repaired: true,
    promotedSlot: rescue.lowerSlot,
    partnerSlot: rescue.higherSlot
  };
}

function findBestRescuePair(board: BoardState): RescuePair | null {
  let best: RescuePair | null = null;

  for (let first = 0; first < board.length; first += 1) {
    const a = board[first];
    if (!a) continue;
    for (let second = first + 1; second < board.length; second += 1) {
      const b = board[second];
      if (!b || a.family !== b.family || a.level === b.level) continue;

      const aLower = a.level < b.level;
      const lowerSlot = aLower ? first : second;
      const higherSlot = aLower ? second : first;
      const targetLevel = Math.max(a.level, b.level) as CreatureLevel;
      const gap = Math.abs(a.level - b.level);
      const candidate: RescuePair = { lowerSlot, higherSlot, targetLevel, gap };

      if (!best || candidate.gap < best.gap) best = candidate;
    }
  }

  return best;
}
