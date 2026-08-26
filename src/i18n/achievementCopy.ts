import { resolveLocale } from './index';

export const ACHIEVEMENT_COPY_IDS = [
  'first-fusion','merge-maniac','fusion-factory','fusion-overdrive','weird-recruiter','anomaly-scout','anomaly-obsessed','wave-cleaner','chaos-cleaner','fortress-janitor','boss-breaker','boss-nightmare','core-engineer','codex-scout','codex-complete'
] as const;
export type AchievementCopyId = (typeof ACHIEVEMENT_COPY_IDS)[number];
export interface AchievementCopy { readonly name: string; readonly description: (target: number) => string; }

const EN: Readonly<Record<AchievementCopyId, AchievementCopy>> = {
  'first-fusion': { name:'FIRST FUSION', description:(target)=>`Complete ${target} merge` },
  'merge-maniac': { name:'MERGE MANIAC', description:(target)=>`Complete ${target} merges` },
  'fusion-factory': { name:'FUSION FACTORY', description:(target)=>`Complete ${target} merges` },
  'fusion-overdrive': { name:'FUSION OVERDRIVE', description:(target)=>`Complete ${target} merges` },
  'weird-recruiter': { name:'WEIRD RECRUITER', description:(target)=>`Recruit ${target} weirdos` },
  'anomaly-scout': { name:'ANOMALY SCOUT', description:(target)=>`Recruit ${target} weirdos` },
  'anomaly-obsessed': { name:'ANOMALY OBSESSED', description:(target)=>`Recruit ${target} weirdos` },
  'wave-cleaner': { name:'WAVE CLEANER', description:(target)=>`Defeat ${target} targets` },
  'chaos-cleaner': { name:'CHAOS CLEANER', description:(target)=>`Defeat ${target} targets` },
  'fortress-janitor': { name:'FORTRESS JANITOR', description:(target)=>`Defeat ${target} targets` },
  'boss-breaker': { name:'BOSS BREAKER', description:(target)=>`Defeat ${target} bosses` },
  'boss-nightmare': { name:'BOSS NIGHTMARE', description:(target)=>`Defeat ${target} bosses` },
  'core-engineer': { name:'CORE ENGINEER', description:(target)=>`Buy ${target} Core Lab upgrades` },
  'codex-scout': { name:'CODEX SCOUT', description:(target)=>`Discover ${target} creature forms` },
  'codex-complete': { name:'CODEX COMPLETE', description:(target)=>`Discover all ${target} forms` }
};
const RU: Readonly<Record<AchievementCopyId, AchievementCopy>> = {
  'first-fusion': { name:'ПЕРВОЕ СЛИЯНИЕ', description:(target)=>`Выполни ${target} слияние` },
  'merge-maniac': { name:'МАНЬЯК СЛИЯНИЙ', description:(target)=>`Выполни ${target} слияний` },
  'fusion-factory': { name:'ФАБРИКА СЛИЯНИЙ', description:(target)=>`Выполни ${target} слияний` },
  'fusion-overdrive': { name:'ФОРСАЖ СЛИЯНИЙ', description:(target)=>`Выполни ${target} слияний` },
  'weird-recruiter': { name:'ВЕРБОВЩИК ЧУДИКОВ', description:(target)=>`Призови ${target} чудиков` },
  'anomaly-scout': { name:'РАЗВЕДЧИК АНОМАЛИЙ', description:(target)=>`Призови ${target} чудиков` },
  'anomaly-obsessed': { name:'ОДЕРЖИМЫЙ АНОМАЛИЯМИ', description:(target)=>`Призови ${target} чудиков` },
  'wave-cleaner': { name:'ЧИСТИЛЬЩИК ВОЛН', description:(target)=>`Победи ${target} целей` },
  'chaos-cleaner': { name:'ЧИСТИЛЬЩИК ХАОСА', description:(target)=>`Победи ${target} целей` },
  'fortress-janitor': { name:'УБОРЩИК КРЕПОСТИ', description:(target)=>`Победи ${target} целей` },
  'boss-breaker': { name:'ЛОМАТЕЛЬ БОССОВ', description:(target)=>`Победи ${target} боссов` },
  'boss-nightmare': { name:'КОШМАР БОССОВ', description:(target)=>`Победи ${target} боссов` },
  'core-engineer': { name:'ИНЖЕНЕР ЯДРА', description:(target)=>`Купи ${target} улучшения Лаборатории Ядра` },
  'codex-scout': { name:'РАЗВЕДЧИК КОДЕКСА', description:(target)=>`Открой ${target} форм существ` },
  'codex-complete': { name:'КОДЕКС ЗАВЕРШЁН', description:(target)=>`Открой все ${target} форм` }
};

export function getAchievementCopy(id: AchievementCopyId, target: number): { readonly name: string; readonly description: string } {
  const entry = (resolveLocale() === 'ru' ? RU : EN)[id];
  return { name: entry.name, description: entry.description(target) };
}
