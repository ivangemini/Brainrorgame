import * as Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { GameScene } from '../scenes/GameScene';

const DESIGN_WIDTH = 1080;
const DESIGN_HEIGHT = 1920;

export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    backgroundColor: '#11172d',
    transparent: false,
    antialias: true,
    roundPixels: false,
    render: { antialias: true, pixelArt: false },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: DESIGN_WIDTH, height: DESIGN_HEIGHT },
    scene: [BootScene, GameScene]
  };
}
