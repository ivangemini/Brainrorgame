# Art Direction Bible

## Target look

High-quality stylized 2D/2.5D cartoon art with exaggerated silhouettes, soft volume, clean materials, strong rim/shape separation and punchy readable expressions. The result should feel like a polished mobile game key visual brought into gameplay, not flat clip-art and not photoreal AI imagery.

## Visual language

- Chunky, rounded, appealing forms.
- Clear silhouette first; internal detail second.
- Exaggerated scale differences between units and bosses.
- Controlled asymmetry and comedic props.
- Soft painted gradients plus crisp shape edges.
- Expressive eyes/mouth/posture when a face exists.
- Material response should be understandable: fur, rubber, metal, glass, slime, pastry, etc.
- Backgrounds support gameplay contrast and never compete with units.

## Character readability

A character must be recognizable:

1. as a black silhouette;
2. at ~96 px tall on a phone;
3. without reading its name;
4. from one dominant visual joke/concept.

Avoid adding micro-details purely to make generated art look "expensive". If details disappear at gameplay scale, they must not carry identity.

## Rarity language

Rarity should affect more than a border:

- Common: simple silhouette, restrained accents.
- Rare: one stronger prop/material/effect.
- Epic: stronger secondary silhouette, emissive accents, richer VFX.
- Legendary: unique crown/halo/energy language, more elaborate animation and reveal.
- Secret: intentionally surprising silhouette/effect treatment, but still coherent with the universe.

## Resolution policy

Master/source targets:

- Standard creature: >= 2048×2048 transparent source.
- Boss: 3072–4096 px long edge when composition warrants it.
- Key art/store hero: 4096 px long edge preferred.
- Environment/background master: >= 3840×2160.
- UI icons: vector when suitable or >= 1024×1024 raster master.

Runtime exports are purpose-sized. Never upscale runtime art to meet these numbers. Keep the high-resolution source and export down.

## Runtime rendering

- Use high-DPI rendering with sensible devicePixelRatio caps.
- Prefer texture atlases for production sprites.
- Prefer WebP/AVIF for opaque/appropriate images and PNG/WebP alpha where supported and visually safe.
- Keep texture dimensions within mobile GPU budgets; 2048 atlases are the safe default, 4096 only where validated.
- Never globally blur or oversharpen assets to hide bad source art.

## Composition

Boss encounter framing should communicate hierarchy immediately: boss occupies a materially larger visual mass than player units. UI must preserve a clear combat stage and avoid covering faces/telegraphs.

## Rejection criteria

Reject an asset if it has any of the following:

- malformed anatomy/props that read as generation errors;
- inconsistent perspective versus the set;
- muddy edge quality;
- accidental text/glyphs/watermarks;
- identity too close to a protected meme/brand/celebrity;
- resolution insufficient for intended presentation;
- lighting/material style inconsistent with the established set;
- silhouette that collapses at mobile scale.
