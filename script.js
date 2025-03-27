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
const rateUsButton = document.getElementById('rateUsButton');

if (!canvas || !ctx || !startButton || !pauseButton || !restartButton || !bgMusic || !scoreSound || !hitSound || !gameOverScreen || !winnerMessage || !playAgainButton || !mainMenuButton || !rateUsButton) {
    console.error('One or more required DOM elements are missing.');
}

const BALL_RADIUS = 8;
const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 120; // Increase paddle height
const INITIAL_BALL_SPEED = 12; // Increased initial speed
const PADDLE_SPEED = 12; // Increased paddle speed
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
let extraBalls = [];

// Adjust speeds dynamically based on screen size
const deviceScaleFactor = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
const ADJUSTED_BALL_SPEED = INITIAL_BALL_SPEED * deviceScaleFactor;
const ADJUSTED_PADDLE_SPEED = PADDLE_SPEED * deviceScaleFactor;

function initializeGame() {
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    resetBall();
    leftPaddleY = rightPaddleY = (canvas.height - PADDLE_HEIGHT) / 2;
    drawScore();
    ballMoving = false;
    gamePaused = false;
    if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(draw);
    }
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
    ctx.roundRect(x, y, PADDLE_WIDTH, PADDLE_HEIGHT, 10); // Add rounded corners
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

// Adjust the scoreboard to be centered and touch the top border
function drawScore() {
    const player1Name = localStorage.getItem('player1Name') || 'Player 1';
    const player2Name = localStorage.getItem('player2Name') || 'Player 2';

    // Draw the scoreboard box
    const boxWidth = 300;
    const boxHeight = 50;
    const boxX = (canvas.width - boxWidth) / 2; // Center horizontally
    const boxY = 0; // Touch the top border

    ctx.beginPath();
    ctx.rect(boxX, boxY, boxWidth, boxHeight);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Semi-transparent black background
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFD700'; // Golden border
    ctx.stroke();
    ctx.closePath();

    // Add player names and scores
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#FFFFFF'; // White text color
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Left player name and score
    ctx.fillText(`${player1Name}: ${leftScore}`, boxX + boxWidth * 0.3, boxY + boxHeight * 0.5);

    // Right player name and score
    ctx.fillText(`${player2Name}: ${rightScore}`, boxX + boxWidth * 0.7, boxY + boxHeight * 0.5);
}

let lastTime = performance.now(); // Use high-resolution timer for better precision

// Optimize game performance by capping frame rate and reducing unnecessary calculations
let lastFrameTime = 0;
const FRAME_RATE = 60; // Target frame rate
const FRAME_DURATION = 1000 / FRAME_RATE;

function draw(timestamp) {
    if (gamePaused) return;

    const deltaTime = timestamp - lastFrameTime;
    if (deltaTime < FRAME_DURATION) {
        requestAnimationFrame(draw);
        return;
    }

    lastFrameTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBall();
    drawPaddle(4 * PADDLE_WIDTH, leftPaddleY);
    drawPaddle(canvas.width - 5 * PADDLE_WIDTH, rightPaddleY);
    drawMiddleLine();
    drawScore();
    drawParticles();

    if (ballMoving) {
        updateBallPosition(deltaTime / 1000); // Normalize deltaTime to seconds
        updateExtraBalls(deltaTime / 1000); // Update extra balls
    }

    updatePlayerControls();
    updateAIPaddle(deltaTime / 1000);
    requestAnimationFrame(draw);
}

// Add scoring multiplier for consecutive hits
let hitStreak = 0;
let scoreMultiplier = 1;

function updateScore(player) {
    if (player === 'left') {
        leftScore += scoreMultiplier;
    } else if (player === 'right') {
        rightScore += scoreMultiplier;
    }
    hitStreak++;
    if (hitStreak % 5 === 0) {
        scoreMultiplier++;
    }
    drawScore();
}

function resetMultiplier() {
    hitStreak = 0;
    scoreMultiplier = 1;
}

// Refine ball movement for smoother gameplay
const scoreEffectSound = new Audio('score-effect.mp3');

