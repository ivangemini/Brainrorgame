import * as Phaser from 'phaser';
import { createGameConfig } from './game/config';
import { createPlatformAdapter } from './platform/createPlatformAdapter';
import type { PlatformAdapter } from './platform/PlatformAdapter';
import { WebAdapter } from './platform/WebAdapter';
import { loadGameSave } from './state/save';
import './style.css';

async function initializePlatform(): Promise<PlatformAdapter> {
  const selected = createPlatformAdapter();
  try {
    await selected.initialize();
    return selected;
  } catch {
    const fallback = new WebAdapter();
    await fallback.initialize();
    return fallback;
  }
}

const platform = await initializePlatform();
const initialSave = await loadGameSave(platform);
const game = new Phaser.Game(createGameConfig('game-root', { platform, initialSave }));
let gameSceneCreated = false;
let platformPaused = false;

const applyPause = (): void => {
  if (!gameSceneCreated) return;
  game.sound.pauseAll();
  game.scene.pause('game');
};

const applyResume = (): void => {
  if (!gameSceneCreated) return;
  game.scene.resume('game');
  game.sound.resumeAll();
};

platform.setLifecycleHandlers({
  pause: () => {
    platformPaused = true;
    applyPause();
  },
  resume: () => {
    platformPaused = false;
    applyResume();
  }
});

game.events.once(Phaser.Core.Events.READY, () => {
  const gameScene = game.scene.getScene('game');
  gameScene.events.once(Phaser.Scenes.Events.CREATE, () => {
    gameSceneCreated = true;
    platform.loadingReady();
    if (platformPaused) applyPause();
  });
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => game.destroy(true));
}
