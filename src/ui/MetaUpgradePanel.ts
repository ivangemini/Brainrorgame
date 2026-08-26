import type * as Phaser from 'phaser';
import { translate, resolveLocale } from '../i18n';
import { getAscensionCopy } from '../i18n/ascensionCopy';
import { localizedMetaEffect, localizedMetaUpgrade } from '../i18n/gameplayContent';
import type { PlatformAdapter } from '../platform/PlatformAdapter';
import { createFreshGameSave } from '../state/freshSave';
import {
  META_UPGRADES,
  getUpgradeCost,
  type MetaUpgradeId,
  type MetaUpgradeLevels
} from '../systems/metaProgression';
import { AscensionPanel } from './AscensionPanel';

interface CardView {
  readonly id: MetaUpgradeId;
  readonly levelText: Phaser.GameObjects.Text;
  readonly effectText: Phaser.GameObjects.Text;
  readonly costText: Phaser.GameObjects.Text;
  readonly buttonBackground: Phaser.GameObjects.Graphics;
  readonly button: Phaser.GameObjects.Container;
}

export class MetaUpgradePanel {
  private overlay!: Phaser.GameObjects.Rectangle;
  private drawer!: Phaser.GameObjects.Container;
  private shardText!: Phaser.GameObjects.Text;
  private ascensionPanel!: AscensionPanel;
  private resetBackground!: Phaser.GameObjects.Graphics;
  private resetLabel!: Phaser.GameObjects.Text;
  private resetHit!: Phaser.GameObjects.Rectangle;
  private resetTimer: Phaser.Time.TimerEvent | null = null;
  private resetArmed = false;
  private readonly cards = new Map<MetaUpgradeId, CardView>();
  private opened = false;
  private shards = 0;
  private levels: MetaUpgradeLevels = { power: 0, armor: 0, bounty: 0 };

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly onPurchase: (id: MetaUpgradeId) => void,
    private readonly onResetProgress?: () => Promise<void>
  ) {}

  public create(): void {
    this.overlay = this.scene.add.rectangle(0, 0, 1080, 1920, 0x050916, 0.34).setOrigin(0).setDepth(2100).setInteractive().setVisible(false);
    this.overlay.on('pointerdown', () => this.hide());
    const children: Phaser.GameObjects.GameObject[] = [];
    children.push(this.scene.add.rectangle(-310, 935, 620, 1370, 0xffffff, 0.001).setInteractive());
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x0a1028, 0.98); panel.fillRoundedRect(-620, 250, 600, 1380, 58);
    panel.lineStyle(4, 0x8befff, 0.22); panel.strokeRoundedRect(-620, 250, 600, 1380, 58);
    panel.fillStyle(0x653fa0, 0.2); panel.fillRoundedRect(-604, 266, 568, 164, 42); children.push(panel);
    const title = this.scene.add.text(-568, 300, translate('lab.title'), { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '40px', color: '#f1fbff', stroke: '#22254d', strokeThickness: 8 });
    const subtitle = this.scene.add.text(-565, 362, translate('lab.subtitle'), { fontFamily: 'system-ui, sans-serif', fontStyle: '900', fontSize: '18px', color: '#a7bdf3' });
    const shardIcon = this.scene.add.image(-170, 338, 'ui-core-shard').setDisplaySize(58, 58);
    this.shardText = this.scene.add.text(-127, 317, '0', { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '34px', color: '#bffaff', stroke: '#2a386a', strokeThickness: 5 });
    children.push(title, subtitle, shardIcon, this.shardText);
    const closeBg = this.scene.add.graphics(); closeBg.fillStyle(0x26365e, 0.96); closeBg.fillRoundedRect(-152, 378, 112, 54, 24); closeBg.lineStyle(2, 0xd9f7ff, 0.22); closeBg.strokeRoundedRect(-152, 378, 112, 54, 24);
    const closeLabel = this.scene.add.text(-96, 405, translate('common.close'), { fontFamily: 'system-ui, sans-serif', fontStyle: '900', fontSize: '14px', color: '#dcecff' }).setOrigin(0.5);
    const closeHit = this.scene.add.rectangle(-96, 405, 120, 62, 0xffffff, 0.001).setInteractive({ useHandCursor: true }); closeHit.on('pointerdown', () => this.hide()); children.push(closeBg, closeLabel, closeHit);
    META_UPGRADES.forEach((definition, index) => { const centerY = 585 + index * 330; const card = this.createCard(definition.id, centerY); children.push(...card.children); this.cards.set(definition.id, card.view); });

    const ascensionCopy = getAscensionCopy(resolveLocale());
    const ascensionBg = this.scene.add.graphics();
    ascensionBg.fillStyle(0x6f3eb8, 0.96); ascensionBg.fillRoundedRect(-552, 1410, 484, 92, 34);
    ascensionBg.lineStyle(3, 0xd9b8ff, 0.4); ascensionBg.strokeRoundedRect(-552, 1410, 484, 92, 34);
    const ascensionLabel = this.scene.add.text(-310, 1456, `★  ${ascensionCopy.title}`, { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '21px', color: '#f8efff' }).setOrigin(0.5);
    const ascensionHit = this.scene.add.rectangle(-310, 1456, 500, 102, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    ascensionHit.on('pointerdown', () => {
      this.scene.tweens.add({ targets: ascensionLabel, scaleX: 0.96, scaleY: 0.96, duration: 70, yoyo: true, ease: 'Quad.Out' });
      void this.ascensionPanel.show();
    });
    children.push(ascensionBg, ascensionLabel, ascensionHit);
    children.push(this.scene.add.text(-565, 1520, translate('lab.hint'), { fontFamily: 'system-ui, sans-serif', fontStyle: '700', fontSize: '16px', color: '#8297c8', wordWrap: { width: 500 } }));

    this.resetBackground = this.scene.add.graphics();
    this.resetLabel = this.scene.add.text(-310, 1590, 'RESET PROGRESS', {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '15px',
      color: '#ffb3bd'
    }).setOrigin(0.5);
    this.resetHit = this.scene.add.rectangle(-310, 1590, 300, 54, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    this.resetHit.on('pointerdown', () => this.handleResetTap());
    this.paintResetButton(false);
    children.push(this.resetBackground, this.resetLabel, this.resetHit);

    this.drawer = this.scene.add.container(1700, 0, children).setDepth(2101).setVisible(false);
    this.ascensionPanel = new AscensionPanel(this.scene);
    this.ascensionPanel.create();
  }

  public show(shards: number, levels: MetaUpgradeLevels): void { this.shards = shards; this.levels = levels; this.refresh(); if (this.opened) return; this.opened = true; this.overlay.setVisible(true).setAlpha(0); this.drawer.setVisible(true).setX(1700); this.scene.tweens.add({ targets: this.overlay, alpha: 1, duration: 180, ease: 'Quad.Out' }); this.scene.tweens.add({ targets: this.drawer, x: 1080, duration: 330, ease: 'Back.Out' }); }
  public hide(): void { if (!this.opened || this.ascensionPanel.isOpen()) return; this.disarmReset(); this.opened = false; this.scene.tweens.add({ targets: this.overlay, alpha: 0, duration: 150, ease: 'Quad.In' }); this.scene.tweens.add({ targets: this.drawer, x: 1700, duration: 220, ease: 'Quad.In', onComplete: () => { if (!this.opened) { this.drawer.setVisible(false); this.overlay.setVisible(false); } } }); }
  public update(shards: number, levels: MetaUpgradeLevels): void { this.shards = shards; this.levels = levels; this.refresh(); }
  public isOpen(): boolean { return this.opened || this.ascensionPanel.isOpen(); }

  private createCard(id: MetaUpgradeId, centerY: number): { children: Phaser.GameObjects.GameObject[]; view: CardView } {
    const definition = META_UPGRADES.find((item) => item.id === id)!; const localized = localizedMetaUpgrade(id); const children: Phaser.GameObjects.GameObject[] = []; const background = this.scene.add.graphics();
    background.fillStyle(0x151f42, 0.98); background.fillRoundedRect(-580, centerY - 130, 520, 270, 40); background.lineStyle(3, definition.accentColor, 0.28); background.strokeRoundedRect(-580, centerY - 130, 520, 270, 40);
    const iconHalo = this.scene.add.circle(-492, centerY - 36, 66, definition.accentColor, 0.12); const icon = this.scene.add.image(-492, centerY - 36, definition.texture).setDisplaySize(132, 132);
    const name = this.scene.add.text(-408, centerY - 112, localized.name, { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '25px', color: '#f4f8ff', stroke: '#172144', strokeThickness: 5 });
    const description = this.scene.add.text(-408, centerY - 70, localized.description, { fontFamily: 'system-ui, sans-serif', fontStyle: '700', fontSize: '17px', color: '#9fb6e8', wordWrap: { width: 310 } });
    const levelText = this.scene.add.text(-408, centerY - 6, '', { fontFamily: 'system-ui, sans-serif', fontStyle: '900', fontSize: '19px', color: '#d9ecff' });
    const effectText = this.scene.add.text(-408, centerY + 28, '', { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '19px', color: `#${definition.accentColor.toString(16).padStart(6, '0')}` });
    const buttonBackground = this.scene.add.graphics(); const costText = this.scene.add.text(0, 0, '', { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '22px', color: '#12203d' }).setOrigin(0.5); const shard = this.scene.add.image(-54, 0, 'ui-core-shard').setDisplaySize(38, 38);
    const button = this.scene.add.container(-240, centerY + 93, [buttonBackground, shard, costText]); button.setSize(300, 72).setInteractive({ useHandCursor: true }); button.on('pointerdown', () => { this.scene.tweens.add({ targets: button, scaleX: 0.96, scaleY: 0.94, duration: 75, yoyo: true, ease: 'Quad.Out' }); this.onPurchase(id); });
    children.push(background, iconHalo, icon, name, description, levelText, effectText, button); return { children, view: { id, levelText, effectText, costText, buttonBackground, button } };
  }

  private handleResetTap(): void {
    if (!this.resetArmed) {
      this.resetArmed = true;
      this.resetLabel.setText('TAP AGAIN TO RESET');
      this.paintResetButton(true);
      this.resetTimer?.remove(false);
      this.resetTimer = this.scene.time.delayedCall(4000, () => this.disarmReset());
      return;
    }

    this.resetTimer?.remove(false);
    this.resetTimer = null;
    this.resetArmed = false;
    this.resetLabel.setText('RESETTING…');
    this.resetHit.disableInteractive();
    this.paintResetButton(true);
    void this.resetProgress().catch(() => {
      this.resetHit.setInteractive({ useHandCursor: true });
      this.resetLabel.setText('RESET FAILED — TRY AGAIN');
      this.paintResetButton(true);
      this.resetTimer = this.scene.time.delayedCall(2200, () => this.disarmReset());
    });
  }

  private async resetProgress(): Promise<void> {
    if (this.onResetProgress) {
      await this.onResetProgress();
      return;
    }

    const platform = this.scene.registry.get('platform') as PlatformAdapter | undefined;
    if (!platform) throw new Error('Platform adapter unavailable');
    await platform.save(createFreshGameSave());

    if (typeof window === 'undefined') throw new Error('Reload unavailable');
    window.location.reload();
  }

  private disarmReset(): void {
    this.resetTimer?.remove(false);
    this.resetTimer = null;
    this.resetArmed = false;
    if (!this.resetHit || !this.resetLabel) return;
    this.resetHit.setInteractive({ useHandCursor: true });
    this.resetLabel.setText('RESET PROGRESS');
    this.paintResetButton(false);
  }

  private paintResetButton(armed: boolean): void {
    if (!this.resetBackground) return;
    this.resetBackground.clear();
    this.resetBackground.fillStyle(armed ? 0x71253a : 0x281a2c, armed ? 0.9 : 0.78);
    this.resetBackground.fillRoundedRect(-460, 1563, 300, 54, 22);
    this.resetBackground.lineStyle(2, armed ? 0xff7f92 : 0xff95a6, armed ? 0.8 : 0.28);
    this.resetBackground.strokeRoundedRect(-460, 1563, 300, 54, 22);
  }

  private refresh(): void {
    this.shardText.setText(`${this.shards}`);
    for (const [id, card] of this.cards) { const definition = META_UPGRADES.find((item) => item.id === id)!; const level = this.levels[id]; const cost = getUpgradeCost(id, this.levels); card.levelText.setText(translate('common.level', { current: level, max: definition.maxLevel })); card.effectText.setText(localizedMetaEffect(id, level)); card.buttonBackground.clear(); if (cost === null) { card.buttonBackground.fillStyle(0x53617c, 0.8); card.buttonBackground.fillRoundedRect(-150, -36, 300, 72, 30); card.costText.setText(translate('common.maxed')).setX(0); card.button.disableInteractive(); } else { const canBuy = this.shards >= cost; card.buttonBackground.fillStyle(canBuy ? definition.accentColor : 0x667089, canBuy ? 1 : 0.62); card.buttonBackground.fillRoundedRect(-150, -36, 300, 72, 30); card.buttonBackground.lineStyle(3, 0xffffff, canBuy ? 0.46 : 0.12); card.buttonBackground.strokeRoundedRect(-150, -36, 300, 72, 30); card.costText.setText(`${cost}`).setX(14); card.button.setInteractive({ useHandCursor: true }); } }
  }
}
