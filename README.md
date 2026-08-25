# Brainror Game

Production-oriented HTML5 **merge + wave + boss-rush** game built with Phaser 4, TypeScript and Vite.

## Current playable build

- portrait-first merge board with drag/move/swap, three-tier merges and T3 mutation ascension;
- **36 original creature forms across 12 families** with progressive Recruit unlocks through Chapter 24;
- **8 original bosses**, multi-phase shield/weak-point/enrage combat and two world-finale overrides;
- three authored worlds followed by Endless Rift chapter identities and escalating Rift Tiers;
- five-wave encounter loop with elite waves, Chaos Gate pressure and boss fights;
- persistent Anomaly Hunt with mutation pity and Crown Signal guarantee;
- four mutation rarities, merge inheritance and project-owned mutation overlays;
- crew-family synergy tiers, four active Chaos Energy abilities and two Chaos Draft checkpoints per chapter;
- Core Shard permanent progression and three Core Lab upgrade tracks;
- seven-day login streak, daily missions, offline reward, Chaos Codex and 15 long-tail achievements;
- Yandex, CrazyGames, Poki, Playgama and GameDistribution platform adapters behind one boundary;
- rewarded revive/offline-double plus protected chapter-break interstitial policy;
- typed privacy-safe analytics and playtest recorder;
- typed English/Russian localization framework with `?lang=en` / `?lang=ru` QA override;
- versioned persistent saves with migrations through **v10**;
- original scalable SVG art with production provenance manifest;
- purpose-sized runtime texture tiers and separate game/vendor JavaScript chunks.

## Controls

Drag a creature onto an identical family + tier to merge it. Drag onto an empty slot to move it. Drag onto a non-matching occupied slot to swap. Tap **Recruit** to buy a new tier-1 creature. Open **Upgrades** to spend boss-earned Core Shards on permanent bonuses.

## Commands

```bash
npm install
npm run dev
npm run verify
```

For Yandex submission use `docs/YANDEX_MODERATION_CHECKLIST.md` as the release gate. All contributors and agents must read `AGENTS.md` and the task-specific files under `skills/` before changing the project.
