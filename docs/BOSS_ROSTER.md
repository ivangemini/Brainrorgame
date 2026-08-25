# Boss Roster

The boss roster is original Brainror Game IP. Boss identity and phase tuning are data-driven through `src/content/bosses.ts`.

## Fridgino Maximo

- Baseline bruiser with medium cadence.
- Telegraph: expanding danger ring.
- Phase identity: **Freezer Shell → Coolant Core Open → Absolute Zero Rage**.
- Shield multiplier: 0.58; weak multiplier: 1.36.

## Magnetrono Mambissimo

- Faster tempo boss with lower per-hit baseline.
- Telegraph: inward sweep rails.
- Phase identity: **Polarity Lock → Magnet Core Exposed → Mambo Overdrive**.
- Shield multiplier: 0.62; weak multiplier: 1.42.

## Bubblotto Krakenino

- Tank/burst boss with the strongest core-roster shield.
- Telegraph: orbiting energy beads.
- Phase identity: **Bubble Dome → Tentacle Heart Open → Kraken Pressure**.
- Shield multiplier: 0.50; weak multiplier: 1.32.

## Kettlestar Volcanissimo

- Pressure-burst kettle titan.
- Telegraph: three steam lanes opening into a fan.
- Phase identity: **Pressure Shell → Valve Core Open → Redline Boil**.
- Shield multiplier: 0.57; weak multiplier: 1.46.

## Serverino Stormzilla

- World-finale boss for **Neon Sewer, Chapter 10**.
- Visual core: colossal server-rack creature with twin signal towers, three luminous network nodes and an exposed central packet core.
- Gameplay role: fastest late-game world finale. Its weak window is the highest-payoff vulnerability in the current roster.
- Phase identity: **Packet Firewall → Server Core Exposed → DDoS Tempest**.
- Shield multiplier: 0.54; weak multiplier: 1.48.
- Phase III cadence multiplier: 0.66.
- Presentation reuses the readable sweep grammar but combines it with a different silhouette, phase profile, projectile palette and defeat label.
- IP-distance check: original generic datacenter/network motifs; no vendor marks, server brand design or external character references.

## Washerzilla Drumissimo

- World-finale boss for **Appliance Wasteland, Chapter 15**.
- Visual core: huge washing-machine creature with a dominant circular drum, control-light crown and cable-like arms.
- Gameplay role: heaviest world finale. Slower than Serverino, substantially harder shield, and stronger Phase III fortress hits.
- Phase identity: **Drum Lock → Bearing Core Open → Max Spin Rage**.
- Shield multiplier: 0.46; weak multiplier: 1.38.
- Phase III damage multiplier: 1.28.
- IP-distance check: original generic laundry-appliance construction with no brand, logo or copied industrial design.

## Multi-phase combat

Boss state is derived entirely from persisted boss HP, so reload cannot reroll or reset a timed phase.

- **Phase I — above 70% HP:** normal vulnerability.
- **Phase II — 70% to 40%:** shield window followed by a named weak-point window.
- **Phase III — 40% and below:** permanent enrage, another shield segment, then a final weak window.
- Vendinguana **Price Breaker** is boss-only and multiplies weak-point damage, creating a late-game reason to build specifically for finale fights.
- Neon Overdrive is deliberately inefficient into a shield and highly valuable during weak windows.

## Routing

- Chapters 1–9: four core bosses rotate deterministically.
- **Chapter 10:** Serverino Stormzilla overrides the normal rotation as the Neon Sewer finale.
- Chapters 11–14: core rotation continues.
- **Chapter 15:** Washerzilla Drumissimo is the Appliance Wasteland finale.
- Chapter 16+: endless progression can rotate across all six bosses.

World-finale chapters also retain their authored world completion coin/Core Shard rewards, so the special boss is both a mechanical and progression milestone.
