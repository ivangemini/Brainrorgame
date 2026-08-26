import type { PlatformAdapter } from '../platform/PlatformAdapter';
import type { GameSave } from './save';

/**
 * Persists the canonical fresh save and then temporarily replaces the adapter's
 * save method so any late lifecycle persistence during page reload can only
 * write the fresh snapshot again. Without this guard, a visibility/page-hide
 * save from the still-running GameScene can race the reset and restore the old
 * progress immediately after the user confirms a reset.
 */
export async function persistFreshSaveAndArmReloadGuard(
  platform: PlatformAdapter,
  freshSave: GameSave
): Promise<void> {
  const write = platform.save.bind(platform) as <T>(value: T) => Promise<void>;
  await write(freshSave);

  platform.save = async <T>(_value: T): Promise<void> => {
    await write(freshSave);
  };
}
