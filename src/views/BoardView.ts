import * as Phaser from 'phaser';
import { getCreature } from '../content/creatures';
import { getMutationDefinition } from '../content/mutations';
import type { GameFx } from '../presentation/GameFx';
import {
  getActiveAbilityDefinition,
  getCurrentActiveAbilityRuntime,
  isActiveAbilityCombatActive,
  setActiveAbilityCombatActive,
  tickCurrentActiveAbilityRuntime,
  tryCastCurrentActiveAbility,
  type ActiveAbilityId
} from '../systems/activeAbilities';
import {
  BOARD_COLUMNS,
  BOARD_ROWS,
  canBoardUnitsMerge,
  findMergeablePair,
  firstEmptySlot,
  type BoardState,
  type BoardUnit
} from '../systems/board';
import {
  getActiveCrewSynergies,
  getCurrentCrewSynergyState,
  syncCrewSynergyState
} from '../systems/crewSynergies';
import { ActiveAbilityBar } from '../ui/ActiveAbilityBar';

const COLUMNS = BOARD_COLUMNS;
const ROWS = BOARD_ROWS;
const GAP = 14;
const SLOT_SIZE = 170;
const LEFT = (1080 - (COLUMNS * SLOT_SIZE + (COLUMNS - 1) * GAP)) / 2;
const TOP = 1130;
const TIER_COLORS: Readonly<Record<BoardUnit['level'], number>> = {
  1: 0x8fa6c8,
  2: 0x6de7ff,
  3: 0xffd76a
};
const TIER_IMAGE_SIZE: Readonly<Record<BoardUnit['level'], number>> = {
  1: 132,
  2: 144,
  3: 154
};

interface UnitViewMeta { readonly slot: number; readonly unitId: string; }

