# Brainror Game

Production-oriented HTML5 **merge + wave + boss-rush** game built with Phaser 4, TypeScript and Vite.

## Current vertical slice

- immediate first-session merge setup (two ready pairs);
- drag/drop board with move, swap and 3-tier merges;
- two original creature families with six distinct vector designs;
- three original normal enemies with chapter-based wave rotation;
- encounter loop: **wave 1 -> wave 2 -> wave 3 -> boss -> next chapter**;
- real-time auto combat with family/tier-specific damage and cadence;
- distinct wave/boss telegraphs, fortress damage and reward choreography;
- recruit economy plus wave and boss coin rewards;
- authored merge, hit, projectile, screen-flash, camera and reward feedback;
- versioned persistent save through `PlatformAdapter`, including v1 -> v2 migration;
- original scalable SVG arena/character/enemy/boss art with asset provenance manifest;
- portrait-first 1080x1920 composition with high-DPI-friendly vector runtime art.

## Controls

Drag a creature onto an identical family + tier to merge it. Drag onto an empty slot to move it. Drag onto a non-matching occupied slot to swap. Tap **Recruit** to buy a new tier-1 creature.

## Commands

```bash
npm install
npm run dev
npm run verify
```

All contributors and agents must read `AGENTS.md` and the task-specific files under `skills/` before changing the project.
