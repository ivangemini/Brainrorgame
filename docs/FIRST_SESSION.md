# First-session design

## Goal
The player should understand the core fantasy through actions within the opening moments: merge two weirdos, recruit another unit, then watch the crew auto-fight and defeat its first target.

## Flow

### 1. Merge twins
- Starter pairs are already on the board.
- Animated rings and an arrow highlight one matching pair.
- Combat is frozen so the player cannot take damage while learning the gesture.
- Move/swap attempts during this protected step snap back; a valid merge advances immediately.

### 2. Recruit
- The recruit CTA receives the focus ring.
- Combat remains frozen.
- One successful recruit advances immediately.

### 3. Fight
- Coach copy explains that the crew attacks automatically.
- Combat begins only now.
- The first target defeat completes onboarding.

### 4. Full game unlocked
- Coach UI disappears.
- Daily, Codex and Core Lab interactions are available normally.
- The completed state is persisted.

## Save compatibility
Save schema v6 stores onboarding state. Saves from v1–v5 migrate to `complete` using their prior `updatedAt`, so existing players are never forced through the new tutorial.

A player who refreshes during v6 onboarding resumes the exact `merge`, `recruit` or `fight` step.

## Analytics
Events:
- `onboarding_step: merge`
- `onboarding_step: recruit`
- `onboarding_step: fight`
- `onboarding_complete`

All include session elapsed time through the common analytics layer. The existing `first_merge`, `recruit`, `encounter_start` and `encounter_complete` events provide the corresponding behavioral evidence.

## First-session constraints
- No interstitial before normal chapter policy permits it.
- No rewarded ad is required.
- Offline reward UI is suppressed until onboarding completes, although earned coins can still be credited.
- Meta/daily/collection panels do not distract from the protected tutorial steps.
