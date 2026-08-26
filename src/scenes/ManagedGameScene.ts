import { setActiveAbilityCombatActive } from '../systems/activeAbilities';
import { GameScene } from './GameScene';

interface TelegraphView {
  telegraph: (onImpact: () => void) => void;
}

interface ManagedSceneRuntimeState {
  readonly chapter: number;
  readonly encounterStep: number;
  readonly encounter: { readonly kind: 'wave' | 'boss' };
  readonly bossView: TelegraphView;
  readonly enemyView: TelegraphView;
}

/**
 * Thin production wrapper around GameScene that adds a player-controlled
 * preparation state without mixing presentation state into combat rules.
 */
export class ManagedGameScene extends GameScene {
  private lastEncounterKey = '';

  public override create(): void {
    this.registry.set('combatPaused', false);
    super.create();
    this.installTelegraphPauseGuards();
  }

  public override update(time: number, delta: number): void {
    const state = this.runtimeState();
    const encounterKey = `${state.chapter}:${state.encounterStep}`;

    if (encounterKey !== this.lastEncounterKey) {
      this.lastEncounterKey = encounterKey;
      if (state.encounter.kind === 'boss') {
        this.registry.set('combatPaused', true);
        setActiveAbilityCombatActive(false);
        return;
      }
    }

    if (this.registry.get('combatPaused') === true) return;
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
        if (this.registry.get('combatPaused') === true) return;
        onImpact();
      });
    };
  }

  private runtimeState(): ManagedSceneRuntimeState {
    return this as unknown as ManagedSceneRuntimeState;
  }
}