// Improve ball movement for smoother gameplay
function updateBallPosition(deltaTime) {
    const speedFactor = deltaTime * 60; // Normalize speed to 60 FPS
    ballX += dx * speedFactor;
    ballY += dy * speedFactor;

    // Ball collision with top and bottom walls
    if (ballY - BALL_RADIUS < 0 || ballY + BALL_RADIUS > canvas.height) {
        dy = -dy;
        dy += (Math.random() - 0.5) * 0.5; // Add slight randomness to the bounce angle
    }

    // Ball collision with paddles
    if (
        ballX - BALL_RADIUS < 4 * PADDLE_WIDTH &&
        ballY > leftPaddleY &&
        ballY < leftPaddleY + PADDLE_HEIGHT
    ) {
        dx = -Math.min(Math.abs(dx) * 1.1, MAX_BALL_SPEED) * Math.sign(dx);
        dy += (Math.random() - 0.5) * 0.5; // Add slight randomness to the bounce angle
        hitSound.currentTime = 0;
        hitSound.play();
        createParticles(ballX, ballY, PADDLE_COLOR);
    } else if (
        ballX + BALL_RADIUS > canvas.width - 5 * PADDLE_WIDTH &&
        ballY > rightPaddleY &&
        ballY < rightPaddleY + PADDLE_HEIGHT
    ) {
        dx = -Math.min(Math.abs(dx) * 1.1, MAX_BALL_SPEED) * Math.sign(dx);
        dy += (Math.random() - 0.5) * 0.5; // Add slight randomness to the bounce angle
        hitSound.currentTime = 0;
        hitSound.play();
        createParticles(ballX, ballY, PADDLE_COLOR);
    }

    // Ball out of bounds
    if (ballX + dx < 0 || ballX + dx > canvas.width) {
        resetBall();
    }
}

function checkLevelUp() {
    if ((leftScore + rightScore) % POINTS_PER_LEVEL === 0 && (leftScore + rightScore) > 0) {
        currentLevel++;
        dx *= 1.1; // Increase ball speed
        dy *= 1.1;
        PADDLE_SPEED += 0.5; // Increase paddle speed
    }
}

function checkGameOver() {
    if (leftScore >= WINNING_SCORE || rightScore >= WINNING_SCORE) {
        saveProgress();
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

// Further refine AI paddle mechanics for smoother tracking
function updateAIPaddle(deltaTime) {
    const speedFactor = deltaTime * 60; // Normalize speed to 60 FPS
    const aiPaddleCenter = rightPaddleY + PADDLE_HEIGHT / 2;
    const predictedY = ballY + (dy / dx) * (canvas.width - ballX);

    if (ballX > canvas.width / 2) {
        const adjustmentSpeed = PADDLE_SPEED * speedFactor;
        if (predictedY > aiPaddleCenter + 15) { // Reduce buffer for more precise tracking
            rightPaddleY += adjustmentSpeed;
        } else if (predictedY < aiPaddleCenter - 15) {
            rightPaddleY -= adjustmentSpeed;
        }
    }

    // Add a reaction boost when the ball is very close to the paddle
    if (ballX > canvas.width * 0.8) {
        const reactionBoost = 2.0; // Increase paddle speed significantly
        if (predictedY > aiPaddleCenter + 15) {
            rightPaddleY += PADDLE_SPEED * speedFactor * reactionBoost;
        } else if (predictedY < aiPaddleCenter - 15) {
            rightPaddleY -= PADDLE_SPEED * speedFactor * reactionBoost;
        }
    }

    // Clamp paddle position to stay within canvas bounds
    rightPaddleY = Math.max(Math.min(rightPaddleY, canvas.height - PADDLE_HEIGHT), 0);
}

// Update controls to ensure independent movement for both players
let keysPressed = new Set();

document.addEventListener('keydown', function(e) {
    keysPressed.add(e.key);
});

document.addEventListener('keyup', function(e) {
    keysPressed.delete(e.key);
});

function updatePlayerControls() {
    // Player 1 controls (Arrow keys)
    if (keysPressed.has('ArrowUp')) {
        leftPaddleY = Math.max(leftPaddleY - PADDLE_SPEED * 2, 0);
    }
    if (keysPressed.has('ArrowDown')) {
        leftPaddleY = Math.min(leftPaddleY + PADDLE_SPEED * 2, canvas.height - PADDLE_HEIGHT);
    }

    // Player 2 controls (W and S keys)
    if (keysPressed.has('w')) {
        rightPaddleY = Math.max(rightPaddleY - PADDLE_SPEED * 2, 0);
    }
    if (keysPressed.has('s')) {
        rightPaddleY = Math.min(rightPaddleY + PADDLE_SPEED * 2, canvas.height - PADDLE_HEIGHT);
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

// Fix touch controls for mobile devices
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touches = e.touches;

    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
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
    }

    if (!ballMoving) {
        ballMoving = true;
        if (!animationFrameId) animationFrameId = requestAnimationFrame(draw);
        bgMusic.play();
    }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touches = e.touches;

    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        if (x < canvas.width / 2 && leftTouch) {
            leftPaddleY = Math.max(Math.min(y - PADDLE_HEIGHT / 2, canvas.height - PADDLE_HEIGHT), 0);
        } else if (x >= canvas.width / 2 && rightTouch) {
            rightPaddleY = Math.max(Math.min(y - PADDLE_HEIGHT / 2, canvas.height - PADDLE_HEIGHT), 0);
        }
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    const touches = e.touches;

    if (touches.length === 0) {
        leftTouch = false;
        rightTouch = false;
    }
}, { passive: false });

// Add new power-ups for gameplay variety
function spawnPowerUp() {
    const powerUpTypes = ['increasePaddle', 'slowBall', 'reverseAI', 'shrinkPaddle', 'ballSplit'];
    const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    const powerUp = {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        type: randomType,
        active: true
    };
    return powerUp;
}

// Add unique sound effects for power-ups
const powerUpSound = new Audio('power-up.mp3');
function applyPowerUp(powerUp) {
    powerUpSound.currentTime = 0;
    powerUpSound.play();
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
    } else if (powerUp.type === 'shrinkPaddle') {
        PADDLE_HEIGHT *= 0.5;
        setTimeout(() => PADDLE_HEIGHT *= 2, 5000); // Revert after 5 seconds
    } else if (powerUp.type === 'ballSplit') {
        spawnExtraBall();
    }
}

