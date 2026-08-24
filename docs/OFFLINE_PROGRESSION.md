# Offline Progression

## Player promise

Returning players receive a useful coin reward without the game pretending that bosses were defeated while they were away. Offline progression accelerates board building; active play remains required for chapters and Core Shards.

## Rules

- No reward for absences shorter than 2 minutes, avoiding refresh/reload spam.
- Maximum credited absence is 6 hours.
- Offline rewards grant **coins only**.
- No Core Shards, encounter completion, boss kills, board mutation or fortress healing occurs offline.
- Reward scales conservatively with saved chapter and Bounty Coil level.
- The same calculation is used for a full reload and for returning from a backgrounded tab.
- Reward is added to state and persisted before the popup is dismissed, preventing repeat-claim reload exploits.

## Formula

`coins/min = (0.91 + min(chapter,25)*0.12) * bountyMultiplier`

At chapter 1 with no upgrades, one hour away yields about 61 coins. The six-hour cap yields enough recruits to make returning satisfying while remaining far below the value of active boss/Core Shard progression.

## Monetization boundary

The free offline reward is never ad-gated. A future optional rewarded-ad `x2` can be tested through `PlatformAdapter` only after analytics exist; the baseline reward must not be reduced to manufacture ad pressure.
