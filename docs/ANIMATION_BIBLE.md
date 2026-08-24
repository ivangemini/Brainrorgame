# Animation Bible

## Principle

Animation is part of game feel, not decoration. Core interactions should follow an anticipation -> action -> impact -> settle rhythm.

## Baseline motion language

- Idle: subtle breathing/weight shift; avoid synchronized robotic loops.
- Drag: slight lift, scale and shadow response.
- Valid merge hover: magnetic attraction/pulse.
- Merge: squash -> snap/spiral -> burst -> upgraded character overshoot -> settle.
- Attack: anticipation readable before contact; recoil/recovery after.
- Hit: local flash/deform + directional knock/recoil + particles appropriate to damage type.
- Boss telegraph: clear timing and readable danger area before damage.
- Boss defeat: staged collapse, final impact, reward burst, camera response.
- Reward reveal: rarity controls duration/amplitude; common rewards must stay fast.

## Timing guidance

Use timing as a system, not random tweens:

- Micro UI response: ~80–180 ms.
- Button press/release: fast and tactile.
- Merge transformation: ~350–650 ms depending on rarity.
- Reward reveal: ~500–1400 ms depending on importance.
- Boss defeat: can run longer, but skip/accelerate behavior must be considered for repeats.

These are starting ranges, not hard-coded universal constants.

## Cartoon principles to use

- Squash and stretch.
- Anticipation.
- Follow-through and overlap.
- Overshoot.
- Arcs.
- Staging.
- Exaggeration.
- Secondary motion.

Do not distort recognizable character features so far that identity is lost.

## Technical approach

Prefer layered sprites, transforms, masks, particles, mesh deformation and authored frame sequences where they give the best quality/performance ratio. Do not generate dozens of inconsistent AI frames for one animation.

Where a character needs richer motion, separate logical pieces (body, eyes, mouth, accessory, shadow, weapon) so code-driven animation can preserve the master design.

## Animation acceptance

Every major animation change must be checked at actual gameplay scale and real speed. Slow-motion editor inspection alone is insufficient.
