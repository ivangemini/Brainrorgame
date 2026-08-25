# Roadmap

## Phase 0 — production foundation

- Repository + CI + agent skills.
- Art/animation/IP/performance bibles.
- Phaser/Vite/TypeScript scaffold.
- PlatformAdapter boundary.
- Asset provenance gate.

## Phase 1 — vertical slice

- One polished merge board.
- 6–8 original creatures across 3–4 merge tiers.
- One normal enemy wave set.
- One highly polished boss.
- Full merge/combat/reward animation, VFX and SFX pass.
- Basic persistent save.
- Mobile + desktop responsive presentation.

Success condition: 60 seconds of gameplay already looks and feels commercially publishable.

## Phase 2 — retention MVP

- Progression/economy.
- 20–30 creatures.
- 4–6 bosses.
- Mutations/rarity.
- Daily reward and missions.
- Offline progression where appropriate.
- Rewarded + interstitial integration behind adapter.
- Analytics event schema.

## Phase 3 — launch candidate

- 35–50 creatures.
- 8–12 bosses.
- Multiple worlds/biomes.
- Collection, achievements, balancing, onboarding.
- Localization framework.
- Yandex SDK + moderation checklist.
- Performance and asset-size pass.

## Phase 4 — distribution

- CrazyGames adapter/build.
- Poki adapter/build.
- Playgama adapter/build.
- GameDistribution adapter/build.
- Creative/store-page A/B asset variants.

## Phase 5 — live ops

- Limited bosses/mutations.
- Trend-reactive original content.
- Economy/retention iteration from analytics.
- Optional mobile-store packaging after web metrics justify it.

## Vertical slice / retention status — 2026-08-25

- [x] Immediate merge board with two starter pairs
- [x] Drag / move / swap / merge interaction
- [x] Six original creature designs across two three-tier families
- [x] Original boss and arena art
- [x] Three original normal-wave enemies with rotating chapter order
- [x] Three-wave -> boss encounter loop
- [x] Real-time auto combat for waves and boss
- [x] Enemy/boss telegraphs, fortress pressure and defeat loop
- [x] Recruit currency sink and encounter reward loop
- [x] Merge / combat / reward VFX hierarchy
- [x] Authored procedural SFX palette with browser-safe audio unlock
- [x] Versioned persistent save through PlatformAdapter
- [x] Save migrations v1 -> v2 -> v3 -> v4 -> v5
- [x] Boss-only Core Shard permanent currency
- [x] Three permanent upgrade tracks and Core Lab UI
- [x] Capped offline coin progression on reload/background resume
- [x] Animated Welcome Back reward popup with project-owned art
- [x] Seven-day login reward streak
- [x] Three daily gameplay missions with claimable rewards
- [x] Daily Chaos drawer + notification state
- [x] Typed privacy-safe analytics event contract and gameplay funnel instrumentation
- [x] Analytics agent skill and vendor-independent PlatformAdapter sink
- [x] Chaos Codex collection with discovered / hidden creature forms
- [x] Lifetime stats + six claimable achievements
- [x] Conservative collection backfill for pre-v5 saves
- [x] Yandex SDK adapter foundation: loader, LoadingAPI, lifecycle, local/cloud save arbitration
- [x] Yandex fullscreen/rewarded ad API behind PlatformAdapter with safe callback semantics
- [x] Optional rewarded offline double while base earnings stay free
- [x] Optional rewarded fortress revive with always-available free retry
- [x] Chapter-break interstitial policy with first-session and frequency protection
- [x] Placement-level ad analytics contract
- [ ] Expand creature/boss content toward retention MVP targets
- [ ] CrazyGames / Poki / Playgama / GameDistribution adapters
- [ ] First external playtest and balance pass
