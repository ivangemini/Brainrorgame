# Brainror Game

Production-oriented HTML5 **merge + wave + boss-rush** game built with Phaser 4, TypeScript and Vite.

## Current playable slice

- immediate first-session merge setup with drag/move/swap/3-tier merges;
- six original player creatures, three original normal enemies and Fridgino Maximo boss;
- encounter loop: **wave 1 -> wave 2 -> wave 3 -> boss -> next chapter**;
- real-time auto combat, distinct telegraphs and fortress pressure;
- session coin economy with recruiting and encounter rewards;
- **Core Shard permanent progression** earned from bosses only;
- Core Lab with Crew Reactor, Fortress Plate and Bounty Coil upgrade tracks;
- capped **coin-only offline progression** on reload and background resume;
- polished Welcome Back reward flow with project-owned vector art;
- authored merge/combat/reward VFX and procedural Web Audio SFX;
- versioned persistent save through `PlatformAdapter`, including migrations through save v3;
- original scalable SVG arena/character/enemy/boss/UI art with provenance manifest;
- portrait-first 1080x1920 composition with high-DPI-friendly vector runtime art.

## Controls

Drag a creature onto an identical family + tier to merge it. Drag onto an empty slot to move it. Drag onto a non-matching occupied slot to swap. Tap **Recruit** to buy a new tier-1 creature. Open **Upgrades** to spend boss-earned Core Shards on permanent bonuses.

## Commands

```bash
npm install
npm run dev
npm run verify
```

All contributors and agents must read `AGENTS.md` and the task-specific files under `skills/` before changing the project.
