# Weekly Chaos Run

## Purpose

Weekly Chaos Run adds a repeatable, comparable retention challenge without requiring a server-authoritative second campaign or a large new art set. Each UTC ISO week selects the same three rule modifiers for every player. A run lasts at most 12 cleared encounters and uses the player's current board, campaign position, currencies and chapter build.

## Weekly identity

- Week identity is the UTC ISO week encoded as `YYYYWW`.
- The rule seed is derived only from the week id and a project-owned namespace string.
- Three unique rules are selected from the authored rule pool.
- Rule selection is deterministic and cached after first resolution.
- The week rolls at Monday 00:00 UTC.
- A stale saved weekly state is replaced with a fresh inactive state when the game rolls into a new week.

No remote authority is required for the core mode. A future leaderboard would require a separate integrity/server design and is not implied by this implementation.

## Run semantics

Weekly Chaos is an overlay on the normal campaign rather than a cloned game state.

Starting a run:

1. keeps the current board, currencies, upgrades, collection and chapter;
2. keeps current fortress HP, so starting the challenge cannot be used as a free heal;
3. resets the current enemy to full HP under the weekly HP modifier, so the first clear cannot be farmed by activating Weekly Chaos on a nearly defeated target;
4. starts at depth 0 and increments the weekly attempt count;
5. records one bounded `weekly_run_start` analytics event.

While active, every normal encounter clear advances Weekly depth by one. Campaign progression continues normally underneath the challenge. Chapter transitions, Chaos Draft choices and boss encounters therefore remain meaningful build decisions inside the weekly attempt.

At depth 12 the attempt completes and becomes inactive. The player's campaign continues from its current position.

Fortress failure ends the weekly attempt immediately while leaving the normal failure/revive flow intact. Enemy HP is reconciled back to the non-weekly maximum by preserving the existing health percentage, so an optional rewarded revive still preserves damage rather than granting or deleting encounter progress.

## Rule effects

Weekly rules can modify these bounded gameplay values:

- squad projectile damage;
- attack interval;
- fortress incoming damage;
- enemy maximum HP;
- combat coin rewards;
- Recruit price.

Current authored rules:

| Rule | Effect |
| --- | --- |
| Overclocked Crew | Crew attacks 10% faster; fortress incoming damage +8%. |
| Thick Static | Enemy HP +18%; combat coins +18%. |
| Glass Fortress | Squad damage +18%; fortress incoming damage +18%. |
| Price Spike | Recruit cost +20%; combat coins +15%. |
| Unstable Loot | Enemy HP +12%; squad damage +10%; combat coins +12%. |
| Cheap Trouble | Recruit cost -15%; enemy HP +15%. |

The three selected rules multiply together. Weekly modifiers are applied on top of existing mutation, meta-upgrade, crew-synergy, Chaos Draft and active-ability multipliers rather than replacing those systems.

## Rewards

Rewards are finite and claimable once per UTC week:

| Best depth | Reward |
| ---: | --- |
| 3 | 160 coins |
| 6 | 280 coins + 1 Core Shard |
| 9 | 420 coins + 1 Core Shard |
| 12 | 650 coins + 2 Core Shards |

`bestDepth` survives failed attempts for the current week. Replaying an already reached milestone does not emit another milestone event and cannot duplicate its reward.

Weekly Chaos introduces no new currency. Coins flow into Recruit and existing progression spending; Core Shards flow into Core Lab. This keeps the weekly loop bounded and avoids creating a live-ops currency before a dedicated sink exists.

## Ads and pacing

- No ad is required to start, advance or claim Weekly Chaos rewards.
- Existing optional rewarded revive remains available after fortress failure.
- Chapter interstitial requests are suppressed while a Weekly Chaos attempt is active so the 12-encounter challenge is not interrupted by an interstitial boundary.

## Save schema

Save v12 adds `weeklyChaos`:

- `weekId`
- `active`
- `depth`
- `bestDepth`
- `runsStarted`
- `claimedMilestones`

Migration from v11 and older creates a fresh inactive weekly state using the legacy save timestamp. Existing campaign, collection, Mutation Album, Anomaly Hunt, board and currencies are preserved.

Parsing rejects impossible weekly states such as an active run already at depth 12, claimed milestones above best depth, or malformed week identifiers.

## Analytics contract

Weekly analytics are low-frequency, bounded and contain no player identifiers:

- `weekly_run_start`: week id, attempt number, current chapter and the three bounded rule ids;
- `weekly_run_milestone`: newly achieved best milestone depth;
- `weekly_run_build_choice`: Chaos Draft perk choice while the attempt is active;
- `weekly_run_end`: completed/failed outcome, final depth and best depth;
- `weekly_run_claim`: claimed milestone target and bounded currency reward.

These signals answer whether players start the mode, where attempts fail, whether retries improve best depth, which chapter builds correlate with deeper runs and whether earned rewards are actually collected. Individual attacks/hits and raw board/save payloads are deliberately not tracked.
