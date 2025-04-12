const canvas = document.getElementById('gameCanvas');
if (!canvas) {
    console.error('Canvas element with id "gameCanvas" not found.');
    throw new Error('Canvas element not found');
}
const ctx = canvas.getContext('2d');

// Consolidated DOM element checks
const requiredElements = [
    'startButton', 'pauseButton', 'restartButton', 'bgMusic', 'scoreSound', 'hitSound',
    'gameOverScreen', 'winnerMessage', 'playAgainButton', 'mainMenuButton', 'rateUsButton'
];

requiredElements.forEach(id => {
    if (!document.getElementById(id)) {
        console.error(`Missing required DOM element: ${id}`);
    }
});

// Adjusted gameplay for better normalization and tablet compatibility
const NORMALIZED_FRAME_RATE = 60; // Target frame rate for consistent gameplay
const TABLET_SPEED_FACTOR = 0.8; // Reduce speed for better control on tablets

function normalizeSpeed(value) {
    return value * TABLET_SPEED_FACTOR;
}

// Adjusted configuration for normalized gameplay
const config = {
    BALL_RADIUS: 8,
    PADDLE_WIDTH: 20,
    PADDLE_HEIGHT: 120,
    INITIAL_BALL_SPEED: normalizeSpeed(8), // Reduced initial ball speed
    PADDLE_SPEED: normalizeSpeed(10), // Reduced paddle speed
    PARTICLE_COUNT: 20, // Reduced particle count for better performance
    WINNING_SCORE: 10,
    MAX_BALL_SPEED: normalizeSpeed(12), // Reduced max ball speed
    POINTS_PER_LEVEL: 3,
    BALL_COLOR: '#FFD700',
    PADDLE_COLOR: '#00FA9A',
    MIDDLE_LINE_COLOR: '#FFFFFF'
};

const BALL_RADIUS = config.BALL_RADIUS;
const PADDLE_WIDTH = config.PADDLE_WIDTH;
const PADDLE_HEIGHT = config.PADDLE_HEIGHT;
const INITIAL_BALL_SPEED = config.INITIAL_BALL_SPEED;
let PADDLE_SPEED = config.PADDLE_SPEED;
const PARTICLE_COUNT = config.PARTICLE_COUNT;
const WINNING_SCORE = config.WINNING_SCORE;
const MAX_BALL_SPEED = config.MAX_BALL_SPEED;
const POINTS_PER_LEVEL = config.POINTS_PER_LEVEL;

const BALL_COLOR = config.BALL_COLOR;
const PADDLE_COLOR = config.PADDLE_COLOR;
const MIDDLE_LINE_COLOR = config.MIDDLE_LINE_COLOR;

let leftScore = 0, rightScore = 0;
const keysPressed = new Set(); // Initialize keysPressed to avoid undefined errors
const bgMusic = document.getElementById('bgMusic'); // Ensure bgMusic is defined
const gameOverScreen = document.getElementById('gameOverScreen'); // Ensure gameOverScreen is defined
const winnerMessage = document.getElementById('winnerMessage'); // Ensure winnerMessage is defined
let leftPaddleY, rightPaddleY;
let animationFrameId = null;
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

let lastFrameTime = 0; // Unified declaration for frame rate capping

// Simple AI difficulty settings with increased challenge
const AI_DIFFICULTY = {
    easy: { speed: 0.9, errorMargin: 20 },     // Increased base speed
    medium: { speed: 1.0, errorMargin: 10 },   // Perfect speed, smaller error margin
    hard: { speed: 1.1, errorMargin: 5 }       // Faster than player with tiny error margin
};

