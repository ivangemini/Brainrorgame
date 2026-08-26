# Roadmap

## Phase 0 — production foundation
- [x] Repository + CI + agent skills.
- [x] Art/animation/IP/performance bibles.
- [x] Phaser/Vite/TypeScript scaffold.
- [x] PlatformAdapter boundary.
- [x] Asset provenance gate.

## Phase 1 — vertical slice
- [x] Polished merge board, combat loop, boss, VFX/SFX, persistence and responsive presentation.

## Phase 2 — retention MVP
- [x] Progression/economy.
- [x] 20–30 creatures.
- [x] 4–6 bosses.
- [x] Mutations/rarity.
- [x] Daily reward and missions.
- [x] Offline progression.
- [x] Rewarded + interstitial integration behind adapter.
- [x] Analytics event schema.

## Phase 3 — launch candidate
- [x] 35–50 creatures: 36 forms across 12 families.
- [x] 8–12 bosses: 8 authored bosses.
- [x] Multiple worlds/biomes.
- [x] Collection, achievements, balancing foundations and onboarding.
- [x] EN/RU localization across the primary HUD, onboarding, retention panels, Chaos Draft, active abilities, Core Lab and long-tail achievement copy.
- [x] Yandex SDK + moderation checklist.
- [x] Performance and asset-size pass: vendor split plus purpose-sized runtime textures.
- [x] External playtest/balance protocol and release acceptance gates authored.
- [ ] Execute first external human playtest and evidence-backed balance pass.

## Phase 3.5 — retention expansion
Goal: turn the strong launch loop into a weeks-long meta loop without requiring a proportional increase in art production.

### S-tier systems
- [ ] Ascension / Prestige: reset chapter progress after a meaningful Rift milestone for permanent Chaos Stars while preserving collection-critical progress.
- [ ] Ascension tree: Merge, Combat, Chaos and Collection branches with rule-changing unlocks rather than only flat stat inflation.
- [x] Mutation Album: track Normal / Charged / Prismatic / Crowned state for every form, exposing up to 144 collection targets from the existing 36-form roster.
- [x] Mutation Album milestone rewards and Codex completion surfaces.
- [x] Weekly Chaos Run: deterministic weekly seed, rotating rules, weekly progression milestones and bounded rewards.
- [x] Weekly-run analytics: start, milestone, completion/failure depth and build-choice signals without player PII.

### A-tier systems
- [ ] Boss Hunt: rotating empowered boss with persistent damage across attempts and a finite reward track.
- [ ] Boss Trophy Room: Normal / Enraged / Nightmare trophy progression for authored bosses.
- [ ] Creature Mastery: family-specific XP from merges, combat and boss participation with milestone cosmetics/perks.
- [ ] Secret Evolutions: original hidden cross-family recipes, discoverable hints and dedicated secret-form Codex section.
- [ ] Chaos Events: short rule-breaking events such as Merge Fever, Tiny Invasion, Golden Creature and surprise boss interruptions.
- [ ] World Map: turn chapter progression into a visible journey with world nodes, boss gates and unlock previews.

### Later retention/live-ops layer
- [ ] 28-day lightweight season framework using existing actions for XP.
- [ ] Season 1 content/reward track after playtest confirms the underlying loops.
- [ ] Limited bosses/mutations built on Boss Hunt + Album rather than isolated one-off content.
- [ ] Trend-reactive original content with IP-distance review.

### Retention design constraints
- [ ] Rewarded ads remain optional acceleration/recovery; no progression wall requires an ad.
- [ ] Prestige must create new decisions, not merely reset the same numbers.
- [x] Weekly content remains deterministic/testable and does not require server authority for core play.
- [ ] Collection expansion should preferentially reuse existing production art through authored mutation presentation before adding dozens of new base families.
- [ ] New currencies require a named sink, bounded source and save-migration plan before implementation.

## Phase 4 — distribution
- [x] CrazyGames adapter/build foundation.
- [x] Poki adapter/build foundation.
- [x] Playgama adapter/build foundation.
- [x] GameDistribution adapter/build foundation.
- [x] Creative/store-page A/B asset variants: two Yandex cover concepts plus localized store copy.
- [x] Machine-validated Yandex release metadata gate in `npm run verify`.
- [x] Portal-specific packaging matrix, screenshot shot list and candidate-SHA rules authored.
- [ ] Capture final screenshots and produce upload archives from the accepted candidate SHA.

