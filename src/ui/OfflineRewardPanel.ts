import type * as Phaser from 'phaser';
import { formatOfflineDuration, type OfflineReward } from '../systems/offlineProgression';

export class OfflineRewardPanel {
  private overlay!: Phaser.GameObjects.Rectangle;
  private panel!: Phaser.GameObjects.Container;
  private durationLabel!: Phaser.GameObjects.Text;
  private rewardLabel!: Phaser.GameObjects.Text;
  private noteLabel!: Phaser.GameObjects.Text;
  private opened = false;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly onClose: () => void
  ) {}

  public create(): void {
    this.overlay = this.scene.add.rectangle(0, 0, 1080, 1920, 0x040714, 0.58)
      .setOrigin(0)
      .setDepth(2300)
      .setInteractive()
      .setVisible(false);

    const glow = this.scene.add.graphics();
    glow.fillStyle(0x8befff, 0.12);
    glow.fillCircle(0, -250, 280);

    const card = this.scene.add.graphics();
    card.fillStyle(0x0b1330, 0.99);
    card.fillRoundedRect(-390, -455, 780, 910, 64);
    card.lineStyle(5, 0xa7efff, 0.28);
    card.strokeRoundedRect(-390, -455, 780, 910, 64);
    card.fillStyle(0x725ee8, 0.15);
    card.fillRoundedRect(-360, -423, 720, 168, 44);

    const title = this.scene.add.text(0, -380, 'WELCOME BACK!', {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '52px',
      color: '#f3fbff',
      stroke: '#252b66',
      strokeThickness: 9,
      align: 'center'
    }).setOrigin(0.5);
    const subtitle = this.scene.add.text(0, -317, 'THE CREW KEPT SCAVENGING', {
      fontFamily: 'system-ui, sans-serif',
      fontStyle: '900',
      fontSize: '20px',
      color: '#a9bce9'
    }).setOrigin(0.5);
    const icon = this.scene.add.image(0, -115, 'ui-offline-cache').setDisplaySize(270, 270);

    this.durationLabel = this.scene.add.text(0, 48, '', {
      fontFamily: 'system-ui, sans-serif', fontStyle: '800', fontSize: '24px', color: '#9eb5e9'
    }).setOrigin(0.5);
    this.rewardLabel = this.scene.add.text(0, 128, '', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '62px', color: '#fff0a0', stroke: '#61401c', strokeThickness: 8
    }).setOrigin(0.5);
    const rewardSub = this.scene.add.text(0, 194, 'OFFLINE COINS', {
      fontFamily: 'system-ui, sans-serif', fontStyle: '900', fontSize: '21px', color: '#bdcaf0'
    }).setOrigin(0.5);
    this.noteLabel = this.scene.add.text(0, 252, '', {
      fontFamily: 'system-ui, sans-serif', fontStyle: '700', fontSize: '18px', color: '#899dcc', align: 'center', wordWrap: { width: 620 }
    }).setOrigin(0.5);

    const buttonBg = this.scene.add.graphics();
    buttonBg.fillStyle(0xffcf54, 1);
    buttonBg.fillRoundedRect(-230, -58, 460, 116, 48);
    buttonBg.lineStyle(6, 0xfff1a3, 0.82);
    buttonBg.strokeRoundedRect(-230, -58, 460, 116, 48);
    const buttonText = this.scene.add.text(0, -2, 'COLLECT', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '36px', color: '#4d2b1b'
    }).setOrigin(0.5);
    const button = this.scene.add.container(0, 374, [buttonBg, buttonText]);
    button.setSize(460, 116).setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => {
      this.scene.tweens.add({ targets: button, scaleX: 0.96, scaleY: 0.94, duration: 75, yoyo: true, ease: 'Quad.Out' });
      this.hide();
    });

    this.panel = this.scene.add.container(540, 960, [
      glow, card, title, subtitle, icon, this.durationLabel, this.rewardLabel, rewardSub, this.noteLabel, button
    ]).setDepth(2301).setVisible(false);
  }

  public show(reward: OfflineReward): void {
    if (reward.coins <= 0) return;
    this.durationLabel.setText(`AWAY FOR ${formatOfflineDuration(reward.elapsedSeconds).toUpperCase()}`);
    this.rewardLabel.setText(`+${reward.coins}`);
    const capped = reward.elapsedSeconds > reward.rewardedSeconds;
    this.noteLabel.setText(capped
      ? `Earnings capped at ${formatOfflineDuration(reward.rewardedSeconds)}. Core Shards still require boss wins.`
      : 'Core Shards still require boss wins — offline time only earns coins.');
    this.opened = true;
    this.overlay.setVisible(true).setAlpha(0);
    this.panel.setVisible(true).setAlpha(0).setScale(0.68).setY(1010);
    this.scene.tweens.add({ targets: this.overlay, alpha: 1, duration: 180, ease: 'Quad.Out' });
    this.scene.tweens.add({ targets: this.panel, alpha: 1, scaleX: 1, scaleY: 1, y: 960, duration: 360, ease: 'Back.Out' });
  }

  public hide(): void {
    if (!this.opened) return;
    this.opened = false;
    this.scene.tweens.add({
      targets: this.panel, alpha: 0, scaleX: 0.86, scaleY: 0.86, y: 990, duration: 180, ease: 'Quad.In', onComplete: () => {
        this.panel.setVisible(false);
        this.overlay.setVisible(false);
        this.onClose();
      }
    });
    this.scene.tweens.add({ targets: this.overlay, alpha: 0, duration: 150, ease: 'Quad.In' });
  }

  public isOpen(): boolean { return this.opened; }
}
