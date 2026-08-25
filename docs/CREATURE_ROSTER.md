# Creature Roster

Playable creatures are original Brainror Game IP. Families are data-driven in `src/content/creatures.ts`; every family has three merge tiers. Recruit availability is progression-gated so the first session stays readable while later worlds introduce new build identities.

## Pinguino family

- Visual core: compact skating penguin-like chaos creature.
- Gameplay role: balanced cadence.
- Crew synergy: **Slipstream Relay** — squad attack haste.
- Unlock: Chapter 1.

## Toastodilo family

- Visual core: pastry-armored reptile absurdity.
- Gameplay role: heavy baseline damage / fortress support.
- Crew synergy: **Crust Bastion** — fortress damage resistance.
- Unlock: Chapter 1.

## Lampalotl family

- Visual joke: cheerful axolotl fused with a glowing lava-lamp body.
- Gameplay role: rapid-fire damage.
- Crew synergy: **Neon Cascade** — squad projectile damage.
- Unlock: Chapter 1.

## Dishnail family

- Visual joke: relaxed snail carrying an oversized satellite-dish shell.
- Gameplay role: artillery / alpha strike.
- Crew synergy: **Quasar Lock** — combat coin bounty.
- Unlock: Chapter 1.

## Mochimoth family

- Visual joke: a soft moth made from squishy mochi-like body mass, oversized antennae and powdery lunar fluff.
- Silhouette: round cushion body with broad side wings and antenna bulbs; tiers add larger wing mass and a lunar crown.
- Gameplay role: support damage profile rather than raw DPS.
- Crew synergy: **Mochi Cushion** — additional fortress damage smoothing that stacks with Toastodilo without replacing it.
- Tier 1 — **Puff Mochimoth**.
- Tier 2 — **Glaze Mochimoth**.
- Tier 3 — **Lunar Mochimoth**.
- Unlock: Chapter 3, introducing the first post-onboarding family before the first world finale.
- IP-distance check: original generic moth + confectionery/mochi visual language; no brand, mascot or franchise cues.

## Routeraptor family

- Visual joke: a tiny network-router creature with antenna horns, status-light crown and an absurdly fast packet cadence.
- Silhouette: compact rounded router body with two long antennae; higher tiers add mesh antenna forks, signal rails and a crown node.
- Gameplay role: lowest base damage per shot but fastest cadence in the roster.
- Crew synergy: **Packet Flock** — +8% / +16% / +28% Chaos Energy gain at synergy tiers I/II/III.
- Tier 1 — **Ping Routeraptor**.
- Tier 2 — **Mesh Routeraptor**.
- Tier 3 — **Hyperlink Routeraptor**.
- Unlock: Chapter 6 on entry to Neon Sewer. Packet Flock multiplies Neon Sewer energy pacing and Chaos Capacitor rather than replacing either system.
- IP-distance check: generic network hardware + original creature construction; no router brand marks or copied hardware silhouette.

## Vendinguana family

- Visual joke: an iguana-like vending machine body that treats boss weak points like discount buttons.
- Silhouette: tall rounded vending cabinet, glass snack window, tail/cable mass and increasingly large antenna/coin crown elements.
- Gameplay role: deliberate slow-impact attacker below Dishnail baseline artillery DPS.
- Crew synergy: **Price Breaker** — +8% / +17% / +30% damage against bosses only. It does not buff normal-wave damage and stacks with boss weak-point windows.
- Tier 1 — **Snack Vendinguana**.
- Tier 2 — **Combo Vendinguana**.
- Tier 3 — **Jackpot Vendinguana**.
- Unlock: Chapter 11 on entry to Appliance Wasteland.
- IP-distance check: original generic vending-machine/reptile construction; no packaged-product art, logos or protected character cues.

## Recruit progression

| Chapter | Newly available family | Purpose |
| ---: | --- | --- |
| 1 | Pinguino, Toastodilo, Lampalotl, Dishnail | readable four-role starter pool |
| 3 | Mochimoth | early sustain choice |
| 6 | Routeraptor | Neon Sewer energy engine |
| 11 | Vendinguana | late boss-breaker build |

## Combat pacing

Values are damage per shot / base attack interval.

| Family | Tier 1 | Tier 2 | Tier 3 | Primary identity |
| --- | ---: | ---: | ---: | --- |
| Pinguino | 8 / 1250 ms | 19 / 1120 ms | 46 / 980 ms | balanced |
| Toastodilo | 11 / 1500 ms | 27 / 1360 ms | 61 / 1190 ms | heavy |
| Lampalotl | 6 / 850 ms | 14 / 760 ms | 31 / 660 ms | rapid-fire damage |
| Dishnail | 15 / 1950 ms | 36 / 1760 ms | 82 / 1530 ms | artillery |
| Mochimoth | 7 / 1080 ms | 17 / 970 ms | 40 / 850 ms | sustain support |
| Routeraptor | 5 / 690 ms | 12 / 620 ms | 27 / 545 ms | energy tempo |
| Vendinguana | 13 / 1880 ms | 31 / 1680 ms | 70 / 1480 ms | boss breaker |

All seven families use the same merge-stable synergy power rule: T1 = 1, T2 = 2, T3 = 4. A normal merge therefore preserves family power instead of punishing correct board play.