function predictBallY() {
    if (dx <= 0) {
        // When ball is moving away, stay closer to the predicted return position
        const lastHitY = ballY;
        return (lastHitY + (canvas.height - PADDLE_HEIGHT) / 2) / 2;
    }

    // Improved prediction accuracy
    const timeToIntercept = (canvas.width - 5 * PADDLE_WIDTH - ballX) / dx;
    let predictedY = ballY + dy * timeToIntercept;

    // More accurate bounce prediction
    const bounces = Math.floor(Math.abs(predictedY) / canvas.height);
    if (bounces > 0) {
        const remainder = Math.abs(predictedY) % canvas.height;
        predictedY = (bounces % 2 === 0) ? remainder : canvas.height - remainder;
    }

    // Add slight randomization based on difficulty
    const difficulty = localStorage.getItem('difficulty') || 'medium';
    const settings = AI_DIFFICULTY[difficulty];
    const randomOffset = (Math.random() - 0.5) * settings.errorMargin;
    
    // Adjust prediction to anticipate player patterns
    return Math.max(PADDLE_HEIGHT / 2, Math.min(canvas.height - PADDLE_HEIGHT / 2, predictedY + randomOffset)) - PADDLE_HEIGHT / 2;
}

function updateAIPaddle(deltaTime) {
    const difficulty = localStorage.getItem('difficulty') || 'medium';
    const settings = AI_DIFFICULTY[difficulty];

    // More aggressive AI movement
    const targetY = predictBallY();
    const paddleCenter = rightPaddleY + PADDLE_HEIGHT / 2;
    const distance = targetY - paddleCenter;

    // Faster response and more precise movement
    if (Math.abs(distance) > 1) {
        // Exponential speed scaling - faster when far away
        const distanceFactor = Math.min(Math.abs(distance) / 30, 3.0);
        const speed = PADDLE_SPEED * settings.speed * distanceFactor;
        const adjustment = Math.sign(distance) * speed * deltaTime * 60;
        
        // Reduced smoothing for faster reactions
        rightPaddleY += adjustment * 0.95;
        rightPaddleY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, rightPaddleY));
    }

    // Predictive movement - start moving before the ball does
    if (dx > 0 && Math.abs(distance) > PADDLE_HEIGHT / 4) {
        const urgencyFactor = Math.min(1.0, (canvas.width - ballX) / (canvas.width / 2));
        rightPaddleY += Math.sign(distance) * PADDLE_SPEED * settings.speed * urgencyFactor * deltaTime * 60;
    }
}

function initializeGame() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Ensure canvas and buttons are visible, with proper z-index layering
    canvas.style.display = 'block';
    canvas.style.zIndex = '1';
    document.querySelector('.button-container').style.display = 'flex';
    document.querySelector('.button-container').style.zIndex = '1000';

    // Initialize game state
    resetBall();
    leftPaddleY = rightPaddleY = (canvas.height - PADDLE_HEIGHT) / 2;
    leftScore = 0;
    rightScore = 0;
    currentLevel = 1;
    ballMoving = false;
    gamePaused = false;

    console.log('Game initialized');

    // Start game loop
    if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(draw);
    }

    // Add window resize handler
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        leftPaddleY = rightPaddleY = (canvas.height - PADDLE_HEIGHT) / 2;
    });
}

function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    dx = (Math.random() > 0.5 ? 1 : -1) * INITIAL_BALL_SPEED;
    dy = (Math.random() > 0.5 ? 1 : -1) * INITIAL_BALL_SPEED;
    ballMoving = false;

    // Add a short delay before the ball starts moving
    setTimeout(() => {
        ballMoving = true;
    }, 1000); // 1-second delay
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
    console.log('Drawing game elements'); // Debugging log
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
    updatePlayerPaddle(deltaTime / 1000);
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

// Further enhanced gameplay mechanics and performance optimizations
const SMOOTHNESS_FACTOR = 0.95; // Factor to smooth paddle and ball movements

