(function () {
'use strict';

const $ = id => document.getElementById(id);
const canvas = $('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

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
        const c = getAudioCtx();
        const o1 = c.createOscillator(), g1 = c.createGain();
        o1.connect(g1); g1.connect(c.destination);
        o1.type = 'square';
        o1.frequency.setValueAtTime(660, c.currentTime);
        o1.frequency.exponentialRampToValueAtTime(220, c.currentTime + 0.08);
        g1.gain.setValueAtTime(0.2, c.currentTime);
        g1.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
        o1.start(c.currentTime); o1.stop(c.currentTime + 0.1);
        const o2 = c.createOscillator(), g2 = c.createGain();
        o2.connect(g2); g2.connect(c.destination);
        o2.type = 'sine';
        o2.frequency.setValueAtTime(100, c.currentTime);
        o2.frequency.exponentialRampToValueAtTime(50, c.currentTime + 0.06);
        g2.gain.setValueAtTime(0.25, c.currentTime);
        g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
        o2.start(c.currentTime); o2.stop(c.currentTime + 0.08);
    } catch (_) {}
}

function synthScore() {
    if (!settings.sfxOn) return;
    try {
        const c = getAudioCtx();
        [523, 659, 784, 1047].forEach((freq, i) => {
            const o = c.createOscillator(), g = c.createGain();
            o.connect(g); g.connect(c.destination);
            o.type = i < 2 ? 'sine' : 'triangle';
            o.frequency.setValueAtTime(freq, c.currentTime + i * 0.08);
            g.gain.setValueAtTime(0, c.currentTime);
            g.gain.linearRampToValueAtTime(0.16, c.currentTime + i * 0.08);
            g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
            o.start(c.currentTime + i * 0.06);
            o.stop(c.currentTime + 0.45);
        });
        const ob = c.createOscillator(), gb = c.createGain();
        ob.connect(gb); gb.connect(c.destination);
        ob.type = 'sine';
        ob.frequency.setValueAtTime(80, c.currentTime);
        ob.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.15);
        gb.gain.setValueAtTime(0.3, c.currentTime);
        gb.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
        ob.start(c.currentTime); ob.stop(c.currentTime + 0.2);
    } catch (_) {}
}

