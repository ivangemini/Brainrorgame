# Inter-wave Chaos Draft

## Goal

The five-wave chapter loop now develops a temporary build instead of repeating the same board state until the boss. Two short draft decisions break up combat, let players adapt to the chapter and create different tactical priorities without adding permanent inventory complexity.

## Checkpoints

A completed chapter contains two draft checkpoints:

1. after Wave 2, before Wave 3;
2. after Wave 4, before the Wave 5 Chaos Gate.

The next encounter is prepared and persisted before the draft opens, but combat stays paused until a perk is selected. This makes the draft safe across reloads and prevents the target state from advancing twice.

## Deterministic offers

Each checkpoint shows three perks. Offer order is deterministic from `chapter + checkpoint` and excludes perks already selected in the current chapter.

Reloading the game therefore does not reroll the offer. A player can hold at most two unique chapter perks.

## Perks

| Perk | Effect for the rest of the chapter |
| --- | --- |
| Impact Jelly | +9% squad damage |
| Tempo Worm | 8% faster crew attacks |
| Fortress Foam | 12% less fortress damage taken |
| Bounty Magnet | +18% combat coin rewards |
| Repair Moss | +7 extra fortress HP after every cleared non-boss wave |
| Chaos Capacitor | +25% Chaos Energy gain |

Chaos Capacitor keeps fractional internal energy so its +25% bonus is real over repeated attacks; the HUD still displays whole energy units.

## Stacking

Chapter perks multiply with the existing progression layers instead of replacing them:

- crew damage = base × mutation × Crew Synergy × Chaos Draft perk × active Overdrive × Core Lab power;
- attack cadence = base × mutation × Crew Synergy × Chaos Draft perk × active Slipstream;
- fortress damage = encounter damage × Core Lab armor × Crew Synergy × Chaos Draft perk × active Guard, subject to the existing lower bound;
- combat coins = encounter reward × Core Lab bounty × Crew Synergy × Chaos Draft perk × active Jackpot;
- Chaos Energy gain = combat-event gain × Chaos Capacitor.

## Chapter lifecycle

- Perks affect the remaining waves and boss in the current chapter.
- Both selected perks are cleared after the boss is defeated and before the next chapter starts.
- Draft choices do not survive into the next chapter.
- The system does not add a new permanent currency.

## Persistence

Save schema advances from v8 to v9.

v9 adds the bounded `chaosPerks` array with at most two valid, unique perk IDs. v1-v8 migrations preserve all existing progression and initialize the current chapter build as empty.

A save made while a draft is pending contains the already-prepared encounter step and current selected perk count. On reload, `needsChaosDraft()` reconstructs the pending checkpoint and shows the same deterministic offer.

## Balance intent

The player should make two meaningful decisions per chapter without turning the game into a long menu sequence. The first draft can correct an early weakness; the second can specialize for the Chaos Gate and boss. Offensive, defensive, economy, sustain and active-resource options all compete for the same two slots.

The first external balance pass should measure perk pick rates, boss win rate by perk pair, average chapter duration, coin inflation from Bounty Magnet, fortress failure reduction from Foam/Moss and Chaos Energy overflow with Capacitor.
