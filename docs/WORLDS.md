# Worlds and Biomes

Brainror Merge uses authored world bands to turn the endless chapter number into visible long-session progression. World identity is derived from the persisted chapter number, so the system does not require a new save schema.

## World 1 — Candy Crater

- Chapters: 1–5.
- Role: onboarding/baseline world.
- Pressure: neutral HP, damage, cadence, rewards and Chaos Energy gain.
- World rule: **Sugar Baseline**.
- Finale bonus at Chapter 5: +300 boss coins and +2 bonus Core Shards.
- Art: dark candy-crater arena with warm moon, violet hills and a readable central combat bowl.

## World 2 — Neon Sewer

- Chapters: 6–10.
- Role: tempo/ability world.
- Pressure: 0.96× HP, 1.05× damage, 0.90× attack interval and 1.12× rewards.
- Chaos Energy: 1.18× gain from crew hits and fortress pressure.
- World rule: **Voltage Current**.
- Finale bonus at Chapter 10: +520 boss coins and +3 bonus Core Shards.
- Art: cyan drainage channels, industrial wall rings and glowing water lanes.

The biome intentionally produces more active-ability casts while making enemy telegraphs arrive faster. It should feel busier rather than merely tankier.

## World 3 — Appliance Wasteland

- Chapters: 11–15 authored progression; Chapter 16+ remains in this biome as endless endgame until more worlds ship.
- Role: heavy-pressure/endgame world.
- Pressure: 1.18× HP, 1.10× damage, 1.02× attack interval and 1.18× rewards.
- Chaos Energy: 0.92× gain.
- World rule: **Scrap Armor**.
- Finale bonus at Chapter 15: +850 boss coins and +5 bonus Core Shards.
- Art: rusted appliance silhouettes, warm dust, scrap rails and a dark arena bowl.

The biome makes shield/weak-point timing and chapter builds more important by reducing the value of passive waiting.

## Presentation

`GameHud` owns a biome backdrop layered above the legacy fallback background and below later-created combat/UI objects. Changing chapter across a world boundary swaps the texture immediately and shows a short world-title/rule transition. The HUD displays the current world short name and local stage (1/5–5/5). After Chapter 15 it displays an endless sector count.

## Stacking order

Encounter base scaling -> elite/late-wave pressure -> chapter mutator -> world pressure -> boss phase runtime.

Chaos Energy gain stacks multiplicatively:

`base energy × Chaos Draft capacitor × world energy multiplier`.

World-finale coins are part of the boss encounter reward and therefore still benefit from the existing bounty multipliers. Core Shard completion bonuses are added by the boss reward function and cannot be multiplied by ads or coin upgrades.

## Save compatibility

No save migration is required. `chapter` remains the canonical progression key. The world, stage, biome modifiers, background and completion status are all deterministic derived state.
