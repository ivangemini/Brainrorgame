import type * as Phaser from 'phaser';
import { getAllBosses } from '../content/bosses';
import { GameAnalytics } from '../analytics/GameAnalytics';
import type { PlatformAdapter } from '../platform/PlatformAdapter';
import { createGameSave, parseGameSave, type GameSave } from '../state/save';
import {
  BOSS_HUNT_MILESTONES,
  bossHuntCompletionPercent,
  claimBossHuntMilestone,
  type BossHuntProgress,
  type BossTrophyRoomProgress
} from '../systems/bossHunt';
import {
  getCurrentBossHuntProgress,
  getCurrentBossTrophyRoomProgress,
  replaceCurrentBossHuntProgress
} from '../systems/bossHuntRuntime';

interface MilestoneView {
  readonly percent: 25 | 50 | 75 | 100;
  readonly progress: Phaser.GameObjects.Text;
  readonly reward: Phaser.GameObjects.Text;
  readonly background: Phaser.GameObjects.Graphics;
  readonly label: Phaser.GameObjects.Text;
  readonly button: Phaser.GameObjects.Container;
}

export class BossHuntPanel {
  private overlay!: Phaser.GameObjects.Rectangle;
  private root!: Phaser.GameObjects.Container;
  private bossName!: Phaser.GameObjects.Text;
  private tierText!: Phaser.GameObjects.Text;
  private hpText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private attemptText!: Phaser.GameObjects.Text;
  private trophyText!: Phaser.GameObjects.Text;
  private readonly milestoneViews = new Map<number, MilestoneView>();
  private opened = false;
  private save: GameSave | null = null;
  private progress: BossHuntProgress = getCurrentBossHuntProgress();
  private trophies: BossTrophyRoomProgress = getCurrentBossTrophyRoomProgress();

  public constructor(private readonly scene: Phaser.Scene) {}

  public create(): void {
    this.overlay = this.scene.add.rectangle(0, 0, 1080, 1920, 0x050815, 0.72)
      .setOrigin(0).setDepth(2440).setInteractive().setVisible(false);
    this.overlay.on('pointerdown', () => this.hide());

    const blocker = this.scene.add.rectangle(0, 0, 930, 1450, 0xffffff, 0.001).setInteractive();
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x10152d, 0.995); panel.fillRoundedRect(-465, -725, 930, 1450, 54);
    panel.lineStyle(5, 0xff9d62, 0.4); panel.strokeRoundedRect(-465, -725, 930, 1450, 54);
    panel.fillStyle(0x47233a, 0.94); panel.fillRoundedRect(-425, -683, 850, 188, 42);

    const crest = this.scene.add.graphics();
    crest.fillStyle(0xff9d62, 0.18); crest.fillCircle(-345, -590, 64);
    crest.lineStyle(5, 0xffbd77, 0.72); crest.strokeCircle(-345, -590, 55);
    crest.fillStyle(0xffd38f, 0.95); crest.fillTriangle(-368, -609, -322, -609, -345, -560);
    crest.fillStyle(0xff8b68, 0.95); crest.fillCircle(-345, -599, 17);

