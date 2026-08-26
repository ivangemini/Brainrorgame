import type * as Phaser from 'phaser';
import { GameAnalytics } from '../analytics/GameAnalytics';
import { getAscensionCopy } from '../i18n/ascensionCopy';
import { resolveLocale } from '../i18n';
import type { PlatformAdapter } from '../platform/PlatformAdapter';
import { createGameSave, parseGameSave, type GameSave } from '../state/save';
import {
  ASCENSION_NODES,
  getAscensionEffects,
  getAscensionNode,
  performAscension,
  previewAscension,
  purchaseAscensionNode,
  type AscensionBranch,
  type AscensionNodeId,
  type AscensionProgress
} from '../systems/ascension';
import { syncCurrentAscensionProgress } from '../systems/ascensionRuntime';
import { createStarterBoard } from '../systems/board';
import { getEncounterSpec } from '../systems/encounters';

interface NodeView {
  readonly background: Phaser.GameObjects.Graphics;
  readonly name: Phaser.GameObjects.Text;
  readonly description: Phaser.GameObjects.Text;
  readonly cost: Phaser.GameObjects.Text;
  readonly hit: Phaser.GameObjects.Rectangle;
}

const BRANCH_ACCENTS: Readonly<Record<AscensionBranch, number>> = {
  merge: 0x62e6ff,
  combat: 0xff7a8e,
  chaos: 0xc692ff,
  collection: 0xffd76a
};

const RECRUIT_CREDIT_COIN_VALUE = 20;

export class AscensionPanel {
  private overlay!: Phaser.GameObjects.Rectangle;
  private root!: Phaser.GameObjects.Container;
  private starText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private ascendLabel!: Phaser.GameObjects.Text;
  private ascendBackground!: Phaser.GameObjects.Graphics;
  private ascendHit!: Phaser.GameObjects.Rectangle;
  private readonly nodes = new Map<AscensionNodeId, NodeView>();
  private opened = false;
  private busy = false;
  private confirmArmed = false;
  private save: GameSave | null = null;
  private progress: AscensionProgress | null = null;

  public constructor(private readonly scene: Phaser.Scene) {}

  public create(): void {
    const copy = getAscensionCopy(resolveLocale());
    this.overlay = this.scene.add.rectangle(0, 0, 1080, 1920, 0x030611, 0.82)
      .setOrigin(0)
      .setDepth(2300)
      .setInteractive()
      .setVisible(false);
    this.overlay.on('pointerdown', () => this.hide());

    const children: Phaser.GameObjects.GameObject[] = [];
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x080d22, 0.995);
    panel.fillRoundedRect(-500, -835, 1000, 1670, 52);
    panel.lineStyle(4, 0xc692ff, 0.32);
    panel.strokeRoundedRect(-500, -835, 1000, 1670, 52);
    panel.fillStyle(0x6f3eb8, 0.18);
    panel.fillRoundedRect(-478, -812, 956, 170, 38);
    children.push(panel);

    children.push(this.scene.add.text(-438, -785, copy.title, {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '42px', color: '#f8f1ff',
      stroke: '#241443', strokeThickness: 8
    }));
    children.push(this.scene.add.text(-438, -724, 'RIFT PRESTIGE • PERMANENT RULES', {
      fontFamily: 'system-ui, sans-serif', fontStyle: '900', fontSize: '17px', color: '#b7a6df'
    }));

