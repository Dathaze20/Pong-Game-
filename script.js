(function () {
'use strict';

// --- DOM ---
const $ = id => document.getElementById(id);
const canvas = $('gameCanvas');
const ctx = canvas.getContext('2d');

const screens = {
    splash: $('splashScreen'),
    menu: $('mainMenu'),
    settings: $('settingsMenu'),
    howToPlay: $('howToPlay'),
    gameOver: $('gameOverScreen'),
    pause: $('pauseOverlay'),
    hud: $('gameHUD'),
    controls: $('gameControls')
};

const audio = {
    music: $('bgMusic'),
    hit: $('hitSound'),
    score: $('scoreSound'),
    powerUp: $('powerUpSound')
};

// --- Settings (persisted) ---
const settings = {
    get musicOn() { return localStorage.getItem('musicOn') !== 'false'; },
    set musicOn(v) { localStorage.setItem('musicOn', v); },
    get sfxOn() { return localStorage.getItem('sfxOn') !== 'false'; },
    set sfxOn(v) { localStorage.setItem('sfxOn', v); },
    get difficulty() { return localStorage.getItem('difficulty') || 'medium'; },
    set difficulty(v) { localStorage.setItem('difficulty', v); },
    get highContrast() { return localStorage.getItem('highContrast') === 'true'; },
    set highContrast(v) { localStorage.setItem('highContrast', v); },
    get p1Name() { return localStorage.getItem('p1Name') || 'Player 1'; },
    set p1Name(v) { localStorage.setItem('p1Name', v); },
    get p2Name() { return localStorage.getItem('p2Name') || 'Player 2'; },
    set p2Name(v) { localStorage.setItem('p2Name', v); },
    get gameMode() { return parseInt(localStorage.getItem('gameMode') || '1'); },
    set gameMode(v) { localStorage.setItem('gameMode', v); }
};

// --- Game Config (scaled to canvas) ---
const WINNING_SCORE = 10;
const GAME_DURATION = 60;
const POWER_UP_INTERVAL = 12;

const AI_SETTINGS = {
    easy:   { speed: 0.75, error: 40 },
    medium: { speed: 0.92, error: 18 },
    hard:   { speed: 1.05, error: 6 }
};

// --- Game State ---
let gameActive = false;
let gamePaused = false;
let rafId = null;
let lastTime = 0;

let ballX, ballY, ballDX, ballDY, ballSpeed, ballRadius;
let paddleW, paddleH, paddleMargin;
let leftY, rightY, paddleSpeed;
let leftScore, rightScore;
let timer, timerInterval;
let touchLeftY = null, touchRightY = null;
let activePowerUp = null;
let powerUpTimer = 0;
let paddleHMod = 1;
let ballSpeedMod = 1;
let audioUnlocked = false;

// --- Scaling ---
let dpr = 1;
let W = 0, H = 0;

function resizeCanvas() {
    dpr = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scaleDimensions();
}

function scaleDimensions() {
    const ref = Math.min(W, H);
    ballRadius = Math.max(6, ref * 0.012);
    paddleW = Math.max(10, ref * 0.025);
    paddleH = Math.max(60, ref * 0.18);
    paddleMargin = Math.max(12, ref * 0.03);
    paddleSpeed = ref * 0.9;
    ballSpeed = ref * 0.45;
}

// --- Audio ---
function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    Object.values(audio).forEach(a => {
        if (a) { a.load(); const p = a.play(); if (p) p.then(() => a.pause()).catch(() => {}); }
    });
}

function playSound(snd) {
    if (!settings.sfxOn || !snd) return;
    snd.currentTime = 0;
    snd.play().catch(() => {});
}

function startMusic() {
    if (!settings.musicOn || !audio.music) return;
    audio.music.volume = 0.4;
    audio.music.currentTime = 0;
    audio.music.play().catch(() => {});
}

function stopMusic() {
    if (audio.music) { audio.music.pause(); audio.music.currentTime = 0; }
}

// --- Screen Management ---
function showScreen(name) {
    Object.entries(screens).forEach(([k, el]) => {
        if (!el) return;
        if (k === 'hud' || k === 'controls') return;
        el.style.display = k === name ? 'flex' : 'none';
    });
}

function showGame() {
    Object.values(screens).forEach(s => { if (s) s.style.display = 'none'; });
    canvas.style.display = 'block';
    screens.hud.style.display = 'flex';
    screens.controls.style.display = 'flex';
}

// --- Splash ---
setTimeout(() => {
    screens.splash.style.display = 'none';
    showScreen('menu');
    applySettings();
}, 2200);

// --- Settings UI sync ---
function applySettings() {
    $('toggleMusic').checked = settings.musicOn;
    $('toggleSoundEffects').checked = settings.sfxOn;
    $('difficulty').value = settings.difficulty;
    $('colorblindMode').checked = settings.highContrast;
    document.body.classList.toggle('high-contrast', settings.highContrast);
}

$('toggleMusic').addEventListener('change', e => { settings.musicOn = e.target.checked; });
$('toggleSoundEffects').addEventListener('change', e => { settings.sfxOn = e.target.checked; });
$('difficulty').addEventListener('change', e => { settings.difficulty = e.target.value; });
$('colorblindMode').addEventListener('change', e => {
    settings.highContrast = e.target.checked;
    document.body.classList.toggle('high-contrast', e.target.checked);
});

// --- Navigation ---
$('settingsButton').addEventListener('click', () => showScreen('settings'));
$('backToMenuButton').addEventListener('click', () => { showScreen('menu'); applySettings(); });
$('howToPlayButton').addEventListener('click', () => showScreen('howToPlay'));
$('backFromHowToPlay').addEventListener('click', () => showScreen('menu'));
$('rateUsButton').addEventListener('click', () => {
    alert('Thank you for playing! We appreciate your support!');
});

// --- Start Game ---
$('startGameButton').addEventListener('click', () => {
    unlockAudio();
    settings.p1Name = $('player1NameInput').value.trim() || 'Player 1';
    settings.p2Name = $('player2NameInput').value.trim() || 'Player 2';
    settings.gameMode = $('gameMode').value;
    startGame();
});

function startGame() {
    resizeCanvas();
    resetGameState();
    showGame();
    startMusic();
    startTimer();
    gameActive = true;
    gamePaused = false;
    lastTime = performance.now();
    rafId = requestAnimationFrame(gameLoop);
}

function resetGameState() {
    leftScore = 0;
    rightScore = 0;
    paddleHMod = 1;
    ballSpeedMod = 1;
    activePowerUp = null;
    powerUpTimer = 0;
    leftY = (H - paddleH) / 2;
    rightY = (H - paddleH) / 2;
    touchLeftY = null;
    touchRightY = null;
    resetBall();
    updateHUD();
}

function resetBall() {
    ballX = W / 2;
    ballY = H / 2;
    const angle = (Math.random() - 0.5) * Math.PI / 3;
    const dir = Math.random() > 0.5 ? 1 : -1;
    ballDX = dir * Math.cos(angle);
    ballDY = Math.sin(angle);
    const len = Math.sqrt(ballDX * ballDX + ballDY * ballDY);
    ballDX = (ballDX / len) * ballSpeed;
    ballDY = (ballDY / len) * ballSpeed;
}

// --- Timer ---
function startTimer() {
    timer = GAME_DURATION;
    updateTimerDisplay();
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (gamePaused) return;
        timer--;
        updateTimerDisplay();
        if (timer <= 0) {
            clearInterval(timerInterval);
            endGame(leftScore > rightScore ? settings.p1Name + ' Wins!' :
                    rightScore > leftScore ? settings.p2Name + ' Wins!' : "It's a Tie!");
        }
    }, 1000);
}

