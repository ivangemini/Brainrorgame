import type * as Phaser from 'phaser';

export class RevivePanel {
  private overlay!: Phaser.GameObjects.Rectangle;
  private panel!: Phaser.GameObjects.Container;
  private reviveButton!: Phaser.GameObjects.Container;
  private reviveLabel!: Phaser.GameObjects.Text;
  private opened = false;
  private inFlight = false;
  private rewardedAvailable = true;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly onRewardedRevive: () => Promise<boolean>,
    private readonly onFreeRetry: () => void
  ) {}

  public create(): void {
    this.overlay = this.scene.add.rectangle(0, 0, 1080, 1920, 0x050715, 0.7)
      .setOrigin(0)
      .setDepth(2350)
      .setInteractive()
      .setVisible(false);

    const card = this.scene.add.graphics();
    card.fillStyle(0x0d1432, 0.995);
    card.fillRoundedRect(-414, -530, 828, 1060, 64);
    card.lineStyle(5, 0xa8efff, 0.28);
    card.strokeRoundedRect(-414, -530, 828, 1060, 64);
    card.fillStyle(0x6a3f9b, 0.16);
    card.fillRoundedRect(-378, -494, 756, 184, 44);

    const title = this.scene.add.text(0, -435, 'FORTRESS CRACKED!', {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '48px',
      color: '#f5fbff',
      stroke: '#30446f',
      strokeThickness: 9
    }).setOrigin(0.5);
    const subtitle = this.scene.add.text(0, -370, 'KEEP THE DAMAGE OR RESTART THE FIGHT', {
      fontFamily: 'system-ui, sans-serif',
      fontStyle: '900',
      fontSize: '19px',
      color: '#aebce5'
    }).setOrigin(0.5);
    const icon = this.scene.add.image(0, -154, 'ui-revive-bolt').setDisplaySize(250, 250);

    const reviveBg = this.scene.add.graphics();
    reviveBg.fillStyle(0xffc94d, 1);
    reviveBg.fillRoundedRect(-294, -74, 588, 148, 52);
    reviveBg.lineStyle(6, 0xfff1a3, 0.84);
    reviveBg.strokeRoundedRect(-294, -74, 588, 148, 52);
    this.reviveLabel = this.scene.add.text(0, -20, 'WATCH AD • REVIVE 60 HP', {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '28px',
      color: '#442719',
      align: 'center'
    }).setOrigin(0.5);
    const reviveSub = this.scene.add.text(0, 28, 'KEEP ENEMY DAMAGE', {
      fontFamily: 'system-ui, sans-serif',
      fontStyle: '900',
      fontSize: '18px',
      color: '#70401f'
    }).setOrigin(0.5);
    this.reviveButton = this.scene.add.container(0, 130, [reviveBg, this.reviveLabel, reviveSub]);
    this.reviveButton.setSize(588, 148).setInteractive({ useHandCursor: true });
    this.reviveButton.on('pointerdown', () => void this.tryRewardedRevive());

    const retryBg = this.scene.add.graphics();
    retryBg.fillStyle(0x283155, 1);
    retryBg.fillRoundedRect(-260, -64, 520, 128, 46);
    retryBg.lineStyle(4, 0xaec7ff, 0.3);
    retryBg.strokeRoundedRect(-260, -64, 520, 128, 46);
    const retryLabel = this.scene.add.text(0, -16, 'RETRY FREE', {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '28px',
      color: '#eef5ff'
    }).setOrigin(0.5);
    const retrySub = this.scene.add.text(0, 25, 'ENEMY RETURNS TO FULL HP', {
      fontFamily: 'system-ui, sans-serif',
      fontStyle: '800',
      fontSize: '16px',
      color: '#9eafd5'
    }).setOrigin(0.5);
    const retryButton = this.scene.add.container(0, 340, [retryBg, retryLabel, retrySub]);
    retryButton.setSize(520, 128).setInteractive({ useHandCursor: true });
    retryButton.on('pointerdown', () => {
      if (this.inFlight) return;
      this.scene.tweens.add({ targets: retryButton, scaleX: 0.96, scaleY: 0.95, duration: 80, yoyo: true, ease: 'Quad.Out' });
      this.onFreeRetry();
      this.hide();
    });

    const note = this.scene.add.text(0, 454, 'Rewarded revive is optional. Free retry is always available.', {
      fontFamily: 'system-ui, sans-serif',
      fontStyle: '700',
      fontSize: '16px',
      color: '#7788b2'
    }).setOrigin(0.5);

    this.panel = this.scene.add.container(540, 960, [card, title, subtitle, icon, this.reviveButton, retryButton, note])
      .setDepth(2351)
      .setVisible(false);
  }

  public show(rewardedAvailable: boolean): void {
    this.opened = true;
    this.inFlight = false;
    this.rewardedAvailable = rewardedAvailable;
    this.reviveLabel.setText(rewardedAvailable ? 'WATCH AD • REVIVE 60 HP' : 'REVIVE USED');
    this.reviveButton.setAlpha(rewardedAvailable ? 1 : 0.48);
    this.overlay.setVisible(true).setAlpha(0);
    this.panel.setVisible(true).setAlpha(0).setScale(0.72);
    this.scene.tweens.add({ targets: this.overlay, alpha: 1, duration: 170, ease: 'Quad.Out' });
    this.scene.tweens.add({ targets: this.panel, alpha: 1, scaleX: 1, scaleY: 1, duration: 330, ease: 'Back.Out' });
  }

  public hide(): void {
    if (!this.opened) return;
    this.opened = false;
    this.inFlight = false;
    this.scene.tweens.add({
      targets: this.panel,
      alpha: 0,
      scaleX: 0.88,
      scaleY: 0.88,
      duration: 160,
      ease: 'Quad.In',
      onComplete: () => {
        this.panel.setVisible(false);
        this.overlay.setVisible(false);
      }
    });
    this.scene.tweens.add({ targets: this.overlay, alpha: 0, duration: 135, ease: 'Quad.In' });
  }

  public isOpen(): boolean {
    return this.opened;
  }

  private async tryRewardedRevive(): Promise<void> {
    if (!this.opened || this.inFlight || !this.rewardedAvailable) return;
    this.inFlight = true;
    this.reviveLabel.setText('CONNECTING…');
    this.reviveButton.setAlpha(0.72);
    this.scene.tweens.add({ targets: this.reviveButton, scaleX: 0.96, scaleY: 0.95, duration: 80, yoyo: true, ease: 'Quad.Out' });

    let revived = false;
    try {
      revived = await this.onRewardedRevive();
    } catch {
      revived = false;
    }

    if (!this.opened) return;
    this.inFlight = false;
    if (revived) {
      this.hide();
      return;
    }
    this.rewardedAvailable = false;
    this.reviveLabel.setText('AD UNAVAILABLE');
    this.reviveButton.setAlpha(0.48);
  }
}
