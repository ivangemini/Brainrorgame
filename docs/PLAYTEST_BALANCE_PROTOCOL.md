# Launch Playtest & Balance Protocol

## Purpose

Turn the launch candidate into a measurable release candidate. This protocol is the single source of truth for external playtest, first-session QA, balance decisions and release acceptance.

## Test matrix

Run the same fresh-save path on each class:

1. Desktop Chromium, 1920x1080 or comparable.
2. Desktop Safari/Firefox class browser where available.
3. Mid-range mobile Chromium/WebView class device, portrait.
4. iOS Safari class device, portrait.

For each class test both EN and RU at least once. Use `?lang=en` / `?lang=ru` for deterministic localization QA.

## Fresh-save scripted run

A tester should complete, without coaching from the developer:

1. Load from a clean save and reach interactive board.
2. Understand recruit -> merge -> combat without external explanation.
3. Perform first merge.
4. Finish first normal encounter.
5. Reach and fight the first boss.
6. Open Daily Chaos and understand claim/mission affordances.
7. Open Chaos Codex and inspect discoveries + achievements.
8. Open Core Lab and understand at least one upgrade.
9. Exercise Chaos Draft when presented.
10. Background/reload the game and confirm persistence/offline flow.
11. Trigger one ad-backed flow where the host platform permits it.
12. Continue until either chapter 5 is reached or 20 minutes elapse.

## QA capture

For every run record:

- platform/browser/device class;
- language;
- viewport/orientation;
- time to first meaningful interaction;
- time to first merge;
- time to first encounter completion;
- time to first boss start and result;
- chapter reached at 5, 10 and 20 minutes;
- whether the player understood Recruit, Merge, Draft, Daily, Codex and Core Lab without explanation;
- any clipped/overlapping/untranslated text;
- any invisible, tiny or ambiguous tap target;
- any save/reload, audio, ad, focus or orientation failure;
- subjective difficulty 1-5 after first boss;
- one sentence: "what would make you stop playing now?".

## Severity

- P0: crash, lost/corrupt save, impossible progression, game cannot start. Release blocker.
- P1: core action cannot be understood/completed, broken ad return, severe mobile layout, progression/economy exploit. Release blocker.
- P2: material friction, misleading copy, localized overflow, poor boss spike, weak reward feedback. Fix before submission when reproducible.
- P3: cosmetic/polish issue with no meaningful effect on completion. Can ship only when explicitly accepted.

## First-session balance guardrails

These are launch-candidate guardrails, not fabricated telemetry results. Change them only from observed playtest/production data.

- First meaningful interaction: target <= 15 s.
- First merge: target <= 45 s for a new player.
- First encounter completion: target <= 2 min.
- First boss reached: target 4-8 min.
- First boss should feel threatening but readable; repeated fresh-save failure is a balance defect.
- No mandatory idle wall should stop an engaged player in the first 10 min.
- A fresh player should encounter at least two distinct progression decisions inside 10 min.
- Rewarded ads must remain optional acceleration/recovery, never required to make the scripted run viable.

## Balance decision rules

Do not tune from one anecdote. Aggregate the external runs and segment at minimum by desktop/mobile and EN/RU.

Prioritize in this order:

1. P0/P1 correctness and comprehension.
2. First-boss completion/failure distribution.
3. Time-to-first-merge and time-to-first-boss.
4. Fortress failure clusters by chapter/encounter step.
5. Economy stalls and recruit/merge progression pace.
6. Draft/Core Lab choice concentration.
7. Mutation/Anomaly Hunt outcomes.
8. Cosmetic polish.

Prefer small isolated parameter changes. Never change enemy HP, player damage and economy rewards simultaneously for the same observed problem; otherwise attribution is lost.

## Telemetry mapping

Existing typed analytics already provides the core machine signals:

- `session_start` -> session/return context;
- `first_merge` -> onboarding speed;
- `encounter_start` / `encounter_complete` -> encounter and boss funnel;
- `fortress_failed` -> difficulty spikes;
- `meta_upgrade_purchase` -> Core Lab adoption;
- `daily_reward_claim` / `daily_mission_claim` -> retention feature adoption;
- `offline_reward` -> return loop;
- recruit/merge mutation fields -> rarity and Anomaly Hunt balance.

Manual playtest timing complements telemetry; do not add PII or free-form player identity to analytics.

## Release acceptance

A candidate can be called externally playtested only after real human/device runs exist. Automated CI cannot truthfully satisfy that requirement.

Before portal submission require:

- zero open P0/P1 findings;
- all scripted steps completable on representative desktop and mid-range mobile;
- EN/RU low-frequency UI sweep complete;
- persistence/reload smoke pass;
- first-boss and early economy reviewed from observed data;
- final screenshots captured from the exact accepted candidate;
- `npm run verify` green on the accepted commit.

## Result template

Copy this block per run:

```text
Candidate SHA:
Date:
Device/browser:
Language:
Viewport:
First interaction:
First merge:
First encounter complete:
First boss start/result:
Chapter @ 5m / 10m / 20m:
Recruit understood: yes/no
Merge understood: yes/no
Draft understood: yes/no/not seen
Daily understood: yes/no
Codex understood: yes/no
Core Lab understood: yes/no
Persistence/reload: pass/fail
Localization/layout: pass/fail + notes
Difficulty (1-5):
Stop-playing reason:
Findings (P0-P3):
```
