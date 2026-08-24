# Audio Design Skill

Use this skill for SFX, music, ambience, voice, audio mixing, Web Audio and Phaser sound work.

## Required reading

- `AGENTS.md`
- `docs/AUDIO_DIRECTION.md`
- `docs/IP_POLICY.md`
- `docs/PERFORMANCE_BUDGETS.md`

## Working rules

1. Design cues around gameplay information, not decoration.
2. Maintain the mix hierarchy: boss > merge/reward > defeat > hit > repeated shot/UI.
3. Throttle repeated combat cues and test with a crowded board.
4. Use subtle variation for repeated cues; avoid random changes that obscure feedback.
5. Respect browser autoplay restrictions and never make progression depend on audio unlock.
6. Prefer original procedural/core audio or documented project-owned recordings. No scraped meme clips or recognizable commercial sounds.
7. Keep first-play payload bounded; lazy-load music/voice/biome ambience.
8. Test on phone speakers and headphones when the task reaches release QA.

## Quality gate

Reject audio that is harsh, clips, masks boss telegraphs, sounds like a stock UI pack, or becomes fatiguing after repeated play. A silent interaction can be intentional; a missing core feedback cue cannot.