    const title = this.scene.add.text(-260, -649, 'BOSS HUNT', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '43px', color: '#fff7ef', stroke: '#301728', strokeThickness: 8
    });
    const subtitle = this.scene.add.text(-258, -592, 'WEEKLY DAMAGE RAID • PERSISTENT HP', {
      fontFamily: 'system-ui, sans-serif', fontStyle: '900', fontSize: '16px', color: '#ffc899'
    });
    const close = this.scene.add.text(390, -600, '×', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '46px', color: '#ffffff'
    }).setOrigin(0.5);
    const closeHit = this.scene.add.circle(390, -600, 48, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    closeHit.on('pointerdown', () => this.hide());

    const bossCard = this.scene.add.graphics();
    bossCard.fillStyle(0x171f3d, 0.98); bossCard.fillRoundedRect(-405, -444, 810, 252, 34);
    bossCard.lineStyle(3, 0xff9d62, 0.3); bossCard.strokeRoundedRect(-405, -444, 810, 252, 34);
    this.bossName = this.scene.add.text(-370, -414, '', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '28px', color: '#fff3df'
    });
    this.tierText = this.scene.add.text(-370, -371, '', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '19px', color: '#ffb16e'
    });
    this.hpText = this.scene.add.text(-370, -326, '', {
      fontFamily: 'system-ui, sans-serif', fontStyle: '900', fontSize: '20px', color: '#dce8ff'
    });
    this.progressBar = this.scene.add.graphics();
    this.attemptText = this.scene.add.text(-370, -236, '', {
      fontFamily: 'system-ui, sans-serif', fontStyle: '800', fontSize: '17px', color: '#aab9dc'
    });

    const rewardTitle = this.scene.add.text(-405, -144, 'DAMAGE CACHES', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '23px', color: '#ffd58f'
    });
    const milestoneObjects: Phaser.GameObjects.GameObject[] = [];
    BOSS_HUNT_MILESTONES.forEach((milestone, index) => {
      const made = this.createMilestone(milestone.percent, -63 + index * 125);
      milestoneObjects.push(...made.children);
      this.milestoneViews.set(milestone.percent, made.view);
    });

    const trophyCard = this.scene.add.graphics();
    trophyCard.fillStyle(0x171f3d, 0.98); trophyCard.fillRoundedRect(-405, 470, 810, 150, 32);
    trophyCard.lineStyle(3, 0xffd46a, 0.26); trophyCard.strokeRoundedRect(-405, 470, 810, 150, 32);
    const trophyTitle = this.scene.add.text(-370, 493, 'TROPHY ROOM', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '21px', color: '#ffe09a'
    });
    this.trophyText = this.scene.add.text(-370, 535, '', {
      fontFamily: 'system-ui, sans-serif', fontStyle: '800', fontSize: '16px', color: '#b9c8e6', wordWrap: { width: 735 }
    });
    const note = this.scene.add.text(0, 672, 'Boss HP persists across attempts. Caches are finite and use existing currencies.', {
      fontFamily: 'system-ui, sans-serif', fontStyle: '700', fontSize: '16px', color: '#8292b7', align: 'center', wordWrap: { width: 760 }
    }).setOrigin(0.5);

    this.root = this.scene.add.container(540, 960, [
      blocker, panel, crest, title, subtitle, close, closeHit,
      bossCard, this.bossName, this.tierText, this.hpText, this.progressBar, this.attemptText,
      rewardTitle, ...milestoneObjects,
      trophyCard, trophyTitle, this.trophyText, note
    ]).setDepth(2441).setVisible(false);
  }

  public async show(): Promise<void> {
    await this.reload();
    this.refresh();
    if (this.opened) return;
    this.opened = true;
    this.overlay.setVisible(true).setAlpha(0);
    this.root.setVisible(true).setAlpha(0).setScale(0.93);
    this.scene.tweens.add({ targets: this.overlay, alpha: 1, duration: 150, ease: 'Quad.Out' });
    this.scene.tweens.add({ targets: this.root, alpha: 1, scaleX: 1, scaleY: 1, duration: 230, ease: 'Back.Out' });
  }

  public hide(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.setVisible(false);
    this.overlay.setVisible(false);
  }

  public isOpen(): boolean { return this.opened; }

  private async reload(): Promise<void> {
    const platform = this.scene.registry.get('platform') as PlatformAdapter | undefined;
    if (!platform) return;
    const parsed = parseGameSave(await platform.loadSave<unknown>());
    if (parsed) {
      this.save = parsed;
      this.progress = parsed.bossHunt;
      this.trophies = parsed.bossTrophies;
    } else {
      this.progress = getCurrentBossHuntProgress();
      this.trophies = getCurrentBossTrophyRoomProgress();
    }
  }

  private async claim(percent: 25 | 50 | 75 | 100): Promise<void> {
    if (!this.save) await this.reload();
    if (!this.save) return;
    const result = claimBossHuntMilestone(this.progress, percent);
    if (!result.claimed) return;
    this.progress = result.progress;
    replaceCurrentBossHuntProgress(this.progress);
    const next = createGameSave({
      ...this.save,
      coins: this.save.coins + result.reward.coins,
      coreShards: this.save.coreShards + result.reward.coreShards,
      bossHunt: this.progress,
      bossTrophies: this.trophies
    });
    this.save = next;
    const platform = this.scene.registry.get('platform') as PlatformAdapter | undefined;
    if (platform) await platform.save(next);
    this.scene.registry.set('initialSave', next);
    const analytics = platform ? new GameAnalytics(platform) : null;
    analytics?.bossHuntClaim(this.progress.huntId, this.progress.bossId, percent, result.reward.coins, result.reward.coreShards);
    this.refresh();
  }

  private refresh(): void {
    const boss = getAllBosses().find((entry) => entry.id === this.progress.bossId);
    this.bossName.setText((boss?.name ?? this.progress.bossId).toUpperCase());
    this.tierText.setText(`${this.progress.tier.toUpperCase()} • WEEK ${this.progress.huntId % 100}`);
    this.hpText.setText(`HP ${this.progress.hpRemaining.toLocaleString()} / ${this.progress.maxHp.toLocaleString()}`);
    const completion = bossHuntCompletionPercent(this.progress);
    this.progressBar.clear();
    this.progressBar.fillStyle(0x303b5b, 0.9); this.progressBar.fillRoundedRect(-370, -287, 740, 28, 14);
    this.progressBar.fillStyle(0xff9d62, 0.96); this.progressBar.fillRoundedRect(-370, -287, Math.max(4, 740 * completion / 100), 28, 14);
    this.attemptText.setText(`DAMAGE ${completion}% • ATTEMPTS ${this.progress.attempts} • BEST ${this.progress.bestAttemptDamage.toLocaleString()}`);

    for (const milestone of BOSS_HUNT_MILESTONES) {
      const view = this.milestoneViews.get(milestone.percent);
      if (!view) continue;
      const claimed = this.progress.claimedMilestones.includes(milestone.percent);
      const ready = completion >= milestone.percent && !claimed;
      view.progress.setText(`${Math.min(completion, milestone.percent)} / ${milestone.percent}%`);
      view.reward.setText(this.rewardLabel(milestone.coins, milestone.coreShards));
      view.background.clear();
      view.background.fillStyle(ready ? 0xffc45f : 0x4a5673, ready ? 1 : 0.58);
      view.background.fillRoundedRect(-84, -29, 168, 58, 22);
      view.label.setText(claimed ? 'CLAIMED' : ready ? 'CLAIM' : 'LOCKED');
      view.label.setColor(ready ? '#392414' : '#c0c9d9');
      if (ready) view.button.setInteractive({ useHandCursor: true }); else view.button.disableInteractive();
    }

    const rows = getAllBosses().map((entry) => {
      const tier = this.trophies.trophies[entry.id];
      return `${entry.shortName}: ${tier ? tier.toUpperCase() : '—'}`;
    });
    this.trophyText.setText(rows.join('   •   '));
  }

  private createMilestone(percent: 25 | 50 | 75 | 100, y: number): { children: Phaser.GameObjects.GameObject[]; view: MilestoneView } {
    const milestone = BOSS_HUNT_MILESTONES.find((entry) => entry.percent === percent)!;
    const row = this.scene.add.graphics();
    row.fillStyle(0x171e38, 0.98); row.fillRoundedRect(-405, y - 47, 810, 94, 26);
    row.lineStyle(2, 0x6f7fa8, 0.2); row.strokeRoundedRect(-405, y - 47, 810, 94, 26);
    const title = this.scene.add.text(-370, y - 29, `${percent}% DAMAGE`, {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '19px', color: '#edf5ff'
    });
    const progress = this.scene.add.text(-370, y + 5, '', {
      fontFamily: 'system-ui, sans-serif', fontStyle: '900', fontSize: '15px', color: '#ffb77f'
    });
    const reward = this.scene.add.text(-190, y + 5, this.rewardLabel(milestone.coins, milestone.coreShards), {
      fontFamily: 'system-ui, sans-serif', fontStyle: '900', fontSize: '15px', color: '#ffe09a'
    });
    const background = this.scene.add.graphics();
    const label = this.scene.add.text(0, 0, 'LOCKED', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '14px', color: '#c0c9d9'
    }).setOrigin(0.5);
    const button = this.scene.add.container(310, y, [background, label]).setSize(176, 62);
    button.on('pointerdown', () => {
      this.scene.tweens.add({ targets: button, scaleX: 0.94, scaleY: 0.92, duration: 65, yoyo: true, ease: 'Quad.Out' });
      void this.claim(percent);
    });
    return { children: [row, title, progress, reward, button], view: { percent, progress, reward, background, label, button } };
  }

  private rewardLabel(coins: number, shards: number): string {
    return shards > 0 ? `${coins} COINS • ${shards} CORE` : `${coins} COINS`;
  }
}
