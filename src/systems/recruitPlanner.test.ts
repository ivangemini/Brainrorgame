import { describe, expect, it } from 'vitest';
import {
  addUnit,
  BOARD_SIZE,
  hasMergeablePair,
  type BoardState,
  type BoardUnit
} from './board';
import { planRecruit, recruitFamilyWeight } from './recruitPlanner';

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

const ALL_FAMILIES: readonly BoardUnit['family'][] = [
  'pinguino', 'toastodilo', 'lampalotl', 'dishnail', 'mochimoth', 'routeraptor',
  'vendinguana', 'umbrellama', 'mopossum', 'fanthom', 'socktopus', 'microwhale'
];

describe('recruit planner', () => {
  it('uses normal tier-one recruits while the board has breathing room', () => {
    const board: Array<BoardUnit | null> = Array.from({ length: BOARD_SIZE }, () => null);
    board[0] = unit('p1', 'pinguino', 1);
    const plan = planRecruit(board, ['pinguino', 'toastodilo'], 0);
    expect(plan).toMatchObject({ level: 1, protectedPair: false });
  });

  it('strongly favors a family where the next recruit creates an immediate pair', () => {
    const board: BoardState = [
      unit('p1', 'pinguino', 1),
      unit('t5', 'toastodilo', 5),
      ...Array.from({ length: BOARD_SIZE - 2 }, () => null)
    ];
    expect(recruitFamilyWeight(board, 'pinguino')).toBeGreaterThan(recruitFamilyWeight(board, 'toastodilo'));
  });

  it('favors a recruit that can trigger a multi-tier merge cascade', () => {
    const board: BoardState = [
      unit('p1', 'pinguino', 1),
      unit('p2', 'pinguino', 2),
      unit('p3', 'pinguino', 3),
      unit('p4', 'pinguino', 4),
      unit('t1', 'toastodilo', 1),
      ...Array.from({ length: BOARD_SIZE - 5 }, () => null)
    ];
    expect(recruitFamilyWeight(board, 'pinguino')).toBeGreaterThan(recruitFamilyWeight(board, 'toastodilo'));
  });

  it('downweights a family represented only by max-tier creatures without banning it', () => {
    const board: BoardState = [
      unit('p5a', 'pinguino', 5),
      unit('p5b', 'pinguino', 5),
      unit('t1', 'toastodilo', 1),
      ...Array.from({ length: BOARD_SIZE - 3 }, () => null)
    ];
    const maxedWeight = recruitFamilyWeight(board, 'pinguino');
    const usefulWeight = recruitFamilyWeight(board, 'toastodilo');
    expect(maxedWeight).toBeGreaterThan(0);
    expect(maxedWeight).toBeLessThan(usefulWeight);
  });

  it('avoids opening brand-new lineages when only a few cells remain', () => {
    const board: Array<BoardUnit | null> = [
      unit('p1', 'pinguino', 1),
      unit('t2', 'toastodilo', 2),
      unit('l3', 'lampalotl', 3),
      unit('d2', 'dishnail', 2),
      unit('m4', 'mochimoth', 4),
      unit('r2', 'routeraptor', 2),
      unit('v5', 'vendinguana', 5),
      unit('u2', 'umbrellama', 2),
      unit('o4', 'mopossum', 4),
      unit('f2', 'fanthom', 2),
      unit('s5', 'socktopus', 5),
      null, null, null, null
    ];
    expect(recruitFamilyWeight(board, 'pinguino')).toBeGreaterThan(recruitFamilyWeight(board, 'microwhale'));
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

  it('protects the final slot for every deterministic recruit roll', () => {
    const board = oneEmptyWithoutMerge();
    for (let index = 0; index < 100; index += 1) {
      const roll = index / 100;
      const plan = planRecruit(board, ALL_FAMILIES, roll);
      expect(plan, `roll ${roll}`).not.toBeNull();
      expect(plan?.protectedPair, `roll ${roll}`).toBe(true);
      const next = addUnit(board, unit(`safe-${index}`, plan!.family, plan!.level));
      expect(hasMergeablePair(next), `roll ${roll}`).toBe(true);
    }
  });

  it('keeps the emergency final-slot rescue available even if the normal unlock pool is stale', () => {
    const board = oneEmptyWithoutMerge();
    const plan = planRecruit(board, [], 0.5);
    expect(plan).toMatchObject({ protectedPair: true });
    const next = addUnit(board, unit('unlock-drift-rescue', plan!.family, plan!.level));
    expect(hasMergeablePair(next)).toBe(true);
  });

  it('can protect the final slot with a tier-four twin when no lower rescue is available', () => {
    const board: BoardState = [
      unit('p4', 'pinguino', 4), unit('t4', 'toastodilo', 4), unit('l4', 'lampalotl', 4),
      unit('d4', 'dishnail', 4), unit('m4', 'mochimoth', 4), unit('r4', 'routeraptor', 4),
      unit('v4', 'vendinguana', 4), unit('u4', 'umbrellama', 4), unit('o4', 'mopossum', 4),
      unit('f4', 'fanthom', 4), unit('s4', 'socktopus', 4), unit('w4', 'microwhale', 4),
      unit('p5', 'pinguino', 5), unit('t5', 'toastodilo', 5), null
    ];
    const plan = planRecruit(board, ALL_FAMILIES, 0.4);
    expect(plan).toMatchObject({ level: 4, protectedPair: true });
  });

  it('recognizes that a crowded max-tier board already has a legal same-family consolidation', () => {
    const board: BoardState = [
      ...ALL_FAMILIES.map((family, index) => ({ id: `t5-${index}`, family, level: 5 as const, mutation: 'crowned' as const })),
      { id: 'p5b', family: 'pinguino', level: 5, mutation: 'prismatic' },
      { id: 't5b', family: 'toastodilo', level: 5, mutation: 'charged' },
      null
    ];
    expect(hasMergeablePair(board)).toBe(true);
    expect(planRecruit(board, ALL_FAMILIES, 0.5)).toMatchObject({ level: 1, protectedPair: false });
  });

  it('does not plan a recruit when the board is already full', () => {
    const board = oneEmptyWithoutMerge().map((slot, index) => slot ?? unit(`fill-${index}`, 'dishnail', 5));
    expect(planRecruit(board, ['pinguino', 'toastodilo'], 0.2)).toBeNull();
  });
});
