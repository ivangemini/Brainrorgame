import * as Phaser from 'phaser';
import type { EliteModifierId } from '../content/eliteModifiers';
import type { GameFx } from '../presentation/GameFx';
import { WAVES_PER_CHAPTER, type WaveEncounterSpec } from '../systems/encounters';

export class EnemyView {
  private title!: Phaser.GameObjects.Text;
  private waveBadge!: Phaser.GameObjects.Text;
  private shadow!: Phaser.GameObjects.Ellipse;
  private enemy!: Phaser.GameObjects.Image;
  private hpBar!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private accentColor = 0x78e8ff;
  private displaySize = 410;
  private eliteId: EliteModifierId | null = null;
  private gauntlet = false;

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

  public show(spec: WaveEncounterSpec, waveNumber: number): void {
    this.scene.tweens.killTweensOf(this.enemy);
    this.eliteId = spec.elite?.id ?? null;
    this.gauntlet = spec.gauntlet;
    this.accentColor = spec.elite?.accentColor ?? spec.accentColor;
    this.displaySize = spec.displaySize;
    this.title
      .setText(spec.name.toUpperCase())
      .setColor(spec.elite ? this.cssColor(spec.elite.accentColor) : this.gauntlet ? '#fff0a6' : '#f7fbff')
      .setVisible(true)
      .setAlpha(1);
    const badgeText = spec.elite
      ? `ELITE • ${spec.elite.name}`
      : this.gauntlet
        ? `CHAOS GATE • ${WAVES_PER_CHAPTER} / ${WAVES_PER_CHAPTER}`
        : `WAVE ${waveNumber} / ${WAVES_PER_CHAPTER}`;
    const badgeColor = spec.elite ? '#fffaf0' : this.gauntlet ? '#ffe7a0' : '#b9c9ff';
    const badgeBackground = spec.elite
      ? `${this.cssColor(spec.elite.accentColor)}cc`
      : this.gauntlet ? '#59321cdd' : '#182342cc';
    this.waveBadge
      .setText(badgeText)
      .setColor(badgeColor)
      .setBackgroundColor(badgeBackground)
      .setVisible(true)
      .setAlpha(1);
    this.shadow.setVisible(true).setAlpha(this.gauntlet ? 1 : 0.92).setScale(this.gauntlet ? 1.08 : 1);
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
    this.enemy.setScale(targetScaleX * (this.gauntlet ? 0.67 : 0.74), targetScaleY * (this.gauntlet ? 0.67 : 0.74));
    this.scene.tweens.add({
      targets: this.enemy,
      scaleX: targetScaleX,
      scaleY: targetScaleY,
      duration: spec.elite || this.gauntlet ? 390 : 330,
      ease: 'Back.Out',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.enemy,
          y: this.gauntlet ? 592 : 588,
          duration: spec.elite ? 820 + Phaser.Math.Between(0, 150) : this.gauntlet ? 900 : 1050 + Phaser.Math.Between(0, 220),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut'
        });
      }
    });

    if (spec.elite || this.gauntlet) {
      this.scene.time.delayedCall(80, () => {
        if (!this.enemy.visible) return;
        const color = spec.elite?.accentColor ?? spec.projectileColor;
        this.fx.flashRing(540, 575, color);
        this.fx.burst(540, 575, color, this.gauntlet ? 16 : 12, this.gauntlet ? 185 : 150);
      });
    }
  }

  public hide(): void {
    if (this.enemy) this.scene.tweens.killTweensOf(this.enemy);
    this.eliteId = null;
    this.gauntlet = false;
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
    this.hpBar.lineStyle(this.gauntlet ? 6 : 4, this.gauntlet ? 0xffdf91 : 0xdaf9ff, this.gauntlet ? 0.62 : 0.42);
    this.hpBar.strokeRoundedRect(205, 842, 670, 58, 29);
    this.hpText.setText(`${current} / ${max}`);
  }

  public targetPoint(): Phaser.Math.Vector2 {
    const spread = this.gauntlet ? 84 : 72;
    return new Phaser.Math.Vector2(540 + Phaser.Math.Between(-spread, spread), 565 + Phaser.Math.Between(-62, 72));
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
    this.fx.burst(
      this.enemy.x + Phaser.Math.Between(-75, 75),
      this.enemy.y + Phaser.Math.Between(-60, 60),
      color,
      this.gauntlet ? 6 : 4,
      this.gauntlet ? 92 : 72
    );
  }

  public telegraph(onImpact: () => void): void {
    this.scene.tweens.killTweensOf(this.enemy);
    if (this.eliteId === 'berserk') {
      this.telegraphBerserk(onImpact);
      return;
    }
    if (this.eliteId === 'bulwark') {
      this.telegraphBulwark(onImpact);
      return;
    }
    if (this.eliteId === 'siege') {
      this.telegraphSiege(onImpact);
      return;
    }
    this.telegraphStandard(onImpact);
  }

  public defeat(reward: number, onComplete: () => void): void {
    this.scene.tweens.killTweensOf(this.enemy);
    const bannerLabel = this.eliteId ? 'ELITE CRUSHED!' : this.gauntlet ? 'GATE BROKEN!' : 'WAVE CRUSHED!';
    const banner = this.scene.add.text(540, 420, bannerLabel, {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: this.gauntlet ? '61px' : '55px',
      color: '#fff5a8',
      stroke: this.gauntlet ? '#713b29' : '#56305f',
      strokeThickness: 10
    }).setOrigin(0.5).setDepth(1200).setScale(0.35);
    const rewardText = this.scene.add.text(540, 485, `+${reward} COINS`, {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '30px',
      color: '#dfffff',
      stroke: '#25375a',
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(1200).setAlpha(0);

    this.scene.tweens.add({ targets: banner, scaleX: 1, scaleY: 1, duration: this.gauntlet ? 330 : 280, ease: 'Back.Out' });
    this.scene.tweens.add({ targets: rewardText, alpha: 1, y: 505, duration: 300, delay: 110, ease: 'Quad.Out' });
    this.scene.tweens.add({
      targets: this.enemy,
      y: 650,
      angle: Phaser.Math.Between(-16, 16),
      scaleX: this.enemy.scaleX * (this.gauntlet ? 0.48 : 0.58),
      scaleY: this.enemy.scaleY * (this.gauntlet ? 0.48 : 0.58),
      alpha: 0,
      duration: this.gauntlet ? 610 : 520,
      ease: 'Back.In'
    });
    this.scene.time.delayedCall(this.gauntlet ? 1040 : 920, () => {
      banner.destroy();
      rewardText.destroy();
      onComplete();
    });
  }

  public reset(): void {
    this.scene.tweens.killTweensOf(this.enemy);
    this.enemy.setPosition(540, 575).setAngle(0).setAlpha(1).setDisplaySize(this.displaySize, this.displaySize);
  }

  private telegraphStandard(onImpact: () => void): void {
    const radius = this.gauntlet ? 104 : 86;
    const ring = this.scene.add.circle(this.enemy.x, this.enemy.y + 20, radius, this.accentColor, 0.07)
      .setStrokeStyle(this.gauntlet ? 12 : 9, this.accentColor, this.gauntlet ? 0.88 : 0.78)
      .setDepth(700)
      .setScale(0.6);
    this.scene.tweens.add({ targets: ring, scaleX: this.gauntlet ? 2.05 : 1.9, scaleY: this.gauntlet ? 2.05 : 1.9, alpha: 0.1, duration: this.gauntlet ? 580 : 520, ease: 'Cubic.Out' });
    this.scene.tweens.add({ targets: this.enemy, y: this.enemy.y - (this.gauntlet ? 28 : 20), scaleX: this.enemy.scaleX * 1.04, scaleY: this.enemy.scaleY * 0.96, duration: 250, ease: 'Back.Out' });
    this.scene.time.delayedCall(this.gauntlet ? 600 : 540, () => {
      ring.destroy();
      onImpact();
      this.recover();
    });
  }

  private telegraphBerserk(onImpact: () => void): void {
    const first = this.scene.add.circle(this.enemy.x, this.enemy.y + 10, 70, this.accentColor, 0.08)
      .setStrokeStyle(10, this.accentColor, 0.88).setDepth(700).setScale(0.45);
    const second = this.scene.add.circle(this.enemy.x, this.enemy.y + 10, 70, 0xfff0aa, 0.04)
      .setStrokeStyle(6, 0xfff0aa, 0.75).setDepth(701).setScale(0.35);
    this.scene.tweens.add({ targets: first, scaleX: 2.05, scaleY: 2.05, alpha: 0.05, duration: 360, ease: 'Cubic.Out' });
    this.scene.tweens.add({ targets: second, scaleX: 1.75, scaleY: 1.75, alpha: 0.04, duration: 270, delay: 95, ease: 'Cubic.Out' });
    this.scene.tweens.add({ targets: this.enemy, y: this.enemy.y - 34, angle: -4, scaleX: this.enemy.scaleX * 1.06, duration: 190, yoyo: true, ease: 'Back.Out' });
    this.scene.time.delayedCall(405, () => {
      first.destroy();
      second.destroy();
      onImpact();
      this.recover(180);
    });
  }

  private telegraphBulwark(onImpact: () => void): void {
    const outer = this.scene.add.circle(this.enemy.x, this.enemy.y + 10, 170, this.accentColor, 0.035)
      .setStrokeStyle(14, this.accentColor, 0.72).setDepth(700).setScale(1.35);
    const inner = this.scene.add.circle(this.enemy.x, this.enemy.y + 10, 118, 0xffffff, 0.02)
      .setStrokeStyle(5, 0xffffff, 0.42).setDepth(701).setScale(1.45);
    this.scene.tweens.add({ targets: [outer, inner], scaleX: 0.72, scaleY: 0.72, alpha: 0.48, duration: 610, ease: 'Cubic.In' });
    this.scene.tweens.add({ targets: this.enemy, scaleX: this.enemy.scaleX * 0.96, scaleY: this.enemy.scaleY * 1.05, duration: 300, yoyo: true, ease: 'Sine.InOut' });
    this.scene.time.delayedCall(630, () => {
      outer.destroy();
      inner.destroy();
      onImpact();
      this.recover(250);
    });
  }

  private telegraphSiege(onImpact: () => void): void {
    const left = this.scene.add.rectangle(410, 610, 38, 330, this.accentColor, 0.12)
      .setStrokeStyle(7, this.accentColor, 0.82).setDepth(700).setScale(1, 0.12);
    const right = this.scene.add.rectangle(670, 610, 38, 330, this.accentColor, 0.12)
      .setStrokeStyle(7, this.accentColor, 0.82).setDepth(700).setScale(1, 0.12);
    const center = this.scene.add.rectangle(540, 630, 62, 380, 0xfff0b0, 0.08)
      .setStrokeStyle(5, 0xfff0b0, 0.62).setDepth(701).setScale(1, 0.08);
    this.scene.tweens.add({ targets: [left, right, center], scaleY: 1, alpha: 0.55, duration: 560, ease: 'Cubic.Out' });
    this.scene.tweens.add({ targets: left, x: 482, duration: 590, ease: 'Sine.In' });
    this.scene.tweens.add({ targets: right, x: 598, duration: 590, ease: 'Sine.In' });
    this.scene.tweens.add({ targets: this.enemy, y: this.enemy.y - 18, scaleX: this.enemy.scaleX * 1.05, scaleY: this.enemy.scaleY * 0.95, duration: 290, yoyo: true, ease: 'Back.Out' });
    this.scene.time.delayedCall(620, () => {
      left.destroy();
      right.destroy();
      center.destroy();
      onImpact();
      this.recover(250);
    });
  }

  private recover(duration = 220): void {
    this.scene.tweens.add({ targets: this.enemy, y: 575, angle: 0, duration, ease: 'Back.Out' });
  }

  private cssColor(color: number): string {
    return `#${color.toString(16).padStart(6, '0')}`;
  }
}
