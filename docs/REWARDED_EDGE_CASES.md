# Rewarded / lifecycle edge cases

- Base offline earnings are granted before any rewarded prompt; the ad only grants the bonus copy.
- Rewarded revive is optional and limited to one successful use per encounter. Free retry always remains available.
- Reward success is accepted only from the platform adapter's rewarded callback result.
- Interstitials are requested only at chapter breaks after boss completion, never during active combat.
- Ad/platform pause overlap is coalesced by the platform adapter so gameplay is not resumed early.
- If the game returns from background while the defeat/revive flow is active, the offline reward may be credited but the defeat flow must retain priority over presenting an additional overlay.

The last rule is a regression target for the first browser playtest and should remain covered when the overlay coordinator is extracted from GameScene.
