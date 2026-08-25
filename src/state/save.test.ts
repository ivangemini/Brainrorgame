import { describe, expect, it } from 'vitest';
import { createStarterBoard } from '../systems/board';
import { createDefaultCollectionProgress, discoverCreature } from '../systems/collectionProgression';
import { createDefaultDailyState } from '../systems/dailyRetention';
import { BOSS_STEP } from '../systems/encounters';
import { createDefaultMetaUpgradeLevels } from '../systems/metaProgression';
import { createDefaultOnboardingState } from '../systems/onboarding';
import { createGameSave, parseGameSave } from './save';

function makeSnapshot() {
  const board = createStarterBoard();
  return {
    coins: 140,
    coreShards: 3,
    upgrades: { power: 2, armor: 1, bounty: 0 },
    daily: createDefaultDailyState(Date.parse('2026-08-25T12:00:00.000Z')),
    collection: createDefaultCollectionProgress(board),
    onboarding: createDefaultOnboardingState(),
    baseHp: 77,
    chapter: 3,
    encounterStep: 2 as const,
    targetHpMax: 800,
    targetHp: 520,
    recruitSerial: 4,
    board,
    chaosPerks: ['impact-jelly', 'repair-moss'] as const
  };
}

function makeLegacyBoard() {
  return createStarterBoard().map((unit) => unit ? { id: unit.id, family: unit.family, level: unit.level } : null);
}

