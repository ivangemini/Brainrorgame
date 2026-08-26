# Brainror Game

Production-oriented HTML5 **merge + wave + boss-rush** game built with Phaser 4, TypeScript and Vite.

## Current playable build

- portrait-first **15-slot (5 x 3) merge board** with drag/move/swap and one consistent rule: same creature family + same tier;
- clearly separated T1/T2/T3 board presentation with progressively stronger frames, size, tier markers and Roman-tier badges;
- persistent merge-target guidance: incompatible creatures dim while dragging and legal twins remain highlighted on a full board;
- player-controlled **Preparation / Fight** state that freezes combat and ability timers while the board is being organized, with bosses entering preparation automatically;
- pause-safe in-flight combat: enemy telegraphs cannot be frame-cancelled for free and crew projectiles cannot deal damage while preparation is active;
- free **Regroup** after defeat restores the fortress, resets the enemy and returns the player to preparation instead of immediately restarting incoming damage;
- deadlock-safe smart Recruit planning that favors useful merge chains, downweights already-maxed lineages and protects the final free slot instead of allowing cross-family emergency fusion;
- T3 same-family consolidation, with compatible mutation twins ascending and capped/incompatible mutation pairs retaining the stronger mutation;
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
- versioned persistent saves with migrations through **v14**, including automatic 12-slot -> 15-slot board expansion;
- original scalable SVG art with production provenance manifest;
- purpose-sized runtime texture tiers and separate game/vendor JavaScript chunks.

## Controls

Drag a creature onto the **same family + same tier** to merge it. Different families never merge: dragging onto a non-matching occupied slot swaps them. Drag onto an empty slot to move. While dragging, non-matching creatures dim and every legal target is highlighted.

Use **Pause** in the Merge Crew header whenever you want to rearrange or merge without taking combat damage; the button becomes **Fight** while preparation mode is active. Boss encounters enter preparation automatically before combat begins. Opening blocking progression/reward panels also freezes combat and ability timers, then restores the player's previous pause state when the panel closes.

After a fortress defeat, rewarded revive still preserves enemy damage. The always-free alternative is now **Regroup**: the fortress and enemy reset, then combat remains paused so the player can merge, Recruit or inspect progression before pressing Fight.

Tap **Recruit** to buy a new creature. Recruit RNG favors families that immediately advance an existing merge chain, reduces the chance of spawning a lineage that is already represented only by max-tier units, and still guarantees a safe same-family pair when the final slot would otherwise deadlock.

The HUD always shows the complete coin balance to the **left** of the coin icon; large balances are never abbreviated or drawn underneath the icon. Tapping the coin or Core Shard count gives a short source/sink reminder.

Open **Upgrades / Core Lab** to spend boss-earned Core Shards. At the bottom of Core Lab, **Reset Progress / Сбросить прогресс** creates a completely fresh save. The reset requires a second confirmation tap within four seconds and then reloads the game.

## Commands

```bash
npm install
npm run dev
npm run verify
```

For Yandex submission use `docs/YANDEX_MODERATION_CHECKLIST.md` as the release gate. All contributors and agents must read `AGENTS.md` and the task-specific files under `skills/` before changing the project.
