import { resolveLocale } from './index';

const COPY = {
  en: {
    title: 'RIFT ASCENSION', subtitle: 'PERMANENT CHAOS META', stars: 'CHAOS STARS', ascensions: 'ASCENSIONS',
    ready: 'RIFT RESET READY', reach: 'REACH CHAPTER {chapter} TO ASCEND', resetNote: 'Resets chapter, coins and crew board. Codex, Album, Core Lab and permanent unlocks stay.',
    ascend: 'ASCEND', tree: 'ASCENSION TREE', merge: 'MERGE', combat: 'COMBAT', chaos: 'CHAOS', collection: 'COLLECTION',
    unlocked: 'UNLOCKED', locked: 'LOCKED', album: 'MUTATION ALBUM', albumBody: 'Every form has Normal / Charged / Prismatic / Crowned collection states.',
    next: 'NEXT {target}/{total} • +{stars} CHAOS STAR{suffix}', complete: 'ALBUM COMPLETE • ALL MILESTONES CLAIMED', codexAlbum: 'MUTATION ALBUM {current} / {total}'
  },
  ru: {
    title: 'ВОЗНЕСЕНИЕ РАЗЛОМА', subtitle: 'ПОСТОЯННАЯ МЕТА ХАОСА', stars: 'ЗВЁЗД ХАОСА', ascensions: 'ВОЗНЕСЕНИЙ',
    ready: 'СБРОС РАЗЛОМА ГОТОВ', reach: 'ДОЙДИ ДО ГЛАВЫ {chapter}', resetNote: 'Сбрасывает главы, монеты и команду. Кодекс, Альбом, Лаборатория Ядра и постоянные открытия сохраняются.',
    ascend: 'ВОЗНЕСТИСЬ', tree: 'ДЕРЕВО ВОЗНЕСЕНИЯ', merge: 'СЛИЯНИЕ', combat: 'БОЙ', chaos: 'ХАОС', collection: 'КОЛЛЕКЦИЯ',
    unlocked: 'ОТКРЫТО', locked: 'ЗАКРЫТО', album: 'АЛЬБОМ МУТАЦИЙ', albumBody: 'У каждой формы есть обычное, заряженное, призматическое и коронованное состояния.',
    next: 'ДАЛЕЕ {target}/{total} • +{stars} ★ ХАОСА', complete: 'АЛЬБОМ ЗАВЕРШЁН • ВСЕ НАГРАДЫ ПОЛУЧЕНЫ', codexAlbum: 'АЛЬБОМ МУТАЦИЙ {current} / {total}'
  }
} as const;

export type RiftCopyKey = keyof typeof COPY.en;

export function riftCopy(key: RiftCopyKey, params: Readonly<Record<string, string | number>> = {}): string {
  const locale = resolveLocale();
  const template: string = COPY[locale][key];
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, token: string) => {
    const value = params[token];
    return value === undefined ? match : String(value);
  });
}
