import * as Phaser from 'phaser';
import { getCreature } from '../content/creatures';
import { getMutationDefinition } from '../content/mutations';
import type { GameFx } from '../presentation/GameFx';
import type { BoardState, BoardUnit } from '../systems/board';
import { getActiveCrewSynergies, syncCrewSynergyState } from '../systems/crewSynergies';

const COLUMNS = 4;
const ROWS = 3;
const GAP = 22;
const SLOT_SIZE = 202;
const LEFT = (1080 - (COLUMNS * SLOT_SIZE + (COLUMNS - 1) * GAP)) / 2;
const TOP = 1130;

interface UnitViewMeta { readonly slot: number; readonly unitId: string; }

export class BoardView {
  private readonly unitViews = new Map<number, Phaser.GameObjects.Container>();
  private synergyText!: Phaser.GameObjects.Text;
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
    for (let index = 0; index < COLUMNS * ROWS; index += 1) {
      const position = this.slotPosition(index); const slot = this.scene.add.graphics();
      slot.fillStyle(0x24345d, 0.74); slot.fillRoundedRect(position.x - SLOT_SIZE / 2, position.y - SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE, 46);
      slot.lineStyle(3, 0xa7dbff, 0.14); slot.strokeRoundedRect(position.x - SLOT_SIZE / 2, position.y - SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE, 46);
      slot.fillStyle(0xc7ecff, 0.045); slot.fillCircle(position.x - 42, position.y - 50, 48);
    }
  }

  public render(board: BoardState, pulseSlot = -1): void {
    this.renderSynergies(board);
    for (const view of this.unitViews.values()) view.destroy();
    this.unitViews.clear();
    for (let index = 0; index < board.length; index += 1) {
      const unit = board[index]; if (!unit) continue;
      const view = this.createUnitView(index, unit); this.unitViews.set(index, view); if (index === pulseSlot) this.pulse(view);
    }
  }

  public getView(slot: number): Phaser.GameObjects.Container | undefined { return this.unitViews.get(slot); }
  public slotPosition(index: number): Phaser.Math.Vector2 { const column = index % COLUMNS; const row = Math.floor(index / COLUMNS); return new Phaser.Math.Vector2(LEFT + SLOT_SIZE / 2 + column * (SLOT_SIZE + GAP), TOP + SLOT_SIZE / 2 + row * (SLOT_SIZE + GAP)); }

  public snapHome(view: Phaser.GameObjects.Container, slot: number): void {
    const position = this.slotPosition(slot);
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
    this.scene.tweens.add({ targets: view, y: origin.y - 14, scaleX: 1.04, scaleY: 0.96, duration: 80, yoyo: true, ease: 'Quad.Out' }); return origin;
  }

  private renderSynergies(board: BoardState): void {
    if (!this.synergyText) return;
    const state = syncCrewSynergyState(board);
    const active = getActiveCrewSynergies(state);
    const label = active.length > 0
      ? active.map((entry) => `${entry.definition.shortLabel} ${this.roman(entry.tier)}`).join('  •  ')
      : 'NO ACTIVE SYNERGY';
    const signature = active.map((entry) => `${entry.definition.id}:${entry.tier}`).join('|');
    this.synergyText.setText(label).setColor(active.length > 0 ? '#c8f6ff' : '#7587a8');
    if (signature !== this.lastSynergySignature && this.lastSynergySignature !== '') {
      this.scene.tweens.killTweensOf(this.synergyText);
      this.synergyText.setScale(1.08).setAlpha(0.55);
      this.scene.tweens.add({ targets: this.synergyText, scaleX: 1, scaleY: 1, alpha: 1, duration: 260, ease: 'Back.Out' });
    }
    this.lastSynergySignature = signature;
  }

  private createUnitView(slot: number, unit: BoardUnit): Phaser.GameObjects.Container {
    const position = this.slotPosition(slot);
    const creature = getCreature(unit.family, unit.level);
    const mutation = getMutationDefinition(unit.mutation);
    const image = this.scene.add.image(0, 4, creature.texture).setDisplaySize(172, 172);
    const shadow = this.scene.add.ellipse(0, 72, 128, 30, 0x030919, 0.28).setDepth(-1);
    const children: Phaser.GameObjects.GameObject[] = [shadow];

    let mutationAura: Phaser.GameObjects.Graphics | null = null;
    let mutationArt: Phaser.GameObjects.Image | null = null;
    if (mutation.rank > 0) {
      mutationAura = this.scene.add.graphics();
      mutationAura.lineStyle(5, mutation.accentColor, 0.34 + mutation.rank * 0.08);
      mutationAura.strokeCircle(0, 4, 88);
      if (mutation.rank >= 2) {
        mutationAura.lineStyle(3, mutation.projectileColor, 0.22);
        mutationAura.strokeCircle(0, 4, 96);
      }
      children.push(mutationAura);
      if (mutation.texture) {
        mutationArt = this.scene.add.image(0, mutation.id === 'crowned' ? -5 : 2, mutation.texture)
          .setDisplaySize(mutation.id === 'crowned' ? 202 : 192, mutation.id === 'crowned' ? 202 : 192)
          .setAlpha(0.92);
        children.push(mutationArt);
      }
    }

    children.push(image);
    const badge = this.scene.add.graphics();
    badge.fillStyle(mutation.rank > 0 ? mutation.accentColor : creature.accentColor, 1);
    badge.fillCircle(67, -67, 27);
    badge.lineStyle(4, 0xffffff, 0.7);
    badge.strokeCircle(67, -67, 27);
    const level = this.scene.add.text(67, -68, `${unit.level}`, { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '25px', color: '#10213a' }).setOrigin(0.5);
    children.push(badge, level);

    if (mutation.rank > 0) {
      const rarityPlate = this.scene.add.graphics();
      rarityPlate.fillStyle(0x10172f, 0.94);
      rarityPlate.fillRoundedRect(-87, -87, 46, 38, 13);
      rarityPlate.lineStyle(3, mutation.accentColor, 0.92);
      rarityPlate.strokeRoundedRect(-87, -87, 46, 38, 13);
      const rarityText = this.scene.add.text(-64, -68, mutation.shortLabel, {
        fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '19px', color: '#ffffff'
      }).setOrigin(0.5);
      children.push(rarityPlate, rarityText);
    }

    const view = this.scene.add.container(position.x, position.y, children);
    view.setSize(176, 176).setInteractive({ useHandCursor: true }); view.setData('meta', { slot, unitId: unit.id } satisfies UnitViewMeta); this.scene.input.setDraggable(view);

    this.scene.time.delayedCall(Phaser.Math.Between(0, 450), () => {
      if (!view.active) return;
      this.scene.tweens.add({ targets: image, y: -3, scaleX: image.scaleX * 1.018, scaleY: image.scaleY * 0.982, duration: 1050 + Phaser.Math.Between(-120, 160), yoyo: true, repeat: -1, ease: 'Sine.InOut' });
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

    view.on('dragstart', () => { if (this.isLocked()) return; view.setDepth(1000); this.scene.tweens.add({ targets: view, scaleX: 1.08, scaleY: 1.08, duration: 110, ease: 'Back.Out' }); });
    view.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => { if (!this.isLocked()) view.setPosition(dragX, dragY); });
    view.on('dragend', () => { const meta = view.getData('meta') as UnitViewMeta; if (this.isLocked()) { this.snapHome(view, meta.slot); return; } this.onDrop(view, meta.slot, this.closestSlot(view.x, view.y)); });
    return view;
  }

  private roman(tier: 1 | 2 | 3): string {
    return tier === 1 ? 'I' : tier === 2 ? 'II' : 'III';
  }

  private pulse(view: Phaser.GameObjects.Container): void { view.setScale(0.45); this.scene.tweens.add({ targets: view, scaleX: 1.08, scaleY: 1.08, duration: 230, ease: 'Back.Out', onComplete: () => this.scene.tweens.add({ targets: view, scaleX: 1, scaleY: 1, duration: 130, ease: 'Sine.Out' }) }); }
  private closestSlot(x: number, y: number): number { let best = 0; let bestDistance = Number.POSITIVE_INFINITY; for (let index = 0; index < COLUMNS * ROWS; index += 1) { const position = this.slotPosition(index); const distance = Phaser.Math.Distance.Between(x, y, position.x, position.y); if (distance < bestDistance) { bestDistance = distance; best = index; } } return best; }
}
