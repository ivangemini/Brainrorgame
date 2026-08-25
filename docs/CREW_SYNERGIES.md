# Crew Synergies

## Goal

Crew Synergies make board composition a strategic layer instead of making family choice only a raw DPS profile. The system is derived from the live board, so it adds no new save payload or migration burden.

## Merge-stable family power

Each unit contributes power by tier:

- T1 = 1 power
- T2 = 2 power
- T3 = 4 power

This is intentionally merge-stable: two T1 units merge into one T2 without reducing family power, and two T2 units merge into one T3 without reducing it. Correct merging therefore never turns a synergy off.

Synergy tiers activate at:

- Tier I: 2 family power
- Tier II: 4 family power
- Tier III: 8 family power

## Family identities

| Family | Synergy | Tier I | Tier II | Tier III | Strategic use |
| --- | --- | ---: | ---: | ---: | --- |
| Pinguino | Slipstream Relay | 3% faster | 6% faster | 10% faster | Raises total squad attack cadence |
| Toastodilo | Crust Bastion | 4% less incoming | 9% less | 15% less | Extends fortress survival in long chapters |
| Lampalotl | Neon Cascade | +4% damage | +8% | +14% | Raises every projectile's damage |
| Dishnail | Quasar Lock | +5% coins | +10% | +18% | Accelerates recruit/merge economy |

Synergy effects multiply with mutation bonuses and permanent Core Lab upgrades rather than replacing them. Incoming-damage stacking retains a hard safety floor so armor cannot trivialize combat.

## Runtime/UI behavior

The synergy snapshot is recalculated whenever the board is rendered after recruit, move, swap, merge, ascension or save restore. The board header shows compact active labels such as `RELAY I • BASTION II`; when an active tier changes the label pulses once.

The runtime snapshot is derived state only. It is never persisted. Reloading an existing v8 save reconstructs the exact same bonuses from the saved board.

## Balance intent

The first two starter pairs naturally activate Relay I and Bastion I. This gives the onboarding squad a small amount of haste and survivability without changing tutorial actions. Later recruits create a real choice between concentrating one family toward Tier III or maintaining several Tier I/II bonuses.

No single Tier III bonus exceeds an 18% economy modifier or 15% defensive modifier; the offensive bonuses are similarly bounded. This keeps mutations, Core Lab upgrades and creature tier progression as the primary power sources.
