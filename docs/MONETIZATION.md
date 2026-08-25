# Monetization policy

Monetization must increase optional value around the core loop, not manufacture frustration. The game should remain fully playable without watching ads.

## Rewarded placements

### Offline Double

Base offline coins are granted immediately before the Welcome Back panel opens and are persisted immediately. The rewarded button offers an additional amount equal to the already granted base reward.

Rules:

- The player never loses base offline earnings for skipping the ad.
- The bonus is granted only when `PlatformAdapter.showRewarded()` returns `rewarded: true`.
- One bonus attempt can succeed at most once per Welcome Back panel.
- The post-base save timestamp prevents reloading the same offline interval for another base claim.
- If the game resumes into a defeat/transition state, offline coins are granted silently instead of stacking another modal.

### Fortress Revive

On defeat the player receives two explicit choices:

1. Rewarded revive: restore 60 fortress HP and preserve damage already dealt to the current enemy.
2. Free retry: restore 100 fortress HP and reset the current enemy to full HP.

Rules:

- Free retry is always available.
- Rewarded revive is never required to continue.
- Only one successful rewarded revive is available per current encounter before advancing to the next encounter.
- A failed/skipped/unavailable ad grants nothing.
- The revive offer must not obscure that free retry exists.

## Interstitial placement

Interstitial requests are permitted only at chapter breaks after a boss has been defeated, while combat is already stopped.

Additional game-side policy:

- no request before 180 seconds of session time;
- only after every third completed chapter;
- at least 180 seconds between game-side requests;
- never during dragging, combat, onboarding input, reward reveal, daily/collection/Core Lab interaction, or defeat decision UI.

The platform may impose stricter display-frequency controls. Game-side policy is an additional UX cap, not a replacement for platform behavior.

## Analytics

Track placement-level outcomes without PII:

- `rewarded_ad_result`: placement + whether `onRewarded` was received;
- `interstitial_ad_request`: chapter-break request;
- `interstitial_ad_complete`: request returned to gameplay.

Use these to measure opt-in rate, downstream session length, retention and economy impact. Do not optimize only for ad count.

## Balance review

After external testing, inspect:

- percentage of Welcome Back panels using double;
- revive opt-in vs free retry;
- completion rate after rewarded revive;
- exits immediately after interstitial chapter breaks;
- D1/D7 behavior segmented by ad interactions;
- coin inflation from offline double;
- Core Shard progression remains boss/meta-driven and is not directly sold through these placements.

If ads correlate with lower continuation or retention, reduce frequency/value pressure before adding more placements.
