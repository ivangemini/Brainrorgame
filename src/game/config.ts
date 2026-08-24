import * as Phaser from 'phaser';
import type { PlatformAdapter } from '../platform/PlatformAdapter';
import { BootScene } from '../scenes/BootScene';
import { GameScene } from '../scenes/GameScene';
import type { GameSave } from '../state/save';

const DESIGN_WIDTH = 1080;
const DESIGN_HEIGHT = 1920;

export interface GameBootstrapData {
  readonly platform: PlatformAdapter;
  readonly initialSave: GameSave | null;
}

export function createGameConfig(parent: string, bootstrap: GameBootstrapData): Phaser.Types.Core.GameConfig {
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
    callbacks: {
      preBoot: (game) => {
        game.registry.set('platform', bootstrap.platform);
        game.registry.set('initialSave', bootstrap.initialSave);
      }
    },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: DESIGN_WIDTH, height: DESIGN_HEIGHT },
    scene: [BootScene, GameScene]
  };
}
