import * as Phaser from 'phaser';
import { getAllCreatures } from '../content/creatures';
import { getAllEnemies } from '../content/enemies';

export class BootScene extends Phaser.Scene {
  public constructor() {
    super('boot');
  }

  public preload(): void {
    this.cameras.main.setBackgroundColor('#11172d');
    const title = this.add.text(540, 830, 'BRAINROR MERGE', {
      fontFamily: 'Arial Black, system-ui, sans-serif',
      fontSize: '60px',
      color: '#eafaff',
      stroke: '#3d2b6d',
      strokeThickness: 12
    }).setOrigin(0.5);
    const track = this.add.graphics();
    const fill = this.add.graphics();
    track.fillStyle(0x253157, 1);
    track.fillRoundedRect(190, 960, 700, 42, 21);
    this.load.on('progress', (progress: number) => {
      fill.clear();
      fill.fillStyle(0x72eaff, 1);
      fill.fillRoundedRect(198, 968, 684 * progress, 26, 13);
      title.setScale(1 + progress * 0.025);
    });

    this.load.svg('bg-candy-crater', 'assets/backgrounds/candy-crater.svg', { width: 1080, height: 1920 });
    for (const creature of getAllCreatures()) {
      this.load.svg(creature.texture, creature.assetPath, { width: 512, height: 512 });
    }
    for (const enemy of getAllEnemies()) {
      this.load.svg(enemy.texture, enemy.assetPath, { width: 512, height: 512 });
    }
    this.load.svg('boss-fridgino', 'assets/bosses/fridgino-maximo.svg', { width: 720, height: 720 });
    this.load.svg('ui-core-shard', 'assets/ui/core-shard.svg', { width: 128, height: 128 });
    this.load.svg('upgrade-power-core', 'assets/ui/power-core.svg', { width: 160, height: 160 });
    this.load.svg('upgrade-fortress-plate', 'assets/ui/fortress-plate.svg', { width: 160, height: 160 });
    this.load.svg('upgrade-bounty-coil', 'assets/ui/bounty-coil.svg', { width: 160, height: 160 });
    this.load.svg('ui-offline-cache', 'assets/ui/offline-cache.svg', { width: 260, height: 260 });
    this.load.svg('ui-daily-orbit', 'assets/ui/daily-orbit.svg', { width: 96, height: 96 });
    this.load.svg('ui-chaos-codex', 'assets/ui/chaos-codex.svg', { width: 96, height: 96 });
    this.load.svg('ui-revive-bolt', 'assets/ui/revive-bolt.svg', { width: 250, height: 250 });
  }

  public create(): void {
    this.scene.start('game');
  }
}
