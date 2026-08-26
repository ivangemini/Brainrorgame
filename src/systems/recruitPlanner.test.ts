import { describe, expect, it } from 'vitest';
import {
  addUnit,
  BOARD_SIZE,
  hasMergeablePair,
  type BoardState,
  type BoardUnit
} from './board';
import { planRecruit } from './recruitPlanner';

function unit(id: string, family: BoardUnit['family'], level: BoardUnit['level']): BoardUnit {
  return { id, family, level, mutation: 'none' };
}

function oneEmptyWithoutMerge(): BoardState {
  return [
    unit('p2', 'pinguino', 2),
    unit('t1', 'toastodilo', 1),
    unit('l2', 'lampalotl', 2),
    unit('d1', 'dishnail', 1),
    unit('m2', 'mochimoth', 2),
    unit('r1', 'routeraptor', 1),
    unit('v2', 'vendinguana', 2),
    unit('u1', 'umbrellama', 1),
    unit('o2', 'mopossum', 2),
    unit('f1', 'fanthom', 1),
    unit('s2', 'socktopus', 2),
    unit('w1', 'microwhale', 1),
    unit('p3', 'pinguino', 3),
    unit('t2', 'toastodilo', 2),
    null
  ];
}

describe('recruit planner', () => {
  it('uses normal tier-one recruits while the board has breathing room', () => {
    const board: Array<BoardUnit | null> = Array.from({ length: BOARD_SIZE }, () => null);
    board[0] = unit('p1', 'pinguino', 1);
    const plan = planRecruit(board, ['pinguino', 'toastodilo'], 0);
    expect(plan).toMatchObject({ level: 1, protectedPair: false });
  });

  it('protects the final slot by creating a legal same-family same-level twin', () => {
    const board = oneEmptyWithoutMerge();
    expect(hasMergeablePair(board)).toBe(false);
    const plan = planRecruit(board, ['pinguino', 'toastodilo', 'lampalotl', 'dishnail'], 0.9);
    expect(plan).not.toBeNull();
    expect(plan?.protectedPair).toBe(true);

    const next = addUnit(board, unit('safe-recruit', plan!.family, plan!.level));
    expect(next.filter(Boolean)).toHaveLength(BOARD_SIZE);
    expect(hasMergeablePair(next)).toBe(true);
  });

  it('can protect the final slot with a tier-two twin when no tier-one rescue is available', () => {
    const board: BoardState = [
      unit('p2', 'pinguino', 2), unit('t2', 'toastodilo', 2), unit('l2', 'lampalotl', 2),
      unit('d2', 'dishnail', 2), unit('m2', 'mochimoth', 2), unit('r2', 'routeraptor', 2),
      unit('v2', 'vendinguana', 2), unit('u2', 'umbrellama', 2), unit('o2', 'mopossum', 2),
      unit('f2', 'fanthom', 2), unit('s2', 'socktopus', 2), unit('w2', 'microwhale', 2),
      unit('p3', 'pinguino', 3), unit('t3', 'toastodilo', 3), null
    ];
    const plan = planRecruit(board, ['pinguino', 'toastodilo', 'lampalotl', 'dishnail'], 0.4);
    expect(plan).toMatchObject({ level: 2, protectedPair: true });
  });

  it('returns null rather than inventing an illegal fusion when only capped tier-three units can be copied', () => {
    const families: BoardUnit['family'][] = [
      'pinguino', 'toastodilo', 'lampalotl', 'dishnail', 'mochimoth', 'routeraptor',
      'vendinguana', 'umbrellama', 'mopossum', 'fanthom', 'socktopus', 'microwhale'
    ];
    const board: BoardState = [
      ...families.map((family, index) => ({ id: `t3-${index}`, family, level: 3 as const, mutation: 'crowned' as const })),
      unit('p3b', 'pinguino', 3), unit('t3b', 'toastodilo', 3), null
    ];
    expect(planRecruit(board, families, 0.5)).toBeNull();
  });

  it('does not plan a recruit when the board is already full', () => {
    const board = oneEmptyWithoutMerge().map((slot, index) => slot ?? unit(`fill-${index}`, 'dishnail', 3));
    expect(planRecruit(board, ['pinguino', 'toastodilo'], 0.2)).toBeNull();
  });
});
