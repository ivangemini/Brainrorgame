# Yandex Games Moderation & Release Checklist

Use this as the release gate for every Yandex candidate. A build is not submission-ready until every applicable item is checked on the exact uploaded archive.

## Build integrity

- [ ] `npm run verify` passes on the release commit.
- [ ] Production `dist/` opens from a static server with no dev server or localhost dependency.
- [ ] Relative asset paths work from the packaged archive.
- [ ] No source maps, secrets, API keys, test fixtures or private notes are required at runtime.
- [ ] Browser console has no uncaught errors during boot, first merge, Recruit, wave, boss, ad flow and save reload.
- [ ] Game remains playable when optional analytics/ad calls fail.

## Yandex SDK lifecycle

- [ ] SDK initializes through `YandexAdapter`; gameplay code contains no direct YaGames calls.
- [ ] `LoadingAPI.ready()` is signalled only after the playable scene is created.
- [ ] `GameplayAPI.start()` is called while active gameplay is available.
- [ ] `GameplayAPI.stop()` is called for platform pause/visibility/ad interruptions.
- [ ] Focus/background resume restores audio/gameplay exactly once.
- [ ] Cloud/local save arbitration is tested with a fresh profile and a returning profile.

## Ads and player trust

- [ ] No mandatory ad interrupts the first-session onboarding or active combat.
- [ ] Rewarded revive is explicitly optional and free retry always remains available.
- [ ] Rewarded offline double grants the base reward even when ad is declined/unavailable.
- [ ] Chapter-break interstitial respects first-session protection and frequency caps.
- [ ] Reward is granted only on the platform's confirmed rewarded-completion callback.
- [ ] Ad failure/close never soft-locks the scene, input, audio or save loop.
- [ ] There is no simulated close button, deceptive countdown or fake ad UI.

## Input, layout and device QA

- [ ] 1080×1920 design canvas remains readable at common phone portrait widths.
- [ ] Desktop FIT scaling does not crop HUD, board, boss telegraphs or modal close controls.
- [ ] Touch targets remain usable without hover.
- [ ] Drag/merge works with mouse and touch/pointer input.
- [ ] Text remains legible at the smallest supported viewport.
- [ ] Russian and English locale modes are checked with `?lang=ru` and `?lang=en`.
- [ ] No essential meaning relies only on color.

## Performance

- [ ] Boot reaches first meaningful interaction without loading failures on a mid-range mobile profile.
- [ ] Representative combat targets 60 FPS; prolonged 30 FPS or lower is treated as a blocker.
- [ ] No unbounded particle/tween/audio-source growth after repeated encounters.
- [ ] Creature/enemy runtime SVG textures are rasterized to 384×384; mutation overlays 192×192; bosses 640×640 unless a measured exception is documented.
- [ ] Main game code remains isolated from the large Phaser/vendor chunk for cache stability.
- [ ] Any new large asset is recorded in `public/assets/manifest.json` with runtime dimensions and provenance.

## Content, IP and age suitability

- [ ] Every shipped character, boss, enemy, biome and UI asset has documented project-owned/licensed provenance.
- [ ] No copied meme character, celebrity likeness, streamer likeness, brand logo, commercial song or viral audio is present.
- [ ] Names are original and do not intentionally imitate protected marks/characters.
- [ ] Store screenshots show only content present in the submitted build.
- [ ] Violence remains stylized/cartoon and age-rating answers match actual gameplay.
- [ ] No gambling/cash-out framing is used for Anomaly Hunt; Recruit uses earned in-game coins and guarantees are gameplay progression, not real-money wagering.

## Save and retention regression

- [ ] Fresh save starts with the intended starter board and onboarding.
- [ ] Existing v1–v10 saves migrate without loss of board, currency, world progress, Codex, dailies or Anomaly Hunt state.
- [ ] Save/reload during a normal wave, boss, Chaos Draft and endless chapter restores a valid state.
- [ ] Daily claim cannot be duplicated by reload/background tricks.
- [ ] Offline reward is capped and uses elapsed time defensively.

## Store metadata package

- [ ] Final title chosen after trademark/confusion check.
- [ ] Short and long descriptions are available in English and Russian.
- [ ] Icon and screenshots meet current Yandex dashboard dimensions.
- [ ] Screenshots include merge board, boss fight, mutation reveal and Codex/meta progression rather than menu-only views.
- [ ] Age rating, category, orientation and supported languages match the build.
- [ ] Privacy/analytics disclosure matches actual telemetry; analytics contains no PII/raw saves/device fingerprinting.

## Final smoke sequence

Run this sequence on the exact candidate archive:

1. Fresh boot → first merge → first Recruit → onboarding completion.
2. Finish a wave and verify coin reward/save.
3. Reach a boss, lose once, test free retry, then test rewarded revive when available.
4. Open Daily, Codex and Core Lab; close each by both explicit close control and supported backdrop behavior.
5. Background the tab/app and resume; verify offline calculation and audio state.
6. Reload and verify board/chapter/currency/pity state.
7. Run Russian locale smoke, then English locale smoke.
8. Test with ad/network failure simulation if the platform preview permits it.

## Submission evidence

Record for each candidate:

- commit SHA;
- `npm run verify` result;
- tested browser/device list;
- save migration versions exercised;
- ad placements exercised;
- known non-blocking warnings;
- moderation feedback and subsequent fixes.
