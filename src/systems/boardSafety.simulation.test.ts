import { describe, expect, it } from 'vitest';
import { CREATURE_FAMILIES } from '../content/creatures';
import { MUTATION_IDS } from '../content/mutations';
import {
  addUnit,
  canBoardUnitsMerge,
  createStarterBoard,
  firstEmptySlot,
  isBoardDeadlocked,
  moveOrMerge,
  type BoardState
} from './board';
import { planRecruit } from './recruitPlanner';

function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function firstMergePair(board: BoardState): readonly [number, number] | null {
  for (let first = 0; first < board.length; first += 1) {
    const a = board[first];
    if (!a) continue;
    for (let second = first + 1; second < board.length; second += 1) {
      const b = board[second];
      if (b && canBoardUnitsMerge(a, b)) return [first, second];
    }
  }
  return null;
}

describe('board safety simulation', () => {
  it('never produces a full deadlock through 5000 recruit/merge decisions', () => {
    const random = createRandom(0xBADA55);
    let board = createStarterBoard();
    let serial = 0;

    for (let turn = 0; turn < 5000; turn += 1) {
      expect(isBoardDeadlocked(board), `deadlock before turn ${turn}`).toBe(false);
      const pair = firstMergePair(board);
      const full = firstEmptySlot(board) < 0;
      const shouldMerge = full || (pair !== null && random() < 0.38);

      if (shouldMerge && pair) {
        const result = moveOrMerge(board, pair[0], pair[1]);
        expect(result.action, `merge action at turn ${turn}`).toBe('merge');
        board = result.board;
      } else {
        const plan = planRecruit(board, CREATURE_FAMILIES, random());
        expect(plan, `recruit plan at turn ${turn}`).not.toBeNull();
        serial += 1;
        const mutation = MUTATION_IDS[Math.floor(random() * MUTATION_IDS.length)] ?? 'none';
        board = addUnit(board, {
          id: `sim-${serial}-${plan!.family}-${plan!.level}`,
          family: plan!.family,
          level: plan!.level,
          mutation
        });
      }

      expect(isBoardDeadlocked(board), `deadlock after turn ${turn}`).toBe(false);
    }
  });

  it('keeps the full-board invariant across several independent deterministic seeds', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const random = createRandom(seed * 7919);
      let board = createStarterBoard();
      let serial = 0;

      for (let turn = 0; turn < 300; turn += 1) {
        const pair = firstMergePair(board);
        if (firstEmptySlot(board) < 0) {
          expect(pair, `seed ${seed} full turn ${turn}`).not.toBeNull();
          board = moveOrMerge(board, pair![0], pair![1]).board;
          continue;
        }

        if (pair && random() < 0.45) {
          board = moveOrMerge(board, pair[0], pair[1]).board;
          continue;
        }

        const plan = planRecruit(board, CREATURE_FAMILIES, random());
        expect(plan, `seed ${seed} turn ${turn}`).not.toBeNull();
        serial += 1;
        board = addUnit(board, {
          id: `seed-${seed}-${serial}`,
          family: plan!.family,
          level: plan!.level,
          mutation: MUTATION_IDS[Math.floor(random() * MUTATION_IDS.length)] ?? 'none'
        });
        expect(isBoardDeadlocked(board), `seed ${seed} turn ${turn}`).toBe(false);
      }
    }
  });
});
