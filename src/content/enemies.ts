export type EnemyId =
  | 'jellini-sprinter'
  | 'sock-gobblino'
  | 'wifino-mole'
  | 'noodlini-skipper'
  | 'vacuum-capybara'
  | 'cactus-tv-crab';

export interface EnemyDefinition {
  readonly id: EnemyId;
  readonly name: string;
  readonly texture: string;
  readonly assetPath: string;
  readonly baseHp: number;
  readonly hpGrowth: number;
  readonly baseDamage: number;
  readonly damageGrowth: number;
  readonly attackMs: number;
  readonly baseReward: number;
  readonly rewardGrowth: number;
  readonly accentColor: number;
  readonly projectileColor: number;
  readonly displaySize: number;
}

export interface ScaledEnemyStats {
  readonly hp: number;
  readonly damage: number;
  readonly attackMs: number;
  readonly reward: number;
}

const ENEMIES: readonly EnemyDefinition[] = [
  {
    id: 'jellini-sprinter',
    name: 'Jellini Sprinter',
    texture: 'enemy-jellini-sprinter',
    assetPath: 'assets/enemies/jellini-sprinter.svg',
    baseHp: 145,
    hpGrowth: 1.16,
    baseDamage: 5,
    damageGrowth: 1.09,
    attackMs: 2650,
    baseReward: 18,
    rewardGrowth: 1.12,
    accentColor: 0x6ff6e9,
    projectileColor: 0xff72c8,
    displaySize: 390
  },
  {
    id: 'sock-gobblino',
    name: 'Sock Gobblino',
    texture: 'enemy-sock-gobblino',
    assetPath: 'assets/enemies/sock-gobblino.svg',
    baseHp: 185,
    hpGrowth: 1.16,
    baseDamage: 7,
    damageGrowth: 1.09,
    attackMs: 3150,
    baseReward: 22,
    rewardGrowth: 1.12,
    accentColor: 0xc88cff,
    projectileColor: 0xffd36f,
    displaySize: 410
  },
  {
    id: 'wifino-mole',
    name: 'Wi-Fino Mole',
    texture: 'enemy-wifino-mole',
    assetPath: 'assets/enemies/wifino-mole.svg',
    baseHp: 230,
    hpGrowth: 1.17,
    baseDamage: 9,
    damageGrowth: 1.1,
    attackMs: 3550,
    baseReward: 28,
    rewardGrowth: 1.13,
    accentColor: 0x78e8ff,
    projectileColor: 0x9dff7a,
    displaySize: 430
  },
  {
    id: 'noodlini-skipper',
    name: 'Noodlini Skipper',
    texture: 'enemy-noodlini-skipper',
    assetPath: 'assets/enemies/noodlini-skipper.svg',
    baseHp: 160,
    hpGrowth: 1.165,
    baseDamage: 4,
    damageGrowth: 1.095,
    attackMs: 2200,
    baseReward: 20,
    rewardGrowth: 1.125,
    accentColor: 0xffdb6e,
    projectileColor: 0xff6fae,
    displaySize: 405
  },
  {
    id: 'vacuum-capybara',
    name: 'Vacuum Capybara',
    texture: 'enemy-vacuum-capybara',
    assetPath: 'assets/enemies/vacuum-capybara.svg',
    baseHp: 270,
    hpGrowth: 1.175,
    baseDamage: 11,
    damageGrowth: 1.105,
    attackMs: 3800,
    baseReward: 32,
    rewardGrowth: 1.135,
    accentColor: 0xff9a68,
    projectileColor: 0x82f0ff,
    displaySize: 445
  },
  {
    id: 'cactus-tv-crab',
    name: 'Cactus TV Crab',
    texture: 'enemy-cactus-tv-crab',
    assetPath: 'assets/enemies/cactus-tv-crab.svg',
    baseHp: 205,
    hpGrowth: 1.17,
    baseDamage: 8,
    damageGrowth: 1.1,
    attackMs: 2900,
    baseReward: 26,
    rewardGrowth: 1.13,
    accentColor: 0x92ef75,
    projectileColor: 0xb886ff,
    displaySize: 425
  }
] as const;

export function getAllEnemies(): readonly EnemyDefinition[] {
  return ENEMIES;
}

export function getEnemyForWave(chapter: number, waveNumber: 1 | 2 | 3): EnemyDefinition {
  const safeChapter = Math.max(1, Math.floor(chapter));
  const offset = (safeChapter - 1 + waveNumber - 1) % ENEMIES.length;
  const enemy = ENEMIES[offset];
  if (!enemy) throw new Error(`No enemy configured for chapter ${chapter}, wave ${waveNumber}`);
  return enemy;
}

export function scaleEnemy(enemy: EnemyDefinition, chapter: number): ScaledEnemyStats {
  const level = Math.max(0, Math.floor(chapter) - 1);
  return {
    hp: Math.max(1, Math.round(enemy.baseHp * Math.pow(enemy.hpGrowth, level))),
    damage: Math.max(1, Math.round(enemy.baseDamage * Math.pow(enemy.damageGrowth, level))),
    attackMs: Math.max(1700, enemy.attackMs - level * 45),
    reward: Math.max(1, Math.round(enemy.baseReward * Math.pow(enemy.rewardGrowth, level)))
  };
}
