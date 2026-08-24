import * as Phaser from 'phaser';
import { GameAudio } from '../audio/GameAudio';
import { getCreature, type CreatureFamily } from '../content/creatures';
import { GameFx } from '../presentation/GameFx';
import type { PlatformAdapter } from '../platform/PlatformAdapter';
import { createGameSave, type GameSave } from '../state/save';
import {
  BOSS_STEP,
  getEncounterSpec,
  nextEncounter,
  type EncounterSpec,
  type EncounterStep
} from '../systems/encounters';
import {
  addUnit,
  createStarterBoard,
  firstEmptySlot,
  moveOrMerge,
  type BoardState,
  type BoardUnit
} from '../systems/board';
import {
  bossCoreReward,
  coinRewardMultiplier,
  createDefaultMetaUpgradeLevels,
  incomingDamageMultiplier,
  purchaseMetaUpgrade,
  squadDamageMultiplier,
  type MetaUpgradeId,
  type MetaUpgradeLevels
} from '../systems/metaProgression';
import { calculateOfflineReward, type OfflineReward } from '../systems/offlineProgression';
import { GameHud } from '../ui/GameHud';
import { MetaUpgradePanel } from '../ui/MetaUpgradePanel';
import { OfflineRewardPanel } from '../ui/OfflineRewardPanel';
import { BoardView } from '../views/BoardView';
import { BossView } from '../views/BossView';
import { EnemyView } from '../views/EnemyView';

const RECRUIT_COST = 20;

export class GameScene extends Phaser.Scene {
  private board: BoardState = createStarterBoard();
  private readonly attackClocks = new Map<string, number>();
  private audio!: GameAudio;
  private fx!: GameFx;
  private platform!: PlatformAdapter;
  private hud!: GameHud;
  private metaPanel!: MetaUpgradePanel;
  private offlinePanel!: OfflineRewardPanel;
  private boardView!: BoardView;
  private bossView!: BossView;
  private enemyView!: EnemyView;
  private coins = 120;
  private coreShards = 0;
  private upgrades: MetaUpgradeLevels = createDefaultMetaUpgradeLevels();
  private baseHp = 100;
  private chapter = 1;
  private encounterStep: EncounterStep = 0;
  private encounter: EncounterSpec = getEncounterSpec(1, 0);
  private targetHpMax = this.encounter.hp;
  private targetHp = this.encounter.hp;
  private targetAttackClock = 0;
  private targetAlive = true;
  private resolvingBoard = false;
  private recruitSerial = 0;
  private savePending = false;
  private lastForegroundAt = Date.now();

  private readonly visibilityHandler = (): void => {
    if (document.visibilityState === 'hidden') {
      this.lastForegroundAt = Date.now();
      this.persistNow();
      return;
    }
    const now = Date.now();
    const reward = calculateOfflineReward(this.lastForegroundAt, now, this.chapter, this.upgrades);
    this.lastForegroundAt = now;
    this.applyOfflineReward(reward);
  };

  public constructor() {
    super('game');
  }

  public create(): void {
    this.platform = this.registry.get('platform') as PlatformAdapter;
    const initialSave = this.registry.get('initialSave') as GameSave | null;
    let initialOfflineReward: OfflineReward | null = null;
    if (initialSave) {
      this.restoreSave(initialSave);
      initialOfflineReward = calculateOfflineReward(initialSave.updatedAt, Date.now(), this.chapter, this.upgrades);
    }

    this.cameras.main.setBackgroundColor('#11172d');
    this.add.image(540, 960, 'bg-candy-crater').setDisplaySize(1080, 1920);

    this.audio = new GameAudio(this);
    this.fx = new GameFx(this);
    this.hud = new GameHud(this, () => this.recruitUnit(), () => this.toggleMetaPanel());
    this.metaPanel = new MetaUpgradePanel(this, (id) => this.buyMetaUpgrade(id));
    this.offlinePanel = new OfflineRewardPanel(this, () => this.audio.reward());
    this.boardView = new BoardView(
      this,
      this.fx,
      (view, from, to) => this.handleDrop(view, from, to),
      () => this.resolvingBoard || this.metaPanel.isOpen() || this.offlinePanel.isOpen()
    );
    this.bossView = new BossView(this, this.fx);
    this.enemyView = new EnemyView(this, this.fx);

    this.hud.create();
    this.metaPanel.create();
    this.offlinePanel.create();
    this.bossView.create();
    this.enemyView.create();
    this.boardView.createFrame();
    this.boardView.render(this.board);
    this.presentEncounter(true);
    this.metaPanel.update(this.coreShards, this.upgrades);
    this.lastForegroundAt = Date.now();
    document.addEventListener('visibilitychange', this.visibilityHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    });

