export interface EncounterPreparationInput {
  readonly previousEncounterKey: string;
  readonly chapter: number;
  readonly step: number;
  readonly kind: 'wave' | 'boss';
}

export interface EncounterPreparationTransition {
  readonly encounterKey: string;
  readonly changed: boolean;
  readonly shouldAutoPause: boolean;
}

export function resolveEncounterPreparation(input: EncounterPreparationInput): EncounterPreparationTransition {
  const chapter = Math.max(1, Math.floor(input.chapter));
  const step = Math.max(0, Math.floor(input.step));
  const encounterKey = `${chapter}:${step}`;
  const changed = encounterKey !== input.previousEncounterKey;
  return {
    encounterKey,
    changed,
    shouldAutoPause: changed && input.kind === 'boss'
  };
}

export function shouldAdvanceCombat(paused: boolean, blockingPanelOpen: boolean): boolean {
  return !paused && !blockingPanelOpen;
}
