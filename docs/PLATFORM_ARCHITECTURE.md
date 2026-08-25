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
5. Playgama — implemented
6. GameDistribution — implemented

## Selection

`createPlatformAdapter()` keeps portal detection outside gameplay code.

- Yandex wins when `YaGames` is injected by the host.
- Explicit `?platform=crazygames`, `?platform=poki`, `?platform=playgama` and `?platform=gamedistribution` hints are available for localhost and portal QA.
- CrazyGames is detected from `crazygames.com` hosts.
- Poki is detected from an injected `PokiSDK`, a `poki.com` host, or a Poki embedding referrer.
- Playgama is detected from a `playgama.com` host or embedding referrer. A generic global `bridge` is intentionally not used for selection because Playgama Bridge can target multiple portals.
- GameDistribution is detected from a `gamedistribution.com` host/referrer or the official `gd_sdk_referrer_url` embed parameter.
- Otherwise the game falls back to the Web adapter.

## CrazyGames

The CrazyGames adapter uses the HTML5 SDK v3 and loads it only when CrazyGames is selected.

- `SDK.init()` is awaited before save loading or Phaser boot.
- `game.loadingStart()` / `loadingStop()` wrap the game boot window.
- `gameplayStart()` / `gameplayStop()` use the existing platform lifecycle boundary.
- `ad.requestAd('midgame' | 'rewarded')` pauses gameplay on `adStarted` and resumes on completion/error.
- A rewarded result is granted only after `adFinished`, never on `adError`.
- Save data uses the CrazyGames Data Module as the canonical store.

## Poki

The Poki adapter dynamically loads the HTML5 v2 SDK only after Poki selection.

- `PokiSDK.init()` is attempted before Phaser boot and its documented init-error path is fail-soft.
- `gameLoadingFinished()` maps to `PlatformAdapter.loadingReady()`.
- `gameplayStart()` / `gameplayStop()` use the shared lifecycle boundary.
- `commercialBreak()` maps to interstitial opportunities and pauses only when Poki actually starts an ad.
- `rewardedBreak({ size: 'medium', onStart })` grants value only when the returned promise resolves `true`.
- Save data stays in the existing localStorage key so Poki cloud gamesaves can synchronize it.
- Every localStorage read/write is guarded for incognito/storage restrictions.

## Playgama

The Playgama adapter loads the stable Playgama Bridge only when Playgama is selected.

- `bridge.initialize()` completes before save loading and Phaser boot.
- `game_ready`, `gameplay_started` and `gameplay_stopped` map to the shared loading/gameplay lifecycle.
- `pause_state_changed` is merged with ad pause state before invoking Phaser pause/resume handlers.
- Interstitial flow listens to `interstitial_state_changed`; gameplay pauses on `opened` and resumes on `closed` or `failed`.
- Rewarded flow listens to `rewarded_state_changed`; reward eligibility is latched only on `rewarded`, while completion waits for `closed`/`failed`.
- `bridge.storage.get/set` stores the existing save object directly. Current Bridge storage already queues operations and provides platform/local fallback, so the adapter does not add a competing cloud arbitration layer.
- Unsupported ad formats and storage/message failures fail soft.

## GameDistribution

The GameDistribution adapter uses the official HTML5 SDK and configures `GD_OPTIONS` before loading `https://html5.api.gamedistribution.com/main.min.js`.

- A GameDistribution Game ID is injected with `VITE_GAMEDISTRIBUTION_GAME_ID` for production builds. `GD_GAME_ID` and `gd_game_id` are supported as controlled host/QA overrides.
- `SDK_GAME_PAUSE` and `SDK_GAME_START` map to the shared Phaser pause/resume boundary around ads.
- Interstitial opportunities call `gdsdk.showAd()`.
- Rewarded opportunities call `gdsdk.showAd('rewarded')` and preload the next rewarded placement when supported.
- Reward value is granted only after `SDK_REWARDED_WATCH_COMPLETE`; a resolved `showAd()` promise alone is never sufficient.
- `SDK_ERROR`, rejected ad promises and unavailable ads fail soft without blocking the game loop.
- GameDistribution does not expose a general cloud-save API through this HTML5 ad SDK, so the adapter keeps the existing guarded localStorage save key.

The architecture is now proven against all five target web portals without adding portal branches to `GameScene` or the economy systems.
