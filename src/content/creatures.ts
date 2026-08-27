export const CREATURE_FAMILIES = [
  'pinguino', 'toastodilo', 'lampalotl', 'dishnail', 'mochimoth', 'routeraptor', 'vendinguana',
  'umbrellama', 'mopossum', 'fanthom', 'socktopus', 'microwhale'
] as const;

export type CreatureFamily = (typeof CREATURE_FAMILIES)[number];
export type CreatureLevel = 1 | 2 | 3;
export type CreatureKey = `${CreatureFamily}-${CreatureLevel}`;

export interface CreatureDefinition {
  readonly key: CreatureKey; readonly family: CreatureFamily; readonly level: CreatureLevel;
  readonly name: string; readonly texture: string; readonly assetPath: string;
  readonly damage: number; readonly attackMs: number; readonly projectileColor: number; readonly accentColor: number;
}

export interface CreatureFamilyProgression { readonly family: CreatureFamily; readonly unlockChapter: number; readonly role: string; }

const FAMILY_PROGRESSION: readonly CreatureFamilyProgression[] = [
  { family: 'pinguino', unlockChapter: 1, role: 'balanced cadence' },
  { family: 'toastodilo', unlockChapter: 1, role: 'heavy fortress support' },
  { family: 'lampalotl', unlockChapter: 1, role: 'rapid-fire damage' },
  { family: 'dishnail', unlockChapter: 1, role: 'artillery bounty' },
  { family: 'mochimoth', unlockChapter: 3, role: 'soft defensive support' },
  { family: 'routeraptor', unlockChapter: 6, role: 'Chaos Energy tempo' },
  { family: 'vendinguana', unlockChapter: 11, role: 'boss breaker' },
  { family: 'umbrellama', unlockChapter: 13, role: 'storm shielding' },
  { family: 'mopossum', unlockChapter: 16, role: 'salvage bounty' },
  { family: 'fanthom', unlockChapter: 18, role: 'haunted haste' },
  { family: 'socktopus', unlockChapter: 21, role: 'multi-arm damage' },
  { family: 'microwhale', unlockChapter: 24, role: 'endless boss pressure' }
] as const;

