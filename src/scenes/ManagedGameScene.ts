import type * as Phaser from 'phaser';
import { resolveLocale } from '../i18n';
import { setActiveAbilityCombatActive } from '../systems/activeAbilities';
import { resolveEncounterPreparation, shouldAdvanceCombat } from '../systems/preparationState';
import { GameScene } from './GameScene';

interface TelegraphView {
  telegraph: (onImpact: () => void) => void;
}

interface OpenablePanel {
  isOpen: () => boolean;
}

interface HintFx {
  showHint: (message: string, y: number, color?: string) => void;
}

interface CurrencyHudView {
  coinsText: Phaser.GameObjects.Text;
  coreText: Phaser.GameObjects.Text;
}

interface ManagedSceneRuntimeState {
  chapter: number;
  encounterStep: number;
  encounter: { readonly kind: 'wave' | 'boss' };
  bossView: TelegraphView;
  enemyView: TelegraphView;
  fx: HintFx;
  hud: CurrencyHudView;
  damageTarget: (amount: number, color: number) => void;
  freeRetryEncounter: () => void;
  metaPanel: OpenablePanel;
  offlinePanel: OpenablePanel;
  dailyPanel: OpenablePanel;
  weeklyPanel: OpenablePanel;
  collectionPanel: OpenablePanel;
  revivePanel: OpenablePanel;
  chaosDraftPanel: OpenablePanel;
}

/**
 * Production orchestration around GameScene for player-controlled preparation.
 * Combat rules stay in GameScene/systems; this layer owns pause transitions,
 * menu pause restoration and protection against in-flight attacks crossing a
 * pause boundary.
 */
export class ManagedGameScene extends GameScene {
  private lastEncounterKey = '';
  private previousPaused = false;
  private panelPauseActive = false;
  private pausedBeforePanel = false;
  private deferredImpact: (() => void) | null = null;
  private deferredImpactTimer: Phaser.Time.TimerEvent | null = null;

  public override create(): void {
    this.registry.set('combatPaused', false);
    super.create();
    this.installTelegraphPauseGuards();
    this.installOutgoingDamagePauseGuard();
    this.installRegroupRetry();
    this.installCurrencyHints();
  }

  public override update(time: number, delta: number): void {
    const state = this.runtimeState();
    const transition = resolveEncounterPreparation({
      previousEncounterKey: this.lastEncounterKey,
      chapter: state.chapter,
      step: state.encounterStep,
      kind: state.encounter.kind
    });

    if (transition.changed) {
      this.lastEncounterKey = transition.encounterKey;
      this.clearDeferredImpact();
      if (transition.shouldAutoPause) {
        this.setCombatPaused(true);
        this.previousPaused = true;
        this.showBossPreparationHint(state);
        return;
      }
    }

    const blockingPanelOpen = this.isBlockingPanelOpen(state);
    if (blockingPanelOpen && !this.panelPauseActive) {
      this.panelPauseActive = true;
      this.pausedBeforePanel = this.isCombatPaused();
      this.setCombatPaused(true);
    } else if (!blockingPanelOpen && this.panelPauseActive) {
      this.panelPauseActive = false;
      this.setCombatPaused(this.pausedBeforePanel);
    }

    const paused = this.isCombatPaused();
    if (this.previousPaused && !paused) this.scheduleDeferredImpact();
    this.previousPaused = paused;

    if (!shouldAdvanceCombat(paused, blockingPanelOpen)) return;
    super.update(time, delta);
  }

  private installTelegraphPauseGuards(): void {
    const state = this.runtimeState();
    this.guardTelegraph(state.bossView);
    this.guardTelegraph(state.enemyView);
  }

  private guardTelegraph(view: TelegraphView): void {
    const original = view.telegraph.bind(view);
    view.telegraph = (onImpact: () => void): void => {
      original(() => {
        if (!this.isCombatPaused()) {
          onImpact();
          return;
        }

        // Do not let pause become a frame-perfect attack cancel. The impact is
        // held and delivered after a short resume grace window instead.
        this.deferredImpact = onImpact;
      });
    };
  }

  private installOutgoingDamagePauseGuard(): void {
    const state = this.runtimeState();
    const original = state.damageTarget.bind(this);
    state.damageTarget = (amount: number, color: number): void => {
      if (this.isCombatPaused()) return;
      original(amount, color);
    };
  }

  private installRegroupRetry(): void {
    const state = this.runtimeState();
    const original = state.freeRetryEncounter.bind(this);
    state.freeRetryEncounter = (): void => {
      original();
      this.setCombatPaused(true);
      this.previousPaused = true;
      this.time.delayedCall(90, () => {
        const russian = resolveLocale() === 'ru';
        state.fx.showHint(
          russian ? 'ПЕРЕГРУППИРОВКА • СЛЕЙ / ПРИЗОВИ • ЗАТЕМ БОЙ' : 'REGROUP • MERGE / RECRUIT • THEN FIGHT',
          1015,
          '#bffaff'
        );
      });
    };
  }

  private installCurrencyHints(): void {
    const state = this.runtimeState();
    const russian = resolveLocale() === 'ru';
    state.hud.coinsText.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      state.fx.showHint(
        russian ? 'МОНЕТЫ • ТРАТЬ НА ПРИЗЫВ СУЩЕСТВ' : 'COINS • SPEND ON CREATURE RECRUITS',
        270,
        '#ffe59a'
      );
    });
    state.hud.coreText.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      state.fx.showHint(
        russian ? 'ОСКОЛКИ ЯДРА • ПОСТОЯННЫЕ УЛУЧШЕНИЯ' : 'CORE SHARDS • PERMANENT UPGRADES',
        270,
        '#bffaff'
      );
    });
  }

  private showBossPreparationHint(state: ManagedSceneRuntimeState): void {
    this.time.delayedCall(170, () => {
      if (!this.isCombatPaused() || this.runtimeState().encounter.kind !== 'boss') return;
      const russian = resolveLocale() === 'ru';
      state.fx.showHint(
        russian ? 'ПОДГОТОВКА К БОССУ • СЛИЯНИЕ / ПРИЗЫВ • ЗАТЕМ БОЙ' : 'BOSS PREP • MERGE / RECRUIT • THEN FIGHT',
        1015,
        '#fff0a6'
      );
    });
  }

  private scheduleDeferredImpact(): void {
    if (!this.deferredImpact || this.deferredImpactTimer) return;
    const impact = this.deferredImpact;
    this.deferredImpactTimer = this.time.delayedCall(450, () => {
      this.deferredImpactTimer = null;
      if (this.isCombatPaused()) return;
      if (this.deferredImpact !== impact) return;
      this.deferredImpact = null;
      impact();
    });
  }

  private clearDeferredImpact(): void {
    this.deferredImpactTimer?.remove(false);
    this.deferredImpactTimer = null;
    this.deferredImpact = null;
  }

  private setCombatPaused(paused: boolean): void {
    this.registry.set('combatPaused', paused);
    setActiveAbilityCombatActive(!paused);
  }

  private isCombatPaused(): boolean {
    return this.registry.get('combatPaused') === true;
  }

  private isBlockingPanelOpen(state: ManagedSceneRuntimeState): boolean {
    return state.metaPanel.isOpen()
      || state.offlinePanel.isOpen()
      || state.dailyPanel.isOpen()
      || state.weeklyPanel.isOpen()
      || state.collectionPanel.isOpen()
      || state.revivePanel.isOpen()
      || state.chaosDraftPanel.isOpen();
  }

  private runtimeState(): ManagedSceneRuntimeState {
    return this as unknown as ManagedSceneRuntimeState;
  }
}
