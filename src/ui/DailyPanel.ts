import type * as Phaser from 'phaser';
import { translate } from '../i18n';
import { localizedDailyMissionName } from '../i18n/gameplayContent';
import {
  DAILY_CHAOS_CHEST_REWARD_COINS,
  DAILY_MISSIONS,
  canClaimDailyReward,
  getDailyMission,
  getDailyMissionCompletionCount,
  getDailyRewardPreview,
  isDailyChaosChestComplete,
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
  private chestProgressText!: Phaser.GameObjects.Text;
  private chestRewardText!: Phaser.GameObjects.Text;
  private readonly missionCards = new Map<DailyMissionId, MissionCard>();
  private opened = false;
  private state!: DailyRetentionState;

  public constructor(private readonly scene: Phaser.Scene, private readonly onDailyClaim: () => void, private readonly onMissionClaim: (id: DailyMissionId) => void) {}

  public create(): void {
    this.overlay = this.scene.add.rectangle(0, 0, 1080, 1920, 0x040714, 0.44).setOrigin(0).setDepth(2200).setInteractive().setVisible(false);
    this.overlay.on('pointerdown', () => this.hide());
    const children: Phaser.GameObjects.GameObject[] = [];
    children.push(this.scene.add.rectangle(300, 960, 600, 1460, 0xffffff, 0.001).setInteractive());
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x0a1028, 0.99); panel.fillRoundedRect(18, 230, 600, 1480, 58);
    panel.lineStyle(4, 0xffcf78, 0.25); panel.strokeRoundedRect(18, 230, 600, 1480, 58);
    panel.fillStyle(0x823f83, 0.18); panel.fillRoundedRect(36, 248, 564, 236, 44);
    children.push(panel);
    const icon = this.scene.add.image(116, 338, 'ui-daily-orbit').setDisplaySize(126, 126);
    const title = this.scene.add.text(190, 281, translate('daily.title'), { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '38px', color: '#fff6da', stroke: '#43234d', strokeThickness: 7 });
    this.streakText = this.scene.add.text(194, 342, translate('daily.streak', { current: 0 }), { fontFamily: 'system-ui, sans-serif', fontStyle: '900', fontSize: '20px', color: '#ffcfe6' });
    this.rewardText = this.scene.add.text(194, 385, '', { fontFamily: 'system-ui, sans-serif', fontStyle: '800', fontSize: '19px', color: '#b8c9f1' });
    children.push(icon, title, this.streakText, this.rewardText);
    this.rewardButtonBackground = this.scene.add.graphics();
    this.rewardButtonLabel = this.scene.add.text(0, 0, translate('common.claim'), { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '21px', color: '#47271e' }).setOrigin(0.5);
    this.rewardButton = this.scene.add.container(476, 426, [this.rewardButtonBackground, this.rewardButtonLabel]);
    this.rewardButton.setSize(210, 72).setInteractive({ useHandCursor: true });
    this.rewardButton.on('pointerdown', () => { this.scene.tweens.add({ targets: this.rewardButton, scaleX: 0.96, scaleY: 0.94, duration: 75, yoyo: true, ease: 'Quad.Out' }); this.onDailyClaim(); });
    children.push(this.rewardButton);
    children.push(this.scene.add.text(66, 530, translate('daily.missions'), { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '26px', color: '#e9f4ff' }));
    DAILY_MISSIONS.forEach((mission, index) => { const card = this.createMissionCard(mission.id, 690 + index * 300); children.push(...card.children); this.missionCards.set(mission.id, card.view); });
    const chestBackground = this.scene.add.graphics();
    chestBackground.fillStyle(0x34214f, 0.96); chestBackground.fillRoundedRect(62, 1434, 510, 122, 34);
    chestBackground.lineStyle(3, 0xffcf78, 0.32); chestBackground.strokeRoundedRect(62, 1434, 510, 122, 34);
    children.push(chestBackground, this.scene.add.text(92, 1458, translate('daily.chest'), { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '22px', color: '#fff0b5' }));
    this.chestProgressText = this.scene.add.text(92, 1502, translate('daily.missionProgress', { current: 0, total: DAILY_MISSIONS.length }), { fontFamily: 'system-ui, sans-serif', fontStyle: '900', fontSize: '18px', color: '#bdefff' });
    this.chestRewardText = this.scene.add.text(362, 1502, `+${DAILY_CHAOS_CHEST_REWARD_COINS} ${translate('common.coins')}`, { fontFamily: 'system-ui, sans-serif', fontStyle: '900', fontSize: '18px', color: '#ffe59a' });
    children.push(this.chestProgressText, this.chestRewardText);
    children.push(this.scene.add.text(70, 1592, translate('daily.hint'), { fontFamily: 'system-ui, sans-serif', fontStyle: '700', fontSize: '17px', color: '#7f91bd', wordWrap: { width: 500 } }));
    this.drawer = this.scene.add.container(-660, 0, children).setDepth(2201).setVisible(false);
  }

  public show(state: DailyRetentionState): void { this.state = state; this.refresh(); if (this.opened) return; this.opened = true; this.overlay.setVisible(true).setAlpha(0); this.drawer.setVisible(true).setX(-660); this.scene.tweens.add({ targets: this.overlay, alpha: 1, duration: 170, ease: 'Quad.Out' }); this.scene.tweens.add({ targets: this.drawer, x: 0, duration: 330, ease: 'Back.Out' }); }
  public update(state: DailyRetentionState): void { this.state = state; this.refresh(); }
  public hide(): void { if (!this.opened) return; this.opened = false; this.scene.tweens.add({ targets: this.overlay, alpha: 0, duration: 150, ease: 'Quad.In' }); this.scene.tweens.add({ targets: this.drawer, x: -660, duration: 220, ease: 'Quad.In', onComplete: () => { if (!this.opened) { this.drawer.setVisible(false); this.overlay.setVisible(false); } } }); }
  public isOpen(): boolean { return this.opened; }

  private createMissionCard(id: DailyMissionId, centerY: number): { children: Phaser.GameObjects.GameObject[]; view: MissionCard } {
    const mission = getDailyMission(id); const children: Phaser.GameObjects.GameObject[] = []; const background = this.scene.add.graphics();
    background.fillStyle(0x151f42, 0.98); background.fillRoundedRect(62, centerY - 118, 510, 236, 38); background.lineStyle(3, 0x8feaff, 0.15); background.strokeRoundedRect(62, centerY - 118, 510, 236, 38);
    const name = this.scene.add.text(94, centerY - 84, localizedDailyMissionName(id).toUpperCase(), { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '24px', color: '#f4f8ff' });
    const progressText = this.scene.add.text(94, centerY - 30, '0 / 0', { fontFamily: 'system-ui, sans-serif', fontStyle: '900', fontSize: '22px', color: '#9feeff' });
    const rewardText = this.scene.add.text(94, centerY + 18, `+${mission.rewardCoins} ${translate('common.coins')}`, { fontFamily: 'system-ui, sans-serif', fontStyle: '900', fontSize: '19px', color: '#ffe59a' });
    const buttonBackground = this.scene.add.graphics(); const buttonLabel = this.scene.add.text(0, 0, translate('common.claim'), { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '18px', color: '#23304b' }).setOrigin(0.5);
    const button = this.scene.add.container(454, centerY + 53, [buttonBackground, buttonLabel]); button.setSize(180, 66).setInteractive({ useHandCursor: true }); button.on('pointerdown', () => { this.scene.tweens.add({ targets: button, scaleX: 0.96, scaleY: 0.94, duration: 70, yoyo: true, ease: 'Quad.Out' }); this.onMissionClaim(id); });
    children.push(background, name, progressText, rewardText, button); return { children, view: { id, progressText, rewardText, button, buttonBackground, buttonLabel } };
  }

  private refresh(): void {
    const reward = getDailyRewardPreview(this.state); this.streakText.setText(translate('daily.streak', { current: this.state.streak }));
    const core = reward.coreShards > 0 ? ` + ${reward.coreShards} ${translate('common.core')}` : '';
    this.rewardText.setText(translate('daily.nextReward', { coins: reward.coins, core }));
    const dailyReady = canClaimDailyReward(this.state); this.paintButton(this.rewardButtonBackground, dailyReady, 210, 72); this.rewardButtonLabel.setText(dailyReady ? translate('common.claim') : translate('common.claimed')); if (dailyReady) this.rewardButton.setInteractive({ useHandCursor: true }); else this.rewardButton.disableInteractive();
    for (const mission of DAILY_MISSIONS) { const card = this.missionCards.get(mission.id); if (!card) continue; const progress = this.state.counters[mission.id]; const claimed = this.state.claimed[mission.id]; const ready = progress >= mission.target && !claimed; card.progressText.setText(`${progress} / ${mission.target}`); card.rewardText.setText(claimed ? translate('daily.rewardClaimed') : `+${mission.rewardCoins} ${translate('common.coins')}`); card.rewardText.setColor(claimed ? '#7e90b9' : '#ffe59a'); this.paintButton(card.buttonBackground, ready, 180, 66); card.buttonLabel.setText(claimed ? translate('common.done') : ready ? translate('common.claim') : translate('common.locked')); if (ready) card.button.setInteractive({ useHandCursor: true }); else card.button.disableInteractive(); }
    const completionCount = getDailyMissionCompletionCount(this.state); const chestComplete = isDailyChaosChestComplete(this.state); this.chestProgressText.setText(chestComplete ? translate('daily.chestCracked') : translate('daily.missionProgress', { current: completionCount, total: DAILY_MISSIONS.length })); this.chestProgressText.setColor(chestComplete ? '#a9ffcc' : '#bdefff'); this.chestRewardText.setText(chestComplete ? translate('daily.bonusClaimed') : `+${DAILY_CHAOS_CHEST_REWARD_COINS} ${translate('common.coins')}`); this.chestRewardText.setColor(chestComplete ? '#7e90b9' : '#ffe59a');
  }

  private paintButton(graphics: Phaser.GameObjects.Graphics, active: boolean, width: number, height: number): void { graphics.clear(); graphics.fillStyle(active ? 0xffcf54 : 0x64708d, active ? 1 : 0.58); graphics.fillRoundedRect(-width / 2, -height / 2, width, height, Math.floor(height * 0.38)); graphics.lineStyle(3, 0xffffff, active ? 0.42 : 0.1); graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, Math.floor(height * 0.38)); }
}
