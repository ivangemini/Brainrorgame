# Skill: 2D Animation

## Use when
Adding or modifying tweens, sprite sequences, skeletal/layered motion, transitions, merge transformations, attacks, hit reactions, idles, UI motion, reveals or boss choreography.

## Required references
Read `docs/ANIMATION_BIBLE.md` and `docs/PERFORMANCE_BUDGETS.md`.

## Workflow
1. Identify the action's anticipation, action, impact and settle phases.
2. Define what the player must read before adding secondary motion.
3. Animate dominant mass first, then appendage/accessory overlap.
4. Use easing intentionally; default linear motion is rarely acceptable for expressive gameplay.
5. Add tiny randomized phase offsets to repeated idle groups where appropriate.
6. Check repeated viewing: a spectacular 1.5 s animation may become annoying on the 100th merge.
7. Test at real gameplay scale and speed.

## Merge quality minimum
A production merge should include spatial attraction/snap, squash/scale deformation, transformation conceal/reveal, a concise VFX burst, upgraded-unit overshoot and settle, plus sound hooks.

## Do not
- Generate frame-by-frame sequences from unrelated AI frames with drifting anatomy.
- Use constant screen shake for ordinary actions.
- Animate every property simultaneously with the same duration/easing.
