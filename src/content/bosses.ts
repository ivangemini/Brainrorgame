export type BossId =
  | 'fridgino-maximo'
  | 'magnetrono-mambissimo'
  | 'bubblotto-krakenino'
  | 'kettlestar-volcanissimo';
export type BossTelegraphStyle = 'ring' | 'sweep' | 'orbit' | 'fan';
export type BossDefeatStyle = 'melt' | 'spin' | 'pop' | 'implode';
export type BossIdleStyle = 'float' | 'sway' | 'bob' | 'huff';

export interface BossPresentation {
  readonly telegraphStyle: BossTelegraphStyle;
  readonly defeatStyle: BossDefeatStyle;
  readonly idleStyle: BossIdleStyle;
  readonly defeatLabel: string;
}

export interface BossPhaseProfile {
  readonly phaseTwoRatio: number;
  readonly phaseThreeRatio: number;
  readonly phaseTwoWeakRatio: number;
  readonly phaseThreeWeakRatio: number;
  readonly shieldDamageTakenMultiplier: number;
  readonly weakDamageTakenMultiplier: number;
  readonly phaseTwoAttackMultiplier: number;
  readonly phaseTwoDamageMultiplier: number;
  readonly phaseThreeAttackMultiplier: number;
  readonly phaseThreeDamageMultiplier: number;
  readonly shieldLabel: string;
  readonly weakLabel: string;
  readonly enrageLabel: string;
}

export interface BossDefinition {
  readonly id: BossId;
  readonly name: string;
  readonly texture: string;
  readonly assetPath: string;
  readonly baseHp: number;
  readonly hpGrowth: number;
  readonly baseDamage: number;
  readonly damagePerChapter: number;
  readonly maxDamage: number;
  readonly baseAttackMs: number;
  readonly attackStepMs: number;
  readonly minAttackMs: number;
  readonly baseReward: number;
  readonly rewardPerChapter: number;
  readonly accentColor: number;
  readonly projectileColor: number;
  readonly displaySize: number;
  readonly presentation: BossPresentation;
  readonly phases: BossPhaseProfile;
}

export interface ScaledBossStats {
  readonly hp: number;
  readonly damage: number;
  readonly attackMs: number;
  readonly reward: number;
}

