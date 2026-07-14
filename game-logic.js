// Pure, DOM-free game math extracted from script.js.
// No canvas/audio/DOM access here on purpose, so these functions can run
// under Node for unit tests as well as in the browser as globals.

function clampPaddle(y, paddleH, courtH) {
    return Math.max(0, Math.min(courtH - paddleH, y));
}

function paddleHitsBall({ bx, by, br, bdx, pmar, pw, paddleY, paddleH, courtW, side }) {
    if (side === 'left') {
        const lx = pmar + pw;
        return bdx < 0 && bx - br <= lx && bx + br > pmar &&
            by + br >= paddleY && by - br <= paddleY + paddleH;
    }
    const rx = courtW - pmar - pw;
    return bdx > 0 && bx + br >= rx && bx - br < courtW - pmar &&
        by + br >= paddleY && by - br <= paddleY + paddleH;
}

function reflectOffPaddle({ by, paddleY, paddleH, speed, side }) {
    const hit = (by - paddleY) / paddleH - 0.5;
    const angle = hit * (Math.PI / 3);
    const dir = side === 'left' ? 1 : -1;
    return {
        bdx: dir * Math.abs(Math.cos(angle)) * speed,
        bdy: Math.sin(angle) * speed
    };
}

// Mirrors the branching in the original getProgressiveAI(): a base
// speed/error/reaction lerp by match progress, then rubber-banding
// nudges based on the current score gap.
function computeAiDifficulty(cfg, lscore, rscore, winScore) {
    const totalPts = lscore + rscore;
    const progress = Math.min(totalPts / (winScore * 1.8), 1);
    const lerp = (a, b, t) => a + (b - a) * t;
    let spd = lerp(cfg.startSpd, cfg.endSpd, progress);
    let err = lerp(cfg.startErr, cfg.endErr, progress);
    let react = cfg.react * (0.6 + progress * 0.4);
    const scoreDiff = rscore - lscore;
    if (scoreDiff >= 5) { spd *= 0.76; err *= 3.0; react *= 0.78; }
    else if (scoreDiff >= 4) { spd *= 0.82; err *= 2.5; react *= 0.83; }
    else if (scoreDiff >= 3) { spd *= 0.87; err *= 2.0; react *= 0.88; }
    else if (scoreDiff >= 2) { spd *= 0.92; err *= 1.55; react *= 0.93; }
    else if (scoreDiff >= 1) { spd *= 0.96; err *= 1.28; react *= 0.97; }
    else if (scoreDiff <= -3) { spd *= 1.04; err *= 0.76; }
    else if (scoreDiff <= -2) { spd *= 1.02; err *= 0.86; }
    return { speed: spd, err: err, react: react, progress };
}

function isWinningScore(score, winScore) {
    return score >= winScore;
}

const GameLogic = { clampPaddle, paddleHitsBall, reflectOffPaddle, computeAiDifficulty, isWinningScore };

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameLogic;
}
if (typeof window !== 'undefined') {
    window.GameLogic = GameLogic;
}
