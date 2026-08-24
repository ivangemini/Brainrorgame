import * as Phaser from 'phaser';
import { getCreature, type CreatureFamily } from '../content/creatures';
import { GameFx } from '../presentation/GameFx';
import { addUnit, createStarterBoard, firstEmptySlot, moveOrMerge, type BoardState, type BoardUnit } from '../systems/board';
import { GameHud } from '../ui/GameHud';
import { BoardView } from '../views/BoardView';
import { BossView } from '../views/BossView';

const RECRUIT_COST = 20;

export class GameScene extends Phaser.Scene {
  private board: BoardState = createStarterBoard();
  private readonly attackClocks = new Map<string, number>();
  private fx!: GameFx; private hud!: GameHud; private boardView!: BoardView; private bossView!: BossView;
  private coins = 120; private baseHp = 100; private bossRound = 1; private bossHpMax = 520; private bossHp = 520; private bossAttackClock = 0; private bossAlive = true; private resolvingBoard = false; private recruitSerial = 0;

  public constructor() { super('game'); }

  public create(): void {
    this.cameras.main.setBackgroundColor('#11172d'); this.add.image(540, 960, 'bg-candy-crater').setDisplaySize(1080, 1920);
    this.fx = new GameFx(this); this.hud = new GameHud(this, () => this.recruitUnit());
    this.boardView = new BoardView(this, this.fx, (view, from, to) => this.handleDrop(view, from, to), () => this.resolvingBoard);
    this.bossView = new BossView(this, this.fx);
    this.hud.create(); this.bossView.create(); this.boardView.createFrame(); this.boardView.render(this.board); this.syncUi();
    this.time.delayedCall(550, () => this.fx.showHint('DRAG TWINS TO MERGE', 1355));
  }

  public update(_time: number, delta: number): void { if (!this.bossAlive || this.resolvingBoard) return; this.updateUnitAttacks(delta); this.updateBossAttack(delta); }

  private updateUnitAttacks(delta: number): void {
    for (let slot = 0; slot < this.board.length; slot += 1) { const unit = this.board[slot]; if (!unit) continue; const creature = getCreature(unit.family, unit.level); const elapsed = (this.attackClocks.get(unit.id) ?? 0) + delta; if (elapsed >= creature.attackMs) { this.attackClocks.set(unit.id, elapsed - creature.attackMs); this.fireUnitAttack(slot, unit); } else this.attackClocks.set(unit.id, elapsed); }
  }

  private updateBossAttack(delta: number): void {
    this.bossAttackClock += delta; const interval = Math.max(2100, 3900 - this.bossRound * 90); if (this.bossAttackClock < interval) return; this.bossAttackClock = 0;
    this.bossView.telegraph(() => { if (!this.bossAlive) return; const damage = Math.min(22, 7 + this.bossRound * 2); this.baseHp = Math.max(0, this.baseHp - damage); this.syncUi(); this.cameras.main.shake(145, 0.0042); this.fx.flashScreen(0xff4f72, 0.16, 180); this.fx.burst(540, 1050, 0xff6d85, 12, 220); if (this.baseHp <= 0) this.loseRound(); });
  }

  private handleDrop(view: Phaser.GameObjects.Container, from: number, to: number): void {
    if (this.resolvingBoard) { this.boardView.snapHome(view, from); return; }
    const result = moveOrMerge(this.board, from, to); if (result.action === 'noop') { this.boardView.snapHome(view, from); return; }
    if (result.action === 'merge') { this.resolvingBoard = true; this.boardView.animateMerge(view, to, () => { this.board = result.board; this.boardView.render(this.board, to); return this.boardView.getView(to); }, () => { this.resolvingBoard = false; }); return; }
    this.board = result.board; this.boardView.render(this.board, to);
  }

