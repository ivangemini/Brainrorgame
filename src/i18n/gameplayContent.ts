import { resolveLocale, type SupportedLocale } from './index';
import type { DailyMissionId } from '../systems/dailyRetention';
import type { MetaUpgradeId } from '../systems/metaProgression';

interface LocalizedText { readonly name: string; readonly description: string; }

const DAILY: Readonly<Record<SupportedLocale, Readonly<Record<DailyMissionId, string>>>> = {
  en: { merge: 'Merge 3 times', defeat: 'Defeat 6 enemies', recruit: 'Recruit 3 weirdos' },
  ru: { merge: 'Объедини 3 раза', defeat: 'Победи 6 врагов', recruit: 'Призови 3 чудиков' }
};

const META: Readonly<Record<SupportedLocale, Readonly<Record<MetaUpgradeId, LocalizedText>>>> = {
  en: {
    power: { name: 'CREW REACTOR', description: '+8% crew damage per level' },
    armor: { name: 'FORTRESS PLATE', description: '-6% incoming damage per level' },
    bounty: { name: 'BOUNTY COIL', description: '+10% coin rewards per level' }
  },
  ru: {
    power: { name: 'РЕАКТОР КОМАНДЫ', description: '+8% к урону команды за уровень' },
    armor: { name: 'БРОНЯ КРЕПОСТИ', description: '-6% входящего урона за уровень' },
    bounty: { name: 'КАТУШКА НАГРАД', description: '+10% монет за уровень' }
  }
};

export function localizedDailyMissionName(id: DailyMissionId, locale: SupportedLocale = resolveLocale()): string {
  return DAILY[locale][id];
}

export function localizedMetaUpgrade(id: MetaUpgradeId, locale: SupportedLocale = resolveLocale()): LocalizedText {
  return META[locale][id];
}

export function localizedMetaEffect(id: MetaUpgradeId, level: number, locale: SupportedLocale = resolveLocale()): string {
  if (locale === 'en') {
    if (id === 'power') return `+${level * 8}% DAMAGE`;
    if (id === 'armor') return `-${level * 6}% DAMAGE TAKEN`;
    return `+${level * 10}% COINS`;
  }
  if (id === 'power') return `+${level * 8}% УРОНА`;
  if (id === 'armor') return `-${level * 6}% ПОЛУЧАЕМОГО УРОНА`;
  return `+${level * 10}% МОНЕТ`;
}