const CREATURES: readonly CreatureDefinition[] = [
  { key: 'pinguino-1', family: 'pinguino', level: 1, name: 'Motorino Pinguino', texture: 'creature-pinguino-1', assetPath: 'assets/characters/pinguino-1.svg', damage: 8, attackMs: 1250, projectileColor: 0x7ce7ff, accentColor: 0x64d8ff },
  { key: 'pinguino-2', family: 'pinguino', level: 2, name: 'Espresso Pinguino', texture: 'creature-pinguino-2', assetPath: 'assets/characters/pinguino-2.svg', damage: 19, attackMs: 1120, projectileColor: 0x84f7ff, accentColor: 0x2ce5ff },
  { key: 'pinguino-3', family: 'pinguino', level: 3, name: 'Grandissimo Pinguino', texture: 'creature-pinguino-3', assetPath: 'assets/characters/pinguino-3.svg', damage: 46, attackMs: 980, projectileColor: 0xc7fbff, accentColor: 0x59f3ff },
  { key: 'toastodilo-1', family: 'toastodilo', level: 1, name: 'Focaccino Crocodilo', texture: 'creature-toastodilo-1', assetPath: 'assets/characters/toastodilo-1.svg', damage: 11, attackMs: 1500, projectileColor: 0xffa85f, accentColor: 0xff9547 },
  { key: 'toastodilo-2', family: 'toastodilo', level: 2, name: 'Panzerotto Crocodilo', texture: 'creature-toastodilo-2', assetPath: 'assets/characters/toastodilo-2.svg', damage: 27, attackMs: 1360, projectileColor: 0xffd178, accentColor: 0xffbd4d },
  { key: 'toastodilo-3', family: 'toastodilo', level: 3, name: 'Fornissimo Crocodilo', texture: 'creature-toastodilo-3', assetPath: 'assets/characters/toastodilo-3.svg', damage: 61, attackMs: 1190, projectileColor: 0xffec92, accentColor: 0xffd65c },
  { key: 'lampalotl-1', family: 'lampalotl', level: 1, name: 'Gelatino Axolotto', texture: 'creature-lampalotl-1', assetPath: 'assets/characters/lampalotl-1.svg', damage: 6, attackMs: 850, projectileColor: 0xff83de, accentColor: 0x74f1d8 },
  { key: 'lampalotl-2', family: 'lampalotl', level: 2, name: 'Granita Axolotto', texture: 'creature-lampalotl-2', assetPath: 'assets/characters/lampalotl-2.svg', damage: 14, attackMs: 760, projectileColor: 0x82f7ff, accentColor: 0xff86d7 },
  { key: 'lampalotl-3', family: 'lampalotl', level: 3, name: 'Gelatissimo Axolotto', texture: 'creature-lampalotl-3', assetPath: 'assets/characters/lampalotl-3.svg', damage: 31, attackMs: 660, projectileColor: 0xfff09a, accentColor: 0xa77cff },
  { key: 'dishnail-1', family: 'dishnail', level: 1, name: 'Scolapasta Lumachino', texture: 'creature-dishnail-1', assetPath: 'assets/characters/dishnail-1.svg', damage: 15, attackMs: 1950, projectileColor: 0xffda73, accentColor: 0x6fe8ed },
  { key: 'dishnail-2', family: 'dishnail', level: 2, name: 'Raviolotto Lumachino', texture: 'creature-dishnail-2', assetPath: 'assets/characters/dishnail-2.svg', damage: 36, attackMs: 1760, projectileColor: 0xffef9d, accentColor: 0x80dcff },
  { key: 'dishnail-3', family: 'dishnail', level: 3, name: 'Pastissimo Lumachino', texture: 'creature-dishnail-3', assetPath: 'assets/characters/dishnail-3.svg', damage: 82, attackMs: 1530, projectileColor: 0xfff3a8, accentColor: 0xc57dff },
  { key: 'mochimoth-1', family: 'mochimoth', level: 1, name: 'Tiramisello Faleno', texture: 'creature-mochimoth-1', assetPath: 'assets/characters/mochimoth-1.svg', damage: 7, attackMs: 1080, projectileColor: 0xffb9dc, accentColor: 0xff9acb },
  { key: 'mochimoth-2', family: 'mochimoth', level: 2, name: 'Cacao Faleno', texture: 'creature-mochimoth-2', assetPath: 'assets/characters/mochimoth-2.svg', damage: 17, attackMs: 970, projectileColor: 0xffd8ef, accentColor: 0xffb4db },
  { key: 'mochimoth-3', family: 'mochimoth', level: 3, name: 'Tiramisissimo Faleno', texture: 'creature-mochimoth-3', assetPath: 'assets/characters/mochimoth-3.svg', damage: 40, attackMs: 850, projectileColor: 0xfff0fb, accentColor: 0xd89cff },
  { key: 'routeraptor-1', family: 'routeraptor', level: 1, name: 'Modemino Raptorino', texture: 'creature-routeraptor-1', assetPath: 'assets/characters/routeraptor-1.svg', damage: 5, attackMs: 690, projectileColor: 0x68f7ff, accentColor: 0x42dfe8 },
  { key: 'routeraptor-2', family: 'routeraptor', level: 2, name: 'Fibra Raptorino', texture: 'creature-routeraptor-2', assetPath: 'assets/characters/routeraptor-2.svg', damage: 12, attackMs: 620, projectileColor: 0x9dffff, accentColor: 0x5df4cc },
  { key: 'routeraptor-3', family: 'routeraptor', level: 3, name: 'Gigabit Raptorissimo', texture: 'creature-routeraptor-3', assetPath: 'assets/characters/routeraptor-3.svg', damage: 27, attackMs: 545, projectileColor: 0xd3ffff, accentColor: 0x65a8ff },
  { key: 'vendinguana-1', family: 'vendinguana', level: 1, name: 'Snackomatico Iguanuccio', texture: 'creature-vendinguana-1', assetPath: 'assets/characters/vendinguana-1.svg', damage: 13, attackMs: 1880, projectileColor: 0xbfff71, accentColor: 0x91dc55 },
  { key: 'vendinguana-2', family: 'vendinguana', level: 2, name: 'Moneta Iguanuccio', texture: 'creature-vendinguana-2', assetPath: 'assets/characters/vendinguana-2.svg', damage: 31, attackMs: 1680, projectileColor: 0xe7ff79, accentColor: 0xffb858 },
  { key: 'vendinguana-3', family: 'vendinguana', level: 3, name: 'Jackpot Iguanuccio', texture: 'creature-vendinguana-3', assetPath: 'assets/characters/vendinguana-3.svg', damage: 70, attackMs: 1480, projectileColor: 0xffef7d, accentColor: 0xff8158 },
  { key: 'umbrellama-1', family: 'umbrellama', level: 1, name: 'Ombrellino Llamarino', texture: 'creature-umbrellama-1', assetPath: 'assets/characters/umbrellama-1.svg', damage: 10, attackMs: 1320, projectileColor: 0x9edbff, accentColor: 0x6bb8ff },
  { key: 'umbrellama-2', family: 'umbrellama', level: 2, name: 'Temporale Llamarino', texture: 'creature-umbrellama-2', assetPath: 'assets/characters/umbrellama-2.svg', damage: 24, attackMs: 1190, projectileColor: 0xc1b8ff, accentColor: 0x8c7dff },
  { key: 'umbrellama-3', family: 'umbrellama', level: 3, name: 'Grandine Llamarino', texture: 'creature-umbrellama-3', assetPath: 'assets/characters/umbrellama-3.svg', damage: 54, attackMs: 1040, projectileColor: 0xe5d6ff, accentColor: 0xb08cff },
  { key: 'mopossum-1', family: 'mopossum', level: 1, name: 'Moppino Possumino', texture: 'creature-mopossum-1', assetPath: 'assets/characters/mopossum-1.svg', damage: 12, attackMs: 1640, projectileColor: 0x99f0c9, accentColor: 0x7ee6b8 },
  { key: 'mopossum-2', family: 'mopossum', level: 2, name: 'Secchiello Possumino', texture: 'creature-mopossum-2', assetPath: 'assets/characters/mopossum-2.svg', damage: 29, attackMs: 1480, projectileColor: 0xb9ffd9, accentColor: 0x70d9aa },
  { key: 'mopossum-3', family: 'mopossum', level: 3, name: 'Lucidissimo Possumino', texture: 'creature-mopossum-3', assetPath: 'assets/characters/mopossum-3.svg', damage: 66, attackMs: 1300, projectileColor: 0xe2fff0, accentColor: 0x85e9c0 },
  { key: 'fanthom-1', family: 'fanthom', level: 1, name: 'Ventilino Fantasmello', texture: 'creature-fanthom-1', assetPath: 'assets/characters/fanthom-1.svg', damage: 7, attackMs: 760, projectileColor: 0xb8f5ff, accentColor: 0x9be7ff },
  { key: 'fanthom-2', family: 'fanthom', level: 2, name: 'Turbina Fantasmello', texture: 'creature-fanthom-2', assetPath: 'assets/characters/fanthom-2.svg', damage: 16, attackMs: 680, projectileColor: 0xbec7ff, accentColor: 0x7e90ff },
  { key: 'fanthom-3', family: 'fanthom', level: 3, name: 'Ciclone Fantasmello', texture: 'creature-fanthom-3', assetPath: 'assets/characters/fanthom-3.svg', damage: 35, attackMs: 590, projectileColor: 0xd9d6ff, accentColor: 0x6f7cff },
  { key: 'socktopus-1', family: 'socktopus', level: 1, name: 'Calzino Polipino', texture: 'creature-socktopus-1', assetPath: 'assets/characters/socktopus-1.svg', damage: 9, attackMs: 980, projectileColor: 0xffc0e1, accentColor: 0xff9fcf },
  { key: 'socktopus-2', family: 'socktopus', level: 2, name: 'Lavatrice Polipino', texture: 'creature-socktopus-2', assetPath: 'assets/characters/socktopus-2.svg', damage: 22, attackMs: 875, projectileColor: 0xffe19a, accentColor: 0xffbd76 },
  { key: 'socktopus-3', family: 'socktopus', level: 3, name: 'Reale Polipissimo', texture: 'creature-socktopus-3', assetPath: 'assets/characters/socktopus-3.svg', damage: 50, attackMs: 760, projectileColor: 0xfff0ba, accentColor: 0xffd46e },
  { key: 'microwhale-1', family: 'microwhale', level: 1, name: 'Fornetto Balenotto', texture: 'creature-microwhale-1', assetPath: 'assets/characters/microwhale-1.svg', damage: 16, attackMs: 2050, projectileColor: 0x8ff5e2, accentColor: 0x7de2d1 },
  { key: 'microwhale-2', family: 'microwhale', level: 2, name: 'Microonda Balenotto', texture: 'creature-microwhale-2', assetPath: 'assets/characters/microwhale-2.svg', damage: 38, attackMs: 1830, projectileColor: 0xffc28f, accentColor: 0xffae72 },
  { key: 'microwhale-3', family: 'microwhale', level: 3, name: 'Superforno Balenotto', texture: 'creature-microwhale-3', assetPath: 'assets/characters/microwhale-3.svg', damage: 86, attackMs: 1600, projectileColor: 0xffe2a8, accentColor: 0xff9f66 }
];

