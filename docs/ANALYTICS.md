# Analytics Contract

## Goal

Measure acquisition-to-retention quality without collecting player PII. Gameplay code emits a small stable event vocabulary through `PlatformAdapter.trackEvent`. Platform adapters decide how those events reach the platform/vendor analytics backend.

## Privacy rules

Do not put names, email addresses, IP addresses, advertising identifiers, raw user-agent strings, free-form user text, exact location, device fingerprints, save payloads or account IDs into game analytics events.

Use aggregate gameplay state only: chapter, encounter step, elapsed duration, reward amount, upgrade level, bounded creature family/mutation IDs and similar bounded values.

## Core funnel

1. `session_start`
2. `first_merge`
3. `encounter_start`
4. `encounter_complete`
5. first boss completion (derived from `encounter_complete.kind=boss`)
6. `meta_upgrade_purchase`
7. return-session `session_start.returning=true`

`first_merge`, `merge` and `recruit` include the current bounded mutation ID (`none`, `charged`, `prismatic`, `crowned`) so rarity acquisition and merge promotion can be balanced without tracking every combat hit.

## Retention signals

- `offline_reward`
- `daily_reward_claim`
- `daily_mission_claim`
- repeat `session_start`
- mutation mix on `recruit` and `merge`
- Anomaly Hunt context on `recruit`: `anomalyChargeBefore` (0–17), `crownSignalBefore` (0–69), `guaranteed` and `secret`
- Weekly Chaos start, best-depth milestones, chapter build choices, attempt outcomes and claims

The Anomaly Hunt recruit fields answer whether visible pity is actually reducing bad-luck tails, how often hard guarantees fire, and whether secret Crowned outcomes cluster at the intended late-signal range. They are bounded gameplay state only and contain no player identifier.

## Weekly Chaos Run

Weekly events intentionally operate at attempt/milestone granularity instead of combat-hit granularity:

- `weekly_run_start`
  - `weekId`
  - bounded attempt count
  - current chapter
  - three bounded weekly rule IDs
- `weekly_run_milestone`
  - `weekId`
  - newly achieved best milestone depth
- `weekly_run_build_choice`
  - `weekId`
  - current weekly depth
  - chapter
  - bounded Chaos Draft perk ID
- `weekly_run_end`
  - `weekId`
  - `completed` or `failed`
  - final depth
  - weekly best depth
- `weekly_run_claim`
  - `weekId`
  - milestone target
  - bounded coin/Core Shard reward amounts

These events answer five product questions: how many players opt into the weekly loop, where attempts terminate, whether retries push best depth, which bounded build choices correlate with deeper runs, and whether reached milestone rewards are collected. They do not include board snapshots, save data, player IDs, free-form text or per-hit telemetry.

A repeated attempt does not emit `weekly_run_milestone` for a depth the player already surpassed earlier in the same week; the event represents a new weekly best milestone rather than a repeated checkpoint crossing.

## Failure / balance signals

- `fortress_failed`
- encounter completion duration
- fortress HP remaining
- chapter and encounter step
- creature family + mutation distribution on progression events
- recruit mutation outcomes segmented by pre-roll Anomaly Charge / Crown Signal and guarantee state
- Weekly Chaos failed depth and best depth, segmented by deterministic weekly rule IDs from the corresponding start event

## Event quality rules

- Event names are snake_case and must be added to the typed union before use.
- Do not rename or repurpose an existing event after launch; add a new version/event if semantics change materially.
- High-frequency combat primitives such as every shot/hit are intentionally not tracked.
- Telemetry is best-effort and may never block or crash gameplay.
- Analytics vendor calls stay behind platform/adapters; scenes only know the typed game event contract.
- Weekly event payloads use only bounded authored IDs and aggregate progression values.

## Web development sink

`WebAdapter` dispatches browser `CustomEvent` events named `brainror:analytics`. This sends no network traffic by itself and makes events inspectable by local tooling/tests. Production platform adapters can map the same typed events to approved analytics providers.
