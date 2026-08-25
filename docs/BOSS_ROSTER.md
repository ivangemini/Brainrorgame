# Boss Roster

The boss roster is original project IP. Each chapter selects one boss deterministically and applies chapter scaling; presentation identity stays data-driven through `src/content/bosses.ts`.

## Fridgino Maximo

- Visual joke: an overbuilt refrigerator titan wearing an ice crown.
- Silhouette: tall rectangular mass with oversized side arms and jagged crown.
- Material: frosted metal, glassy ice, cold cyan glow.
- Face/personality: smug appliance-monster grin.
- Gameplay role: baseline bruiser; medium attack cadence and pressure.
- Signature read: expanding danger ring before impact.
- Signature defeat: squash/melt downward into the arena.
- Phase identity: Freezer Shell reduces incoming damage; Coolant Core weak windows reward saved burst; Phase III enters Absolute Zero Rage.
- Mutation hooks: freezer burn, black-ice, aurora-core variants.
- IP-distance check: generic appliance/ice motifs only; no brand marks or protected character cues.

## Magnetrono Mambissimo

- Visual joke: a cyclops microwave-disco idol with magnet-like fists and a crooked antenna crown.
- Silhouette: wide rounded appliance body with strong side masses and short legs.
- Material: warm enamel metal, purple glass, neon magenta energy.
- Face/personality: manic one-eyed showman.
- Gameplay role: tempo boss; attacks faster for slightly lower per-hit damage.
- Signature read: twin vertical rails squeeze inward before the fortress sweep lands.
- Signature defeat: spins off-axis and shorts out.
- Phase identity: Polarity Lock is a lighter shield, Magnet Core has the strongest early weak-window reward, and Mambo Overdrive creates the fastest Phase III cadence.
- Mutation hooks: chrome, overclocked neon, inverted-polarity variants.
- IP-distance check: original generic appliance/sci-fi construction with no logos, packaging, or franchise references.

## Bubblotto Krakenino

- Visual joke: a gumball dispenser dome fused to a soft cartoon kraken body.
- Silhouette: oversized transparent dome over a squat base with six tentacle masses.
- Material: translucent candy-glass, soft polymer base, glowing candy orbs.
- Face/personality: cheerful expression on an unexpectedly heavy tank boss.
- Gameplay role: tank/burst boss; slower telegraph, higher HP and stronger impact.
- Signature read: three orbiting energy beads spiral inward before impact.
- Signature defeat: dome overinflates, pops upward, then disappears.
- Phase identity: Bubble Dome is the strongest damage-reduction shield; Tentacle Heart weak windows are more conservative, while Kraken Pressure raises Phase III hit strength instead of pure speed.
- Mutation hooks: sour-candy, cosmic-orbit, crystal-dome variants.
- IP-distance check: generic confectionery/dispenser/cephalopod motifs only; no branded candy or protected character design.

## Kettlestar Volcanissimo

- Visual joke: a giant enamel tea kettle that believes its pressure gauge is a volcanic core.
- Silhouette: broad rounded kettle body, oversized side spout, loop handle and a jagged steam-crown lid.
- Material: teal enamel metal, warm brass/orange lid, glowing pressure glass and soft white steam.
- Face/personality: anxious pressure-monster stare; visibly trying not to explode.
- Gameplay role: pressure-burst boss; slightly lighter body than the tank boss with heavier mid-cadence fortress hits.
- Signature read: three long steam lanes open into a fan before the pressure blast lands, so the warning shape is readable without color.
- Signature defeat: body compresses inward like a crushed kettle, then rebounds flat and vents away.
- Phase identity: Pressure Shell protects the upper phase bands, Valve Core is the highest-payoff weak window, and Redline Boil creates the sharpest late-fight speed spike.
- Mutation hooks: black-steam, aurora boiler, molten brass and crystal-pressure variants.
- IP-distance check: original generic kettle/pressure/volcano construction; no branded appliance shape, logo, named meme or franchise cues.

## Multi-phase combat

Boss fights are no longer a flat HP race. Phase state is derived entirely from the boss's persisted HP ratio, so reload cannot reroll or skip a timed mechanic.

- **Phase I — above 70% HP:** baseline boss identity and normal vulnerability.
- **Phase II — 70% to 40% HP:** the upper part of the band is a shield window; the lower part exposes a named weak point.
- **Phase III — 40% HP and below:** the boss is permanently enraged, attacks faster and hits harder; the phase again starts shielded and ends with a final weak-point window.
- Shield windows reduce crew damage to roughly 50–62% depending on boss identity.
- Weak windows amplify crew damage to roughly 132–146%.
- Phase II cadence/damage ramps are intentionally moderate; Phase III is the real pressure spike.

The design makes Chaos Energy timing matter. Spending Neon Overdrive into a shield is deliberately inefficient, while holding it for a weak-point window produces a clear payoff. Crust Guard becomes more valuable during Phase III, and Slipstream Burst can be used either to race a weak window or recover tempo during enrage.

BossView communicates the state without relying only on color: the HUD names `PHASE I/II/III`, `SHIELD` or `WEAK POINT`, major 70%/40% thresholds are marked on the HP bar, shields use circular barrier geometry, weak windows use crosshair geometry, and transitions get a short ring/burst/camera response.

## Rotation and pacing

Chapters rotate through the four-boss roster in order and then repeat. HP scales exponentially by each boss profile; damage, attack cadence and rewards use bounded chapter progression so boss identity remains legible without forcing ad-driven pain spikes. First-session chapter one remains Fridgino Maximo to preserve the existing onboarding and difficulty baseline.

The fourth boss enters first at chapter 4 with about 930 HP, 17 fortress damage and a 3595 ms base attack interval after chapter scaling. That keeps the new pressure profile stronger than the opening bosses without creating a reward or cadence discontinuity before the roster loops back to Fridgino in chapter 5.