    if (initialOfflineReward && initialOfflineReward.coins > 0) {
      this.applyOfflineReward(initialOfflineReward);
    } else {
      this.time.delayedCall(550, () => this.fx.showHint('DRAG TWINS TO MERGE', 1355));
    }
  }

  public override update(_time: number, delta: number): void {
    if (!this.targetAlive || this.resolvingBoard || this.offlinePanel.isOpen()) return;
    this.updateUnitAttacks(delta);
    this.updateTargetAttack(delta);
  }

  private updateUnitAttacks(delta: number): void {
    for (let slot = 0; slot < this.board.length; slot += 1) {
      const unit = this.board[slot];
      if (!unit) continue;
      const creature = getCreature(unit.family, unit.level);
      const elapsed = (this.attackClocks.get(unit.id) ?? 0) + delta;
      if (elapsed >= creature.attackMs) {
        this.attackClocks.set(unit.id, elapsed - creature.attackMs);
        this.fireUnitAttack(slot, unit);
      } else {
        this.attackClocks.set(unit.id, elapsed);
      }
    }
  }

  private updateTargetAttack(delta: number): void {
    this.targetAttackClock += delta;
    if (this.targetAttackClock < this.encounter.attackMs) return;
    this.targetAttackClock = 0;
    const isBoss = this.encounterStep === BOSS_STEP;
    if (isBoss) this.audio.bossTelegraph();
    this.telegraphTarget(() => {
      if (!this.targetAlive) return;
      const damage = Math.max(1, Math.round(this.encounter.damage * incomingDamageMultiplier(this.upgrades)));
      this.baseHp = Math.max(0, this.baseHp - damage);
      this.syncUi();
      if (this.baseHp > 0) this.persistSoon();
      this.cameras.main.shake(isBoss ? 145 : 95, isBoss ? 0.0042 : 0.0028);
      this.fx.flashScreen(this.encounter.projectileColor, isBoss ? 0.16 : 0.1, isBoss ? 180 : 130);
      this.fx.burst(540, 1050, this.encounter.projectileColor, isBoss ? 12 : 8, isBoss ? 220 : 150);
      if (this.baseHp <= 0) this.loseEncounter();
    });
  }

  private handleDrop(view: Phaser.GameObjects.Container, from: number, to: number): void {
    if (this.resolvingBoard || this.metaPanel.isOpen() || this.offlinePanel.isOpen()) {
      this.boardView.snapHome(view, from);
      return;
    }
    const result = moveOrMerge(this.board, from, to);
    if (result.action === 'noop') {
      this.boardView.snapHome(view, from);
      return;
    }
    if (result.action === 'merge') {
      this.resolvingBoard = true;
      this.boardView.animateMerge(
        view,
        to,
        () => {
          this.board = result.board;
          this.boardView.render(this.board, to);
          return this.boardView.getView(to);
        },
        () => {
          this.resolvingBoard = false;
          this.audio.merge(result.upgraded?.level ?? 1);
          this.persistSoon();
        }
      );
      return;
    }
    this.board = result.board;
    this.boardView.render(this.board, to);
    this.persistSoon();
  }

  private recruitUnit(): void {
    if (this.resolvingBoard || !this.targetAlive || this.metaPanel.isOpen() || this.offlinePanel.isOpen()) return;
    const empty = firstEmptySlot(this.board);
    if (empty < 0) {
      this.fx.showHint('BOARD FULL — MERGE!', 1732, '#ffdda0');
      return;
    }
    if (this.coins < RECRUIT_COST) {
      this.fx.showHint('NEED MORE COINS', 1732, '#ff9fa8');
      return;
    }

    this.audio.button();
    this.coins -= RECRUIT_COST;
    const family = Phaser.Math.RND.pick<CreatureFamily>(['pinguino', 'toastodilo']);
    this.recruitSerial += 1;
    this.board = addUnit(this.board, {
      id: `recruit-${this.recruitSerial}-${family}`,
      family,
      level: 1
    });
    this.syncUi();
    this.boardView.render(this.board, empty);
    const position = this.boardView.slotPosition(empty);
    this.fx.burst(position.x, position.y, getCreature(family, 1).accentColor, 11, 150);
    this.persistSoon();
  }

  private fireUnitAttack(slot: number, unit: BoardUnit): void {
    if (!this.targetAlive) return;
    const origin = this.boardView.attackKick(slot);
    if (!origin) return;
    const creature = getCreature(unit.family, unit.level);
    const target = this.targetPoint();
    const damage = Math.max(1, Math.round(creature.damage * squadDamageMultiplier(this.upgrades)));
    this.audio.shot();
    const projectile = this.add.circle(origin.x, origin.y - 72, 13 + unit.level * 3, creature.projectileColor, 1)
      .setStrokeStyle(5, 0xffffff, 0.65)
      .setDepth(800);
    const trail = this.add.circle(origin.x, origin.y - 72, 28 + unit.level * 4, creature.projectileColor, 0.16).setDepth(799);
    this.tweens.add({
      targets: [projectile, trail], x: target.x, y: target.y, scaleX: 0.6, scaleY: 0.6, duration: 245, ease: 'Cubic.In',
      onComplete: () => {
        projectile.destroy();
        trail.destroy();
        this.damageTarget(damage, creature.projectileColor);
      }
    });
  }

  private damageTarget(amount: number, color: number): void {
    if (!this.targetAlive) return;
    this.targetHp = Math.max(0, this.targetHp - amount);
    this.setTargetHealth();
    const point = this.targetPoint();
    this.audio.hit();
    this.fx.floatingDamage(point.x, point.y - 80, amount, color);
    this.hitTarget(color);
    if (this.targetHp <= 0) this.defeatTarget();
    else this.persistSoon();
  }

  private defeatTarget(): void {
    if (!this.targetAlive) return;
    this.targetAlive = false;
    this.resolvingBoard = true;
    this.targetAttackClock = 0;
    const isBoss = this.encounterStep === BOSS_STEP;
    const coinReward = Math.max(1, Math.round(this.encounter.reward * coinRewardMultiplier(this.upgrades)));
    this.coins += coinReward;
    let coreReward = 0;
    if (isBoss) {
      coreReward = bossCoreReward(this.chapter);
      this.coreShards += coreReward;
    }
    this.syncUi();
    this.metaPanel.update(this.coreShards, this.upgrades);

    const point = this.targetPoint();
    if (isBoss) this.audio.bossDefeat();
    else this.audio.enemyDefeat();
    this.time.delayedCall(isBoss ? 250 : 120, () => this.audio.reward());
    if (coreReward > 0) {
      this.time.delayedCall(420, () => this.fx.showHint(`CORE SHARD +${coreReward}`, 1010, '#bffaff'));
    }
    this.cameras.main.shake(isBoss ? 260 : 150, isBoss ? 0.008 : 0.0048);
    this.fx.flashScreen(this.encounter.accentColor, isBoss ? 0.2 : 0.12, isBoss ? 260 : 180);
    this.fx.burst(point.x, point.y, this.encounter.accentColor, isBoss ? 30 : 16, isBoss ? 310 : 190);
    this.fx.burst(point.x, point.y, 0xffdd6b, isBoss ? 24 : 10, isBoss ? 370 : 220);

    if (isBoss) this.bossView.defeat(coinReward, () => this.advanceEncounter(true));
    else this.enemyView.defeat(coinReward, () => this.advanceEncounter(false));
  }

  private advanceEncounter(wasBoss: boolean): void {
    const next = nextEncounter(this.chapter, this.encounterStep);
    this.chapter = next.chapter;
    this.encounterStep = next.step;
    this.encounter = getEncounterSpec(this.chapter, this.encounterStep);
    this.targetHpMax = this.encounter.hp;
    this.targetHp = this.targetHpMax;
    this.baseHp = Math.min(100, this.baseHp + (wasBoss ? 20 : 4));
    this.targetAlive = true;
    this.resolvingBoard = false;
    this.targetAttackClock = 0;
    this.attackClocks.clear();
    this.presentEncounter(false);
    const label = this.encounter.kind === 'boss'
      ? `BOSS ${this.chapter} INCOMING`
      : `WAVE ${this.encounterStep + 1}: ${this.encounter.name.toUpperCase()}`;
    this.fx.showHint(label, 1015, this.encounter.kind === 'boss' ? '#fff0a6' : '#c7f7ff');
    this.persistNow();
  }

  private loseEncounter(): void {
    if (!this.targetAlive) return;
    this.targetAlive = false;
    this.resolvingBoard = true;
    const banner = this.add.text(540, 920, 'FORTRESS CRACKED!', {
      fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '62px', color: '#dff9ff', stroke: '#30446f', strokeThickness: 12
    }).setOrigin(0.5).setDepth(1400).setScale(0.5);
    this.tweens.add({ targets: banner, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.Out' });
    this.fx.flashScreen(0x74dfff, 0.22, 420);
    this.time.delayedCall(1250, () => {
      banner.destroy();
      this.baseHp = 100;
      this.targetHp = this.targetHpMax;
      this.targetAlive = true;
      this.resolvingBoard = false;
      this.targetAttackClock = 0;
      this.attackClocks.clear();
      this.presentEncounter(true);
      this.persistNow();
    });
  }

  private toggleMetaPanel(): void {
    if (this.offlinePanel.isOpen()) return;
    this.audio.button();
    if (this.metaPanel.isOpen()) this.metaPanel.hide();
    else this.metaPanel.show(this.coreShards, this.upgrades);
  }

  private buyMetaUpgrade(id: MetaUpgradeId): void {
    const result = purchaseMetaUpgrade(this.coreShards, this.upgrades, id);
    if (!result.purchased) {
      this.audio.button();
      this.fx.showHint('NEED MORE CORE SHARDS', 1020, '#ffb2d7');
      return;
    }
    this.coreShards = result.shards;
    this.upgrades = result.levels;
    this.audio.reward();
    this.metaPanel.update(this.coreShards, this.upgrades);
    this.syncUi();
    this.persistNow();
  }

  private applyOfflineReward(reward: OfflineReward): void {
    if (reward.coins <= 0) return;
    this.coins += reward.coins;
    this.syncUi();
    this.persistNow();
    if (this.metaPanel.isOpen()) this.metaPanel.hide();
    this.offlinePanel.show(reward);
  }

  private presentEncounter(initial: boolean): void {
    if (this.encounter.kind === 'boss') {
      this.enemyView.hide();
      this.bossView.show();
    } else {
      this.bossView.hide();
      this.enemyView.show(this.encounter, this.encounterStep + 1);
    }
    this.syncUi();
    if (!initial) this.cameras.main.flash(120, 215, 245, 255, false);
  }

  private targetPoint(): Phaser.Math.Vector2 {
    return this.encounter.kind === 'boss' ? this.bossView.targetPoint() : this.enemyView.targetPoint();
  }

  private hitTarget(color: number): void {
    if (this.encounter.kind === 'boss') this.bossView.hit(color);
    else this.enemyView.hit(color);
  }

  private telegraphTarget(onImpact: () => void): void {
    if (this.encounter.kind === 'boss') this.bossView.telegraph(onImpact);
    else this.enemyView.telegraph(onImpact);
  }

  private setTargetHealth(): void {
    if (this.encounter.kind === 'boss') this.bossView.setHealth(this.targetHp, this.targetHpMax);
    else this.enemyView.setHealth(this.targetHp, this.targetHpMax);
  }

  private restoreSave(save: GameSave): void {
    this.board = save.board;
    this.coins = save.coins;
    this.coreShards = save.coreShards;
    this.upgrades = save.upgrades;
    this.baseHp = save.baseHp;
    this.chapter = save.chapter;
    this.encounterStep = save.encounterStep;
    this.encounter = getEncounterSpec(this.chapter, this.encounterStep);
    this.targetHpMax = save.targetHpMax;
    this.targetHp = Math.min(save.targetHp, save.targetHpMax);
    this.recruitSerial = save.recruitSerial;
  }

  private persistSoon(): void {
    if (this.savePending) return;
    this.savePending = true;
    this.time.delayedCall(650, () => {
      this.savePending = false;
      this.persistNow();
    });
  }

  private persistNow(): void {
    const save = createGameSave({
      coins: this.coins,
      coreShards: this.coreShards,
      upgrades: this.upgrades,
      baseHp: this.baseHp,
      chapter: this.chapter,
      encounterStep: this.encounterStep,
      targetHpMax: this.targetHpMax,
      targetHp: this.targetHp,
      recruitSerial: this.recruitSerial,
      board: this.board
    });
    void this.platform.save(save).catch(() => undefined);
  }

  private syncUi(): void {
    this.hud.update(this.coins, this.coreShards, this.baseHp, this.chapter, this.encounterStep);
    this.setTargetHealth();
  }
}
