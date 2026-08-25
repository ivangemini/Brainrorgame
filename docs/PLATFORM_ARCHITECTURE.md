# Platform Architecture

Gameplay code must not know which portal hosts the game.

`PlatformAdapter` owns:

- SDK initialization;
- gameplay start/stop signals;
- interstitial/rewarded ads;
- cloud/local saves;
- leaderboard hooks;
- payments/IAP where supported;
- platform lifecycle/focus/pause rules.

Adapters:

1. Web/local development — implemented
2. Yandex Games — implemented
3. CrazyGames — implemented
4. Poki — planned
5. Playgama — planned
6. GameDistribution — planned

## Selection

`createPlatformAdapter()` keeps portal detection outside gameplay code.

- Yandex wins when `YaGames` is injected by the host.
- CrazyGames is selected on `crazygames.com` subdomains.
- `?platform=crazygames` provides an explicit localhost/preview QA route.
- Otherwise the game falls back to the Web adapter.

## CrazyGames

The CrazyGames adapter uses the HTML5 SDK v3 and loads it only when CrazyGames is selected, so Web/Yandex builds do not eagerly execute another portal SDK.

- `SDK.init()` is awaited before save loading or Phaser boot.
- `game.loadingStart()` / `loadingStop()` wrap the game boot window.
- `gameplayStart()` / `gameplayStop()` use the existing platform lifecycle boundary.
- `ad.requestAd('midgame' | 'rewarded')` pauses gameplay on `adStarted` and resumes on completion/error.
- A rewarded result is granted only after `adFinished`, never on `adError`.
- Save data uses the CrazyGames Data Module as the canonical store. The SDK handles guest LocalStorage and signed-in cross-device synchronization.
- Adapter data/ad failures fail soft so a portal outage never blocks the core game loop.

The initial architecture proved Yandex first; CrazyGames now validates that the same gameplay/economy code can run behind a second real portal adapter without portal-specific branches in `GameScene`.
