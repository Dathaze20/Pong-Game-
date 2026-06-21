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

// --- Web Audio API for synthesized sound effects ---
let audioCtx = null;

function getAudioCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

function synthHit() {
    if (!settings.sfxOn) return;
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
    } catch (_) {}
}

function synthScore() {
    if (!settings.sfxOn) return;
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
    } catch (_) {}
}

function synthPowerUp() {
    if (!settings.sfxOn) return;
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    } catch (_) {}
}

function synthWallBounce() {
    if (!settings.sfxOn) return;
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
    } catch (_) {}
}

// --- Background Music (HTML audio element - has the Tetris MP3) ---
const bgMusicEl = $('bgMusic');

function startMusic() {
    if (!settings.musicOn || !bgMusicEl) return;
    bgMusicEl.volume = 0.35;
    bgMusicEl.play().catch(() => {});
}

function stopMusic() {
    if (bgMusicEl) { bgMusicEl.pause(); bgMusicEl.currentTime = 0; }
}

// --- Haptic feedback ---
function vibrate(ms) {
    if (navigator.vibrate) navigator.vibrate(ms);
}

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

// --- Game Config ---
const WINNING_SCORE = 10;
const GAME_DURATION = 60;
const POWER_UP_INTERVAL = 12;

const AI_SETTINGS = {
    easy:   { speed: 0.7, error: 45 },
    medium: { speed: 0.88, error: 20 },
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

// Score flash animation
let scoreFlash = null;

// Particles
let particles = [];

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
    ballRadius = Math.max(6, ref * 0.015);
    paddleW = Math.max(10, ref * 0.028);
    paddleH = Math.max(55, ref * 0.17);
    paddleMargin = Math.max(12, ref * 0.035);
    paddleSpeed = ref * 0.85;
    ballSpeed = ref * 0.42;
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
    // Unlock audio context on user gesture (Android requirement)
    getAudioCtx();
    if (bgMusicEl) { bgMusicEl.load(); }

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
    particles = [];
    scoreFlash = null;
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
    const el = $('timerDisplay');
    el.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    el.style.color = timer <= 10 ? '#FF4444' : '#FFD700';
}

function updateHUD() {
    $('leftScoreHUD').textContent = leftScore;
    $('rightScoreHUD').textContent = rightScore;
}

// --- Particles ---
function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            life: 0.4 + Math.random() * 0.3,
            maxLife: 0.4 + Math.random() * 0.3,
            size: 2 + Math.random() * 3,
            color
        });
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function renderParticles() {
    for (const p of particles) {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
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
    const speed = ballSpeed * ballSpeedMod;
    const len = Math.sqrt(ballDX * ballDX + ballDY * ballDY);
    if (len > 0) {
        ballDX = (ballDX / len) * speed;
        ballDY = (ballDY / len) * speed;
    }

    ballX += ballDX * dt;
    ballY += ballDY * dt;

    // Wall bounce
    if (ballY - ballRadius < 0) {
        ballY = ballRadius;
        ballDY = Math.abs(ballDY);
        synthWallBounce();
    }
    if (ballY + ballRadius > H) {
        ballY = H - ballRadius;
        ballDY = -Math.abs(ballDY);
        synthWallBounce();
    }

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
        synthHit();
        vibrate(15);
        spawnParticles(lx, ballY, '#00E5A0', 6);
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
        synthHit();
        vibrate(15);
        spawnParticles(rx, ballY, '#00E5A0', 6);
    }

    // Scoring
    if (ballX < -ballRadius) {
        rightScore++;
        synthScore();
        vibrate([30, 50, 30]);
        ballSpeedMod = 1;
        scoreFlash = { side: 'right', time: 0.6 };
        spawnParticles(0, ballY, '#FFD700', 12);
        updateHUD();
        if (rightScore >= WINNING_SCORE) { endGame(settings.p2Name + ' Wins!'); return; }
        resetBall();
    }
    if (ballX > W + ballRadius) {
        leftScore++;
        synthScore();
        vibrate([30, 50, 30]);
        ballSpeedMod = 1;
        scoreFlash = { side: 'left', time: 0.6 };
        spawnParticles(W, ballY, '#FFD700', 12);
        updateHUD();
        if (leftScore >= WINNING_SCORE) { endGame(settings.p1Name + ' Wins!'); return; }
        resetBall();
    }

    // Touch-based paddle control (smooth interpolation)
    if (touchLeftY !== null) {
        const target = touchLeftY - ph / 2;
        leftY += (target - leftY) * Math.min(1, dt * 20);
    }
    if (touchRightY !== null && settings.gameMode === 2) {
        const target = touchRightY - ph / 2;
        rightY += (target - rightY) * Math.min(1, dt * 20);
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

    // Particles
    updateParticles(dt);

    // Score flash
    if (scoreFlash) {
        scoreFlash.time -= dt;
        if (scoreFlash.time <= 0) scoreFlash = null;
    }
}

// --- AI ---
function updateAI(dt) {
    const cfg = AI_SETTINGS[settings.difficulty] || AI_SETTINGS.medium;
    const ph = paddleH * paddleHMod;
    let targetY;

    if (ballDX > 0) {
        const dist = W - paddleMargin - paddleW - ballX;
        const timeToReach = dist / (Math.abs(ballDX) || 1);
        let predY = ballY + ballDY * timeToReach;
        let bounces = 0;
        while ((predY < 0 || predY > H) && bounces < 10) {
            if (predY < 0) predY = -predY;
            if (predY > H) predY = 2 * H - predY;
            bounces++;
        }
        targetY = predY + (Math.random() - 0.5) * cfg.error;
    } else {
        targetY = H / 2;
    }

    const center = rightY + ph / 2;
    const diff = targetY - center;
    const maxMove = paddleSpeed * cfg.speed * dt;
    if (Math.abs(diff) > 3) {
        rightY += Math.sign(diff) * Math.min(Math.abs(diff) * 0.8, maxMove);
    }
    rightY = Math.max(0, Math.min(H - ph, rightY));
}

// --- Power-ups ---
const POWER_UP_TYPES = [
    { type: 'speedUp',      color: '#FF4444', label: 'SPEED+' },
    { type: 'speedDown',    color: '#4488FF', label: 'SLOW' },
    { type: 'growPaddle',   color: '#44FF44', label: 'GROW' },
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
        synthPowerUp();
        vibrate(25);
        spawnParticles(activePowerUp.x, activePowerUp.y, activePowerUp.color, 10);
        activePowerUp = null;
    }
}

