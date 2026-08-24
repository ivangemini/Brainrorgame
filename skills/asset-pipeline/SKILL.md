# Skill: Asset Pipeline

## Use when
Importing, exporting, resizing, compressing, packing, naming, generating or registering visual/audio assets.

## Source vs runtime
Keep high-resolution editable/master art separate from runtime exports.

Typical source targets:
- creatures >= 2048×2048;
- major bosses/key art 3072–4096 px long edge;
- backgrounds >= 3840×2160;
- icons vector or >= 1024×1024 master.

Runtime art should be exported for actual screen size and texture budgets, not copied blindly from masters.

## Required metadata
Every production runtime asset gets a manifest entry containing ID, path, status=final, provenance, license basis, master/runtime dimensions, and relevant notes.

## Optimization
- Trim transparent padding where it does not break animation pivots.
- Use texture atlases for frequently co-rendered sprites.
- Prefer 2048 atlases by default for mobile compatibility.
- Use compression that does not visibly damage facial features, edges, text or rarity effects.
- Lazy-load content not needed for the first session.

## Rejection
Never accept watermarks, accidental glyphs, corrupted anatomy, duplicate near-identical generations, inconsistent light direction, or source files that are only enlarged runtime images.
