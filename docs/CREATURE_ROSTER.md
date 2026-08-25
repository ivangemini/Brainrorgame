# Creature Roster

Playable creatures are original project IP. Families are data-driven in `src/content/creatures.ts`; every family currently has three merge tiers and is eligible for the recruit pool.

## Pinguino family

- Visual core: compact skating penguin-like chaos creature.
- Gameplay role: balanced cadence / balanced damage.
- Read at board scale: dark oval body, bright belly and skate mass.
- Mutation hooks: aurora runners, comet ice, glitch-skate variants.

## Toastodilo family

- Visual core: pastry-armored reptile absurdity.
- Gameplay role: slower heavy hitter.
- Read at board scale: warm chunky body with oversized toast/pastry mass.
- Mutation hooks: molten crust, solar jam, armored bakery variants.

## Lampalotl family

- Visual joke: a cheerful axolotl fused with a glowing lava-lamp body.
- Silhouette primitive: squat salamander body, tall glass bulb and strong side gill fans.
- Dominant materials: translucent candy-glass, soft aqua skin and neon plasma blobs.
- Face/personality: curious, harmless-looking smile contrasting with rapid projectile spam.
- Gameplay role: tempo / rapid-fire family. Lower damage per projectile, substantially shorter attack cadence.
- Tier 1 — **Glow Lampalotl**: single plasma core and simple pink gill fans.
- Tier 2 — **Prism Lampalotl**: dual floating cores, brighter armor collar and denser glow language.
- Tier 3 — **Nova Lampalotl**: crown-like lamp fins, large central nova core and maximum silhouette height.
- Animation opportunities: glass-core bobbing, gill follow-through, plasma wobble, faster attack recoil.
- Mutation hooks: sour-neon, blacklight, cosmic-plasma and crystal-lamp variants.
- Color/material notes: aqua body anchors the family; magenta/purple/soft yellow energy escalates by tier.
- IP-distance check: original generic amphibian + decorative lamp concept; no branded lamp design, known meme character, celebrity, franchise or logo cues.

## Dishnail family

- Visual joke: a relaxed snail carrying an oversized satellite-dish shell and treating every projectile like a long-range transmission.
- Silhouette primitive: very low horizontal body with one tall eye stalk and a dominant tilted parabolic dish.
- Dominant materials: soft mint creature skin, purple receiver housing, cyan glass-metal dish and warm signal cores.
- Face/personality: sleepy one-eyed smile; the visual calm contrasts with unusually heavy projectile hits.
- Gameplay role: artillery / alpha-strike family. Slowest attack cadence and highest damage per individual shot.
- Tier 1 — **Ping Dishnail**: compact single dish, one receiver node and simple low body.
- Tier 2 — **Relay Dishnail**: larger dish, twin relay antennae and brighter signal hardware.
- Tier 3 — **Quasar Dishnail**: maximum dish mass, signal crown and a glowing secondary quasar emitter.
- Animation opportunities: dish recoil, receiver-node flash, eye-stalk follow-through and a slower anticipation before each shot.
- Mutation hooks: ion storm, aurora receiver, crystal array and black-signal variants.
- Color/material notes: mint/teal body anchors the family; cyan-violet dish hardware and yellow signal light escalate by tier.
- IP-distance check: original generic snail + satellite receiver combination; no telecom logos, branded hardware, known meme character, celebrity or franchise cues.

## Combat pacing

The four current families intentionally occupy different attack rhythms rather than being cosmetic duplicates:

| Family | Tier 1 | Tier 2 | Tier 3 | Role |
| --- | ---: | ---: | ---: | --- |
| Pinguino | 8 / 1250 ms | 19 / 1120 ms | 46 / 980 ms | balanced |
| Toastodilo | 11 / 1500 ms | 27 / 1360 ms | 61 / 1190 ms | heavy |
| Lampalotl | 6 / 850 ms | 14 / 760 ms | 31 / 660 ms | rapid-fire |
| Dishnail | 15 / 1950 ms | 36 / 1760 ms | 82 / 1530 ms | artillery |

Values are damage per shot / base attack interval. Dishnail's base DPS stays close to the heavy family while concentrating more output into fewer, larger hits. Permanent Power Core upgrades and mutation multipliers apply uniformly, so family identity remains cadence and hit-weight rather than a hidden exception.
