import type { GameAnalyticsEvent } from '../analytics/events';
import {
  ACTIVE_ABILITY_IDS,
  getCurrentActiveAbilityRuntime,
  type ActiveAbilityId,
  type ActiveAbilityRuntimeState
} from '../systems/activeAbilities';
import { CHAOS_PERK_IDS, getCurrentChaosPerks, type ChaosPerkId } from '../systems/chaosDraft';

const ANALYTICS_EVENT_NAME = 'brainror:analytics';
const MAX_RECORDED_EVENTS = 200;
const SAMPLE_INTERVAL_MS = 250;

export interface PlaytestReport {
  readonly version: 1;
  readonly sessionElapsedMs: number;
  readonly returning: boolean | null;
  readonly startChapter: number | null;
  readonly endChapter: number | null;
  readonly onboardingCompleteMs: number | null;
  readonly firstBossStartMs: number | null;
  readonly firstBossCompleteMs: number | null;
  readonly encountersStarted: number;
  readonly encountersCompleted: number;
  readonly wavesCompleted: number;
  readonly bossesCompleted: number;
  readonly failures: number;
  readonly recruits: number;
  readonly merges: number;
  readonly averageEncounterDurationMs: number | null;
  readonly medianEncounterDurationMs: number | null;
  readonly averageWaveDurationMs: number | null;
  readonly averageBossDurationMs: number | null;
  readonly minFortressHpAfterWin: number | null;
  readonly averageFortressHpAfterWin: number | null;
  readonly activeAbilityUses: Readonly<Record<ActiveAbilityId, number>>;
  readonly chaosPerkSelections: Readonly<Record<ChaosPerkId, number>>;
  readonly rewardedAttempts: number;
  readonly rewardedSuccesses: number;
  readonly interstitialRequests: number;
  readonly recentEvents: readonly GameAnalyticsEvent[];
}

export class PlaytestRecorder {
  private readonly events: GameAnalyticsEvent[] = [];
  private readonly activeAbilityUses = emptyAbilityCounts();
  private readonly chaosPerkSelections = emptyPerkCounts();
  private previousCooldowns = emptyCooldownSnapshot();
  private previousPerks = new Set<ChaosPerkId>();
  private stateSampled = false;

  public recordEvent(event: GameAnalyticsEvent): void {
    this.events.push(event);
    if (this.events.length > MAX_RECORDED_EVENTS) this.events.splice(0, this.events.length - MAX_RECORDED_EVENTS);
  }

  public sampleCombatState(runtime: ActiveAbilityRuntimeState, perks: readonly ChaosPerkId[]): void {
    if (!this.stateSampled) {
      this.previousCooldowns = cooldownSnapshot(runtime);
      this.previousPerks = new Set(perks);
      this.stateSampled = true;
      return;
    }

    for (const id of ACTIVE_ABILITY_IDS) {
      if (this.previousCooldowns[id] <= 0 && runtime.cooldowns[id] > 0) this.activeAbilityUses[id] += 1;
    }
    this.previousCooldowns = cooldownSnapshot(runtime);

    const nextPerks = new Set(perks);
    for (const id of nextPerks) {
      if (!this.previousPerks.has(id)) this.chaosPerkSelections[id] += 1;
    }
    this.previousPerks = nextPerks;
  }

  public reset(): void {
    this.events.length = 0;
    for (const id of ACTIVE_ABILITY_IDS) this.activeAbilityUses[id] = 0;
    for (const id of CHAOS_PERK_IDS) this.chaosPerkSelections[id] = 0;
    this.previousCooldowns = emptyCooldownSnapshot();
    this.previousPerks = new Set<ChaosPerkId>();
    this.stateSampled = false;
  }

  public getReport(): PlaytestReport {
    const session = this.events.find((event) => event.name === 'session_start');
    const onboarding = this.events.find((event) => event.name === 'onboarding_complete');
    const encounterStarts = this.events.filter((event) => event.name === 'encounter_start');
    const encounterCompletes = this.events.filter((event) => event.name === 'encounter_complete');
    const bossStarts = encounterStarts.filter((event) => event.kind === 'boss');
    const bossCompletes = encounterCompletes.filter((event) => event.kind === 'boss');
    const waveCompletes = encounterCompletes.filter((event) => event.kind === 'wave');
    const durations = encounterCompletes.map((event) => event.encounterDurationMs);
    const fortressHp = encounterCompletes.map((event) => event.baseHpRemaining);
    const chapters = this.events.flatMap((event) => chapterOf(event));
    const rewarded = this.events.filter((event) => event.name === 'rewarded_ad_result');
    const elapsed = this.events.length > 0 ? Math.max(...this.events.map((event) => event.elapsedMs)) : 0;

    return {
      version: 1,
      sessionElapsedMs: elapsed,
      returning: session?.name === 'session_start' ? session.returning : null,
      startChapter: session?.name === 'session_start' ? session.chapter : chapters[0] ?? null,
      endChapter: chapters.length > 0 ? Math.max(...chapters) : null,
      onboardingCompleteMs: onboarding?.elapsedMs ?? null,
      firstBossStartMs: bossStarts[0]?.elapsedMs ?? null,
      firstBossCompleteMs: bossCompletes[0]?.elapsedMs ?? null,
      encountersStarted: encounterStarts.length,
      encountersCompleted: encounterCompletes.length,
      wavesCompleted: waveCompletes.length,
      bossesCompleted: bossCompletes.length,
      failures: this.events.filter((event) => event.name === 'fortress_failed').length,
      recruits: this.events.filter((event) => event.name === 'recruit').length,
      merges: this.events.filter((event) => event.name === 'merge').length,
      averageEncounterDurationMs: average(durations),
      medianEncounterDurationMs: median(durations),
      averageWaveDurationMs: average(waveCompletes.map((event) => event.encounterDurationMs)),
      averageBossDurationMs: average(bossCompletes.map((event) => event.encounterDurationMs)),
      minFortressHpAfterWin: fortressHp.length > 0 ? Math.min(...fortressHp) : null,
      averageFortressHpAfterWin: average(fortressHp),
      activeAbilityUses: { ...this.activeAbilityUses },
      chaosPerkSelections: { ...this.chaosPerkSelections },
      rewardedAttempts: rewarded.length,
      rewardedSuccesses: rewarded.filter((event) => event.rewarded).length,
      interstitialRequests: this.events.filter((event) => event.name === 'interstitial_ad_request').length,
      recentEvents: [...this.events]
    };
  }
}

