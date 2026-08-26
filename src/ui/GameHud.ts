import type * as Phaser from 'phaser';
import { getChapterMutator } from '../content/chapterMutators';
import { getAllWorlds, getWorldForChapter, getWorldStage, type WorldId } from '../content/worlds';
import { translate } from '../i18n';
import {
  ANOMALY_PITY_MAX,
  ANOMALY_SECRET_PITY_MAX,
  anomalyChargePercent,
  type AnomalyHuntState
} from '../systems/anomalyHunt';
import { effectiveRecruitCost, getCurrentAscensionState } from '../systems/ascension';
import { BOSS_STEP, GAUNTLET_STEP, WAVES_PER_CHAPTER, type EncounterStep } from '../systems/encounters';

const RECRUIT_COST = 20;

export class GameHud {
  private biomeBackdrop!: Phaser.GameObjects.Image;
  private coinsText!: Phaser.GameObjects.Text;
  private coreText!: Phaser.GameObjects.Text;
  private baseText!: Phaser.GameObjects.Text;
  private encounterText!: Phaser.GameObjects.Text;
  private chapterText!: Phaser.GameObjects.Text;
  private anomalyText!: Phaser.GameObjects.Text;
  private recruitLabel!: Phaser.GameObjects.Text;
  private recruitButton!: Phaser.GameObjects.Container;
  private upgradeButton!: Phaser.GameObjects.Container;
  private riftButton!: Phaser.GameObjects.Container;
  private riftText!: Phaser.GameObjects.Text;
  private dailyButton!: Phaser.GameObjects.Container;
  private dailyDot!: Phaser.GameObjects.Arc;
  private collectionButton!: Phaser.GameObjects.Container;
  private collectionDot!: Phaser.GameObjects.Arc;
  private lastWorldId: WorldId | null = null;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly onRecruit: () => void,
    private readonly onUpgrades: () => void,
    private readonly onRift: () => void,
    private readonly onDaily: () => void,
    private readonly onCollection: () => void
  ) {}

  public create(): void {
    this.biomeBackdrop = this.scene.add.image(540, 960, 'bg-candy-crater').setDisplaySize(1080, 1920);

    const topGlow = this.scene.add.graphics();
    topGlow.fillStyle(0x0b1028, 0.72);
    topGlow.fillRoundedRect(54, 54, 972, 186, 48);
    topGlow.lineStyle(3, 0xa9c8ff, 0.15);
    topGlow.strokeRoundedRect(54, 54, 972, 186, 48);

    this.encounterText = this.scene.add.text(100, 80, translate('hud.wave', { current: 1, total: WAVES_PER_CHAPTER }), {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '42px', color: '#f7fbff', stroke: '#18264d', strokeThickness: 8
    });
    this.chapterText = this.scene.add.text(102, 137, 'CANDY • 1 / 5', {
      fontFamily: 'system-ui, sans-serif', fontStyle: '900', fontSize: '21px', color: '#b9c9ff'
    });
    this.coinsText = this.scene.add.text(720, 91, '120', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '44px', color: '#fff3a8', stroke: '#5a3415', strokeThickness: 7
    }).setOrigin(1, 0);
    this.scene.add.circle(676, 119, 25, 0xffd55e).setStrokeStyle(6, 0xfff0a6, 1);
    this.scene.add.circle(676, 119, 10, 0xf5a623);
    this.baseText = this.scene.add.text(100, 180, translate('hud.fortress', { hp: 100 }), {
      fontFamily: 'system-ui, sans-serif', fontStyle: '800', fontSize: '27px', color: '#9ff4ff'
    });
    this.scene.add.image(684, 191, 'ui-core-shard').setDisplaySize(48, 48);
    this.coreText = this.scene.add.text(716, 172, '0', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '28px', color: '#bffaff', stroke: '#25375a', strokeThickness: 5
    });
    this.createCollectionButton();
    this.createDailyButton();
    this.createRiftButton();
    this.createUpgradeButton();
    this.createRecruitButton();
  }

  public update(
    coins: number,
    coreShards: number,
    baseHp: number,
    chapter: number,
    step: EncounterStep,
    dailyReady: boolean,
    collectionReady: boolean,
    anomalyHunt: AnomalyHuntState
  ): void {
    this.coinsText.setText(`${coins}`);
    this.coreText.setText(`${coreShards}`);
    this.baseText.setText(translate('hud.fortress', { hp: baseHp }));
    this.baseText.setColor(baseHp > 35 ? '#9ff4ff' : '#ff9bab');
    this.recruitLabel.setText(translate('hud.recruit', { cost: effectiveRecruitCost(RECRUIT_COST) }));
    this.riftText.setText(`RIFT ★${getCurrentAscensionState().chaosStars}`);

    const world = getWorldForChapter(chapter);
    const stage = getWorldStage(chapter);
    this.biomeBackdrop.setTexture(world.texture);
    const mutator = getChapterMutator(chapter);
    const stageLabel = stage <= 5 ? `${stage} / 5` : translate('hud.endless', { stage });
    const riftLabel = mutator && mutator.endlessTier > 0 ? `  •  ${translate('hud.rift', { tier: mutator.endlessTier })}` : '';
    const mutatorLabel = mutator ? `  •  ${mutator.name.toUpperCase()}` : '';
    this.chapterText
      .setText(`${world.shortName}  •  ${stageLabel}${riftLabel}${mutatorLabel}`)
      .setColor(mutator
        ? `#${mutator.accentColor.toString(16).padStart(6, '0')}`
        : `#${world.accentColor.toString(16).padStart(6, '0')}`);
    this.showWorldTransitionIfNeeded(world.id, world.name, world.ruleLabel, world.accentColor);

    if (step === BOSS_STEP) {
      this.encounterText.setText(translate('hud.boss', { chapter })).setColor('#fff0a6');
    } else if (step === GAUNTLET_STEP) {
      this.encounterText.setText(translate('hud.chaosGate', { current: WAVES_PER_CHAPTER, total: WAVES_PER_CHAPTER })).setColor('#ffcf72');
    } else {
      this.encounterText.setText(translate('hud.wave', { current: step + 1, total: WAVES_PER_CHAPTER })).setColor('#f7fbff');
    }
    this.dailyDot.setVisible(dailyReady);
    this.collectionDot.setVisible(collectionReady);

    const charge = anomalyChargePercent(anomalyHunt);
    this.anomalyText
      .setText(`${translate('hud.anomaly', { current: anomalyHunt.charge, max: ANOMALY_PITY_MAX })}  •  ${translate('hud.crownSignal', { current: anomalyHunt.secretPity, max: ANOMALY_SECRET_PITY_MAX })}`)
      .setColor(charge >= 80 ? '#63244d' : charge >= 50 ? '#6e3c2c' : '#76431f');
  }

  public pulseAnomaly(special: boolean): void {
    this.scene.tweens.killTweensOf(this.anomalyText);
    this.anomalyText.setScale(special ? 1.18 : 1.08).setAlpha(special ? 0.5 : 0.7);
    this.scene.tweens.add({ targets: this.anomalyText, scaleX: 1, scaleY: 1, alpha: 1, duration: special ? 320 : 170, ease: special ? 'Back.Out' : 'Quad.Out' });
  }

  private showWorldTransitionIfNeeded(id: WorldId, name: string, ruleLabel: string, accentColor: number): void {
    if (this.lastWorldId === null) { this.lastWorldId = id; return; }
    if (this.lastWorldId === id) return;
    this.lastWorldId = id;
    const worldNumber = getAllWorlds().findIndex((world) => world.id === id) + 1;
    const color = `#${accentColor.toString(16).padStart(6, '0')}`;
    const banner = this.scene.add.text(540, 350, translate('hud.world', { number: worldNumber, name: name.toUpperCase() }), {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '52px', color, stroke: '#10172c', strokeThickness: 10, align: 'center'
    }).setOrigin(0.5).setDepth(1500).setScale(0.45).setAlpha(0);
    const rule = this.scene.add.text(540, 414, ruleLabel.toUpperCase(), {
      fontFamily: 'system-ui, sans-serif', fontStyle: '900', fontSize: '24px', color: '#f4fbff', stroke: '#10172c', strokeThickness: 6
    }).setOrigin(0.5).setDepth(1500).setAlpha(0);
    this.scene.tweens.add({ targets: banner, alpha: 1, scaleX: 1, scaleY: 1, duration: 360, ease: 'Back.Out' });
    this.scene.tweens.add({ targets: rule, alpha: 1, y: 430, duration: 300, delay: 160, ease: 'Quad.Out' });
    this.scene.time.delayedCall(1450, () => {
      this.scene.tweens.add({ targets: [banner, rule], alpha: 0, y: '-=24', duration: 260, ease: 'Quad.In', onComplete: () => { banner.destroy(); rule.destroy(); } });
    });
    this.scene.cameras.main.flash(170, 220, 248, 255, false);
  }

  private createCollectionButton(): void {
    const halo = this.scene.add.circle(0, 0, 38, 0x253b61, 0.96).setStrokeStyle(3, 0x9defff, 0.42);
    const icon = this.scene.add.image(0, 0, 'ui-chaos-codex').setDisplaySize(62, 62);
    this.collectionDot = this.scene.add.circle(25, -25, 10, 0xffc84d).setStrokeStyle(3, 0xffffff, 0.9);
    this.collectionButton = this.scene.add.container(878, 112, [halo, icon, this.collectionDot]);
    this.collectionButton.setSize(82, 82).setInteractive({ useHandCursor: true });
    this.collectionButton.on('pointerdown', () => {
      this.scene.tweens.add({ targets: this.collectionButton, scaleX: 0.92, scaleY: 0.92, duration: 75, yoyo: true, ease: 'Quad.Out' });
      this.onCollection();
    });
  }

  private createDailyButton(): void {
    const halo = this.scene.add.circle(0, 0, 38, 0x402d70, 0.94).setStrokeStyle(3, 0xffdc92, 0.42);
    const icon = this.scene.add.image(0, 0, 'ui-daily-orbit').setDisplaySize(62, 62);
    this.dailyDot = this.scene.add.circle(25, -25, 10, 0xff557f).setStrokeStyle(3, 0xffffff, 0.9);
    this.dailyButton = this.scene.add.container(970, 112, [halo, icon, this.dailyDot]);
    this.dailyButton.setSize(82, 82).setInteractive({ useHandCursor: true });
    this.dailyButton.on('pointerdown', () => {
      this.scene.tweens.add({ targets: this.dailyButton, scaleX: 0.92, scaleY: 0.92, duration: 75, yoyo: true, ease: 'Quad.Out' });
      this.onDaily();
    });
  }

  private createRiftButton(): void {
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x4e357d, 0.96); bg.fillRoundedRect(-73, -27, 146, 54, 24);
    bg.lineStyle(3, 0xffdc82, 0.42); bg.strokeRoundedRect(-73, -27, 146, 54, 24);
    this.riftText = this.scene.add.text(0, 0, 'RIFT ★0', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '15px', color: '#fff2af'
    }).setOrigin(0.5);
    this.riftButton = this.scene.add.container(804, 191, [bg, this.riftText]);
    this.riftButton.setSize(146, 58).setInteractive({ useHandCursor: true });
    this.riftButton.on('pointerdown', () => {
      this.scene.tweens.add({ targets: this.riftButton, scaleX: 0.95, scaleY: 0.94, duration: 75, yoyo: true, ease: 'Quad.Out' });
      this.onRift();
    });
  }

  private createUpgradeButton(): void {
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x7359c9, 0.94); bg.fillRoundedRect(-73, -27, 146, 54, 24);
    bg.lineStyle(3, 0xc7f6ff, 0.35); bg.strokeRoundedRect(-73, -27, 146, 54, 24);
    const label = this.scene.add.text(0, 0, translate('hud.upgrades'), {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '14px', color: '#f5f9ff'
    }).setOrigin(0.5);
    this.upgradeButton = this.scene.add.container(948, 191, [bg, label]);
    this.upgradeButton.setSize(146, 58).setInteractive({ useHandCursor: true });
    this.upgradeButton.on('pointerdown', () => {
      this.scene.tweens.add({ targets: this.upgradeButton, scaleX: 0.96, scaleY: 0.94, duration: 75, yoyo: true, ease: 'Quad.Out' });
      this.onUpgrades();
    });
  }

  private createRecruitButton(): void {
    const background = this.scene.add.graphics();
    background.fillStyle(0xffc94d, 1); background.fillRoundedRect(-238, -62, 476, 124, 54);
    background.lineStyle(7, 0xffef9c, 0.86); background.strokeRoundedRect(-238, -62, 476, 124, 54);
    background.fillStyle(0xf0833e, 0.34); background.fillRoundedRect(-215, 20, 430, 25, 12);
    this.recruitLabel = this.scene.add.text(0, -8, translate('hud.recruit', { cost: effectiveRecruitCost(RECRUIT_COST) }), {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '37px', color: '#47271e', align: 'center'
    }).setOrigin(0.5);
    this.anomalyText = this.scene.add.text(0, 37, `${translate('hud.anomaly', { current: 0, max: ANOMALY_PITY_MAX })}  •  ${translate('hud.crownSignal', { current: 0, max: ANOMALY_SECRET_PITY_MAX })}`, {
      fontFamily: 'system-ui, sans-serif', fontStyle: '900', fontSize: '16px', color: '#76431f'
    }).setOrigin(0.5);
    this.recruitButton = this.scene.add.container(540, 1841, [background, this.recruitLabel, this.anomalyText]);
    this.recruitButton.setSize(476, 124).setInteractive({ useHandCursor: true });
    this.recruitButton.on('pointerdown', () => {
      this.scene.tweens.add({ targets: this.recruitButton, scaleX: 0.96, scaleY: 0.94, duration: 80, yoyo: true, ease: 'Quad.Out' });
      this.onRecruit();
    });
  }
}