// Improved ball movement for smoother gameplay
function updateBallPosition(deltaTime) {
    // Ensure consistent speed regardless of frame rate
    const speedFactor = deltaTime * NORMALIZED_FRAME_RATE;

    // Update ball position with proper speed normalization
    const nextX = ballX + dx * speedFactor;
    const nextY = ballY + dy * speedFactor;

    // Ball collision with top and bottom walls
    if (nextY - BALL_RADIUS < 0 || nextY + BALL_RADIUS > canvas.height) {
        dy = -dy; // Reverse vertical direction
        ballY = nextY - BALL_RADIUS < 0 ? BALL_RADIUS : canvas.height - BALL_RADIUS;
    } else {
        ballY = nextY;
    }

    // Check paddle collisions before updating X position
    const leftPaddleCollision = nextX - BALL_RADIUS <= 4 * PADDLE_WIDTH + PADDLE_WIDTH && 
                               ballX - BALL_RADIUS > 4 * PADDLE_WIDTH &&
                               ballY >= leftPaddleY && 
                               ballY <= leftPaddleY + PADDLE_HEIGHT;

    const rightPaddleCollision = nextX + BALL_RADIUS >= canvas.width - 5 * PADDLE_WIDTH &&
                                ballX + BALL_RADIUS < canvas.width - 5 * PADDLE_WIDTH + PADDLE_WIDTH &&
                                ballY >= rightPaddleY && 
                                ballY <= rightPaddleY + PADDLE_HEIGHT;

    if (leftPaddleCollision) {
        // Left paddle collision
        const hitPosition = (ballY - leftPaddleY) / PADDLE_HEIGHT;
        const bounceAngle = (hitPosition - 0.5) * Math.PI / 3; // -60° to +60°
        
        const speed = Math.sqrt(dx * dx + dy * dy) * 1.05; // Increase speed by 5%
        dx = Math.abs(speed * Math.cos(bounceAngle));
        dy = speed * Math.sin(bounceAngle);
        
        // Prevent sticking by moving ball to paddle edge
        ballX = 4 * PADDLE_WIDTH + PADDLE_WIDTH + BALL_RADIUS;
        
        if (hitSound) hitSound.play().catch(e => console.log("Error playing hit sound:", e));
        createParticles(ballX, ballY, config.PADDLE_COLOR);
    } else if (rightPaddleCollision) {
        // Right paddle collision
        const hitPosition = (ballY - rightPaddleY) / PADDLE_HEIGHT;
        const bounceAngle = (hitPosition - 0.5) * Math.PI / 3; // -60° to +60°
        
        const speed = Math.sqrt(dx * dx + dy * dy) * 1.05; // Increase speed by 5%
        dx = -Math.abs(speed * Math.cos(bounceAngle));
        dy = speed * Math.sin(bounceAngle);
        
        // Prevent sticking by moving ball to paddle edge
        ballX = canvas.width - 5 * PADDLE_WIDTH - BALL_RADIUS;
        
        if (hitSound) hitSound.play().catch(e => console.log("Error playing hit sound:", e));
        createParticles(ballX, ballY, config.PADDLE_COLOR);
    } else {
        // Update ball X position if no collision
        ballX = nextX;
    }

    // Keep ball speed within limits
    const currentSpeed = Math.sqrt(dx * dx + dy * dy);
    if (currentSpeed > MAX_BALL_SPEED) {
        const scale = MAX_BALL_SPEED / currentSpeed;
        dx *= scale;
        dy *= scale;
    }

    // Ball out of bounds (scoring)
    if (ballX - BALL_RADIUS < 0) {
        rightScore++; // AI scores only when the ball goes out of bounds on the player's side
        if (scoreSound) scoreSound.play().catch(e => console.log("Error playing score sound:", e));
        createParticles(ballX, ballY, "#ff0000");
        resetBall();
        checkLevelUp();
        drawScore();
    } else if (ballX + BALL_RADIUS > canvas.width) {
        leftScore++; // Player scores only when the ball goes out of bounds on the AI's side
        if (scoreSound) scoreSound.play().catch(e => console.log("Error playing score sound:", e));
        createParticles(ballX, ballY, "#ff0000");
        resetBall();
        checkLevelUp();
        drawScore();
    }

    // Check for game over
    if (leftScore >= WINNING_SCORE || rightScore >= WINNING_SCORE) {
        drawGameOver();
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

function drawGameOver() {
    if (gameOverScreen && winnerMessage) {
        gameOverScreen.style.display = 'flex';
        winnerMessage.textContent = leftScore >= WINNING_SCORE ? 'Left Player Wins!' : 'Right Player Wins!';
    } else {
        console.error('Game over screen or winner message element not found.');
    }
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

// Add debugging logs to trace game state transitions
function playBackgroundMusic() {
    if (bgMusic) {
        try {
            bgMusic.play().catch(e => console.log("Error playing background music:", e));
        } catch (e) {
            console.log("Error playing background music:", e);
        }
    }

    if (!ballMoving) {
        ballMoving = true;
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(draw);
            console.log('Game rendering started');
        }
    }
    
    if (gamePaused) {
        gamePaused = false;
        pauseButton.textContent = 'Pause';
    }
}

// Fixing pause button functionality
document.getElementById('pauseButton').addEventListener('click', () => {
    gamePaused = !gamePaused;
    if (gamePaused) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        bgMusic.pause();
        document.getElementById('pauseButton').textContent = 'Resume';
    } else {
        animationFrameId = requestAnimationFrame(draw);
        bgMusic.play();
        document.getElementById('pauseButton').textContent = 'Pause';
    }
});

// Fixing restart button functionality
document.getElementById('restartButton').addEventListener('click', () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    resetBall();
    leftPaddleY = rightPaddleY = (canvas.height - PADDLE_HEIGHT) / 2;
    leftScore = 0;
    rightScore = 0;
    currentLevel = 1;
    drawScore();
    ballMoving = false;
    gamePaused = false;
    document.getElementById('pauseButton').textContent = 'Pause';
    document.getElementById('gameOverScreen').style.display = 'none';
    animationFrameId = requestAnimationFrame(draw);
    bgMusic.play();
});

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

