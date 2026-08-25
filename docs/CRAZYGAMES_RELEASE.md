# CrazyGames Release Checklist

## Integration state

- HTML5 SDK v3 is loaded dynamically only when CrazyGames is selected.
- `SDK.init()` completes before save loading and Phaser boot.
- Loading and gameplay lifecycle calls are routed through `PlatformAdapter`.
- Midgame and rewarded video use the existing ad policy and analytics placements.
- Gameplay/audio pause is delegated to the same lifecycle handlers used by Yandex.
- Rewarded value is granted only after the SDK reports `adFinished`.
- Saves use `CrazyGames.SDK.data` as the canonical storage surface.

## Developer Portal

Before submission:

1. Create the game in the CrazyGames Developer Portal.
2. Enable the **Progress Save** option because the game uses the SDK Data Module.
3. Upload the production build and use the CrazyGames Preview environment.
4. Verify first boot, returning save, refresh during a chapter, and signed-in cross-device restore.
5. Verify a midgame ad after a chapter break: combat/audio pause on start and resume on finish/error.
6. Verify rewarded revive and rewarded offline-double: reward only on completed video; free retry/base offline reward remain available.
7. Verify gameplay start/stop around menus, ads, defeat and resume.
8. Run portrait/mobile and desktop layouts through the Preview environment.
9. Check browser console for SDK/data errors and confirm they do not block core gameplay.

## Local QA

Use `?platform=crazygames` on localhost to force the CrazyGames adapter. The adapter injects the official v3 SDK script and initializes it before the game starts.

The plain localhost build without that query remains on `WebAdapter`, which keeps normal local development independent of portal SDK availability.

## Save rule

Do not add a second CrazyGames cloud/local arbitration layer. The CrazyGames Data Module already provides a localStorage-compatible API for guests and account-backed cross-device synchronization after login. The game stores one JSON save under `brainrot-merge-boss:save` through that API.
