import { describe, expect, it } from 'vitest';
import type { BoardState } from '../systems/board';
import { parseGameSave } from './save';
import { createFreshGameSave } from './freshSave';

const NOW = Date.UTC(2026, 7, 27, 12, 0, 0);

describe('prestige merge tier persistence', () => {
  it('loads tier-four and tier-five units from the current save schema', () => {
    const fresh = createFreshGameSave(NOW);
    const board: BoardState = [
      { id: 'prestige-4', family: 'pinguino', level: 4, mutation: 'prismatic' },
      { id: 'prestige-5', family: 'toastodilo', level: 5, mutation: 'crowned' },
      ...fresh.board.slice(2)
    ];

    const parsed = parseGameSave({ ...fresh, board });
    expect(parsed).not.toBeNull();
    expect(parsed?.board[0]).toMatchObject({ family: 'pinguino', level: 4, mutation: 'prismatic' });
    expect(parsed?.board[1]).toMatchObject({ family: 'toastodilo', level: 5, mutation: 'crowned' });
  });

  it('still rejects unsupported tier values', () => {
    const fresh = createFreshGameSave(NOW);
    const invalidBoard = [...fresh.board];
    invalidBoard[0] = { ...fresh.board[0]!, level: 6 } as never;
    expect(parseGameSave({ ...fresh, board: invalidBoard })).toBeNull();
  });
});
