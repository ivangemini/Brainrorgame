# Ascension / Prestige Core

## Purpose

Ascension is the permanent meta loop after the authored three-world campaign. It starts in Endless Rift and converts new depth records into a bounded permanent currency, Chaos Stars. The system is designed to create branch-priority decisions instead of repeating the same campaign with only larger numbers.

This document describes the deterministic core introduced before runtime/save wiring.

## Unlock and anti-farm economy

- First Ascension unlock: Chapter 21.
- Additional reward milestones: every +5 chapters: 26, 31, 36, ...
- Milestone `n` defines cumulative lifetime Chaos Stars as `n × (n + 1) / 2`.
- Chapter 21 therefore pays 1 lifetime Star, Chapter 26 raises lifetime earned to 3, Chapter 31 to 6, Chapter 36 to 10, and so on.
- An Ascension only pays the difference between the milestone cumulative total and `lifetimeChaosStars` already earned.
- Repeating a reset at the same or shallower record pays zero and is blocked as `push-deeper`.
- Ascension is blocked while a Weekly Chaos attempt is active so a reset cannot mutate the campaign underneath a 12-encounter weekly run.

Chaos Stars have one named sink: the Ascension tree. The authored tree costs exactly 24 Stars to complete. There is no ad source, random source or repeatable same-depth farm.

## Reset contract

An eligible Ascension returns campaign progression to Chapter 1 with:

- 160 starting coins;
- a cleared merge board;
- fortress refilled;
- chapter Chaos Draft perks cleared;
- Anomaly/Crown pity reset unless Collection/Pity Memory changes the retained ratio.

The reset explicitly preserves:

- Core Lab upgrades and Core Shards;
- daily retention state;
- collection/achievements;
- Mutation Album discoveries and claims;
- onboarding completion;
- Ascension progress/tree purchases.

This keeps collection-critical progress permanent and prevents the Prestige layer from invalidating existing long-tail goals.

## Ascension tree

Each branch has three sequential nodes costing 1, 2 and 3 Stars. A player must purchase the prior node in the same branch before the next tier. Full branch cost is 6 Stars; full tree cost is 24.

### Merge

1. **Seed Cache** — new Ascension starts with 2 Recruit credits.
2. **Merge Echo** — every 8th merge returns 1 Recruit credit.
3. **Mutation Catalyst** — first tier-3 merge each chapter gets a mutation boost.

### Combat

1. **Last Stand** — once per Ascension, lethal fortress damage leaves 1 HP.
2. **Boss Window** — boss opening attack is delayed by 1.5 seconds.
3. **Victory Repair** — boss defeats repair 20% of fortress maximum HP.

### Chaos

1. **Chaos Reroute** — one Chaos Draft reroll each chapter.
2. **Chaos Bank** — 25% of Chaos Energy carries through chapter transitions.
3. **Fourth Door** — every fifth chapter offers one extra Chaos Draft choice.

### Collection

1. **Pity Memory** — retain 50% of Anomaly Charge and Crown Signal through Ascension.
2. **Album Cache** — first new Mutation Album discovery each Ascension grants 1 Core Shard.
3. **Signal Map** — reveal one currently undiscovered Album target as a hunt lead.

These effects intentionally change rules, resource timing or information rather than only applying permanent DPS/HP percentages.

## Persistence contract for runtime wiring

The save schema integration should persist:

- `chaosStars` — unspent balance;
- `lifetimeChaosStars` — immutable anti-farm source ledger;
- `ascensions` — bounded count used for UI/analytics only;
- `highestResetChapter` — best chapter at which a reset occurred;
- `purchasedNodes` — unique stable node IDs with prerequisite validation;
- `lastAscendedAt` — timestamp for UI/telemetry, not reward calculation.

Parser requirements:

- `chaosStars <= lifetimeChaosStars`;
- node IDs must be authored and unique;
- prerequisites must be present;
- sum(node costs) + current balance may not exceed lifetime earned Stars;
- migration from the pre-Ascension save creates default zero progress and never invents retroactive Stars from an old chapter. Players must explicitly Ascend after migration so the destructive reset remains a conscious action.

## Runtime integration checklist

The deterministic core is intentionally scene-independent. Runtime wiring must still:

1. add Ascension progress to the versioned save and migration;
2. add an Ascension panel/tree surface and confirmation flow;
3. apply the reset contract to GameScene state;
4. consume branch effects at Recruit/merge/combat/Chaos Draft/Anomaly/Album boundaries;
5. add low-frequency typed analytics for preview/open, completed Ascension and node purchase;
6. run the full `npm run verify` pipeline and a running-build QA sweep before marking the Roadmap S-tier items complete.

No roadmap checkbox should be marked complete until this wiring is present and verified.
