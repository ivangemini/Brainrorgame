# Daily Retention Loop

The daily loop is designed to create a clear reason to return without blocking normal play or requiring ads.

## Daily calendar

- One free calendar claim per UTC day.
- Consecutive claims advance a seven-day streak.
- Missing a day resets the streak to day 1 rather than removing earned currency.
- Day 7 includes a Core Shard and then the streak cycles.

## Daily missions

Three missions reset at UTC rollover:

| Mission | Target | Reward |
| --- | ---: | ---: |
| Merge | 3 merges | 70 coins |
| Defeat | 6 enemies | 90 coins |
| Recruit | 3 recruits | 60 coins |

Counters are capped at their target and rewards can only be claimed once per day.

## Daily Chaos Chest

Claiming all three daily mission rewards cracks the Daily Chaos Chest. The chest is paid automatically together with the third mission claim, so it cannot become an extra forgotten button or be claimed twice.

- Requirement: claim all 3 mission rewards on the same UTC day.
- Bonus: **300 coins**.
- Daily total from missions + chest: **520 coins**.
- Chest progress is derived from the existing mission-claim flags, so no save-schema migration is required.
- UTC rollover clears mission claims and therefore resets chest progress automatically.

The chest deliberately pays soft currency rather than Core Shards. Core Shards remain attached to bosses, achievements, world finales and the seven-day streak, preserving their role as the slower meta-progression currency.

## UX rules

The Daily panel always shows `0 / 3` through `3 / 3` chest progress below the mission cards. Once the third mission is claimed, the panel changes to `CHEST CRACKED / BONUS CLAIMED`. The chest has no separate claim button: the reward is guaranteed with the final mission claim.

## Balance intent

The chest creates a completion gradient: a player who opens the panel for one easy mission can see a meaningful same-day target without being forced into a long session. All three objectives are actions already present in the core loop, so the system rewards normal play instead of creating side chores.
