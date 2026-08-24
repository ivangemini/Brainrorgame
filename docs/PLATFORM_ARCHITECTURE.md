# Platform Architecture

Gameplay code must not know which portal hosts the game.

`PlatformAdapter` owns:

- SDK initialization;
- gameplay start/stop signals;
- interstitial/rewarded ads;
- cloud/local saves;
- leaderboard hooks;
- payments/IAP where supported;
- platform lifecycle/focus/pause rules.

Planned adapters:

1. Web/local development
2. Yandex Games
3. CrazyGames
4. Poki
5. Playgama
6. GameDistribution

The initial implementation should prove Yandex first without making Yandex a dependency of gameplay/economy code.
