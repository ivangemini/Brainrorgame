import * as Phaser from 'phaser';
import { createGameConfig } from './game/config';
import { createPlatformAdapter } from './platform/createPlatformAdapter';
import type { PlatformAdapter } from './platform/PlatformAdapter';
import { WebAdapter } from './platform/WebAdapter';
import { installPlaytestRecorder } from './qa/PlaytestRecorder';
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

const playtest = installPlaytestRecorder();
const platform = await initializePlatform();
const initialSave = await loadGameSave(platform);
let game: Phaser.Game | null = null;
let gameSceneCreated = false;
let platformPaused = false;

const applyPause = (): void => {
  if (!game || !gameSceneCreated) return;
  platform.gameplayStop();
  game.sound.pauseAll();
  game.scene.pause('game');
};

const applyResume = (): void => {
  if (!game || !gameSceneCreated) return;
  game.scene.resume('game');
  game.sound.resumeAll();
  platform.gameplayStart();
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
      else platform.gameplayStart();
    });
  }
}));

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    playtest?.destroy();
    platform.gameplayStop();
    game?.destroy(true);
  });
}
