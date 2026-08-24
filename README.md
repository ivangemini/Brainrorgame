# Brainrot Merge Boss

Working repository codename for a polished cartoon **merge + boss-rush + collection** HTML5 game.

## Stack

- Phaser 4
- TypeScript
- Vite
- Vitest
- Portal integrations through `PlatformAdapter`

## Setup

```bash
npm install
npm run dev
```

Before merging production work:

```bash
npm run verify
```

## Production rules

Start with `AGENTS.md`. Visual work is governed by `docs/ART_DIRECTION.md`, `docs/ANIMATION_BIBLE.md`, `docs/QUALITY_GATES.md`, and the task-specific files under `skills/`.

The repository intentionally forbids placeholder-grade player-facing output in release paths. High-resolution source art and optimized runtime art are treated as separate pipeline stages.
