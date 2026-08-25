# First External Playtest Protocol

## Goal

The first external playtest is a pacing and comprehension pass, not a content-rating exercise. Do not tune the economy from one anecdotal run. Collect several comparable fresh-save sessions first, then adjust only the largest repeatable problems.

## Launch

Use a clean save and append `?playtest=1` to the build URL. `?qa=playtest` is equivalent.

The QA button exists only in this mode. It does not alter the save schema, combat math, RNG, ads or portal adapter behavior.

At the end of the run:

1. open `QA`;
2. choose `COPY JSON`;
3. save the report together with tester/device notes;
4. record whether the tester understood merge, recruit, Chaos Draft and active abilities without coaching outside the game.

## Minimum test routes

### Fresh first session

- start from an empty browser save;
- play through Chapter 1 boss, preferably into Chapter 2;
- do not tell the tester the optimal recruit/merge strategy;
- note the first moment of confusion or inactivity.

### Returning session

- reload an existing save during a normal wave;
- reload again from a Chaos Draft checkpoint;
- verify progress, selected perks and current encounter reconstruct correctly.

### Failure / monetization path

- allow the fortress to fail once;
- test free retry;
- when a real portal ad is available, test rewarded revive and/or offline double;
- verify ad cancellation/no-fill never removes the free path.

## Provisional pacing targets

These are guardrails for the first batch, not final balance requirements.

| Metric | Initial target |
| --- | --- |
| Onboarding complete | under 90 s |
| First boss start | 90 s – 4 min |
| Chapter 1 clear | 2 – 6 min |
| Normal-wave median TTK | 4 – 18 s |
| Chaos Gate TTK | 8 – 30 s |
| Chapter 1 boss TTK | 15 – 60 s |
| First fortress failure | preferably after onboarding |
| Active abilities | at least one understood/useful cast in a normal 10+ min run |
| Chaos Draft | both choices should feel meaningfully different |

A single value outside a range is not automatically a balance change. Prioritize patterns repeated across testers.

## Recorder fields

The session report contains:

- session duration and chapter span;
- onboarding completion time;
- first boss start / clear time;
- encounter starts/completions;
- average and median encounter duration;
- wave and boss average TTK;
- minimum and average fortress HP after victories;
- failures;
- recruit and merge counts;
- active ability use counts;
- Chaos perk selection counts;
- rewarded attempts/successes;
- interstitial requests;
- a bounded recent analytics event trace.

Active abilities are detected from cooldown start edges. Chaos perks are detected from additions to current chapter perks. The first sampled state is treated as a baseline so a restored save does not falsely count existing cooldowns/perks as new player actions.

## Tester notes to keep beside JSON

- device and browser;
- portrait/desktop layout;
- approximate age / familiarity with merge games if voluntarily supplied for the test;
- where the player first hesitated;
- whether they noticed Chaos Energy;
- whether they understood why a boss was shielded or weak;
- whether they wanted to continue after Chapter 1;
- any clipping, unreadable labels, missed taps or drag failures.

Do not collect names, emails or unrelated personal data in the playtest report.

## Decision rule after first batch

After at least several fresh runs, compare medians rather than fastest/slowest sessions. Fix in this order:

1. blocker or comprehension failure;
2. first-session pacing cliff;
3. unavoidable fortress failure;
4. recruit/economy dead zone;
5. ability/perk choice that is consistently ignored;
6. polish and minor number tuning.

Keep raw reports before changing balance so before/after cohorts remain comparable.
