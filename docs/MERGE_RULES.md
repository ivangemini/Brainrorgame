# Merge Rules

## Core rule

The board follows one rule everywhere: **same creature family + same merge level**.

- T1 + matching T1 -> T2.
- T2 + matching T2 -> T3.
- T3 + matching-family T3 always merges into one T3.
- If a T3 mutation pair can ascend, its mutation tier increases.
- If the mutation cannot ascend, the T3 pair consolidates and keeps the stronger mutation.
- Different creature families never merge, including on a full board.
- A deadlock must never be solved by silently changing this rule.

The previous emergency cross-family fusion is removed.

## Board capacity

The main crew board is a 5 x 3 grid: **15 slots**. This gives the player more working space without making individual creatures unreadably small on mobile.

Historical 12-slot saves are accepted and expanded with three empty slots when loaded, so existing progression is preserved.

## Deadlock prevention

Normal gameplay prevents deadlocks before a recruit is generated rather than repairing the board after it becomes invalid.

The recruit planner uses two layers:

1. While the board has breathing room, recruits remain T1 but the family pool is weighted toward T1 families already on the board. This raises useful-pair frequency without removing roster variety.
2. If only one empty slot remains and there is currently no legal merge, the recruit is forced to become a twin of an existing non-capped unit: same family and same level. Filling the final slot therefore creates at least one legal merge.

Max-tier T3 units also remain consolidatable with another T3 of the same family. With 15 board slots and 12 creature families, a board dominated entirely by T3 units necessarily contains a same-family pair. This closes the late-game loophole without ever permitting cross-family fusion.

### Historical save recovery

A save produced by an older broken build can theoretically arrive already full and deadlocked. That state is repaired once, before the game scene boots:

- the game finds a repeated creature family on the full board;
- it picks the closest-level pair in that family;
- the lower-level member receives a free safety promotion to the partner's level;
- the resulting pair is now a normal same-family + same-level merge;
- collection and mutation-album evidence are updated with the promoted form.

No creature is deleted and no cross-family merge is introduced. The repair exists only for already-invalid historical saves; the normal Recruit planner remains the primary prevention mechanism.

## UX contract

The board teaches and repeats the same instruction: `MATCH SAME CREATURE + SAME LEVEL`.

- When the board becomes full, one legal pair stays visibly highlighted until the player acts.
- While dragging a creature, every legal same-family + same-level target is highlighted.
- There is no `CHAOS FUSION` state and no UI suggesting that unrelated creatures can be combined.
