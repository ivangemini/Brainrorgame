import type { AscensionBranch, AscensionNodeId } from '../systems/ascension';
import type { SupportedLocale } from './index';

interface AscensionNodeCopy {
  readonly name: string;
  readonly description: string;
}

interface AscensionCopy {
  readonly title: string;
  readonly currency: string;
  readonly ascend: string;
  readonly locked: string;
  readonly pushDeeper: string;
  readonly weeklyBlocked: string;
  readonly branches: Readonly<Record<AscensionBranch, string>>;
  readonly nodes: Readonly<Record<AscensionNodeId, AscensionNodeCopy>>;
}

const EN: AscensionCopy = {
  title: 'ASCENSION CORE',
  currency: 'CHAOS STARS',
  ascend: 'ASCEND',
  locked: 'Reach Rift Chapter 21',
  pushDeeper: 'Push 5 chapters deeper for the next Star cache',
  weeklyBlocked: 'Finish the active Weekly Chaos attempt first',
  branches: { merge: 'MERGE', combat: 'COMBAT', chaos: 'CHAOS', collection: 'COLLECTION' },
  nodes: {
    'merge-seed-cache': { name: 'SEED CACHE', description: 'Start each new Ascension with 2 Recruit credits.' },
    'merge-echo': { name: 'MERGE ECHO', description: 'Every 8th merge returns 1 Recruit credit.' },
    'merge-catalyst': { name: 'MUTATION CATALYST', description: 'The first tier-5 merge each chapter gains a mutation boost.' },
    'combat-last-stand': { name: 'LAST STAND', description: 'Once per Ascension, lethal fortress damage leaves 1 HP.' },
    'combat-boss-window': { name: 'BOSS WINDOW', description: 'Bosses delay their opening attack by 1.5 seconds.' },
    'combat-victory-repair': { name: 'VICTORY REPAIR', description: 'Boss defeats repair 20% of fortress maximum HP.' },
    'chaos-reroute': { name: 'CHAOS REROUTE', description: 'Gain 1 Chaos Draft reroll each chapter.' },
    'chaos-bank': { name: 'CHAOS BANK', description: 'Carry 25% of Chaos Energy through chapter transitions.' },
    'chaos-fourth-door': { name: 'FOURTH DOOR', description: 'Every 5th chapter, Chaos Draft offers an extra choice.' },
    'collection-pity-memory': { name: 'PITY MEMORY', description: 'Keep 50% of Anomaly and Crown Signal progress after Ascension.' },
    'collection-album-cache': { name: 'ALBUM CACHE', description: 'First new Album discovery each Ascension grants 1 Core Shard.' },
    'collection-signal-map': { name: 'SIGNAL MAP', description: 'Reveal one currently undiscovered Album target as a hunt lead.' }
  }
};

const RU: AscensionCopy = {
  title: 'ЯДРО ВОЗНЕСЕНИЯ',
  currency: 'ЗВЁЗДЫ ХАОСА',
  ascend: 'ВОЗНЕСТИСЬ',
  locked: 'Дойди до главы Разлома 21',
  pushDeeper: 'Пройди ещё 5 глав для следующего запаса Звёзд',
  weeklyBlocked: 'Сначала заверши активный Weekly Chaos',
  branches: { merge: 'СЛИЯНИЕ', combat: 'БОЙ', chaos: 'ХАОС', collection: 'КОЛЛЕКЦИЯ' },
  nodes: {
    'merge-seed-cache': { name: 'СТАРТОВЫЙ ЗАПАС', description: 'Каждое Вознесение начинается с 2 бесплатных Recruit.' },
    'merge-echo': { name: 'ЭХО СЛИЯНИЯ', description: 'Каждое 8-е слияние возвращает 1 Recruit.' },
    'merge-catalyst': { name: 'КАТАЛИЗАТОР МУТАЦИИ', description: 'Первое слияние 5-го уровня в главе получает усиление мутации.' },
    'combat-last-stand': { name: 'ПОСЛЕДНИЙ РУБЕЖ', description: 'Раз за Вознесение смертельный удар оставляет крепости 1 HP.' },
    'combat-boss-window': { name: 'ОКНО БОССА', description: 'Босс задерживает первую атаку на 1,5 секунды.' },
    'combat-victory-repair': { name: 'РЕМОНТ ПОСЛЕ ПОБЕДЫ', description: 'Победа над боссом восстанавливает 20% максимального HP крепости.' },
    'chaos-reroute': { name: 'ПЕРЕНАПРАВЛЕНИЕ ХАОСА', description: '1 переброс Chaos Draft в каждой главе.' },
    'chaos-bank': { name: 'БАНК ХАОСА', description: '25% Chaos Energy сохраняется между главами.' },
    'chaos-fourth-door': { name: 'ЧЕТВЁРТАЯ ДВЕРЬ', description: 'Каждую 5-ю главу Chaos Draft предлагает дополнительный выбор.' },
    'collection-pity-memory': { name: 'ПАМЯТЬ ГАРАНТА', description: 'После Вознесения сохраняется 50% Anomaly и Crown Signal.' },
    'collection-album-cache': { name: 'ТАЙНИК АЛЬБОМА', description: 'Первая новая запись Альбома за Вознесение даёт 1 Core Shard.' },
    'collection-signal-map': { name: 'КАРТА СИГНАЛОВ', description: 'Показывает одну ещё не открытую цель Альбома для охоты.' }
  }
};

export function getAscensionCopy(locale: SupportedLocale): AscensionCopy {
  return locale === 'ru' ? RU : EN;
}
