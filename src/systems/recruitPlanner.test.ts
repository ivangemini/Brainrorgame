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
      unit('t3', 'toastodilo', 3),
      ...Array.from({ length: BOARD_SIZE - 2 }, () => null)
    ];
    expect(recruitFamilyWeight(board, 'pinguino')).toBeGreaterThan(recruitFamilyWeight(board, 'toastodilo'));
  });

  it('downweights a family represented only by max-tier creatures without banning it', () => {
    const board: BoardState = [
      unit('p3a', 'pinguino', 3),
      unit('p3b', 'pinguino', 3),
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
      unit('m3', 'mochimoth', 3),
      unit('r2', 'routeraptor', 2),
      unit('v3', 'vendinguana', 3),
      unit('u2', 'umbrellama', 2),
      unit('o3', 'mopossum', 3),
      unit('f2', 'fanthom', 2),
      unit('s3', 'socktopus', 3),
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

  it('can protect the final slot with a tier-two twin when no tier-one rescue is available', () => {
    const board: BoardState = [
      unit('p2', 'pinguino', 2), unit('t2', 'toastodilo', 2), unit('l2', 'lampalotl', 2),
      unit('d2', 'dishnail', 2), unit('m2', 'mochimoth', 2), unit('r2', 'routeraptor', 2),
      unit('v2', 'vendinguana', 2), unit('u2', 'umbrellama', 2), unit('o2', 'mopossum', 2),
      unit('f2', 'fanthom', 2), unit('s2', 'socktopus', 2), unit('w2', 'microwhale', 2),
      unit('p3', 'pinguino', 3), unit('t3', 'toastodilo', 3), null
    ];
    const plan = planRecruit(board, ALL_FAMILIES, 0.4);
    expect(plan).toMatchObject({ level: 2, protectedPair: true });
  });

  it('recognizes that a crowded max-tier board already has a legal same-family consolidation', () => {
    const board: BoardState = [
      ...ALL_FAMILIES.map((family, index) => ({ id: `t3-${index}`, family, level: 3 as const, mutation: 'crowned' as const })),
      { id: 'p3b', family: 'pinguino', level: 3, mutation: 'prismatic' },
      { id: 't3b', family: 'toastodilo', level: 3, mutation: 'charged' },
      null
    ];
    expect(hasMergeablePair(board)).toBe(true);
    expect(planRecruit(board, ALL_FAMILIES, 0.5)).toMatchObject({ level: 1, protectedPair: false });
  });

  it('does not plan a recruit when the board is already full', () => {
    const board = oneEmptyWithoutMerge().map((slot, index) => slot ?? unit(`fill-${index}`, 'dishnail', 3));
    expect(planRecruit(board, ['pinguino', 'toastodilo'], 0.2)).toBeNull();
  });
});
