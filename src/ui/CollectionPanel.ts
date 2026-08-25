import * as Phaser from 'phaser';
import { getAllCreatures } from '../content/creatures';
import { getMutationDefinition, type MutationId } from '../content/mutations';
import {
  ACHIEVEMENTS,
  achievementProgress,
  isCollectionKey,
  type AchievementId,
  type CollectionProgress
} from '../systems/collectionProgression';

const CREATURES_PER_PAGE = 8;
const ACHIEVEMENTS_PER_PAGE = 6;

export class CollectionPanel {
  private overlay!: Phaser.GameObjects.Rectangle;
  private root!: Phaser.GameObjects.Container;
  private cardsRoot!: Phaser.GameObjects.Container;
  private achievementsRoot!: Phaser.GameObjects.Container;
  private titleCount!: Phaser.GameObjects.Text;
  private pageText!: Phaser.GameObjects.Text;
  private prevButton!: Phaser.GameObjects.Container;
  private nextButton!: Phaser.GameObjects.Container;
  private achievementPageText!: Phaser.GameObjects.Text;
  private achievementPrevButton!: Phaser.GameObjects.Container;
  private achievementNextButton!: Phaser.GameObjects.Container;
  private opened = false;
  private page = 0;
  private achievementPage = 0;
  private latestProgress: CollectionProgress | null = null;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly onClaimAchievement: (id: AchievementId) => void
  ) {}

  public create(): void {
    this.overlay = this.scene.add.rectangle(0, 0, 1080, 1920, 0x080b18, 0.72)
      .setOrigin(0).setDepth(1849).setInteractive().setVisible(false);
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
    const close = this.scene.add.text(394, -623, '×', { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '44px', color: '#ffffff' }).setOrigin(0.5);
    const closeHit = this.scene.add.circle(394, -622, 48, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    closeHit.on('pointerdown', () => this.hide());

    const collectionLabel = this.scene.add.text(-420, -532, 'DISCOVERIES', { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '24px', color: '#ffd984' });
    const rarityLegend = this.scene.add.container(0, 0, [
      this.createRarityPill(-112, -519, 'charged', 142),
      this.createRarityPill(55, -519, 'prismatic', 152),
      this.createRarityPill(258, -519, 'crowned', 190)
    ]);

    this.prevButton = this.createPageButton(-335, -105, '‹', () => this.changePage(-1));
    this.nextButton = this.createPageButton(335, -105, '›', () => this.changePage(1));
    this.pageText = this.scene.add.text(0, -105, 'FORMS 1–8 / 21', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '15px', color: '#bfefff', stroke: '#171a37', strokeThickness: 4
    }).setOrigin(0.5);

    const ascensionNote = this.scene.add.text(0, 53, 'T3 TWINS • SAME RARITY → ASCEND', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '15px', color: '#bfefff', stroke: '#171a37', strokeThickness: 4
    }).setOrigin(0.5);
    const achievementLabel = this.scene.add.text(-420, 89, 'ACHIEVEMENTS', { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '24px', color: '#ffd984' });
    this.achievementPrevButton = this.createAchievementPageButton(292, 105, '‹', () => this.changeAchievementPage(-1));
    this.achievementPageText = this.scene.add.text(350, 105, '1 / 3', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '14px', color: '#bfefff'
    }).setOrigin(0.5);
    this.achievementNextButton = this.createAchievementPageButton(408, 105, '›', () => this.changeAchievementPage(1));

    this.cardsRoot = this.scene.add.container(0, 0);
    this.achievementsRoot = this.scene.add.container(0, 0);
    this.root = this.scene.add.container(540, 960, [
      blocker, panel, icon, title, this.titleCount, closeBg, close, closeHit,
      collectionLabel, rarityLegend, this.prevButton, this.nextButton, this.pageText,
      ascensionNote, achievementLabel, this.achievementPrevButton, this.achievementPageText, this.achievementNextButton,
      this.cardsRoot, this.achievementsRoot
    ]).setDepth(1850).setVisible(false);
  }

  public update(progress: CollectionProgress): void {
    if (!this.root) return;
    this.latestProgress = progress;
    const creatures = getAllCreatures();
    const maxPage = Math.max(0, Math.ceil(creatures.length / CREATURES_PER_PAGE) - 1);
    this.page = Math.min(this.page, maxPage);
    const maxAchievementPage = Math.max(0, Math.ceil(ACHIEVEMENTS.length / ACHIEVEMENTS_PER_PAGE) - 1);
    this.achievementPage = Math.min(this.achievementPage, maxAchievementPage);
    this.titleCount.setText(`${progress.discovered.length} / ${creatures.length} discovered`);
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
    this.scene.tweens.add({ targets: this.root, alpha: 0, scaleX: 0.96, scaleY: 0.96, duration: 135, ease: 'Quad.In', onComplete: () => {
      this.root.setVisible(false);
      this.overlay.setVisible(false);
    } });
  }

  public isOpen(): boolean { return this.opened; }

  private createRarityPill(x: number, y: number, mutationId: Exclude<MutationId, 'none'>, width: number): Phaser.GameObjects.Container {
    const mutation = getMutationDefinition(mutationId);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x111832, 0.9);
    bg.fillRoundedRect(-width / 2, -17, width, 34, 13);
    bg.lineStyle(2, mutation.accentColor, 0.68);
    bg.strokeRoundedRect(-width / 2, -17, width, 34, 13);
    const text = this.scene.add.text(0, 0, `${mutation.shortLabel} ${mutation.rarity.toUpperCase()}`, { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '13px', color: '#f5fbff' }).setOrigin(0.5);
    return this.scene.add.container(x, y, [bg, text]);
  }

  private createPageButton(x: number, y: number, label: string, onPress: () => void): Phaser.GameObjects.Container {
    const bg = this.scene.add.circle(0, 0, 28, 0x28345b, 0.98).setStrokeStyle(2, 0x9defff, 0.35);
    const text = this.scene.add.text(0, -2, label, { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '32px', color: '#eaffff' }).setOrigin(0.5);
    const button = this.scene.add.container(x, y, [bg, text]);
    button.setSize(64, 64).setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => {
      this.scene.tweens.add({ targets: button, scaleX: 0.9, scaleY: 0.9, duration: 70, yoyo: true, ease: 'Quad.Out' });
      onPress();
    });
    return button;
  }

  private createAchievementPageButton(x: number, y: number, label: string, onPress: () => void): Phaser.GameObjects.Container {
    const bg = this.scene.add.circle(0, 0, 21, 0x28345b, 0.98).setStrokeStyle(2, 0x9defff, 0.3);
    const text = this.scene.add.text(0, -1, label, { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '23px', color: '#eaffff' }).setOrigin(0.5);
    const button = this.scene.add.container(x, y, [bg, text]);
    button.setSize(48, 48).setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => {
      this.scene.tweens.add({ targets: button, scaleX: 0.88, scaleY: 0.88, duration: 65, yoyo: true, ease: 'Quad.Out' });
      onPress();
    });
    return button;
  }

  private changePage(direction: number): void {
    const creatures = getAllCreatures();
    const maxPage = Math.max(0, Math.ceil(creatures.length / CREATURES_PER_PAGE) - 1);
    const next = Phaser.Math.Clamp(this.page + direction, 0, maxPage);
    if (next === this.page) return;
    this.page = next;
    if (this.latestProgress) this.renderCreatureCards(this.latestProgress);
  }

  private changeAchievementPage(direction: number): void {
    const maxPage = Math.max(0, Math.ceil(ACHIEVEMENTS.length / ACHIEVEMENTS_PER_PAGE) - 1);
    const next = Phaser.Math.Clamp(this.achievementPage + direction, 0, maxPage);
    if (next === this.achievementPage) return;
    this.achievementPage = next;
    if (this.latestProgress) this.renderAchievements(this.latestProgress);
  }

  private renderCreatureCards(progress: CollectionProgress): void {
    this.cardsRoot.removeAll(true);
    const creatures = getAllCreatures();
    const pageCount = Math.max(1, Math.ceil(creatures.length / CREATURES_PER_PAGE));
    const start = this.page * CREATURES_PER_PAGE;
    const visible = creatures.slice(start, start + CREATURES_PER_PAGE);
    const end = Math.min(creatures.length, start + CREATURES_PER_PAGE);
    this.pageText.setText(`FORMS ${start + 1}–${end} / ${creatures.length}  •  PAGE ${this.page + 1}/${pageCount}`);
    this.prevButton.setAlpha(this.page > 0 ? 1 : 0.28);
    this.nextButton.setAlpha(this.page < pageCount - 1 ? 1 : 0.28);

    visible.forEach((creature, index) => {
      const column = index % 4;
      const row = Math.floor(index / 4);
      const x = -315 + column * 210;
      const y = -400 + row * 182;
      const discovered = isCollectionKey(creature.key) && progress.discovered.includes(creature.key);

      const bg = this.scene.add.graphics();
      bg.fillStyle(discovered ? 0x22264a : 0x101327, 0.98);
      bg.fillRoundedRect(-91, -76, 182, 152, 24);
      bg.lineStyle(3, discovered ? creature.accentColor : 0x4c5271, discovered ? 0.6 : 0.24);
      bg.strokeRoundedRect(-91, -76, 182, 152, 24);

      const art = this.scene.add.image(0, -17, creature.texture).setDisplaySize(94, 94);
      if (!discovered) art.setTint(0x151827).setAlpha(0.42);
      const name = this.scene.add.text(0, 55, discovered ? creature.name.toUpperCase() : '???', {
        fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: discovered ? '11px' : '13px', color: discovered ? '#f5fbff' : '#77809f', align: 'center'
      }).setOrigin(0.5).setWordWrapWidth(150);
      const tier = this.scene.add.text(66, -57, `T${creature.level}`, { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '13px', color: discovered ? '#ffe69a' : '#59617e' }).setOrigin(0.5);
      this.cardsRoot.add(this.scene.add.container(x, y, [bg, art, name, tier]));
    });
  }

  private renderAchievements(progress: CollectionProgress): void {
    this.achievementsRoot.removeAll(true);
    const pageCount = Math.max(1, Math.ceil(ACHIEVEMENTS.length / ACHIEVEMENTS_PER_PAGE));
    const start = this.achievementPage * ACHIEVEMENTS_PER_PAGE;
    const visible = ACHIEVEMENTS.slice(start, start + ACHIEVEMENTS_PER_PAGE);
    this.achievementPageText.setText(`${this.achievementPage + 1} / ${pageCount}`);
    this.achievementPrevButton.setAlpha(this.achievementPage > 0 ? 1 : 0.28);
    this.achievementNextButton.setAlpha(this.achievementPage < pageCount - 1 ? 1 : 0.28);

    visible.forEach((achievement, index) => {
      const status = achievementProgress(progress, achievement.id);
      const y = 156 + index * 88;
      const row = this.scene.add.graphics();
      row.fillStyle(status.claimed ? 0x1a2940 : status.ready ? 0x392c56 : 0x1d2140, 0.98);
      row.fillRoundedRect(-412, -35, 824, 70, 22);
      row.lineStyle(2, status.ready ? 0xffd768 : 0x7080ad, status.ready ? 0.58 : 0.18);
      row.strokeRoundedRect(-412, -35, 824, 70, 22);
      const title = this.scene.add.text(-384, -25, achievement.name, { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '17px', color: status.claimed ? '#8fe8bb' : '#f4f7ff' });
      const progressText = this.scene.add.text(-384, 1, `${achievement.description}   ${status.current}/${status.target}`, { fontFamily: 'system-ui, sans-serif', fontStyle: '700', fontSize: '14px', color: '#aab6d8' });
      const rewardText = achievement.reward.coreShards > 0 ? `${achievement.reward.coreShards} SHARD${achievement.reward.coreShards === 1 ? '' : 'S'}` : `${achievement.reward.coins} COINS`;
      const buttonBg = this.scene.add.graphics();
      buttonBg.fillStyle(status.claimed ? 0x31526a : status.ready ? 0xf6b94b : 0x353b5b, 1);
      buttonBg.fillRoundedRect(-96, -25, 192, 50, 20);
      const buttonText = this.scene.add.text(0, 0, status.claimed ? 'CLAIMED' : status.ready ? `CLAIM ${rewardText}` : rewardText, { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: status.ready ? '12px' : '14px', color: status.ready ? '#3b2718' : '#cad2e8', align: 'center' }).setOrigin(0.5);
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
