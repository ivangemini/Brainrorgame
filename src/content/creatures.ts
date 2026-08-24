export type CreatureFamily = 'pinguino' | 'toastodilo';

export interface CreatureDefinition {
  readonly key: string;
  readonly family: CreatureFamily;
  readonly level: 1 | 2 | 3;
  readonly name: string;
  readonly texture: string;
  readonly assetPath: string;
  readonly damage: number;
  readonly attackMs: number;
  readonly projectileColor: number;
  readonly accentColor: number;
}

const CREATURES: readonly CreatureDefinition[] = [
  { key: 'pinguino-1', family: 'pinguino', level: 1, name: 'Skate Pinguino', texture: 'creature-pinguino-1', assetPath: 'assets/characters/pinguino-1.svg', damage: 8, attackMs: 1250, projectileColor: 0x7ce7ff, accentColor: 0x64d8ff },
  { key: 'pinguino-2', family: 'pinguino', level: 2, name: 'Turbo Pinguino', texture: 'creature-pinguino-2', assetPath: 'assets/characters/pinguino-2.svg', damage: 19, attackMs: 1120, projectileColor: 0x84f7ff, accentColor: 0x2ce5ff },
  { key: 'pinguino-3', family: 'pinguino', level: 3, name: 'Comet Pinguino', texture: 'creature-pinguino-3', assetPath: 'assets/characters/pinguino-3.svg', damage: 46, attackMs: 980, projectileColor: 0xc7fbff, accentColor: 0x59f3ff },
  { key: 'toastodilo-1', family: 'toastodilo', level: 1, name: 'Toastodilo', texture: 'creature-toastodilo-1', assetPath: 'assets/characters/toastodilo-1.svg', damage: 11, attackMs: 1500, projectileColor: 0xffa85f, accentColor: 0xff9547 },
  { key: 'toastodilo-2', family: 'toastodilo', level: 2, name: 'Turbo Toastodilo', texture: 'creature-toastodilo-2', assetPath: 'assets/characters/toastodilo-2.svg', damage: 27, attackMs: 1360, projectileColor: 0xffd178, accentColor: 0xffbd4d },
  { key: 'toastodilo-3', family: 'toastodilo', level: 3, name: 'Solar Toastodilo', texture: 'creature-toastodilo-3', assetPath: 'assets/characters/toastodilo-3.svg', damage: 61, attackMs: 1190, projectileColor: 0xffec92, accentColor: 0xffd65c }
] as const;

export function getCreature(family: CreatureFamily, level: number): CreatureDefinition {
  const found = CREATURES.find((creature) => creature.family === family && creature.level === level);
  if (!found) throw new Error(`Unknown creature: ${family} level ${level}`);
  return found;
}

export function getAllCreatures(): readonly CreatureDefinition[] { return CREATURES; }
