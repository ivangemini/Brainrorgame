import * as Phaser from 'phaser';
import { getAllCreatures } from '../content/creatures';
import { MUTATION_IDS, getMutationDefinition, type MutationId } from '../content/mutations';
import { translate } from '../i18n';
import {
  ACHIEVEMENTS,
  achievementProgress,
  isCollectionKey,
  type AchievementId,
  type CollectionKey,
  type CollectionProgress
} from '../systems/collectionProgression';
import {
  mutationAlbumCompletion,
  mutationAlbumKey,
  nextMutationAlbumMilestone,
  type MutationAlbumProgress
} from '../systems/mutationAlbum';

const CREATURES_PER_PAGE = 8;
const ACHIEVEMENTS_PER_PAGE = 6;

export class CollectionPanel {
  private overlay!: Phaser.GameObjects.Rectangle;
  private root!: Phaser.GameObjects.Container;
  private cardsRoot!: Phaser.GameObjects.Container;
  private albumRoot!: Phaser.GameObjects.Container;
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
  private latestAlbum: MutationAlbumProgress | null = null;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly onClaimAchievement: (id: AchievementId) => void,
    private readonly onClaimMutationMilestone: (target: number) => void
  ) {}

  public create(): void {
    this.overlay = this.scene.add.rectangle(0, 0, 1080, 1920, 0x080b18, 0.72).setOrigin(0).setDepth(1849).setInteractive().setVisible(false);
    this.overlay.on('pointerdown', () => this.hide());
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x171a37, 0.99); panel.fillRoundedRect(-470, -720, 940, 1440, 54);
    panel.lineStyle(5, 0x8de9ff, 0.38); panel.strokeRoundedRect(-470, -720, 940, 1440, 54);
    panel.fillStyle(0x34275d, 0.88); panel.fillRoundedRect(-430, -680, 860, 116, 38);
    const blocker = this.scene.add.rectangle(0, 0, 940, 1440, 0xffffff, 0.001).setInteractive();
    const icon = this.scene.add.image(-365, -621, 'ui-chaos-codex').setDisplaySize(86, 86);
    const title = this.scene.add.text(-305, -657, translate('codex.title'), { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '39px', color: '#f5fbff', stroke: '#151a39', strokeThickness: 8 });
    this.titleCount = this.scene.add.text(-303, -607, translate('codex.discovered', { current: 0, total: getAllCreatures().length }), { fontFamily: 'system-ui, sans-serif', fontStyle: '800', fontSize: '22px', color: '#bfefff' });
    const closeBg = this.scene.add.circle(394, -622, 34, 0x4c3a72, 0.95).setStrokeStyle(3, 0xffffff, 0.25);
    const close = this.scene.add.text(394, -623, '×', { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '44px', color: '#ffffff' }).setOrigin(0.5);
    const closeHit = this.scene.add.circle(394, -622, 48, 0xffffff, 0.001).setInteractive({ useHandCursor: true }); closeHit.on('pointerdown', () => this.hide());
    const collectionLabel = this.scene.add.text(-420, -532, translate('codex.discoveries'), { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '23px', color: '#ffd984' });
    const rarityLegend = this.scene.add.container(0, 0, [this.createRarityPill(-112, -519, 'charged', 142), this.createRarityPill(55, -519, 'prismatic', 152), this.createRarityPill(258, -519, 'crowned', 190)]);
    this.prevButton = this.createPageButton(-335, -105, '‹', () => this.changePage(-1));
    this.nextButton = this.createPageButton(335, -105, '›', () => this.changePage(1));
    this.pageText = this.scene.add.text(0, -105, '', { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '15px', color: '#bfefff', stroke: '#171a37', strokeThickness: 4 }).setOrigin(0.5);
    const ascensionNote = this.scene.add.text(0, -61, translate('codex.ascend'), { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '13px', color: '#9ac7d8', stroke: '#171a37', strokeThickness: 4 }).setOrigin(0.5);
    const albumLabel = this.scene.add.text(-420, -20, translate('codex.album'), { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '23px', color: '#ffd984' });
    this.albumRoot = this.scene.add.container(0, 0);
    const achievementLabel = this.scene.add.text(-420, 151, translate('codex.achievements'), { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '23px', color: '#ffd984' });
    this.achievementPrevButton = this.createAchievementPageButton(292, 167, '‹', () => this.changeAchievementPage(-1));
    this.achievementPageText = this.scene.add.text(350, 167, '1 / 3', { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '14px', color: '#bfefff' }).setOrigin(0.5);
    this.achievementNextButton = this.createAchievementPageButton(408, 167, '›', () => this.changeAchievementPage(1));
    this.cardsRoot = this.scene.add.container(0, 0); this.achievementsRoot = this.scene.add.container(0, 0);
    this.root = this.scene.add.container(540, 960, [blocker, panel, icon, title, this.titleCount, closeBg, close, closeHit, collectionLabel, rarityLegend, this.prevButton, this.nextButton, this.pageText, ascensionNote, albumLabel, this.albumRoot, achievementLabel, this.achievementPrevButton, this.achievementPageText, this.achievementNextButton, this.cardsRoot, this.achievementsRoot]).setDepth(1850).setVisible(false);
  }

  public update(progress: CollectionProgress, album: MutationAlbumProgress): void {
    if (!this.root) return;
    this.latestProgress = progress;
    this.latestAlbum = album;
    const creatures = getAllCreatures();
    this.page = Math.min(this.page, Math.max(0, Math.ceil(creatures.length / CREATURES_PER_PAGE) - 1));
    this.achievementPage = Math.min(this.achievementPage, Math.max(0, Math.ceil(ACHIEVEMENTS.length / ACHIEVEMENTS_PER_PAGE) - 1));
    this.titleCount.setText(translate('codex.discovered', { current: progress.discovered.length, total: creatures.length }));
    this.renderCreatureCards(progress, album);
    this.renderMutationAlbum(album);
    this.renderAchievements(progress);
  }

  public show(progress: CollectionProgress, album: MutationAlbumProgress): void {
    this.opened = true;
    this.update(progress, album);
    this.overlay.setVisible(true).setAlpha(0);
    this.root.setVisible(true).setAlpha(0).setScale(0.93);
    this.scene.tweens.add({ targets: this.overlay, alpha: 1, duration: 150, ease: 'Quad.Out' });
    this.scene.tweens.add({ targets: this.root, alpha: 1, scaleX: 1, scaleY: 1, duration: 220, ease: 'Back.Out' });
  }

  public hide(): void {
    if (!this.opened) return;
    this.opened = false;
    this.scene.tweens.add({ targets: this.overlay, alpha: 0, duration: 120, ease: 'Quad.In' });
    this.scene.tweens.add({ targets: this.root, alpha: 0, scaleX: 0.96, scaleY: 0.96, duration: 135, ease: 'Quad.In', onComplete: () => { this.root.setVisible(false); this.overlay.setVisible(false); } });
  }

  public isOpen(): boolean { return this.opened; }

  private createRarityPill(x: number, y: number, mutationId: Exclude<MutationId, 'none'>, width: number): Phaser.GameObjects.Container {
    const mutation = getMutationDefinition(mutationId);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x111832, 0.9); bg.fillRoundedRect(-width / 2, -17, width, 34, 13);
    bg.lineStyle(2, mutation.accentColor, 0.68); bg.strokeRoundedRect(-width / 2, -17, width, 34, 13);
    const text = this.scene.add.text(0, 0, `${mutation.shortLabel} ${mutation.rarity.toUpperCase()}`, { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '13px', color: '#f5fbff' }).setOrigin(0.5);
    return this.scene.add.container(x, y, [bg, text]);
  }

  private createPageButton(x: number, y: number, label: string, onPress: () => void): Phaser.GameObjects.Container {
    const bg = this.scene.add.circle(0, 0, 28, 0x28345b, 0.98).setStrokeStyle(2, 0x9defff, 0.35);
    const text = this.scene.add.text(0, -2, label, { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '32px', color: '#eaffff' }).setOrigin(0.5);
    const button = this.scene.add.container(x, y, [bg, text]);
    button.setSize(64, 64).setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => { this.scene.tweens.add({ targets: button, scaleX: 0.9, scaleY: 0.9, duration: 70, yoyo: true, ease: 'Quad.Out' }); onPress(); });
    return button;
  }

  private createAchievementPageButton(x: number, y: number, label: string, onPress: () => void): Phaser.GameObjects.Container {
    const bg = this.scene.add.circle(0, 0, 21, 0x28345b, 0.98).setStrokeStyle(2, 0x9defff, 0.3);
    const text = this.scene.add.text(0, -1, label, { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '23px', color: '#eaffff' }).setOrigin(0.5);
    const button = this.scene.add.container(x, y, [bg, text]);
    button.setSize(48, 48).setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => { this.scene.tweens.add({ targets: button, scaleX: 0.88, scaleY: 0.88, duration: 65, yoyo: true, ease: 'Quad.Out' }); onPress(); });
    return button;
  }

  private changePage(direction: number): void {
    const maxPage = Math.max(0, Math.ceil(getAllCreatures().length / CREATURES_PER_PAGE) - 1);
    const next = Phaser.Math.Clamp(this.page + direction, 0, maxPage);
    if (next === this.page) return;
    this.page = next;
    if (this.latestProgress && this.latestAlbum) this.renderCreatureCards(this.latestProgress, this.latestAlbum);
  }

  private changeAchievementPage(direction: number): void {
    const maxPage = Math.max(0, Math.ceil(ACHIEVEMENTS.length / ACHIEVEMENTS_PER_PAGE) - 1);
    const next = Phaser.Math.Clamp(this.achievementPage + direction, 0, maxPage);
    if (next === this.achievementPage) return;
    this.achievementPage = next;
    if (this.latestProgress) this.renderAchievements(this.latestProgress);
  }

  private renderCreatureCards(progress: CollectionProgress, album: MutationAlbumProgress): void {
    this.cardsRoot.removeAll(true);
    const creatures = getAllCreatures();
    const pageCount = Math.max(1, Math.ceil(creatures.length / CREATURES_PER_PAGE));
    const start = this.page * CREATURES_PER_PAGE;
    const visible = creatures.slice(start, start + CREATURES_PER_PAGE);
    const end = Math.min(creatures.length, start + CREATURES_PER_PAGE);
    this.pageText.setText(translate('codex.forms', { start: start + 1, end, total: creatures.length, page: this.page + 1, pages: pageCount }));
    this.prevButton.setAlpha(this.page > 0 ? 1 : 0.28);
    this.nextButton.setAlpha(this.page < pageCount - 1 ? 1 : 0.28);

    visible.forEach((creature, index) => {
      const column = index % 4;
      const row = Math.floor(index / 4);
      const x = -315 + column * 210;
      const y = -400 + row * 182;
      const discovered = isCollectionKey(creature.key) && progress.discovered.includes(creature.key);
      const bg = this.scene.add.graphics();
      bg.fillStyle(discovered ? 0x22264a : 0x101327, 0.98); bg.fillRoundedRect(-91, -76, 182, 152, 24);
      bg.lineStyle(3, discovered ? creature.accentColor : 0x4c5271, discovered ? 0.6 : 0.24); bg.strokeRoundedRect(-91, -76, 182, 152, 24);
      const art = this.scene.add.image(0, -24, creature.texture).setDisplaySize(82, 82);
      if (!discovered) art.setTint(0x151827).setAlpha(0.42);
      const name = this.scene.add.text(0, 27, discovered ? creature.name.toUpperCase() : '???', { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: discovered ? '10px' : '13px', color: discovered ? '#f5fbff' : '#77809f', align: 'center' }).setOrigin(0.5).setWordWrapWidth(150);
      const tier = this.scene.add.text(66, -57, `T${creature.level}`, { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '13px', color: discovered ? '#ffe69a' : '#59617e' }).setOrigin(0.5);
      const markers = isCollectionKey(creature.key) ? this.createMutationMarkers(creature.key, album, discovered) : this.scene.add.container(0, 0);
      this.cardsRoot.add(this.scene.add.container(x, y, [bg, art, name, tier, markers]));
    });
  }

  private createMutationMarkers(creature: CollectionKey, album: MutationAlbumProgress, creatureDiscovered: boolean): Phaser.GameObjects.Container {
    const root = this.scene.add.container(0, 0);
    MUTATION_IDS.forEach((mutationId, index) => {
      const mutation = getMutationDefinition(mutationId);
      const unlocked = album.discovered.includes(mutationAlbumKey(creature, mutationId));
      const x = -48 + index * 32;
      const bg = this.scene.add.graphics();
      bg.fillStyle(unlocked ? 0x15223c : 0x0d1123, unlocked ? 0.98 : 0.78); bg.fillRoundedRect(-12, -11, 24, 22, 7);
      bg.lineStyle(2, unlocked ? mutation.accentColor : 0x4a526f, unlocked ? 0.9 : 0.22); bg.strokeRoundedRect(-12, -11, 24, 22, 7);
      let glyph: Phaser.GameObjects.GameObject;
      if (mutation.texture) {
        const image = this.scene.add.image(0, 0, mutation.texture).setDisplaySize(19, 19);
        if (!unlocked) image.setTint(0x30364d).setAlpha(0.45);
        glyph = image;
      } else {
        glyph = this.scene.add.text(0, 0, 'S', { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '11px', color: unlocked ? '#e8f2ff' : '#46506d' }).setOrigin(0.5);
      }
      root.add(this.scene.add.container(x, 56, [bg, glyph]).setAlpha(creatureDiscovered || unlocked ? 1 : 0.55));
    });
    return root;
  }

  private renderMutationAlbum(album: MutationAlbumProgress): void {
    this.albumRoot.removeAll(true);
    const completion = mutationAlbumCompletion(album);
    const progressText = this.scene.add.text(-420, 18, translate('codex.albumProgress', completion), { fontFamily: 'system-ui, sans-serif', fontStyle: '800', fontSize: '17px', color: '#bfefff' });
    const track = this.scene.add.graphics();
    track.fillStyle(0x0e1530, 1); track.fillRoundedRect(-420, 49, 520, 18, 9);
    track.fillStyle(0x78e9ff, 0.92); track.fillRoundedRect(-420, 49, Math.max(8, Math.round(520 * completion.current / completion.total)), 18, 9);
    this.albumRoot.add([progressText, track]);

    const milestone = nextMutationAlbumMilestone(album);
    if (!milestone) {
      const complete = this.scene.add.text(395, 57, translate('codex.albumComplete'), { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '17px', color: '#9ff4c6', stroke: '#171a37', strokeThickness: 4 }).setOrigin(1, 0.5);
      this.albumRoot.add(complete);
      return;
    }

    const ready = completion.current >= milestone.target;
    const rewardParts = [`+${milestone.coins} ${translate('common.coins')}`];
    if (milestone.coreShards > 0) rewardParts.push(`+${milestone.coreShards} ${translate(milestone.coreShards === 1 ? 'common.shard' : 'common.shards')}`);
    const reward = rewardParts.join(' • ');
    const status = ready
      ? translate('codex.albumReward', { target: milestone.target, reward })
      : translate('codex.albumNext', { current: completion.current, target: milestone.target });
    const statusText = this.scene.add.text(-420, 94, status, { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '14px', color: ready ? '#ffe5a0' : '#aab6d8' });
    this.albumRoot.add(statusText);

    if (!ready) return;
    const buttonBg = this.scene.add.graphics();
    buttonBg.fillStyle(0xf6b94b, 1); buttonBg.fillRoundedRect(-92, -23, 184, 46, 18);
    buttonBg.lineStyle(2, 0xffe5a0, 0.7); buttonBg.strokeRoundedRect(-92, -23, 184, 46, 18);
    const buttonText = this.scene.add.text(0, 0, translate('common.claim'), { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '14px', color: '#3b2718' }).setOrigin(0.5);
    const button = this.scene.add.container(318, 91, [buttonBg, buttonText]);
    button.setSize(190, 52).setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => {
      this.scene.tweens.add({ targets: button, scaleX: 0.93, scaleY: 0.93, duration: 70, yoyo: true, ease: 'Quad.Out' });
      this.onClaimMutationMilestone(milestone.target);
    });
    this.albumRoot.add(button);
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
      const y = 225 + index * 78;
      const row = this.scene.add.graphics();
      row.fillStyle(status.claimed ? 0x1a2940 : status.ready ? 0x392c56 : 0x1d2140, 0.98); row.fillRoundedRect(-412, -31, 824, 62, 20);
      row.lineStyle(2, status.ready ? 0xffd768 : 0x7080ad, status.ready ? 0.58 : 0.18); row.strokeRoundedRect(-412, -31, 824, 62, 20);
      const title = this.scene.add.text(-384, -23, achievement.name, { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '16px', color: status.claimed ? '#8fe8bb' : '#f4f7ff' });
      const progressText = this.scene.add.text(-384, 1, `${achievement.description}   ${status.current}/${status.target}`, { fontFamily: 'system-ui, sans-serif', fontStyle: '700', fontSize: '13px', color: '#aab6d8' });
      const rewardText = achievement.reward.coreShards > 0 ? `${achievement.reward.coreShards} ${translate(achievement.reward.coreShards === 1 ? 'common.shard' : 'common.shards')}` : `${achievement.reward.coins} ${translate('common.coins')}`;
      const buttonBg = this.scene.add.graphics();
      buttonBg.fillStyle(status.claimed ? 0x31526a : status.ready ? 0xf6b94b : 0x353b5b, 1); buttonBg.fillRoundedRect(-96, -23, 192, 46, 18);
      const buttonText = this.scene.add.text(0, 0, status.claimed ? translate('common.claimed') : status.ready ? `${translate('common.claim')} ${rewardText}` : rewardText, { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: status.ready ? '12px' : '13px', color: status.ready ? '#3b2718' : '#cad2e8', align: 'center' }).setOrigin(0.5);
      const button = this.scene.add.container(300, 0, [buttonBg, buttonText]);
      if (status.ready) {
        button.setSize(192, 50).setInteractive({ useHandCursor: true });
        button.on('pointerdown', () => { this.scene.tweens.add({ targets: button, scaleX: 0.94, scaleY: 0.94, duration: 70, yoyo: true, ease: 'Quad.Out' }); this.onClaimAchievement(achievement.id); });
      }
      this.achievementsRoot.add(this.scene.add.container(0, y, [row, title, progressText, button]));
    });
  }
}
