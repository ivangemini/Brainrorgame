# Skill: Game Feel & VFX

## Use when
Working on combat impact, particles, flashes, hit stop, camera motion, screen effects, rarity reveals, juice, haptics hooks, boss spectacle or feedback hierarchy.

## Feedback stack
Use only the layers justified by action importance:
- sprite deformation/pose;
- local flash/tint;
- particles;
- damage number/UI response;
- audio hook;
- camera impulse;
- micro hit-stop/time-scale;
- environmental response.

Common attacks should not consume the same spectacle budget as a legendary merge or boss kill.

## Rules
- Telegraph danger before impact.
- Camera shake amplitude must scale by event tier and must remain comfortable on mobile.
- Particles must have bounded maximum counts and pooled/reused resources when dense.
- VFX cannot obscure critical board state or touch targets.
- Use shape, timing and motion as well as color for accessibility/readability.
