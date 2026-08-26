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

const NODE_COPY = {
  en: {
    'fusion-rebate': ['Fusion Rebate', 'Every successful merge refunds 4 coins.'],
    'recruit-catalyst': ['Recruit Catalyst', 'Recruit cost is permanently reduced by 4 coins.'],
    'fortress-reboot': ['Fortress Reboot', 'Boss victories restore 20 additional fortress HP.'],
    'execution-protocol': ['Execution Protocol', 'Bosses below 12% HP take 50% more damage.'],
    'rift-capacitor': ['Rift Capacitor', 'Start every encounter with 15 Chaos Energy.'],
    'ability-recycler': ['Ability Recycler', 'Successful active ability casts refund 8 Chaos Energy.'],
    'mutation-lens': ['Mutation Lens', 'Anomaly Hunt gains +3 percentage points of mutation chance.'],
    'album-resonance': ['Album Resonance', 'Mutation Album milestones grant +1 bonus Chaos Star.']
  },
  ru: {
    'fusion-rebate': ['Возврат слияния', 'Каждое успешное слияние возвращает 4 монеты.'],
    'recruit-catalyst': ['Катализатор найма', 'Стоимость найма навсегда уменьшается на 4 монеты.'],
    'fortress-reboot': ['Перезапуск крепости', 'Победа над боссом восстанавливает ещё 20 HP крепости.'],
    'execution-protocol': ['Протокол добивания', 'Боссы ниже 12% HP получают на 50% больше урона.'],
    'rift-capacitor': ['Конденсатор Разлома', 'Каждый бой начинается с 15 энергии Хаоса.'],
    'ability-recycler': ['Рециклер способностей', 'Успешная активная способность возвращает 8 энергии Хаоса.'],
    'mutation-lens': ['Линза мутаций', 'Anomaly Hunt получает +3 п.п. к шансу мутации.'],
    'album-resonance': ['Резонанс Альбома', 'Награды Альбома дают ещё +1 Звезду Хаоса.']
  }
} as const;

export type RiftCopyKey = keyof typeof COPY.en;
export type RiftNodeCopyId = keyof typeof NODE_COPY.en;

export function riftCopy(key: RiftCopyKey, params: Readonly<Record<string, string | number>> = {}): string {
  const locale = resolveLocale();
  const template: string = COPY[locale][key];
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, token: string) => {
    const value = params[token];
    return value === undefined ? match : String(value);
  });
}

export function riftNodeCopy(id: RiftNodeCopyId, field: 'name' | 'description'): string {
  const value = NODE_COPY[resolveLocale()][id];
  return field === 'name' ? value[0] : value[1];
}
