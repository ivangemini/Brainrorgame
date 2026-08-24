import type * as Phaser from 'phaser';
import {
  DAILY_MISSIONS,
  canClaimDailyReward,
  getDailyMission,
  getDailyRewardPreview,
  type DailyMissionId,
  type DailyRetentionState
} from '../systems/dailyRetention';

interface MissionCard {
  readonly id: DailyMissionId;
  readonly progressText: Phaser.GameObjects.Text;
  readonly rewardText: Phaser.GameObjects.Text;
  readonly button: Phaser.GameObjects.Container;
  readonly buttonBackground: Phaser.GameObjects.Graphics;
  readonly buttonLabel: Phaser.GameObjects.Text;
}

export class DailyPanel {
  private overlay!: Phaser.GameObjects.Rectangle;
  private drawer!: Phaser.GameObjects.Container;
  private streakText!: Phaser.GameObjects.Text;
  private rewardText!: Phaser.GameObjects.Text;
  private rewardButton!: Phaser.GameObjects.Container;
  private rewardButtonBackground!: Phaser.GameObjects.Graphics;
  private rewardButtonLabel!: Phaser.GameObjects.Text;
  private readonly missionCards = new Map<DailyMissionId, MissionCard>();
  private opened = false;
  private state!: DailyRetentionState;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly onDailyClaim: () => void,
    private readonly onMissionClaim: (id: DailyMissionId) => void
  ) {}

  public create(): void {
    this.overlay = this.scene.add.rectangle(0, 0, 1080, 1920, 0x040714, 0.44)
      .setOrigin(0)
      .setDepth(2200)
      .setInteractive()
      .setVisible(false);
    this.overlay.on('pointerdown', () => this.hide());

    const children: Phaser.GameObjects.GameObject[] = [];
    const blocker = this.scene.add.rectangle(300, 960, 600, 1460, 0xffffff, 0.001).setInteractive();
    children.push(blocker);

    const panel = this.scene.add.graphics();
    panel.fillStyle(0x0a1028, 0.99);
    panel.fillRoundedRect(18, 230, 600, 1480, 58);
    panel.lineStyle(4, 0xffcf78, 0.25);
    panel.strokeRoundedRect(18, 230, 600, 1480, 58);
    panel.fillStyle(0x823f83, 0.18);
    panel.fillRoundedRect(36, 248, 564, 236, 44);
    children.push(panel);

    const icon = this.scene.add.image(116, 338, 'ui-daily-orbit').setDisplaySize(126, 126);
    const title = this.scene.add.text(190, 281, 'DAILY CHAOS', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '40px', color: '#fff6da', stroke: '#43234d', strokeThickness: 7
    });
    this.streakText = this.scene.add.text(194, 342, 'STREAK 0 / 7', {
      fontFamily: 'system-ui, sans-serif', fontStyle: '900', fontSize: '20px', color: '#ffcfe6'
    });
    this.rewardText = this.scene.add.text(194, 385, '', {
      fontFamily: 'system-ui, sans-serif', fontStyle: '800', fontSize: '19px', color: '#b8c9f1'
    });
    children.push(icon, title, this.streakText, this.rewardText);

    this.rewardButtonBackground = this.scene.add.graphics();
    this.rewardButtonLabel = this.scene.add.text(0, 0, 'CLAIM', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '23px', color: '#47271e'
    }).setOrigin(0.5);
    this.rewardButton = this.scene.add.container(476, 426, [this.rewardButtonBackground, this.rewardButtonLabel]);
    this.rewardButton.setSize(210, 72).setInteractive({ useHandCursor: true });
    this.rewardButton.on('pointerdown', () => {
      this.scene.tweens.add({ targets: this.rewardButton, scaleX: 0.96, scaleY: 0.94, duration: 75, yoyo: true, ease: 'Quad.Out' });
      this.onDailyClaim();
    });
    children.push(this.rewardButton);

    const missionTitle = this.scene.add.text(66, 530, 'TODAY\'S MISSIONS', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '28px', color: '#e9f4ff'
    });
    children.push(missionTitle);

    DAILY_MISSIONS.forEach((mission, index) => {
      const card = this.createMissionCard(mission.id, 690 + index * 300);
      children.push(...card.children);
      this.missionCards.set(mission.id, card.view);
    });

    const hint = this.scene.add.text(70, 1592, 'Daily reset uses UTC for consistent cross-platform saves.', {
      fontFamily: 'system-ui, sans-serif', fontStyle: '700', fontSize: '17px', color: '#7f91bd', wordWrap: { width: 500 }
    });
    children.push(hint);

    this.drawer = this.scene.add.container(-660, 0, children).setDepth(2201).setVisible(false);
  }

  public show(state: DailyRetentionState): void {
    this.state = state;
    this.refresh();
    if (this.opened) return;
    this.opened = true;
    this.overlay.setVisible(true).setAlpha(0);
    this.drawer.setVisible(true).setX(-660);
    this.scene.tweens.add({ targets: this.overlay, alpha: 1, duration: 170, ease: 'Quad.Out' });
    this.scene.tweens.add({ targets: this.drawer, x: 0, duration: 330, ease: 'Back.Out' });
  }

  public update(state: DailyRetentionState): void {
    this.state = state;
    this.refresh();
  }

  public hide(): void {
    if (!this.opened) return;
    this.opened = false;
    this.scene.tweens.add({ targets: this.overlay, alpha: 0, duration: 150, ease: 'Quad.In' });
    this.scene.tweens.add({
      targets: this.drawer, x: -660, duration: 220, ease: 'Quad.In', onComplete: () => {
        if (!this.opened) {
          this.drawer.setVisible(false);
          this.overlay.setVisible(false);
        }
      }
    });
  }

  public isOpen(): boolean { return this.opened; }

  private createMissionCard(id: DailyMissionId, centerY: number): { children: Phaser.GameObjects.GameObject[]; view: MissionCard } {
    const mission = getDailyMission(id);
    const children: Phaser.GameObjects.GameObject[] = [];
    const background = this.scene.add.graphics();
    background.fillStyle(0x151f42, 0.98);
    background.fillRoundedRect(62, centerY - 118, 510, 236, 38);
    background.lineStyle(3, 0x8feaff, 0.15);
    background.strokeRoundedRect(62, centerY - 118, 510, 236, 38);

    const name = this.scene.add.text(94, centerY - 84, mission.name.toUpperCase(), {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '24px', color: '#f4f8ff'
    });
    const progressText = this.scene.add.text(94, centerY - 30, '0 / 0', {
      fontFamily: 'system-ui, sans-serif', fontStyle: '900', fontSize: '22px', color: '#9feeff'
    });
    const rewardText = this.scene.add.text(94, centerY + 18, `+${mission.rewardCoins} COINS`, {
      fontFamily: 'system-ui, sans-serif', fontStyle: '900', fontSize: '19px', color: '#ffe59a'
    });

    const buttonBackground = this.scene.add.graphics();
    const buttonLabel = this.scene.add.text(0, 0, 'CLAIM', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '19px', color: '#23304b'
    }).setOrigin(0.5);
    const button = this.scene.add.container(454, centerY + 53, [buttonBackground, buttonLabel]);
    button.setSize(180, 66).setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => {
      this.scene.tweens.add({ targets: button, scaleX: 0.96, scaleY: 0.94, duration: 70, yoyo: true, ease: 'Quad.Out' });
      this.onMissionClaim(id);
    });

    children.push(background, name, progressText, rewardText, button);
    return { children, view: { id, progressText, rewardText, button, buttonBackground, buttonLabel } };
  }

  private refresh(): void {
    const reward = getDailyRewardPreview(this.state);
    this.streakText.setText(`STREAK ${this.state.streak} / 7`);
    const shardSuffix = reward.coreShards > 0 ? ` + ${reward.coreShards} CORE` : '';
    this.rewardText.setText(`NEXT: ${reward.coins} COINS${shardSuffix}`);
    const dailyReady = canClaimDailyReward(this.state);
    this.paintButton(this.rewardButtonBackground, dailyReady, 210, 72);
    this.rewardButtonLabel.setText(dailyReady ? 'CLAIM' : 'CLAIMED');
    if (dailyReady) this.rewardButton.setInteractive({ useHandCursor: true });
    else this.rewardButton.disableInteractive();

    for (const mission of DAILY_MISSIONS) {
      const card = this.missionCards.get(mission.id);
      if (!card) continue;
      const progress = this.state.counters[mission.id];
      const claimed = this.state.claimed[mission.id];
      const ready = progress >= mission.target && !claimed;
      card.progressText.setText(`${progress} / ${mission.target}`);
      card.rewardText.setText(claimed ? 'REWARD CLAIMED' : `+${mission.rewardCoins} COINS`);
      card.rewardText.setColor(claimed ? '#7e90b9' : '#ffe59a');
      this.paintButton(card.buttonBackground, ready, 180, 66);
      card.buttonLabel.setText(claimed ? 'DONE' : ready ? 'CLAIM' : 'LOCKED');
      if (ready) card.button.setInteractive({ useHandCursor: true });
      else card.button.disableInteractive();
    }
  }

  private paintButton(graphics: Phaser.GameObjects.Graphics, active: boolean, width: number, height: number): void {
    graphics.clear();
    graphics.fillStyle(active ? 0xffcf54 : 0x64708d, active ? 1 : 0.58);
    graphics.fillRoundedRect(-width / 2, -height / 2, width, height, Math.floor(height * 0.38));
    graphics.lineStyle(3, 0xffffff, active ? 0.42 : 0.1);
    graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, Math.floor(height * 0.38));
  }
}
