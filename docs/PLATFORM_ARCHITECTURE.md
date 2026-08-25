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
4. Poki — implemented
5. Playgama — planned
6. GameDistribution — planned

## Selection

`createPlatformAdapter()` keeps portal detection outside gameplay code.

- Yandex wins when `YaGames` is injected by the host.
- Explicit `?platform=crazygames` / `?platform=poki` hints are available for localhost and portal QA.
- CrazyGames is detected from `crazygames.com` hosts.
- Poki is detected from an injected `PokiSDK`, a `poki.com` host, or a Poki embedding referrer.
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

## Poki

The Poki adapter dynamically loads the HTML5 v2 SDK only after Poki selection.

- `PokiSDK.init()` is attempted before Phaser boot. Poki's documented init-error path is fail-soft: if the script exists but init rejects, the game still starts with the Poki adapter.
- `gameLoadingFinished()` maps to `PlatformAdapter.loadingReady()`.
- `gameplayStart()` / `gameplayStop()` use the same scene lifecycle boundary as Yandex and CrazyGames.
- `commercialBreak()` maps to interstitial opportunities and only pauses gameplay when Poki invokes the ad-start callback.
- `rewardedBreak({ size: 'medium', onStart })` grants value only when the returned promise resolves `true`.
- Save data stays in the existing `brainrot-merge-boss:save` localStorage key. Poki cloud gamesaves automatically monitor and synchronize localStorage for logged-in users.
- Every localStorage read/write is wrapped so incognito/storage restrictions cannot prevent the game from booting or playing.

The architecture is now proven against three materially different real portal contracts without adding portal branches to `GameScene` or the economy systems.
