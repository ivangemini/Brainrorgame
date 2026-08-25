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

The Anomaly Hunt recruit fields answer whether visible pity is actually reducing bad-luck tails, how often hard guarantees fire, and whether secret Crowned outcomes cluster at the intended late-signal range. They are bounded gameplay state only and contain no player identifier.

## Failure / balance signals

- `fortress_failed`
- encounter completion duration
- fortress HP remaining
- chapter and encounter step
- creature family + mutation distribution on progression events
- recruit mutation outcomes segmented by pre-roll Anomaly Charge / Crown Signal and guarantee state

## Event quality rules

- Event names are snake_case and must be added to the typed union before use.
- Do not rename or repurpose an existing event after launch; add a new version/event if semantics change materially.
- High-frequency combat primitives such as every shot/hit are intentionally not tracked.
- Telemetry is best-effort and may never block or crash gameplay.
- Analytics vendor calls stay behind platform/adapters; scenes only know the typed game event contract.

## Web development sink

`WebAdapter` dispatches browser `CustomEvent` events named `brainror:analytics`. This sends no network traffic by itself and makes events inspectable by local tooling/tests. Production platform adapters can map the same typed events to approved analytics providers.
