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

- [x] CrazyGames adapter/build foundation.
- [x] Poki adapter/build foundation.
- [ ] Playgama adapter/build.
- [ ] GameDistribution adapter/build.
- [ ] Creative/store-page A/B asset variants.

## Phase 5 — live ops

- Limited bosses/mutations.
- Trend-reactive original content.
- Economy/retention iteration from analytics.
- Optional mobile-store packaging after web metrics justify it.

## Vertical slice / retention status — 2026-08-25

- [x] Immediate merge board with two starter pairs
- [x] Drag / move / swap / merge interaction
- [x] T3 ascension merge: identical max-tier twins promote mutation rarity instead of dead-ending
- [x] Safe ascension ceiling: incompatible / Legendary T3 pairs are never consumed
- [x] Twenty-one original creature designs across seven three-tier families
- [x] Six original bosses including two world-finale bosses
- [x] Six original normal-wave enemies with rotating chapter order and distinct pacing profiles
- [x] Deterministic elite waves from chapter 3 with Berserk / Bulwark / Siege combat identities
- [x] Elite-specific pressure/reward scaling, badges and telegraph choreography
- [x] Five-wave -> boss encounter loop
- [x] Wave 4 pressure ramp + guaranteed Wave 5 Chaos Gate before every boss
- [x] Three-world progression: Candy Crater -> Neon Sewer -> Appliance Wasteland
- [x] Five authored chapters per world with endless Appliance Wasteland after Chapter 15
- [x] Distinct biome combat/economy/Chaos Energy rules and original background art
- [x] World-finale coin/Core Shard rewards and animated world transition HUD
- [x] Serverino Stormzilla routed to Neon Sewer finale at Chapter 10
- [x] Washerzilla Drumissimo routed to Appliance Wasteland finale at Chapter 15
- [x] Real-time auto combat for waves and boss
- [x] Enemy/boss telegraphs, fortress pressure and defeat loop
- [x] Data-driven boss roster with HP-derived multi-phase combat
- [x] Boss shield and weak-point windows with per-boss vulnerability profiles
- [x] Phase III enrage scaling for boss cadence and fortress damage
- [x] Reload-safe boss phase reconstruction directly from persisted boss HP
- [x] Recruit currency sink and encounter reward loop
- [x] Progression-gated seven-family recruit pool: 4 starters -> Mochimoth Ch3 -> Routeraptor Ch6 -> Vendinguana Ch11
- [x] Merge-stable crew-family synergy power with Tier I / II / III thresholds
- [x] Pinguino haste, Toastodilo armor, Lampalotl damage, Dishnail bounty, Mochimoth sustain, Routeraptor energy and Vendinguana boss-break identities
- [x] Active crew synergy labels with tier-change pulse above the merge board
- [x] Encounter-local Chaos Energy with four active combat abilities
- [x] Routeraptor Packet Flock stacking with biome pacing and Chaos Capacitor
- [x] Vendinguana Price Breaker restricted to boss damage and weak-point burst
- [x] Active ability cooldowns, tier scaling, combat UI and mutation/Core Lab stacking
- [x] Two inter-wave Chaos Draft checkpoints per chapter with deterministic three-card offers
- [x] Six temporary chapter perks spanning offense, cadence, defense, economy, sustain and Chaos Energy
- [x] Reload-safe draft reconstruction without free offer rerolls
- [x] Four-tier mutation rarity: Common / Rare Charged / Epic Prismatic / Legendary Crowned
- [x] Mutation roll rates, combat modifiers, merge inheritance and rarity-promotion rules
- [x] Project-owned mutation secondary-silhouette overlays with animated board presentation
- [x] Mutation rarity legend in Chaos Codex and rarity-aware recruit / merge feedback
- [x] Mutation IDs added to bounded recruit / merge analytics events
- [x] Merge / combat / reward VFX hierarchy
- [x] Authored procedural SFX palette with browser-safe audio unlock
- [x] Versioned persistent save through PlatformAdapter
- [x] Save migrations v1 -> v2 -> v3 -> v4 -> v5 -> v6 -> v7 -> v8 -> v9
- [x] v6 -> v7 mutation migration preserving legacy boards as Common
- [x] v7 -> v8 encounter migration preserving historical boss HP at the new boss step
- [x] v8 -> v9 Chaos Draft migration preserving old progression with an empty chapter build
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
- [x] Chaos Codex paginated for the full 21-form roster without overlapping achievements
- [x] Lifetime stats + six claimable achievements
- [x] Conservative collection backfill for legacy saves
- [x] Yandex SDK adapter foundation: loader, LoadingAPI, lifecycle, local/cloud save arbitration
- [x] Yandex fullscreen/rewarded ad API behind PlatformAdapter with safe callback semantics
- [x] CrazyGames HTML5 SDK v3 adapter: dynamic loader, loading/gameplay lifecycle, ads and Data Module saves
- [x] CrazyGames production host detection plus `?platform=crazygames` localhost QA route
- [x] Poki HTML5 adapter: dynamic loader, loading/gameplay events, commercial/rewarded breaks and cloud-gamesave-compatible localStorage
- [x] Poki host/referrer detection plus `?platform=poki` localhost QA route
- [x] Optional rewarded offline double while base earnings stay free
- [x] Optional rewarded fortress revive with always-available free retry
- [x] Chapter-break interstitial policy with first-session and frequency protection
- [x] Placement-level ad analytics contract
- [x] Interactive first-session onboarding: merge -> recruit -> fight
- [x] Protected first merge/recruit with contextual animated coach marks
- [x] Resumable onboarding state with pre-v6 saves migrated as already complete
- [x] Onboarding funnel telemetry and first-session skill/doc
- [x] Yandex GameplayAPI start/stop wired to real Phaser lifecycle
- [x] Retention MVP content target reached: creatures 21 / 20–30 target, bosses 6 / 4–6 target
- [x] Mutations / rarity system
- [ ] Playgama / GameDistribution adapters
- [ ] First external playtest and balance pass
