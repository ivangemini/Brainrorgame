# Performance Budgets

## Targets

- Gameplay: target 60 FPS on representative mid-range mobile browsers.
- Fallback floor: 30 FPS only on constrained hardware; visual quality may scale down.
- Input latency: interactions should feel immediate; avoid blocking main-thread work during drag/merge/combat.

## Loading

- Boot only what is required for first playable interaction where practical; large future-world/audio content should be moved behind lazy loading as the asset set grows.
- Use compressed, purpose-sized runtime assets rather than master/source dimensions.
- Avoid shipping rasterized 2K/4K source art when a smaller runtime texture is visually equivalent at gameplay scale.
- Keep game-code chunks separate from the large Phaser/vendor runtime so frequent gameplay deploys preserve vendor cacheability.

## Current runtime texture policy

The source SVG/master dimensions remain high-resolution and project-owned; Phaser rasterization is purpose-sized for gameplay:

- creature forms: **384×384** runtime texture from >=2048 master;
- normal enemies: **384×384** runtime texture from >=2048 master;
- mutation overlays: **192×192** runtime texture from >=1024 master;
- bosses: **640×640** runtime texture from 4096 master;
- full-screen world backgrounds: **1080×1920** runtime texture from >=2160×3840 master;
- small HUD icons keep their explicit 96–260 px runtime targets.

A higher runtime tier requires a measured readability problem at actual display size. Do not raise texture dimensions merely because source art is larger.

## GPU / textures

- Default atlas ceiling: 2048×2048 for broad mobile compatibility.
- 4096 runtime textures require validation and should not be the default path.
- Minimize texture swaps in dense combat scenes.
- Reuse particle textures and pool frequent objects.
- When adding a content family, record both master and runtime dimensions in `public/assets/manifest.json`.

## JavaScript bundles

- Application/game logic should remain independently cacheable from Phaser/vendor code.
- A large Phaser vendor chunk is acceptable only when the application chunk stays bounded and the split is stable.
- New gameplay systems should not introduce another >1 MB first-party chunk.
- Dynamic imports are preferred for genuinely optional systems/screens; do not fragment hot gameplay code into tiny request-heavy chunks without measurement.

## Runtime

- Pool projectiles/particles/repeated combat objects where measurable.
- Avoid per-frame temporary arrays/objects in hot loops.
- Avoid expensive filters on many full-screen layers at once.
- Provide scalable VFX quality tiers if effects become GPU-bound.
- Do not let repeated modal opens, chapter transitions or boss phases leak tweens/listeners/audio nodes.

## Quality scaling

Quality scaling may reduce particle count, post-processing, shadow complexity or background effects. It must not replace core character art with visibly inferior versions or alter game logic.

## Release evidence

For launch candidates record:

- production bundle sizes and gzip sizes;
- representative mobile FPS during dense board + boss combat;
- boot-to-interactive observation;
- peak texture/memory observations where browser tooling permits;
- any chunk-size warnings and why they are accepted or scheduled for follow-up.