export interface InstalledPlaytestRecorder {
  readonly recorder: PlaytestRecorder;
  destroy(): void;
}

export function isPlaytestMode(search: string): boolean {
  try {
    const params = new URLSearchParams(search);
    const playtest = params.get('playtest')?.trim().toLowerCase();
    return playtest === '1' || playtest === 'true' || params.get('qa')?.trim().toLowerCase() === 'playtest';
  } catch {
    return false;
  }
}

export function installPlaytestRecorder(
  windowRef: Window = globalThis.window,
  documentRef: Document = globalThis.document
): InstalledPlaytestRecorder | null {
  if (!windowRef || !documentRef || !isPlaytestMode(windowRef.location.search)) return null;

  const recorder = new PlaytestRecorder();
  const analyticsHandler = (raw: Event): void => {
    const event = raw as CustomEvent<GameAnalyticsEvent>;
    if (event.detail) recorder.recordEvent(event.detail);
  };
  windowRef.addEventListener(ANALYTICS_EVENT_NAME, analyticsHandler);

  const root = createQaOverlay(documentRef, recorder);
  const sampler = windowRef.setInterval(() => {
    recorder.sampleCombatState(getCurrentActiveAbilityRuntime(), getCurrentChaosPerks());
    root.refreshIfOpen();
  }, SAMPLE_INTERVAL_MS);

  return {
    recorder,
    destroy: () => {
      windowRef.clearInterval(sampler);
      windowRef.removeEventListener(ANALYTICS_EVENT_NAME, analyticsHandler);
      root.destroy();
    }
  };
}

function createQaOverlay(documentRef: Document, recorder: PlaytestRecorder): {
  refreshIfOpen(): void;
  destroy(): void;
} {
  const button = documentRef.createElement('button');
  button.textContent = 'QA';
  applyStyles(button, {
    position: 'fixed', right: '10px', bottom: '10px', zIndex: '10000', width: '48px', height: '40px',
    borderRadius: '12px', border: '1px solid rgba(190,235,255,.55)', background: 'rgba(10,18,40,.92)',
    color: '#dff7ff', font: '800 14px system-ui', cursor: 'pointer'
  });

  const panel = documentRef.createElement('section');
  applyStyles(panel, {
    display: 'none', position: 'fixed', right: '10px', bottom: '60px', zIndex: '10000', width: 'min(420px, calc(100vw - 20px))',
    maxHeight: '72vh', overflow: 'auto', boxSizing: 'border-box', padding: '14px', borderRadius: '16px',
    border: '1px solid rgba(190,235,255,.35)', background: 'rgba(7,13,31,.97)', color: '#e9f7ff',
    font: '13px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace', boxShadow: '0 12px 40px rgba(0,0,0,.4)'
  });

  const title = documentRef.createElement('div');
  title.textContent = 'PLAYTEST SESSION';
  applyStyles(title, { font: '900 14px system-ui', marginBottom: '10px', letterSpacing: '.08em' });
  const output = documentRef.createElement('pre');
  applyStyles(output, { margin: '0', whiteSpace: 'pre-wrap', wordBreak: 'break-word', font: '12px/1.45 ui-monospace, monospace' });
  const actions = documentRef.createElement('div');
  applyStyles(actions, { display: 'flex', gap: '8px', marginTop: '12px', position: 'sticky', bottom: '0', background: 'rgba(7,13,31,.97)', paddingTop: '8px' });

  const copy = actionButton(documentRef, 'COPY JSON');
  const reset = actionButton(documentRef, 'RESET');
  const close = actionButton(documentRef, 'CLOSE');
  actions.append(copy, reset, close);
  panel.append(title, output, actions);
  documentRef.body.append(panel, button);

  const refresh = (): void => { output.textContent = formatPlaytestReport(recorder.getReport()); };
  button.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (panel.style.display === 'block') refresh();
  });
  close.addEventListener('click', () => { panel.style.display = 'none'; });
  reset.addEventListener('click', () => { recorder.reset(); refresh(); });
  copy.addEventListener('click', () => {
    const text = JSON.stringify(recorder.getReport(), null, 2);
    void navigator.clipboard?.writeText(text).catch(() => undefined);
    copy.textContent = 'COPIED';
    window.setTimeout(() => { copy.textContent = 'COPY JSON'; }, 900);
  });

  return {
    refreshIfOpen: () => { if (panel.style.display === 'block') refresh(); },
    destroy: () => { panel.remove(); button.remove(); }
  };
}

