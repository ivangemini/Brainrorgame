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

The first two chapters remain unchanged. Starting in chapter 3, exactly one of the three normal waves is elite. Elite position and modifier are deterministic so difficulty can be reproduced in tests and analytics.

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

## Pacing constraints

- No elite fights during onboarding or chapters 1–2.
- Only one elite wave per chapter.
- Elite reward multiplier must remain meaningfully above its pressure increase.
- Attack interval has a 1450 ms elite floor to keep telegraphs readable on mobile.
- Boss cadence and boss rewards are unaffected by elite-wave rules.
- Save schema remains v7 because neither system adds persisted state.

## Future extensions

This system is deliberately data-driven. Later balance passes can add a fourth elite modifier, world-specific elite schedules, family counters or temporary chapter mutators without branching core encounter code.