  private recruitUnit(): void {
    if (this.resolvingBoard || !this.bossAlive) return; const empty = firstEmptySlot(this.board);
    if (empty < 0) { this.fx.showHint('BOARD FULL — MERGE!', 1732, '#ffdda0'); return; }
    if (this.coins < RECRUIT_COST) { this.fx.showHint('NEED MORE COINS', 1732, '#ff9fa8'); return; }
    this.coins -= RECRUIT_COST; const family = Phaser.Math.RND.pick<CreatureFamily>(['pinguino', 'toastodilo']); this.recruitSerial += 1;
    this.board = addUnit(this.board, { id: `recruit-${this.recruitSerial}-${family}`, family, level: 1 }); this.syncUi(); this.boardView.render(this.board, empty);
    const position = this.boardView.slotPosition(empty); this.fx.burst(position.x, position.y, getCreature(family, 1).accentColor, 11, 150);
  }

  private fireUnitAttack(slot: number, unit: BoardUnit): void {
    if (!this.bossAlive) return; const origin = this.boardView.attackKick(slot); if (!origin) return; const creature = getCreature(unit.family, unit.level); const target = this.bossView.targetPoint();
    const projectile = this.add.circle(origin.x, origin.y - 72, 13 + unit.level * 3, creature.projectileColor, 1).setStrokeStyle(5, 0xffffff, 0.65).setDepth(800);
    const trail = this.add.circle(origin.x, origin.y - 72, 28 + unit.level * 4, creature.projectileColor, 0.16).setDepth(799);
    this.tweens.add({ targets: [projectile, trail], x: target.x, y: target.y, scaleX: 0.6, scaleY: 0.6, duration: 245, ease: 'Cubic.In', onComplete: () => { projectile.destroy(); trail.destroy(); this.damageBoss(creature.damage, creature.projectileColor); } });
  }

  private damageBoss(amount: number, color: number): void { if (!this.bossAlive) return; this.bossHp = Math.max(0, this.bossHp - amount); this.bossView.setHealth(this.bossHp, this.bossHpMax); this.fx.floatingDamage(540 + Phaser.Math.Between(-120, 120), 470 + Phaser.Math.Between(-45, 75), amount, color); this.bossView.hit(color); if (this.bossHp <= 0) this.defeatBoss(); }

  private defeatBoss(): void {
    if (!this.bossAlive) return; this.bossAlive = false; this.resolvingBoard = true; this.bossAttackClock = 0; const reward = 85 + this.bossRound * 25; this.coins += reward; this.syncUi(); this.cameras.main.shake(260, 0.008); this.fx.flashScreen(0x8ffcff, 0.2, 260); this.fx.burst(540, 565, 0x9cfbff, 30, 310); this.fx.burst(540, 565, 0xffdd6b, 24, 370);
    this.bossView.defeat(reward, () => { this.bossRound += 1; this.bossHpMax = Math.round(520 * Math.pow(1.22, this.bossRound - 1)); this.bossHp = this.bossHpMax; this.baseHp = Math.min(100, this.baseHp + 20); this.bossView.reset(); this.bossAlive = true; this.resolvingBoard = false; this.syncUi(); this.fx.showHint(`BOSS ${this.bossRound} INCOMING`, 1015, '#c7f7ff'); });
  }

  private loseRound(): void {
    if (!this.bossAlive) return; this.bossAlive = false; this.resolvingBoard = true;
    const banner = this.add.text(540, 920, 'FORTRESS FROZEN!', { fontFamily: 'Arial Black, system-ui, sans-serif', fontSize: '62px', color: '#dff9ff', stroke: '#30446f', strokeThickness: 12 }).setOrigin(0.5).setDepth(1400).setScale(0.5);
    this.tweens.add({ targets: banner, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.Out' }); this.fx.flashScreen(0x74dfff, 0.22, 420);
    this.time.delayedCall(1250, () => { banner.destroy(); this.baseHp = 100; this.bossHp = this.bossHpMax; this.bossAlive = true; this.resolvingBoard = false; this.bossAttackClock = 0; this.syncUi(); });
  }

  private syncUi(): void { this.hud.update(this.coins, this.baseHp, this.bossRound); this.bossView.setHealth(this.bossHp, this.bossHpMax); }
}
