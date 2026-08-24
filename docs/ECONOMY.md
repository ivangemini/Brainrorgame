# Economy & Permanent Progression

## Currencies

### Coins — session progression
Sources: normal-wave kills and boss kills. Sink: recruiting new tier-1 creatures for 20 coins. Bounty Coil increases encounter coin rewards but does not create Core Shards.

### Core Shards — permanent progression
Source: bosses only. Chapter 1–5 bosses drop 1 shard, 6–10 drop 2, 11–15 drop 3, and so on up to 8 per boss. Sink: permanent Core Lab upgrades.

The first boss always funds one level-1 upgrade. This is intentional: the permanent-progression fantasy is demonstrated during the first session instead of being hidden behind grind.

## Upgrade tracks

| Track | Effect per level | Max | Costs by current level |
| --- | --- | ---: | --- |
| Crew Reactor | +8% crew damage | 10 | 1, 2, 3, 5, 7, 10, 14, 19, 25, 32 |
| Fortress Plate | -6% incoming damage | 8 | 1, 2, 3, 5, 7, 10, 14, 19 |
| Bounty Coil | +10% coin rewards | 10 | 1, 2, 3, 5, 7, 10, 14, 19, 25, 32 |

Fortress damage reduction is hard-capped at 48%. Damage and coin upgrades are additive within their own track, producing +80% damage and +100% coin rewards at max level.

## Design intent

- One currency forces an understandable choice instead of three disconnected grind bars.
- Power ends fights faster; Armor improves survivability; Bounty increases board growth. These are materially different play priorities.
- Shards are not sold or ad-gated in this phase. Rewarded-ad experiments come later and must not undermine the first-session guaranteed upgrade.
- Balance values are data-driven in `src/systems/metaProgression.ts` so live tuning does not require rewriting gameplay flow.
