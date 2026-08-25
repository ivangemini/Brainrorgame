# GameDistribution Release Checklist

## Build configuration

- Create the game in the GameDistribution developer dashboard and copy its Game ID.
- Set `VITE_GAMEDISTRIBUTION_GAME_ID=<game-id>` for the production build.
- Local/portal QA can use `?platform=gamedistribution&gd_game_id=<game-id>`.
- Do not treat the Game ID as a secret; it identifies the game to the SDK.

## SDK and lifecycle

- The adapter defines `GD_OPTIONS` before loading `https://html5.api.gamedistribution.com/main.min.js`.
- Confirm `SDK_READY` is received before ad opportunities are exercised.
- Confirm `SDK_GAME_PAUSE` pauses Phaser and audio.
- Confirm `SDK_GAME_START` resumes Phaser and audio after the ad.
- Confirm SDK/ad errors fail soft and never strand the scene in a paused state.

## Ads

- Interstitials use `gdsdk.showAd()` only at the existing protected chapter-break opportunity.
- Rewarded placements use `gdsdk.showAd('rewarded')` and preload rewarded inventory where supported.
- Grant reward only after `SDK_REWARDED_WATCH_COMPLETE`; never grant on Promise resolution or ad close alone.
- Keep the existing first-session/frequency protection for forced interstitials.
- Verify both no-fill and ad-blocked behavior leaves free progression available.

## Persistence

- GameDistribution's HTML5 advertising SDK does not provide the project a general cloud-save API.
- Keep `brainrot-merge-boss:save` in guarded localStorage for this adapter.
- Test malformed/unavailable storage and verify the game still boots.

## Portal QA

- Test the submitted GameDistribution build, not only localhost.
- Verify the official embed path includes `gd_sdk_referrer_url` when required by the publisher page.
- Test desktop and mobile portrait layouts.
- Verify first session, reload, rewarded revive, rewarded offline double and chapter-break interstitials.
- Verify gameplay/audio pause and resume around every shown ad.
- Verify rewarded cancellation/no-fill never grants value.

## Submission

- Run `npm run verify` on the exact submitted commit.
- Check current GameDistribution quality and advertising guidelines before upload.
- Supply original promo materials with no third-party IP or meme-character copying.