// Refined paddle movement logic for both paddles
function updatePaddlePosition(paddleY, targetY, deltaTime, maxSpeed) {
    const speedFactor = deltaTime * NORMALIZED_FRAME_RATE; // Normalize speed to target frame rate
    const paddleCenter = paddleY + config.PADDLE_HEIGHT / 2;
    const distance = targetY - paddleCenter;

    // Apply adjustment only if the distance is significant to avoid jitter
    if (Math.abs(distance) > 1) {
        const adjustment = Math.sign(distance) * Math.min(Math.abs(distance), maxSpeed * speedFactor);
        paddleY += adjustment * SMOOTHNESS_FACTOR; // Apply smoothness factor
    }

    return Math.max(Math.min(paddleY, canvas.height - config.PADDLE_HEIGHT), 0);
}

// AI difficulty settings are already defined above

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

function updatePlayerPaddle(deltaTime) {
    const moveSpeed = PADDLE_SPEED * deltaTime * 60; // Normalize speed by frame rate
    
    if (keysPressed.has('ArrowUp')) {
        leftPaddleY = Math.max(leftPaddleY - moveSpeed, 0);
    }
    if (keysPressed.has('ArrowDown')) {
        leftPaddleY = Math.min(leftPaddleY + moveSpeed, canvas.height - PADDLE_HEIGHT);
    }
    
    // Keep paddle in bounds
    leftPaddleY = Math.max(0, Math.min(leftPaddleY, canvas.height - PADDLE_HEIGHT));
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

// Improved touch controls for smoother paddle movement on touch screens
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();

    Array.from(e.touches).forEach((touch) => {
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        if (x < canvas.width / 2) {
            leftPaddleY = Math.max(Math.min(y - PADDLE_HEIGHT / 2, canvas.height - PADDLE_HEIGHT), 0);
        } else {
            rightPaddleY = Math.max(Math.min(y - PADDLE_HEIGHT / 2, canvas.height - PADDLE_HEIGHT), 0);
        }
    });

    // Debugging: Log the state of ballMoving and animationFrameId
    console.log('ballMoving:', ballMoving, 'animationFrameId:', animationFrameId);

    // Start the game if it is not already running
    if (!ballMoving && animationFrameId === null) {
        ballMoving = true;
        gamePaused = false; // Ensure the game is not paused
        animationFrameId = requestAnimationFrame(draw);
        bgMusic.play();

        // Debugging: Confirm game start
        console.log('Game started via touch event');
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();

    Array.from(e.touches).forEach((touch) => {
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        if (x < canvas.width / 2) {
            leftPaddleY = Math.max(Math.min(y - PADDLE_HEIGHT / 2, canvas.height - PADDLE_HEIGHT), 0);
        } else {
            rightPaddleY = Math.max(Math.min(y - PADDLE_HEIGHT / 2, canvas.height - PADDLE_HEIGHT), 0);
        }
    });
});

