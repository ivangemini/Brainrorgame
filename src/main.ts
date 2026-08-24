import * as Phaser from 'phaser';
import { createGameConfig } from './game/config';
import { WebAdapter } from './platform/WebAdapter';
import { loadGameSave } from './state/save';
import './style.css';

const platform = new WebAdapter();
await platform.initialize();
const initialSave = await loadGameSave(platform);
const game = new Phaser.Game(createGameConfig('game-root', { platform, initialSave }));

if (import.meta.hot) {
  import.meta.hot.dispose(() => game.destroy(true));
}