function synthPowerUp() {
    if (!settings.sfxOn) return;
    try {
        const c = getAudioCtx();
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(400, c.currentTime);
        o.frequency.exponentialRampToValueAtTime(1600, c.currentTime + 0.2);
        g.gain.setValueAtTime(0.2, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
        o.start(c.currentTime); o.stop(c.currentTime + 0.25);
        const o2 = c.createOscillator(), g2 = c.createGain();
        o2.connect(g2); g2.connect(c.destination);
        o2.type = 'triangle';
        o2.frequency.setValueAtTime(800, c.currentTime + 0.05);
        o2.frequency.exponentialRampToValueAtTime(2400, c.currentTime + 0.2);
        g2.gain.setValueAtTime(0.1, c.currentTime + 0.05);
        g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
        o2.start(c.currentTime + 0.05); o2.stop(c.currentTime + 0.25);
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

function synthCountdown() {
    if (!settings.sfxOn) return;
    try {
        const c = getAudioCtx(), o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(880, c.currentTime);
        g.gain.setValueAtTime(0.15, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
        o.start(c.currentTime); o.stop(c.currentTime + 0.15);
    } catch (_) {}
}

function synthWin() {
    if (!settings.sfxOn) return;
    try {
        const c = getAudioCtx();
        [523, 659, 784, 1047, 1318].forEach((freq, i) => {
            const o = c.createOscillator(), g = c.createGain();
            o.connect(g); g.connect(c.destination);
            o.type = 'sine';
            o.frequency.setValueAtTime(freq, c.currentTime + i * 0.12);
            g.gain.setValueAtTime(0.2, c.currentTime + i * 0.12);
            g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.12 + 0.3);
            o.start(c.currentTime + i * 0.12);
            o.stop(c.currentTime + i * 0.12 + 0.3);
        });
    } catch (_) {}
}

const bgMusicEl = $('bgMusic');
function startMusic() {
    if (!settings.musicOn || !bgMusicEl) return;
    bgMusicEl.volume = 0.35;
    bgMusicEl.play().catch(() => {});
    updateMusicBtn();
}
function stopMusic() {
    if (bgMusicEl) { bgMusicEl.pause(); bgMusicEl.currentTime = 0; }
    updateMusicBtn();
}
function toggleMusicLive() {
    if (bgMusicEl.paused) {
        settings.musicOn = true;
        bgMusicEl.volume = 0.35;
        bgMusicEl.play().catch(() => {});
    } else {
        bgMusicEl.pause();
    }
    updateMusicBtn();
}
function updateMusicBtn() {
    const btn = $('musicToggleBtn');
    if (!btn) return;
    btn.textContent = (bgMusicEl && !bgMusicEl.paused) ? '\u{1F50A}' : '\u{1F507}';
}
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
    set gameMode(v) { localStorage.setItem('gameMode', v); },
    get bgTheme() { return parseInt(localStorage.getItem('bgTheme') || '0'); },
    set bgTheme(v) { localStorage.setItem('bgTheme', v); }
};

// ===== BACKGROUND THEMES =====
const BG_THEMES = [
    { name: '\u{1F30C} Midnight', colors: ['#060e1a','#0a1628','#0d2847'], border: [0,180,255] },
    { name: '\u{1F30A} Ocean',    colors: ['#001a33','#003355','#004d66'], border: [0,191,255] },
    { name: '\u{1F305} Sunset',   colors: ['#2d0a00','#4d1a00','#661a33'], border: [255,102,51] },
    { name: '\u{1F49C} Neon',     colors: ['#1a001a','#33004d','#1a0033'], border: [255,0,255] },
    { name: '\u{1F332} Forest',   colors: ['#001a00','#003300','#001a0a'], border: [57,255,20] },
    { name: '\u{1F30B} Lava',     colors: ['#2d0500','#4d0a00','#330000'], border: [255,69,0] },
    { name: '\u{2744}\u{FE0F} Ice',      colors: ['#001a2d','#002244','#003355'], border: [180,230,255] },
    { name: '\u{1F52E} Galaxy',   colors: ['#0d0033','#1a0044','#330066'], border: [200,100,255] }
];

// ===== CONFIG =====
const WIN_SCORE = 10;
const GAME_TIME = 90;
const POWERUP_INTERVAL = 10;

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
let hue = 0, glowPulse = 0;
let totalHits = 0, maxCombo = 0;

let dpr = 1, W = 0, H = 0;
let leftPaddleGrad = null, rightPaddleGrad = null;

// ===== RESIZE =====
function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale();
    createPaddleGrads();
}

function scale() {
    const r = Math.min(W, H);
    const isLandscape = W > H;
    brad = Math.max(10, r * 0.025);
    pw = Math.max(18, r * (isLandscape ? 0.045 : 0.035));
    ph = Math.max(90, r * (isLandscape ? 0.28 : 0.22));
    pmar = Math.max(12, r * 0.025);
    pspd = r * 1.8;
    bspd = r * 0.75;
}

function createPaddleGrads() {
    const pph = ph * phMod;
    leftPaddleGrad = ctx.createLinearGradient(pmar, 0, pmar, pph);
    leftPaddleGrad.addColorStop(0, '#00F0FF');
    leftPaddleGrad.addColorStop(0.5, '#00DDFF');
    leftPaddleGrad.addColorStop(1, '#39FF14');
    rightPaddleGrad = ctx.createLinearGradient(W - pmar - pw, 0, W - pmar - pw, pph);
    rightPaddleGrad.addColorStop(0, '#FF6BF5');
    rightPaddleGrad.addColorStop(0.5, '#FF55E0');
    rightPaddleGrad.addColorStop(1, '#FFD700');
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
    announce('READY? GO! \u{1F525}');
    rafId = requestAnimationFrame(loop);
}

function resetState() {
    lscore = rscore = 0;
    phMod = bspdMod = 1;
    powerUp = null; puTimer = 0;
    particles = []; announceQ = null;
    screenShake = 0; combo = 0; lastScorer = '';
    totalHits = 0; maxCombo = 0;
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
        if (timer <= 10 && timer > 0) { synthCountdown(); vibrate(8); }
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
    if (timer <= 10) {
        el.style.color = '#FF4444';
        el.style.animation = 'pulse .5s ease';
        setTimeout(() => { el.style.animation = ''; }, 500);
    } else {
        el.style.color = '#FFD700';
    }
}
function updateHUD() {
    $('leftScoreHUD').textContent = lscore;
    $('rightScoreHUD').textContent = rscore;
}

// ===== NAME ANNOUNCER =====
function scoreAnnounce(name) {
    const phrases = [
        name + ' SCORES! \u{1F525}',
        name + ' GOT A POINT!',
        'GO ' + name + '!! ⚡',
        name + ' BOOM! \u{1F4A5}',
        'NICE ONE ' + name + '!',
        name + ' IS ON FIRE! \u{1F525}',
        name + ' LETS GOOO!',
        name + ' EPIC SHOT! ⚡',
        name + ' UNSTOPPABLE!',
        name + ' CRUSHED IT! \u{1F4AA}'
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
}

// ===== ANNOUNCE =====
function announce(text) {
    const el = $('announceText');
    el.textContent = text;
    el.style.display = 'block';
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = 'announceIn .4s cubic-bezier(.17,.67,.3,1.33)';
    clearTimeout(announceQ);
    announceQ = setTimeout(() => { el.style.display = 'none'; }, 1400);
}

// ===== PARTICLES =====
function spawnParticles(x, y, colors, count, big) {
    const sz = big ? 6 : 3;
    const spd = big ? 400 : 250;
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * spd,
            vy: (Math.random() - 0.5) * spd - (big ? 100 : 0),
            life: 0.5 + Math.random() * 0.5,
            maxLife: 0.5 + Math.random() * 0.5,
            size: sz + Math.random() * sz,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }
}
function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vy += 350 * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
    }
}
function renderParticles() {
    for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        const hs = p.size / 2;
        ctx.fillRect(p.x - hs, p.y - hs, p.size, p.size);
    }
    ctx.globalAlpha = 1;
}

