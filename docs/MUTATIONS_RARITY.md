# Mutations & Rarity

## Goal

Mutations add a second progression axis to the merge board without replacing creature family identity or making early combat depend on a rare drop. A mutation belongs to an individual board unit, survives merges, changes combat output and receives a player-readable secondary silhouette/effect treatment.

## Rarity ladder

| Mutation | Rarity | Recruit rate | Damage | Attack interval | Approx. DPS |
| --- | --- | ---: | ---: | ---: | ---: |
| Stable (`none`) | Common | 80.0% | 1.00x | 1.00x | 1.00x |
| Charged | Rare | 15.0% | 1.08x | 0.94x | 1.15x |
| Prismatic | Epic | 4.5% | 1.20x | 0.90x | 1.33x |
| Crowned | Legendary | 0.5% | 1.35x | 0.86x | 1.57x |

The direct-roll weighted average is about **1.040x baseline DPS**, so rarity adds roughly 4% expected recruit power before merge promotion. Legendary remains a visible jackpot at about one direct roll per 200 recruits rather than a mandatory progression gate.

## Merge inheritance

A normal merge requires matching family + creature level below T3.

- Common + Common -> Common.
- Matching Charged + Charged -> Prismatic.
- Matching Prismatic + Prismatic -> Crowned.
- Crowned is the mutation ceiling.
- When mutation ranks differ, the stronger mutation survives the creature merge.
- A mutation never downgrades because of a merge.

This makes rarity useful even when a rare recruit is paired with a common duplicate and creates a long-tail target for assembling promoted mutations.

## T3 ascension

T3 is no longer a dead-end board state. Two T3 units can perform an **ascension merge** when family and mutation are both identical.

- Stable T3 + Stable T3 -> Charged T3.
- Charged T3 + Charged T3 -> Prismatic T3.
- Prismatic T3 + Prismatic T3 -> Crowned T3.
- Crowned T3 is the ceiling and cannot be consumed by another ascension.
- T3 units with different mutation IDs do not merge, preventing accidental loss of a valuable unit.

Ascension consumes one board slot exactly like a normal merge but keeps creature level at T3 and promotes rarity. It reuses the existing mutation combat modifiers, overlay art, merge animation and rarity reveal, so no new save field or migration is required.

The rule creates an endless-board pressure release and a deterministic route toward Legendary that complements the 0.5% direct recruit jackpot instead of replacing it.

## Visual language

Mutation readability cannot rely on a border alone.

- **Charged / Rare:** cyan energy coil around the body, top power node, lightning fins and a pulsing aura.
- **Prismatic / Epic:** crystal-wing secondary silhouette, emissive cyan/purple shards, double aura and a slow shimmer/sway.
- **Crowned / Legendary:** elevated chaos crown/halo, satellite star-orbs, gold energy language and a floating crown motion.

The base creature remains unobscured so Pinguino, Toastodilo, Lampalotl and Dishnail stay recognizable at board scale. Board badges use `R`, `E` and `L`; Chaos Codex includes the same rarity legend plus the T3 ascension rule.

All three overlay assets are original project-owned SVGs at 1024x1024 master size and 256x256 runtime preload size.

## Combat integration

Mutation modifiers are data-driven in `src/content/mutations.ts`.

- Damage is applied before the permanent Core Lab squad multiplier.
- Attack interval is modified per unit before attack-clock evaluation.
- Mutated projectiles inherit a rarity projectile color; Epic and Legendary impacts receive an additional compact burst.
- Minimum attack interval is clamped to 180 ms to keep future balance changes bounded.

## Recruitment and first session

Starter units are always Common. Mutation rolls happen on paid recruits after the existing protected first merge, so onboarding remains deterministic while the first recruit can still create a surprise rarity moment.

Roll boundaries are deterministic-testable and use one uniform random sample per recruit.

## Persistence

Adding per-unit mutation state changed the durable board schema from **v6 to v7**. T3 ascension does not add any new persisted field and therefore remains on v7.

- v1-v5 follow the existing migration chain.
- v6 boards migrate to v7 with `mutation: "none"` on every legacy unit.
- v7 requires a valid mutation ID on each non-empty board slot.
- Unknown mutation values are rejected rather than silently accepted.

No currency or collection progress is reset by the migration.

## Analytics

`first_merge`, `merge` and `recruit` include the bounded mutation ID. T3 ascension travels through the existing `merge` event with level `3` and the promoted mutation, so the progression can be measured without introducing high-frequency combat telemetry.

## IP / provenance

Mutation names, visual props and overlay art are original to Brainror Game and deliberately avoid recognizable franchise, branded, celebrity or existing named meme elements. Asset provenance is recorded in `public/assets/manifest.json`.
