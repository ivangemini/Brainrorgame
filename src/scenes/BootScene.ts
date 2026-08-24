import * as Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  public constructor() {
    super('boot');
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#11131a');
    this.add
      .text(540, 960, 'Production scaffold ready', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '52px',
        fontStyle: '700',
        color: '#f4f7ff'
      })
      .setOrigin(0.5);
  }
}