// ===== GAME LOOP =====
function loop(ts) {
    if (!gameOn) return;
    const dt = Math.min((ts - lastT) / 1000, 0.05);
    lastT = ts;
    if (!paused) { update(dt); render(); }
    rafId = requestAnimationFrame(loop);
}

// ===== UPDATE =====
function update(dt) {
    hue = (hue + dt * 120) % 360;
    glowPulse += dt * 3;

    const spd = bspd * bspdMod;
    const len = Math.sqrt(bdx * bdx + bdy * bdy);
    if (len > 0) { bdx = (bdx / len) * spd; bdy = (bdy / len) * spd; }

    bx += bdx * dt;
    by += bdy * dt;

    if (by - brad < 0) { by = brad; bdy = Math.abs(bdy); synthWall(); vibrate(5); }
    if (by + brad > H) { by = H - brad; bdy = -Math.abs(bdy); synthWall(); vibrate(5); }

    const pph = ph * phMod;

    const lx = pmar + pw;
    if (bdx < 0 && bx - brad <= lx && bx + brad > pmar &&
        by + brad >= ly && by - brad <= ly + pph) {
        bx = lx + brad;
        const hit = (by - ly) / pph - 0.5;
        const a = hit * (Math.PI / 3);
        bdx = Math.abs(Math.cos(a)) * spd;
        bdy = Math.sin(a) * spd;
        bspdMod = Math.min(bspdMod * 1.04, 2.2);
        totalHits++;
        synthHit(); vibrate([15, 10, 15]);
        spawnParticles(lx, by, ['#00F0FF', '#39FF14', '#fff'], 8, false);
        screenShake = 0.08;
    }

    const rx = W - pmar - pw;
    if (bdx > 0 && bx + brad >= rx && bx - brad < W - pmar &&
        by + brad >= ry && by - brad <= ry + pph) {
        bx = rx - brad;
        const hit = (by - ry) / pph - 0.5;
        const a = hit * (Math.PI / 3);
        bdx = -Math.abs(Math.cos(a)) * spd;
        bdy = Math.sin(a) * spd;
        bspdMod = Math.min(bspdMod * 1.04, 2.2);
        totalHits++;
        synthHit(); vibrate([15, 10, 15]);
        spawnParticles(rx, by, ['#FF6BF5', '#FFD700', '#fff'], 8, false);
        screenShake = 0.08;
    }

    if (bx < -brad * 2) {
        rscore++;
        bspdMod = 1;
        if (lastScorer === 'right') { combo++; } else { combo = 1; lastScorer = 'right'; }
        if (combo > maxCombo) maxCombo = combo;
        synthScore(); vibrate([30, 50, 30, 50, 40]);
        spawnParticles(0, by, ['#FF6BF5', '#FFD700', '#00F0FF', '#39FF14'], 20, true);
        screenShake = 0.18;
        let msg;
        if (combo >= 3) msg = settings.p2Name + ' ' + combo + 'x COMBO!! \u{1F525}';
        else msg = scoreAnnounce(settings.p2Name);
        announce(msg);
        updateHUD();
        if (rscore >= WIN_SCORE) { endGame(settings.p2Name + ' Wins!'); return; }
        resetBall();
    }
    if (bx > W + brad * 2) {
        lscore++;
        bspdMod = 1;
        if (lastScorer === 'left') { combo++; } else { combo = 1; lastScorer = 'left'; }
        if (combo > maxCombo) maxCombo = combo;
        synthScore(); vibrate([30, 50, 30, 50, 40]);
        spawnParticles(W, by, ['#00F0FF', '#FFD700', '#FF6BF5', '#39FF14'], 20, true);
        screenShake = 0.18;
        let msg;
        if (combo >= 3) msg = settings.p1Name + ' ' + combo + 'x COMBO!! \u{1F525}';
        else msg = scoreAnnounce(settings.p1Name);
        announce(msg);
        updateHUD();
        if (lscore >= WIN_SCORE) { endGame(settings.p1Name + ' Wins!'); return; }
        resetBall();
    }

    if (tLeftY !== null) { ly = tLeftY - pph / 2; }
    if (tRightY !== null && settings.gameMode === 2) { ry = tRightY - pph / 2; }

    if (keys.has('ArrowUp') || keys.has('w')) ly -= pspd * dt;
    if (keys.has('ArrowDown') || keys.has('s')) ly += pspd * dt;
    if (settings.gameMode === 2) {
        if (keys.has('i')) ry -= pspd * dt;
        if (keys.has('k')) ry += pspd * dt;
    }

    ly = Math.max(0, Math.min(H - pph, ly));
    ry = Math.max(0, Math.min(H - pph, ry));

    if (settings.gameMode === 1) updateAI(dt);

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
    { type: 'speed',  color: '#FF4444', emoji: '\u{1F525}', label: 'TURBO!' },
    { type: 'slow',   color: '#4488FF', emoji: '\u{2744}\u{FE0F}', label: 'FREEZE!' },
    { type: 'grow',   color: '#39FF14', emoji: '\u{1F4AA}', label: 'BIG!' },
    { type: 'shrink', color: '#FF6BF5', emoji: '\u{1F41C}', label: 'TINY!' },
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
        synthPowerUp(); vibrate([20, 15, 20]);
        announce(powerUp.emoji + ' ' + powerUp.label);
        spawnParticles(powerUp.x, powerUp.y, [powerUp.color, '#fff', '#FFD700'], 12, true);
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
let bgGrad = null, bgW = 0, bgH = 0, bgThemeIdx = -1;

function render() {
    let sx = 0, sy = 0;
    if (screenShake > 0) {
        sx = (Math.random() - 0.5) * screenShake * 60;
        sy = (Math.random() - 0.5) * screenShake * 60;
    }
    ctx.save();
    ctx.translate(sx, sy);

    const hc = settings.highContrast;
    const theme = BG_THEMES[settings.bgTheme] || BG_THEMES[0];
    const [br, bg, bb] = theme.border;

    if (!bgGrad || bgW !== W || bgH !== H || bgThemeIdx !== settings.bgTheme) {
        bgGrad = ctx.createLinearGradient(0, 0, W, H);
        if (hc) {
            bgGrad.addColorStop(0, '#000');
            bgGrad.addColorStop(0.5, '#0a0a0a');
            bgGrad.addColorStop(1, '#000');
        } else {
            bgGrad.addColorStop(0, theme.colors[0]);
            bgGrad.addColorStop(0.5, theme.colors[1]);
            bgGrad.addColorStop(1, theme.colors[2]);
        }
        bgW = W; bgH = H; bgThemeIdx = settings.bgTheme;
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-10, -10, W + 20, H + 20);

    // Radiating border with rounded corners
    if (!hc) {
        const bPulse = 0.4 + Math.sin(glowPulse * 0.8) * 0.3;
        const inset = 6;
        const bw = W - inset * 2;
        const bh = H - inset * 2;
        const cr = Math.min(24, Math.min(bw, bh) * 0.035);

        ctx.strokeStyle = `rgba(${br},${bg},${bb},${0.2 + bPulse * 0.25})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(inset, inset, bw, bh, cr);
        ctx.stroke();
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
    const ballColor = hc ? '#FFF' : `hsl(${hue}, 100%, 60%)`;
    const glowAmt = 0.5 + Math.sin(glowPulse * 2) * 0.3;
    const hoverOff = Math.sin(glowPulse * 1.5) * 3;

    // Left paddle glow
    if (!hc) {
        ctx.fillStyle = `rgba(0,240,255,${0.04 + glowAmt * 0.04})`;
        ctx.fillRect(pmar - 8, ly + hoverOff - 8, pw + 16, pph + 16);
    }
    ctx.fillStyle = hc ? '#FFF' : leftPaddleGrad;
    ctx.beginPath();
    ctx.roundRect(pmar, ly + hoverOff, pw, pph, pw / 2.5);
    ctx.fill();

    // Right paddle glow
    if (!hc) {
        ctx.fillStyle = `rgba(255,107,245,${0.04 + glowAmt * 0.04})`;
        ctx.fillRect(W - pmar - pw - 8, ry + hoverOff - 8, pw + 16, pph + 16);
    }
    ctx.fillStyle = hc ? '#FFF' : rightPaddleGrad;
    ctx.beginPath();
    ctx.roundRect(W - pmar - pw, ry + hoverOff, pw, pph, pw / 2.5);
    ctx.fill();

    // Ball trail
    if (!hc) {
        for (let i = 3; i >= 1; i--) {
            const t = i / 3;
            ctx.beginPath();
            ctx.arc(bx - bdx * t * 0.025, by - bdy * t * 0.025, brad * (1 - t * 0.12), 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${(hue - i * 30 + 360) % 360}, 100%, 60%, ${0.12 - t * 0.03})`;
            ctx.fill();
        }
    }

    // Ball
    ctx.beginPath();
    ctx.arc(bx, by, brad, 0, Math.PI * 2);
    ctx.fillStyle = ballColor;
    ctx.fill();

    // Power-up
    if (powerUp) {
        const pu = powerUp;
        const pulse = 1 + Math.sin(performance.now() / 200) * 0.2;
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, pu.size * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = pu.color;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, pu.size * 0.45 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = pu.color;
        ctx.fill();
        const fs = Math.round(pu.size * 0.7);
        ctx.font = `${fs}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(pu.emoji, pu.x, pu.y);
    }

    renderParticles();

    // Player names
    const nameSz = Math.round(Math.min(W, H) * 0.035);
    ctx.font = `900 ${nameSz}px 'Nunito', sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillStyle = hc ? 'rgba(255,255,255,.3)' : 'rgba(0,240,255,.3)';
    ctx.fillText(settings.p1Name, W * 0.25, H - 14);
    ctx.fillStyle = hc ? 'rgba(255,255,255,.3)' : 'rgba(255,107,245,.3)';
    ctx.fillText(settings.p2Name, W * 0.75, H - 14);

    ctx.restore();
}

// ===== BACKGROUND PICKER =====
let bgPickerOpen = false;

$('bgPickerBtn').addEventListener('click', () => {
    bgPickerOpen = !bgPickerOpen;
    const panel = $('bgPickerPanel');
    panel.style.display = bgPickerOpen ? 'flex' : 'none';
    if (bgPickerOpen) buildBgPicker();
    vibrate(8);
});

function buildBgPicker() {
    const panel = $('bgPickerPanel');
    panel.innerHTML = '';
    BG_THEMES.forEach((t, i) => {
        const btn = document.createElement('button');
        btn.className = 'bg-swatch' + (i === settings.bgTheme ? ' active' : '');
        btn.style.background = `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]}, ${t.colors[2]})`;
        btn.innerHTML = `<span class="swatch-label">${t.name}</span>`;
        btn.addEventListener('click', () => {
            settings.bgTheme = i;
            bgGrad = null;
            buildBgPicker();
            vibrate(10);
        });
        panel.appendChild(btn);
    });
}

// ===== MUSIC TOGGLE =====
$('musicToggleBtn').addEventListener('click', () => {
    toggleMusicLive();
    vibrate(8);
});

// ===== TOUCH =====
canvas.addEventListener('touchstart', handleTouch, { passive: false });
canvas.addEventListener('touchmove', handleTouch, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

function handleTouch(e) {
    e.preventDefault();
    if (bgPickerOpen) {
        bgPickerOpen = false;
        $('bgPickerPanel').style.display = 'none';
    }
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
    if (paused) { if (bgMusicEl) bgMusicEl.pause(); }
    else startMusic();
    updateMusicBtn();
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
    synthWin();
    vibrate([50, 80, 50, 80, 80, 50]);

    canvas.style.display = 'none';
    screens.hud.style.display = 'none';
    screens.controls.style.display = 'none';
    screens.pause.style.display = 'none';
    $('announceText').style.display = 'none';
    $('bgPickerPanel').style.display = 'none';
    bgPickerOpen = false;

    $('winnerMessage').textContent = msg;
    const statsLine = lscore + ' - ' + rscore + '  •  ' + totalHits + ' hits  •  ' + maxCombo + 'x best combo';
    $('finalScore').textContent = statsLine;
    const emojis = ['\u{1F3C6}', '\u{1F389}', '⭐', '\u{1F525}', '\u{1F4AA}', '\u{1F451}', '\u{1F38A}'];
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
    $('bgPickerPanel').style.display = 'none';
    bgPickerOpen = false;
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
    bgGrad = null;
});

document.addEventListener('touchmove', e => { if (gameOn) e.preventDefault(); }, { passive: false });

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
}

})();
