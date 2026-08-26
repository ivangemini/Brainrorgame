# Balance V2 — Campaign Pressure

## Problem

External playtesting showed that a strong early board can clear too many chapters without needing meaningful additional merges. Enemy durability was falling behind crew DPS, so chapter progression stopped testing the merge loop.

## Change

A second, explicit campaign-pressure layer is applied after normal enemy/boss scaling, elite modifiers, chapter mutators and world pressure. It affects existing saves immediately and requires no save migration.

| Chapter | Wave HP | Boss HP | Enemy damage | Attack interval | Coin reward |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1.35x | 1.50x | 1.00x | 1.000x | 1.000x |
| 5 | 2.71x | 2.70x | 1.10x | 0.980x | 1.048x |
| 10 | 4.41x | 4.20x | 1.225x | 0.955x | 1.108x |
| 15 | 6.11x | 5.70x | 1.35x | 0.930x | 1.168x |
| Endless cap | 9.50x | 7.50x | 1.42x | 0.900x | 1.18x |

Attack interval below 1 means faster attacks.

The curve is deliberately durability-heavy. HP grows much harder than outgoing damage so the player is pushed to recruit, merge and improve the crew without turning ordinary waves into unavoidable burst damage.

## Economy guardrail

Coin compensation is capped at +18%. Higher enemy HP therefore cannot be completely neutralized by an equally large increase in recruits. Merge depth, mutation quality, synergies and permanent upgrades remain important.

## Playtest targets

- early normal wave: roughly 7–12 seconds after the opening merges;
- established mid-game wave: roughly 8–18 seconds;
- boss: roughly 25–60 seconds depending on board quality and phase mechanics;
- a board that is unchanged for several chapters should visibly lose TTK efficiency;
- fortress failures should come from accumulated pressure or ignored progression, not single untelegraphed hits.

Track median encounter TTK, chapter completion time, fortress failure rate, recruits/merges per chapter, board saturation and highest creature tier by chapter.
