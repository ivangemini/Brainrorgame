# Boss Hunt + Trophy Room

## Purpose

Boss Hunt is a deterministic weekly retention loop built on the existing authored boss roster. It does not create a second campaign and does not require server authority for core progression. Players repeatedly attack one empowered boss during the UTC week; damage persists between attempts and unlocks a finite reward track.

## Weekly rotation

- Hunt identity uses the same UTC ISO week identity as Weekly Chaos.
- Boss selection is a deterministic hash of the week id and a project-owned namespace.
- Every player receives the same authored boss for the week.
- A new Monday UTC rolls an old hunt into a fresh boss state.
- No leaderboard or anti-cheat authority is implied by this local deterministic mode.

## Persistent attempts

Each hunt stores:

- `huntId`;
- authored `bossId`;
- difficulty/trophy tier;
- `maxHp` and `hpRemaining`;
- attempt count;
- cumulative damage;
- best single-attempt damage;
- claimed reward milestones;
- defeated state.

Damage is clamped to remaining HP. Defeated hunts cannot be farmed for additional damage or duplicate milestone crossings.

## Difficulty and Trophy Room

Each authored boss has independent trophy progression:

1. **Normal** — first clear.
2. **Enraged** — next time that boss rotates after a Normal trophy.
3. **Nightmare** — next step after Enraged; Nightmare remains the repeat ceiling.

Difficulty changes boss HP rather than creating a new boss asset:

- Normal ×1.00 HP;
- Enraged ×1.55 HP;
- Nightmare ×2.20 HP.

The weekly health baseline uses the existing authored boss scaling at the late-game benchmark and then applies the trophy-tier multiplier.

## Finite reward track

Rewards use existing currencies only:

| Cumulative damage | Reward |
| ---: | --- |
| 25% | 220 coins |
| 50% | 360 coins + 1 Core Shard |
| 75% | 520 coins + 1 Core Shard |
| 100% | 800 coins + 2 Core Shards |

Each milestone is claimable once per hunt. Boss Hunt therefore adds no new currency and feeds existing Recruit/Core Lab sinks.

## Analytics

Low-frequency typed events are defined for:

- aggregate attempt result: boss, tier, attempt index, attempt damage, total damage and bounded completion percent;
- newly crossed 25/50/75/100 milestone;
- finite reward claim;
- trophy upgrade.

No individual hits, board snapshots, raw saves, player identifiers or free-form text are tracked.

## Persistence / UI integration still required

The deterministic system layer is implemented and tested. Before the roadmap Boss Hunt / Trophy Room items can be marked complete, runtime integration must still:

1. persist Boss Hunt and Trophy Room in the versioned game save;
2. expose a player-facing Hunt/Trophy Room panel;
3. define how one campaign combat attempt contributes bounded aggregate damage without making ads mandatory;
4. award claimed coins/Core Shards into the live economy;
5. emit the typed events at those boundaries;
6. pass the full `npm run verify` and running-build QA sweep.
