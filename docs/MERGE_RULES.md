# Merge Rules

## Core rule

The board follows one rule everywhere: **same creature family + same merge level**.

- T1 + matching T1 -> T2.
- T2 + matching T2 -> T3.
- Compatible T3 twins may ascend their mutation tier while remaining T3.
- Different creature families never merge, including on a full board.
- A deadlock must never be solved by silently changing this rule.

The previous emergency cross-family fusion is removed.

## Board capacity

The main crew board is a 5 x 3 grid: **15 slots**. This gives the player more working space without making individual creatures unreadably small on mobile.

Historical 12-slot saves are accepted and expanded with three empty slots when loaded, so existing progression is preserved.

## Deadlock prevention

Deadlocks are prevented before a recruit is generated rather than repaired after the board is already invalid.

The recruit planner uses two layers:

1. While the board has breathing room, recruits remain T1 but the family pool is weighted toward T1 families already on the board. This raises useful-pair frequency without removing roster variety.
2. If only one empty slot remains and there is currently no legal merge, the recruit is forced to become a twin of an existing non-capped unit: same family and same level. Filling the final slot therefore creates at least one legal merge.

If the board contains only capped T3 units that cannot legally ascend, the planner refuses to invent an illegal recruit/fusion. That state belongs to late-game T3/ascension tuning, not to a hidden exception in the merge rule.

## UX contract

The board should teach and repeat the same instruction: `MATCH SAME CREATURE + SAME LEVEL`.

There is no `CHAOS FUSION` state and no UI suggesting that unrelated creatures can be combined.
