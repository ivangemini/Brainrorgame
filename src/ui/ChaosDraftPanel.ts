import type * as Phaser from 'phaser';
import { getAscensionCopy } from '../i18n/ascensionCopy';
import { resolveLocale, translate as t, type TranslationKey } from '../i18n';
import {
  getChaosPerkDefinition,
  getChaosPerkOffers,
  type ChaosDraftCheckpoint,
  type ChaosDraftOffers,
  type ChaosPerkId
} from '../systems/chaosDraft';
import {
  canUseAscensionDraftReroll,
  consumeAscensionDraftReroll
} from '../systems/ascensionRuntime';

export class ChaosDraftPanel {
  private root!: Phaser.GameObjects.Container;
  private cards: Phaser.GameObjects.Container[] = [];
  private rerollButton!: Phaser.GameObjects.Container;
  private rerollBackground!: Phaser.GameObjects.Graphics;
  private rerollLabel!: Phaser.GameObjects.Text;
  private open = false;
  private chapter = 1;
  private checkpoint: ChaosDraftCheckpoint = 1;
  private owned: readonly ChaosPerkId[] = [];
  private rerollIndex = 0;

  public constructor(private readonly scene: Phaser.Scene, private readonly onPick: (id: ChaosPerkId) => void) {}

  public create(): void {
    const dim = this.scene.add.rectangle(540, 960, 1080, 1920, 0x050916, 0.78).setInteractive();
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x0c1733, 0.98); panel.fillRoundedRect(-474, -455, 948, 910, 54);
    panel.lineStyle(5, 0x9ee9ff, 0.34); panel.strokeRoundedRect(-474, -455, 948, 910, 54);
    const title = this.scene.add.text(0, -378, t('draft.title'), { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '52px', color: '#f4fbff', stroke: '#17234c', strokeThickness: 9 }).setOrigin(0.5);
    const subtitle = this.scene.add.text(0, -318, t('draft.subtitle'), { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '20px', color: '#a9cce8', stroke: '#11182e', strokeThickness: 4 }).setOrigin(0.5);

    this.cards = [this.createCard(-330), this.createCard(-110), this.createCard(110), this.createCard(330)];

    this.rerollBackground = this.scene.add.graphics();
    this.rerollLabel = this.scene.add.text(0, 0, getAscensionCopy(resolveLocale()).nodes['chaos-reroute'].name, {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '19px', color: '#ede3ff'
    }).setOrigin(0.5);
    this.rerollButton = this.scene.add.container(0, 365, [this.rerollBackground, this.rerollLabel]).setSize(330, 64).setInteractive({ useHandCursor: true });
    this.rerollButton.on('pointerdown', () => this.reroll());

