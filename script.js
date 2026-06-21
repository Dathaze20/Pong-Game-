(function () {
'use strict';

const $ = id => document.getElementById(id);
const canvas = $('gameCanvas');
const ctx = canvas.getContext('2d');

const screens = {
    splash: $('splashScreen'), menu: $('mainMenu'), settings: $('settingsMenu'),
    howToPlay: $('howToPlay'), gameOver: $('gameOverScreen'), pause: $('pauseOverlay'),
    hud: $('gameHUD'), controls: $('gameControls')
};

// ===== WEB AUDIO =====
let audioCtx = null;
function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

function synthHit() {
    if (!settings.sfxOn) return;
    try {
        const c = getAudioCtx(), o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'square';
        o.frequency.setValueAtTime(660, c.currentTime);
        o.frequency.exponentialRampToValueAtTime(330, c.currentTime + 0.06);
        g.gain.setValueAtTime(0.18, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
        o.start(c.currentTime); o.stop(c.currentTime + 0.08);
    } catch (_) {}
}
function synthScore() {
    if (!settings.sfxOn) return;
    try {
        const c = getAudioCtx(), o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(523, c.currentTime);
        o.frequency.setValueAtTime(784, c.currentTime + 0.08);
        o.frequency.setValueAtTime(1047, c.currentTime + 0.16);
        g.gain.setValueAtTime(0.22, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
        o.start(c.currentTime); o.stop(c.currentTime + 0.3);
    } catch (_) {}
}
function synthPowerUp() {
    if (!settings.sfxOn) return;
    try {
        const c = getAudioCtx(), o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(400, c.currentTime);
        o.frequency.exponentialRampToValueAtTime(1600, c.currentTime + 0.2);
        g.gain.setValueAtTime(0.2, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
        o.start(c.currentTime); o.stop(c.currentTime + 0.25);
    } catch (_) {}
}
function synthWall() {
    if (!settings.sfxOn) return;
    try {
        const c = getAudioCtx(), o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(350, c.currentTime);
        o.frequency.exponentialRampToValueAtTime(175, c.currentTime + 0.04);
        g.gain.setValueAtTime(0.12, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
        o.start(c.currentTime); o.stop(c.currentTime + 0.06);
    } catch (_) {}
}

const bgMusicEl = $('bgMusic');
function startMusic() {
    if (!settings.musicOn || !bgMusicEl) return;
    bgMusicEl.volume = 0.35;
    bgMusicEl.play().catch(() => {});
}
function stopMusic() { if (bgMusicEl) { bgMusicEl.pause(); bgMusicEl.currentTime = 0; } }
function vibrate(ms) { if (navigator.vibrate) navigator.vibrate(ms); }

// ===== SETTINGS =====
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

// ===== CONFIG =====
const WIN_SCORE = 10;
const GAME_TIME = 90;
const POWERUP_INTERVAL = 10;

// AI: snappy and competitive - kids who play Fortnite expect fast opponents
const AI_CFG = {
    easy:   { speed: 0.85, err: 30, react: 0.95 },
    medium: { speed: 1.0,  err: 12, react: 1.0 },
    hard:   { speed: 1.15, err: 3,  react: 1.0 }
};

// ===== STATE =====
let gameOn = false, paused = false, rafId = null, lastT = 0;
let bx, by, bdx, bdy, bspd, brad;
let pw, ph, pmar, pspd;
let ly, ry, lscore, rscore;
let timer, timerInt;
let tLeftY = null, tRightY = null;
let powerUp = null, puTimer = 0;
let phMod = 1, bspdMod = 1;
let particles = [], announceQ = null;
let screenShake = 0;
let combo = 0, lastScorer = '';
let hue = 0; // rainbow cycle

let dpr = 1, W = 0, H = 0;

// ===== RESIZE =====
function resize() {
    dpr = window.devicePixelRatio || 1;
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale();
}

function scale() {
    const r = Math.min(W, H);
    brad = Math.max(7, r * 0.018);
    pw = Math.max(12, r * 0.03);
    ph = Math.max(65, r * 0.2);
    pmar = Math.max(14, r * 0.04);
    pspd = r * 1.6;
    bspd = r * 0.72;
}

// ===== SCREENS =====
function showScreen(name) {
    Object.entries(screens).forEach(([k, el]) => {
        if (!el || k === 'hud' || k === 'controls') return;
        el.style.display = k === name ? 'flex' : 'none';
    });
}
function showGame() {
    Object.values(screens).forEach(s => { if (s) s.style.display = 'none'; });
    canvas.style.display = 'block';
    screens.hud.style.display = 'flex';
    screens.controls.style.display = 'flex';
}

// ===== SPLASH =====
setTimeout(() => { screens.splash.style.display = 'none'; showScreen('menu'); applySettings(); }, 2000);

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

// ===== NAV =====
$('settingsButton').addEventListener('click', () => showScreen('settings'));
$('backToMenuButton').addEventListener('click', () => { showScreen('menu'); applySettings(); });
$('howToPlayButton').addEventListener('click', () => showScreen('howToPlay'));
$('backFromHowToPlay').addEventListener('click', () => showScreen('menu'));
$('rateUsButton').addEventListener('click', () => alert('Thanks for playing Super Pong! You rock! ⭐'));

// ===== START =====
$('startGameButton').addEventListener('click', () => {
    getAudioCtx();
    if (bgMusicEl) bgMusicEl.load();
    settings.p1Name = $('player1NameInput').value.trim() || 'Player 1';
    settings.p2Name = $('player2NameInput').value.trim() || 'Player 2';
    settings.gameMode = $('gameMode').value;
    startGame();
});

function startGame() {
    resize();
    resetState();
    showGame();
    startMusic();
    startTimer();
    gameOn = true; paused = false;
    lastT = performance.now();
    announce('READY? GO!');
    rafId = requestAnimationFrame(loop);
}

function resetState() {
    lscore = rscore = 0;
    phMod = bspdMod = 1;
    powerUp = null; puTimer = 0;
    particles = []; announceQ = null;
    screenShake = 0; combo = 0; lastScorer = '';
    ly = ry = (H - ph) / 2;
    tLeftY = tRightY = null;
    resetBall();
    updateHUD();
}

function resetBall() {
    bx = W / 2; by = H / 2;
    const ang = (Math.random() - 0.5) * Math.PI / 4;
    const dir = Math.random() > 0.5 ? 1 : -1;
    bdx = dir * Math.cos(ang);
    bdy = Math.sin(ang);
    const len = Math.sqrt(bdx * bdx + bdy * bdy);
    bdx = (bdx / len) * bspd;
    bdy = (bdy / len) * bspd;
}

// ===== TIMER =====
function startTimer() {
    timer = GAME_TIME;
    updateTimer();
    clearInterval(timerInt);
    timerInt = setInterval(() => {
        if (paused) return;
        timer--;
        updateTimer();
        if (timer <= 0) {
            clearInterval(timerInt);
            endGame(lscore > rscore ? settings.p1Name + ' Wins!' :
                    rscore > lscore ? settings.p2Name + ' Wins!' : "It's a Tie!");
        }
    }, 1000);
}
function updateTimer() {
    const m = Math.floor(timer / 60), s = timer % 60;
    const el = $('timerDisplay');
    el.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    el.style.color = timer <= 10 ? '#FF4444' : '#FFD700';
}
function updateHUD() {
    $('leftScoreHUD').textContent = lscore;
    $('rightScoreHUD').textContent = rscore;
}

// ===== ANNOUNCE =====
function announce(text) {
    const el = $('announceText');
    el.textContent = text;
    el.style.display = 'block';
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = 'announceIn .4s cubic-bezier(.17,.67,.3,1.33)';
    clearTimeout(announceQ);
    announceQ = setTimeout(() => { el.style.display = 'none'; }, 1200);
}

// ===== PARTICLES =====
function spawnParticles(x, y, colors, count, big) {
    const sz = big ? 6 : 3;
    const spd = big ? 400 : 250;
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * spd,
            vy: (Math.random() - 0.5) * spd,
            life: 0.5 + Math.random() * 0.4,
            maxLife: 0.5 + Math.random() * 0.4,
            size: sz + Math.random() * sz,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }
}
function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vy += 300 * dt; // gravity
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
    }
}
function renderParticles() {
    for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// ===== GAME LOOP =====
function loop(ts) {
    if (!gameOn) return;
    const dt = Math.min((ts - lastT) / 1000, 0.033); // cap at ~30fps minimum step
    lastT = ts;
    if (!paused) { update(dt); render(); }
    rafId = requestAnimationFrame(loop);
}

// ===== UPDATE =====
function update(dt) {
    hue = (hue + dt * 120) % 360; // rainbow cycle

    const spd = bspd * bspdMod;
    const len = Math.sqrt(bdx * bdx + bdy * bdy);
    if (len > 0) { bdx = (bdx / len) * spd; bdy = (bdy / len) * spd; }

    bx += bdx * dt;
    by += bdy * dt;

    // walls
    if (by - brad < 0) { by = brad; bdy = Math.abs(bdy); synthWall(); }
    if (by + brad > H) { by = H - brad; bdy = -Math.abs(bdy); synthWall(); }

    const pph = ph * phMod;

    // left paddle hit
    const lx = pmar + pw;
    if (bdx < 0 && bx - brad <= lx && bx + brad > pmar &&
        by + brad >= ly && by - brad <= ly + pph) {
        bx = lx + brad;
        const hit = (by - ly) / pph - 0.5;
        const a = hit * (Math.PI / 3);
        bdx = Math.abs(Math.cos(a)) * spd;
        bdy = Math.sin(a) * spd;
        bspdMod = Math.min(bspdMod * 1.04, 2.2);
        synthHit(); vibrate(12);
        spawnParticles(lx, by, ['#00F0FF', '#39FF14', '#fff'], 8, false);
        screenShake = 0.08;
    }

    // right paddle hit
    const rx = W - pmar - pw;
    if (bdx > 0 && bx + brad >= rx && bx - brad < W - pmar &&
        by + brad >= ry && by - brad <= ry + pph) {
        bx = rx - brad;
        const hit = (by - ry) / pph - 0.5;
        const a = hit * (Math.PI / 3);
        bdx = -Math.abs(Math.cos(a)) * spd;
        bdy = Math.sin(a) * spd;
        bspdMod = Math.min(bspdMod * 1.04, 2.2);
        synthHit(); vibrate(12);
        spawnParticles(rx, by, ['#FF6BF5', '#FFD700', '#fff'], 8, false);
        screenShake = 0.08;
    }

    // scoring
    if (bx < -brad * 2) {
        rscore++;
        bspdMod = 1;
        if (lastScorer === 'right') { combo++; } else { combo = 1; lastScorer = 'right'; }
        synthScore(); vibrate([20, 40, 20]);
        spawnParticles(0, by, ['#FF6BF5', '#FFD700', '#00F0FF', '#39FF14'], 20, true);
        screenShake = 0.15;
        const msgs = ['GOAL!', 'NICE!', 'BOOM!', 'EPIC!', 'WOW!'];
        let msg = msgs[Math.floor(Math.random() * msgs.length)];
        if (combo >= 3) msg = combo + 'x COMBO!!';
        announce(msg);
        updateHUD();
        if (rscore >= WIN_SCORE) { endGame(settings.p2Name + ' Wins!'); return; }
        resetBall();
    }
    if (bx > W + brad * 2) {
        lscore++;
        bspdMod = 1;
        if (lastScorer === 'left') { combo++; } else { combo = 1; lastScorer = 'left'; }
        synthScore(); vibrate([20, 40, 20]);
        spawnParticles(W, by, ['#00F0FF', '#FFD700', '#FF6BF5', '#39FF14'], 20, true);
        screenShake = 0.15;
        const msgs = ['GOAL!', 'NICE!', 'BOOM!', 'EPIC!', 'WOW!'];
        let msg = msgs[Math.floor(Math.random() * msgs.length)];
        if (combo >= 3) msg = combo + 'x COMBO!!';
        announce(msg);
        updateHUD();
        if (lscore >= WIN_SCORE) { endGame(settings.p1Name + ' Wins!'); return; }
        resetBall();
    }

    // TOUCH: instant follow (no sluggish lerp!)
    if (tLeftY !== null) { ly = tLeftY - pph / 2; }
    if (tRightY !== null && settings.gameMode === 2) { ry = tRightY - pph / 2; }

    // keyboard
    if (keys.has('ArrowUp') || keys.has('w')) ly -= pspd * dt;
    if (keys.has('ArrowDown') || keys.has('s')) ly += pspd * dt;
    if (settings.gameMode === 2) {
        if (keys.has('i')) ry -= pspd * dt;
        if (keys.has('k')) ry += pspd * dt;
    }

    // clamp
    ly = Math.max(0, Math.min(H - pph, ly));
    ry = Math.max(0, Math.min(H - pph, ry));

    // AI
    if (settings.gameMode === 1) updateAI(dt);

    // power-ups
    puTimer += dt;
    if (!powerUp && puTimer >= POWERUP_INTERVAL) { spawnPowerUp(); puTimer = 0; }
    if (powerUp) checkPowerUp();

    updateParticles(dt);
    if (screenShake > 0) screenShake = Math.max(0, screenShake - dt);
}

// ===== AI =====
function updateAI(dt) {
    const cfg = AI_CFG[settings.difficulty] || AI_CFG.medium;
    const pph = ph * phMod;
    let targetY;

    if (bdx > 0) {
        const dist = W - pmar - pw - bx;
        const ttr = dist / (Math.abs(bdx) || 1);
        let py = by + bdy * ttr;
        for (let i = 0; i < 12 && (py < 0 || py > H); i++) {
            if (py < 0) py = -py;
            if (py > H) py = 2 * H - py;
        }
        targetY = py + (Math.random() - 0.5) * cfg.err;
    } else {
        // stay active even when ball going away - track ball loosely
        targetY = by + (Math.random() - 0.5) * cfg.err * 2;
    }

    const center = ry + pph / 2;
    const diff = targetY - center;
    const maxMove = pspd * cfg.speed * cfg.react * dt;

    if (Math.abs(diff) > 2) {
        ry += Math.sign(diff) * Math.min(Math.abs(diff), maxMove);
    }
    ry = Math.max(0, Math.min(H - pph, ry));
}

// ===== POWER-UPS =====
const PU_TYPES = [
    { type: 'speed',  color: '#FF4444', emoji: '🔥', label: 'TURBO!' },
    { type: 'slow',   color: '#4488FF', emoji: '❄️', label: 'FREEZE!' },
    { type: 'grow',   color: '#39FF14', emoji: '💪', label: 'BIG!' },
    { type: 'shrink', color: '#FF6BF5', emoji: '🐜', label: 'TINY!' },
    { type: 'mega',   color: '#FFD700', emoji: '⭐', label: 'MEGA!' }
];

function spawnPowerUp() {
    const k = PU_TYPES[Math.floor(Math.random() * PU_TYPES.length)];
    powerUp = {
        x: W * 0.25 + Math.random() * W * 0.5,
        y: H * 0.15 + Math.random() * H * 0.7,
        size: Math.max(18, Math.min(W, H) * 0.045),
        ...k
    };
}

function checkPowerUp() {
    if (!powerUp) return;
    const dx = bx - powerUp.x, dy = by - powerUp.y;
    if (dx * dx + dy * dy < (powerUp.size + brad) * (powerUp.size + brad)) {
        applyPowerUp(powerUp.type);
        synthPowerUp(); vibrate(25);
        announce(powerUp.emoji + ' ' + powerUp.label);
        spawnParticles(powerUp.x, powerUp.y, [powerUp.color, '#fff', '#FFD700'], 15, true);
        powerUp = null;
    }
}

function applyPowerUp(type) {
    const dur = 6000;
    if (type === 'speed') {
        bspdMod *= 1.5;
        setTimeout(() => { bspdMod = Math.max(1, bspdMod / 1.5); }, dur);
    } else if (type === 'slow') {
        bspdMod *= 0.5;
        setTimeout(() => { bspdMod = Math.min(2.2, bspdMod / 0.5); }, dur);
    } else if (type === 'grow') {
        phMod = 1.6;
        setTimeout(() => { phMod = 1; }, dur);
    } else if (type === 'shrink') {
        phMod = 0.55;
        setTimeout(() => { phMod = 1; }, dur);
    } else if (type === 'mega') {
        bspdMod *= 1.3; phMod = 1.4;
        setTimeout(() => { bspdMod = Math.max(1, bspdMod / 1.3); phMod = 1; }, dur);
    }
}

// ===== RENDER =====
// Cache background gradient
let bgGrad = null, bgW = 0, bgH = 0;

function render() {
    // Screen shake offset
    let sx = 0, sy = 0;
    if (screenShake > 0) {
        sx = (Math.random() - 0.5) * screenShake * 60;
        sy = (Math.random() - 0.5) * screenShake * 60;
    }
    ctx.save();
    ctx.translate(sx, sy);

    const hc = settings.highContrast;

    // Background (cached)
    if (!bgGrad || bgW !== W || bgH !== H) {
        bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, hc ? '#000' : '#0a0018');
        bgGrad.addColorStop(0.5, hc ? '#0a0a0a' : '#120830');
        bgGrad.addColorStop(1, hc ? '#000' : '#0a1628');
        bgW = W; bgH = H;
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-10, -10, W + 20, H + 20);

    // Neon grid lines (subtle, kids love Tron vibes)
    if (!hc) {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
        ctx.lineWidth = 1;
        const gridSize = Math.max(40, Math.min(W, H) * 0.06);
        for (let x = gridSize; x < W; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = gridSize; y < H; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
    }

    // Center line
    ctx.setLineDash([8, 14]);
    ctx.strokeStyle = hc ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.08)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    ctx.setLineDash([]);

    // Center circle
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, Math.min(W, H) * 0.08, 0, Math.PI * 2);
    ctx.strokeStyle = hc ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.05)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const pph = ph * phMod;
    const leftColor = hc ? '#FFF' : '#00F0FF';
    const rightColor = hc ? '#FFF' : '#FF6BF5';
    const ballColor = hc ? '#FFF' : `hsl(${hue}, 100%, 60%)`;
    const ballGlow = hc ? '#FFF' : `hsl(${hue}, 100%, 50%)`;

    // Paddle glows
    if (!hc) {
        ctx.fillStyle = 'rgba(0, 240, 255, 0.06)';
        ctx.fillRect(pmar - 6, ly - 6, pw + 12, pph + 12);
        ctx.fillStyle = 'rgba(255, 107, 245, 0.06)';
        ctx.fillRect(W - pmar - pw - 6, ry - 6, pw + 12, pph + 12);
    }

    // Left paddle (gradient)
    let pg = ctx.createLinearGradient(pmar, ly, pmar, ly + pph);
    pg.addColorStop(0, hc ? '#FFF' : '#00F0FF');
    pg.addColorStop(1, hc ? '#CCC' : '#39FF14');
    ctx.beginPath(); ctx.roundRect(pmar, ly, pw, pph, pw / 2.5);
    ctx.fillStyle = pg; ctx.fill();

    // Right paddle (gradient)
    pg = ctx.createLinearGradient(W - pmar - pw, ry, W - pmar - pw, ry + pph);
    pg.addColorStop(0, hc ? '#FFF' : '#FF6BF5');
    pg.addColorStop(1, hc ? '#CCC' : '#FFD700');
    ctx.beginPath(); ctx.roundRect(W - pmar - pw, ry, pw, pph, pw / 2.5);
    ctx.fillStyle = pg; ctx.fill();

    // Ball trail (longer, colorful)
    if (!hc) {
        const steps = 5;
        for (let i = steps; i >= 1; i--) {
            const t = i / steps;
            ctx.beginPath();
            ctx.arc(bx - bdx * t * 0.025, by - bdy * t * 0.025, brad * (1 - t * 0.12), 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${(hue - i * 25 + 360) % 360}, 100%, 60%, ${0.15 - t * 0.025})`;
            ctx.fill();
        }
    }

    // Ball glow
    if (!hc) {
        ctx.beginPath();
        ctx.arc(bx, by, brad * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.08)`;
        ctx.fill();
    }

    // Ball
    ctx.beginPath();
    ctx.arc(bx, by, brad, 0, Math.PI * 2);
    ctx.fillStyle = ballColor;
    ctx.fill();
    // bright center
    ctx.beginPath();
    ctx.arc(bx - brad * 0.2, by - brad * 0.2, brad * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fill();

    // Power-up
    if (powerUp) {
        const pu = powerUp;
        const pulse = 1 + Math.sin(performance.now() / 200) * 0.2;
        // outer glow ring
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, pu.size * pulse * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = pu.color + '18';
        ctx.fill();
        // spinning ring
        ctx.beginPath();
        const ringAngle = performance.now() / 400;
        ctx.arc(pu.x, pu.y, pu.size * pulse, ringAngle, ringAngle + Math.PI * 1.5);
        ctx.strokeStyle = pu.color;
        ctx.lineWidth = 3;
        ctx.stroke();
        // core
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, pu.size * 0.45 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = pu.color;
        ctx.fill();
        // emoji label
        const fs = Math.round(pu.size * 0.7);
        ctx.font = `${fs}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(pu.emoji, pu.x, pu.y);
    }

    // Particles
    renderParticles();

    // Player names
    const nameSz = Math.round(Math.min(W, H) * 0.028);
    ctx.font = `900 ${nameSz}px 'Nunito', sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillStyle = hc ? 'rgba(255,255,255,.3)' : 'rgba(0, 240, 255, .25)';
    ctx.fillText(settings.p1Name, W * 0.25, H - 10);
    ctx.fillStyle = hc ? 'rgba(255,255,255,.3)' : 'rgba(255, 107, 245, .25)';
    ctx.fillText(settings.p2Name, W * 0.75, H - 10);

    ctx.restore();
}

// ===== TOUCH =====
canvas.addEventListener('touchstart', handleTouch, { passive: false });
canvas.addEventListener('touchmove', handleTouch, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

function handleTouch(e) {
    e.preventDefault();
    for (const t of e.touches) {
        if (t.clientX < W / 2) tLeftY = t.clientY;
        else tRightY = t.clientY;
    }
}
function handleTouchEnd(e) {
    const still = new Set();
    for (const t of e.touches) {
        if (t.clientX < W / 2) still.add('l'); else still.add('r');
    }
    if (!still.has('l')) tLeftY = null;
    if (!still.has('r')) tRightY = null;
}

// ===== KEYBOARD =====
const keys = new Set();
window.addEventListener('keydown', e => { keys.add(e.key); if (e.key === 'Escape' && gameOn) togglePause(); });
window.addEventListener('keyup', e => keys.delete(e.key));

// ===== PAUSE =====
$('pauseBtn').addEventListener('click', togglePause);
$('resumeBtn').addEventListener('click', togglePause);
$('pauseRestartBtn').addEventListener('click', () => { paused = false; screens.pause.style.display = 'none'; restart(); });
$('pauseQuitBtn').addEventListener('click', quit);

function togglePause() {
    if (!gameOn) return;
    paused = !paused;
    screens.pause.style.display = paused ? 'flex' : 'none';
    if (paused) stopMusic(); else startMusic();
}

$('restartBtn').addEventListener('click', restart);
function restart() {
    clearInterval(timerInt); resetState(); startTimer(); startMusic();
    paused = false; screens.pause.style.display = 'none';
}

// ===== END =====
function endGame(msg) {
    gameOn = false; paused = false;
    clearInterval(timerInt);
    if (rafId) cancelAnimationFrame(rafId);
    stopMusic();
    vibrate([40, 80, 40, 80, 60]);

    canvas.style.display = 'none';
    screens.hud.style.display = 'none';
    screens.controls.style.display = 'none';
    screens.pause.style.display = 'none';
    $('announceText').style.display = 'none';

    $('winnerMessage').textContent = msg;
    $('finalScore').textContent = lscore + ' - ' + rscore;
    const emojis = ['🏆', '🎉', '⭐', '🔥', '💪'];
    $('gameOverEmoji').textContent = emojis[Math.floor(Math.random() * emojis.length)];
    screens.gameOver.style.display = 'flex';
}

$('playAgainButton').addEventListener('click', () => { screens.gameOver.style.display = 'none'; startGame(); });
$('mainMenuButton').addEventListener('click', quit);

function quit() {
    gameOn = false; paused = false;
    clearInterval(timerInt);
    if (rafId) cancelAnimationFrame(rafId);
    stopMusic();
    canvas.style.display = 'none';
    screens.hud.style.display = 'none';
    screens.controls.style.display = 'none';
    screens.pause.style.display = 'none';
    screens.gameOver.style.display = 'none';
    $('announceText').style.display = 'none';
    showScreen('menu');
}

// ===== RESIZE =====
window.addEventListener('resize', () => {
    if (!gameOn) return;
    const oW = W, oH = H;
    resize();
    if (oW > 0 && oH > 0) {
        bx = (bx / oW) * W; by = (by / oH) * H;
        ly = (ly / oH) * H; ry = (ry / oH) * H;
    }
    bgGrad = null; // force re-create
});

document.addEventListener('touchmove', e => { if (gameOn) e.preventDefault(); }, { passive: false });

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
}

})();
