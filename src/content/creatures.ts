export const CREATURE_FAMILIES = ['pinguino', 'toastodilo', 'lampalotl', 'dishnail'] as const;

export type CreatureFamily = (typeof CREATURE_FAMILIES)[number];
export type CreatureLevel = 1 | 2 | 3;
export type CreatureKey = `${CreatureFamily}-${CreatureLevel}`;

export interface CreatureDefinition {
  readonly key: CreatureKey;
  readonly family: CreatureFamily;
  readonly level: CreatureLevel;
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
  { key: 'toastodilo-3', family: 'toastodilo', level: 3, name: 'Solar Toastodilo', texture: 'creature-toastodilo-3', assetPath: 'assets/characters/toastodilo-3.svg', damage: 61, attackMs: 1190, projectileColor: 0xffec92, accentColor: 0xffd65c },
  { key: 'lampalotl-1', family: 'lampalotl', level: 1, name: 'Glow Lampalotl', texture: 'creature-lampalotl-1', assetPath: 'assets/characters/lampalotl-1.svg', damage: 6, attackMs: 850, projectileColor: 0xff83de, accentColor: 0x74f1d8 },
  { key: 'lampalotl-2', family: 'lampalotl', level: 2, name: 'Prism Lampalotl', texture: 'creature-lampalotl-2', assetPath: 'assets/characters/lampalotl-2.svg', damage: 14, attackMs: 760, projectileColor: 0x82f7ff, accentColor: 0xff86d7 },
  { key: 'lampalotl-3', family: 'lampalotl', level: 3, name: 'Nova Lampalotl', texture: 'creature-lampalotl-3', assetPath: 'assets/characters/lampalotl-3.svg', damage: 31, attackMs: 660, projectileColor: 0xfff09a, accentColor: 0xa77cff },
  { key: 'dishnail-1', family: 'dishnail', level: 1, name: 'Ping Dishnail', texture: 'creature-dishnail-1', assetPath: 'assets/characters/dishnail-1.svg', damage: 15, attackMs: 1950, projectileColor: 0xffda73, accentColor: 0x6fe8ed },
  { key: 'dishnail-2', family: 'dishnail', level: 2, name: 'Relay Dishnail', texture: 'creature-dishnail-2', assetPath: 'assets/characters/dishnail-2.svg', damage: 36, attackMs: 1760, projectileColor: 0xffef9d, accentColor: 0x80dcff },
  { key: 'dishnail-3', family: 'dishnail', level: 3, name: 'Quasar Dishnail', texture: 'creature-dishnail-3', assetPath: 'assets/characters/dishnail-3.svg', damage: 82, attackMs: 1530, projectileColor: 0xfff3a8, accentColor: 0xc57dff }
];

export function getCreature(family: CreatureFamily, level: number): CreatureDefinition {
  const found = CREATURES.find((creature) => creature.family === family && creature.level === level);
  if (!found) throw new Error(`Unknown creature: ${family} level ${level}`);
  return found;
}

export function getAllCreatures(): readonly CreatureDefinition[] {
  return CREATURES;
}

export function getRecruitableFamilies(): readonly CreatureFamily[] {
  return CREATURE_FAMILIES;
}

export function isCreatureFamily(value: unknown): value is CreatureFamily {
  return typeof value === 'string' && (CREATURE_FAMILIES as readonly string[]).includes(value);
}
