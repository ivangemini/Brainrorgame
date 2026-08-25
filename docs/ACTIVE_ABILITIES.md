# Active combat abilities

## Goal

Add a real-time decision layer on top of merge composition without turning the game into a high-APM action game. The board still defines long-term strategy; active abilities create short tactical windows during each encounter.

## Shared resource

- `CHAOS ENERGY` is capped at 100.
- Each crew attack contributes 1 energy while combat is active.
- Each fortress hit contributes 4 comeback energy.
- Energy, cooldowns and temporary buffs reset when a new encounter starts.
- Runtime ability state is not persisted, so save schema remains v8.

This makes ability cadence depend on the actual fight instead of a passive wall-clock timer and gives a losing player a small recovery mechanism.

## Unlock rule

An ability is available only while its matching family has Crew Synergy Tier I or higher. The same Tier I / II / III composition investment that improves passive synergy also scales the active effect.

| Family | Ability | Cost | Cooldown | Tier scaling |
| --- | --- | ---: | ---: | --- |
| Pinguino | Slipstream Burst | 42 | 14s | crew attack interval ×0.78 / ×0.72 / ×0.66 for 4.0 / 4.6 / 5.2s |
| Toastodilo | Crust Guard | 38 | 16s | incoming fortress damage ×0.78 / ×0.68 / ×0.58 for 4.8 / 5.4 / 6.0s |
| Lampalotl | Neon Overdrive | 50 | 16s | crew damage ×1.25 / ×1.38 / ×1.55 for 4.0 / 4.6 / 5.2s |
| Dishnail | Quasar Jackpot | 46 | 18s | combat coin rewards ×1.30 / ×1.50 / ×1.80 for 5.0 / 5.8 / 6.6s |

## Stacking order

Active buffs multiply with existing systems instead of replacing them:

- attack cadence = base × mutation × Pinguino passive × Slipstream Burst;
- crew damage = base × mutation × Lampalotl passive × Neon Overdrive × Core Lab power;
- fortress damage = encounter damage × Core Lab armor × Toastodilo passive × Crust Guard, with a hard lower bound;
- coin rewards = encounter reward × Core Lab bounty × Dishnail passive × Quasar Jackpot.

## UI

- Four compact circular ability controls sit at the left/right edges of the combat area, outside the enemy silhouette and merge grid.
- The shared energy bar sits below the enemy health region.
- Buttons show required Tier I lock state, energy cost, cooldown and current synergy tier.
- Active temporary windows are surfaced next to the energy label.
- Successful casts use accent-color ring/burst feedback and a short textual callout.

## Balance intent

- A player cannot spam all four abilities from one full bar: costs force prioritization.
- Independent cooldowns prevent a single family from monopolizing every energy cycle.
- Defensive energy from fortress hits reduces fail-state snowballing.
- Quasar Jackpot rewards timing near a kill rather than permanently inflating the economy.
- Encounter reset prevents hoarding energy indefinitely across the five-wave chapter loop.

## Telemetry follow-up

For external playtests, measure ability usage per encounter, energy overflow frequency, fortress failure rate with/without Crust Guard and reward inflation during Quasar Jackpot. Add analytics only when the first balance pass defines the exact event questions.