export function formatPlaytestReport(report: PlaytestReport): string {
  const abilityUses = Object.entries(report.activeAbilityUses).filter(([, count]) => count > 0);
  const perkUses = Object.entries(report.chaosPerkSelections).filter(([, count]) => count > 0);
  return [
    `SESSION ${seconds(report.sessionElapsedMs)}`,
    `CHAPTER ${report.startChapter ?? '-'} -> ${report.endChapter ?? '-'}`,
    `ONBOARD ${timeOrPending(report.onboardingCompleteMs)}`,
    `FIRST BOSS START ${timeOrPending(report.firstBossStartMs)}`,
    `FIRST BOSS CLEAR ${timeOrPending(report.firstBossCompleteMs)}`,
    `ENCOUNTERS ${report.encountersCompleted}/${report.encountersStarted}  WAVES ${report.wavesCompleted}  BOSSES ${report.bossesCompleted}`,
    `TTK AVG ${timeOrPending(report.averageEncounterDurationMs)}  MED ${timeOrPending(report.medianEncounterDurationMs)}`,
    `WAVE AVG ${timeOrPending(report.averageWaveDurationMs)}  BOSS AVG ${timeOrPending(report.averageBossDurationMs)}`,
    `FORTRESS WIN HP MIN ${numberOrDash(report.minFortressHpAfterWin)}  AVG ${numberOrDash(report.averageFortressHpAfterWin)}`,
    `FAILURES ${report.failures}  RECRUITS ${report.recruits}  MERGES ${report.merges}`,
    `ABILITIES ${abilityUses.length > 0 ? abilityUses.map(([id, count]) => `${id}:${count}`).join('  ') : '-'}`,
    `PERKS ${perkUses.length > 0 ? perkUses.map(([id, count]) => `${id}:${count}`).join('  ') : '-'}`,
    `REWARDED ${report.rewardedSuccesses}/${report.rewardedAttempts}  INTERSTITIALS ${report.interstitialRequests}`
  ].join('\n');
}

function chapterOf(event: GameAnalyticsEvent): number[] {
  if ('chapter' in event && typeof event.chapter === 'number') return [event.chapter];
  if ('completedChapter' in event && typeof event.completedChapter === 'number') return [event.completedChapter];
  return [];
}

function average(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  if (ordered.length % 2 === 1) return Math.round(ordered[middle] ?? 0);
  return Math.round(((ordered[middle - 1] ?? 0) + (ordered[middle] ?? 0)) / 2);
}

function cooldownSnapshot(runtime?: ActiveAbilityRuntimeState): Record<ActiveAbilityId, number> {
  if (!runtime) return emptyCooldownSnapshot();
  return Object.fromEntries(ACTIVE_ABILITY_IDS.map((id) => [id, runtime.cooldowns[id]])) as Record<ActiveAbilityId, number>;
}

function emptyCooldownSnapshot(): Record<ActiveAbilityId, number> {
  return Object.fromEntries(ACTIVE_ABILITY_IDS.map((id) => [id, 0])) as Record<ActiveAbilityId, number>;
}

function emptyAbilityCounts(): Record<ActiveAbilityId, number> {
  return Object.fromEntries(ACTIVE_ABILITY_IDS.map((id) => [id, 0])) as Record<ActiveAbilityId, number>;
}

function emptyPerkCounts(): Record<ChaosPerkId, number> {
  return Object.fromEntries(CHAOS_PERK_IDS.map((id) => [id, 0])) as Record<ChaosPerkId, number>;
}

function seconds(ms: number): string { return `${(ms / 1000).toFixed(1)}s`; }
function timeOrPending(ms: number | null): string { return ms === null ? 'PENDING' : seconds(ms); }
function numberOrDash(value: number | null): string { return value === null ? '-' : `${Math.round(value)}`; }

function actionButton(documentRef: Document, label: string): HTMLButtonElement {
  const button = documentRef.createElement('button');
  button.textContent = label;
  applyStyles(button, {
    flex: '1', minHeight: '34px', borderRadius: '9px', border: '1px solid rgba(190,235,255,.3)',
    background: '#172541', color: '#e9f7ff', font: '800 11px system-ui', cursor: 'pointer'
  });
  return button;
}

function applyStyles(element: HTMLElement, styles: Readonly<Record<string, string>>): void {
  Object.assign(element.style, styles);
}
