const canvas = document.getElementById('gameCanvas');
const ctx = canvas?.getContext('2d');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const restartButton = document.getElementById('restartButton');
const bgMusic = document.getElementById('bgMusic');
const scoreSound = document.getElementById('scoreSound');
const hitSound = document.getElementById('hitSound');
const gameOverScreen = document.getElementById('gameOverScreen');
const winnerMessage = document.getElementById('winnerMessage');
const playAgainButton = document.getElementById('playAgainButton');
const mainMenuButton = document.getElementById('mainMenuButton');

if (!canvas || !ctx || !startButton || !pauseButton || !restartButton || !bgMusic || !scoreSound || !hitSound || !gameOverScreen || !winnerMessage || !playAgainButton || !mainMenuButton) {
    console.error('One or more required DOM elements are missing.');
}

const BALL_RADIUS = 8;
const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 80;
const INITIAL_BALL_SPEED = 8; // Further increased initial speed
const PADDLE_SPEED = 8; // Further increased paddle speed
const PARTICLE_COUNT = 30;
const WINNING_SCORE = 10;
const MAX_BALL_SPEED = 15;
const POINTS_PER_LEVEL = 3;

const BALL_COLOR = '#FFD700';
const PADDLE_COLOR = '#00FA9A';
const MIDDLE_LINE_COLOR = '#FFFFFF';

let ballX, ballY, dx, dy;
let leftPaddleY, rightPaddleY;
let animationFrameId = null;
let leftScore = 0, rightScore = 0;
let ballMoving = false;
let gamePaused = false;
let leftTouch = false;
let rightTouch = false;
let currentLevel = 1;
let particles = [];

function showPauseMessage(message) {
    const pauseMessage = document.getElementById('pauseMessage');
    pauseMessage.textContent = message;
    pauseMessage.style.display = 'block';
    setTimeout(() => {
        pauseMessage.style.display = 'none';
    }, 2000);
}

function initializeGame() {
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    resetBall();
    leftPaddleY = rightPaddleY = (canvas.height - PADDLE_HEIGHT) / 2;
    drawScore();
    showPauseMessage('Get Ready!');
}

function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    dx = (Math.random() > 0.5 ? 1 : -1) * (INITIAL_BALL_SPEED + (currentLevel - 1) * 0.5);
    dy = (Math.random() > 0.5 ? 1 : -1) * (INITIAL_BALL_SPEED + (currentLevel - 1) * 0.5);
    ballMoving = false;
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = BALL_COLOR;
    ctx.shadowBlur = 15;
    ctx.shadowColor = BALL_COLOR; // Add glowing effect
    ctx.fill();
    ctx.closePath();
}

