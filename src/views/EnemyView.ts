import * as Phaser from 'phaser';
import { GameFx } from '../presentation/GameFx';
import type { EncounterSpec } from '../systems/encounters';

export class EnemyView {
  private title!: Phaser.GameObjects.Text;
  private waveBadge!: Phaser.GameObjects.Text;
  private shadow!: Phaser.GameObjects.Ellipse;
  private enemy!: Phaser.GameObjects.Image;
  private hpBar!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private accentColor = 0x78e8ff;
  private displaySize = 410;

  public constructor(private readonly scene: Phaser.Scene, private readonly fx: GameFx) {}

  public create(): void {
    this.title = this.scene.add.text(540, 300, '', {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '39px',
      color: '#f7fbff',
      stroke: '#19234b',
      strokeThickness: 9
    }).setOrigin(0.5);
    this.waveBadge = this.scene.add.text(540, 350, 'WAVE', {
      fontFamily: 'system-ui, sans-serif',
      fontStyle: '900',
      fontSize: '21px',
      color: '#b9c9ff',
      backgroundColor: '#182342cc',
      padding: { x: 18, y: 8 }
    }).setOrigin(0.5);
    this.shadow = this.scene.add.ellipse(540, 792, 410, 76, 0x071020, 0.3);
    this.enemy = this.scene.add.image(540, 575, 'enemy-jellini-sprinter').setDisplaySize(390, 390);
    this.hpBar = this.scene.add.graphics();
    this.hpText = this.scene.add.text(540, 887, '', {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '23px',
      color: '#fff7fb',
      stroke: '#2a244d',
      strokeThickness: 5
    }).setOrigin(0.5);
    this.hide();
  }

  public show(spec: EncounterSpec, waveNumber: number): void {
    this.scene.tweens.killTweensOf(this.enemy);
    this.accentColor = spec.accentColor;
    this.displaySize = spec.displaySize;
    this.title.setText(spec.name.toUpperCase()).setVisible(true).setAlpha(1);
    this.waveBadge.setText(`WAVE ${waveNumber} / 3`).setVisible(true).setAlpha(1);
    this.shadow.setVisible(true).setAlpha(1);
    this.enemy
      .setTexture(spec.texture)
      .setPosition(540, 575)
      .setAngle(0)
      .setAlpha(1)
      .setDisplaySize(this.displaySize, this.displaySize)
      .setVisible(true);
    this.hpBar.setVisible(true).setAlpha(1);
    this.hpText.setVisible(true).setAlpha(1);

    const targetScaleX = this.enemy.scaleX;
    const targetScaleY = this.enemy.scaleY;
    this.enemy.setScale(targetScaleX * 0.74, targetScaleY * 0.74);
    this.scene.tweens.add({
      targets: this.enemy,
      scaleX: targetScaleX,
      scaleY: targetScaleY,
      duration: 330,
      ease: 'Back.Out',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.enemy,
          y: 588,
          duration: 1050 + Phaser.Math.Between(0, 220),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut'
        });
      }
    });
  }

  public hide(): void {
    if (this.enemy) this.scene.tweens.killTweensOf(this.enemy);
    this.title?.setVisible(false);
    this.waveBadge?.setVisible(false);
    this.shadow?.setVisible(false);
    this.enemy?.setVisible(false);
    this.hpBar?.setVisible(false);
    this.hpText?.setVisible(false);
  }

  public setHealth(current: number, max: number): void {
    const ratio = Phaser.Math.Clamp(current / max, 0, 1);
    this.hpBar.clear();
    this.hpBar.fillStyle(0x10182f, 0.92);
    this.hpBar.fillRoundedRect(205, 842, 670, 58, 29);
    this.hpBar.fillStyle(ratio > 0.32 ? this.accentColor : 0xff6784, 1);
    this.hpBar.fillRoundedRect(213, 850, 654 * ratio, 42, 21);
    this.hpBar.lineStyle(4, 0xdaf9ff, 0.42);
    this.hpBar.strokeRoundedRect(205, 842, 670, 58, 29);
    this.hpText.setText(`${current} / ${max}`);
  }

  public targetPoint(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(540 + Phaser.Math.Between(-72, 72), 565 + Phaser.Math.Between(-62, 72));
  }

  public hit(color: number): void {
    this.scene.tweens.add({
      targets: this.enemy,
      scaleX: this.enemy.scaleX * 0.95,
      scaleY: this.enemy.scaleY * 1.035,
      angle: Phaser.Math.Between(-2, 2),
      duration: 55,
      yoyo: true,
      ease: 'Quad.Out'
    });
    this.fx.burst(this.enemy.x + Phaser.Math.Between(-75, 75), this.enemy.y + Phaser.Math.Between(-60, 60), color, 4, 72);
  }

  public telegraph(onImpact: () => void): void {
    const ring = this.scene.add.circle(this.enemy.x, this.enemy.y + 20, 86, this.accentColor, 0.07)
      .setStrokeStyle(9, this.accentColor, 0.78)
      .setDepth(700)
      .setScale(0.6);
    this.scene.tweens.add({ targets: ring, scaleX: 1.9, scaleY: 1.9, alpha: 0.1, duration: 520, ease: 'Cubic.Out' });
    this.scene.tweens.add({ targets: this.enemy, y: this.enemy.y - 20, scaleX: this.enemy.scaleX * 1.04, scaleY: this.enemy.scaleY * 0.96, duration: 250, ease: 'Back.Out' });
    this.scene.time.delayedCall(540, () => {
      ring.destroy();
      onImpact();
      this.scene.tweens.add({ targets: this.enemy, y: 575, angle: 0, duration: 220, ease: 'Back.Out' });
    });
  }

  public defeat(reward: number, onComplete: () => void): void {
    this.scene.tweens.killTweensOf(this.enemy);
    const banner = this.scene.add.text(540, 420, 'WAVE CRUSHED!', {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '55px',
      color: '#fff5a8',
      stroke: '#56305f',
      strokeThickness: 10
    }).setOrigin(0.5).setDepth(1200).setScale(0.35);
    const rewardText = this.scene.add.text(540, 485, `+${reward} COINS`, {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '30px',
      color: '#dfffff',
      stroke: '#25375a',
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(1200).setAlpha(0);

    this.scene.tweens.add({ targets: banner, scaleX: 1, scaleY: 1, duration: 280, ease: 'Back.Out' });
    this.scene.tweens.add({ targets: rewardText, alpha: 1, y: 505, duration: 300, delay: 110, ease: 'Quad.Out' });
    this.scene.tweens.add({
      targets: this.enemy,
      y: 650,
      angle: Phaser.Math.Between(-16, 16),
      scaleX: this.enemy.scaleX * 0.58,
      scaleY: this.enemy.scaleY * 0.58,
      alpha: 0,
      duration: 520,
      ease: 'Back.In'
    });
    this.scene.time.delayedCall(920, () => {
      banner.destroy();
      rewardText.destroy();
      onComplete();
    });
  }

  public reset(): void {
    this.scene.tweens.killTweensOf(this.enemy);
    this.enemy.setPosition(540, 575).setAngle(0).setAlpha(1).setDisplaySize(this.displaySize, this.displaySize);
  }
}
