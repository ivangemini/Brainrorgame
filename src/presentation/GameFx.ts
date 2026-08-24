import * as Phaser from 'phaser';

export class GameFx {
  public constructor(private readonly scene: Phaser.Scene) {}

  public burst(x: number, y: number, color: number, count: number, distance: number): void {
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + Phaser.Math.FloatBetween(-0.18, 0.18);
      const travel = Phaser.Math.Between(Math.round(distance * 0.45), distance);
      const particle = this.scene.add.circle(x, y, Phaser.Math.Between(5, 13), color, Phaser.Math.FloatBetween(0.65, 1)).setDepth(1100);
      this.scene.tweens.add({ targets: particle, x: x + Math.cos(angle) * travel, y: y + Math.sin(angle) * travel, scaleX: 0.15, scaleY: 0.15, alpha: 0, duration: Phaser.Math.Between(280, 510), ease: 'Quad.Out', onComplete: () => particle.destroy() });
    }
  }

  public flashRing(x: number, y: number, color: number): void {
    const ring = this.scene.add.circle(x, y, 36, color, 0).setStrokeStyle(12, color, 0.9).setDepth(1150);
    this.scene.tweens.add({ targets: ring, scaleX: 3.6, scaleY: 3.6, alpha: 0, duration: 430, ease: 'Cubic.Out', onComplete: () => ring.destroy() });
  }

  public flashScreen(color: number, alpha: number, duration: number): void {
    const flash = this.scene.add.rectangle(540, 960, 1080, 1920, color, alpha).setDepth(1500);
    this.scene.tweens.add({ targets: flash, alpha: 0, duration, ease: 'Quad.Out', onComplete: () => flash.destroy() });
  }

  public showHint(message: string, y: number, color = '#ffffff'): void {
    const hint = this.scene.add.text(540, y, message, { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '28px', color, stroke: '#172342', strokeThickness: 7, align: 'center' }).setOrigin(0.5).setDepth(1600).setAlpha(0).setScale(0.85);
    this.scene.tweens.add({ targets: hint, alpha: 1, scaleX: 1, scaleY: 1, y: y - 12, duration: 250, ease: 'Back.Out' });
    this.scene.tweens.add({ targets: hint, alpha: 0, y: y - 35, duration: 400, delay: 1100, ease: 'Quad.In', onComplete: () => hint.destroy() });
  }

  public floatingDamage(x: number, y: number, amount: number, color: number): void {
    const damage = this.scene.add.text(x, y, `-${amount}`, { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '34px', color: '#ffffff', stroke: Phaser.Display.Color.IntegerToColor(color).rgba, strokeThickness: 7 }).setOrigin(0.5).setDepth(1000);
    this.scene.tweens.add({ targets: damage, y: damage.y - 75, alpha: 0, scaleX: 1.18, scaleY: 1.18, duration: 480, ease: 'Quad.Out', onComplete: () => damage.destroy() });
  }
}
