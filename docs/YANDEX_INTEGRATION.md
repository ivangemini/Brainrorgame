# Yandex Games integration

This document describes the production contract for the Yandex Games build. SDK-specific behavior belongs in `src/platform/YandexAdapter.ts`; gameplay must not call `YaGames` or `ysdk` directly.

## Bootstrap

`index.html` loads the Yandex Games loader from `/sdk.js` before the Vite module. `createPlatformAdapter()` selects `YandexAdapter` only when `globalThis.YaGames` exists; local or other-portal builds fall back to `WebAdapter`.

If Yandex initialization itself fails, the app falls back to the web adapter instead of leaving a blank screen. A normal Yandex submission must still initialize successfully in the platform environment.

## Loading API

`LoadingAPI.ready()` is called only after the Phaser `game` scene has emitted its CREATE event. At that point the initial save is loaded, required first-play assets are loaded, UI exists and the game can accept player input.

Do not move this call to module import, SDK initialization, or the beginning of the boot scene.

## Pause / resume

The adapter listens to:

- `game_api_pause`
- `game_api_resume`

It also treats an open ad as a pause source. These sources are combined so overlapping platform/ad pauses cannot cause an early double-resume.

The bootstrap lifecycle handler pauses/resumes the Phaser game scene and sound manager. If a platform pause arrives before the game scene is created, the adapter retains that state and replays it when lifecycle handlers attach.

## Gameplay API

The adapter implements idempotent `gameplayStart()` / `gameplayStop()` calls, but gameplay code should only use them when the game can accurately describe every playable/non-playable transition. Do not call them speculatively just to satisfy a checklist.

## Player data / cloud save

Save key: `brainrorSave`.

Policy:

1. Local storage is written immediately.
2. Cloud writes are throttled to at least 3.5 seconds apart.
3. The newest save is selected by numeric `updatedAt` when both local and cloud data exist.
4. A newer cloud save is cached locally.
5. A newer local save is queued for cloud synchronization.
6. On platform pause, a pending save is flushed best-effort with `flush=true`.
7. Cloud/player failures never invalidate a valid local save.

Keep the serialized save well below Yandex player-data limits. Any future large collections/content history should remain compact and versioned.

## Ads

### Interstitial

`showInterstitial()` resolves after close/error. The adapter pauses gameplay while an actually opened ad is displayed.

Interstitial placement is a separate economy/design decision. Do not trigger it during active combat, drag/merge interactions, reward reveals or onboarding input.

### Rewarded

`showRewarded()` returns `{ rewarded: true }` only if the SDK invoked `onRewarded`. Closing the video without that callback returns false. Errors return false.

Never grant a reward based only on `onClose`.

Recommended future placements:

- optional second copy of offline coins after base offline earnings are already granted;
- voluntary fortress revive;
- optional boss-loot multiplier.

Each placement needs one-time-claim protection and analytics before release.

## Analytics

YandexAdapter currently preserves the vendor-independent analytics contract and emits the same local `brainror:analytics` CustomEvent used by WebAdapter. A future analytics backend can be attached without changing gameplay event names.

No PII should be added to the event schema.

## Pre-submission checks

- `/sdk.js` loads in the Yandex environment.
- SDK initialization succeeds.
- Loading indicator disappears only after the game is interactive.
- Background/ad pause stops both combat and audio.
- Resume restores gameplay once, without speed-up or duplicated timers.
- Guest/player-data failure still leaves local saving functional.
- Cloud/local conflict selects the newest valid save.
- Rewarded skip/error does not grant currency.
- Fullscreen ads are only requested at logical pauses.
- Test the final uploaded build with Yandex SDK debug tooling and moderation requirements, not only localhost.
