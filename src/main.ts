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
let game: Phaser.Game | null = null;
let gameSceneCreated = false;
let platformPaused = false;

const applyPause = (): void => {
  if (!game || !gameSceneCreated) return;
  game.sound.pauseAll();
  game.scene.pause('game');
};

const applyResume = (): void => {
  if (!game || !gameSceneCreated) return;
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

game = new Phaser.Game(createGameConfig('game-root', {
  platform,
  initialSave,
  onPostBoot: (bootedGame) => {
    const gameScene = bootedGame.scene.getScene('game');
    gameScene.events.once(Phaser.Scenes.Events.CREATE, () => {
      gameSceneCreated = true;
      platform.loadingReady();
      if (platformPaused) applyPause();
    });
  }
}));

if (import.meta.hot) {
  import.meta.hot.dispose(() => game?.destroy(true));
}
