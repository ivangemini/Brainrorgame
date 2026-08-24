# Performance Budgets

## Targets

- Gameplay: target 60 FPS on representative mid-range mobile browsers.
- Fallback floor: 30 FPS only on constrained hardware; visual quality may scale down.
- Input latency: interactions should feel immediate; avoid blocking main-thread work during drag/merge/combat.

## Loading

- Boot only what is required for first playable interaction.
- Later worlds, bosses, cosmetics and nonessential audio are lazy-loaded.
- Use compressed, purpose-sized runtime assets.
- Avoid shipping high-resolution source files in runtime bundles.

## GPU / textures

- Default atlas ceiling: 2048×2048 for broad mobile compatibility.
- 4096 textures require validation and should not be the default path.
- Minimize texture swaps in dense combat scenes.
- Reuse particle textures and pool frequent objects.

## Runtime

- Pool projectiles/particles/repeated combat objects where measurable.
- Avoid per-frame temporary arrays/objects in hot loops.
- Avoid expensive filters on many full-screen layers at once.
- Provide scalable VFX quality tiers if effects become GPU-bound.

## Quality scaling

Quality scaling may reduce particle count, post-processing, shadow complexity or background effects. It must not replace core character art with visibly inferior versions or alter game logic.
