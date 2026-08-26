import type * as Phaser from 'phaser';
import { translate } from '../i18n';
import { riftCopy, riftNodeCopy } from '../i18n/riftCopy';
import {
  ASCENSION_BRANCHES,
  addChaosStars,
  ascensionRequiredChapter,
  ascensionReward,
  canAscend,
  getAscensionEffects,
  getAscensionNodes,
  getCurrentAscensionState,
  purchaseAscensionNode,
  syncCurrentAscensionState,
  type AscensionNodeDefinition
} from '../systems/ascension';
import {
  claimMutationAlbumMilestone,
  getCurrentMutationAlbumProgress,
  mutationAlbumCompletion,
  nextMutationAlbumMilestone,
  syncCurrentMutationAlbumProgress
} from '../systems/mutationAlbum';

export class RiftPanel {
  private overlay!: Phaser.GameObjects.Rectangle;
  private root!: Phaser.GameObjects.Container;
  private content!: Phaser.GameObjects.Container;
  private opened = false;
  private chapter = 1;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly onAscend: () => void,
    private readonly onStateChanged: () => void
  ) {}

  public create(): void {
    this.overlay = this.scene.add.rectangle(0, 0, 1080, 1920, 0x050817, 0.76)
      .setOrigin(0).setDepth(1889).setInteractive().setVisible(false);
    this.overlay.on('pointerdown', () => this.hide());

    const panel = this.scene.add.graphics();
    panel.fillStyle(0x11152d, 0.995); panel.fillRoundedRect(-470, -720, 940, 1440, 54);
    panel.lineStyle(5, 0xc58cff, 0.44); panel.strokeRoundedRect(-470, -720, 940, 1440, 54);
    panel.fillStyle(0x281e4b, 0.94); panel.fillRoundedRect(-430, -680, 860, 112, 36);

    const blocker = this.scene.add.rectangle(0, 0, 940, 1440, 0xffffff, 0.001).setInteractive();
    const title = this.scene.add.text(-390, -655, riftCopy('title'), {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '39px', color: '#f5efff', stroke: '#16112b', strokeThickness: 8
    });
    const subtitle = this.scene.add.text(-388, -606, riftCopy('subtitle'), {
      fontFamily: 'system-ui, sans-serif', fontStyle: '900', fontSize: '18px', color: '#d9bfff'
    });
    const closeBg = this.scene.add.circle(394, -622, 34, 0x4c3a72, 0.95).setStrokeStyle(3, 0xffffff, 0.25);
    const close = this.scene.add.text(394, -623, '×', { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '44px', color: '#ffffff' }).setOrigin(0.5);
    const closeHit = this.scene.add.circle(394, -622, 48, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    closeHit.on('pointerdown', () => this.hide());

    this.content = this.scene.add.container(0, 0);
    this.root = this.scene.add.container(540, 960, [blocker, panel, title, subtitle, closeBg, close, closeHit, this.content])
      .setDepth(1890).setVisible(false);
  }

  public show(chapter: number): void {
    this.chapter = Math.max(1, Math.floor(chapter));
    this.opened = true;
    this.render();
    this.overlay.setVisible(true).setAlpha(0);
    this.root.setVisible(true).setAlpha(0).setScale(0.94);
    this.scene.tweens.add({ targets: this.overlay, alpha: 1, duration: 140, ease: 'Quad.Out' });
    this.scene.tweens.add({ targets: this.root, alpha: 1, scaleX: 1, scaleY: 1, duration: 220, ease: 'Back.Out' });
  }

  public hide(): void {
    if (!this.opened) return;
    this.opened = false;
    this.scene.tweens.add({ targets: this.overlay, alpha: 0, duration: 110, ease: 'Quad.In' });
    this.scene.tweens.add({
      targets: this.root, alpha: 0, scaleX: 0.96, scaleY: 0.96, duration: 130, ease: 'Quad.In',
      onComplete: () => { this.root.setVisible(false); this.overlay.setVisible(false); }
    });
  }

  public isOpen(): boolean { return this.opened; }
  public refresh(chapter: number): void { this.chapter = Math.max(1, Math.floor(chapter)); if (this.opened) this.render(); }

  private render(): void {
    this.content.removeAll(true);
    const state = getCurrentAscensionState();
    const album = getCurrentMutationAlbumProgress();
    const completion = mutationAlbumCompletion(album);
    const reward = ascensionReward(state, this.chapter);
    const requiredChapter = ascensionRequiredChapter(state);

    this.content.add(this.scene.add.text(-405, -535, `★ ${state.chaosStars} ${riftCopy('stars')}`, {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '30px', color: '#ffe88a', stroke: '#3a285b', strokeThickness: 6
    }));
    this.content.add(this.scene.add.text(405, -529, `${riftCopy('ascensions')} ${state.totalAscensions}`, {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '18px', color: '#c9dcff'
    }).setOrigin(1, 0));

    const resetBox = this.scene.add.graphics();
    resetBox.fillStyle(canAscend(state, this.chapter) ? 0x4a2c72 : 0x202743, 0.96);
    resetBox.fillRoundedRect(-405, -470, 810, 112, 30);
    resetBox.lineStyle(3, canAscend(state, this.chapter) ? 0xffd875 : 0x7883a4, 0.55);
    resetBox.strokeRoundedRect(-405, -470, 810, 112, 30);
    this.content.add(resetBox);
    this.content.add(this.scene.add.text(-375, -445, canAscend(state, this.chapter)
      ? `${riftCopy('ready')} • +${reward} ★`
      : riftCopy('reach', { chapter: requiredChapter }), {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '21px', color: canAscend(state, this.chapter) ? '#fff0a6' : '#aebbd6'
    }));
    this.content.add(this.scene.add.text(-375, -411, riftCopy('resetNote'), {
      fontFamily: 'system-ui, sans-serif', fontStyle: '700', fontSize: '14px', color: '#b8c3df', wordWrap: { width: 565 }
    }));
    const ascendButton = this.createButton(300, -414, 160, 62, canAscend(state, this.chapter) ? riftCopy('ascend') : `CH ${requiredChapter}`, 0xffc95c, () => {
      if (!canAscend(getCurrentAscensionState(), this.chapter)) return;
      this.hide();
      this.onAscend();
    });
    ascendButton.setAlpha(canAscend(state, this.chapter) ? 1 : 0.42);
    this.content.add(ascendButton);

    this.content.add(this.scene.add.text(-405, -320, riftCopy('tree'), {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '24px', color: '#dcbfff'
    }));

    ASCENSION_BRANCHES.forEach((branch, branchIndex) => {
      const x = -300 + branchIndex * 200;
      this.content.add(this.scene.add.text(x, -278, riftCopy(branch), {
        fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '15px', color: '#bfefff'
      }).setOrigin(0.5));
      const nodes = getAscensionNodes().filter((node) => node.branch === branch);
      nodes.forEach((node, nodeIndex) => this.content.add(this.createNodeCard(x, -185 + nodeIndex * 166, node)));
    });

    const albumY = 190;
    const albumBox = this.scene.add.graphics();
    albumBox.fillStyle(0x17203d, 0.98); albumBox.fillRoundedRect(-405, albumY, 810, 252, 32);
    albumBox.lineStyle(3, 0x72efd0, 0.35); albumBox.strokeRoundedRect(-405, albumY, 810, 252, 32);
    this.content.add(albumBox);
    this.content.add(this.scene.add.text(-375, albumY + 22, `${riftCopy('album')} • ${completion.current}/${completion.total} • ${completion.percent}%`, {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '21px', color: '#bfffe8'
    }));
    this.content.add(this.scene.add.text(-375, albumY + 58, riftCopy('albumBody'), {
      fontFamily: 'system-ui, sans-serif', fontStyle: '700', fontSize: '15px', color: '#b9c7df'
    }));
    const bar = this.scene.add.graphics();
    bar.fillStyle(0x0b1125, 0.92); bar.fillRoundedRect(-375, albumY + 98, 750, 26, 13);
    bar.fillStyle(0x72efd0, 0.92); bar.fillRoundedRect(-375, albumY + 98, 750 * (completion.current / completion.total), 26, 13);
    this.content.add(bar);

    const milestone = nextMutationAlbumMilestone(album);
    if (milestone) {
      const ready = completion.current >= milestone.target;
      this.content.add(this.scene.add.text(-375, albumY + 148, riftCopy('next', {
        target: milestone.target,
        total: completion.total,
        stars: milestone.chaosStars,
        suffix: milestone.chaosStars === 1 ? '' : 'S'
      }), {
        fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '15px', color: ready ? '#fff0a6' : '#98a7c7'
      }));
      const claim = this.createButton(280, albumY + 177, 190, 54, ready ? translate('common.claim') : `${completion.current}/${milestone.target}`, 0x72efd0, () => {
        const currentAlbum = getCurrentMutationAlbumProgress();
        const effects = getAscensionEffects(getCurrentAscensionState());
        const result = claimMutationAlbumMilestone(currentAlbum, milestone.target, effects.albumMilestoneStarBonus);
        if (!result.claimed) return;
        syncCurrentMutationAlbumProgress(result.progress);
        syncCurrentAscensionState(addChaosStars(getCurrentAscensionState(), result.chaosStars));
        this.onStateChanged();
        this.render();
      });
      claim.setAlpha(ready ? 1 : 0.42);
      this.content.add(claim);
    } else {
      this.content.add(this.scene.add.text(0, albumY + 170, riftCopy('complete'), {
        fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '18px', color: '#ffe88a'
      }).setOrigin(0.5));
    }
  }

  private createNodeCard(x: number, y: number, node: AscensionNodeDefinition): Phaser.GameObjects.Container {
    const state = getCurrentAscensionState();
    const unlocked = state.unlockedNodes.includes(node.id);
    const prerequisiteMet = !node.prerequisite || state.unlockedNodes.includes(node.prerequisite);
    const affordable = state.chaosStars >= node.cost;
    const available = !unlocked && prerequisiteMet && affordable;
    const bg = this.scene.add.graphics();
    bg.fillStyle(unlocked ? 0x263b43 : 0x1b203c, 0.98); bg.fillRoundedRect(-88, -64, 176, 128, 23);
    bg.lineStyle(3, node.accentColor, unlocked ? 0.88 : available ? 0.58 : 0.22); bg.strokeRoundedRect(-88, -64, 176, 128, 23);
    const title = this.scene.add.text(0, -39, riftNodeCopy(node.id, 'name').toUpperCase(), {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '12px', color: unlocked ? '#e8fff4' : '#eef4ff', align: 'center'
    }).setOrigin(0.5).setWordWrapWidth(152);
    const desc = this.scene.add.text(0, -4, riftNodeCopy(node.id, 'description'), {
      fontFamily: 'system-ui, sans-serif', fontStyle: '700', fontSize: '10px', color: '#aebbd3', align: 'center', wordWrap: { width: 152 }
    }).setOrigin(0.5);
    const status = this.scene.add.text(0, 43, unlocked ? riftCopy('unlocked') : prerequisiteMet ? `${node.cost} ★` : riftCopy('locked'), {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '12px', color: unlocked ? '#8ff2bd' : available ? '#ffe88a' : '#6f7b99'
    }).setOrigin(0.5);
    const container = this.scene.add.container(x, y, [bg, title, desc, status]);
    if (!unlocked && prerequisiteMet) {
      container.setSize(176, 128).setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => {
        const current = getCurrentAscensionState();
        const next = purchaseAscensionNode(current, node.id);
        if (next === current) return;
        syncCurrentAscensionState(next);
        this.onStateChanged();
        this.render();
      });
    }
    return container;
  }

  private createButton(x: number, y: number, width: number, height: number, label: string, color: number, onPress: () => void): Phaser.GameObjects.Container {
    const bg = this.scene.add.graphics();
    bg.fillStyle(color, 0.96); bg.fillRoundedRect(-width / 2, -height / 2, width, height, height / 2);
    bg.lineStyle(3, 0xffffff, 0.38); bg.strokeRoundedRect(-width / 2, -height / 2, width, height, height / 2);
    const text = this.scene.add.text(0, 0, label, { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '14px', color: '#221c35' }).setOrigin(0.5);
    const button = this.scene.add.container(x, y, [bg, text]);
    button.setSize(width, height).setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => {
      this.scene.tweens.add({ targets: button, scaleX: 0.94, scaleY: 0.94, duration: 70, yoyo: true, ease: 'Quad.Out' });
      onPress();
    });
    return button;
  }
}
