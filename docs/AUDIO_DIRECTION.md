# Audio Direction

## Goal

Audio should make the game feel tactile, playful and expensive without becoming noisy. The first-play mix must reinforce merge decisions, target impacts and boss punctuation while remaining comfortable during repeated sessions.

## Palette

- Cartoon sci-fi rather than realistic weapons.
- Rounded low-frequency impact for weight.
- Short bright transients for readability on phone speakers.
- Small pitch variation on highly repeated cues.
- Boss cues occupy more duration and low-end than normal-wave cues.
- Reward sounds use simple upward musical motion and never imitate recognizable commercial jingles.

## Mix hierarchy

1. Boss telegraph / boss defeat.
2. Merge / reward.
3. Enemy defeat.
4. Hit.
5. Shot / button.

Repeated shot and hit cues must be throttled. More units should sound denser, not proportionally louder.

## Browser/mobile rules

- Audio must tolerate autoplay restrictions. Gameplay cannot depend on hearing a cue before the first user gesture.
- Resume/unlock Web Audio on user interaction and fail silently if audio is unavailable.
- Do not block boot on audio.
- Keep first-play audio payload tiny. Procedural cues are preferred for the core palette when they meet the quality bar.
- Music, voice and later biome ambience should be lazy-loaded.

## IP and provenance

Core SFX in the initial slice are authored procedurally in project code. Do not copy meme audio, commercial jingles, game sounds, streamer clips or recognizable recordings. Imported production audio requires documented provenance and license.

## Definition of done

A new core interaction is not audio-complete until its cue has a clear role in the hierarchy, is tested under repeated use, does not clip the mix, and behaves correctly after browser audio unlock.
