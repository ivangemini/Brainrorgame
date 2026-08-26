import { createDefaultAscensionProgress, type AscensionProgress } from './ascension';

let currentAscensionProgress: AscensionProgress = createDefaultAscensionProgress();

export function getCurrentAscensionProgress(): AscensionProgress {
  return clone(currentAscensionProgress);
}

export function syncCurrentAscensionProgress(progress: AscensionProgress): void {
  currentAscensionProgress = clone(progress);
}

export function resetCurrentAscensionProgress(): void {
  currentAscensionProgress = createDefaultAscensionProgress();
}

function clone(progress: AscensionProgress): AscensionProgress {
  return {
    ...progress,
    purchasedNodes: [...progress.purchasedNodes]
  };
}