export class BoardView {
  private readonly unitViews = new Map<number, Phaser.GameObjects.Container>();
  private readonly mergeGuideRings = new Map<number, Phaser.GameObjects.Graphics>();
  private board: BoardState = [];
  private synergyText!: Phaser.GameObjects.Text;
  private abilityBar: ActiveAbilityBar | null = null;
  private preparationBackground!: Phaser.GameObjects.Graphics;
  private preparationLabel!: Phaser.GameObjects.Text;
  private lastPreparationMode = false;
  private lastSynergySignature = '';

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly fx: GameFx,
    private readonly onDrop: (view: Phaser.GameObjects.Container, from: number, to: number) => void,
    private readonly isLocked: () => boolean
  ) {}

  public createFrame(): void {
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x0a1128, 0.78); panel.fillRoundedRect(58, 1060, 964, 716, 62);
    panel.lineStyle(4, 0xa5d9ff, 0.14); panel.strokeRoundedRect(58, 1060, 964, 716, 62);
    this.scene.add.text(100, 1080, 'MERGE CREW', { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '31px', color: '#d9efff', stroke: '#1d2951', strokeThickness: 5 });
    this.synergyText = this.scene.add.text(342, 1090, 'CREW SYNERGIES', {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '17px',
      color: '#a9c9e8',
      stroke: '#101832',
      strokeThickness: 4
    });
    this.createPreparationButton();
    for (let index = 0; index < COLUMNS * ROWS; index += 1) {
      const position = this.slotPosition(index); const slot = this.scene.add.graphics();
      slot.fillStyle(0x24345d, 0.74); slot.fillRoundedRect(position.x - SLOT_SIZE / 2, position.y - SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE, 38);
      slot.lineStyle(3, 0xa7dbff, 0.14); slot.strokeRoundedRect(position.x - SLOT_SIZE / 2, position.y - SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE, 38);
      slot.fillStyle(0xc7ecff, 0.045); slot.fillCircle(position.x - 34, position.y - 41, 40);
    }

    this.abilityBar = new ActiveAbilityBar(this.scene, (id) => this.castAbility(id));
    this.abilityBar.create();
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.updateAbilities, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.clearMergeGuideRings();
      this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.updateAbilities, this);
    });
  }

  public render(board: BoardState, pulseSlot = -1): void {
    this.clearMergeGuideRings();
    this.board = board;
    for (const view of this.unitViews.values()) view.destroy();
    this.unitViews.clear();
    for (let index = 0; index < board.length; index += 1) {
      const unit = board[index]; if (!unit) continue;
      const view = this.createUnitView(index, unit); this.unitViews.set(index, view); if (index === pulseSlot) this.pulse(view);
    }
    this.renderSynergies(board);
    this.guideFullBoardMerge(board);
  }

  public getView(slot: number): Phaser.GameObjects.Container | undefined { return this.unitViews.get(slot); }
  public slotPosition(index: number): Phaser.Math.Vector2 { const column = index % COLUMNS; const row = Math.floor(index / COLUMNS); return new Phaser.Math.Vector2(LEFT + SLOT_SIZE / 2 + column * (SLOT_SIZE + GAP), TOP + SLOT_SIZE / 2 + row * (SLOT_SIZE + GAP)); }

  public snapHome(view: Phaser.GameObjects.Container, slot: number): void {
    const position = this.slotPosition(slot);
    view.setAlpha(1);
    this.scene.tweens.add({ targets: view, x: position.x, y: position.y, scaleX: 1, scaleY: 1, duration: 230, ease: 'Back.Out', onComplete: () => view.setDepth(1) });
  }

  public animateMerge(dragged: Phaser.GameObjects.Container, targetSlot: number, replaceBoard: () => Phaser.GameObjects.Container | undefined, done: () => void): void {
    const target = this.unitViews.get(targetSlot); const position = this.slotPosition(targetSlot);
    if (target) this.scene.tweens.add({ targets: target, scaleX: 0.72, scaleY: 0.72, angle: -7, duration: 185, ease: 'Back.In' });
    this.scene.tweens.add({ targets: dragged, x: position.x, y: position.y, scaleX: 0.62, scaleY: 0.62, angle: 8, duration: 190, ease: 'Back.In', onComplete: () => {
      this.fx.burst(position.x, position.y, 0x9af6ff, 16, 190); this.fx.flashRing(position.x, position.y, 0xffe681);
      const upgraded = replaceBoard(); if (!upgraded) { done(); return; }
      upgraded.setScale(0.35).setAngle(-8);
      this.scene.tweens.add({ targets: upgraded, scaleX: 1.12, scaleY: 1.12, angle: 0, duration: 270, ease: 'Back.Out', onComplete: () => { this.scene.tweens.add({ targets: upgraded, scaleX: 1, scaleY: 1, duration: 130, ease: 'Sine.Out' }); done(); } });
    } });
  }

  public attackKick(slot: number): Phaser.Math.Vector2 | null {
    const view = this.unitViews.get(slot); if (!view) return null; const origin = this.slotPosition(slot);
    this.scene.tweens.add({ targets: view, y: origin.y - 12, scaleX: 1.04, scaleY: 0.96, duration: 80, yoyo: true, ease: 'Quad.Out' }); return origin;
  }

  private createPreparationButton(): void {
    this.preparationBackground = this.scene.add.graphics().setDepth(940);
    this.preparationLabel = this.scene.add.text(918, 1092, 'PAUSE', {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '16px',
      color: '#dce9ff',
      stroke: '#101832',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(942);
    const hit = this.scene.add.rectangle(918, 1092, 150, 54, 0xffffff, 0.001)
      .setDepth(943)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => this.togglePreparationMode());
    this.paintPreparationButton(false);
  }

  private togglePreparationMode(): void {
    if (this.isLocked()) return;
    const next = !this.isPreparationMode();
    this.scene.registry.set('combatPaused', next);
    setActiveAbilityCombatActive(!next);
    this.refreshPreparationMode(next, true);
  }

  private isPreparationMode(): boolean {
    return this.scene.registry.get('combatPaused') === true;
  }

  private refreshPreparationMode(paused: boolean, forceHint = false): void {
    if (!forceHint && paused === this.lastPreparationMode) return;
    this.lastPreparationMode = paused;
    this.paintPreparationButton(paused);
    this.scene.tweens.killTweensOf(this.preparationLabel);
    this.preparationLabel.setScale(1.12).setAlpha(0.64);
    this.scene.tweens.add({ targets: this.preparationLabel, scaleX: 1, scaleY: 1, alpha: 1, duration: 190, ease: 'Back.Out' });
    this.fx.showHint(paused ? 'PREPARATION • COMBAT PAUSED' : 'FIGHT RESUMED', 1015, paused ? '#bffaff' : '#fff0a6');
  }

  private paintPreparationButton(paused: boolean): void {
    this.preparationBackground.clear();
    this.preparationBackground.fillStyle(paused ? 0x63e6c8 : 0x233252, paused ? 0.98 : 0.92);
    this.preparationBackground.fillRoundedRect(843, 1065, 150, 54, 23);
    this.preparationBackground.lineStyle(3, paused ? 0xeafff9 : 0x9eb8e8, paused ? 0.8 : 0.3);
    this.preparationBackground.strokeRoundedRect(843, 1065, 150, 54, 23);
    this.preparationLabel.setText(paused ? 'FIGHT' : 'PAUSE').setColor(paused ? '#12352f' : '#dce9ff');
  }

  private updateAbilities(_time: number, delta: number): void {
    const paused = this.isPreparationMode();
    const combatActive = isActiveAbilityCombatActive() && !paused;
    const runtime = combatActive ? tickCurrentActiveAbilityRuntime(delta) : getCurrentActiveAbilityRuntime();
    this.abilityBar?.update(runtime, getCurrentCrewSynergyState().tiers, combatActive);
    this.refreshPreparationMode(paused);
  }

  private castAbility(id: ActiveAbilityId): void {
    if (this.isPreparationMode()) {
      this.fx.showHint('RESUME FIGHT TO USE ABILITIES', 1015, '#a9b8d6');
      return;
    }
    const definition = getActiveAbilityDefinition(id);
    const synergy = getCurrentCrewSynergyState();
    const tier = synergy.tiers[definition.family];
    const result = tryCastCurrentActiveAbility(id, tier);
    if (!result.cast) {
      const message = result.reason === 'locked'
        ? `${definition.shortLabel} NEEDS ${definition.family.toUpperCase()} TIER I`
        : result.reason === 'energy'
          ? `NEED ${definition.energyCost} CHAOS ENERGY`
          : result.reason === 'cooldown'
            ? `${definition.shortLabel} RECHARGING`
            : 'ABILITY OFFLINE';
      this.fx.showHint(message, 1015, '#a9b8d6');
      this.abilityBar?.update(getCurrentActiveAbilityRuntime(), synergy.tiers, isActiveAbilityCombatActive());
      return;
    }

    const color = `#${definition.accentColor.toString(16).padStart(6, '0')}`;
    this.fx.showHint(`${definition.name.toUpperCase()} ACTIVE`, 1015, color);
    this.fx.flashRing(540, 930, definition.accentColor);
    this.fx.burst(540, 930, definition.accentColor, 14, 165);
    this.scene.cameras.main.shake(90, 0.0022);
    this.abilityBar?.update(result.state, synergy.tiers, isActiveAbilityCombatActive());
  }

  private renderSynergies(board: BoardState): void {
    if (!this.synergyText) return;
    const state = syncCrewSynergyState(board);
    const active = getActiveCrewSynergies(state);
    const fullBoardPair = firstEmptySlot(board) < 0 ? findMergeablePair(board) : null;
    const label = fullBoardPair
      ? 'BOARD FULL • MERGE THE GLOWING PAIR'
      : active.length > 0
        ? active.map((entry) => `${entry.definition.shortLabel} ${this.roman(entry.tier)}`).join('  •  ')
        : 'MATCH SAME CREATURE + SAME LEVEL';
    const signature = fullBoardPair
      ? `full:${fullBoardPair[0]}-${fullBoardPair[1]}`
      : active.map((entry) => `${entry.definition.id}:${entry.tier}`).join('|');
    this.synergyText
      .setText(label)
      .setColor(fullBoardPair ? '#ffe58a' : active.length > 0 ? '#c8f6ff' : '#7587a8');
    this.abilityBar?.update(getCurrentActiveAbilityRuntime(), state.tiers, isActiveAbilityCombatActive() && !this.isPreparationMode());
    if (signature !== this.lastSynergySignature && this.lastSynergySignature !== '') {
      this.scene.tweens.killTweensOf(this.synergyText);
      this.synergyText.setScale(fullBoardPair ? 1.12 : 1.08).setAlpha(0.55);
      this.scene.tweens.add({ targets: this.synergyText, scaleX: 1, scaleY: 1, alpha: 1, duration: 260, ease: 'Back.Out' });
    }
    this.lastSynergySignature = signature;
  }

  private guideFullBoardMerge(board: BoardState): void {
    if (firstEmptySlot(board) >= 0) return;
    const pair = findMergeablePair(board);
    if (!pair) return;

    for (const slot of pair) {
      this.addMergeGuideRing(slot, 0xffdf6b, 0.96);
      const position = this.slotPosition(slot);
      this.fx.flashRing(position.x, position.y, 0xffdf6b);
    }
  }

  private showDragMergeTargets(sourceSlot: number, sourceUnit: BoardUnit): void {
    this.clearMergeGuideRings();
    for (let slot = 0; slot < this.board.length; slot += 1) {
      if (slot === sourceSlot) continue;
      const target = this.board[slot];
      const compatible = Boolean(target && canBoardUnitsMerge(sourceUnit, target));
      const targetView = this.unitViews.get(slot);
      targetView?.setAlpha(compatible ? 1 : 0.38);
      if (!compatible) continue;
      this.addMergeGuideRing(slot, 0x79f4ff, 0.94);
    }
  }

  private addMergeGuideRing(slot: number, color: number, alpha: number): void {
    if (this.mergeGuideRings.has(slot)) return;
    const position = this.slotPosition(slot);
    const ring = this.scene.add.graphics().setDepth(900);
    ring.lineStyle(7, color, alpha);
    ring.strokeRoundedRect(
      position.x - SLOT_SIZE / 2 + 4,
      position.y - SLOT_SIZE / 2 + 4,
      SLOT_SIZE - 8,
      SLOT_SIZE - 8,
      36
    );
    ring.lineStyle(2, 0xffffff, 0.62);
    ring.strokeRoundedRect(
      position.x - SLOT_SIZE / 2 + 11,
      position.y - SLOT_SIZE / 2 + 11,
      SLOT_SIZE - 22,
      SLOT_SIZE - 22,
      31
    );
    this.mergeGuideRings.set(slot, ring);
    this.scene.tweens.add({ targets: ring, alpha: 0.36, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  private clearMergeGuideRings(): void {
    for (const ring of this.mergeGuideRings.values()) {
      this.scene.tweens.killTweensOf(ring);
      ring.destroy();
    }
    this.mergeGuideRings.clear();
    for (const view of this.unitViews.values()) view.setAlpha(1);
  }

  private createUnitView(slot: number, unit: BoardUnit): Phaser.GameObjects.Container {
    const position = this.slotPosition(slot);
    const creature = getCreature(unit.family, unit.level);
    const mutation = getMutationDefinition(unit.mutation);
    const tierColor = TIER_COLORS[unit.level];
    const tierFrame = this.scene.add.graphics();
    tierFrame.fillStyle(tierColor, unit.level === 1 ? 0.055 : unit.level === 2 ? 0.09 : 0.13);
    tierFrame.fillRoundedRect(-78, -78, 156, 156, 34);
    tierFrame.lineStyle(unit.level === 1 ? 3 : unit.level === 2 ? 5 : 7, tierColor, unit.level === 1 ? 0.38 : unit.level === 2 ? 0.76 : 0.96);
    tierFrame.strokeRoundedRect(-78, -78, 156, 156, 34);
    if (unit.level >= 2) {
      tierFrame.lineStyle(2, 0xffffff, unit.level === 2 ? 0.34 : 0.56);
      tierFrame.strokeRoundedRect(-70, -70, 140, 140, 28);
    }
    if (unit.level === 3) {
      tierFrame.lineStyle(4, 0xff8ecf, 0.46);
      tierFrame.lineBetween(-50, -72, -10, -72);
      tierFrame.lineBetween(10, -72, 50, -72);
    }

    const tierMarkers = this.scene.add.graphics();
    const markerWidth = 18;
    const markerGap = 7;
    const totalWidth = unit.level * markerWidth + (unit.level - 1) * markerGap;
    const markerStart = -totalWidth / 2;
    for (let index = 0; index < unit.level; index += 1) {
      tierMarkers.fillStyle(tierColor, 0.98);
      tierMarkers.fillRoundedRect(markerStart + index * (markerWidth + markerGap), 64, markerWidth, 7, 3);
    }

    const imageSize = TIER_IMAGE_SIZE[unit.level];
    const image = this.scene.add.image(0, unit.level === 3 ? 0 : 3, creature.texture).setDisplaySize(imageSize, imageSize);
    const shadow = this.scene.add.ellipse(0, 60, 106 + unit.level * 5, 25 + unit.level * 2, 0x030919, 0.28).setDepth(-1);
    const children: Phaser.GameObjects.GameObject[] = [tierFrame, shadow, tierMarkers];

    let mutationAura: Phaser.GameObjects.Graphics | null = null;
    let mutationArt: Phaser.GameObjects.Image | null = null;
    if (mutation.rank > 0) {
      mutationAura = this.scene.add.graphics();
      mutationAura.lineStyle(4, mutation.accentColor, 0.34 + mutation.rank * 0.08);
      mutationAura.strokeCircle(0, 3, 73);
      if (mutation.rank >= 2) {
        mutationAura.lineStyle(3, mutation.projectileColor, 0.22);
        mutationAura.strokeCircle(0, 3, 80);
      }
      children.push(mutationAura);
      if (mutation.texture) {
        mutationArt = this.scene.add.image(0, mutation.id === 'crowned' ? -4 : 2, mutation.texture)
          .setDisplaySize(mutation.id === 'crowned' ? 166 : 158, mutation.id === 'crowned' ? 166 : 158)
          .setAlpha(0.92);
        children.push(mutationArt);
      }
    }

    children.push(image);
    const badge = this.scene.add.graphics();
    badge.fillStyle(mutation.rank > 0 ? mutation.accentColor : tierColor, 1);
    badge.fillCircle(55, -55, unit.level === 3 ? 27 : unit.level === 2 ? 25 : 23);
    badge.lineStyle(unit.level === 3 ? 4 : 3, 0xffffff, unit.level === 1 ? 0.62 : 0.86);
    badge.strokeCircle(55, -55, unit.level === 3 ? 27 : unit.level === 2 ? 25 : 23);
    const level = this.scene.add.text(55, -56, this.roman(unit.level), {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: unit.level === 3 ? '16px' : '18px',
      color: '#10213a'
    }).setOrigin(0.5);
    children.push(badge, level);

    if (mutation.rank > 0) {
      const rarityPlate = this.scene.add.graphics();
      rarityPlate.fillStyle(0x10172f, 0.94);
      rarityPlate.fillRoundedRect(-72, -72, 40, 32, 11);
      rarityPlate.lineStyle(3, mutation.accentColor, 0.92);
      rarityPlate.strokeRoundedRect(-72, -72, 40, 32, 11);
      const rarityText = this.scene.add.text(-52, -56, mutation.shortLabel, {
        fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '16px', color: '#ffffff'
      }).setOrigin(0.5);
      children.push(rarityPlate, rarityText);
    }

    const view = this.scene.add.container(position.x, position.y, children);
    view.setSize(150, 150).setInteractive({ useHandCursor: true }); view.setData('meta', { slot, unitId: unit.id } satisfies UnitViewMeta); this.scene.input.setDraggable(view);

    this.scene.time.delayedCall(Phaser.Math.Between(0, 450), () => {
      if (!view.active) return;
      this.scene.tweens.add({ targets: image, y: unit.level === 3 ? -5 : -3, scaleX: image.scaleX * 1.018, scaleY: image.scaleY * 0.982, duration: 1050 + Phaser.Math.Between(-120, 160), yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      if (unit.level === 3) {
        this.scene.tweens.add({ targets: tierFrame, alpha: 0.68, duration: 820, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      }
      if (mutationAura) {
        this.scene.tweens.add({ targets: mutationAura, alpha: 0.58, duration: 720 + mutation.rank * 120, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      }
      if (mutationArt) {
        if (mutation.id === 'charged') {
          this.scene.tweens.add({ targets: mutationArt, scaleX: mutationArt.scaleX * 1.035, scaleY: mutationArt.scaleY * 1.035, alpha: 0.72, duration: 610, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        } else if (mutation.id === 'prismatic') {
          this.scene.tweens.add({ targets: mutationArt, angle: 3.5, alpha: 0.76, duration: 980, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        } else {
          this.scene.tweens.add({ targets: mutationArt, y: -11, angle: 2.2, duration: 930, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        }
      }
    });

    view.on('dragstart', () => {
      if (this.isLocked()) return;
      this.showDragMergeTargets(slot, unit);
      view.setDepth(1000);
      this.scene.tweens.add({ targets: view, scaleX: 1.08, scaleY: 1.08, duration: 110, ease: 'Back.Out' });
    });
    view.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => { if (!this.isLocked()) view.setPosition(dragX, dragY); });
    view.on('dragend', () => {
      const meta = view.getData('meta') as UnitViewMeta;
      this.clearMergeGuideRings();
      if (this.isLocked()) {
        this.snapHome(view, meta.slot);
        this.scene.time.delayedCall(260, () => this.guideFullBoardMerge(this.board));
        return;
      }
      this.onDrop(view, meta.slot, this.closestSlot(view.x, view.y));
      this.scene.time.delayedCall(420, () => this.guideFullBoardMerge(this.board));
    });
    return view;
  }

  private roman(tier: 1 | 2 | 3): string {
    return tier === 1 ? 'I' : tier === 2 ? 'II' : 'III';
  }

  private pulse(view: Phaser.GameObjects.Container): void { view.setScale(0.45); this.scene.tweens.add({ targets: view, scaleX: 1.08, scaleY: 1.08, duration: 230, ease: 'Back.Out', onComplete: () => this.scene.tweens.add({ targets: view, scaleX: 1, scaleY: 1, duration: 130, ease: 'Sine.Out' }) }); }
  private closestSlot(x: number, y: number): number { let best = 0; let bestDistance = Number.POSITIVE_INFINITY; for (let index = 0; index < COLUMNS * ROWS; index += 1) { const position = this.slotPosition(index); const distance = Phaser.Math.Distance.Between(x, y, position.x, position.y); if (distance < bestDistance) { bestDistance = distance; best = index; } } return best; }
}
