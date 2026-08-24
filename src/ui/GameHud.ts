import type * as Phaser from 'phaser';
import { BOSS_STEP, type EncounterStep } from '../systems/encounters';

const RECRUIT_COST = 20;

export class GameHud {
  private coinsText!: Phaser.GameObjects.Text;
  private baseText!: Phaser.GameObjects.Text;
  private encounterText!: Phaser.GameObjects.Text;
  private chapterText!: Phaser.GameObjects.Text;
  private recruitButton!: Phaser.GameObjects.Container;

  public constructor(private readonly scene: Phaser.Scene, private readonly onRecruit: () => void) {}

  public create(): void {
    const topGlow = this.scene.add.graphics();
    topGlow.fillStyle(0x0b1028, 0.72);
    topGlow.fillRoundedRect(54, 54, 972, 186, 48);
    topGlow.lineStyle(3, 0xa9c8ff, 0.15);
    topGlow.strokeRoundedRect(54, 54, 972, 186, 48);

    this.encounterText = this.scene.add.text(100, 80, 'WAVE 1 / 3', {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '42px',
      color: '#f7fbff',
      stroke: '#18264d',
      strokeThickness: 8
    });
    this.chapterText = this.scene.add.text(102, 137, 'CHAPTER 1', {
      fontFamily: 'system-ui, sans-serif',
      fontStyle: '900',
      fontSize: '21px',
      color: '#b9c9ff'
    });
    this.coinsText = this.scene.add.text(732, 91, '120', {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '44px',
      color: '#fff3a8',
      stroke: '#5a3415',
      strokeThickness: 7
    });
    this.scene.add.circle(688, 119, 25, 0xffd55e).setStrokeStyle(6, 0xfff0a6, 1);
    this.scene.add.circle(688, 119, 10, 0xf5a623);
    this.baseText = this.scene.add.text(100, 180, 'FORTRESS 100', {
      fontFamily: 'system-ui, sans-serif',
      fontStyle: '800',
      fontSize: '27px',
      color: '#9ff4ff'
    });
    this.createRecruitButton();
  }

  public update(coins: number, baseHp: number, chapter: number, step: EncounterStep): void {
    this.coinsText.setText(`${coins}`);
    this.baseText.setText(`FORTRESS ${baseHp}`);
    this.baseText.setColor(baseHp > 35 ? '#9ff4ff' : '#ff9bab');
    this.chapterText.setText(`CHAPTER ${chapter}`);
    this.encounterText.setText(step === BOSS_STEP ? `BOSS ${chapter}` : `WAVE ${step + 1} / 3`);
    this.encounterText.setColor(step === BOSS_STEP ? '#fff0a6' : '#f7fbff');
  }

  private createRecruitButton(): void {
    const background = this.scene.add.graphics();
    background.fillStyle(0xffc94d, 1);
    background.fillRoundedRect(-238, -62, 476, 124, 54);
    background.lineStyle(7, 0xffef9c, 0.86);
    background.strokeRoundedRect(-238, -62, 476, 124, 54);
    background.fillStyle(0xf0833e, 0.34);
    background.fillRoundedRect(-215, 20, 430, 25, 12);
    const label = this.scene.add.text(0, -8, `RECRUIT  •  ${RECRUIT_COST}`, {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '37px',
      color: '#47271e',
      align: 'center'
    }).setOrigin(0.5);
    const sub = this.scene.add.text(0, 37, 'NEW WEIRDO', {
      fontFamily: 'system-ui, sans-serif',
      fontStyle: '900',
      fontSize: '18px',
      color: '#76431f'
    }).setOrigin(0.5);
    this.recruitButton = this.scene.add.container(540, 1841, [background, label, sub]);
    this.recruitButton.setSize(476, 124).setInteractive({ useHandCursor: true });
    this.recruitButton.on('pointerdown', () => {
      this.scene.tweens.add({ targets: this.recruitButton, scaleX: 0.96, scaleY: 0.94, duration: 80, yoyo: true, ease: 'Quad.Out' });
      this.onRecruit();
    });
  }
}
