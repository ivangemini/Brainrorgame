# Skill: Web Game Performance

## Use when
Touching rendering, particles, filters, texture sizes, loading, pooling, update loops, memory, build size, audio or device-quality scaling.

## Required references
Read `docs/PERFORMANCE_BUDGETS.md`.

## Workflow
1. Identify whether cost is CPU, GPU, memory, network or main-thread blocking.
2. Measure before and after when a runnable build exists.
3. Optimize hot paths, not arbitrary code.
4. Prefer content streaming/lazy loading over lowering all visual quality.
5. Add bounded quality scaling for expensive secondary effects.

## Common traps
- 4K textures everywhere;
- too many unique textures causing swaps;
- allocations in every frame/update;
- uncapped particles/projectiles;
- full-screen filters stacked repeatedly;
- decoding many large assets at boot;
- excessive DOM overlays above the canvas.