function updateTimerDisplay() {
    const m = Math.floor(timer / 60);
    const s = timer % 60;
    $('timerDisplay').textContent = m + ':' + (s < 10 ? '0' : '') + s;
}

function updateHUD() {
    $('leftScoreHUD').textContent = leftScore;
    $('rightScoreHUD').textContent = rightScore;
}

// --- Game Loop ---
function gameLoop(timestamp) {
    if (!gameActive) return;

    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    if (!gamePaused) {
        update(dt);
        render();
    }

    rafId = requestAnimationFrame(gameLoop);
}

// --- Update ---
function update(dt) {
    // Ball movement
    const speed = ballSpeed * ballSpeedMod;
    const len = Math.sqrt(ballDX * ballDX + ballDY * ballDY);
    if (len > 0) {
        ballDX = (ballDX / len) * speed;
        ballDY = (ballDY / len) * speed;
    }

    ballX += ballDX * dt;
    ballY += ballDY * dt;

    // Wall bounce
    if (ballY - ballRadius < 0) { ballY = ballRadius; ballDY = Math.abs(ballDY); playSound(audio.hit); }
    if (ballY + ballRadius > H) { ballY = H - ballRadius; ballDY = -Math.abs(ballDY); playSound(audio.hit); }

    const ph = paddleH * paddleHMod;

    // Left paddle collision
    const lx = paddleMargin + paddleW;
    if (ballDX < 0 && ballX - ballRadius <= lx && ballX - ballRadius > lx - speed * dt * 2 &&
        ballY >= leftY && ballY <= leftY + ph) {
        ballX = lx + ballRadius;
        const hit = (ballY - leftY) / ph - 0.5;
        const angle = hit * (Math.PI / 3);
        ballDX = Math.abs(Math.cos(angle)) * speed;
        ballDY = Math.sin(angle) * speed;
        ballSpeedMod = Math.min(ballSpeedMod * 1.03, 2.0);
        playSound(audio.hit);
    }

    // Right paddle collision
    const rx = W - paddleMargin - paddleW;
    if (ballDX > 0 && ballX + ballRadius >= rx && ballX + ballRadius < rx + speed * dt * 2 &&
        ballY >= rightY && ballY <= rightY + ph) {
        ballX = rx - ballRadius;
        const hit = (ballY - rightY) / ph - 0.5;
        const angle = hit * (Math.PI / 3);
        ballDX = -Math.abs(Math.cos(angle)) * speed;
        ballDY = Math.sin(angle) * speed;
        ballSpeedMod = Math.min(ballSpeedMod * 1.03, 2.0);
        playSound(audio.hit);
    }

    // Scoring
    if (ballX < -ballRadius) {
        rightScore++;
        playSound(audio.score);
        ballSpeedMod = 1;
        updateHUD();
        if (rightScore >= WINNING_SCORE) { endGame(settings.p2Name + ' Wins!'); return; }
        resetBall();
    }
    if (ballX > W + ballRadius) {
        leftScore++;
        playSound(audio.score);
        ballSpeedMod = 1;
        updateHUD();
        if (leftScore >= WINNING_SCORE) { endGame(settings.p1Name + ' Wins!'); return; }
        resetBall();
    }

    // Touch-based paddle control
    if (touchLeftY !== null) {
        const target = touchLeftY - ph / 2;
        leftY += (target - leftY) * Math.min(1, dt * 18);
    }
    if (touchRightY !== null && settings.gameMode === 2) {
        const target = touchRightY - ph / 2;
        rightY += (target - rightY) * Math.min(1, dt * 18);
    }

    // Keyboard paddle control
    if (keysDown.has('ArrowUp') || keysDown.has('w')) leftY -= paddleSpeed * dt;
    if (keysDown.has('ArrowDown') || keysDown.has('s')) leftY += paddleSpeed * dt;

    if (settings.gameMode === 2) {
        if (keysDown.has('i')) rightY -= paddleSpeed * dt;
        if (keysDown.has('k')) rightY += paddleSpeed * dt;
    }

    // Clamp paddles
    leftY = Math.max(0, Math.min(H - ph, leftY));
    rightY = Math.max(0, Math.min(H - ph, rightY));

    // AI
    if (settings.gameMode === 1) updateAI(dt);

    // Power-ups
    powerUpTimer += dt;
    if (!activePowerUp && powerUpTimer >= POWER_UP_INTERVAL) {
        spawnPowerUp();
        powerUpTimer = 0;
    }
    if (activePowerUp) checkPowerUpCollision();
}

