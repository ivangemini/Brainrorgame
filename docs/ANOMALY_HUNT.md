# Anomaly Hunt

## Purpose

Anomaly Hunt turns the normal Recruit action into a visible medium- and long-term retention goal without introducing a separate paid spin, ad-only pull or premium currency.

Every successful 20-coin Recruit advances persistent mutation hunt progress. The player can always understand how close the account is to the next safety net instead of relying on opaque luck alone.

## Rules

Two counters run in parallel:

- **Anomaly Charge**: tracks consecutive Recruit outcomes toward a mutation safety net. A Charged-or-better mutation is guaranteed no later than pull 18. Any non-Common mutation resets this charge.
- **Crown Signal**: tracks the long hunt for a secret Crowned anomaly. It has a hard guarantee at pull 70. The secret chance begins very low and ramps during the final 20 pulls so late progress feels increasingly meaningful.

A secret Crowned result resets both counters. A normal Charged, Prismatic or Crowned result resets only Anomaly Charge; Crown Signal continues until the secret result is found.

Only a Recruit that is actually completed advances the hunt. Board-full attempts, insufficient-coin attempts and blocked input do not consume progress.

## Player-facing feedback

The Recruit button exposes both counters at all times:

`ANOMALY x / 18 • CROWN SIGNAL y / 70`

The counter receives a short pulse after each successful Recruit. High Anomaly Charge shifts the label toward a stronger warning/accent tone.

- Normal mutation: existing rarity reveal remains fast.
- Anomaly guarantee: reveal copy explicitly calls out the guarantee.
- Secret Crowned result: stronger ring/burst, screen flash, reward audio and dedicated `SECRET ANOMALY` reveal.

The presentation stays concise enough to remain tolerable after hundreds of recruits.

## Persistence

Save schema v10 stores:

- `charge`
- `secretPity`
- `totalPulls`
- `secretsFound`

v9 and all earlier saves migrate safely through the existing chain. Historical progression, board state, currencies, collection, onboarding and Chaos Draft perks are preserved; Anomaly Hunt begins from a fresh zeroed state because earlier builds did not record the information required to reconstruct pity honestly.

## Balance guardrails

- Recruit cost remains the existing 20 coins.
- No ad view is required to advance either counter.
- No real-money or premium-currency pull is introduced by this system.
- Guarantees reduce extreme bad-luck tails rather than increasing grind to compensate.
- Post-playtest tuning should focus on Recruit frequency, mutation acquisition cadence and whether players understand both counters without opening an explanation panel.
