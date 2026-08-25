# Gameplay Depth

This layer adds decisions and encounter variety without changing the first-session promise or creating portal-specific gameplay forks.

## T3 Ascension

Max-tier creatures remain useful instead of becoming permanent board blockers.

Two T3 units merge only when **family and mutation are identical**. The creature stays T3 and mutation advances one rarity tier:

`Stable -> Charged -> Prismatic -> Crowned`

Legendary is the ceiling. Different-rarity T3 pairs swap normally rather than being consumed.

Why it exists:

- creates a deterministic long-tail goal beyond reaching T3;
- releases board pressure in long sessions;
- gives mutation rarity an active merge route instead of relying only on recruit RNG;
- reuses the existing mutation combat and visual system, so power growth remains legible.

## Elite Waves

The first two chapters remain unchanged. Starting in chapter 3, exactly one of the first three normal waves is elite. Elite position and modifier are deterministic so difficulty can be reproduced in tests and analytics.

| Modifier | Combat identity | HP | Damage | Attack interval | Reward |
| --- | --- | ---: | ---: | ---: | ---: |
| Berserk | fast pressure | 0.92x | 1.08x | 0.72x | 1.28x |
| Bulwark | endurance check | 1.55x | 0.92x | 1.08x | 1.35x |
| Siege | fortress threat | 1.12x | 1.42x | 1.05x | 1.32x |

Schedule begins:

- Chapter 3, wave 1 — Berserk.
- Chapter 4, wave 2 — Bulwark.
- Chapter 5, wave 3 — Siege.
- Chapter 6 repeats the cycle from wave 1 / Berserk.

Each elite receives a readable badge, altered accent/projectile language, a slightly stronger silhouette scale and modifier-specific telegraph choreography. The underlying enemy artwork stays coherent with the roster rather than duplicating every enemy into three recolors.

## Chapter Mutators

Starting in chapter 4, every complete chapter receives one deterministic global rule. Mutators apply after normal chapter scaling, elite scaling and late-wave pressure, so they stack predictably instead of replacing existing systems.

| Mutator | Identity | HP | Damage | Attack interval | Coin reward |
| --- | --- | ---: | ---: | ---: | ---: |
| Turbo Swarm | speed trial | 0.96x | 1.00x | 0.82x | 1.24x |
| Heavy Weather | endurance chapter | 1.28x | 1.10x | 1.04x | 1.32x |
| Gold Rush | high-value pressure | 1.10x | 1.06x | 0.95x | 1.46x |

The rotation is `Turbo Swarm -> Heavy Weather -> Gold Rush`, then repeats. Chapters 1–3 are deliberately protected so onboarding, the first boss loop and the first elite introduction remain stable.

Mutators affect all five waves and the boss in their chapter. Attack cadence still respects the 1450 ms telegraph floor, preserving reaction readability on mobile. Mutators are derived from chapter number and therefore add no persisted state or save migration.

## Pacing constraints

- No elite fights during onboarding or chapters 1–2.
- Only one elite wave per chapter.
- Elite reward multiplier must remain meaningfully above its pressure increase.
- No chapter mutator before chapter 4.
- Mutator rewards must compensate for their aggregate pressure rather than simply extending time-to-clear.
- Attack interval has a 1450 ms floor to keep telegraphs readable on mobile.
- Boss cadence and Core Shard rewards are unaffected by elite-wave or mutator rules.
- Save schema remains unchanged because these systems derive entirely from chapter/encounter position.

## Future extensions

The systems are deliberately data-driven. Later balance passes can add a fourth elite modifier, world-specific schedules, family counters or player-selectable mutator rerolls without branching core encounter code.
