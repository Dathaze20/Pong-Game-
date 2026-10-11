# Super Pong!

A neon arcade game built with vanilla HTML, CSS, and JavaScript — no frameworks, no bundlers, no installs. Four game modes, nine power-ups, a full XP and badge progression system, custom player avatars and music, and a Street Fighter-style HUD, all running at smooth 60 fps directly in your browser.

Playable in any modern browser. Installable as a PWA on Android and iOS. Deployed automatically to GitHub Pages.

---

## ▶ Play Now

**[Play Super Pong! → https://dathaze20.github.io/Pong-Game-/](https://dathaze20.github.io/Pong-Game-/)**

No download required. Open the link in Chrome on any phone, tablet, or desktop and tap **LET'S GO!**

---

## Install on Android (PWA)

Super Pong! works as an installable app on Android — no app store required.

1. Open **Chrome** on your Android phone
2. Go to **[https://dathaze20.github.io/Pong-Game-/](https://dathaze20.github.io/Pong-Game-/)**
3. Tap the **three-dot menu** (⋮) in the top-right corner of Chrome
4. Tap **"Install app"** or **"Add to Home screen"**
5. Tap **Install** / **Add**

The Super Pong! icon appears on your home screen. Launch it from there for a fullscreen, landscape experience — exactly like a native app.

> After installing, the game caches its files locally. You can play even if your connection drops mid-session.

---

## Game Modes

| Mode | Description | Ends When |
|---|---|---|
| **VS AI** | Play against a computer opponent with adjustable difficulty | First to 15 points |
| **VS Friend** | Local two-player on the same device | First to 15 points |
| **Survival** | The AI speeds up after every rally hit — one miss ends it | You miss the ball |
| **Time Attack** | Score as many points as you can before the clock runs out | 60 seconds |

---

## Features

### AI Opponent
- Three named difficulty presets: **Chill** (Easy), **Normal** (Medium), **Beast Mode** (Hard)
- Rubber-band logic: AI eases off when far ahead and pushes harder when behind
- AI is named by mode: Rookie / Blaze / Nemesis / 💀 Death / ⏱ Clock

### Power-Ups (9 types)

Power-ups drop randomly during play. Pick them up to gain an edge.

| Power-Up | Effect |
|---|---|
| ⚡ **Turbo** | Speeds up the ball |
| ❄️ **Freeze** | Slows the ball down |
| 💪 **Grow** | Enlarges your paddle |
| 🏀 **Big Ball** | Grows the ball |
| 🎱 **Multiball** | Adds extra balls to the court |
| 🛡️ **Shield** | Protects your goal for a short time |
| ⚡ **Shrink** | Shrinks your opponent's paddle |
| 🧲 **Magnet** | Pulls the ball toward your paddle |
| ✂️ **Split** | Splits the ball into two |

### Progression & Stats
- **XP system** — earns XP per point scored, per win, and per rally hit; level is displayed in the HUD
- **8 unlockable badges** — earned through in-game accomplishments:

| Badge | How to Earn |
|---|---|
| 🏆 First Victory! | Win your first match |
| 🔒 Shutout! | Win while holding the opponent to 0 |
| 🔥 Rally Star! | Achieve an 8-hit rally |
| ⚡ Comeback Kid! | Win after falling 3+ points behind |
| 🌟 10-Win Champ! | Win 10 matches total |
| 💨 Speed Demon! | Collect the Turbo power-up 3 times in one match |
| 🎱 Multiball MVP! | Score a point using an extra Multiball ball |
| 💪 Level 5! | Reach player level 5 |

- **Badge Room** — gallery showing all earned and locked badges
- **Hall of Fame** — top-10 high scores saved per mode with gold, silver, and bronze medals
- **Post-game stats** — max rally, combos, near-misses shown on the game-over screen

### Customization (saved across sessions)
- Custom **Player 1 name and photo** (uploaded from your device)
- Custom **Player 2 name and photo**
- **Custom music upload** — replace the default background track with any audio file from your device
- **8 background themes**: Midnight, Ocean, Sunset, Neon, Forest, Lava, Ice, Galaxy

### HUD & Visual Effects
- Street Fighter–style HUD with player names, avatars, score bars, and live timer
- 3-2-1 countdown before each serve with color-coded animation
- Score popups, combo announcements, rally streak text below the VS timer
- Screen shake, particle bursts, ball trail, speed lines, animated star field
- Confetti on win; glitch canvas effect when the hard AI or Survival AI scores
- Ball squash and stretch on paddle impact; chromatic aberration rings; spin marker

### Sound
- All sound effects synthesized via the **Web Audio API** — no external audio files needed for SFX
- Separate **Music** and **Sound FX** toggles
- Dynamic music tempo: playback rate increases to 1.28× when the score is tight and time is short
- **Voice announcer** (Web Speech API) calls key events

### Controls

| Input | Action |
|---|---|
| Touch — drag on your half of the screen | Move your paddle |
| `↑` / `↓` or `W` / `S` | Move your paddle (keyboard) |
| `Escape` | Pause / resume |

### In-Game Controls Bar
A docked bar at the bottom of the screen provides four quick-access buttons: **Theme**, **Music**, **Pause**, **Reset**. The bar dims during play so it stays out of the way.

### Settings
- Music on/off
- Sound FX on/off
- AI difficulty (Chill / Normal / Beast Mode)
- High-contrast (colorblind-friendly) mode

---

## Persistence

All settings, XP, player level, badges, names, photos, and high scores are saved to **`localStorage`** automatically. Nothing is lost when you close the browser — no account or server required.

---

## Screenshots

> Screenshots will be added here. To add your own: take captures during gameplay on your phone, commit the image files to the repository, and replace the placeholders below.
>
> Recommended captures:
> 1. **Gameplay** — Street Fighter-style HUD, live score bars, a power-up active on the canvas
> 2. **Setup screen** — mode selector, player name inputs, photo picker, custom music button
> 3. **Badge Room or Hall of Fame** — earned badges or top-10 leaderboard

---

## How to Play

1. Open the [game URL](https://dathaze20.github.io/Pong-Game-/) or `index.html` locally
2. Enter your name and optionally upload a photo and custom music
3. Pick a game mode and tap **LET'S GO!**
4. Drag your finger on your side of the screen (or use arrow keys on desktop) to move your paddle
5. First to 15 points wins — or survive as long as you can in Survival mode

---

## Technologies

- HTML5 Canvas (2D context, `devicePixelRatio`-aware rendering with sub-pixel snapping)
- CSS (custom properties, `backdrop-filter`, animations, responsive landscape layout)
- Vanilla JavaScript (ES2022+)
- Web Audio API (synthesized SFX)
- Web Speech API (voice announcer)
- Web Share API (share score from the game-over screen, where supported)
- Wake Lock API (keeps screen on during gameplay)
- Service Worker (PWA offline caching — stale-while-revalidate strategy)
- `localStorage` (all persistence — no server required)

---

## Development

```sh
# Install dev dependencies (ESLint + Vitest — the game itself has none)
npm install

# Lint
npm run lint

# Run unit tests
npm test
```

No bundler. The game runs directly from `index.html` — open it in a browser or serve the repo root.

### Tests

Unit tests live in `tests/game-logic.test.js` and cover the pure math extracted into `game-logic.js`:

- `clampPaddle` — paddle boundary clamping
- `paddleHitsBall` — collision detection for left and right paddles
- `reflectOffPaddle` — angle and speed of ball reflection
- `computeAiDifficulty` — difficulty ramp and rubber-band logic
- `isWinningScore` — win condition check

Run with **Vitest** (`npm test`).

### Linting

**ESLint** via `npm run lint`. Config at `eslint.config.js`.

---

## CI / Deployment

`.github/workflows/deploy.yml` runs on every push to `main` and every pull request targeting `main`:

1. **Test job** — installs dependencies, runs ESLint, runs Vitest
2. **Deploy job** (push to `main` only, after tests pass) — publishes the repo to **GitHub Pages** via the `gh-pages` branch using `peaceiris/actions-gh-pages`

No build step — the site is the repo as-is (`node_modules`, tests, and config files are excluded from the published output).

---

## Audio Licensing Notice

The repository contains a committed file named **`Original Tetris theme (Tetris Soundtrack).mp3`**, used as the default background music in `index.html` and `service-worker.js`.

The licensing and provenance of this specific recording are not documented in the repository. Because a particular recording or arrangement can carry copyright or other usage restrictions even when based on an older folk melody, this file should be replaced with an original or clearly licensed royalty-free track before public distribution. The custom music upload feature means the game does not depend on this default track.

---

## License

Source code is licensed under the [MIT License](LICENSE). This does not cover the committed Tetris soundtrack — see the Audio Licensing Notice above.