const BOSSES: readonly BossDefinition[] = [
  {
    id: 'fridgino-maximo', name: 'Fridgino Maximo', texture: 'boss-fridgino', assetPath: 'assets/bosses/fridgino-maximo.svg',
    baseHp: 520, hpGrowth: 1.22, baseDamage: 9, damagePerChapter: 2, maxDamage: 26,
    baseAttackMs: 3810, attackStepMs: 90, minAttackMs: 2100, baseReward: 110, rewardPerChapter: 25,
    accentColor: 0x9cfbff, projectileColor: 0xff6d85, displaySize: 570,
    presentation: { telegraphStyle: 'ring', defeatStyle: 'melt', idleStyle: 'float', defeatLabel: 'BOSS MELTED!' },
    phases: {
      phaseTwoRatio: 0.70, phaseThreeRatio: 0.40, phaseTwoWeakRatio: 0.55, phaseThreeWeakRatio: 0.23,
      shieldDamageTakenMultiplier: 0.58, weakDamageTakenMultiplier: 1.36,
      phaseTwoAttackMultiplier: 0.90, phaseTwoDamageMultiplier: 1.06,
      phaseThreeAttackMultiplier: 0.78, phaseThreeDamageMultiplier: 1.14,
      shieldLabel: 'FREEZER SHELL', weakLabel: 'COOLANT CORE OPEN', enrageLabel: 'ABSOLUTE ZERO RAGE'
    }
  },
  {
    id: 'magnetrono-mambissimo', name: 'Magnetrono Mambissimo', texture: 'boss-magnetrono', assetPath: 'assets/bosses/magnetrono-mambissimo.svg',
    baseHp: 545, hpGrowth: 1.215, baseDamage: 8, damagePerChapter: 2, maxDamage: 25,
    baseAttackMs: 3400, attackStepMs: 75, minAttackMs: 1950, baseReward: 110, rewardPerChapter: 25,
    accentColor: 0xffaa5c, projectileColor: 0xff5cda, displaySize: 590,
    presentation: { telegraphStyle: 'sweep', defeatStyle: 'spin', idleStyle: 'sway', defeatLabel: 'MAMBO SHORTED!' },
    phases: {
      phaseTwoRatio: 0.70, phaseThreeRatio: 0.40, phaseTwoWeakRatio: 0.54, phaseThreeWeakRatio: 0.24,
      shieldDamageTakenMultiplier: 0.62, weakDamageTakenMultiplier: 1.42,
      phaseTwoAttackMultiplier: 0.88, phaseTwoDamageMultiplier: 1.05,
      phaseThreeAttackMultiplier: 0.73, phaseThreeDamageMultiplier: 1.12,
      shieldLabel: 'POLARITY LOCK', weakLabel: 'MAGNET CORE EXPOSED', enrageLabel: 'MAMBO OVERDRIVE'
    }
  },
  {
    id: 'bubblotto-krakenino', name: 'Bubblotto Krakenino', texture: 'boss-bubblotto', assetPath: 'assets/bosses/bubblotto-krakenino.svg',
    baseHp: 610, hpGrowth: 1.225, baseDamage: 11, damagePerChapter: 2, maxDamage: 28,
    baseAttackMs: 4200, attackStepMs: 95, minAttackMs: 2250, baseReward: 110, rewardPerChapter: 25,
    accentColor: 0x8df4ff, projectileColor: 0xb66cff, displaySize: 605,
    presentation: { telegraphStyle: 'orbit', defeatStyle: 'pop', idleStyle: 'bob', defeatLabel: 'DOME POPPED!' },
    phases: {
      phaseTwoRatio: 0.70, phaseThreeRatio: 0.40, phaseTwoWeakRatio: 0.56, phaseThreeWeakRatio: 0.25,
      shieldDamageTakenMultiplier: 0.50, weakDamageTakenMultiplier: 1.32,
      phaseTwoAttackMultiplier: 0.93, phaseTwoDamageMultiplier: 1.10,
      phaseThreeAttackMultiplier: 0.82, phaseThreeDamageMultiplier: 1.22,
      shieldLabel: 'BUBBLE DOME', weakLabel: 'TENTACLE HEART OPEN', enrageLabel: 'KRAKEN PRESSURE'
    }
  },
  {
    id: 'kettlestar-volcanissimo', name: 'Kettlestar Volcanissimo', texture: 'boss-kettlestar', assetPath: 'assets/bosses/kettlestar-volcanissimo.svg',
    baseHp: 500, hpGrowth: 1.23, baseDamage: 11, damagePerChapter: 2, maxDamage: 29,
    baseAttackMs: 3850, attackStepMs: 85, minAttackMs: 2100, baseReward: 110, rewardPerChapter: 25,
    accentColor: 0xffd36a, projectileColor: 0x72f4ef, displaySize: 620,
    presentation: { telegraphStyle: 'fan', defeatStyle: 'implode', idleStyle: 'huff', defeatLabel: 'PRESSURE LOST!' },
    phases: {
      phaseTwoRatio: 0.70, phaseThreeRatio: 0.40, phaseTwoWeakRatio: 0.53, phaseThreeWeakRatio: 0.22,
      shieldDamageTakenMultiplier: 0.57, weakDamageTakenMultiplier: 1.46,
      phaseTwoAttackMultiplier: 0.89, phaseTwoDamageMultiplier: 1.08,
      phaseThreeAttackMultiplier: 0.72, phaseThreeDamageMultiplier: 1.16,
      shieldLabel: 'PRESSURE SHELL', weakLabel: 'VALVE CORE OPEN', enrageLabel: 'REDLINE BOIL'
    }
  }
] as const;

export function getAllBosses(): readonly BossDefinition[] { return BOSSES; }

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
    damage: Math.max(1, Math.min(boss.maxDamage, boss.baseDamage + level * boss.damagePerChapter)),
    attackMs: Math.max(boss.minAttackMs, boss.baseAttackMs - level * boss.attackStepMs),
    reward: Math.max(1, boss.baseReward + level * boss.rewardPerChapter)
  };
}
