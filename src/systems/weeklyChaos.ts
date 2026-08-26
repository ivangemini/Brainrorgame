export const WEEKLY_CHAOS_MAX_DEPTH = 12;
export const WEEKLY_CHAOS_RULE_COUNT = 3;

export type WeeklyChaosRuleId =
  | 'overclocked-crew'
  | 'thick-static'
  | 'glass-fortress'
  | 'price-spike'
  | 'unstable-loot'
  | 'cheap-trouble';

export interface WeeklyChaosModifiers {
  readonly squadDamage: number;
  readonly attackInterval: number;
  readonly incomingDamage: number;
  readonly enemyHp: number;
  readonly coinRewards: number;
  readonly recruitCost: number;
}

export interface WeeklyChaosRule {
  readonly id: WeeklyChaosRuleId;
  readonly accentColor: number;
  readonly modifiers: Partial<WeeklyChaosModifiers>;
}

export interface WeeklyChaosProgress {
  readonly weekId: number;
  readonly active: boolean;
  readonly depth: number;
  readonly bestDepth: number;
  readonly runsStarted: number;
  readonly claimedMilestones: readonly number[];
}

export interface WeeklyChaosMilestone {
  readonly target: number;
  readonly coins: number;
  readonly coreShards: number;
}

export const WEEKLY_CHAOS_MILESTONES: readonly WeeklyChaosMilestone[] = [
  { target: 3, coins: 160, coreShards: 0 },
  { target: 6, coins: 280, coreShards: 1 },
  { target: 9, coins: 420, coreShards: 1 },
  { target: WEEKLY_CHAOS_MAX_DEPTH, coins: 650, coreShards: 2 }
] as const;

export const WEEKLY_CHAOS_RULES: readonly WeeklyChaosRule[] = [
  {
    id: 'overclocked-crew',
    accentColor: 0x72e5ff,
    modifiers: { attackInterval: 0.9, incomingDamage: 1.08 }
  },
  {
    id: 'thick-static',
    accentColor: 0xa9a2ff,
    modifiers: { enemyHp: 1.18, coinRewards: 1.18 }
  },
  {
    id: 'glass-fortress',
    accentColor: 0xff7d9b,
    modifiers: { squadDamage: 1.18, incomingDamage: 1.18 }
  },
  {
    id: 'price-spike',
    accentColor: 0xffd768,
    modifiers: { recruitCost: 1.2, coinRewards: 1.15 }
  },
  {
    id: 'unstable-loot',
    accentColor: 0x91f0a9,
    modifiers: { enemyHp: 1.12, squadDamage: 1.1, coinRewards: 1.12 }
  },
  {
    id: 'cheap-trouble',
    accentColor: 0xffa15f,
    modifiers: { recruitCost: 0.85, enemyHp: 1.15 }
  }
] as const;

const NEUTRAL_MODIFIERS: WeeklyChaosModifiers = {
  squadDamage: 1,
  attackInterval: 1,
  incomingDamage: 1,
  enemyHp: 1,
  coinRewards: 1,
  recruitCost: 1
};

