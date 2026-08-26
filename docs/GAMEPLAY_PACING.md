# Gameplay Pacing

## Chapter loop

Each chapter contains six combat encounters:

1. Wave 1
2. Wave 2
3. Wave 3
4. Wave 4 — late-chapter pressure ramp
5. Chaos Gate — guaranteed pre-boss durability/pressure check
6. Boss — chapter climax, Core Shard source and chapter-break point

The longer loop creates more recruit, merge and survival decisions. It is now paired with an explicit campaign durability curve because playtesting showed that a strong early squad could otherwise coast through too many chapters unchanged.

## Existing elite system

Berserk, Bulwark and Siege elites remain a separate system. From chapter 3, one of the first three waves receives the deterministic rotating elite modifier and its dedicated telegraph/reward profile.

The Chaos Gate does not replace or duplicate those modifiers. It is a guaranteed fifth-wave pressure stage with the normal enemy identity but stronger chapter-local tuning.

## Late-wave tuning

The added late waves use bounded multipliers before the global campaign-pressure layer:

| Stage | HP | Damage | Attack interval | Coin reward | Display scale |
| --- | ---: | ---: | ---: | ---: | ---: |
| Wave 4 | 1.18x | 1.06x | 0.96x | 1.12x | 1.03x |
| Chaos Gate | 1.45x | 1.12x | 0.92x | 1.38x | 1.07x |

Attack interval multipliers below 1.0 mean faster attacks.

## Campaign pressure

After enemy/boss scaling, elites, chapter mutators and world pressure, `difficultyCurve.ts` adds a chapter-level pressure multiplier. Wave HP starts at 1.35x and reaches 4.41x by chapter 10; boss HP starts at 1.50x and reaches 4.20x by chapter 10. Endless pressure is bounded at 9.50x wave HP and 7.50x boss HP.

Damage and attack-speed escalation are intentionally much softer than HP escalation. This forces better boards without making normal enemies unfairly bursty. Coin compensation is also bounded so more HP cannot simply buy a proportional amount of extra recruits. Exact checkpoints live in `docs/BALANCE_V2.md`.

## Economy intent

Two extra encounters add coin sources because the longer chapter should create additional recruit and merge decisions. The Chaos Gate payout is intentionally higher so the extra duration is productive progression rather than grind.

No mandatory ad was added. Interstitial policy remains at the natural break after the boss.

## Save compatibility

No new save fields are required for the campaign-pressure curve. Existing saves immediately receive the new encounter values when the current target is reconciled or a new encounter starts.

Save schema v8 still uses `EncounterStep` `0..5`. Historical v7 `step=3` represented a boss and migrates to boss step `5`; historical wave steps `0..2` remain unchanged.

## Playtest targets

Track during external balance passes:

- clean-start time to first boss;
- median chapter duration and encounter TTK;
- fortress failure rate by Wave 4, Chaos Gate and Boss;
- recruit and merge actions per chapter;
- how many chapters one unchanged squad can coast through;
- how often an elite + Chaos Gate sequence causes unavoidable failure;
- whether coin flow saturates the 12-slot board too quickly;
- whether T3 ascension becomes a meaningful long-session sink before board saturation.
