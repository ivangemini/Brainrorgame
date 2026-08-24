import type * as Phaser from 'phaser';
import { formatOfflineDuration, type OfflineReward } from '../systems/offlineProgression';

export class OfflineRewardPanel {
  private overlay!: Phaser.GameObjects.Rectangle;
  private panel!: Phaser.GameObjects.Container;
  private opened = false;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly onClose: () => void
  ) {}

  public create(): void {
    this.overlay = this.scene.add.rectangle(0, 0, 1080, 1920, 0x040714, 0.54)
      .setOrigin(0)
      .setDepth(2300)
      .setInteractive()
      .setVisible(false);

    const glow = this.scene.add.graphics();
    glow.fillStyle(0x8befff, 0.12);
    glow.fillCircle(0, -250, 280);

    const card = this.scene.add.graphics();
    card.fillStyle(0x0b1330, 0.99);
    card.fillRoundedRect(-390, -430, 780, 860, 64);
    card.lineStyle(5, 0xa7efff, 0.28);
    card.strokeRoundedRect(-390, -430, 780, 860, 64);
    card.fillStyle(0x725ee8, 0.15);
    card.fillRoundedRect(-360, -398, 720, 168, 44);

    const title = this.scene.add.text(0, -355, 'WELCOME BACK!', {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '52px',
      color: '#f3fbff',
      stroke: '#252b66',
      strokeThickness: 9,
      align: 'center'
    }).setOrigin(0.5);
    const subtitle = this.scene.add.text(0, -292, 'THE CREW KEPT SCAVENGING', {
      fontFamily: 'system-ui, sans-serif',
      fontStyle: '900',
      fontSize: '20px',
      color: '#a9bce9'
    }).setOrigin(0.5);
    const icon = this.scene.add.image(0, -90, 'ui-offline-cache').setDisplaySize(260, 260);

    const durationLabel = this.scene.add.text(0, 72, '', {
      fontFamily: 'system-ui, sans-serif', fontStyle: '800', fontSize: '24px', color: '#9eb5e9'
    }).setOrigin(0.5).setName('duration');
    const rewardLabel = this.scene.add.text(0, 145, '', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '58px', color: '#fff0a0', stroke: '#61401c', strokeThickness: 8
    }).setOrigin(0.5).setName('reward');
    const rewardSub = this.scene.add.text(0, 209, 'OFFLINE COINS', {
      fontFamily: 'system-ui, sans-serif', fontStyle: '900', fontSize: '21px', color: '#bdcaf0'
    }).setOrigin(0.5);

    const buttonBg = this.scene.add.graphics();
    buttonBg.fillStyle(0xffcf54, 1);
    buttonBg.fillRoundedRect(-230, -58, 460, 116, 48);
    buttonBg.lineStyle(6, 0xfff1a3, 0.82);
    buttonBg.strokeRoundedRect(-230, -58, 460, 116, 48);
    const buttonText = this.scene.add.text(0, -2, 'COLLECT', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '36px', color: '#4d2b1b'
    }).setOrigin(0.5);
    const button = this.scene.add.container(0, 338, [buttonBg, buttonText]);
    button.setSize(460, 116).setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => {
      this.scene.tweens.add({ targets: button, scaleX: 0.96, scaleY: 0.94, duration: 75, yoyo: true, ease: 'Quad.Out' });
      this.hide();
    });

    this.panel = this.scene.add.container(540, 960, [glow, card, title, subtitle, icon, durationLabel, rewardLabel, rewardSub, button])
      .setDepth(2301)
      .setVisible(false);
  }

  public show(reward: OfflineReward): void {
    if (reward.coins <= 0) return;
    const duration = this.panel.getByName('duration') as Phaser.GameObjects.Text;
    const rewardText = this.panel.getByName('reward') as Phaser.GameObjects.Text;
    duration.setText(`AWAY FOR ${formatOfflineDuration(reward.rewardedSeconds).toUpperCase()}`);
    rewardText.setText(`+${reward.coins}`);
    this.opened = true;
    this.overlay.setVisible(true).setAlpha(0);
    this.panel.setVisible(true).setAlpha(0).setScale(0.68);
    this.scene.tweens.add({ targets: this.overlay, alpha: 1, duration: 180, ease: 'Quad.Out' });
    this.scene.tweens.add({ targets: this.panel, alpha: 1, scaleX: 1, scaleY: 1, duration: 360, ease: 'Back.Out' });
  }

  public hide(): void {
    if (!this.opened) return;
    this.opened = false;
    this.scene.tweens.add({
      targets: this.panel, alpha: 0, scaleX: 0.86, scaleY: 0.86, duration: 180, ease: 'Quad.In', onComplete: () => {
        this.panel.setVisible(false);
        this.overlay.setVisible(false);
        this.onClose();
      }
    });
    this.scene.tweens.add({ targets: this.overlay, alpha: 0, duration: 150, ease: 'Quad.In' });
  }

  public isOpen(): boolean { return this.opened; }
}
