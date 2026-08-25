# Poki Release Checklist

## Integration state

- HTML5 Poki SDK is loaded dynamically only when Poki is selected.
- `PokiSDK.init()` is attempted before save loading and game boot; an SDK init rejection is fail-soft as required by Poki guidance.
- `gameLoadingFinished()` maps to the game boot completion callback.
- `gameplayStart()` / `gameplayStop()` use the shared PlatformAdapter lifecycle.
- `commercialBreak()` maps to interstitial opportunities.
- `rewardedBreak({ size: 'medium' })` maps to rewarded revive/offline-double flows.
- Gameplay/audio is paused only if Poki actually invokes the ad start callback.
- A rewarded result is granted only when `rewardedBreak()` resolves `true`.
- Saves remain in `localStorage`; Poki cloud gamesaves monitor and sync browser storage for logged-in users.
- Storage access is fully try/catch guarded for incognito/private-mode restrictions.

## Poki for Developers / Inspector

Before review:

1. Upload the production build to Poki for Developers / Inspector.
2. Verify `gameLoadingFinished()` fires once after the playable scene is ready.
3. Verify gameplay start/stop events around active play, pause, defeat and resume.
4. Verify commercial break opportunities only happen at existing natural chapter breaks.
5. Verify rewarded revive and offline-double: no reward when `rewardedBreak()` returns `false`.
6. Verify audio and input are disabled while an actual ad is displayed and restored afterwards.
7. Refresh during a chapter and confirm progress survives through the existing localStorage save.
8. Test a logged-in account across sessions/devices and confirm Poki cloud gamesaves restore that storage.
9. Test incognito/private mode: blocked storage must not prevent boot or core gameplay.
10. Test mobile/tablet and desktop layouts in the Inspector, including page-scroll/keyboard behavior around the embedded game.

## Local QA

Use `?platform=poki` on localhost to force the Poki adapter and dynamically load the official SDK.

Plain localhost without a portal query continues to use `WebAdapter`.

## Save rule

Do not introduce a second Poki cloud-save API for the current game save. Poki's current HTML5 cloud gamesaves automatically watch `localStorage` and `IndexedDB`; the existing single JSON save stays below the platform's documented gamesave limit and remains portal-neutral.
