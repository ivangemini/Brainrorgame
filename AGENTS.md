# AGENTS.md — Brainrot Merge Boss

This repository is a production game, not a prototype. Every agent must optimize for player-facing quality, retention, performance, maintainability, and legal safety.

## Product north star

Build a highly polished cartoon merge + boss-rush web game that can ship on Yandex Games first and expand to CrazyGames, Poki, Playgama, GameDistribution and other HTML5 portals without gameplay forks.

The game must never look like a classroom demo, game jam placeholder, low-effort AI asset dump, or generic template reskin.

## Mandatory skill routing

Before changing files, read the skills relevant to the task:

- Any visual work: `skills/art-direction/SKILL.md`
- Any new character/boss/skin: `skills/character-design/SKILL.md` + `docs/IP_POLICY.md`
- Any animation/tween/transition: `skills/2d-animation/SKILL.md`
- Any combat feedback, particles, camera, hit impact: `skills/game-feel-vfx/SKILL.md`
- Any SFX/music/ambience/mix/Web Audio work: `skills/audio-design/SKILL.md`
- Any HUD/menu/shop/onboarding: `skills/ui-ux/SKILL.md`
- Any image/audio export, atlas, compression, source asset: `skills/asset-pipeline/SKILL.md`
- Any gameplay/system code: `skills/gameplay-engineering/SKILL.md`
- Any economy/progression/reward/ad placement: `skills/economy-balance/SKILL.md`
- Any analytics/KPI/retention event/A-B experiment work: `skills/analytics-experimentation/SKILL.md`
- Any platform SDK/save/ad/leaderboard integration: `skills/platform-integrations/SKILL.md`
- Any load-time/FPS/memory work: `skills/performance-web/SKILL.md`
- Any release/QA/moderation submission: `skills/qa-release/SKILL.md`

If a task touches multiple areas, read all applicable skills. Do not silently skip visual or audio skills because the requested change sounds "small".

## Non-negotiable visual quality bar

1. No emoji, Unicode pictograms, CSS circles, debug geometry, or text labels may substitute for final player-facing art.
2. No stretched, pixelated, visibly AI-corrupted, inconsistent, watermarked, or low-resolution art ships.
3. Final character master art is normally 2048×2048 or larger. Hero/key-art and large bosses should normally be 3072–4096 px on the long edge. Background master art should normally target 3840×2160 or larger.
4. Runtime assets are optimized exports. Do not ship every 4K source to mobile. Use atlases/tiers and preserve crisp Retina rendering.
5. Every important interaction requires motion and feedback: anticipation, action, impact, settle. Static UI that simply appears/disappears is not acceptable for core flows.
6. Every merge, reward, boss hit, boss defeat, rarity reveal and purchase must have an authored feedback hierarchy.
7. Character silhouettes must remain readable at small mobile sizes. Detail that disappears at 80–120 px is secondary.
8. Visual consistency beats asset count. Ten coherent characters are better than fifty unrelated generations.

## Audio quality bar

- Core interactions need authored cues or an intentional reason to remain silent.
- Repeated combat cues are throttled and mixed by priority; unit count must not make volume scale linearly.
- Boss telegraphs and defeat cues must remain audible over regular combat.
- Browser autoplay restrictions are handled gracefully; the game never blocks waiting for audio unlock.
- No recognizable meme clips, commercial music, streamer audio or scraped SFX ship without documented rights.

## Gameplay quality bar

- Core loop should be understandable without a tutorial wall.
- First meaningful interaction in <= 5 seconds after game becomes interactive.
- First merge/reward payoff in <= 20 seconds.
- First boss encounter should happen early enough to demonstrate the promise of the game.
- No mandatory ad interruption during active gameplay.
- Rewarded ads must be voluntary and tied to a clear player benefit.
- Platform-specific logic must stay behind `PlatformAdapter`.

## Engineering rules

- TypeScript strict mode stays enabled.
- New gameplay logic requires tests when it can be tested deterministically.
- Avoid scene classes becoming god objects. Systems own rules; scenes orchestrate presentation.
- Content data should be data-driven, not copied conditionals.
- Save schemas are versioned and migrated.
- Randomness used in gameplay/economy must be injectable/seedable where practical.
- No direct Yandex/CrazyGames/Poki SDK calls outside the platform adapter layer.
- Analytics events use the typed contract in `src/analytics/` and must not contain PII or raw save/device fingerprints.
- Never commit secrets.

## Performance targets

See `docs/PERFORMANCE_BUDGETS.md`. In short:

- 60 FPS target on representative mid-range mobile hardware.
- 30 FPS is a fallback floor, not a design target.
- Keep first-play payload aggressively bounded.
- Lazy-load later worlds, cosmetics, music and large audio.
- Avoid runtime allocation spikes in combat loops.

## IP / legal rules

See `docs/IP_POLICY.md`.

- Brainrot is an aesthetic language, not permission to clone known characters.
- Do not use copyrighted/trademarked meme characters, celebrity likenesses, brand logos, music, voice clips, or scraped artwork without documented rights.
- Every imported production asset needs provenance in `public/assets/manifest.json` or the relevant source manifest.

## Definition of done

A task is not done because it compiles. It is done when:

- behavior is correct;
- visuals meet the art direction;
- animation/feedback is appropriate;
- core audio feedback is appropriate when relevant;
- mobile and desktop layouts are checked when relevant;
- performance impact is acceptable;
- tests/verification pass;
- documentation/content manifests are updated;
- no placeholders remain in the shipped path.

Run `npm run verify` before considering implementation complete.
