import type * as Phaser from 'phaser';
import { translate, type TranslationKey } from '../i18n';
import {
  WEEKLY_CHAOS_MAX_DEPTH,
  WEEKLY_CHAOS_MILESTONES,
  getWeeklyChaosRules,
  type WeeklyChaosProgress,
  type WeeklyChaosRuleId
} from '../systems/weeklyChaos';

interface MilestoneView {
  readonly target: number;
  readonly progressText: Phaser.GameObjects.Text;
  readonly rewardText: Phaser.GameObjects.Text;
  readonly button: Phaser.GameObjects.Container;
  readonly buttonBackground: Phaser.GameObjects.Graphics;
  readonly buttonLabel: Phaser.GameObjects.Text;
}

export class WeeklyChaosPanel {
  private overlay!: Phaser.GameObjects.Rectangle;
  private root!: Phaser.GameObjects.Container;
  private rulesRoot!: Phaser.GameObjects.Container;
  private weekText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private startButton!: Phaser.GameObjects.Container;
  private startButtonBackground!: Phaser.GameObjects.Graphics;
  private startButtonLabel!: Phaser.GameObjects.Text;
  private readonly milestoneViews = new Map<number, MilestoneView>();
  private opened = false;
  private progress!: WeeklyChaosProgress;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly onStart: () => void,
    private readonly onClaim: (target: number) => void
  ) {}

  public create(): void {
    this.overlay = this.scene.add.rectangle(0, 0, 1080, 1920, 0x050815, 0.68)
      .setOrigin(0)
      .setDepth(2290)
      .setInteractive()
      .setVisible(false);
    this.overlay.on('pointerdown', () => this.hide());

    const panel = this.scene.add.graphics();
    panel.fillStyle(0x10152f, 0.995);
    panel.fillRoundedRect(-470, -700, 940, 1400, 54);
    panel.lineStyle(5, 0x78e9ff, 0.34);
    panel.strokeRoundedRect(-470, -700, 940, 1400, 54);
    panel.fillStyle(0x2b2459, 0.94);
    panel.fillRoundedRect(-430, -660, 860, 164, 42);

    const blocker = this.scene.add.rectangle(0, 0, 940, 1400, 0xffffff, 0.001).setInteractive();
    const crest = this.createChaosCrest(-358, -578);
    const title = this.scene.add.text(-284, -636, translate('weekly.title'), {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '39px',
      color: '#f7fbff',
      stroke: '#171a39',
      strokeThickness: 8
    });
    this.weekText = this.scene.add.text(-282, -581, '', {
      fontFamily: 'system-ui, sans-serif',
      fontStyle: '900',
      fontSize: '21px',
      color: '#bfefff'
    });
    const subtitle = this.scene.add.text(-282, -548, translate('weekly.subtitle'), {
      fontFamily: 'system-ui, sans-serif',
      fontStyle: '800',
      fontSize: '15px',
      color: '#9baad1'
    });

    const closeBg = this.scene.add.circle(394, -579, 34, 0x4c3a72, 0.95).setStrokeStyle(3, 0xffffff, 0.25);
    const close = this.scene.add.text(394, -580, '×', {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '44px',
      color: '#ffffff'
    }).setOrigin(0.5);
    const closeHit = this.scene.add.circle(394, -579, 48, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    closeHit.on('pointerdown', () => this.hide());

    const rulesLabel = this.scene.add.text(-420, -454, translate('weekly.rules'), {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '22px',
      color: '#ffd984'
    });
    this.rulesRoot = this.scene.add.container(0, 0);

    const progressCard = this.scene.add.graphics();
    progressCard.fillStyle(0x17213f, 0.98);
    progressCard.fillRoundedRect(-420, 68, 840, 138, 32);
    progressCard.lineStyle(3, 0x78e9ff, 0.22);
    progressCard.strokeRoundedRect(-420, 68, 840, 138, 32);
    this.progressText = this.scene.add.text(-388, 92, '', {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '23px',
      color: '#dff9ff'
    });

    this.startButtonBackground = this.scene.add.graphics();
    this.startButtonLabel = this.scene.add.text(0, 0, translate('weekly.start'), {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '20px',
      color: '#38251c'
    }).setOrigin(0.5);
    this.startButton = this.scene.add.container(275, 145, [this.startButtonBackground, this.startButtonLabel]);
    this.startButton.setSize(246, 76).setInteractive({ useHandCursor: true });
    this.startButton.on('pointerdown', () => {
      if (!this.progress || this.progress.active) return;
      this.scene.tweens.add({ targets: this.startButton, scaleX: 0.95, scaleY: 0.93, duration: 70, yoyo: true, ease: 'Quad.Out' });
      this.onStart();
    });

    const rewardLabel = this.scene.add.text(-420, 250, 'MILESTONE CACHES', {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '22px',
      color: '#ffd984'
    });

    const milestoneObjects: Phaser.GameObjects.GameObject[] = [];
    WEEKLY_CHAOS_MILESTONES.forEach((milestone, index) => {
      const created = this.createMilestoneRow(milestone.target, 330 + index * 122);
      milestoneObjects.push(...created.children);
      this.milestoneViews.set(milestone.target, created.view);
    });

    const note = this.scene.add.text(0, 642, translate('weekly.note'), {
      fontFamily: 'system-ui, sans-serif',
      fontStyle: '700',
      fontSize: '16px',
      color: '#8494bd',
      align: 'center',
      wordWrap: { width: 760 }
    }).setOrigin(0.5);

    this.root = this.scene.add.container(540, 960, [
      blocker,
      panel,
      crest,
      title,
      this.weekText,
      subtitle,
      closeBg,
      close,
      closeHit,
      rulesLabel,
      this.rulesRoot,
      progressCard,
      this.progressText,
      this.startButton,
      rewardLabel,
      ...milestoneObjects,
      note
    ]).setDepth(2291).setVisible(false);
  }

  public show(progress: WeeklyChaosProgress): void {
    this.progress = progress;
    this.refresh();
    if (this.opened) return;
    this.opened = true;
    this.overlay.setVisible(true).setAlpha(0);
    this.root.setVisible(true).setAlpha(0).setScale(0.93);
    this.scene.tweens.add({ targets: this.overlay, alpha: 1, duration: 150, ease: 'Quad.Out' });
    this.scene.tweens.add({ targets: this.root, alpha: 1, scaleX: 1, scaleY: 1, duration: 230, ease: 'Back.Out' });
  }

  public update(progress: WeeklyChaosProgress): void {
    this.progress = progress;
    if (this.root) this.refresh();
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
        if (!this.opened) {
          this.root.setVisible(false);
          this.overlay.setVisible(false);
        }
      }
    });
  }

  public isOpen(): boolean {
    return this.opened;
  }

  private refresh(): void {
    const week = this.progress.weekId % 100;
    const year = Math.floor(this.progress.weekId / 100);
    this.weekText.setText(`${translate('weekly.week', { week })} • ${year}`);
    this.progressText.setText(translate('weekly.progress', {
      current: this.progress.active ? this.progress.depth : 0,
      best: this.progress.bestDepth
    }));

    this.renderRules();
    this.paintStartButton();

    for (const milestone of WEEKLY_CHAOS_MILESTONES) {
      const view = this.milestoneViews.get(milestone.target);
      if (!view) continue;
      const claimed = this.progress.claimedMilestones.includes(milestone.target);
      const ready = this.progress.bestDepth >= milestone.target && !claimed;
      const reward = this.rewardLabel(milestone.coins, milestone.coreShards);
      view.progressText.setText(`${Math.min(this.progress.bestDepth, milestone.target)} / ${milestone.target}`);
      view.rewardText.setText(reward);
      view.rewardText.setColor(claimed ? '#7485ad' : '#ffe59a');
      this.paintClaimButton(view.buttonBackground, ready);
      view.buttonLabel.setText(claimed ? translate('common.claimed') : ready ? translate('common.claim') : translate('common.locked'));
      if (ready) view.button.setInteractive({ useHandCursor: true });
      else view.button.disableInteractive();
    }
  }

  private renderRules(): void {
    this.rulesRoot.removeAll(true);
    const rules = getWeeklyChaosRules(this.progress.weekId);
    rules.forEach((rule, index) => {
      const y = -356 + index * 132;
      const card = this.scene.add.graphics();
      card.fillStyle(0x171d3a, 0.98);
      card.fillRoundedRect(-420, y - 50, 840, 102, 27);
      card.lineStyle(3, rule.accentColor, 0.35);
      card.strokeRoundedRect(-420, y - 50, 840, 102, 27);
      card.fillStyle(rule.accentColor, 0.9);
      card.fillRoundedRect(-420, y - 50, 12, 102, 6);
      const name = this.scene.add.text(-382, y - 34, translate(this.ruleNameKey(rule.id)), {
        fontFamily: 'Arial Black, system-ui, sans-serif',
        fontSize: '20px',
        color: '#f4f8ff'
      });
      const description = this.scene.add.text(-382, y - 3, translate(this.ruleDescriptionKey(rule.id)), {
        fontFamily: 'system-ui, sans-serif',
        fontStyle: '700',
        fontSize: '16px',
        color: '#aebce0',
        wordWrap: { width: 750 }
      });
      this.rulesRoot.add([card, name, description]);
    });
  }

  private createMilestoneRow(target: number, y: number): { children: Phaser.GameObjects.GameObject[]; view: MilestoneView } {
    const milestone = WEEKLY_CHAOS_MILESTONES.find((entry) => entry.target === target);
    if (!milestone) throw new Error(`Unknown weekly milestone: ${target}`);
    const row = this.scene.add.graphics();
    row.fillStyle(0x171d38, 0.98);
    row.fillRoundedRect(-420, y - 46, 840, 92, 26);
    row.lineStyle(2, 0x7185b8, 0.2);
    row.strokeRoundedRect(-420, y - 46, 840, 92, 26);
    const title = this.scene.add.text(-388, y - 28, `${target} / ${WEEKLY_CHAOS_MAX_DEPTH}`, {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '20px',
      color: '#e8f6ff'
    });
    const progressText = this.scene.add.text(-388, y + 5, '0 / 0', {
      fontFamily: 'system-ui, sans-serif',
      fontStyle: '900',
      fontSize: '16px',
      color: '#9feeff'
    });
    const rewardText = this.scene.add.text(-210, y + 4, this.rewardLabel(milestone.coins, milestone.coreShards), {
      fontFamily: 'system-ui, sans-serif',
      fontStyle: '900',
      fontSize: '16px',
      color: '#ffe59a'
    });
    const buttonBackground = this.scene.add.graphics();
    const buttonLabel = this.scene.add.text(0, 0, translate('common.locked'), {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '15px',
      color: '#24304b'
    }).setOrigin(0.5);
    const button = this.scene.add.container(315, y, [buttonBackground, buttonLabel]);
    button.setSize(170, 58);
    button.on('pointerdown', () => {
      this.scene.tweens.add({ targets: button, scaleX: 0.94, scaleY: 0.92, duration: 65, yoyo: true, ease: 'Quad.Out' });
      this.onClaim(target);
    });
    return {
      children: [row, title, progressText, rewardText, button],
      view: { target, progressText, rewardText, button, buttonBackground, buttonLabel }
    };
  }

  private paintStartButton(): void {
    const active = this.progress.active;
    this.startButtonBackground.clear();
    this.startButtonBackground.fillStyle(active ? 0x35516b : 0xffc94d, active ? 0.78 : 1);
    this.startButtonBackground.fillRoundedRect(-123, -38, 246, 76, 29);
    this.startButtonBackground.lineStyle(3, 0xffffff, active ? 0.14 : 0.42);
    this.startButtonBackground.strokeRoundedRect(-123, -38, 246, 76, 29);
    this.startButtonLabel.setText(active
      ? translate('weekly.active')
      : this.progress.bestDepth >= WEEKLY_CHAOS_MAX_DEPTH
        ? translate('weekly.restart')
        : translate('weekly.start'));
    this.startButtonLabel.setColor(active ? '#b8c6dc' : '#38251c');
    if (active) this.startButton.disableInteractive();
    else this.startButton.setInteractive({ useHandCursor: true });
  }

  private paintClaimButton(graphics: Phaser.GameObjects.Graphics, active: boolean): void {
    graphics.clear();
    graphics.fillStyle(active ? 0xffcf54 : 0x4d5875, active ? 1 : 0.55);
    graphics.fillRoundedRect(-85, -29, 170, 58, 22);
    graphics.lineStyle(2, 0xffffff, active ? 0.4 : 0.09);
    graphics.strokeRoundedRect(-85, -29, 170, 58, 22);
  }

  private createChaosCrest(x: number, y: number): Phaser.GameObjects.Container {
    const halo = this.scene.add.graphics();
    halo.fillStyle(0x1f3156, 0.98);
    halo.fillRoundedRect(-48, -48, 96, 96, 30);
    halo.lineStyle(4, 0x78e9ff, 0.55);
    halo.strokeRoundedRect(-48, -48, 96, 96, 30);
    const rune = this.scene.add.graphics();
    rune.fillStyle(0xffd568, 1);
    rune.beginPath();
    rune.moveTo(-8, -34);
    rune.lineTo(20, -8);
    rune.lineTo(3, -3);
    rune.lineTo(18, 30);
    rune.lineTo(-18, 4);
    rune.lineTo(-1, -2);
    rune.closePath();
    rune.fillPath();
    return this.scene.add.container(x, y, [halo, rune]);
  }

  private rewardLabel(coins: number, coreShards: number): string {
    const core = coreShards > 0 ? ` + ${coreShards} ${translate(coreShards === 1 ? 'common.shard' : 'common.shards')}` : '';
    return `${coins} ${translate('common.coins')}${core}`;
  }

  private ruleNameKey(id: WeeklyChaosRuleId): TranslationKey {
    switch (id) {
      case 'overclocked-crew': return 'weekly.rule.overclocked-crew.name';
      case 'thick-static': return 'weekly.rule.thick-static.name';
      case 'glass-fortress': return 'weekly.rule.glass-fortress.name';
      case 'price-spike': return 'weekly.rule.price-spike.name';
      case 'unstable-loot': return 'weekly.rule.unstable-loot.name';
      case 'cheap-trouble': return 'weekly.rule.cheap-trouble.name';
    }
  }

  private ruleDescriptionKey(id: WeeklyChaosRuleId): TranslationKey {
    switch (id) {
      case 'overclocked-crew': return 'weekly.rule.overclocked-crew.description';
      case 'thick-static': return 'weekly.rule.thick-static.description';
      case 'glass-fortress': return 'weekly.rule.glass-fortress.description';
      case 'price-spike': return 'weekly.rule.price-spike.description';
      case 'unstable-loot': return 'weekly.rule.unstable-loot.description';
      case 'cheap-trouble': return 'weekly.rule.cheap-trouble.description';
    }
  }
}
