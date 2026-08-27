# Merge Rules

## Core rule

The board follows one rule everywhere: **same creature family + same merge level**.

- T1 + matching T1 -> T2.
- T2 + matching T2 -> T3.
- T3 + matching T3 -> T4.
- T4 + matching T4 -> T5.
- T5 + matching-family T5 always merges into one T5.
- If a T5 mutation pair can ascend, its mutation tier increases.
- If the mutation cannot ascend, the T5 pair consolidates and keeps the stronger mutation.
- Different creature families never merge, including on a full board.
- A deadlock must never be solved by silently changing this rule.

The previous emergency cross-family fusion is removed.

A single T5 now represents **16 T1 copies / 15 merge operations** in its lineage. The old T3 cap represented only four T1 copies, so the primary merge chase is four times deeper before the max-tier state is reached.

## Art and prestige tiers

The project currently owns three authored silhouette stages per family (36 base forms across 12 families). T4 and T5 are intentional prestige states rather than placeholder claims of new authored forms:

- T1/T2/T3 continue to use the three authored evolution silhouettes.
- T4 reuses the T3 silhouette with a larger scale, magenta prestige frame, four tier markers and an animated aura.
- T5 reuses the T3 silhouette with the strongest frame, five tier markers, Roman `V`, brighter prestige treatment and a continuously rotating aura.
- T4/T5 combat scaling lives in the shared creature definition path so every attack calculation sees the same stats.

Dedicated T4/T5 silhouettes can be authored later if playtesting justifies 24 additional production assets; gameplay does not depend on pretending those assets already exist.

## Board capacity

The main crew board is a 5 x 3 grid: **15 slots**. This gives the player more working space without making individual creatures unreadably small on mobile.

Historical 12-slot saves are accepted and expanded with three empty slots when loaded, so existing progression is preserved. Current v14 saves also accept and persist T4/T5 board units.

## Deadlock prevention and smart Recruit

Normal gameplay prevents deadlocks before a recruit is generated rather than repairing the board after it becomes invalid.

The recruit planner uses three layers:

1. With normal breathing room, recruits remain T1 but their family weights favor the lineage where one new T1 unlocks the strongest useful merge cascade. A pull that carries through several existing odd tiers is favored over one that only opens a new disconnected lineage.
2. Families represented only by max-tier T5 creatures are **downweighted, not banned**. A second T5 can still be useful for mutation ascension/consolidation, so removing that family permanently would destroy legitimate late-game builds.
3. If only one empty slot remains and there is currently no legal merge, the recruit is forced to become a twin of an existing non-capped unit: same family and same level. Filling the final slot therefore creates at least one legal merge.

When only a few cells remain, opening a completely new lineage receives the lowest normal weight. This reduces board fragmentation without turning Recruit into a deterministic selector.

Max-tier T5 units remain consolidatable with another T5 of the same family. With 15 board slots and 12 creature families, a board dominated entirely by T5 units necessarily contains a same-family pair. This closes the late-game loophole without ever permitting cross-family fusion.

### Historical save recovery

A save produced by an older broken build can theoretically arrive already full and deadlocked. That state is repaired once, before the game scene boots:

- the game finds a repeated creature family on the full board;
- it picks the closest-level pair in that family;
- the lower-level member receives a free safety promotion to the partner's level;
- the resulting pair is now a normal same-family + same-level merge;
- collection and mutation-album evidence are normalized to the authored art form represented by the promoted tier.

No creature is deleted and no cross-family merge is introduced. The repair exists only for already-invalid historical saves; the normal Recruit planner remains the primary prevention mechanism.

## UX contract

The board teaches and repeats the same instruction: `MATCH SAME CREATURE + SAME LEVEL`.

- T1 through T5 use progressively stronger frame weight, character scale, tier markers and Roman-tier badges so level is readable before the number is consciously read.
- When the board becomes full, one legal pair stays visibly highlighted until the player acts.
- While dragging a creature, every legal same-family + same-level target is highlighted and incompatible creatures are visually de-emphasized.
- The Merge Crew header exposes `PAUSE` / `FIGHT`. Preparation mode freezes combat and ability timers while board input remains available.
- Boss encounters enter preparation automatically so the player is never punished for taking time to inspect and merge the board before the fight.
- There is no `CHAOS FUSION` state and no UI suggesting that unrelated creatures can be combined.
