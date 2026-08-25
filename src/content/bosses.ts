export type BossId = 'fridgino-maximo' | 'disco-moon-ox' | 'volcano-toaster-rex';

export interface BossDefinition {
  readonly id: BossId;
  readonly name: string;
  readonly texture: string;
  readonly assetPath: string;
  readonly baseHp: number;
  readonly hpGrowth: number;
  readonly baseDamage: number;
  readonly damageGrowth: number;
  readonly baseAttackMs: number;
  readonly attackSpeedPerChapter: number;
  readonly minAttackMs: number;
  readonly baseReward: number;
  readonly rewardPerChapter: number;
  readonly accentColor: number;
  readonly projectileColor: number;
  readonly displaySize: number;
  readonly defeatCallout: string;
}

export interface ScaledBossStats {
  readonly hp: number;
  readonly damage: number;
  readonly attackMs: number;
  readonly reward: number;
}

const BOSSES: readonly BossDefinition[] = [
  {
    id: 'fridgino-maximo',
    name: 'Fridgino Maximo',
    texture: 'boss-fridgino',
    assetPath: 'assets/bosses/fridgino-maximo.svg',
    baseHp: 520,
    hpGrowth: 1.22,
    baseDamage: 9,
    damageGrowth: 1.105,
    baseAttackMs: 3810,
    attackSpeedPerChapter: 90,
    minAttackMs: 2100,
    baseReward: 110,
    rewardPerChapter: 25,
    accentColor: 0x9cfbff,
    projectileColor: 0xff6d85,
    displaySize: 570,
    defeatCallout: 'BOSS MELTED!'
  },
  {
    id: 'disco-moon-ox',
    name: 'Disco Moon Ox',
    texture: 'boss-disco-moon-ox',
    assetPath: 'assets/bosses/disco-moon-ox.svg',
    baseHp: 575,
    hpGrowth: 1.215,
    baseDamage: 7,
    damageGrowth: 1.1,
    baseAttackMs: 3200,
    attackSpeedPerChapter: 72,
    minAttackMs: 1850,
    baseReward: 120,
    rewardPerChapter: 27,
    accentColor: 0xc992ff,
    projectileColor: 0xffe66f,
    displaySize: 585,
    defeatCallout: 'MOON DISCO CRASHED!'
  },
  {
    id: 'volcano-toaster-rex',
    name: 'Volcano Toaster Rex',
    texture: 'boss-volcano-toaster-rex',
    assetPath: 'assets/bosses/volcano-toaster-rex.svg',
    baseHp: 660,
    hpGrowth: 1.225,
    baseDamage: 13,
    damageGrowth: 1.11,
    baseAttackMs: 4300,
    attackSpeedPerChapter: 95,
    minAttackMs: 2250,
    baseReward: 138,
    rewardPerChapter: 30,
    accentColor: 0xff8a5d,
    projectileColor: 0xffd45f,
    displaySize: 610,
    defeatCallout: 'TOASTER EXTINCT!'
  }
] as const;

export function getAllBosses(): readonly BossDefinition[] {
  return BOSSES;
}

export function getBossForChapter(chapter: number): BossDefinition {
  const safeChapter = Math.max(1, Math.floor(chapter));
  const boss = BOSSES[(safeChapter - 1) % BOSSES.length];
  if (!boss) throw new Error(`No boss configured for chapter ${chapter}`);
  return boss;
}

export function scaleBoss(boss: BossDefinition, chapter: number): ScaledBossStats {
  const level = Math.max(0, Math.floor(chapter) - 1);
  return {
    hp: Math.max(1, Math.round(boss.baseHp * Math.pow(boss.hpGrowth, level))),
    damage: Math.max(1, Math.round(boss.baseDamage * Math.pow(boss.damageGrowth, level))),
    attackMs: Math.max(boss.minAttackMs, boss.baseAttackMs - level * boss.attackSpeedPerChapter),
    reward: Math.max(1, Math.round(boss.baseReward + level * boss.rewardPerChapter))
  };
}
