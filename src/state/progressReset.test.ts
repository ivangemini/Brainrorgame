import { describe, expect, it } from 'vitest';
import type { PlatformAdapter } from '../platform/PlatformAdapter';
import { createFreshGameSave } from './freshSave';
import { persistFreshSaveAndArmReloadGuard } from './progressReset';

describe('progress reset persistence guard', () => {
  it('keeps late lifecycle saves from restoring the old progress', async () => {
    const writes: unknown[] = [];
    const platform = {
      save: async <T>(value: T): Promise<void> => { writes.push(value); }
    } as PlatformAdapter;
    const fresh = createFreshGameSave(123456);

    await persistFreshSaveAndArmReloadGuard(platform, fresh);
    expect(writes).toEqual([fresh]);

    await platform.save({ version: 999, coins: 999999, oldProgress: true });
    expect(writes).toEqual([fresh, fresh]);
  });

  it('does not arm the guard when the initial fresh-save write fails', async () => {
    const originalError = new Error('storage unavailable');
    let attempts = 0;
    const originalSave = async <T>(value: T): Promise<void> => {
      void value;
      attempts += 1;
      throw originalError;
    };
    const platform = { save: originalSave } as PlatformAdapter;

    await expect(persistFreshSaveAndArmReloadGuard(platform, createFreshGameSave(1))).rejects.toBe(originalError);
    expect(attempts).toBe(1);
    expect(platform.save).toBe(originalSave);
  });
});
