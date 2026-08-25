export const SUPPORTED_LOCALES = ['en', 'ru'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const EN = {
  'boot.title': 'BRAINROR MERGE',
  'hud.wave': 'WAVE {current} / {total}',
  'hud.boss': 'BOSS {chapter}',
  'hud.chaosGate': 'CHAOS GATE {current} / {total}',
  'hud.fortress': 'FORTRESS {hp}',
  'hud.endless': 'ENDLESS {stage}',
  'hud.rift': 'RIFT {tier}',
  'hud.recruit': 'RECRUIT  •  {cost}',
  'hud.anomaly': 'ANOMALY {current} / {max}',
  'hud.crownSignal': 'CROWN SIGNAL {current} / {max}',
  'hud.upgrades': 'UPGRADES',
  'hud.world': 'WORLD {number} • {name}',
  'common.claim': 'CLAIM',
  'common.claimed': 'CLAIMED',
  'common.done': 'DONE',
  'common.locked': 'LOCKED',
  'common.close': 'CLOSE',
  'common.maxed': 'MAXED',
  'common.coins': 'COINS',
  'common.core': 'CORE',
  'common.shard': 'SHARD',
  'common.shards': 'SHARDS',
  'common.level': 'LEVEL {current} / {max}',
  'daily.title': 'DAILY CHAOS',
  'daily.streak': 'STREAK {current} / 7',
  'daily.nextReward': 'NEXT: {coins} COINS{core}',
  'daily.missions': "TODAY'S MISSIONS",
  'daily.chest': 'DAILY CHAOS CHEST',
  'daily.missionProgress': '{current} / {total} MISSIONS',
  'daily.chestCracked': 'CHEST CRACKED',
  'daily.bonusClaimed': 'BONUS CLAIMED',
  'daily.rewardClaimed': 'REWARD CLAIMED',
  'daily.hint': 'Finish all three missions to crack the Chaos Chest. Daily reset uses UTC.',
  'lab.title': 'CORE LAB',
  'lab.subtitle': 'PERMANENT UPGRADES',
  'lab.hint': 'Bosses drop Core Shards. Effects apply instantly.',
  'codex.title': 'CHAOS CODEX',
  'codex.discovered': '{current} / {total} discovered',
  'codex.discoveries': 'DISCOVERIES',
  'codex.forms': 'FORMS {start}–{end} / {total}  •  PAGE {page}/{pages}',
  'codex.ascend': 'T3 TWINS • SAME RARITY → ASCEND',
  'codex.achievements': 'ACHIEVEMENTS'
} as const;

export type TranslationKey = keyof typeof EN;
type Dictionary = Readonly<Record<TranslationKey, string>>;

const RU: Dictionary = {
  'boot.title': 'BRAINROR MERGE',
  'hud.wave': 'ВОЛНА {current} / {total}',
  'hud.boss': 'БОСС {chapter}',
  'hud.chaosGate': 'ВРАТА ХАОСА {current} / {total}',
  'hud.fortress': 'КРЕПОСТЬ {hp}',
  'hud.endless': 'БЕСКОНЕЧНО {stage}',
  'hud.rift': 'РАЗЛОМ {tier}',
  'hud.recruit': 'ПРИЗЫВ  •  {cost}',
  'hud.anomaly': 'АНОМАЛИЯ {current} / {max}',
  'hud.crownSignal': 'СИГНАЛ КОРОНЫ {current} / {max}',
  'hud.upgrades': 'УЛУЧШЕНИЯ',
  'hud.world': 'МИР {number} • {name}',
  'common.claim': 'ЗАБРАТЬ',
  'common.claimed': 'ПОЛУЧЕНО',
  'common.done': 'ГОТОВО',
  'common.locked': 'ЗАКРЫТО',
  'common.close': 'ЗАКРЫТЬ',
  'common.maxed': 'МАКС.',
  'common.coins': 'МОНЕТ',
  'common.core': 'ЯДРО',
  'common.shard': 'ОСКОЛОК',
  'common.shards': 'ОСКОЛКОВ',
  'common.level': 'УРОВЕНЬ {current} / {max}',
  'daily.title': 'ЕЖЕДНЕВНЫЙ ХАОС',
  'daily.streak': 'СЕРИЯ {current} / 7',
  'daily.nextReward': 'ДАЛЕЕ: {coins} МОНЕТ{core}',
  'daily.missions': 'ЗАДАНИЯ НА СЕГОДНЯ',
  'daily.chest': 'СУНДУК ХАОСА',
  'daily.missionProgress': '{current} / {total} ЗАДАНИЙ',
  'daily.chestCracked': 'СУНДУК ОТКРЫТ',
  'daily.bonusClaimed': 'БОНУС ПОЛУЧЕН',
  'daily.rewardClaimed': 'НАГРАДА ПОЛУЧЕНА',
  'daily.hint': 'Выполни все три задания, чтобы открыть Сундук Хаоса. Сброс происходит по UTC.',
  'lab.title': 'ЛАБОРАТОРИЯ ЯДРА',
  'lab.subtitle': 'ПОСТОЯННЫЕ УЛУЧШЕНИЯ',
  'lab.hint': 'Боссы дают Осколки Ядра. Эффекты применяются сразу.',
  'codex.title': 'КОДЕКС ХАОСА',
  'codex.discovered': 'открыто {current} / {total}',
  'codex.discoveries': 'ОТКРЫТЫЕ ФОРМЫ',
  'codex.forms': 'ФОРМЫ {start}–{end} / {total}  •  СТР. {page}/{pages}',
  'codex.ascend': 'ДВЕ T3 • ОДНА РЕДКОСТЬ → ВОЗНЕСЕНИЕ',
  'codex.achievements': 'ДОСТИЖЕНИЯ'
};

const DICTIONARIES: Readonly<Record<SupportedLocale, Dictionary>> = { en: EN, ru: RU };

export function normalizeLocale(value: string | null | undefined): SupportedLocale | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace('_', '-');
  if (normalized === 'en' || normalized.startsWith('en-')) return 'en';
  if (normalized === 'ru' || normalized.startsWith('ru-')) return 'ru';
  return null;
}

export function resolveLocale(search?: string, languages?: readonly string[]): SupportedLocale {
  const query = search ?? (typeof location !== 'undefined' ? location.search : '');
  const params = new URLSearchParams(query);
  const explicit = normalizeLocale(params.get('lang'));
  if (explicit) return explicit;
  const preferred = languages ?? (typeof navigator !== 'undefined' ? navigator.languages : []);
  for (const language of preferred) {
    const resolved = normalizeLocale(language);
    if (resolved) return resolved;
  }
  return 'en';
}

export function translate(
  key: TranslationKey,
  params: Readonly<Record<string, string | number>> = {},
  locale: SupportedLocale = resolveLocale()
): string {
  const template = DICTIONARIES[locale][key] ?? EN[key];
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, token: string) => {
    const value = params[token];
    return value === undefined ? match : String(value);
  });
}

export function getDictionary(locale: SupportedLocale): Dictionary { return DICTIONARIES[locale]; }
