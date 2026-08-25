# Gameplay Pacing

## Chapter loop

Each chapter now contains six combat encounters:

1. Wave 1
2. Wave 2
3. Wave 3
4. Wave 4 — late-chapter pressure ramp
5. Chaos Gate — guaranteed pre-boss durability/pressure check
6. Boss — chapter climax, Core Shard source and chapter-break point

This replaces the earlier three-wave -> boss loop. The goal is to extend play through more recruit, merge and survival decisions instead of simply inflating every enemy HP value.

## Existing elite system

Berserk, Bulwark and Siege elites remain a separate system. From chapter 3, one of the first three waves receives the deterministic rotating elite modifier and its dedicated telegraph/reward profile.

The Chaos Gate does not replace or duplicate those modifiers. It is a guaranteed fifth-wave pressure stage with the normal enemy identity but stronger chapter-local tuning.

## Late-wave tuning

Waves 1–3 retain their existing chapter scaling and elite behavior. The added late waves use bounded multipliers after normal chapter/elite scaling:

| Stage | HP | Damage | Attack interval | Coin reward | Display scale |
| --- | ---: | ---: | ---: | ---: | ---: |
| Wave 4 | 1.18x | 1.06x | 0.96x | 1.12x | 1.03x |
| Chaos Gate | 1.45x | 1.12x | 0.92x | 1.38x | 1.07x |

Attack interval multipliers below 1.0 mean faster attacks.

## Economy intent

Two extra encounters add coin sources because the longer chapter should create additional recruit and merge decisions. The Chaos Gate payout is intentionally higher so the extra duration is productive progression rather than grind.

No mandatory ad was added. Interstitial policy remains at the natural break after the boss.

## Save compatibility

Save schema v8 expands `EncounterStep` from `0..3` to `0..5`.

Historical v7 `step=3` always represented a boss. Migration maps it to the new boss step (`5`) while preserving target HP, board state, currencies, upgrades, collection and onboarding state. Historical wave steps `0..2` remain unchanged. New v8 `step=3` and `step=4` represent Wave 4 and Chaos Gate respectively.

## Playtest targets

Track during the first external balance pass:

- clean-start time to first boss;
- median chapter duration;
- fortress failure rate by Wave 4, Chaos Gate and Boss;
- recruit and merge actions per chapter;
- how often an elite + Chaos Gate sequence causes unavoidable failure;
- whether the extra coin flow saturates the 12-slot board too quickly;
- whether T3 ascension becomes a meaningful long-session sink before board saturation.