// --- AI ---
function updateAI(dt) {
    const cfg = AI_SETTINGS[settings.difficulty] || AI_SETTINGS.medium;
    const ph = paddleH * paddleHMod;
    let targetY;

    if (ballDX > 0) {
        const timeToReach = (W - paddleMargin - paddleW - ballX) / (Math.abs(ballDX) || 1);
        let predY = ballY + ballDY * timeToReach;
        // Bounce prediction
        while (predY < 0 || predY > H) {
            if (predY < 0) predY = -predY;
            if (predY > H) predY = 2 * H - predY;
        }
        targetY = predY + (Math.random() - 0.5) * cfg.error;
    } else {
        targetY = H / 2;
    }

    const center = rightY + ph / 2;
    const diff = targetY - center;
    const maxMove = paddleSpeed * cfg.speed * dt;
    if (Math.abs(diff) > 2) {
        rightY += Math.sign(diff) * Math.min(Math.abs(diff), maxMove);
    }
    rightY = Math.max(0, Math.min(H - ph, rightY));
}

// --- Power-ups ---
const POWER_UP_TYPES = [
    { type: 'speedUp',    color: '#FF4444', label: 'SPEED+' },
    { type: 'speedDown',  color: '#4488FF', label: 'SLOW' },
    { type: 'growPaddle', color: '#44FF44', label: 'GROW' },
    { type: 'shrinkPaddle', color: '#FF44FF', label: 'SHRINK' }
];