// Add active power-ups array and management system
let activePowerUps = [];
let powerUpSpawnTimer = 0;
const POWER_UP_SPAWN_INTERVAL = 15; // Spawn a power-up every 15 seconds
const POWER_UP_DURATION = 7; // Power-ups last for 7 seconds
const POWER_UP_SIZE = 20; // Size of power-up graphics

// Power-up types with colors and effects
const POWER_UP_TYPES = [
    { type: 'speedUp', color: '#ff0000', description: 'Speed Up!' },
    { type: 'speedDown', color: '#0000ff', description: 'Speed Down!' },
    { type: 'paddleGrow', color: '#00ff00', description: 'Paddle Grow!' },
    { type: 'paddleShrink', color: '#ff00ff', description: 'Paddle Shrink!' },
    { type: 'multiBall', color: '#ffff00', description: 'Multi Ball!' },
    { type: 'reverseControls', color: '#00ffff', description: 'Reverse Controls!' }
];

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

// Define missing constants
const AI_REACTION_TIME = 0.5; // Half-second reaction time for AI

// Declare aiReactionTimer if not already declared
let aiReactionTimer = 0;

// Define the saveProgress function
function saveProgress() {
    // Save game progress to localStorage
    localStorage.setItem('leftScore', leftScore);
    localStorage.setItem('rightScore', rightScore);
    localStorage.setItem('level', currentLevel);
    console.log('Game progress saved');
}

// Fix the showLoadingScreen function
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
        // Simulate a shorter loading time
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500); // Reduced to 500ms
    } else {
        console.error('Loading screen element not found');
    }
}

// Clean up the Rate Us button handler
const rateUsButton = document.getElementById('rateUsButton');
if (rateUsButton) {
    rateUsButton.addEventListener('click', () => {
        alert('Thank you for your interest! Please rate our game!');
    });
}

// Show tooltips function
function showTooltips() {
    const tooltips = document.getElementById('tooltips');
    if (tooltips) {
        tooltips.style.display = 'block';
        setTimeout(() => {
            tooltips.style.display = 'none';
        }, 5000);
    }
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

// Ensure the Start button initializes the game properly
const startButton = document.getElementById('startButton');
if (startButton) {
    startButton.addEventListener('click', () => {
        console.log('Start button clicked');
        initializeGame(); // Initialize the game elements
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(draw);
            console.log('Game rendering started');
        }
    });
} else {
    console.error('Start button not found in the DOM');
}

// Update the startGameButton click handler
document.getElementById('startGameButton').addEventListener('click', () => {
    const player1Name = document.getElementById('player1NameInput').value || 'Player 1';
    const player2Name = document.getElementById('player2NameInput').value || 'Player 2';
    const gameMode = document.getElementById('gameMode').value;

    localStorage.setItem('player1Name', player1Name);
    localStorage.setItem('player2Name', player2Name);
    localStorage.setItem('gameMode', gameMode);

    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('gameCanvas').style.display = 'block';
    const buttonContainer = document.querySelector('.button-container');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.zIndex = '1000';
    
    // Initialize game immediately
    initializeGame();
    ballMoving = true; // Start ball movement
    
    // Initialize and play background music
    const bgMusic = document.getElementById('bgMusic');
    if (bgMusic) {
        bgMusic.volume = 0.5; // Set a comfortable volume level
        bgMusic.currentTime = 0; // Start from beginning
        bgMusic.play().catch(e => console.log("Error playing background music:", e));
    }
    
    // Add keyboard focus
    canvas.focus();
    canvas.setAttribute('tabindex', '0');
    
    // Start game loop
    if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(draw);
    }
});