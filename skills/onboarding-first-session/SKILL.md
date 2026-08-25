# Skill: Onboarding & First Session

## Use when
Changing tutorial steps, first-session pacing, initial rewards, first merge/recruit/boss guidance, contextual coach marks, or onboarding analytics.

## Product rules
- Teach by requiring the real gameplay action, not by showing a slideshow.
- Reach the first satisfying merge immediately; never front-load lore or settings.
- Protect the player from combat pressure while learning the first merge and recruit.
- Introduce one concept at a time and remove the coach mark as soon as the action is demonstrated.
- Never force an existing player through a newly-added tutorial after a save migration.
- Do not block progress on an ad, account sign-in, daily reward, collection screen, or optional meta system.
- Tutorial state must be resumable after refresh/backgrounding.

## Funnel instrumentation
Track at minimum:
1. session start;
2. merge coaching shown / first successful merge;
3. recruit coaching shown / first successful recruit;
4. first combat started;
5. first target defeated / onboarding complete.

Use elapsed session time so first-session friction is measurable.

## Visual quality
Coach marks must belong to the game art direction: animated rings/arrows, concise copy, strong hierarchy, and no generic browser tooltip styling.

## QA gates
- wrong drag cannot destroy the intended first merge setup;
- combat cannot damage the player before protected actions are complete;
- partial tutorial save resumes at the correct step;
- v1–previous-version saves migrate to completed onboarding;
- optional overlays cannot interrupt onboarding;
- completion persists exactly once.