function spawnPowerUp() {
    const kind = POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)];
    activePowerUp = {
        x: W * 0.3 + Math.random() * W * 0.4,
        y: H * 0.2 + Math.random() * H * 0.6,
        size: Math.max(14, Math.min(W, H) * 0.035),
        ...kind
    };
}

function checkPowerUpCollision() {
    if (!activePowerUp) return;
    const dx = ballX - activePowerUp.x;
    const dy = ballY - activePowerUp.y;
    if (Math.sqrt(dx * dx + dy * dy) < activePowerUp.size + ballRadius) {
        applyPowerUp(activePowerUp.type);
        playSound(audio.powerUp);
        activePowerUp = null;
    }
}

function applyPowerUp(type) {
    const duration = 6000;
    if (type === 'speedUp') {
        ballSpeedMod *= 1.4;
        setTimeout(() => { ballSpeedMod = Math.max(1, ballSpeedMod / 1.4); }, duration);
    } else if (type === 'speedDown') {
        ballSpeedMod *= 0.6;
        setTimeout(() => { ballSpeedMod = Math.min(2, ballSpeedMod / 0.6); }, duration);
    } else if (type === 'growPaddle') {
        paddleHMod = 1.5;
        setTimeout(() => { paddleHMod = 1; }, duration);
    } else if (type === 'shrinkPaddle') {
        paddleHMod = 0.65;
        setTimeout(() => { paddleHMod = 1; }, duration);
    }
}

// --- Render ---
function render() {
    ctx.clearRect(0, 0, W, H);
    const hc = settings.highContrast;

    // Court background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, hc ? '#000' : '#0a1628');
    grad.addColorStop(1, hc ? '#111' : '#0f2235');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Center line
    ctx.setLineDash([8, 12]);
    ctx.strokeStyle = hc ? '#666' : 'rgba(255,255,255,.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Center circle
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, Math.min(W, H) * 0.08, 0, Math.PI * 2);
    ctx.strokeStyle = hc ? '#666' : 'rgba(255,255,255,.08)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const ph = paddleH * paddleHMod;
    const padColor = hc ? '#FFF' : '#00E5A0';
    const ballColor = hc ? '#FFF' : '#FFD700';

    // Paddles
    drawRoundRect(paddleMargin, leftY, paddleW, ph, 6, padColor);
    drawRoundRect(W - paddleMargin - paddleW, rightY, paddleW, ph, 6, padColor);

    // Ball
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = ballColor;
    ctx.fill();

    // Ball trail (subtle)
    ctx.beginPath();
    ctx.arc(ballX - ballDX * 0.02, ballY - ballDY * 0.02, ballRadius * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = hc ? 'rgba(255,255,255,.3)' : 'rgba(255,215,0,.25)';
    ctx.fill();

    // Power-up
    if (activePowerUp) {
        const pu = activePowerUp;
        const pulse = 1 + Math.sin(performance.now() / 300) * 0.15;
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, pu.size * pulse, 0, Math.PI * 2);
        ctx.fillStyle = pu.color + '40';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, pu.size * 0.6 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = pu.color;
        ctx.fill();
        ctx.font = `bold ${Math.round(pu.size * 0.5)}px 'Roboto', sans-serif`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pu.label, pu.x, pu.y + pu.size * 1.4);
    }
}

