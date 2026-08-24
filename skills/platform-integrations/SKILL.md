# Skill: Platform Integrations

## Use when
Adding Yandex Games, CrazyGames, Poki, Playgama, GameDistribution or other portal SDKs; ads; cloud saves; leaderboards; payments; lifecycle callbacks.

## Boundary
All SDK-specific behavior must implement or extend the platform adapter layer. Gameplay code asks for capabilities, never imports portal SDK globals directly.

## Required test cases
- initialization success/failure;
- missing SDK/local development fallback;
- focus loss / pause / resume;
- interstitial completion/error;
- rewarded completion/skip/error;
- audio pause/resume around ads;
- save load conflict/failure;
- platform-required gameplay start/stop signaling.

## Build discipline
A platform build may change adapter/config/store metadata, but should not fork gameplay rules.
