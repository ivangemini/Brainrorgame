import { describe, expect, it } from 'vitest';
import { createDefaultAnomalyHuntState } from '../systems/anomalyHunt';
import { createDefaultAscensionProgress } from '../systems/ascension';
import { createStarterBoard } from '../systems/board';
import { createBossHuntProgress, createDefaultBossTrophyRoomProgress } from '../systems/bossHunt';
import { createDefaultCollectionProgress, discoverCreature } from '../systems/collectionProgression';
import { createDefaultDailyState } from '../systems/dailyRetention';
import { BOSS_STEP } from '../systems/encounters';
import { createDefaultMetaUpgradeLevels } from '../systems/metaProgression';
import { backfillMutationAlbumProgress } from '../systems/mutationAlbum';
import { createDefaultOnboardingState } from '../systems/onboarding';
import {
  advanceWeeklyChaosRun,
  createDefaultWeeklyChaosProgress,
  startWeeklyChaosRun
} from '../systems/weeklyChaos';
import { createGameSave, parseGameSave } from './save';

const SNAPSHOT_NOW = Date.parse('2026-08-25T12:00:00.000Z');

function makeSnapshot() {
  const board = createStarterBoard();
  const collection = createDefaultCollectionProgress(board);
  const bossTrophies = createDefaultBossTrophyRoomProgress();
  return {
    coins: 140,
    coreShards: 3,
    upgrades: { power: 2, armor: 1, bounty: 0 },
    daily: createDefaultDailyState(SNAPSHOT_NOW),
    collection,
    onboarding: createDefaultOnboardingState(),
    anomalyHunt: { charge: 7, secretPity: 23, totalPulls: 23, secretsFound: 0 },
    mutationAlbum: backfillMutationAlbumProgress(collection, board),
    weeklyChaos: createDefaultWeeklyChaosProgress(SNAPSHOT_NOW),
    ascension: createDefaultAscensionProgress(),
    bossTrophies,
    bossHunt: createBossHuntProgress(bossTrophies, SNAPSHOT_NOW),
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
  it('round-trips a valid v14 snapshot with Boss Hunt, Ascension and campaign progression', () => {
    const weeklyChaos = advanceWeeklyChaosRun(startWeeklyChaosRun(makeSnapshot().weeklyChaos, SNAPSHOT_NOW).progress).progress;
    const save = createGameSave({ ...makeSnapshot(), weeklyChaos }, SNAPSHOT_NOW);
    expect(save.version).toBe(14);
    expect(save.chaosPerks).toEqual(['impact-jelly', 'repair-moss']);
    expect(save.anomalyHunt).toEqual({ charge: 7, secretPity: 23, totalPulls: 23, secretsFound: 0 });
    expect(save.mutationAlbum.discovered).toEqual(['pinguino-1:none', 'toastodilo-1:none']);
    expect(save.weeklyChaos).toMatchObject({ weekId: 202635, active: true, depth: 1, bestDepth: 1, runsStarted: 1 });
    expect(save.ascension).toEqual(createDefaultAscensionProgress());
    expect(save.bossHunt.huntId).toBe(202635);
    expect(save.bossTrophies).toEqual(createDefaultBossTrophyRoomProgress());
    expect(parseGameSave(save)).toEqual(save);
  });

  it('migrates a valid v13 save to fresh Boss Hunt/Trophy state without inventing trophies', () => {
    const current = createGameSave(makeSnapshot(), SNAPSHOT_NOW);
    const legacy: Record<string, unknown> = { ...current };
    delete legacy.bossHunt;
    delete legacy.bossTrophies;
    const migrated = parseGameSave({ ...legacy, version: 13 });
    expect(migrated?.version).toBe(14);
    expect(migrated?.bossHunt.huntId).toBe(202635);
    expect(migrated?.bossHunt.totalDamage).toBe(0);
    expect(migrated?.bossTrophies).toEqual(createDefaultBossTrophyRoomProgress());
  });

  it('migrates a valid v11 save with fresh weekly, Ascension and Boss Hunt progression while preserving album evidence', () => {
    const current = createGameSave(makeSnapshot(), SNAPSHOT_NOW);
    const legacy: Record<string, unknown> = { ...current };
    delete legacy.weeklyChaos;
    delete legacy.ascension;
    delete legacy.bossHunt;
    delete legacy.bossTrophies;
    const migrated = parseGameSave({ ...legacy, version: 11 });
    expect(migrated?.version).toBe(14);
    expect(migrated?.mutationAlbum.discovered).toEqual(['pinguino-1:none', 'toastodilo-1:none']);
    expect(migrated?.weeklyChaos).toEqual(createDefaultWeeklyChaosProgress(SNAPSHOT_NOW));
    expect(migrated?.ascension).toEqual(createDefaultAscensionProgress());
    expect(migrated?.bossHunt.totalDamage).toBe(0);
  });

  it('migrates a valid v10 save and safely backfills mutation evidence plus retention state', () => {
    const current = createGameSave(makeSnapshot(), SNAPSHOT_NOW);
    const legacy: Record<string, unknown> = { ...current };
    delete legacy.mutationAlbum;
    delete legacy.weeklyChaos;
    delete legacy.ascension;
    delete legacy.bossHunt;
    delete legacy.bossTrophies;
    const migrated = parseGameSave({ ...legacy, version: 10 });
    expect(migrated?.version).toBe(14);
    expect(migrated?.mutationAlbum.discovered).toEqual(['pinguino-1:none', 'toastodilo-1:none']);
    expect(migrated?.mutationAlbum.claimedMilestones).toEqual([]);
    expect(migrated?.weeklyChaos.weekId).toBe(202635);
    expect(migrated?.ascension).toEqual(createDefaultAscensionProgress());
    expect(migrated?.bossTrophies).toEqual(createDefaultBossTrophyRoomProgress());
  });

  it('migrates a valid v9 save with a fresh anomaly hunt while preserving chapter perks', () => {
    const current = createGameSave(makeSnapshot(), SNAPSHOT_NOW);
    const legacy: Record<string, unknown> = { ...current };
    delete legacy.anomalyHunt;
    delete legacy.mutationAlbum;
    delete legacy.weeklyChaos;
    delete legacy.ascension;
    delete legacy.bossHunt;
    delete legacy.bossTrophies;
    const migrated = parseGameSave({ ...legacy, version: 9 });
    expect(migrated?.version).toBe(14);
    expect(migrated?.chaosPerks).toEqual(['impact-jelly', 'repair-moss']);
    expect(migrated?.anomalyHunt).toEqual(createDefaultAnomalyHuntState());
    expect(migrated?.mutationAlbum.discovered).toEqual(['pinguino-1:none', 'toastodilo-1:none']);
  });

  it('migrates a valid v8 save with an empty chapter build and fresh anomaly hunt', () => {
    const current = createGameSave(makeSnapshot(), SNAPSHOT_NOW);
    const legacy: Record<string, unknown> = { ...current };
    delete legacy.chaosPerks;
    delete legacy.anomalyHunt;
    delete legacy.mutationAlbum;
    delete legacy.weeklyChaos;
    delete legacy.ascension;
    delete legacy.bossHunt;
    delete legacy.bossTrophies;
    const migrated = parseGameSave({ ...legacy, version: 8 });
    expect(migrated?.version).toBe(14);
    expect(migrated?.chaosPerks).toEqual([]);
    expect(migrated?.anomalyHunt).toEqual(createDefaultAnomalyHuntState());
  });

  it('round-trips the late-wave and boss encounter steps', () => {
    const waveFour = createGameSave({ ...makeSnapshot(), encounterStep: 3 }, SNAPSHOT_NOW);
    const gate = createGameSave({ ...makeSnapshot(), encounterStep: 4 }, SNAPSHOT_NOW);
    const boss = createGameSave({ ...makeSnapshot(), encounterStep: BOSS_STEP }, SNAPSHOT_NOW);
    expect(parseGameSave(waveFour)?.encounterStep).toBe(3);
    expect(parseGameSave(gate)?.encounterStep).toBe(4);
    expect(parseGameSave(boss)?.encounterStep).toBe(BOSS_STEP);
  });

  it('round-trips a mutated Lampalotl unit and its album state', () => {
    const snapshot = makeSnapshot();
    const board = [...snapshot.board];
    board[8] = { id: 'lamp-save', family: 'lampalotl', level: 2, mutation: 'prismatic' };
    const collection = discoverCreature(snapshot.collection, 'lampalotl-2');
    const mutationAlbum = backfillMutationAlbumProgress(collection, board);
    const save = createGameSave({ ...snapshot, board, collection, mutationAlbum }, SNAPSHOT_NOW);
    const parsed = parseGameSave(save);
    expect(parsed?.version).toBe(14);
    expect(parsed?.board[8]).toEqual({ id: 'lamp-save', family: 'lampalotl', level: 2, mutation: 'prismatic' });
    expect(parsed?.collection.discovered).toContain('lampalotl-2');
    expect(parsed?.mutationAlbum.discovered).toContain('lampalotl-2:prismatic');
  });

  it('migrates a historical v7 boss step into the new step 5 boss position', () => {
    const snapshot = makeSnapshot();
    const oldSave = {
      version: 7,
      updatedAt: Date.parse('2026-08-20T12:00:00.000Z'),
      coins: snapshot.coins,
      coreShards: snapshot.coreShards,
      upgrades: snapshot.upgrades,
      daily: snapshot.daily,
      collection: snapshot.collection,
      onboarding: { step: 'complete', completedAt: Date.parse('2026-08-20T11:00:00.000Z') },
      baseHp: snapshot.baseHp,
      chapter: 4,
      encounterStep: 3,
      targetHpMax: 930,
      targetHp: 410,
      recruitSerial: snapshot.recruitSerial,
      board: snapshot.board
    };
    const migrated = parseGameSave(oldSave);
    expect(migrated?.version).toBe(14);
    expect(migrated?.encounterStep).toBe(BOSS_STEP);
    expect(migrated?.targetHpMax).toBe(930);
    expect(migrated?.targetHp).toBe(410);
    expect(migrated?.chaosPerks).toEqual([]);
    expect(migrated?.anomalyHunt).toEqual(createDefaultAnomalyHuntState());
    expect(migrated?.ascension).toEqual(createDefaultAscensionProgress());
  });

  it('keeps historical v7 wave steps before the old boss unchanged', () => {
    const snapshot = makeSnapshot();
    const oldSave = {
      version: 7,
      updatedAt: Date.parse('2026-08-20T12:00:00.000Z'),
      coins: snapshot.coins,
      coreShards: snapshot.coreShards,
      upgrades: snapshot.upgrades,
      daily: snapshot.daily,
      collection: snapshot.collection,
      onboarding: { step: 'complete', completedAt: Date.parse('2026-08-20T11:00:00.000Z') },
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

  it('migrates v2 saves through v14 and preserves progression', () => {
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
    expect(migrated?.version).toBe(14);
    expect(migrated?.coreShards).toBe(3);
    expect(migrated?.upgrades).toEqual(createDefaultMetaUpgradeLevels());
    expect(migrated?.daily.streak).toBe(0);
    expect(migrated?.collection.discovered).toEqual(['pinguino-1', 'toastodilo-1']);
    expect(migrated?.collection.stats.bosses).toBe(3);
    expect(migrated?.onboarding.step).toBe('complete');
    expect(migrated?.board[0]?.mutation).toBe('none');
    expect(migrated?.chaosPerks).toEqual([]);
    expect(migrated?.anomalyHunt).toEqual(createDefaultAnomalyHuntState());
    expect(migrated?.mutationAlbum.discovered).toEqual(['pinguino-1:none', 'toastodilo-1:none']);
    expect(migrated?.weeklyChaos.weekId).toBe(202635);
    expect(migrated?.ascension).toEqual(createDefaultAscensionProgress());
    expect(migrated?.bossHunt.huntId).toBe(202635);
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
    expect(migrated?.version).toBe(14);
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
    expect(migrated?.version).toBe(14);
    expect(migrated?.daily).toEqual(snapshot.daily);
    expect(migrated?.collection.stats.recruits).toBe(snapshot.recruitSerial);
    expect(migrated?.onboarding.step).toBe('complete');
  });

  it('migrates a valid v5 save as already onboarded', () => {
    const snapshot = makeSnapshot();
    const updatedAt = Date.parse('2026-08-25T09:30:00.000Z');
    const oldSave = {
      version: 5,
      updatedAt,
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
    expect(migrated?.version).toBe(14);
    expect(migrated?.onboarding).toEqual({ step: 'complete', completedAt: updatedAt });
  });

  it('migrates v6 boards to explicit common mutation state', () => {
    const snapshot = makeSnapshot();
    const oldSave = {
      version: 6,
      updatedAt: Date.parse('2026-08-25T10:00:00.000Z'),
      coins: snapshot.coins,
      coreShards: snapshot.coreShards,
      upgrades: snapshot.upgrades,
      daily: snapshot.daily,
      collection: snapshot.collection,
      onboarding: { step: 'complete', completedAt: Date.parse('2026-08-25T09:30:00.000Z') },
      baseHp: snapshot.baseHp,
      chapter: snapshot.chapter,
      encounterStep: snapshot.encounterStep,
      targetHpMax: snapshot.targetHpMax,
      targetHp: snapshot.targetHp,
      recruitSerial: snapshot.recruitSerial,
      board: makeLegacyBoard()
    };
    const migrated = parseGameSave(oldSave);
    expect(migrated?.version).toBe(14);
    expect(migrated?.board.filter(Boolean).every((unit) => unit?.mutation === 'none')).toBe(true);
  });

  it('clamps upgrade levels, collection stats, anomaly counters and target HP to supported maximums', () => {
    const save = createGameSave(makeSnapshot(), SNAPSHOT_NOW);
    const parsed = parseGameSave({
      ...save,
      targetHp: 9999,
      upgrades: { power: 999, armor: 999, bounty: 999 },
      anomalyHunt: { charge: 999, secretPity: 999, totalPulls: 12, secretsFound: 999 },
      collection: {
        ...save.collection,
        stats: { merges: 2_000_000_000, recruits: 0, defeats: 0, bosses: 0, upgrades: 0 }
      }
    });
    expect(parsed?.targetHp).toBe(800);
    expect(parsed?.upgrades).toEqual({ power: 10, armor: 8, bounty: 10 });
    expect(parsed?.collection.stats.merges).toBe(1_000_000_000);
    expect(parsed?.anomalyHunt).toEqual({ charge: 17, secretPity: 69, totalPulls: 12, secretsFound: 12 });
  });

  it('rejects malformed or duplicate chaos perks', () => {
    const save = createGameSave(makeSnapshot(), SNAPSHOT_NOW);
    expect(parseGameSave({ ...save, chaosPerks: ['copied-meme'] })).toBeNull();
    expect(parseGameSave({ ...save, chaosPerks: ['impact-jelly', 'impact-jelly'] })).toBeNull();
    expect(parseGameSave({ ...save, chaosPerks: ['impact-jelly', 'repair-moss', 'tempo-worm'] })).toBeNull();
  });

  it('rejects malformed anomaly hunt state', () => {
    const save = createGameSave(makeSnapshot(), SNAPSHOT_NOW);
    expect(parseGameSave({ ...save, anomalyHunt: { ...save.anomalyHunt, charge: 'full' } })).toBeNull();
  });

  it('rejects malformed mutation album state', () => {
    const save = createGameSave(makeSnapshot(), SNAPSHOT_NOW);
    expect(parseGameSave({ ...save, mutationAlbum: { discovered: ['fake-1:crowned'], claimedMilestones: [] } })).toBeNull();
    expect(parseGameSave({ ...save, mutationAlbum: { ...save.mutationAlbum, claimedMilestones: [12] } })).toBeNull();
  });

  it('rejects malformed weekly chaos state', () => {
    const save = createGameSave(makeSnapshot(), SNAPSHOT_NOW);
    expect(parseGameSave({ ...save, weeklyChaos: { ...save.weeklyChaos, weekId: 'week-35' } })).toBeNull();
    expect(parseGameSave({ ...save, weeklyChaos: { ...save.weeklyChaos, active: true, depth: 12, bestDepth: 12 } })).toBeNull();
    expect(parseGameSave({ ...save, weeklyChaos: { ...save.weeklyChaos, bestDepth: 2, claimedMilestones: [3] } })).toBeNull();
  });

  it('rejects malformed Boss Hunt and Trophy Room state', () => {
    const save = createGameSave(makeSnapshot(), SNAPSHOT_NOW);
    expect(parseGameSave({ ...save, bossHunt: { ...save.bossHunt, bossId: 'copied-boss' } })).toBeNull();
    expect(parseGameSave({ ...save, bossHunt: { ...save.bossHunt, totalDamage: 20 } })).toBeNull();
    expect(parseGameSave({ ...save, bossHunt: { ...save.bossHunt, defeated: true } })).toBeNull();
    expect(parseGameSave({ ...save, bossTrophies: { trophies: { [save.bossHunt.bossId]: 'impossible' } } })).toBeNull();
  });

  it('rejects malformed onboarding state', () => {
    const save = createGameSave(makeSnapshot(), SNAPSHOT_NOW);
    expect(parseGameSave({ ...save, onboarding: { step: 'complete', completedAt: null } })).toBeNull();
  });

  it('rejects malformed collection data', () => {
    const save = createGameSave(makeSnapshot(), SNAPSHOT_NOW);
    expect(parseGameSave({ ...save, collection: { ...save.collection, discovered: ['copied-meme'] } })).toBeNull();
  });

  it('rejects malformed daily state', () => {
    const save = createGameSave(makeSnapshot(), SNAPSHOT_NOW);
    expect(parseGameSave({ ...save, daily: { ...save.daily, dayKey: 'not-a-day' } })).toBeNull();
  });

  it('rejects malformed upgrade data', () => {
    const save = createGameSave(makeSnapshot(), SNAPSHOT_NOW);
    expect(parseGameSave({ ...save, upgrades: { power: 'max', armor: 0, bounty: 0 } })).toBeNull();
  });

  it('rejects unsupported v14 encounter steps', () => {
    const save = createGameSave(makeSnapshot(), SNAPSHOT_NOW);
    expect(parseGameSave({ ...save, encounterStep: 6 })).toBeNull();
  });

  it('rejects malformed board mutation data in v14', () => {
    const save = createGameSave(makeSnapshot(), SNAPSHOT_NOW);
    const board = [...save.board];
    const first = board[0];
    if (!first) throw new Error('Expected starter unit');
    board[0] = { ...first, mutation: 'impossible' } as never;
    expect(parseGameSave({ ...save, board })).toBeNull();
  });

  it('rejects v14 board units that omit mutation', () => {
    const save = createGameSave(makeSnapshot(), SNAPSHOT_NOW);
    const board = save.board.map((unit) => unit ? { id: unit.id, family: unit.family, level: unit.level } : null);
    expect(parseGameSave({ ...save, board })).toBeNull();
  });
});