function applyPowerUp(type) {
    const dur = 6000;
    if (type === 'speedUp') {
        ballSpeedMod *= 1.4;
        setTimeout(() => { ballSpeedMod = Math.max(1, ballSpeedMod / 1.4); }, dur);
    } else if (type === 'speedDown') {
        ballSpeedMod *= 0.6;
        setTimeout(() => { ballSpeedMod = Math.min(2, ballSpeedMod / 0.6); }, dur);
    } else if (type === 'growPaddle') {
        paddleHMod = 1.5;
        setTimeout(() => { paddleHMod = 1; }, dur);
    } else if (type === 'shrinkPaddle') {
        paddleHMod = 0.65;
        setTimeout(() => { paddleHMod = 1; }, dur);
    }
}

// --- Render ---
function render() {
    ctx.clearRect(0, 0, W, H);
    const hc = settings.highContrast;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, hc ? '#000' : '#0a1628');
    grad.addColorStop(1, hc ? '#111' : '#0d1f3c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Score flash overlay
    if (scoreFlash) {
        const alpha = scoreFlash.time * 0.3;
        if (scoreFlash.side === 'left') {
            ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
            ctx.fillRect(0, 0, W / 2, H);
        } else {
            ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
            ctx.fillRect(W / 2, 0, W / 2, H);
        }
    }

    // Center line
    ctx.setLineDash([6, 10]);
    ctx.strokeStyle = hc ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Center circle
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, Math.min(W, H) * 0.07, 0, Math.PI * 2);
    ctx.strokeStyle = hc ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.06)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const ph = paddleH * paddleHMod;
    const padColor = hc ? '#FFFFFF' : '#00E5A0';
    const ballColor = hc ? '#FFFFFF' : '#FFD700';

    // Paddle glow (lightweight)
    if (!hc) {
        ctx.fillStyle = 'rgba(0, 229, 160, 0.08)';
        ctx.fillRect(paddleMargin - 4, leftY - 4, paddleW + 8, ph + 8);
        ctx.fillRect(W - paddleMargin - paddleW - 4, rightY - 4, paddleW + 8, ph + 8);
    }

    // Paddles
    drawRoundRect(paddleMargin, leftY, paddleW, ph, paddleW / 3, padColor);
    drawRoundRect(W - paddleMargin - paddleW, rightY, paddleW, ph, paddleW / 3, padColor);

    // Ball glow
    if (!hc) {
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.06)';
        ctx.fill();
    }

    // Ball trail
    ctx.beginPath();
    ctx.arc(ballX - ballDX * 0.015, ballY - ballDY * 0.015, ballRadius * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = hc ? 'rgba(255,255,255,.2)' : 'rgba(255,215,0,.2)';
    ctx.fill();

    // Ball
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = ballColor;
    ctx.fill();

    // Power-up
    if (activePowerUp) {
        const pu = activePowerUp;
        const pulse = 1 + Math.sin(performance.now() / 250) * 0.15;
        // Outer glow
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, pu.size * pulse * 1.3, 0, Math.PI * 2);
        ctx.fillStyle = pu.color + '15';
        ctx.fill();
        // Inner ring
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, pu.size * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = pu.color + '80';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Core
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, pu.size * 0.5 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = pu.color;
        ctx.fill();
        // Label
        ctx.font = `bold ${Math.round(pu.size * 0.45)}px 'Roboto', sans-serif`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(pu.label, pu.x, pu.y + pu.size * 1.2);
    }

    // Particles
    renderParticles();

    // Player names at bottom
    ctx.font = `${Math.round(Math.min(W, H) * 0.025)}px 'Roboto', sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,.2)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(settings.p1Name, W * 0.25, H - 8);
    ctx.fillText(settings.p2Name, W * 0.75, H - 8);
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
        if (touch.clientX < W / 2) {
            touchLeftY = touch.clientY;
        } else {
            touchRightY = touch.clientY;
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
$('pauseRestartBtn').addEventListener('click', () => { gamePaused = false; screens.pause.style.display = 'none'; restartGame(); });
$('pauseQuitBtn').addEventListener('click', quitToMenu);

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
    vibrate([50, 100, 50, 100, 80]);

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
    if (!gameActive) return;
    const oldW = W, oldH = H;
    resizeCanvas();
    if (oldW > 0 && oldH > 0) {
        ballX = (ballX / oldW) * W;
        ballY = (ballY / oldH) * H;
        leftY = (leftY / oldH) * H;
        rightY = (rightY / oldH) * H;
    }
});

// Prevent pull-to-refresh on Android
document.addEventListener('touchmove', e => {
    if (gameActive) e.preventDefault();
}, { passive: false });

// PWA service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
}

})();
