export const CREATURE_FAMILIES = [
  'pinguino',
  'toastodilo',
  'lampalotl',
  'dishnail',
  'mochimoth',
  'routeraptor',
  'vendinguana'
] as const;

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

export interface CreatureFamilyProgression {
  readonly family: CreatureFamily;
  readonly unlockChapter: number;
  readonly role: string;
}

const FAMILY_PROGRESSION: readonly CreatureFamilyProgression[] = [
  { family: 'pinguino', unlockChapter: 1, role: 'balanced cadence' },
  { family: 'toastodilo', unlockChapter: 1, role: 'heavy fortress support' },
  { family: 'lampalotl', unlockChapter: 1, role: 'rapid-fire damage' },
  { family: 'dishnail', unlockChapter: 1, role: 'artillery bounty' },
  { family: 'mochimoth', unlockChapter: 3, role: 'soft defensive support' },
  { family: 'routeraptor', unlockChapter: 6, role: 'Chaos Energy tempo' },
  { family: 'vendinguana', unlockChapter: 11, role: 'boss breaker' }
] as const;

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
  { key: 'dishnail-3', family: 'dishnail', level: 3, name: 'Quasar Dishnail', texture: 'creature-dishnail-3', assetPath: 'assets/characters/dishnail-3.svg', damage: 82, attackMs: 1530, projectileColor: 0xfff3a8, accentColor: 0xc57dff },
  { key: 'mochimoth-1', family: 'mochimoth', level: 1, name: 'Puff Mochimoth', texture: 'creature-mochimoth-1', assetPath: 'assets/characters/mochimoth-1.svg', damage: 7, attackMs: 1080, projectileColor: 0xffb9dc, accentColor: 0xff9acb },
  { key: 'mochimoth-2', family: 'mochimoth', level: 2, name: 'Glaze Mochimoth', texture: 'creature-mochimoth-2', assetPath: 'assets/characters/mochimoth-2.svg', damage: 17, attackMs: 970, projectileColor: 0xffd8ef, accentColor: 0xffb4db },
  { key: 'mochimoth-3', family: 'mochimoth', level: 3, name: 'Lunar Mochimoth', texture: 'creature-mochimoth-3', assetPath: 'assets/characters/mochimoth-3.svg', damage: 40, attackMs: 850, projectileColor: 0xfff0fb, accentColor: 0xd89cff },
  { key: 'routeraptor-1', family: 'routeraptor', level: 1, name: 'Ping Routeraptor', texture: 'creature-routeraptor-1', assetPath: 'assets/characters/routeraptor-1.svg', damage: 5, attackMs: 690, projectileColor: 0x68f7ff, accentColor: 0x42dfe8 },
  { key: 'routeraptor-2', family: 'routeraptor', level: 2, name: 'Mesh Routeraptor', texture: 'creature-routeraptor-2', assetPath: 'assets/characters/routeraptor-2.svg', damage: 12, attackMs: 620, projectileColor: 0x9dffff, accentColor: 0x5df4cc },
  { key: 'routeraptor-3', family: 'routeraptor', level: 3, name: 'Hyperlink Routeraptor', texture: 'creature-routeraptor-3', assetPath: 'assets/characters/routeraptor-3.svg', damage: 27, attackMs: 545, projectileColor: 0xd3ffff, accentColor: 0x65a8ff },
  { key: 'vendinguana-1', family: 'vendinguana', level: 1, name: 'Snack Vendinguana', texture: 'creature-vendinguana-1', assetPath: 'assets/characters/vendinguana-1.svg', damage: 13, attackMs: 1880, projectileColor: 0xbfff71, accentColor: 0x91dc55 },
  { key: 'vendinguana-2', family: 'vendinguana', level: 2, name: 'Combo Vendinguana', texture: 'creature-vendinguana-2', assetPath: 'assets/characters/vendinguana-2.svg', damage: 31, attackMs: 1680, projectileColor: 0xe7ff79, accentColor: 0xffb858 },
  { key: 'vendinguana-3', family: 'vendinguana', level: 3, name: 'Jackpot Vendinguana', texture: 'creature-vendinguana-3', assetPath: 'assets/characters/vendinguana-3.svg', damage: 70, attackMs: 1480, projectileColor: 0xffef7d, accentColor: 0xff8158 }
];

let currentRecruitChapter = 1;

export function getCreature(family: CreatureFamily, level: number): CreatureDefinition {
  const found = CREATURES.find((creature) => creature.family === family && creature.level === level);
  if (!found) throw new Error(`Unknown creature: ${family} level ${level}`);
  return found;
}

export function getAllCreatures(): readonly CreatureDefinition[] {
  return CREATURES;
}

export function getCreatureFamilyProgression(): readonly CreatureFamilyProgression[] {
  return FAMILY_PROGRESSION;
}

export function getRecruitableFamilies(chapter = currentRecruitChapter): readonly CreatureFamily[] {
  const safeChapter = Math.max(1, Math.floor(Number.isFinite(chapter) ? chapter : 1));
  return FAMILY_PROGRESSION
    .filter((entry) => safeChapter >= entry.unlockChapter)
    .map((entry) => entry.family);
}

export function syncRecruitProgressChapter(chapter: number): void {
  currentRecruitChapter = Math.max(1, Math.floor(Number.isFinite(chapter) ? chapter : 1));
}

export function resetRecruitProgressChapter(): void {
  currentRecruitChapter = 1;
}

export function isCreatureFamily(value: unknown): value is CreatureFamily {
  return typeof value === 'string' && (CREATURE_FAMILIES as readonly string[]).includes(value);
}
