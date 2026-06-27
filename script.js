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
        g1.gain.setValueAtTime(0.32, c.currentTime);
        g1.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
        o1.start(c.currentTime); o1.stop(c.currentTime + 0.1);
        const o2 = c.createOscillator(), g2 = c.createGain();
        o2.connect(g2); g2.connect(c.destination);
        o2.type = 'sine';
        o2.frequency.setValueAtTime(100, c.currentTime);
        o2.frequency.exponentialRampToValueAtTime(50, c.currentTime + 0.06);
        g2.gain.setValueAtTime(0.38, c.currentTime);
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
            g.gain.linearRampToValueAtTime(0.25, c.currentTime + i * 0.08);
            g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
            o.start(c.currentTime + i * 0.06);
            o.stop(c.currentTime + 0.45);
        });
        const ob = c.createOscillator(), gb = c.createGain();
        ob.connect(gb); gb.connect(c.destination);
        ob.type = 'sine';
        ob.frequency.setValueAtTime(80, c.currentTime);
        ob.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.15);
        gb.gain.setValueAtTime(0.45, c.currentTime);
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
        g.gain.setValueAtTime(0.3, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
        o.start(c.currentTime); o.stop(c.currentTime + 0.25);
        const o2 = c.createOscillator(), g2 = c.createGain();
        o2.connect(g2); g2.connect(c.destination);
        o2.type = 'triangle';
        o2.frequency.setValueAtTime(800, c.currentTime + 0.05);
        o2.frequency.exponentialRampToValueAtTime(2400, c.currentTime + 0.2);
        g2.gain.setValueAtTime(0.18, c.currentTime + 0.05);
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
        g.gain.setValueAtTime(0.22, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
        o.start(c.currentTime); o.stop(c.currentTime + 0.06);
    } catch (_) {}
}

function synthCountdown(high) {
    if (!settings.sfxOn) return;
    try {
        const c = getAudioCtx(), o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'sine';
        const freq = high ? 1320 : 880;
        const dur = high ? 0.25 : 0.15;
        o.frequency.setValueAtTime(freq, c.currentTime);
        g.gain.setValueAtTime(0.3, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
        o.start(c.currentTime); o.stop(c.currentTime + dur);
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
            g.gain.setValueAtTime(0.32, c.currentTime + i * 0.12);
            g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.12 + 0.3);
            o.start(c.currentTime + i * 0.12);
            o.stop(c.currentTime + i * 0.12 + 0.3);
        });
    } catch (_) {}
}

const bgMusicEl = $('bgMusic');
let musicReady = false;
bgMusicEl.addEventListener('canplaythrough', () => { musicReady = true; });

function startMusic() {
    if (!settings.musicOn || !bgMusicEl) return;
    bgMusicEl.volume = 0.12;
    const p = bgMusicEl.play();
    if (p) p.catch(() => {
        setTimeout(() => {
            bgMusicEl.play().catch(() => {});
        }, 300);
    });
    updateMusicBtn();
}
function stopMusic() {
    if (bgMusicEl) { bgMusicEl.pause(); bgMusicEl.currentTime = 0; }
    updateMusicBtn();
}
function toggleMusicLive() {
    if (bgMusicEl.paused) {
        settings.musicOn = true;
        bgMusicEl.volume = 0.12;
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

let wakeLock = null;
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    } catch (_) {}
}
function releaseWakeLock() {
    if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
}

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
    set bgTheme(v) { localStorage.setItem('bgTheme', v); },
    get bestScore() { return parseInt(localStorage.getItem('bestScore') || '0'); },
    set bestScore(v) { localStorage.setItem('bestScore', v); },
    get totalWins() { return parseInt(localStorage.getItem('totalWins') || '0'); },
    set totalWins(v) { localStorage.setItem('totalWins', v); }
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
const WIN_SCORE = 15;
const GAME_TIME = 150;
const POWERUP_INTERVAL = 8;