## Phase 5 — live ops
- [ ] Limited bosses/mutations.
- [ ] Trend-reactive original content.
- [ ] Economy/retention iteration from analytics.
- [ ] Optional mobile-store packaging after web metrics justify it.

## Launch-candidate status — 2026-08-26

- [x] 36 original creature forms across 12 three-tier families.
- [x] Five Phase 3 families: Umbrellama, Mopossum, Fanthom, Socktopus and Microwhale.
- [x] Late recruit unlocks at Chapters 13, 16, 18, 21 and 24 to protect early-pool readability.
- [x] Five new family synergy identities: Storm Canopy, Salvage Sweep, Ghost Fan, Laundry Barrage and Microwave Beam.
- [x] Eight authored bosses, including Vacuumoon Overlord and Blenderbehemoth Royale in the endless rotation.
- [x] Three authored worlds plus post-Chapter-15 Endless Rift tier progression.
- [x] Persistent Anomaly Hunt with mutation safety net and Crown Signal guarantee.
- [x] Chaos Draft, active abilities, crew synergies, mutations and Core Lab meta progression.
- [x] Chaos Codex target follows the live roster instead of a hard-coded 21-form total.
- [x] Mutation Album persists all 144 form/state targets, records recruit/merge discoveries and exposes claimable Codex milestones.
- [x] Weekly Chaos Run adds a 12-encounter deterministic weekly challenge with three rotating rules, best-depth progression and four finite milestone caches.
- [x] Weekly rules modify live combat HP, damage, cadence, combat coins and recruit cost while preserving the player's normal campaign/board progression.
- [x] Fifteen long-tail achievements, daily rewards/missions and offline progression.
- [x] Save migrations through v12, including evidence-safe Mutation Album backfill and fresh Weekly Chaos state for legacy saves.
- [x] Yandex, CrazyGames, Poki, Playgama and GameDistribution adapter foundations.
- [x] Typed privacy-safe analytics, including bounded Weekly Run start/depth/build/outcome/reward signals.
- [x] Typed EN/RU localization framework with `?lang=` QA override.
- [x] Primary HUD, Recruit/Anomaly readout, world transitions, Daily Chaos and Chaos Codex use runtime localization.
- [x] Weekly Chaos panel/rules/progression copy is available in EN/RU; weekly Recruit pricing is reflected live in the HUD.
- [x] Onboarding coach, revive flow and offline-reward flow use EN/RU runtime localization.
- [x] All six Chaos Draft perk names/descriptions are localized without coupling language to balance definitions.
- [x] Active ability HUD/status labels are localized; localized names/descriptions are available by ability id.
- [x] Core Lab upgrade names, descriptions and effect values are localized by stable upgrade id.
- [x] Daily mission names are localized by stable mission id.
- [x] All 15 achievement names/descriptions are localized through stable achievement ids and roster-aware targets.
- [x] Yandex moderation/release checklist.
- [x] Purpose-sized runtime textures: creatures/enemies 384, mutation overlays 192, bosses 640.
- [x] Project-owned provenance records for Phase 3 creature/boss art.
- [x] Phase 3 content design sheet with silhouette, role, material, animation hooks and IP-distance checks.
- [x] EN/RU Yandex store metadata with validated required fields.
- [x] Two store-cover A/B variants: chaos-roster promise and boss-combat promise.
- [x] `release:check` is part of the production verification pipeline.
- [x] Store creative test plan protects against optimizing CTR at the expense of qualified starts/retention.
- [x] External playtest matrix, severity model, first-session guardrails and result template documented in `PLAYTEST_BALANCE_PROTOCOL.md`.
- [x] Portal release matrix, deterministic archive naming, screenshot shot list and exact-candidate provenance documented in `PORTAL_RELEASE_MATRIX.md`.
- [ ] Final low-frequency localization QA sweep on a running candidate build.
- [ ] First external human playtest on representative desktop and mid-range mobile hardware.
- [ ] Balance pass from actual first-session, boss and retention telemetry.
- [ ] Capture final candidate screenshots and portal upload packages.

## Hard boundary

The remaining unchecked launch items require observations or artifacts from a running accepted candidate: real-device/human playtest results, observed telemetry, and screenshots captured from that exact build. They must not be marked complete from static code review or CI alone.