function drawRoundRect(x, y, w, h, r, color) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = color;
    ctx.fill();
}

// --- Touch Controls ---
canvas.addEventListener('touchstart', handleTouch, { passive: false });
canvas.addEventListener('touchmove', handleTouch, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

function handleTouch(e) {
    e.preventDefault();
    for (const touch of e.touches) {
        const x = touch.clientX;
        const y = touch.clientY;
        if (x < W / 2) {
            touchLeftY = y;
        } else {
            touchRightY = y;
        }
    }
}

function handleTouchEnd(e) {
    const still = new Set();
    for (const t of e.touches) {
        if (t.clientX < W / 2) still.add('left');
        else still.add('right');
    }
    if (!still.has('left')) touchLeftY = null;
    if (!still.has('right')) touchRightY = null;
}

// --- Keyboard ---
const keysDown = new Set();
window.addEventListener('keydown', e => {
    keysDown.add(e.key);
    if (e.key === 'Escape' && gameActive) togglePause();
});
window.addEventListener('keyup', e => keysDown.delete(e.key));

// --- Pause ---
$('pauseBtn').addEventListener('click', togglePause);
$('resumeBtn').addEventListener('click', togglePause);
$('pauseRestartBtn').addEventListener('click', () => { togglePause(); restartGame(); });
$('pauseQuitBtn').addEventListener('click', () => { quitToMenu(); });

function togglePause() {
    if (!gameActive) return;
    gamePaused = !gamePaused;
    screens.pause.style.display = gamePaused ? 'flex' : 'none';
    if (gamePaused) { stopMusic(); } else { startMusic(); }
}

// --- Restart ---
$('restartBtn').addEventListener('click', restartGame);

function restartGame() {
    clearInterval(timerInterval);
    resetGameState();
    startTimer();
    startMusic();
    gamePaused = false;
    screens.pause.style.display = 'none';
}

// --- End Game ---
function endGame(message) {
    gameActive = false;
    gamePaused = false;
    clearInterval(timerInterval);
    if (rafId) cancelAnimationFrame(rafId);
    stopMusic();

    canvas.style.display = 'none';
    screens.hud.style.display = 'none';
    screens.controls.style.display = 'none';
    screens.pause.style.display = 'none';

    $('winnerMessage').textContent = message;
    $('finalScore').textContent = leftScore + ' - ' + rightScore;
    screens.gameOver.style.display = 'flex';
}

$('playAgainButton').addEventListener('click', () => {
    screens.gameOver.style.display = 'none';
    startGame();
});

$('mainMenuButton').addEventListener('click', quitToMenu);

function quitToMenu() {
    gameActive = false;
    gamePaused = false;
    clearInterval(timerInterval);
    if (rafId) cancelAnimationFrame(rafId);
    stopMusic();
    canvas.style.display = 'none';
    screens.hud.style.display = 'none';
    screens.controls.style.display = 'none';
    screens.pause.style.display = 'none';
    screens.gameOver.style.display = 'none';
    showScreen('menu');
}

// --- Resize ---
window.addEventListener('resize', () => {
    if (gameActive) {
        const oldW = W, oldH = H;
        resizeCanvas();
        ballX = (ballX / oldW) * W;
        ballY = (ballY / oldH) * H;
        leftY = (leftY / oldH) * H;
        rightY = (rightY / oldH) * H;
    }
});

// PWA service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
}

})();
