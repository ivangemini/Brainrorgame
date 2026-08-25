import type * as Phaser from 'phaser';
import type { OnboardingState } from '../systems/onboarding';

export class OnboardingCoach {
  private card!: Phaser.GameObjects.Container;
  private title!: Phaser.GameObjects.Text;
  private body!: Phaser.GameObjects.Text;
  private mergeRingA!: Phaser.GameObjects.Arc;
  private mergeRingB!: Phaser.GameObjects.Arc;
  private mergeArrow!: Phaser.GameObjects.Text;
  private recruitRing!: Phaser.GameObjects.Rectangle;
  private currentStep: OnboardingState['step'] | null = null;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly slotPosition: (slot: number) => Phaser.Math.Vector2
  ) {}

  public create(): void {
    const bubble = this.scene.add.graphics();
    bubble.fillStyle(0x111a3b, 0.97);
    bubble.fillRoundedRect(-400, -78, 800, 156, 42);
    bubble.lineStyle(4, 0x8eefff, 0.36);
    bubble.strokeRoundedRect(-400, -78, 800, 156, 42);
    bubble.fillStyle(0x6e55ce, 0.16);
    bubble.fillRoundedRect(-382, -60, 764, 120, 34);

    this.title = this.scene.add.text(-354, -52, 'MERGE TWINS', {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '27px',
      color: '#fff0a6',
      stroke: '#2a315f',
      strokeThickness: 5
    });
    this.body = this.scene.add.text(-354, -11, 'Drag one glowing twin onto the other.', {
      fontFamily: 'system-ui, sans-serif',
      fontStyle: '800',
      fontSize: '20px',
      color: '#d7e7ff',
      wordWrap: { width: 700 }
    });
    this.card = this.scene.add.container(540, 1008, [bubble, this.title, this.body]).setDepth(1700);

    const first = this.slotPosition(0);
    const second = this.slotPosition(1);
    this.mergeRingA = this.scene.add.circle(first.x, first.y, 106, 0x72eaff, 0.045)
      .setStrokeStyle(7, 0x8ff4ff, 0.82)
      .setDepth(1698);
    this.mergeRingB = this.scene.add.circle(second.x, second.y, 106, 0xffdc79, 0.045)
      .setStrokeStyle(7, 0xffe99d, 0.82)
      .setDepth(1698);
    this.mergeArrow = this.scene.add.text((first.x + second.x) / 2, first.y, '➜', {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '58px',
      color: '#ffffff',
      stroke: '#493b7c',
      strokeThickness: 8
    }).setOrigin(0.5).setDepth(1699);

    this.recruitRing = this.scene.add.rectangle(540, 1841, 520, 150, 0xffd85f, 0.025)
      .setStrokeStyle(8, 0xffeb9d, 0.86)
      .setDepth(1698)
      .setVisible(false);

    for (const target of [this.mergeRingA, this.mergeRingB]) {
      this.scene.tweens.add({
        targets: target,
        scaleX: 1.08,
        scaleY: 1.08,
        alpha: 0.55,
        duration: 620,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      });
    }
    this.scene.tweens.add({
      targets: this.mergeArrow,
      x: second.x - 18,
      duration: 680,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });
    this.scene.tweens.add({
      targets: this.recruitRing,
      scaleX: 1.045,
      scaleY: 1.06,
      alpha: 0.58,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });
  }

  public update(state: OnboardingState): void {
    if (state.step === this.currentStep) return;
    this.currentStep = state.step;

    const mergeVisible = state.step === 'merge';
    this.mergeRingA.setVisible(mergeVisible);
    this.mergeRingB.setVisible(mergeVisible);
    this.mergeArrow.setVisible(mergeVisible);
    this.recruitRing.setVisible(state.step === 'recruit');

    if (state.step === 'complete') {
      this.card.setVisible(false);
      return;
    }

    this.card.setVisible(true).setAlpha(0).setScale(0.94);
    if (state.step === 'merge') {
      this.card.setPosition(540, 1008);
      this.title.setText('MERGE TWINS');
      this.body.setText('Drag one glowing twin onto the other. The battle waits for you.');
    } else if (state.step === 'recruit') {
      this.card.setPosition(540, 1660);
      this.title.setText('BUILD THE CREW');
      this.body.setText('Tap RECRUIT once. More weirdos mean more automatic firepower.');
    } else {
      this.card.setPosition(540, 1008);
      this.title.setText('BREAK THE WAVE');
      this.body.setText('Your crew attacks automatically. Survive and defeat this target to finish training.');
    }
    this.scene.tweens.add({ targets: this.card, alpha: 1, scaleX: 1, scaleY: 1, duration: 220, ease: 'Back.Out' });
  }
}
