import * as Phaser from 'phaser';
import type { GameFx } from '../presentation/GameFx';

export class BossView {
  private title!: Phaser.GameObjects.Text;
  private shadow!: Phaser.GameObjects.Ellipse;
  private boss!: Phaser.GameObjects.Image;
  private hpBar!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;

  public constructor(private readonly scene: Phaser.Scene, private readonly fx: GameFx) {}

  public create(): void {
    this.title = this.scene.add.text(540, 282, 'FRIDGINO MAXIMO', {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '42px',
      color: '#dffaff',
      stroke: '#19234b',
      strokeThickness: 9
    }).setOrigin(0.5);
    this.shadow = this.scene.add.ellipse(540, 834, 520, 94, 0x071020, 0.34);
    this.boss = this.scene.add.image(540, 565, 'boss-fridgino').setDisplaySize(570, 570);
    this.hpBar = this.scene.add.graphics();
    this.hpText = this.scene.add.text(540, 906, '', {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '25px',
      color: '#fff7fb',
      stroke: '#481d49',
      strokeThickness: 5
    }).setOrigin(0.5);
    this.hide();
  }

  public show(): void {
    this.scene.tweens.killTweensOf(this.boss);
    this.title.setVisible(true).setAlpha(1);
    this.shadow.setVisible(true).setAlpha(1);
    this.hpBar.setVisible(true).setAlpha(1);
    this.hpText.setVisible(true).setAlpha(1);
    this.boss.setVisible(true).setPosition(540, 565).setAngle(0).setAlpha(1).setDisplaySize(570, 570);
    const targetScaleX = this.boss.scaleX;
    const targetScaleY = this.boss.scaleY;
    this.boss.setScale(targetScaleX * 0.68, targetScaleY * 0.68);
    this.scene.tweens.add({
      targets: this.boss,
      scaleX: targetScaleX,
      scaleY: targetScaleY,
      duration: 420,
      ease: 'Back.Out',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.boss,
          y: 578,
          scaleX: targetScaleX * 1.015,
          scaleY: targetScaleY * 0.985,
          duration: 1350,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut'
        });
      }
    });
  }

  public hide(): void {
    if (this.boss) this.scene.tweens.killTweensOf(this.boss);
    this.title?.setVisible(false);
    this.shadow?.setVisible(false);
    this.boss?.setVisible(false);
    this.hpBar?.setVisible(false);
    this.hpText?.setVisible(false);
  }

  public setHealth(current: number, max: number): void {
    const ratio = Phaser.Math.Clamp(current / max, 0, 1);
    this.hpBar.clear();
    this.hpBar.fillStyle(0x10182f, 0.92);
    this.hpBar.fillRoundedRect(170, 866, 740, 66, 33);
    this.hpBar.fillStyle(ratio > 0.35 ? 0x69dcff : 0xff6784, 1);
    this.hpBar.fillRoundedRect(178, 874, 724 * ratio, 50, 25);
    this.hpBar.lineStyle(4, 0xdaf9ff, 0.5);
    this.hpBar.strokeRoundedRect(170, 866, 740, 66, 33);
    this.hpText.setText(`${current} / ${max}`);
  }

  public targetPoint(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(540 + Phaser.Math.Between(-78, 78), 555 + Phaser.Math.Between(-65, 75));
  }

  public hit(color: number): void {
    this.scene.tweens.add({
      targets: this.boss,
      scaleX: this.boss.scaleX * 0.965,
      scaleY: this.boss.scaleY * 1.025,
      duration: 55,
      yoyo: true,
      ease: 'Quad.Out'
    });
    this.fx.burst(this.boss.x + Phaser.Math.Between(-100, 100), this.boss.y + Phaser.Math.Between(-80, 80), color, 5, 90);
  }

  public telegraph(onImpact: () => void): void {
    const ring = this.scene.add.circle(this.boss.x, this.boss.y + 20, 115, 0xff6688, 0.08)
      .setStrokeStyle(12, 0xff8ca6, 0.82)
      .setDepth(700)
      .setScale(0.55);
    this.scene.tweens.add({ targets: ring, scaleX: 2.25, scaleY: 2.25, alpha: 0.14, duration: 630, ease: 'Cubic.Out' });
    this.scene.tweens.add({ targets: this.boss, y: this.boss.y - 25, angle: Phaser.Math.Between(-3, 3), duration: 340, ease: 'Back.Out' });
    this.scene.time.delayedCall(650, () => {
      ring.destroy();
      onImpact();
      this.scene.tweens.add({ targets: this.boss, y: 565, angle: 0, duration: 250, ease: 'Back.Out' });
    });
  }

  public defeat(reward: number, onComplete: () => void): void {
    this.scene.tweens.killTweensOf(this.boss);
    const banner = this.scene.add.text(540, 420, 'BOSS MELTED!', {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '70px',
      color: '#fff5a8',
      stroke: '#66305c',
      strokeThickness: 12
    }).setOrigin(0.5).setDepth(1200).setScale(0.35);
    const rewardText = this.scene.add.text(540, 500, `+${reward} COINS`, {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '34px',
      color: '#dfffff',
      stroke: '#25375a',
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(1200).setAlpha(0);
    this.scene.tweens.add({ targets: banner, scaleX: 1, scaleY: 1, duration: 350, ease: 'Back.Out' });
    this.scene.tweens.add({ targets: rewardText, alpha: 1, y: 520, duration: 350, delay: 180, ease: 'Quad.Out' });
    this.scene.tweens.add({
      targets: this.boss,
      y: 720,
      angle: 11,
      scaleX: this.boss.scaleX * 0.82,
      scaleY: this.boss.scaleY * 0.72,
      alpha: 0,
      duration: 760,
      ease: 'Back.In'
    });
    this.scene.time.delayedCall(1450, () => {
      banner.destroy();
      rewardText.destroy();
      onComplete();
    });
  }

  public reset(): void {
    this.scene.tweens.killTweensOf(this.boss);
    this.boss.setPosition(540, 565).setAngle(0).setAlpha(1).setDisplaySize(570, 570);
  }
}
