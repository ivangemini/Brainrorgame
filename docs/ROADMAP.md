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

## Vertical slice status — 2026-08-25

Implemented in the first playable slice:

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
- [x] Versioned persistent save through PlatformAdapter
- [x] Save migration v1 -> v2 for wave encounters
- [x] Authored procedural SFX palette with browser-safe audio unlock
- [ ] Offline progression
- [ ] Permanent progression / meta upgrades
- [ ] Daily layer / collection / achievements
- [ ] Platform SDK adapters beyond web
- [ ] Analytics / retention events
- [ ] First external playtest and balance pass