function spawnExtraBall() {
    // Logic to add an extra ball to the game
    const extraBall = {
        x: ballX,
        y: ballY,
        dx: -dx,
        dy: -dy,
        radius: BALL_RADIUS,
        color: BALL_COLOR
    };
    extraBalls.push(extraBall);
}

function updateExtraBalls(deltaTime) {
    extraBalls.forEach((ball, index) => {
        ball.x += ball.dx * deltaTime * 60;
        ball.y += ball.dy * deltaTime * 60;

        if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
            ball.dy = -ball.dy;
        }

        if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
            extraBalls.splice(index, 1); // Remove ball if it goes out of bounds
        }
    });
}

// Optimize loading screen to reduce load time
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.style.display = 'flex';
    // Simulate a shorter loading time
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 500); // Reduced to 500ms
}

// Add event listener for the "Rate Us" button
rateUsButton.addEventListener('click', () => {
    alert('Thank you for your feedback! Please rate us on the Play Store.');
});

// Show tooltips for new players
function showTooltips() {
    const tooltips = document.getElementById('tooltips');
    tooltips.style.display = 'block';
    setTimeout(() => {
        tooltips.style.display = 'none';
    }, 5000); // Hide tooltips after 5 seconds
}

// Add a timer for timed challenges
let timer = 60; // 60 seconds countdown
let timerInterval;

function startTimer() {
    const timerElement = document.getElementById('timer');
    timerElement.style.display = 'block';
    timerElement.textContent = `Time Left: ${timer}s`;
    timerInterval = setInterval(() => {
        timer--;
        timerElement.textContent = `Time Left: ${timer}s`;
        if (timer <= 0) {
            clearInterval(timerInterval);
            endGame('Time Up!');
        }
    }, 1000);
}

function endGame(message) {
    gamePaused = true;
    clearInterval(timerInterval);
    gameOverScreen.style.display = 'flex';
    winnerMessage.textContent = message;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    bgMusic.pause();
}

// Add splash screen logic
function showSplashScreen() {
    const splashScreen = document.getElementById('splashScreen');
    splashScreen.style.display = 'flex';
    setTimeout(() => {
        splashScreen.style.display = 'none';
        document.getElementById('mainMenu').style.display = 'flex';
    }, 3000); // Show splash screen for 3 seconds
}

// Ensure the "How to Play" section is displayed when triggered
const howToPlayButton = document.createElement('button');
howToPlayButton.textContent = 'How to Play';
howToPlayButton.style.margin = '10px';
howToPlayButton.addEventListener('click', () => {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('howToPlay').style.display = 'flex';
});
document.getElementById('mainMenu').appendChild(howToPlayButton);

document.getElementById('backToMenuFromHowToPlay').addEventListener('click', () => {
    document.getElementById('howToPlay').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
});

// Call splash screen on load
window.addEventListener('load', () => {
    showSplashScreen();
    showLoadingScreen();
    showTooltips();
});

// Ensure the game starts properly when the "Start" button is clicked
startButton.addEventListener('click', () => {
    initializeGame(); // Initialize the game elements
    if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(draw);
    }
    bgMusic.play();
});

// Add event listener for difficulty selection
const difficultySelect = document.getElementById('difficulty');