const PRESTIGE_SCALING = {
  4: { damageMultiplier: 2.05, attackIntervalMultiplier: 0.96, nameSuffix: 'Sovraccarico' },
  5: { damageMultiplier: 4.20, attackIntervalMultiplier: 0.92, nameSuffix: 'Imperiale' }
} as const;

let currentRecruitChapter = 1;
export function getCreature(family: CreatureFamily, level: number): CreatureDefinition {
  const safeLevel = Number.isFinite(level) ? Math.floor(level) : -1;
  const artLevel = safeLevel >= 4 && safeLevel <= 5 ? 3 : safeLevel;
  const found = CREATURES.find((creature) => creature.family === family && creature.level === artLevel);
  if (!found) throw new Error(`Unknown creature: ${family} level ${level}`);
  if (safeLevel <= 3) return found;
  const scaling = PRESTIGE_SCALING[safeLevel as 4 | 5];
  return {
    ...found,
    name: `${found.name} ${scaling.nameSuffix}`,
    damage: Math.max(1, Math.round(found.damage * scaling.damageMultiplier)),
    attackMs: Math.max(180, Math.round(found.attackMs * scaling.attackIntervalMultiplier))
  };
}
export function getAllCreatures(): readonly CreatureDefinition[] { return CREATURES; }
export function getCreatureFamilyProgression(): readonly CreatureFamilyProgression[] { return FAMILY_PROGRESSION; }
export function getRecruitableFamilies(chapter = currentRecruitChapter): readonly CreatureFamily[] { const safeChapter = Math.max(1, Math.floor(Number.isFinite(chapter) ? chapter : 1)); return FAMILY_PROGRESSION.filter((entry) => safeChapter >= entry.unlockChapter).map((entry) => entry.family); }
export function syncRecruitProgressChapter(chapter: number): void { currentRecruitChapter = Math.max(1, Math.floor(Number.isFinite(chapter) ? chapter : 1)); }
export function resetRecruitProgressChapter(): void { currentRecruitChapter = 1; }
export function isCreatureFamily(value: unknown): value is CreatureFamily { return typeof value === 'string' && (CREATURE_FAMILIES as readonly string[]).includes(value); }
