# Mutation Album

## Goal

Mutation Album expands the existing 36-form Chaos Codex into 144 long-tail collection targets without requiring 108 additional base creature illustrations.

Each live creature form has four persistent discovery states:

1. Normal (`none`)
2. Charged
3. Prismatic
4. Crowned

A discovery is permanent even after the unit is merged away or removed from the active board.

## Progression

The Album uses finite, one-time milestone rewards:

| Variants | Reward |
| ---: | --- |
| 12 | 150 coins |
| 36 | 300 coins + 1 Core Shard |
| 72 | 500 coins + 2 Core Shards |
| 108 | 750 coins + 3 Core Shards |
| 144 | 1000 coins + 5 Core Shards |

Rewards are bounded and are collection incentives rather than a mandatory progression wall.

## Discovery rules

- Recruit: records the exact mutation state of the recruited T1 form.
- Merge: records the exact mutation state of the resulting upgraded form.
- Duplicate sightings do not increase completion.
- The existing Chaos Codex continues to track base-form discovery separately.

## Save migration

Save schema v11 adds `mutationAlbum`.

When v10 or older progress is migrated:

- every previously discovered Codex form receives Normal credit because legacy saves did not retain the rarity of historical discovery;
- non-Normal mutations currently visible on the saved board are also preserved;
- milestone rewards are not auto-claimed.

This is intentionally player-favorable while avoiding fabricated rare discoveries that cannot be proven from the legacy save.

## UI

The Chaos Codex remains the single collection surface:

- every creature card shows four compact variant markers;
- the Album section shows total variant completion and percentage;
- the next finite milestone and reward are visible in the same panel;
- a ready Album reward contributes to the existing Codex claim-ready HUD signal.

## Economy constraints

- No ads are required to progress the Album.
- Album rewards are finite; they do not create an infinite currency faucet.
- Core Shards retain their existing Core Lab sink.
- Coin rewards feed the existing recruit sink.
