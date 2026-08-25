import * as Phaser from 'phaser';
import type { GameFx } from '../presentation/GameFx';
import {
  clearBossPhaseRuntime,
  syncBossPhaseRuntime,
  type BossPhaseState
} from '../systems/bossPhases';
import type { BossEncounterSpec } from '../systems/encounters';

const BOSS_X = 540;
const BOSS_Y = 565;

export class BossView {
  private title!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private phaseAura!: Phaser.GameObjects.Graphics;
  private shadow!: Phaser.GameObjects.Ellipse;
  private boss!: Phaser.GameObjects.Image;
  private hpBar!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private spec: BossEncounterSpec | null = null;
  private baseScaleX = 1;
  private baseScaleY = 1;
  private motionEpoch = 0;
  private phaseSignature = '';

  public constructor(private readonly scene: Phaser.Scene, private readonly fx: GameFx) {}

  public create(): void {
    this.title = this.scene.add.text(BOSS_X, 282, '', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '42px', color: '#dffaff', stroke: '#19234b', strokeThickness: 9
    }).setOrigin(0.5).setDepth(610);
    this.phaseText = this.scene.add.text(BOSS_X, 335, '', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '19px', color: '#bfeeff', stroke: '#11182f', strokeThickness: 5
    }).setOrigin(0.5).setDepth(612);
    this.shadow = this.scene.add.ellipse(BOSS_X, 834, 520, 94, 0x071020, 0.34).setDepth(300);
    this.phaseAura = this.scene.add.graphics().setDepth(420);
    this.boss = this.scene.add.image(BOSS_X, BOSS_Y, 'boss-fridgino').setDisplaySize(570, 570).setDepth(500);
    this.hpBar = this.scene.add.graphics().setDepth(605);
    this.hpText = this.scene.add.text(BOSS_X, 906, '', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '25px', color: '#fff7fb', stroke: '#481d49', strokeThickness: 5
    }).setOrigin(0.5).setDepth(610);
    this.hide();
  }

  public show(spec: BossEncounterSpec): void {
    this.spec = spec;
    this.phaseSignature = '';
    this.motionEpoch += 1;
    this.scene.tweens.killTweensOf(this.boss);
    this.title.setText(spec.name.toUpperCase()).setColor(this.cssColor(spec.accentColor)).setVisible(true).setAlpha(1);
    this.phaseText.setVisible(true).setAlpha(1);
    this.phaseAura.setVisible(true).setAlpha(1);
    this.shadow.setVisible(true).setAlpha(1).setScale(1);
    this.hpBar.setVisible(true).setAlpha(1);
    this.hpText.setVisible(true).setAlpha(1);
    this.boss.setTexture(spec.texture).setVisible(true).setPosition(BOSS_X, BOSS_Y).setAngle(0).setAlpha(1).setDisplaySize(spec.displaySize, spec.displaySize);
    const targetScaleX = this.boss.scaleX;
    const targetScaleY = this.boss.scaleY;
    this.baseScaleX = targetScaleX;
    this.baseScaleY = targetScaleY;
    this.boss.setScale(targetScaleX * 0.68, targetScaleY * 0.68);
    this.scene.tweens.add({ targets: this.boss, scaleX: targetScaleX, scaleY: targetScaleY, duration: 420, ease: 'Back.Out', onComplete: () => this.startIdle(targetScaleX, targetScaleY) });
  }

  public hide(): void {
    clearBossPhaseRuntime();
    this.phaseSignature = '';
    this.motionEpoch += 1;
    if (this.boss) this.scene.tweens.killTweensOf(this.boss);
    this.title?.setVisible(false);
    this.phaseText?.setVisible(false);
    this.phaseAura?.clear().setVisible(false);
    this.shadow?.setVisible(false);
    this.boss?.setVisible(false);
    this.hpBar?.setVisible(false);
    this.hpText?.setVisible(false);
  }

  public setHealth(current: number, max: number): void {
    const ratio = Phaser.Math.Clamp(current / max, 0, 1);
    const accent = this.spec?.accentColor ?? 0x69dcff;
    this.hpBar.clear();
    this.hpBar.fillStyle(0x10182f, 0.92);
    this.hpBar.fillRoundedRect(170, 866, 740, 66, 33);
    this.hpBar.fillStyle(ratio > 0.35 ? accent : 0xff6784, 1);
    this.hpBar.fillRoundedRect(178, 874, 724 * ratio, 50, 25);
    this.hpBar.lineStyle(4, 0xdaf9ff, 0.5);
    this.hpBar.strokeRoundedRect(170, 866, 740, 66, 33);
    this.drawPhaseMarker(0.70, 0x9ee9ff);
    this.drawPhaseMarker(0.40, 0xff8fa8);
    this.hpText.setText(`${current} / ${max}`);

    if (!this.spec) return;
    const phase = syncBossPhaseRuntime(this.spec.phases, current, max);
    this.renderPhase(phase, current > 0);
  }

  public targetPoint(): Phaser.Math.Vector2 {
    const spread = Math.max(72, Math.round((this.spec?.displaySize ?? 570) * 0.14));
    return new Phaser.Math.Vector2(this.boss.x + Phaser.Math.Between(-spread, spread), this.boss.y + Phaser.Math.Between(-Math.round(spread * 0.8), Math.round(spread * 0.85)));
  }

  public hit(color: number): void {
    this.scene.tweens.add({ targets: this.boss, scaleX: this.boss.scaleX * 0.965, scaleY: this.boss.scaleY * 1.025, duration: 55, yoyo: true, ease: 'Quad.Out' });
    this.fx.burst(this.boss.x + Phaser.Math.Between(-100, 100), this.boss.y + Phaser.Math.Between(-80, 80), color, 5, 90);
  }

  public telegraph(onImpact: () => void): void {
    this.scene.tweens.killTweensOf(this.boss);
    const epoch = this.motionEpoch;
    const guardedImpact = (): boolean => {
      if (epoch !== this.motionEpoch) return false;
      onImpact();
      return true;
    };
    const style = this.spec?.presentation.telegraphStyle ?? 'ring';
    if (style === 'sweep') return this.telegraphSweep(guardedImpact);
    if (style === 'orbit') return this.telegraphOrbit(guardedImpact);
    if (style === 'fan') return this.telegraphFan(guardedImpact);
    this.telegraphRing(guardedImpact);
  }

  public defeat(reward: number, onComplete: () => void): void {
    this.motionEpoch += 1;
    this.scene.tweens.killTweensOf(this.boss);
    const defeatLabel = this.spec?.presentation.defeatLabel ?? 'BOSS MELTED!';
    const banner = this.scene.add.text(BOSS_X, 420, defeatLabel, { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '70px', color: '#fff5a8', stroke: '#66305c', strokeThickness: 12 }).setOrigin(0.5).setDepth(1200).setScale(0.35);
    const rewardText = this.scene.add.text(BOSS_X, 500, `+${reward} COINS`, { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '34px', color: '#dfffff', stroke: '#25375a', strokeThickness: 7 }).setOrigin(0.5).setDepth(1200).setAlpha(0);
    this.scene.tweens.add({ targets: banner, scaleX: 1, scaleY: 1, duration: 350, ease: 'Back.Out' });
    this.scene.tweens.add({ targets: rewardText, alpha: 1, y: 520, duration: 350, delay: 180, ease: 'Quad.Out' });
    this.playDefeatMotion();
    this.scene.time.delayedCall(1450, () => { banner.destroy(); rewardText.destroy(); onComplete(); });
  }

  public reset(): void {
    this.motionEpoch += 1;
    this.scene.tweens.killTweensOf(this.boss);
    const displaySize = this.spec?.displaySize ?? 570;
    this.boss.setPosition(BOSS_X, BOSS_Y).setAngle(0).setAlpha(1).setDisplaySize(displaySize, displaySize);
  }

  private renderPhase(state: BossPhaseState, announce: boolean): void {
    const signature = `${state.phase}:${state.window}`;
    const changed = signature !== this.phaseSignature;
    const shield = state.window === 'shield';
    const weak = state.window === 'weak';
    const phasePrefix = `PHASE ${this.roman(state.phase)}`;
    const suffix = weak ? 'WEAK POINT' : shield ? 'SHIELD' : 'OPEN';
    const color = weak ? 0xffe77a : shield ? 0x75e6ff : state.enrage ? 0xff7893 : 0xbfeeff;
    const enrage = state.enrage ? ' • ENRAGED' : '';
    this.phaseText.setText(`${phasePrefix}${enrage} • ${suffix} • ${state.label}`).setColor(this.cssColor(color));
    this.drawPhaseAura(state, color);

    if (changed && this.phaseSignature !== '' && announce) {
      const hint = weak
        ? `${state.label} • WEAK POINT!`
        : state.enrage
          ? `${state.label} • ENRAGED SHIELD!`
          : `${state.label} • SHIELD UP!`;
      this.fx.showHint(hint, 1015, this.cssColor(color));
      this.fx.flashRing(BOSS_X, BOSS_Y, color);
      this.fx.burst(BOSS_X, BOSS_Y, color, weak ? 18 : 12, weak ? 220 : 175);
      this.scene.cameras.main.shake(weak ? 115 : 150, weak ? 0.0024 : 0.0036);
      this.scene.tweens.killTweensOf(this.phaseText);
      this.phaseText.setScale(1.14).setAlpha(0.58);
      this.scene.tweens.add({ targets: this.phaseText, scaleX: 1, scaleY: 1, alpha: 1, duration: 280, ease: 'Back.Out' });
    }
    this.phaseSignature = signature;
  }

  private drawPhaseAura(state: BossPhaseState, color: number): void {
    this.phaseAura.clear();
    if (state.window === 'open' && !state.enrage) {
      this.phaseAura.lineStyle(4, color, 0.14);
      this.phaseAura.strokeCircle(BOSS_X, BOSS_Y + 10, 245);
      return;
    }

    const alpha = state.window === 'weak' ? 0.72 : 0.48;
    this.phaseAura.lineStyle(state.window === 'weak' ? 7 : 10, color, alpha);
    this.phaseAura.strokeCircle(BOSS_X, BOSS_Y + 10, 250);
    this.phaseAura.lineStyle(4, state.enrage ? 0xff637e : color, state.enrage ? 0.46 : 0.25);
    this.phaseAura.strokeCircle(BOSS_X, BOSS_Y + 10, 282);
    if (state.window === 'weak') {
      this.phaseAura.lineStyle(5, 0xfff4b2, 0.72);
      this.phaseAura.lineBetween(BOSS_X - 315, BOSS_Y + 10, BOSS_X - 220, BOSS_Y + 10);
      this.phaseAura.lineBetween(BOSS_X + 220, BOSS_Y + 10, BOSS_X + 315, BOSS_Y + 10);
      this.phaseAura.lineBetween(BOSS_X, BOSS_Y - 300, BOSS_X, BOSS_Y - 215);
      this.phaseAura.lineBetween(BOSS_X, BOSS_Y + 235, BOSS_X, BOSS_Y + 315);
    }
  }

  private drawPhaseMarker(ratio: number, color: number): void {
    const x = 178 + 724 * ratio;
    this.hpBar.lineStyle(4, color, 0.82);
    this.hpBar.lineBetween(x, 868, x, 930);
  }

  private startIdle(scaleX: number, scaleY: number): void {
    const style = this.spec?.presentation.idleStyle ?? 'float';
    if (style === 'sway') {
      this.scene.tweens.add({ targets: this.boss, y: BOSS_Y + 8, angle: 2.4, duration: 980, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      return;
    }
    if (style === 'bob') {
      this.scene.tweens.add({ targets: this.boss, y: BOSS_Y + 16, scaleX: scaleX * 1.012, scaleY: scaleY * 0.982, duration: 1120, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      return;
    }
    if (style === 'huff') {
      this.scene.tweens.add({ targets: this.boss, y: BOSS_Y + 7, angle: -1.8, scaleX: scaleX * 1.018, scaleY: scaleY * 0.982, duration: 760, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      return;
    }
    this.scene.tweens.add({ targets: this.boss, y: BOSS_Y + 13, scaleX: scaleX * 1.015, scaleY: scaleY * 0.985, duration: 1350, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  private telegraphRing(onImpact: () => boolean): void {
    const color = this.spec?.projectileColor ?? 0xff6688;
    const ring = this.scene.add.circle(this.boss.x, this.boss.y + 20, 115, color, 0.08).setStrokeStyle(12, color, 0.82).setDepth(700).setScale(0.55);
    this.scene.tweens.add({ targets: ring, scaleX: 2.25, scaleY: 2.25, alpha: 0.14, duration: 630, ease: 'Cubic.Out' });
    this.scene.tweens.add({ targets: this.boss, y: this.boss.y - 25, angle: Phaser.Math.Between(-3, 3), duration: 340, ease: 'Back.Out' });
    this.scene.time.delayedCall(650, () => { ring.destroy(); if (onImpact()) this.recoverToIdle(250, 'Back.Out'); });
  }

  private telegraphSweep(onImpact: () => boolean): void {
    const color = this.spec?.projectileColor ?? 0xff5cda;
    const railLeft = this.scene.add.rectangle(BOSS_X - 120, 790, 24, 430, color, 0.14).setStrokeStyle(6, color, 0.78).setDepth(700).setScale(1, 0.1);
    const railRight = this.scene.add.rectangle(BOSS_X + 120, 790, 24, 430, color, 0.14).setStrokeStyle(6, color, 0.78).setDepth(700).setScale(1, 0.1);
    this.scene.tweens.add({ targets: [railLeft, railRight], scaleY: 1, alpha: 0.62, duration: 510, ease: 'Cubic.Out' });
    this.scene.tweens.add({ targets: railLeft, x: BOSS_X - 34, duration: 610, ease: 'Sine.In' });
    this.scene.tweens.add({ targets: railRight, x: BOSS_X + 34, duration: 610, ease: 'Sine.In' });
    this.scene.tweens.add({ targets: this.boss, angle: -4.5, scaleX: this.boss.scaleX * 1.035, duration: 300, yoyo: true, ease: 'Quad.Out' });
    this.scene.time.delayedCall(650, () => { railLeft.destroy(); railRight.destroy(); if (onImpact()) this.recoverToIdle(230, 'Back.Out'); });
  }

  private telegraphOrbit(onImpact: () => boolean): void {
    const color = this.spec?.projectileColor ?? 0xb66cff;
    const orbit = this.scene.add.container(this.boss.x, this.boss.y + 10).setDepth(700).setScale(1.35);
    const dots = [0, 120, 240].map((angle) => {
      const radians = Phaser.Math.DegToRad(angle);
      const dot = this.scene.add.circle(Math.cos(radians) * 175, Math.sin(radians) * 125, 28, color, 0.72).setStrokeStyle(7, 0xffffff, 0.5);
      orbit.add(dot);
      return dot;
    });
    this.scene.tweens.add({ targets: orbit, angle: 210, scaleX: 0.52, scaleY: 0.52, duration: 640, ease: 'Cubic.In' });
    this.scene.tweens.add({ targets: dots, alpha: 1, duration: 300, yoyo: true, repeat: 1 });
    this.scene.tweens.add({ targets: this.boss, y: this.boss.y - 34, scaleY: this.boss.scaleY * 1.025, duration: 360, ease: 'Back.Out' });
    this.scene.time.delayedCall(660, () => { orbit.destroy(); if (onImpact()) this.recoverToIdle(260, 'Bounce.Out'); });
  }

  private telegraphFan(onImpact: () => boolean): void {
    const color = this.spec?.projectileColor ?? 0x72f4ef;
    const rays = [-28, 0, 28].map((angle) => this.scene.add.rectangle(BOSS_X, this.boss.y + 118, 48, 430, color, 0.12)
      .setOrigin(0.5, 0).setStrokeStyle(6, color, 0.78).setAngle(angle).setDepth(700).setScale(1, 0.08));
    this.scene.tweens.add({ targets: rays, scaleY: 1, alpha: 0.58, duration: 560, ease: 'Cubic.Out' });
    this.scene.tweens.add({ targets: this.boss, y: this.boss.y - 24, scaleX: this.boss.scaleX * 0.94, scaleY: this.boss.scaleY * 1.06, angle: 2.6, duration: 310, yoyo: true, ease: 'Back.Out' });
    this.scene.time.delayedCall(640, () => { rays.forEach((ray) => ray.destroy()); if (onImpact()) this.recoverToIdle(250, 'Back.Out'); });
  }

  private recoverToIdle(duration: number, ease: string): void {
    const epoch = this.motionEpoch;
    this.scene.tweens.add({
      targets: this.boss, x: BOSS_X, y: BOSS_Y, angle: 0, scaleX: this.baseScaleX, scaleY: this.baseScaleY, duration, ease,
      onComplete: () => { if (epoch === this.motionEpoch && this.boss.visible) this.startIdle(this.baseScaleX, this.baseScaleY); }
    });
  }

  private playDefeatMotion(): void {
    const style = this.spec?.presentation.defeatStyle ?? 'melt';
    if (style === 'spin') {
      this.scene.tweens.add({ targets: this.boss, x: 760, y: 700, angle: 390, scaleX: this.boss.scaleX * 0.45, scaleY: this.boss.scaleY * 0.45, alpha: 0, duration: 820, ease: 'Cubic.In' });
      return;
    }
    if (style === 'pop') {
      const startScaleX = this.boss.scaleX;
      const startScaleY = this.boss.scaleY;
      this.scene.tweens.add({ targets: this.boss, scaleX: startScaleX * 1.16, scaleY: startScaleY * 1.16, duration: 210, ease: 'Back.Out', onComplete: () => {
        this.scene.tweens.add({ targets: this.boss, y: 250, angle: -8, scaleX: startScaleX * 0.58, scaleY: startScaleY * 0.58, alpha: 0, duration: 610, ease: 'Cubic.In' });
      } });
      return;
    }
    if (style === 'implode') {
      const startScaleX = this.boss.scaleX;
      const startScaleY = this.boss.scaleY;
      this.scene.tweens.add({ targets: this.boss, y: BOSS_Y + 26, scaleX: startScaleX * 0.34, scaleY: startScaleY * 1.12, angle: -3, duration: 230, ease: 'Cubic.In', onComplete: () => {
        this.scene.tweens.add({ targets: this.boss, y: BOSS_Y + 120, scaleX: startScaleX * 1.24, scaleY: startScaleY * 0.48, angle: 7, alpha: 0, duration: 560, ease: 'Back.In' });
      } });
      return;
    }
    this.scene.tweens.add({ targets: this.boss, y: 720, angle: 11, scaleX: this.boss.scaleX * 0.82, scaleY: this.boss.scaleY * 0.72, alpha: 0, duration: 760, ease: 'Back.In' });
  }

  private roman(phase: 1 | 2 | 3): string {
    return phase === 1 ? 'I' : phase === 2 ? 'II' : 'III';
  }

  private cssColor(color: number): string { return `#${color.toString(16).padStart(6, '0')}`; }
}