    const starPill = this.scene.add.graphics();
    starPill.fillStyle(0x20143d, 0.98); starPill.fillRoundedRect(196, -788, 244, 82, 32);
    starPill.lineStyle(2, 0xffd76a, 0.42); starPill.strokeRoundedRect(196, -788, 244, 82, 32);
    this.starText = this.scene.add.text(318, -747, '★ 0', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '28px', color: '#ffe38e'
    }).setOrigin(0.5);
    children.push(starPill, this.starText);

    const closeBg = this.scene.add.graphics();
    closeBg.fillStyle(0x283052, 0.98); closeBg.fillRoundedRect(326, -674, 116, 52, 22);
    const closeText = this.scene.add.text(384, -648, '×', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '34px', color: '#e9efff'
    }).setOrigin(0.5);
    const closeHit = this.scene.add.rectangle(384, -648, 132, 66, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    closeHit.on('pointerdown', () => this.hide());
    children.push(closeBg, closeText, closeHit);

    const branches: readonly AscensionBranch[] = ['merge', 'combat', 'chaos', 'collection'];
    branches.forEach((branch, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const centerX = col === 0 ? -244 : 244;
      const centerY = -350 + row * 590;
      children.push(...this.createBranch(branch, centerX, centerY));
    });

    this.statusText = this.scene.add.text(0, 520, '', {
      fontFamily: 'system-ui, sans-serif', fontStyle: '800', fontSize: '19px', color: '#bdc9ee',
      align: 'center', wordWrap: { width: 840 }
    }).setOrigin(0.5);
    children.push(this.statusText);

    this.ascendBackground = this.scene.add.graphics();
    this.ascendLabel = this.scene.add.text(0, 0, copy.ascend, {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '26px', color: '#160c29'
    }).setOrigin(0.5);
    const ascendButton = this.scene.add.container(0, 610, [this.ascendBackground, this.ascendLabel]);
    this.ascendHit = this.scene.add.rectangle(0, 610, 760, 98, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    this.ascendHit.on('pointerdown', () => void this.handleAscend());
    children.push(ascendButton, this.ascendHit);

    children.push(this.scene.add.text(0, 690, 'ASCENSION RESETS THE CAMPAIGN • CORE LAB + COLLECTION STAY', {
      fontFamily: 'system-ui, sans-serif', fontStyle: '800', fontSize: '15px', color: '#7887b5',
      align: 'center'
    }).setOrigin(0.5));

    this.root = this.scene.add.container(540, 960, children).setDepth(2301).setVisible(false);
  }

  public async show(): Promise<void> {
    if (this.opened) return;
    this.opened = true;
    this.confirmArmed = false;
    this.overlay.setVisible(true).setAlpha(0);
    this.root.setVisible(true).setScale(0.96).setAlpha(0);
    this.scene.tweens.add({ targets: this.overlay, alpha: 1, duration: 140, ease: 'Quad.Out' });
    this.scene.tweens.add({ targets: this.root, alpha: 1, scaleX: 1, scaleY: 1, duration: 190, ease: 'Back.Out' });
    await this.reloadSave();
  }

  public hide(): void {
    if (!this.opened || this.busy) return;
    this.opened = false;
    this.confirmArmed = false;
    this.scene.tweens.add({
      targets: [this.overlay, this.root], alpha: 0, duration: 130, ease: 'Quad.In',
      onComplete: () => {
        if (!this.opened) { this.overlay.setVisible(false); this.root.setVisible(false); }
      }
    });
  }

  public isOpen(): boolean { return this.opened; }

  private createBranch(branch: AscensionBranch, centerX: number, centerY: number): Phaser.GameObjects.GameObject[] {
    const copy = getAscensionCopy(resolveLocale());
    const accent = BRANCH_ACCENTS[branch];
    const children: Phaser.GameObjects.GameObject[] = [];
    const background = this.scene.add.graphics();
    background.fillStyle(0x111936, 0.97); background.fillRoundedRect(centerX - 226, centerY - 258, 452, 538, 34);
    background.lineStyle(3, accent, 0.28); background.strokeRoundedRect(centerX - 226, centerY - 258, 452, 538, 34);
    children.push(background);
    children.push(this.scene.add.text(centerX, centerY - 226, copy.branches[branch], {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '22px', color: `#${accent.toString(16).padStart(6, '0')}`
    }).setOrigin(0.5));

    const definitions = ASCENSION_NODES.filter((node) => node.branch === branch);
    definitions.forEach((definition, index) => {
      const y = centerY - 126 + index * 151;
      const nodeCopy = copy.nodes[definition.id];
      const card = this.scene.add.graphics();
      const name = this.scene.add.text(centerX - 186, y - 42, nodeCopy.name, {
        fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '17px', color: '#edf4ff'
      });
      const description = this.scene.add.text(centerX - 186, y - 13, nodeCopy.description, {
        fontFamily: 'system-ui, sans-serif', fontStyle: '700', fontSize: '13px', color: '#93a5d4',
        wordWrap: { width: 310 }
      });
      const cost = this.scene.add.text(centerX + 174, y - 10, `★ ${definition.cost}`, {
        fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '17px', color: '#ffe18b'
      }).setOrigin(1, 0.5);
      const hit = this.scene.add.rectangle(centerX, y, 406, 132, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => void this.handlePurchase(definition.id));
      this.nodes.set(definition.id, { background: card, name, description, cost, hit });
      children.push(card, name, description, cost, hit);
    });
    return children;
  }

  private async reloadSave(): Promise<void> {
    this.busy = true;
    this.statusText.setText('SYNCING ASCENSION CORE…');
    try {
      const platform = this.scene.registry.get('platform') as PlatformAdapter;
      const raw = await platform.loadSave<unknown>();
      this.save = parseGameSave(raw);
      this.progress = this.save?.ascension ?? null;
      this.refresh();
    } catch {
      this.save = null;
      this.progress = null;
      this.statusText.setText('SAVE UNAVAILABLE • TRY AGAIN');
      this.refreshNodes();
    } finally {
      this.busy = false;
    }
  }

  private refresh(): void {
    const copy = getAscensionCopy(resolveLocale());
    const save = this.save;
    const progress = this.progress;
    this.starText.setText(`★ ${progress?.chaosStars ?? 0}`);
    this.refreshNodes();
    this.ascendBackground.clear();

    if (!save || !progress) {
      this.statusText.setText('SAVE UNAVAILABLE • TRY AGAIN');
      this.ascendBackground.fillStyle(0x59627d, 0.7); this.ascendBackground.fillRoundedRect(-380, -49, 760, 98, 40);
      this.ascendLabel.setText(copy.ascend).setColor('#b9c2d8');
      return;
    }

    const preview = previewAscension(progress, save.chapter, save.weeklyChaos.active);
    if (preview.eligible) {
      this.statusText.setText(`RIFT CHAPTER ${save.chapter} • +${preview.starsAwarded} ★ • NEXT CACHE AT ${preview.nextChapter}`);
      this.ascendBackground.fillStyle(0xc692ff, 1); this.ascendBackground.fillRoundedRect(-380, -49, 760, 98, 40);
      this.ascendBackground.lineStyle(3, 0xffffff, 0.48); this.ascendBackground.strokeRoundedRect(-380, -49, 760, 98, 40);
      this.ascendLabel.setText(this.confirmArmed ? 'TAP AGAIN • RESET TO CHAPTER 1' : `${copy.ascend}  •  +${preview.starsAwarded} ★`).setColor('#160c29');
      return;
    }

    const reason = preview.reason === 'weekly-active' ? copy.weeklyBlocked : preview.reason === 'push-deeper' ? `${copy.pushDeeper} • ${preview.nextChapter}` : copy.locked;
    this.statusText.setText(reason);
    this.ascendBackground.fillStyle(0x59627d, 0.72); this.ascendBackground.fillRoundedRect(-380, -49, 760, 98, 40);
    this.ascendLabel.setText(copy.ascend).setColor('#b9c2d8');
  }

  private refreshNodes(): void {
    const progress = this.progress;
    for (const definition of ASCENSION_NODES) {
      const view = this.nodes.get(definition.id);
      if (!view) continue;
      const owned = progress?.purchasedNodes.includes(definition.id) ?? false;
      const prereqMet = definition.prerequisite === null || (progress?.purchasedNodes.includes(definition.prerequisite) ?? false);
      const affordable = (progress?.chaosStars ?? 0) >= definition.cost;
      const accent = BRANCH_ACCENTS[definition.branch];
      view.background.clear();
      view.background.fillStyle(owned ? accent : 0x1b2548, owned ? 0.22 : 0.94);
      const y = view.hit.y;
      view.background.fillRoundedRect(view.hit.x - 203, y - 66, 406, 132, 24);
      view.background.lineStyle(2, owned ? accent : 0x8292bf, owned ? 0.7 : prereqMet ? 0.28 : 0.12);
      view.background.strokeRoundedRect(view.hit.x - 203, y - 66, 406, 132, 24);
      view.name.setAlpha(prereqMet || owned ? 1 : 0.48);
      view.description.setAlpha(prereqMet || owned ? 1 : 0.4);
      view.cost.setText(owned ? 'OWNED' : `★ ${definition.cost}`).setColor(owned ? '#c7ffe1' : affordable && prereqMet ? '#ffe18b' : '#7180a9');
      if (!progress || owned || !prereqMet || !affordable || this.busy) view.hit.disableInteractive();
      else view.hit.setInteractive({ useHandCursor: true });
    }
  }

  private async handlePurchase(id: AscensionNodeId): Promise<void> {
    if (this.busy || !this.save || !this.progress) return;
    const result = purchaseAscensionNode(this.progress, id);
    if (!result.purchased) return;
    this.busy = true;
    this.progress = result.progress;
    this.refresh();
    try {
      const platform = this.scene.registry.get('platform') as PlatformAdapter;
      const next = createGameSave({ ...this.save, ascension: result.progress }, Date.now());
      await platform.save(next);
      this.save = next;
      syncCurrentAscensionProgress(next.ascension);
      this.scene.registry.set('initialSave', next);
      const definition = getAscensionNode(id);
      new GameAnalytics(platform).ascensionNodePurchase(definition.id, next.ascension.chaosStars);
    } catch {
      await this.reloadSave();
    } finally {
      this.busy = false;
      this.refresh();
    }
  }

  private async handleAscend(): Promise<void> {
    if (this.busy || !this.save || !this.progress) return;
    const preview = previewAscension(this.progress, this.save.chapter, this.save.weeklyChaos.active);
    if (!preview.eligible) return;
    if (!this.confirmArmed) {
      this.confirmArmed = true;
      this.refresh();
      return;
    }

    const result = performAscension(this.progress, this.save.chapter, Date.now(), this.save.weeklyChaos.active);
    if (!result.performed || !result.resetPlan) return;
    this.busy = true;
    this.refreshNodes();
    const platform = this.scene.registry.get('platform') as PlatformAdapter;
    try {
      const encounter = getEncounterSpec(1, 0);
      const effects = getAscensionEffects(result.progress.purchasedNodes);
      const pityRatio = result.resetPlan.anomalyPityCarryRatio;
      const next = createGameSave({
        ...this.save,
        coins: result.resetPlan.coins + effects.startingRecruitCredits * RECRUIT_CREDIT_COIN_VALUE,
        ascension: result.progress,
        anomalyHunt: {
          ...this.save.anomalyHunt,
          charge: Math.floor(this.save.anomalyHunt.charge * pityRatio),
          secretPity: Math.floor(this.save.anomalyHunt.secretPity * pityRatio)
        },
        baseHp: 100,
        chapter: 1,
        encounterStep: 0,
        targetHpMax: encounter.hp,
        targetHp: encounter.hp,
        recruitSerial: 0,
        board: createStarterBoard(),
        chaosPerks: []
      }, Date.now());
      await platform.save(next);
      syncCurrentAscensionProgress(next.ascension);
      this.scene.registry.set('initialSave', next);
      new GameAnalytics(platform).ascensionComplete(
        result.preview.chapter,
        result.preview.starsAwarded,
        result.progress.lifetimeChaosStars,
        result.progress.ascensions
      );
      this.scene.scene.restart();
    } catch {
      this.busy = false;
      this.confirmArmed = false;
      await this.reloadSave();
    }
  }
}