function drawPaddle(x, y) {
    ctx.beginPath();
    ctx.rect(x, y, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillStyle = PADDLE_COLOR;
    ctx.shadowBlur = 15;
    ctx.shadowColor = PADDLE_COLOR; // Add glowing effect
    ctx.fill();
    ctx.closePath();
}

function drawMiddleLine() {
    ctx.beginPath();
    ctx.setLineDash([5, 15]);
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = MIDDLE_LINE_COLOR;
    ctx.stroke();
    ctx.closePath();
}

function drawScore() {
    ctx.font = '28px Arial'; // Updated font size for better visibility
    ctx.fillStyle = '#FFD700'; // Match the menu's golden color
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Left: ${leftScore} | Right: ${rightScore} | Level: ${currentLevel}`, canvas.width / 2, 40);
}

function updateBallPosition() {
    ballX += dx;
    ballY += dy;

    // Simplified collision detection for walls
    if (ballY - BALL_RADIUS < 0 || ballY + BALL_RADIUS > canvas.height) {
        dy = -dy;
    }

    // Simplified collision detection for paddles
    if (
        ballX - BALL_RADIUS < 4 * PADDLE_WIDTH &&
        ballY > leftPaddleY &&
        ballY < leftPaddleY + PADDLE_HEIGHT
    ) {
        dx = -Math.min(Math.abs(dx) * 1.1, MAX_BALL_SPEED) * Math.sign(dx); // Increase speed more noticeably
        hitSound.currentTime = 0;
        hitSound.play();
        createParticles(ballX, ballY, PADDLE_COLOR);
    } else if (
        ballX + BALL_RADIUS > canvas.width - 5 * PADDLE_WIDTH &&
        ballY > rightPaddleY &&
        ballY < rightPaddleY + PADDLE_HEIGHT
    ) {
        dx = -Math.min(Math.abs(dx) * 1.1, MAX_BALL_SPEED) * Math.sign(dx); // Increase speed more noticeably
        hitSound.currentTime = 0;
        hitSound.play();
        createParticles(ballX, ballY, PADDLE_COLOR);
    }

    // Scoring logic
    if (ballX + dx < 0) {
        rightScore++;
        scoreSound.currentTime = 0;
        scoreSound.play();
        resetBall();
    } else if (ballX + dx > canvas.width) {
        leftScore++;
        scoreSound.currentTime = 0;
        scoreSound.play();
        resetBall();
    }
}

function checkLevelUp() {
    if ((leftScore + rightScore) % POINTS_PER_LEVEL === 0 && (leftScore + rightScore) > 0) {
        currentLevel++;
    }
}

function checkGameOver() {
    if (leftScore >= WINNING_SCORE || rightScore >= WINNING_SCORE) {
        gameOverScreen.style.display = 'flex';
        winnerMessage.textContent = leftScore >= WINNING_SCORE ? 'Left Player Wins!' : 'Right Player Wins!';
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        ballMoving = false;
        gamePaused = true;
        bgMusic.pause();
    }
}

function drawParticles() {
    particles.forEach((particle, index) => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${hexToRgb(particle.color)}, ${particle.alpha})`;
        ctx.fill();
        ctx.closePath();

        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.alpha -= 0.02;
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        }
    });
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r},${g},${b}`;
}

function draw() {
    if (gamePaused) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBall();
    drawPaddle(4 * PADDLE_WIDTH, leftPaddleY);
    drawPaddle(canvas.width - 5 * PADDLE_WIDTH, rightPaddleY);
    drawMiddleLine();
    drawScore(); // Ensure the scoreboard is drawn in every frame
    drawParticles();

    if (ballMoving) {
        updateBallPosition();
    }

    updateAIPaddle();
    animationFrameId = window.requestAnimationFrame ? window.requestAnimationFrame(draw) : setTimeout(draw, 1000 / 60);
}

function startGame() {
    if (!ballMoving) {
        ballMoving = true;
        if (!animationFrameId) animationFrameId = requestAnimationFrame(draw);
        bgMusic.play();
    }
    if (gamePaused) {
        gamePaused = false;
        pauseButton.textContent = 'Pause';
        bgMusic.play();
    }
    showPauseMessage('Game Starting!');
}

function pauseGame() {
    gamePaused = !gamePaused;
    pauseButton.textContent = gamePaused ? 'Resume' : 'Pause';
    if (gamePaused) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        bgMusic.pause();
    } else {
        if (!animationFrameId) animationFrameId = requestAnimationFrame(draw);
        bgMusic.play();
    }
    showPauseMessage(gamePaused ? 'Game Paused' : 'Game Resumed');
}

function restartGame() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    resetBall();
    leftPaddleY = rightPaddleY = (canvas.height - PADDLE_HEIGHT) / 2;
    leftScore = 0;
    rightScore = 0;
    currentLevel = 1;
    drawScore();
    ballMoving = false;
    gamePaused = false;
    pauseButton.textContent = 'Pause';
    gameOverScreen.style.display = 'none';
    if (!animationFrameId) animationFrameId = requestAnimationFrame(draw);
    bgMusic.play();
}

function updateAIPaddle() {
    const aiPaddleCenter = rightPaddleY + PADDLE_HEIGHT / 2;
    const ballCenter = ballY;

    if (ballX > canvas.width / 2) {
        rightPaddleY += Math.sign(ballCenter - aiPaddleCenter) * PADDLE_SPEED * 0.8;
        rightPaddleY = Math.max(Math.min(rightPaddleY, canvas.height - PADDLE_HEIGHT), 0);
    }
}

function createParticles(x, y, color) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 4,
            dy: (Math.random() - 0.5) * 4,
            radius: Math.random() * 3 + 1,
            color: color,
            alpha: 1
        });
    }
}

// Add Power-Ups
function spawnPowerUp() {
    const powerUpTypes = ['increasePaddle', 'slowBall', 'reverseAI'];
    const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    const powerUp = {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        type: randomType,
        active: true
    };
    return powerUp;
}

function applyPowerUp(powerUp) {
    if (powerUp.type === 'increasePaddle') {
        PADDLE_HEIGHT *= 1.5;
        setTimeout(() => PADDLE_HEIGHT /= 1.5, 5000); // Revert after 5 seconds
    } else if (powerUp.type === 'slowBall') {
        dx *= 0.5;
        dy *= 0.5;
        setTimeout(() => {
            dx *= 2;
            dy *= 2;
        }, 5000);
    } else if (powerUp.type === 'reverseAI') {
        AI_REVERSED = true;
        setTimeout(() => AI_REVERSED = false, 5000);
    }
}

startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', pauseGame);
restartButton.addEventListener('click', restartGame);

playAgainButton.addEventListener('click', restartGame);
mainMenuButton.addEventListener('click', () => {
    window.location.reload();
});

document.getElementById('startGameButton').addEventListener('click', () => {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('gameCanvas').style.display = 'block';
    document.querySelector('.button-container').style.display = 'flex';
    initializeGame();
});

document.getElementById('settingsButton').addEventListener('click', () => {
    alert('Settings menu is under construction!');
});

document.getElementById('exitButton').addEventListener('click', () => {
    if (confirm('Are you sure you want to exit the game?')) {
        window.location.reload();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowUp') {
        leftPaddleY = Math.max(leftPaddleY - PADDLE_SPEED * 2, 0);
    } else if (e.key === 'ArrowDown') {
        leftPaddleY = Math.min(leftPaddleY + PADDLE_SPEED * 2, canvas.height - PADDLE_HEIGHT);
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (x < canvas.width / 2) {
        leftTouch = true;
        leftPaddleY = Math.max(Math.min(y - PADDLE_HEIGHT / 2, canvas.height - PADDLE_HEIGHT), 0);
    } else {
        rightTouch = true;
        rightPaddleY = Math.max(Math.min(y - PADDLE_HEIGHT / 2, canvas.height - PADDLE_HEIGHT), 0);
    }

    if (!ballMoving) {
        ballMoving = true;
        if (!animationFrameId) animationFrameId = requestAnimationFrame(draw);
        bgMusic.play();
    }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const y = touch.clientY - rect.top;

    if (leftTouch) {
        leftPaddleY = Math.max(Math.min(y - PADDLE_HEIGHT / 2, canvas.height - PADDLE_HEIGHT), 0);
    } else if (rightTouch) {
        rightPaddleY = Math.max(Math.min(y - PADDLE_HEIGHT / 2, canvas.height - PADDLE_HEIGHT), 0);
    }
}, { passive: false });

canvas.addEventListener('touchend', () => {
    leftTouch = false;
    rightTouch = false;
}, { passive: false });

window.addEventListener('resize', initializeGame);
initializeGame();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
        .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
            console.log('Service Worker registration failed:', error);
        });
}