const AI_CFG = {
    easy:   { startSpd: 0.45, endSpd: 0.78, startErr: 60, endErr: 22, react: 0.72 },
    medium: { startSpd: 0.55, endSpd: 0.95, startErr: 48, endErr: 14, react: 0.8 },
    hard:   { startSpd: 0.7,  endSpd: 1.15, startErr: 32, endErr: 6,  react: 0.88 }
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
let puTimers = [];
let particles = [], announceQ = null;
let screenShake = 0;
let combo = 0, lastScorer = '';
let prevLeader = '';
let hue = 0, glowPulse = 0;
let totalHits = 0, maxCombo = 0;
let serveTimer = 0;
let serveDir = 1;
let countdownNum = 0;
let countdownBeepPlayed = 0;
let timerStarted = false;

let scoreFlash = 0;
let leftHitGlow = 0, rightHitGlow = 0;
let bradMod = 1;
let shieldTimer = 0;
let multiActive = false;
let multiTimer = null;

let dpr = 1, W = 0, H = 0;
let leftPaddleGrad = null, rightPaddleGrad = null;
let aiTargetY = 0, aiUpdateTimer = 0;

let p1AvatarData = null, p2AvatarData = null;
let p1AvatarImg = null, p2AvatarImg = null;

let confetti = [];
let confettiActive = false;

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
    pw = Math.max(22, r * (isLandscape ? 0.055 : 0.042));
    ph = Math.max(90, r * (isLandscape ? 0.28 : 0.22));
    pmar = Math.max(24, r * 0.04);
    pspd = r * (isLandscape ? 2.2 : 1.8);
    bspd = r * (isLandscape ? 1.6 : 1.05);
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

// ===== MENU STATS =====
function updateMenuStats() {
    const el = $('menuStats');
    if (!el) return;
    const wins = settings.totalWins;
    const best = settings.bestScore;
    if (wins > 0 || best > 0) {
        const parts = [];
        if (wins > 0) parts.push('\u{1F3C6} ' + wins + ' Win' + (wins !== 1 ? 's' : ''));
        if (best > 0) parts.push('\u{2B50} Best: ' + best);
        el.textContent = parts.join('  \u{2022}  ');
        el.style.display = 'block';
    } else {
        el.style.display = 'none';
    }
}

// ===== SPLASH =====
setTimeout(() => { screens.splash.style.display = 'none'; showScreen('menu'); applySettings(); updateMenuStats(); }, 2000);

function applySettings() {
    $('toggleMusic').checked = settings.musicOn;
    $('toggleSoundEffects').checked = settings.sfxOn;
    $('difficulty').value = settings.difficulty;
    $('colorblindMode').checked = settings.highContrast;
    document.body.classList.toggle('high-contrast', settings.highContrast);
    $('gameMode').value = settings.gameMode;
    $('p2Row').style.display = settings.gameMode === 2 ? '' : 'none';
    const p1 = settings.p1Name;
    const p2 = settings.p2Name;
    if (p1 && p1 !== 'Player 1') $('player1NameInput').value = p1;
    if (p2 && p2 !== 'Player 2' && p2 !== 'Robot') $('player2NameInput').value = p2;
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

$('gameMode').addEventListener('change', e => {
    $('p2Row').style.display = e.target.value === '2' ? '' : 'none';
});
$('p2Row').style.display = $('gameMode').value === '2' ? '' : 'none';

// ===== AVATAR UPLOAD =====
function setupAvatar(pickId, fileId, imgId, storageKey) {
    const pick = $(pickId), file = $(fileId), img = $(imgId);
    pick.addEventListener('click', () => file.click());
    file.addEventListener('change', e => {
        const f = e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const canvas2 = document.createElement('canvas');
            const img2 = new Image();
            img2.onload = () => {
                const sz = 128;
                canvas2.width = sz; canvas2.height = sz;
                const c2 = canvas2.getContext('2d');
                const min = Math.min(img2.width, img2.height);
                const sx = (img2.width - min) / 2, sy = (img2.height - min) / 2;
                c2.drawImage(img2, sx, sy, min, min, 0, 0, sz, sz);
                const dataUrl = canvas2.toDataURL('image/jpeg', 0.7);
                localStorage.setItem(storageKey, dataUrl);
                img.src = dataUrl;
                img.classList.add('has-pic');
            };
            img2.src = ev.target.result;
        };
        reader.readAsDataURL(f);
    });
    const saved = localStorage.getItem(storageKey);
    if (saved) { img.src = saved; img.classList.add('has-pic'); }
}
setupAvatar('p1AvatarPick', 'p1AvatarFile', 'p1AvatarImg', 'p1Avatar');
setupAvatar('p2AvatarPick', 'p2AvatarFile', 'p2AvatarImg', 'p2Avatar');

function loadAvatarImages() {
    const d1 = localStorage.getItem('p1Avatar');
    const d2 = localStorage.getItem('p2Avatar');
    if (d1) {
        p1AvatarImg = new Image();
        p1AvatarImg.src = d1;
        $('hudP1Pic').src = d1;
    } else {
        p1AvatarImg = null;
        $('hudP1Pic').src = '';
    }
    if (d2) {
        p2AvatarImg = new Image();
        p2AvatarImg.src = d2;
        $('hudP2Pic').src = d2;
    } else {
        p2AvatarImg = null;
        $('hudP2Pic').src = '';
    }
}

// ===== START =====
$('startGameButton').addEventListener('click', () => {
    getAudioCtx();
    settings.p1Name = $('player1NameInput').value.trim() || 'Player 1';
    const mode = $('gameMode').value;
    settings.p2Name = mode === '2' ? ($('player2NameInput').value.trim() || 'Player 2') : 'Robot';
    settings.gameMode = mode;
    $('hudP1Name').textContent = settings.p1Name;
    $('hudP2Name').textContent = settings.p2Name;
    loadAvatarImages();
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    startGame();
});

function startGame() {
    resize();
    resetState();
    showGame();
    startMusic();
    requestWakeLock();
    gameOn = true; paused = false;
    serveTimer = 3.2;
    countdownNum = 3;
    countdownBeepPlayed = 0;
    timerStarted = false;
    lastT = performance.now();
    rafId = requestAnimationFrame(loop);
}

function resetState() {
    lscore = rscore = 0;
    phMod = bspdMod = 1;
    powerUp = null; puTimer = 0;
    puTimers.forEach(t => clearTimeout(t));
    puTimers = [];
    particles = []; announceQ = null;
    screenShake = 0; combo = 0; lastScorer = ''; prevLeader = '';
    totalHits = 0; maxCombo = 0;
    scoreFlash = 0; leftHitGlow = 0; rightHitGlow = 0;
    bradMod = 1; shieldTimer = 0; multiActive = false;
    if (multiTimer) { clearTimeout(multiTimer); multiTimer = null; }
    ly = ry = (H - ph) / 2;
    tLeftY = tRightY = null;
    aiTargetY = H / 2; aiUpdateTimer = 0;
    serveTimer = 0; timerStarted = false;
    resetBall();
    updateHUD();
}

function resetBall(dir) {
    bx = W / 2; by = H / 2;
    serveDir = dir || (Math.random() > 0.5 ? 1 : -1);
    const ang = (Math.random() - 0.5) * Math.PI / 4;
    bdx = serveDir * Math.cos(ang);
    bdy = Math.sin(ang);
    const len = Math.sqrt(bdx * bdx + bdy * bdy);
    bdx = (bdx / len) * bspd;
    bdy = (bdy / len) * bspd;
    serveTimer = 2.4;
    countdownNum = 3;
    countdownBeepPlayed = 0;
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
        if (timer <= 10 && timer > 0) { synthCountdown(); vibrate(15); }
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
    announceQ = setTimeout(() => { el.style.display = 'none'; }, 2200);
}

// ===== VOICE ANNOUNCER =====
function speak(text) {
    if (!settings.sfxOn) return;
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[^\w\s!?']/g, '');
    const utter = new SpeechSynthesisUtterance(clean);
    utter.rate = 1.15;
    utter.pitch = 1.1;
    utter.volume = 1.0;
    window.speechSynthesis.speak(utter);
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
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
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

    // Serve countdown — ball sits at center, 3-2-1-GO
    if (serveTimer > 0) {
        serveTimer -= dt;
        const prev = countdownNum;
        if (serveTimer > 1.6) countdownNum = 3;
        else if (serveTimer > 0.8) countdownNum = 2;
        else if (serveTimer > 0) countdownNum = 1;
        else countdownNum = 0;

        if (countdownNum !== prev && countdownNum > 0) {
            synthCountdown(false);
            vibrate(20);
        }
        if (countdownNum === 0 && prev > 0) {
            synthCountdown(true);
            vibrate([30, 15, 30]);
            announce('GO! \u{1F525}');
            speak('Go!');
            if (!timerStarted) { startTimer(); timerStarted = true; }
        }

        bx = W / 2; by = H / 2;
        const pph = ph * phMod;
        if (tLeftY !== null) ly = tLeftY - pph / 2;
        if (tRightY !== null && settings.gameMode === 2) ry = tRightY - pph / 2;
        if (keys.has('ArrowUp') || keys.has('w')) ly -= pspd * dt;
        if (keys.has('ArrowDown') || keys.has('s')) ly += pspd * dt;
        ly = Math.max(0, Math.min(H - pph, ly));
        ry = Math.max(0, Math.min(H - pph, ry));
        if (settings.gameMode === 1) updateAI(dt);
        updateParticles(dt);
        if (scoreFlash > 0) scoreFlash = Math.max(0, scoreFlash - dt);
        return;
    }

    const spd = bspd * bspdMod;
    const len = Math.sqrt(bdx * bdx + bdy * bdy);
    if (len > 0) { bdx = (bdx / len) * spd; bdy = (bdy / len) * spd; }

    const br = brad * bradMod;

    bx += bdx * dt;
    by += bdy * dt;

    if (by - br < 0) {
        by = br; bdy = Math.abs(bdy); synthWall(); vibrate(10);
        spawnParticles(bx, 0, ['#fff', '#FFD700'], 6, false);
    }
    if (by + br > H) {
        by = H - br; bdy = -Math.abs(bdy); synthWall(); vibrate(10);
        spawnParticles(bx, H, ['#fff', '#FFD700'], 6, false);
    }

    const pph = ph * phMod;

    const lx = pmar + pw;
    if (bdx < 0 && bx - br <= lx && bx + br > pmar &&
        by + br >= ly && by - br <= ly + pph) {
        bx = lx + br;
        const hit = (by - ly) / pph - 0.5;
        const a = hit * (Math.PI / 3);
        bdx = Math.abs(Math.cos(a)) * spd;
        bdy = Math.sin(a) * spd;
        bspdMod = Math.min(bspdMod * 1.04, 2.2);
        totalHits++;
        leftHitGlow = 0.4;
        synthHit(); vibrate([25, 15, 25]);
        spawnParticles(lx, by, ['#00F0FF', '#39FF14', '#fff'], 12, false);
        screenShake = 0.08;
    }

    const rx = W - pmar - pw;
    if (bdx > 0 && bx + br >= rx && bx - br < W - pmar &&
        by + br >= ry && by - br <= ry + pph) {
        bx = rx - br;
        const hit = (by - ry) / pph - 0.5;
        const a = hit * (Math.PI / 3);
        bdx = -Math.abs(Math.cos(a)) * spd;
        bdy = Math.sin(a) * spd;
        bspdMod = Math.min(bspdMod * 1.04, 2.2);
        totalHits++;
        rightHitGlow = 0.4;
        synthHit(); vibrate([25, 15, 25]);
        spawnParticles(rx, by, ['#FF6BF5', '#FFD700', '#fff'], 12, false);
        screenShake = 0.08;
    }

    // Shield walls - bounce ball back
    if (shieldTimer > 0) {
        if (bx - br < pmar && bdx < 0) {
            bx = pmar + br; bdx = Math.abs(bdx);
            synthWall(); vibrate(20);
            spawnParticles(pmar, by, ['#FFD700', '#FFE066', '#fff'], 10, false);
            shieldTimer = Math.max(0, shieldTimer - 1.5);
        }
        if (bx + br > W - pmar && bdx > 0) {
            bx = W - pmar - br; bdx = -Math.abs(bdx);
            synthWall(); vibrate(20);
            spawnParticles(W - pmar, by, ['#FFD700', '#FFE066', '#fff'], 10, false);
            shieldTimer = Math.max(0, shieldTimer - 1.5);
        }
    }

    if (bx < -br * 2) {
        let pts = 1;
        if (multiActive) { pts = 3; multiActive = false; if (multiTimer) { clearTimeout(multiTimer); multiTimer = null; } announce('3x SCORE!'); speak('Triple points!'); }
        const wasLeader = lscore > rscore ? 'left' : rscore > lscore ? 'right' : '';
        rscore += pts;
        bspdMod = 1; bradMod = 1;
        scoreFlash = 0.35;
        if (lastScorer === 'right') { combo++; } else { combo = 1; lastScorer = 'right'; }
        if (combo > maxCombo) maxCombo = combo;
        synthScore(); vibrate([40, 60, 40, 60, 50]);
        spawnParticles(0, by, ['#FF6BF5', '#FFD700', '#00F0FF', '#39FF14'], 25, true);
        screenShake = 0.2;
        let msg;
        const nowLeader = lscore > rscore ? 'left' : rscore > lscore ? 'right' : '';
        if (rscore === 1 && lscore === 0) {
            msg = 'FIRST BLOOD! ' + settings.p2Name + '! \u{1F4A5}';
        } else if (wasLeader === 'left' && nowLeader === 'right') {
            msg = settings.p2Name + ' TAKES THE LEAD! \u{1F525}';
        } else if (wasLeader === 'left' && lscore === rscore) {
            msg = 'TIED UP! COMEBACK! \u{26A1}';
        } else if (combo >= 3) {
            msg = settings.p2Name + ' ' + combo + 'x COMBO!! \u{1F525}';
        } else {
            msg = scoreAnnounce(settings.p2Name);
        }
        announce(msg);
        speak(msg);
        updateHUD();
        if (rscore >= WIN_SCORE) { endGame(settings.p2Name + ' Wins!'); return; }
        if (rscore === WIN_SCORE - 1 || lscore === WIN_SCORE - 1) {
            setTimeout(() => { announce('MATCH POINT!! \u{1F525}\u{1F525}'); speak('Match Point!'); }, 1200);
        }
        resetBall(-1);
    }
    if (bx > W + br * 2) {
        let pts = 1;
        if (multiActive) { pts = 3; multiActive = false; if (multiTimer) { clearTimeout(multiTimer); multiTimer = null; } announce('3x SCORE!'); speak('Triple points!'); }
        const wasLeader = lscore > rscore ? 'left' : rscore > lscore ? 'right' : '';
        lscore += pts;
        bspdMod = 1; bradMod = 1;
        scoreFlash = 0.35;
        if (lastScorer === 'left') { combo++; } else { combo = 1; lastScorer = 'left'; }
        if (combo > maxCombo) maxCombo = combo;
        synthScore(); vibrate([40, 60, 40, 60, 50]);
        spawnParticles(W, by, ['#00F0FF', '#FFD700', '#FF6BF5', '#39FF14'], 25, true);
        screenShake = 0.2;
        let msg;
        const nowLeader = lscore > rscore ? 'left' : rscore > lscore ? 'right' : '';
        if (lscore === 1 && rscore === 0) {
            msg = 'FIRST BLOOD! ' + settings.p1Name + '! \u{1F4A5}';
        } else if (wasLeader === 'right' && nowLeader === 'left') {
            msg = settings.p1Name + ' TAKES THE LEAD! \u{1F525}';
        } else if (wasLeader === 'right' && lscore === rscore) {
            msg = 'TIED UP! COMEBACK! \u{26A1}';
        } else if (combo >= 3) {
            msg = settings.p1Name + ' ' + combo + 'x COMBO!! \u{1F525}';
        } else {
            msg = scoreAnnounce(settings.p1Name);
        }
        announce(msg);
        speak(msg);
        updateHUD();
        if (lscore >= WIN_SCORE) { endGame(settings.p1Name + ' Wins!'); return; }
        if (lscore === WIN_SCORE - 1 || rscore === WIN_SCORE - 1) {
            setTimeout(() => { announce('MATCH POINT!! \u{1F525}\u{1F525}'); speak('Match Point!'); }, 1200);
        }
        resetBall(1);
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
    if (powerUp) {
        powerUp.y += powerUp.vy * dt;
        const dxToBall = bx - powerUp.x;
        powerUp.x += dxToBall * 0.3 * dt;
        checkPowerUp();
    }

    updateParticles(dt);
    if (screenShake > 0) screenShake = Math.max(0, screenShake - dt);
    if (scoreFlash > 0) scoreFlash = Math.max(0, scoreFlash - dt);
    if (leftHitGlow > 0) leftHitGlow = Math.max(0, leftHitGlow - dt);
    if (rightHitGlow > 0) rightHitGlow = Math.max(0, rightHitGlow - dt);
    if (shieldTimer > 0) shieldTimer = Math.max(0, shieldTimer - dt);
}

// ===== AI (progressive difficulty, rubber-banding) =====
function getProgressiveAI() {
    const cfg = AI_CFG[settings.difficulty] || AI_CFG.medium;
    const totalPts = lscore + rscore;
    const progress = Math.min(totalPts / (WIN_SCORE * 1.5), 1);
    const lerp = (a, b, t) => a + (b - a) * t;
    let spd = lerp(cfg.startSpd, cfg.endSpd, progress);
    let err = lerp(cfg.startErr, cfg.endErr, progress);
    let react = cfg.react * (0.7 + progress * 0.3);
    const scoreDiff = rscore - lscore;
    if (scoreDiff >= 4) { spd *= 0.75; err *= 1.6; }
    else if (scoreDiff >= 3) { spd *= 0.82; err *= 1.35; }
    else if (scoreDiff >= 2) { spd *= 0.9; err *= 1.2; }
    else if (scoreDiff <= -4) { spd *= 1.12; err *= 0.7; }
    else if (scoreDiff <= -3) { spd *= 1.08; err *= 0.8; }
    return { speed: spd, err: err, react: react };
}

function updateAI(dt) {
    const cfg = getProgressiveAI();
    const pph = ph * phMod;

    aiUpdateTimer -= dt;
    if (aiUpdateTimer <= 0) {
        aiUpdateTimer = 0.12 + Math.random() * 0.1;

        if (bdx > 0) {
            const dist = W - pmar - pw - bx;
            const ttr = dist / (Math.abs(bdx) || 1);
            let py = by + bdy * ttr;
            for (let i = 0; i < 12 && (py < 0 || py > H); i++) {
                if (py < 0) py = -py;
                if (py > H) py = 2 * H - py;
            }
            aiTargetY = py + (Math.random() - 0.5) * cfg.err;
        } else {
            aiTargetY = H / 2 + (Math.random() - 0.5) * pph * 0.4;
        }
    }

    const center = ry + pph / 2;
    const diff = aiTargetY - center;
    const maxMove = pspd * cfg.speed * cfg.react * dt;

    if (Math.abs(diff) > 5) {
        const moveAmt = Math.min(Math.abs(diff) * 0.12, maxMove);
        ry += Math.sign(diff) * moveAmt;
    }
    ry = Math.max(0, Math.min(H - pph, ry));
}

// ===== POWER-UPS (Arkanoid SNES style) =====
const PU_TYPES = [
    { type: 'speed',  color: '#FF4444', letter: 'S', label: 'TURBO!',     color2: '#FF8800' },
    { type: 'freeze', color: '#4488FF', letter: 'F', label: 'FREEZE!',    color2: '#00CCFF' },
    { type: 'grow',   color: '#39FF14', letter: 'G', label: 'GROW!',      color2: '#00FF88' },
    { type: 'giant',  color: '#FF8800', letter: 'B', label: 'BIG BALL!',  color2: '#FFCC00' },
    { type: 'multi',  color: '#B44FFF', letter: '3', label: '3x POINTS!', color2: '#8800FF' },
    { type: 'shield', color: '#FFD700', letter: 'W', label: 'SHIELD!',    color2: '#FFE066' }
];

function spawnPowerUp() {
    const k = PU_TYPES[Math.floor(Math.random() * PU_TYPES.length)];
    const sz = Math.max(18, Math.min(W, H) * 0.04);
    powerUp = {
        x: W * 0.25 + Math.random() * W * 0.5,
        y: -sz,
        vy: Math.min(W, H) * 0.18,
        w: sz * 2.2,
        h: sz,
        ...k
    };
}

function checkPowerUp() {
    if (!powerUp) return;
    const pu = powerUp;
    const hw = pu.w / 2, hh = pu.h / 2;
    const br = brad * bradMod;
    if (bx + br > pu.x - hw && bx - br < pu.x + hw &&
        by + br > pu.y - hh && by - br < pu.y + hh) {
        applyPowerUp(pu.type);
        synthPowerUp(); vibrate([30, 20, 30]);
        announce(pu.letter + ' ' + pu.label);
        speak(pu.label);
        spawnParticles(pu.x, pu.y, [pu.color, pu.color2, '#fff'], 18, true);
        powerUp = null;
    }
    if (pu && pu.y > H + pu.h) powerUp = null;
}

function applyPowerUp(type) {
    const dur = 6000;
    let t;
    if (type === 'speed') {
        bspdMod *= 1.5;
        t = setTimeout(() => { bspdMod = Math.max(1, bspdMod / 1.5); }, dur);
    } else if (type === 'freeze') {
        bspdMod *= 0.45;
        t = setTimeout(() => { bspdMod = Math.min(2.2, bspdMod / 0.45); }, dur);
    } else if (type === 'grow') {
        phMod = 1.7;
        createPaddleGrads();
        t = setTimeout(() => { phMod = 1; createPaddleGrads(); }, dur);
    } else if (type === 'giant') {
        bradMod = 2.5;
        t = setTimeout(() => { bradMod = 1; }, dur);
    } else if (type === 'multi') {
        multiActive = true;
        if (multiTimer) clearTimeout(multiTimer);
        multiTimer = setTimeout(() => { multiActive = false; multiTimer = null; }, 12000);
    } else if (type === 'shield') {
        shieldTimer = 5;
    }
    if (t) puTimers.push(t);
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

        ctx.strokeStyle = `rgba(${br},${bg},${bb},${0.1 + bPulse * 0.12})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(inset - 1, inset - 1, bw + 2, bh + 2, cr + 1);
        ctx.stroke();

        ctx.strokeStyle = `rgba(${br},${bg},${bb},${0.25 + bPulse * 0.3})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(inset, inset, bw, bh, cr);
        ctx.stroke();
    }

    // Center divider — subtle glow line
    if (!hc) {
        const divGrad = ctx.createLinearGradient(W / 2, 0, W / 2, H);
        divGrad.addColorStop(0, `rgba(${br},${bg},${bb},0)`);
        divGrad.addColorStop(0.3, `rgba(${br},${bg},${bb},0.08)`);
        divGrad.addColorStop(0.5, `rgba(${br},${bg},${bb},0.12)`);
        divGrad.addColorStop(0.7, `rgba(${br},${bg},${bb},0.08)`);
        divGrad.addColorStop(1, `rgba(${br},${bg},${bb},0)`);
        ctx.strokeStyle = divGrad;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    } else {
        ctx.setLineDash([8, 14]);
        ctx.strokeStyle = 'rgba(255,255,255,.2)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
        ctx.setLineDash([]);
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, Math.min(W, H) * 0.08, 0, Math.PI * 2);
    ctx.strokeStyle = hc ? 'rgba(255,255,255,.12)' : `rgba(${br},${bg},${bb},0.06)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const pph = ph * phMod;
    const bRad = brad * bradMod;
    const ballColor = hc ? '#FFF' : `hsl(${hue}, 100%, 60%)`;
    const glowAmt = 0.5 + Math.sin(glowPulse * 2) * 0.3;
    const hoverOff = Math.sin(glowPulse * 1.5) * 2;

    // Shield walls
    if (shieldTimer > 0 && !hc) {
        const sa = Math.min(1, shieldTimer / 2) * (0.5 + Math.sin(glowPulse * 4) * 0.2);
        ctx.fillStyle = `rgba(255,215,0,${sa * 0.15})`;
        ctx.fillRect(0, 0, pmar - 2, H);
        ctx.fillRect(W - pmar + 2, 0, pmar - 2, H);
        ctx.strokeStyle = `rgba(255,215,0,${sa * 0.8})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(pmar - 2, 0); ctx.lineTo(pmar - 2, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(W - pmar + 2, 0); ctx.lineTo(W - pmar + 2, H); ctx.stroke();
    }

    // Left paddle — crisp with subtle glow
    if (!hc) {
        const lGlow = 0.015 + glowAmt * 0.025 + leftHitGlow * 0.5;
        ctx.fillStyle = `rgba(0,240,255,${lGlow})`;
        const lExp = 5 + leftHitGlow * 10;
        ctx.beginPath();
        ctx.roundRect(pmar - lExp, ly + hoverOff - lExp, pw + lExp * 2, pph + lExp * 2, pw / 2 + lExp);
        ctx.fill();
    }
    ctx.fillStyle = hc ? '#FFF' : leftPaddleGrad;
    ctx.beginPath();
    ctx.roundRect(pmar, ly + hoverOff, pw, pph, pw / 2.5);
    ctx.fill();
    if (!hc) {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(pmar, ly + hoverOff, pw, pph, pw / 2.5);
        ctx.stroke();
    }
    if (leftHitGlow > 0 && !hc) {
        ctx.fillStyle = `rgba(255,255,255,${leftHitGlow * 0.4})`;
        ctx.beginPath();
        ctx.roundRect(pmar, ly + hoverOff, pw, pph, pw / 2.5);
        ctx.fill();
    }

    // Right paddle — crisp with subtle glow
    if (!hc) {
        const rGlow = 0.015 + glowAmt * 0.025 + rightHitGlow * 0.5;
        ctx.fillStyle = `rgba(255,107,245,${rGlow})`;
        const rExp = 5 + rightHitGlow * 10;
        ctx.beginPath();
        ctx.roundRect(W - pmar - pw - rExp, ry + hoverOff - rExp, pw + rExp * 2, pph + rExp * 2, pw / 2 + rExp);
        ctx.fill();
    }
    ctx.fillStyle = hc ? '#FFF' : rightPaddleGrad;
    ctx.beginPath();
    ctx.roundRect(W - pmar - pw, ry + hoverOff, pw, pph, pw / 2.5);
    ctx.fill();
    if (!hc) {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(W - pmar - pw, ry + hoverOff, pw, pph, pw / 2.5);
        ctx.stroke();
    }
    if (rightHitGlow > 0 && !hc) {
        ctx.fillStyle = `rgba(255,255,255,${rightHitGlow * 0.4})`;
        ctx.beginPath();
        ctx.roundRect(W - pmar - pw, ry + hoverOff, pw, pph, pw / 2.5);
        ctx.fill();
    }

    // Ball trail
    if (!hc) {
        for (let i = 3; i >= 1; i--) {
            const t = i / 3;
            ctx.beginPath();
            ctx.arc(bx - bdx * t * 0.025, by - bdy * t * 0.025, bRad * (1 - t * 0.12), 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${(hue - i * 30 + 360) % 360}, 100%, 60%, ${0.12 - t * 0.03})`;
            ctx.fill();
        }
    }

    // Ball glow
    if (!hc) {
        ctx.beginPath();
        ctx.arc(bx, by, bRad * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${bradMod > 1 ? 0.15 : 0.08})`;
        ctx.fill();
    }

    // Ball
    ctx.beginPath();
    ctx.arc(bx, by, bRad, 0, Math.PI * 2);
    ctx.fillStyle = ballColor;
    ctx.fill();
    if (bradMod > 1 && !hc) {
        ctx.strokeStyle = `hsla(${hue}, 100%, 70%, 0.6)`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    // Ball highlight
    ctx.beginPath();
    ctx.arc(bx - bRad * 0.2, by - bRad * 0.2, bRad * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fill();

    // Active power-up indicators
    if (!hc) {
        const inds = [];
        if (bspdMod > 1.1) inds.push({ label: '\u{1F525} TURBO', color: '#FF4444' });
        if (bspdMod < 0.9) inds.push({ label: '\u{2744}\u{FE0F} FREEZE', color: '#4488FF' });
        if (phMod > 1.1) inds.push({ label: '\u{1F4AA} GROW', color: '#39FF14' });
        if (bradMod > 1.1) inds.push({ label: '\u{1F3C0} BIG BALL', color: '#FF8800' });
        if (multiActive) inds.push({ label: '\u{26A1} 3x NEXT GOAL', color: '#B44FFF' });
        if (shieldTimer > 0) inds.push({ label: '\u{1F6E1}\u{FE0F} SHIELD', color: '#FFD700' });
        if (inds.length > 0) {
            const fs = Math.round(Math.min(W, H) * 0.032);
            ctx.font = `900 ${fs}px 'Bungee', sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
            inds.forEach((ind, i) => {
                const pulse = 0.5 + Math.sin(performance.now() / 250 + i * 2) * 0.4;
                ctx.fillStyle = 'rgba(0,0,0,0.4)';
                ctx.fillText(ind.label, W / 2 + 1, H - 54 - i * (fs + 6) + 1);
                ctx.globalAlpha = pulse;
                ctx.fillStyle = ind.color;
                ctx.fillText(ind.label, W / 2, H - 54 - i * (fs + 6));
                ctx.globalAlpha = 1;
            });
        }
    }

    // Power-up — Arkanoid SNES capsule
    if (powerUp) {
        const pu = powerUp;
        const pulse = 1 + Math.sin(performance.now() / 180) * 0.12;
        const hw = pu.w / 2 * pulse, hh = pu.h / 2 * pulse;
        const cr = hh;

        // Capsule glow
        if (!hc) {
            ctx.fillStyle = `${pu.color}22`;
            ctx.beginPath();
            ctx.roundRect(pu.x - hw - 4, pu.y - hh - 4, hw * 2 + 8, hh * 2 + 8, cr + 4);
            ctx.fill();
        }

        // Capsule body gradient
        const capGrad = ctx.createLinearGradient(pu.x, pu.y - hh, pu.x, pu.y + hh);
        capGrad.addColorStop(0, pu.color2);
        capGrad.addColorStop(0.4, pu.color);
        capGrad.addColorStop(1, pu.color2);
        ctx.fillStyle = capGrad;
        ctx.beginPath();
        ctx.roundRect(pu.x - hw, pu.y - hh, hw * 2, hh * 2, cr);
        ctx.fill();

        // Capsule highlight
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.roundRect(pu.x - hw + 2, pu.y - hh + 2, hw * 2 - 4, hh * 0.7, cr);
        ctx.fill();

        // Capsule border
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(pu.x - hw, pu.y - hh, hw * 2, hh * 2, cr);
        ctx.stroke();

        // Letter
        const fs = Math.round(hh * 1.4);
        ctx.font = `900 ${fs}px 'Bungee', sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(pu.letter, pu.x, pu.y + 1);
    }

    renderParticles();

    // Score flash overlay
    if (scoreFlash > 0 && !hc) {
        ctx.fillStyle = `rgba(255,255,255,${scoreFlash * 0.2})`;
        ctx.fillRect(-10, -10, W + 20, H + 20);
    }

    // Serve countdown number
    if (serveTimer > 0 && countdownNum > 0) {
        const cSize = Math.round(Math.min(W, H) * 0.22);
        const pulse = 1 + Math.sin(performance.now() / 120) * 0.08;
        ctx.font = `900 ${Math.round(cSize * pulse)}px 'Bungee', sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillText(countdownNum, W / 2 + 3, H / 2 + 3);
        ctx.fillStyle = `rgba(255,215,0,${0.6 + Math.sin(performance.now() / 150) * 0.3})`;
        ctx.fillText(countdownNum, W / 2, H / 2);
    }

    // Ball pulse during serve
    if (serveTimer > 0) {
        const servePulse = 0.3 + Math.sin(performance.now() / 200) * 0.2;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, bRad * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${servePulse})`;
        ctx.fill();
    }

    ctx.restore();
}

// ===== BACKGROUND PICKER =====
let bgPickerOpen = false;

$('bgPickerBtn').addEventListener('click', () => {
    bgPickerOpen = !bgPickerOpen;
    const panel = $('bgPickerPanel');
    panel.style.display = bgPickerOpen ? 'flex' : 'none';
    if (bgPickerOpen) buildBgPicker();
    vibrate(12);
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
            vibrate(12);
        });
        panel.appendChild(btn);
    });
}

// ===== MUSIC TOGGLE =====
$('musicToggleBtn').addEventListener('click', () => {
    toggleMusicLive();
    vibrate(12);
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
        if (settings.gameMode === 1) {
            tLeftY = t.clientY;
        } else {
            if (t.clientX < W / 2) tLeftY = t.clientY;
            else tRightY = t.clientY;
        }
    }
}
function handleTouchEnd(e) {
    if (settings.gameMode === 1) {
        if (e.touches.length === 0) tLeftY = null;
    } else {
        const still = new Set();
        for (const t of e.touches) {
            if (t.clientX < W / 2) still.add('l'); else still.add('r');
        }
        if (!still.has('l')) tLeftY = null;
        if (!still.has('r')) tRightY = null;
    }
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
    clearInterval(timerInt); resetState();
    serveTimer = 3.2; countdownNum = 3; countdownBeepPlayed = 0; timerStarted = false;
    startMusic();
    paused = false; screens.pause.style.display = 'none';
}

// ===== CONFETTI =====
function spawnConfetti() {
    confetti = [];
    const colors = ['#FF6BF5', '#FFD700', '#00F0FF', '#39FF14', '#FF4444', '#B44FFF', '#FF8800', '#fff'];
    for (let i = 0; i < 120; i++) {
        confetti.push({
            x: Math.random() * W,
            y: -20 - Math.random() * H * 0.5,
            vx: (Math.random() - 0.5) * 200,
            vy: 150 + Math.random() * 300,
            size: 4 + Math.random() * 6,
            color: colors[Math.floor(Math.random() * colors.length)],
            rot: Math.random() * Math.PI * 2,
            rotV: (Math.random() - 0.5) * 8,
            life: 3 + Math.random() * 2,
            maxLife: 3 + Math.random() * 2
        });
    }
    confettiActive = true;
}

function updateConfetti(dt) {
    if (!confettiActive) return;
    let alive = false;
    for (let i = confetti.length - 1; i >= 0; i--) {
        const c = confetti[i];
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.vy += 80 * dt;
        c.vx *= 0.99;
        c.rot += c.rotV * dt;
        c.life -= dt;
        if (c.life <= 0 || c.y > H + 30) { confetti.splice(i, 1); continue; }
        alive = true;
    }
    if (!alive) confettiActive = false;
}

function renderConfetti() {
    if (!confettiActive) return;
    for (const c of confetti) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, c.life / (c.maxLife * 0.3));
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
        ctx.restore();
    }
    ctx.globalAlpha = 1;
}

let celebrationRafId = null;
function celebrationLoop() {
    if (!confettiActive) {
        canvas.style.display = 'none';
        celebrationRafId = null;
        return;
    }
    const now = performance.now();
    const dt = Math.min((now - (celebrationLoop._last || now)) / 1000, 0.05);
    celebrationLoop._last = now;
    updateConfetti(dt);
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = 'rgba(6,14,26,0.92)';
    ctx.fillRect(0, 0, W, H);
    renderConfetti();
    ctx.restore();
    celebrationRafId = requestAnimationFrame(celebrationLoop);
}

// ===== END =====
function endGame(msg) {
    gameOn = false; paused = false;
    clearInterval(timerInt);
    if (rafId) cancelAnimationFrame(rafId);
    stopMusic();
    releaseWakeLock();
    synthWin();
    vibrate([80, 100, 80, 100, 80, 60]);

    const p1Won = lscore > rscore;
    if (p1Won && settings.gameMode === 1) settings.totalWins = settings.totalWins + 1;
    const best = Math.max(lscore, rscore);
    const isNewBest = best > settings.bestScore;
    if (isNewBest) settings.bestScore = best;

    screens.hud.style.display = 'none';
    screens.controls.style.display = 'none';
    screens.pause.style.display = 'none';
    $('announceText').style.display = 'none';
    $('bgPickerPanel').style.display = 'none';
    bgPickerOpen = false;

    resize();
    spawnConfetti();
    celebrationLoop._last = performance.now();
    celebrationRafId = requestAnimationFrame(celebrationLoop);

    const diff = Math.abs(lscore - rscore);
    const winner = p1Won ? settings.p1Name : settings.p2Name;
    let displayMsg;
    if (msg === "It's a Tie!") {
        displayMsg = "IT'S A TIE! EPIC BATTLE!";
    } else if (diff >= 10) {
        displayMsg = winner + ' DOMINATED! \u{1F451}';
    } else if (diff >= 5) {
        displayMsg = winner + ' CRUSHED IT! \u{1F4AA}';
    } else if (diff <= 2) {
        displayMsg = 'SO CLOSE! ' + winner + ' WINS!';
    } else {
        const msgs = [
            winner + ' IS CHAMPION! \u{1F3C6}',
            winner + ' WINS! AMAZING!',
            'LEGENDARY ' + winner + '! \u{1F525}',
            winner + ' IS ON FIRE!',
            winner + ' UNSTOPPABLE! \u{26A1}'
        ];
        displayMsg = msgs[Math.floor(Math.random() * msgs.length)];
    }
    $('winnerMessage').textContent = displayMsg;
    speak(displayMsg);

    let statsLine = lscore + ' - ' + rscore + '  \u{2022}  ' + totalHits + ' hits  \u{2022}  ' + maxCombo + 'x combo';
    if (settings.gameMode === 1) statsLine += '  \u{2022}  ' + settings.totalWins + ' wins';
    if (isNewBest) statsLine += '  \u{2022}  NEW BEST!';
    $('finalScore').textContent = statsLine;

    if (isNewBest) {
        $('newBestBadge').style.display = 'block';
        setTimeout(() => speak('New personal best!'), 1500);
    } else {
        $('newBestBadge').style.display = 'none';
    }

    const emojis = ['\u{1F3C6}', '\u{1F389}', '\u{2B50}', '\u{1F525}', '\u{1F4AA}', '\u{1F451}', '\u{1F38A}'];
    $('gameOverEmoji').textContent = emojis[Math.floor(Math.random() * emojis.length)];
    screens.gameOver.style.display = 'flex';
}

$('playAgainButton').addEventListener('click', () => {
    screens.gameOver.style.display = 'none';
    confettiActive = false; confetti = [];
    if (celebrationRafId) { cancelAnimationFrame(celebrationRafId); celebrationRafId = null; }
    startGame();
});
$('mainMenuButton').addEventListener('click', quit);

function quit() {
    gameOn = false; paused = false;
    clearInterval(timerInt);
    if (rafId) cancelAnimationFrame(rafId);
    confettiActive = false; confetti = [];
    if (celebrationRafId) { cancelAnimationFrame(celebrationRafId); celebrationRafId = null; }
    stopMusic();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    canvas.style.display = 'none';
    screens.hud.style.display = 'none';
    screens.controls.style.display = 'none';
    screens.pause.style.display = 'none';
    screens.gameOver.style.display = 'none';
    $('announceText').style.display = 'none';
    $('bgPickerPanel').style.display = 'none';
    bgPickerOpen = false;
    releaseWakeLock();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    showScreen('menu');
    updateMenuStats();
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

// ===== PORTRAIT NUDGE =====
function checkOrientation() {
    const nudge = $('landscapeNudge');
    if (!nudge) return;
    nudge.style.display = (window.innerHeight > window.innerWidth) ? 'flex' : 'none';
}
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', () => setTimeout(checkOrientation, 200));
checkOrientation();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
}

})();