describe('game save', () => {
  it('round-trips a valid v9 snapshot with chapter perks', () => {
    const save = createGameSave(makeSnapshot(), 12345);
    expect(save.version).toBe(9);
    expect(save.chaosPerks).toEqual(['impact-jelly', 'repair-moss']);
    expect(parseGameSave(save)).toEqual(save);
  });

  it('migrates a valid v8 save with an empty chapter build', () => {
    const current = createGameSave(makeSnapshot(), 12346);
    const { chaosPerks: _removed, ...legacy } = current;
    const migrated = parseGameSave({ ...legacy, version: 8 });
    expect(migrated?.version).toBe(9);
    expect(migrated?.chaosPerks).toEqual([]);
  });

  it('round-trips the new late-wave and boss encounter steps', () => {
    const waveFour = createGameSave({ ...makeSnapshot(), encounterStep: 3 }, 23001);
    const gate = createGameSave({ ...makeSnapshot(), encounterStep: 4 }, 23002);
    const boss = createGameSave({ ...makeSnapshot(), encounterStep: BOSS_STEP }, 23003);
    expect(parseGameSave(waveFour)?.encounterStep).toBe(3);
    expect(parseGameSave(gate)?.encounterStep).toBe(4);
    expect(parseGameSave(boss)?.encounterStep).toBe(BOSS_STEP);
  });

  it('round-trips a mutated Lampalotl unit', () => {
    const snapshot = makeSnapshot();
    const board = [...snapshot.board];
    board[8] = { id: 'lamp-save', family: 'lampalotl', level: 2, mutation: 'prismatic' };
    const collection = discoverCreature(snapshot.collection, 'lampalotl-2');
    const save = createGameSave({ ...snapshot, board, collection }, 22222);
    const parsed = parseGameSave(save);
    expect(parsed?.version).toBe(9);
    expect(parsed?.board[8]).toEqual({ id: 'lamp-save', family: 'lampalotl', level: 2, mutation: 'prismatic' });
    expect(parsed?.collection.discovered).toContain('lampalotl-2');
  });

  it('migrates a historical v7 boss step into the new step 5 boss position', () => {
    const snapshot = makeSnapshot();
    const oldSave = {
      version: 7,
      updatedAt: 30000,
      coins: snapshot.coins,
      coreShards: snapshot.coreShards,
      upgrades: snapshot.upgrades,
      daily: snapshot.daily,
      collection: snapshot.collection,
      onboarding: { step: 'complete', completedAt: 25000 },
      baseHp: snapshot.baseHp,
      chapter: 4,
      encounterStep: 3,
      targetHpMax: 930,
      targetHp: 410,
      recruitSerial: snapshot.recruitSerial,
      board: snapshot.board
    };
    const migrated = parseGameSave(oldSave);
    expect(migrated?.version).toBe(9);
    expect(migrated?.encounterStep).toBe(BOSS_STEP);
    expect(migrated?.targetHpMax).toBe(930);
    expect(migrated?.targetHp).toBe(410);
    expect(migrated?.chaosPerks).toEqual([]);
  });

  it('keeps historical v7 wave steps before the old boss unchanged', () => {
    const snapshot = makeSnapshot();
    const oldSave = {
      version: 7,
      updatedAt: 30000,
      coins: snapshot.coins,
      coreShards: snapshot.coreShards,
      upgrades: snapshot.upgrades,
      daily: snapshot.daily,
      collection: snapshot.collection,
      onboarding: { step: 'complete', completedAt: 25000 },
      baseHp: snapshot.baseHp,
      chapter: 4,
      encounterStep: 2,
      targetHpMax: 500,
      targetHp: 250,
      recruitSerial: snapshot.recruitSerial,
      board: snapshot.board
    };
    expect(parseGameSave(oldSave)?.encounterStep).toBe(2);
  });

  it('migrates v2 saves through v9 and preserves progression', () => {
    const oldSave = {
      version: 2,
      updatedAt: Date.parse('2026-08-24T12:00:00.000Z'),
      coins: 90,
      baseHp: 88,
      chapter: 4,
      encounterStep: 1,
      targetHpMax: 500,
      targetHp: 300,
      recruitSerial: 2,
      board: makeLegacyBoard()
    };
    const migrated = parseGameSave(oldSave);
    expect(migrated?.version).toBe(9);
    expect(migrated?.coreShards).toBe(3);
    expect(migrated?.upgrades).toEqual(createDefaultMetaUpgradeLevels());
    expect(migrated?.daily.streak).toBe(0);
    expect(migrated?.collection.discovered).toEqual(['pinguino-1', 'toastodilo-1']);
    expect(migrated?.collection.stats.bosses).toBe(3);
    expect(migrated?.onboarding.step).toBe('complete');
    expect(migrated?.board[0]?.mutation).toBe('none');
    expect(migrated?.chaosPerks).toEqual([]);
  });

  it('migrates v3 boss saves through the extended chapter migration', () => {
    const oldSave = {
      version: 3,
      updatedAt: Date.parse('2026-08-25T08:00:00.000Z'),
      coins: 220,
      coreShards: 4,
      upgrades: { power: 1, armor: 2, bounty: 3 },
      baseHp: 91,
      chapter: 6,
      encounterStep: 3,
      targetHpMax: 950,
      targetHp: 700,
      recruitSerial: 8,
      board: makeLegacyBoard()
    };
    const migrated = parseGameSave(oldSave);
    expect(migrated?.version).toBe(9);
    expect(migrated?.encounterStep).toBe(BOSS_STEP);
    expect(migrated?.daily.dayKey).toBe('2026-08-25');
    expect(migrated?.daily.counters).toEqual({ merge: 0, defeat: 0, recruit: 0 });
    expect(migrated?.collection.stats.bosses).toBe(5);
    expect(migrated?.collection.stats.upgrades).toBe(6);
    expect(migrated?.onboarding.completedAt).toBe(Date.parse('2026-08-25T08:00:00.000Z'));
  });

  it('migrates v4 saves without losing daily data', () => {
    const snapshot = makeSnapshot();
    const oldSave = {
      version: 4,
      updatedAt: Date.parse('2026-08-25T09:00:00.000Z'),
      coins: snapshot.coins,
      coreShards: snapshot.coreShards,
      upgrades: snapshot.upgrades,
      daily: snapshot.daily,
      baseHp: snapshot.baseHp,
      chapter: snapshot.chapter,
      encounterStep: snapshot.encounterStep,
      targetHpMax: snapshot.targetHpMax,
      targetHp: snapshot.targetHp,
      recruitSerial: snapshot.recruitSerial,
      board: makeLegacyBoard()
    };
    const migrated = parseGameSave(oldSave);
    expect(migrated?.version).toBe(9);
    expect(migrated?.daily).toEqual(snapshot.daily);
    expect(migrated?.collection.stats.recruits).toBe(snapshot.recruitSerial);
    expect(migrated?.onboarding.step).toBe('complete');
  });

  it('migrates a valid v5 save as already onboarded', () => {
    const snapshot = makeSnapshot();
    const oldSave = {
      version: 5,
      updatedAt: 777,
      coins: snapshot.coins,
      coreShards: snapshot.coreShards,
      upgrades: snapshot.upgrades,
      daily: snapshot.daily,
      collection: snapshot.collection,
      baseHp: snapshot.baseHp,
      chapter: snapshot.chapter,
      encounterStep: snapshot.encounterStep,
      targetHpMax: snapshot.targetHpMax,
      targetHp: snapshot.targetHp,
      recruitSerial: snapshot.recruitSerial,
      board: makeLegacyBoard()
    };
    const migrated = parseGameSave(oldSave);
    expect(migrated?.version).toBe(9);
    expect(migrated?.onboarding).toEqual({ step: 'complete', completedAt: 777 });
  });

  it('migrates v6 boards to explicit common mutation state', () => {
    const snapshot = makeSnapshot();
    const oldSave = {
      version: 6,
      updatedAt: 888,
      coins: snapshot.coins,
      coreShards: snapshot.coreShards,
      upgrades: snapshot.upgrades,
      daily: snapshot.daily,
      collection: snapshot.collection,
      onboarding: { step: 'complete', completedAt: 777 },
      baseHp: snapshot.baseHp,
      chapter: snapshot.chapter,
      encounterStep: snapshot.encounterStep,
      targetHpMax: snapshot.targetHpMax,
      targetHp: snapshot.targetHp,
      recruitSerial: snapshot.recruitSerial,
      board: makeLegacyBoard()
    };
    const migrated = parseGameSave(oldSave);
    expect(migrated?.version).toBe(9);
    expect(migrated?.board.filter(Boolean).every((unit) => unit?.mutation === 'none')).toBe(true);
  });

  it('clamps upgrade levels, collection stats and target HP to supported maximums', () => {
    const save = createGameSave(makeSnapshot(), 12345);
    const parsed = parseGameSave({
      ...save,
      targetHp: 9999,
      upgrades: { power: 999, armor: 999, bounty: 999 },
      collection: {
        ...save.collection,
        stats: { merges: 2_000_000_000, recruits: 0, defeats: 0, bosses: 0, upgrades: 0 }
      }
    });
    expect(parsed?.targetHp).toBe(800);
    expect(parsed?.upgrades).toEqual({ power: 10, armor: 8, bounty: 10 });
    expect(parsed?.collection.stats.merges).toBe(1_000_000_000);
  });

  it('rejects malformed or duplicate chaos perks', () => {
    const save = createGameSave(makeSnapshot());
    expect(parseGameSave({ ...save, chaosPerks: ['copied-meme'] })).toBeNull();
    expect(parseGameSave({ ...save, chaosPerks: ['impact-jelly', 'impact-jelly'] })).toBeNull();
    expect(parseGameSave({ ...save, chaosPerks: ['impact-jelly', 'repair-moss', 'tempo-worm'] })).toBeNull();
  });

  it('rejects malformed onboarding state', () => {
    const save = createGameSave(makeSnapshot());
    expect(parseGameSave({ ...save, onboarding: { step: 'complete', completedAt: null } })).toBeNull();
  });

  it('rejects malformed collection data', () => {
    const save = createGameSave(makeSnapshot());
    expect(parseGameSave({ ...save, collection: { ...save.collection, discovered: ['copied-meme'] } })).toBeNull();
  });

  it('rejects malformed daily state', () => {
    const save = createGameSave(makeSnapshot());
    expect(parseGameSave({ ...save, daily: { ...save.daily, dayKey: 'not-a-day' } })).toBeNull();
  });

  it('rejects malformed upgrade data', () => {
    const save = createGameSave(makeSnapshot());
    expect(parseGameSave({ ...save, upgrades: { power: 'max', armor: 0, bounty: 0 } })).toBeNull();
  });

  it('rejects unsupported v9 encounter steps', () => {
    const save = createGameSave(makeSnapshot());
    expect(parseGameSave({ ...save, encounterStep: 6 })).toBeNull();
  });

  it('rejects malformed board mutation data in v9', () => {
    const save = createGameSave(makeSnapshot());
    const board = [...save.board];
    const first = board[0];
    if (!first) throw new Error('Expected starter unit');
    board[0] = { ...first, mutation: 'impossible' } as never;
    expect(parseGameSave({ ...save, board })).toBeNull();
  });

  it('rejects v9 board units that omit mutation', () => {
    const save = createGameSave(makeSnapshot());
    const board = save.board.map((unit) => unit ? { id: unit.id, family: unit.family, level: unit.level } : null);
    expect(parseGameSave({ ...save, board })).toBeNull();
  });
});
