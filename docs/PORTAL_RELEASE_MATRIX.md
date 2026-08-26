# Portal Release Package Matrix

## Rule

Screenshots and upload archives must come from the exact release-candidate SHA that passed external playtest. Do not use mock gameplay screenshots or an older build for final submission evidence.

## Shared candidate package

Prepare once from the accepted SHA:

- production web build;
- EN and RU smoke-tested runtime;
- privacy-safe analytics contract;
- project-owned/provenance-cleared runtime assets;
- title + short/long descriptions from approved store copy;
- square/icon creative where requested;
- landscape cover creative A and B;
- 5-8 clean gameplay screenshots with no debug UI;
- moderation notes and controls explanation;
- version/SHA record.

## Screenshot shot list

Capture at native-looking gameplay scale from the accepted candidate:

1. Early board: clear recruit + merge readability.
2. Merge payoff: upgraded creature and visible combat lane.
3. Boss encounter: boss, fortress and active combat readable simultaneously.
4. Chaos Draft: meaningful choice screen.
5. Chaos Codex: collection + achievement progression.
6. Daily Chaos: retention reward/mission surface.
7. Core Lab: persistent meta progression.
8. Mutation/Anomaly moment: visually distinctive rare outcome when naturally reproducible.

Capture at least one representative mobile portrait frame and one desktop/landscape frame for internal QA even if a portal only consumes one orientation.

## Yandex Games

Status: adapter, moderation checklist, EN/RU metadata, creative A/B and metadata validation are already present.

Final package gate:

- accepted production build;
- required Yandex metadata passes `release:check`;
- final screenshots from accepted SHA;
- selected cover variant based on qualified-start/retention test, not CTR alone;
- SDK/ad/pause/focus smoke test on portal preview;
- language and save persistence smoke test.

## CrazyGames

Status: adapter/build foundation exists.

Final package gate:

- production build using CrazyGames adapter path;
- SDK initialization smoke test;
- gameplay/ad lifecycle smoke test;
- responsive desktop + mobile browser check;
- final screenshots/thumbnail set from accepted SHA;
- portal metadata copied from approved canonical store copy and adjusted only for portal field limits.

## Poki

Status: adapter/build foundation exists.

Final package gate:

- production build using Poki adapter path;
- gameplay start/stop and commercial-break lifecycle smoke test;
- focus/audio recovery smoke test;
- responsive input check;
- final screenshots/thumbnail set from accepted SHA;
- portal metadata field-length QA.

## Playgama

Status: adapter/build foundation exists.

Final package gate:

- production build using Playgama adapter path;
- SDK initialization + ad lifecycle smoke test;
- persistence smoke test;
- EN/RU launch smoke test;
- final screenshots/creative from accepted SHA;
- portal metadata field-length QA.

## GameDistribution

Status: adapter/build foundation exists.

Final package gate:

- production build using GameDistribution adapter path;
- SDK/ad lifecycle smoke test;
- pause/focus/audio recovery check;
- responsive browser input check;
- final screenshots/creative from accepted SHA;
- portal metadata field-length QA.

## Packaging convention

When producing upload archives, use deterministic names:

`brainrorgame-<portal>-<short_sha>.zip`

Keep a sibling manifest containing:

```text
portal=
sha=
built_at_utc=
language_smoke=en,ru
verify=pass
playtest_candidate=pass
screenshots_sha=
```

The `screenshots_sha` must equal `sha` for final submission.

## Final release order

1. Freeze candidate SHA.
2. Run `npm run verify`.
3. Complete external playtest protocol.
4. Apply only evidence-backed blocker/balance fixes.
5. Re-freeze and re-run verification/playtest smoke if code changed.
6. Capture final screenshots from that exact SHA.
7. Produce portal-specific archives/manifests.
8. Test each portal preview with its own adapter.
9. Submit first portal, monitor real telemetry, then expand distribution.