export function weeklyChaosWeekId(now = Date.now()): number {
  const date = new Date(now);
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekday = day.getUTCDay() || 7;
  day.setUTCDate(day.getUTCDate() + 4 - weekday);
  const weekYear = day.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const week = Math.ceil((((day.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
  return weekYear * 100 + week;
}

export function weeklyChaosSeed(weekId: number): number {
  let hash = 0x811c9dc5;
  const value = `brainror-weekly-${weekId}`;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function getWeeklyChaosRules(weekId: number): readonly WeeklyChaosRule[] {
  const pool = [...WEEKLY_CHAOS_RULES];
  let seed = weeklyChaosSeed(weekId);
  const selected: WeeklyChaosRule[] = [];
  while (selected.length < WEEKLY_CHAOS_RULE_COUNT && pool.length > 0) {
    seed = nextSeed(seed);
    const index = seed % pool.length;
    const [rule] = pool.splice(index, 1);
    if (rule) selected.push(rule);
  }
  return selected;
}

export function getWeeklyChaosModifiers(progress: WeeklyChaosProgress): WeeklyChaosModifiers {
  if (!progress.active) return NEUTRAL_MODIFIERS;
  return combineWeeklyChaosRules(getWeeklyChaosRules(progress.weekId));
}

export function combineWeeklyChaosRules(rules: readonly WeeklyChaosRule[]): WeeklyChaosModifiers {
  return rules.reduce<WeeklyChaosModifiers>((combined, rule) => ({
    squadDamage: combined.squadDamage * (rule.modifiers.squadDamage ?? 1),
    attackInterval: combined.attackInterval * (rule.modifiers.attackInterval ?? 1),
    incomingDamage: combined.incomingDamage * (rule.modifiers.incomingDamage ?? 1),
    enemyHp: combined.enemyHp * (rule.modifiers.enemyHp ?? 1),
    coinRewards: combined.coinRewards * (rule.modifiers.coinRewards ?? 1),
    recruitCost: combined.recruitCost * (rule.modifiers.recruitCost ?? 1)
  }), { ...NEUTRAL_MODIFIERS });
}

export function createDefaultWeeklyChaosProgress(now = Date.now()): WeeklyChaosProgress {
  return {
    weekId: weeklyChaosWeekId(now),
    active: false,
    depth: 0,
    bestDepth: 0,
    runsStarted: 0,
    claimedMilestones: []
  };
}

export function rollWeeklyChaosProgress(progress: WeeklyChaosProgress, now = Date.now()): WeeklyChaosProgress {
  const weekId = weeklyChaosWeekId(now);
  return progress.weekId === weekId ? progress : createDefaultWeeklyChaosProgress(now);
}

export function startWeeklyChaosRun(progress: WeeklyChaosProgress, now = Date.now()): {
  readonly started: boolean;
  readonly progress: WeeklyChaosProgress;
} {
  const current = rollWeeklyChaosProgress(progress, now);
  if (current.active) return { started: false, progress: current };
  return {
    started: true,
    progress: {
      ...current,
      active: true,
      depth: 0,
      runsStarted: Math.min(1_000_000, current.runsStarted + 1)
    }
  };
}

export function advanceWeeklyChaosRun(progress: WeeklyChaosProgress): {
  readonly advanced: boolean;
  readonly completed: boolean;
  readonly reachedMilestone: WeeklyChaosMilestone | null;
  readonly progress: WeeklyChaosProgress;
} {
  if (!progress.active) {
    return { advanced: false, completed: false, reachedMilestone: null, progress };
  }
  const depth = Math.min(WEEKLY_CHAOS_MAX_DEPTH, progress.depth + 1);
  const completed = depth >= WEEKLY_CHAOS_MAX_DEPTH;
  const reachedMilestone = WEEKLY_CHAOS_MILESTONES.find((milestone) => milestone.target === depth) ?? null;
  return {
    advanced: true,
    completed,
    reachedMilestone,
    progress: {
      ...progress,
      active: !completed,
      depth,
      bestDepth: Math.max(progress.bestDepth, depth)
    }
  };
}

export function failWeeklyChaosRun(progress: WeeklyChaosProgress): {
  readonly failed: boolean;
  readonly depth: number;
  readonly progress: WeeklyChaosProgress;
} {
  if (!progress.active) return { failed: false, depth: progress.depth, progress };
  return {
    failed: true,
    depth: progress.depth,
    progress: { ...progress, active: false }
  };
}

export function hasWeeklyChaosClaimAvailable(progress: WeeklyChaosProgress): boolean {
  return WEEKLY_CHAOS_MILESTONES.some(
    (milestone) => progress.bestDepth >= milestone.target && !progress.claimedMilestones.includes(milestone.target)
  );
}

export function claimWeeklyChaosMilestone(progress: WeeklyChaosProgress, target: number): {
  readonly claimed: boolean;
  readonly reward: { readonly coins: number; readonly coreShards: number };
  readonly progress: WeeklyChaosProgress;
} {
  const milestone = WEEKLY_CHAOS_MILESTONES.find((entry) => entry.target === target);
  if (!milestone || progress.bestDepth < target || progress.claimedMilestones.includes(target)) {
    return { claimed: false, reward: { coins: 0, coreShards: 0 }, progress };
  }
  return {
    claimed: true,
    reward: { coins: milestone.coins, coreShards: milestone.coreShards },
    progress: { ...progress, claimedMilestones: [...progress.claimedMilestones, target] }
  };
}

export function weeklyRecruitCost(baseCost: number, progress: WeeklyChaosProgress): number {
  return Math.max(1, Math.round(baseCost * getWeeklyChaosModifiers(progress).recruitCost));
}

export function isWeeklyChaosRuleId(value: unknown): value is WeeklyChaosRuleId {
  return typeof value === 'string' && WEEKLY_CHAOS_RULES.some((rule) => rule.id === value);
}

function nextSeed(seed: number): number {
  let value = seed || 0x6d2b79f5;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return value >>> 0;
}