    this.root = this.scene.add.container(540, 960, [dim, panel, title, subtitle, ...this.cards, this.rerollButton]).setDepth(1800).setVisible(false);
  }

  public show(chapter: number, checkpoint: ChaosDraftCheckpoint, offers: ChaosDraftOffers, owned: readonly ChaosPerkId[]): void {
    this.open = true;
    this.chapter = chapter;
    this.checkpoint = checkpoint;
    this.owned = [...owned];
    this.rerollIndex = 0;
    this.root.setVisible(true).setAlpha(0).setScale(0.92);
    this.scene.tweens.add({ targets: this.root, alpha: 1, scaleX: 1, scaleY: 1, duration: 260, ease: 'Back.Out' });
    const subtitle = this.root.list[3] as Phaser.GameObjects.Text;
    subtitle.setText(t('draft.status', { chapter, checkpoint, owned: owned.length }));
    this.renderOffers(offers);
    this.refreshReroll();
  }

  public hide(): void { this.open = false; this.root.setVisible(false); }
  public isOpen(): boolean { return this.open; }

  private reroll(): void {
    if (!this.open || !consumeAscensionDraftReroll(this.chapter)) return;
    this.rerollIndex += 1;
    const offers = getChaosPerkOffers(this.chapter, this.checkpoint, this.owned, this.rerollIndex);
    this.scene.tweens.add({ targets: this.cards.filter((card) => card.visible), alpha: 0.25, duration: 90, yoyo: true, ease: 'Quad.Out' });
    this.renderOffers(offers);
    this.refreshReroll();
  }

  private refreshReroll(): void {
    const available = canUseAscensionDraftReroll(this.chapter);
    this.rerollBackground.clear();
    this.rerollBackground.fillStyle(available ? 0x6e49a8 : 0x38415e, available ? 0.96 : 0.6);
    this.rerollBackground.fillRoundedRect(-165, -32, 330, 64, 26);
    this.rerollBackground.lineStyle(2, 0xd8bcff, available ? 0.5 : 0.12);
    this.rerollBackground.strokeRoundedRect(-165, -32, 330, 64, 26);
    this.rerollLabel.setText(available ? `${getAscensionCopy(resolveLocale()).nodes['chaos-reroute'].name} • 1` : getAscensionCopy(resolveLocale()).nodes['chaos-reroute'].name);
    if (available) this.rerollButton.setInteractive({ useHandCursor: true });
    else this.rerollButton.disableInteractive();
    this.rerollButton.setAlpha(available ? 1 : 0.42);
  }

  private renderOffers(offers: ChaosDraftOffers): void {
    const four = offers.length === 4;
    const positions = four ? [-330, -110, 110, 330] : [-300, 0, 300];
    this.cards.forEach((card, index) => {
      const id = offers[index];
      if (!id) { card.setVisible(false); return; }
      card.setVisible(true).setX(positions[index] ?? 0);
      this.updateCard(card, id);
    });
  }

  private createCard(x: number): Phaser.GameObjects.Container {
    const plate = this.scene.add.graphics();
    const name = this.scene.add.text(0, -104, '', { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '20px', align: 'center', color: '#ffffff', stroke: '#11182d', strokeThickness: 5, wordWrap: { width: 176 } }).setOrigin(0.5);
    const description = this.scene.add.text(0, 4, '', { fontFamily: 'Arial, system-ui, sans-serif', fontSize: '18px', align: 'center', color: '#d9e8f8', lineSpacing: 5, wordWrap: { width: 174 } }).setOrigin(0.5);
    const pick = this.scene.add.text(0, 134, t('draft.pick'), { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '19px', color: '#fff7bd', stroke: '#3a3159', strokeThickness: 5 }).setOrigin(0.5);
    const card = this.scene.add.container(x, 24, [plate, name, description, pick]).setSize(204, 394).setInteractive({ useHandCursor: true });
    card.on('pointerdown', () => {
      const id = card.getData('perk') as ChaosPerkId | undefined;
      if (!id) return;
      this.scene.tweens.add({ targets: card, scaleX: 0.94, scaleY: 0.94, duration: 70, yoyo: true, ease: 'Quad.Out' });
      this.onPick(id);
    });
    return card;
  }

  private updateCard(card: Phaser.GameObjects.Container, id: ChaosPerkId): void {
    const definition = getChaosPerkDefinition(id);
    card.setData('perk', id);
    const [plate, name, description] = card.list as [Phaser.GameObjects.Graphics, Phaser.GameObjects.Text, Phaser.GameObjects.Text, Phaser.GameObjects.Text];
    plate.clear();
    plate.fillStyle(0x172546, 0.98); plate.fillRoundedRect(-102, -197, 204, 394, 30);
    plate.lineStyle(4, definition.accentColor, 0.82); plate.strokeRoundedRect(-102, -197, 204, 394, 30);
    plate.fillStyle(definition.accentColor, 0.18); plate.fillCircle(0, -78, 62);
    plate.lineStyle(4, definition.accentColor, 0.65); plate.strokeCircle(0, -78, 50);
    name.setText(t(`perk.${id}.name` as TranslationKey).toUpperCase()).setColor(`#${definition.accentColor.toString(16).padStart(6, '0')}`);
    description.setText(t(`perk.${id}.description` as TranslationKey));
  }
}
