# Quality Gates

## Gate A — code

- Lint clean.
- Typecheck clean.
- Unit tests clean.
- Production build succeeds.

## Gate B — visual

For any player-facing visual change:

- actual screenshot/video reviewed;
- portrait mobile checked;
- landscape/desktop checked when supported;
- no clipping/stretching/blur/pixelation;
- hierarchy remains readable;
- interaction has appropriate motion feedback.

## Gate C — assets

- no placeholder/debug art in production manifest;
- provenance/license recorded;
- source resolution meets art-direction target;
- runtime export is optimized and not a naive full-resolution source dump.

## Gate D — game feel

Core actions must feel authored. For merge/combat/reward/boss flows, verify animation timing, VFX, sound hook points, camera response and repetition fatigue.

## Gate E — performance

- no obvious frame spikes introduced;
- first-play payload impact considered;
- asset memory considered;
- expensive effects have bounded counts.

## Gate F — release

- platform SDK lifecycle tested;
- ad pause/resume tested;
- save migration tested;
- offline/focus-loss behavior tested;
- moderation requirements reviewed;
- no copyrighted/trademark-risk content slipped into build.
