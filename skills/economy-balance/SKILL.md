# Skill: Economy, Progression & Monetization

## Use when
Changing currencies, rewards, drop rates, merge costs, rarity, upgrades, offline rewards, daily systems, ads, IAP or progression pacing.

## Rules
- Model sources and sinks explicitly.
- Define expected time-to-upgrade and time-to-boss milestones.
- Avoid exponential curves without simulation/checkpoints.
- Rewarded ads must have voluntary, legible value.
- Interstitials belong at natural breaks and require frequency caps.
- Do not tune pain purely to force ad viewing.
- Protect first-session momentum; early rewards should demonstrate the fantasy quickly.

## Balance workflow
Create a table/simulation before hard-coding large curves. Track assumptions. After launch, change values through data/config when possible rather than rewriting systems.
