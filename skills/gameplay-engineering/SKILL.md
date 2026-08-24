# Skill: Gameplay Engineering

## Use when
Implementing merge rules, combat, waves, bosses, items, state machines, content data, saves, input, scenes or progression mechanics.

## Architecture
- Scenes orchestrate; systems own rules.
- Data defines content; avoid massive switch statements per character.
- Keep rendering concerns separate from deterministic rules when practical.
- Make save format versioned before live players exist.
- Keep platform code behind `PlatformAdapter`.

## Tests
Unit-test merge validity, upgrade math, reward generation, economy math, save migrations and deterministic boss logic where practical.

## Player experience
Never sacrifice input responsiveness or visual feedback for architectural cleverness. Never bury the first fun interaction behind menus or tutorials.
