import type * as Phaser from 'phaser';
import { getAllCreatures } from '../content/creatures';
import { getMutationDefinition, type MutationId } from '../content/mutations';
import {
  ACHIEVEMENTS,
  achievementProgress,
  isCollectionKey,
  type AchievementId,
  type CollectionProgress
} from '../systems/collectionProgression';

export class CollectionPanel {
  private overlay!: Phaser.GameObjects.Rectangle;
  private root!: Phaser.GameObjects.Container;
  private cardsRoot!: Phaser.GameObjects.Container;
  private achievementsRoot!: Phaser.GameObjects.Container;
  private titleCount!: Phaser.GameObjects.Text;
  private opened = false;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly onClaimAchievement: (id: AchievementId) => void
  ) {}

  public create(): void {
    this.overlay = this.scene.add.rectangle(0, 0, 1080, 1920, 0x080b18, 0.72)
      .setOrigin(0)
      .setDepth(1849)
      .setInteractive()
      .setVisible(false);
    this.overlay.on('pointerdown', () => this.hide());

    const panel = this.scene.add.graphics();
    panel.fillStyle(0x171a37, 0.99);
    panel.fillRoundedRect(-470, -720, 940, 1440, 54);
    panel.lineStyle(5, 0x8de9ff, 0.38);
    panel.strokeRoundedRect(-470, -720, 940, 1440, 54);
    panel.fillStyle(0x34275d, 0.88);
    panel.fillRoundedRect(-430, -680, 860, 116, 38);

    const blocker = this.scene.add.rectangle(0, 0, 940, 1440, 0xffffff, 0.001).setInteractive();
    const icon = this.scene.add.image(-365, -621, 'ui-chaos-codex').setDisplaySize(86, 86);
    const title = this.scene.add.text(-305, -657, 'CHAOS CODEX', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '42px', color: '#f5fbff', stroke: '#151a39', strokeThickness: 8
    });
    this.titleCount = this.scene.add.text(-303, -607, '0 discovered', {
      fontFamily: 'system-ui, sans-serif', fontStyle: '800', fontSize: '22px', color: '#bfefff'
    });

    const closeBg = this.scene.add.circle(394, -622, 34, 0x4c3a72, 0.95).setStrokeStyle(3, 0xffffff, 0.25);
    const close = this.scene.add.text(394, -623, '×', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '44px', color: '#ffffff'
    }).setOrigin(0.5);
    const closeHit = this.scene.add.circle(394, -622, 48, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    closeHit.on('pointerdown', () => this.hide());

    const collectionLabel = this.scene.add.text(-420, -532, 'DISCOVERIES', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '24px', color: '#ffd984'
    });
    const rarityLegend = this.scene.add.container(0, 0, [
      this.createRarityPill(-112, -519, 'charged', 142),
      this.createRarityPill(55, -519, 'prismatic', 152),
      this.createRarityPill(258, -519, 'crowned', 190)
    ]);
    const achievementLabel = this.scene.add.text(-420, 63, 'ACHIEVEMENTS', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '24px', color: '#ffd984'
    });

    this.cardsRoot = this.scene.add.container(0, 0);
    this.achievementsRoot = this.scene.add.container(0, 0);
    this.root = this.scene.add.container(540, 960, [
      blocker,
      panel,
      icon,
      title,
      this.titleCount,
      closeBg,
      close,
      closeHit,
      collectionLabel,
      rarityLegend,
      achievementLabel,
      this.cardsRoot,
      this.achievementsRoot
    ]).setDepth(1850).setVisible(false);
  }

  public update(progress: CollectionProgress): void {
    if (!this.root) return;
    this.titleCount.setText(`${progress.discovered.length} / ${getAllCreatures().length} discovered`);
    this.renderCreatureCards(progress);
    this.renderAchievements(progress);
  }

  public show(progress: CollectionProgress): void {
    this.opened = true;
    this.update(progress);
    this.overlay.setVisible(true).setAlpha(0);
    this.root.setVisible(true).setAlpha(0).setScale(0.93);
    this.scene.tweens.add({ targets: this.overlay, alpha: 1, duration: 150, ease: 'Quad.Out' });
    this.scene.tweens.add({ targets: this.root, alpha: 1, scaleX: 1, scaleY: 1, duration: 220, ease: 'Back.Out' });
  }

  public hide(): void {
    if (!this.opened) return;
    this.opened = false;
    this.scene.tweens.add({ targets: this.overlay, alpha: 0, duration: 120, ease: 'Quad.In' });
    this.scene.tweens.add({
      targets: this.root,
      alpha: 0,
      scaleX: 0.96,
      scaleY: 0.96,
      duration: 135,
      ease: 'Quad.In',
      onComplete: () => {
        this.root.setVisible(false);
        this.overlay.setVisible(false);
      }
    });
  }

  public isOpen(): boolean {
    return this.opened;
  }

  private createRarityPill(x: number, y: number, mutationId: Exclude<MutationId, 'none'>, width: number): Phaser.GameObjects.Container {
    const mutation = getMutationDefinition(mutationId);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x111832, 0.9);
    bg.fillRoundedRect(-width / 2, -17, width, 34, 13);
    bg.lineStyle(2, mutation.accentColor, 0.68);
    bg.strokeRoundedRect(-width / 2, -17, width, 34, 13);
    const text = this.scene.add.text(0, 0, `${mutation.shortLabel} ${mutation.rarity.toUpperCase()}`, {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '13px', color: '#f5fbff'
    }).setOrigin(0.5);
    return this.scene.add.container(x, y, [bg, text]);
  }

  private renderCreatureCards(progress: CollectionProgress): void {
    this.cardsRoot.removeAll(true);
    const creatures = getAllCreatures();
    creatures.forEach((creature, index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const x = -286 + column * 286;
      const y = -412 + row * 180;
      const discovered = isCollectionKey(creature.key) && progress.discovered.includes(creature.key);

      const bg = this.scene.add.graphics();
      bg.fillStyle(discovered ? 0x22264a : 0x101327, 0.98);
      bg.fillRoundedRect(-122, -77, 244, 154, 27);
      bg.lineStyle(3, discovered ? creature.accentColor : 0x4c5271, discovered ? 0.6 : 0.24);
      bg.strokeRoundedRect(-122, -77, 244, 154, 27);

      const art = this.scene.add.image(0, -16, creature.texture).setDisplaySize(104, 104);
      if (!discovered) art.setTint(0x151827).setAlpha(0.42);
      const name = this.scene.add.text(0, 56, discovered ? creature.name.toUpperCase() : '???', {
        fontFamily: 'Arial Black, system-ui, sans-serif',
        fontSize: discovered ? '12px' : '14px',
        color: discovered ? '#f5fbff' : '#77809f',
        align: 'center'
      }).setOrigin(0.5).setWordWrapWidth(188);
      const tier = this.scene.add.text(91, -57, `T${creature.level}`, {
        fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '14px', color: discovered ? '#ffe69a' : '#59617e'
      }).setOrigin(0.5);
      this.cardsRoot.add(this.scene.add.container(x, y, [bg, art, name, tier]));
    });
  }

  private renderAchievements(progress: CollectionProgress): void {
    this.achievementsRoot.removeAll(true);
    ACHIEVEMENTS.forEach((achievement, index) => {
      const status = achievementProgress(progress, achievement.id);
      const y = 132 + index * 88;
      const row = this.scene.add.graphics();
      row.fillStyle(status.claimed ? 0x1a2940 : status.ready ? 0x392c56 : 0x1d2140, 0.98);
      row.fillRoundedRect(-412, -35, 824, 70, 22);
      row.lineStyle(2, status.ready ? 0xffd768 : 0x7080ad, status.ready ? 0.58 : 0.18);
      row.strokeRoundedRect(-412, -35, 824, 70, 22);

      const title = this.scene.add.text(-384, -25, achievement.name, {
        fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '17px', color: status.claimed ? '#8fe8bb' : '#f4f7ff'
      });
      const progressText = this.scene.add.text(-384, 1, `${achievement.description}   ${status.current}/${status.target}`, {
        fontFamily: 'system-ui, sans-serif', fontStyle: '700', fontSize: '14px', color: '#aab6d8'
      });

      const rewardText = achievement.reward.coreShards > 0
        ? `${achievement.reward.coreShards} SHARD${achievement.reward.coreShards === 1 ? '' : 'S'}`
        : `${achievement.reward.coins} COINS`;
      const buttonBg = this.scene.add.graphics();
      buttonBg.fillStyle(status.claimed ? 0x31526a : status.ready ? 0xf6b94b : 0x353b5b, 1);
      buttonBg.fillRoundedRect(-96, -25, 192, 50, 20);
      const buttonText = this.scene.add.text(0, 0, status.claimed ? 'CLAIMED' : status.ready ? `CLAIM ${rewardText}` : rewardText, {
        fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: status.ready ? '12px' : '14px', color: status.ready ? '#3b2718' : '#cad2e8', align: 'center'
      }).setOrigin(0.5);
      const button = this.scene.add.container(300, 0, [buttonBg, buttonText]);
      if (status.ready) {
        button.setSize(192, 54).setInteractive({ useHandCursor: true });
        button.on('pointerdown', () => {
          this.scene.tweens.add({ targets: button, scaleX: 0.94, scaleY: 0.94, duration: 70, yoyo: true, ease: 'Quad.Out' });
          this.onClaimAchievement(achievement.id);
        });
      }
      this.achievementsRoot.add(this.scene.add.container(0, y, [row, title, progressText, button]));
    });
  }
}
