# Super Pong!

An arcade-style Pong game built with vanilla HTML, CSS, and JavaScript — no frameworks or bundlers. What started as a basic Pong clone has grown into a full-featured single-page game with four modes, power-ups, a leveling system, a Badge Room, a Hall of Fame, and a Street Fighter-style HUD.

Playable directly in the browser. Installable as a PWA. Deployed automatically to GitHub Pages on every push to `main`.

---

## Game Modes

| Mode | Description |
|---|---|
| **VS AI** | Play against a computer opponent. Difficulty adjusts via settings. |
| **VS Friend** | Local two-player on the same device. |
| **Survival** | The AI speeds up with every rally hit. One miss ends the match. |
| **Time Attack** | Score as many points as possible in 60 seconds. |

First to **15 points** wins in VS AI and VS Friend. Survival and Time Attack end on their own terms.

---

## Features

### Customization (persisted across sessions)
- Custom **Player 1 name and photo** (uploaded from device)
- Custom **Player 2 name and photo**
- **Custom music upload** — replace the default background track with any audio file from your device
- **8 background themes**: Midnight, Ocean, Sunset, Neon, Forest, Lava, Ice, Galaxy

### AI Opponent
- Three named difficulty presets: **Chill** (Easy), **Normal** (Medium), **Beast Mode** (Hard)
- Rubber-band logic: AI eases off when far ahead and presses harder when behind
- AI named by mode: Rookie / Blaze / Nemesis / 💀 Death / ⏱ Clock

### Power-ups (9 types)
Turbo, Freeze, Grow, Big Ball, Multiball, Shield, Shrink, Magnet, Split

### Progression & Stats
- **XP system** with sqrt-based leveling — earns XP per point, win, and rally hit
- **8 unlockable badges**: First Victory, Shutout, Rally Star, Comeback Kid, 10-Win Champ, Speed Demon, Multiball MVP, Level 5
- **Badge Room** — view all earned and locked badges
- **Hall of Fame** — top-10 high scores saved per mode with medals
- Per-session stats shown on the game-over screen (max rally, combos, near-misses)

### HUD & Presentation
- Street Fighter–style HUD: player names, avatars, score bars, live timer
- 3-2-1 countdown before each serve with color-coded animation
- Score popups, combo announcements, rally streak text (small, under the VS timer)
- Screen shake, particle bursts, ball trail, speed lines, animated star field
- Confetti on win; glitch canvas effect when the hard AI or Survival AI scores
- Ball squash/stretch on paddle hit; chromatic aberration rings; spin marker

### Sound
- All sound effects synthesized via the **Web Audio API** — no external audio files required for SFX
- Separate toggles for **Music** and **Sound FX**
- Dynamic music tempo: playback rate increases to 1.28× when the score is close and time is short
- Voice announcer (Web Speech API) for key events

### Controls
- **Touch**: drag anywhere on your half of the screen to move your paddle
- **Keyboard**: `↑` / `↓` arrow keys or `W` / `S` — works on desktop
- `Escape` toggles pause

### Settings
- Music on/off
- Sound FX on/off
- AI difficulty
- High-contrast (colorblind-friendly) mode

### In-game Controls Bar
Docked bar at the bottom of the screen with four buttons: **Theme**, **Music**, **Pause**, **Reset**

### PWA & Platform
- Installable via browser **Add to Home Screen** / install banner
- **Service worker** with stale-while-revalidate caching (offline-capable after first load)
- **Wake Lock API** — keeps the screen on during gameplay
- **Web Share API** — share your score from the game-over screen (where supported)
- Fullscreen landscape orientation declared in the manifest
- `env(safe-area-inset-bottom)` padding for phones with a gesture nav bar

---

## Persistence

All settings, stats, XP, badges, player names, and high scores are saved to **`localStorage`** and survive page refreshes with no account or server required.

---

## How to Play

1. Open the game URL (or load `index.html` locally)
2. Enter your name and optionally upload a photo and custom music
3. Pick a mode and tap **LET'S GO!**
4. Drag your finger (or use arrow keys) to move your paddle
5. First to 15 points wins — or survive as long as you can in Survival mode

---

## Technologies

- HTML5 Canvas (2D context, devicePixelRatio-aware rendering)
- CSS (custom properties, `backdrop-filter`, animations, responsive landscape layout)
- Vanilla JavaScript (ES2022+)
- Web Audio API (synthesized SFX)
- Web Speech API (voice announcer)
- Web Share API
- Wake Lock API
- Service Worker (PWA caching)
- `localStorage` (persistence)

---

## Development

```sh
# Install dev dependencies (ESLint + Vitest — game itself has none)
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

No build step — the site is the repo as-is (node\_modules, tests, and config files are excluded from the published output).

---

## Screenshots / Demo

No screenshot images are committed to the repository yet. The three captures that would best represent the project are:

1. **Main game screen** — shows the Street Fighter-style HUD with custom player names/avatars, the live score bars, and a power-up active on the canvas
2. **Menu / setup screen** — shows the game mode selector, player name inputs, photo picker circles, custom music button, and difficulty select
3. **Badge Room or Hall of Fame** — shows earned badges or the top-10 leaderboard, demonstrating that the game has meaningful progression beyond a single match

---

## Audio Licensing Notice

The repository currently contains a committed file named **`Original Tetris theme (Tetris Soundtrack).mp3`**, which is used as the default background music in `index.html` and `service-worker.js`.

The licensing and provenance of this specific recording are not documented in the repository. Because a particular recording or arrangement can carry copyright or other usage restrictions even when based on an older folk melody, this file should be replaced with an original or clearly licensed royalty-free track before public distribution. The custom music upload feature means the game does not depend on this default track.

---

## License

Source code is licensed under the [MIT License](LICENSE). This does not cover the committed Tetris soundtrack — see the Audio Licensing Notice above.
