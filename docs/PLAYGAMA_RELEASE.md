# Playgama Release Checklist

## Integration state

- Stable Playgama Bridge is loaded dynamically only when Playgama is selected.
- `bridge.initialize()` completes before save loading and Phaser boot.
- `game_ready`, `gameplay_started` and `gameplay_stopped` use the shared PlatformAdapter lifecycle.
- `pause_state_changed` pauses/resumes Phaser through the same lifecycle handlers used by the other portals.
- Interstitial ads use `interstitial_state_changed`; gameplay pauses on `opened` and resumes on `closed`/`failed`.
- Rewarded ads use `rewarded_state_changed`; value is granted only if a `rewarded` state was observed before completion.
- Save data uses `bridge.storage.get/set` under `brainrot-merge-boss:save`.
- Unsupported ads and SDK/storage/message failures fail soft.

## Portal QA

Before submission:

1. Upload the production build to the Playgama dashboard/testing environment.
2. Confirm `game_ready` is sent once after the playable Phaser scene is ready.
3. Confirm `gameplay_started` / `gameplay_stopped` track active play, pause, defeat and ad transitions without duplicate calls.
4. Verify platform pause events stop both gameplay and audio and resume cleanly.
5. Verify chapter-break interstitials pause only after the Bridge reports `opened` and resume after `closed` or `failed`.
6. Verify rewarded revive and rewarded offline-double grant value only after the Bridge emits `rewarded`; failed/closed-without-reward paths grant nothing.
7. Reload during a chapter and confirm Bridge storage restores the v9 save without a rollback.
8. Verify storage offline/failure paths still allow normal gameplay.
9. Test portrait/mobile and desktop layouts inside the Playgama embed.
10. Check console output for Bridge initialization, advertisement and storage failures before submission.

## Local QA

Use `?platform=playgama` on localhost to force the Playgama adapter and dynamically load the stable Bridge script.

Plain localhost without a portal query continues to use `WebAdapter`.

## Selection rule

Do not select Playgama merely because a global `bridge` exists. Playgama Bridge supports multiple destination portals, including GameDistribution and others. The project selects this adapter only from a Playgama host/referrer or the explicit local QA query so future per-portal adapters remain unambiguous.
