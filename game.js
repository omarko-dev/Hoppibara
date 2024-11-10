const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const capybaraImages = [
    'assets/capybara1.png',
    'assets/capybara2.png',
    'assets/capybara3.png'
];

const obstacleImages = [
    'assets/obstacle1.png',
    'assets/obstacle2.png',
    'assets/obstacle3.png',
    'assets/obstacle4.png'
];

const windowImageSrc = 'assets/window.png';
const floorBackgroundSrc = 'assets/floor-background.png';

let capybaraIndex = 0;
let capybaraX = 50;
let capybaraY;
let capybaraFrame = 0;
let isJumping = false;
let jumpSpeed = 0;
const gravity = 0.5;
let gameOver = false;
let score = 0;
let bestScore = 0;
let obstacleSpeed = 5;
const capybaraWidth = 150;
const capybaraHeight = 150;
const moveSpeed = 10; // Increased movement speed

let keys = {
    left: false,
    right: false
};

let obstacleTimeout;
let windowInterval;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    capybaraY = canvas.height - 200 - capybaraHeight; // Adjust capybara position on resize
    console.log(`Canvas resized to: ${canvas.width}x${canvas.height}`);
}

window.addEventListener('resize', resizeCanvas);

const capybara = new Image();
capybara.src = capybaraImages[capybaraIndex];
capybara.onload = () => {
    console.log('Capybara image loaded');
};

const obstacles = obstacleImages.map(src => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        console.log(`${src} loaded`);
    };
    return img;
});

const windowImage = new Image();
windowImage.src = windowImageSrc;
windowImage.onload = () => {
    console.log('Window image loaded');
};

const floorBackground = new Image();
floorBackground.src = floorBackgroundSrc;
floorBackground.onload = () => {
    console.log('Floor background loaded');
};

let obstacleList = [];
let windowList = [];
let floorX = 0;

function preloadImages(images, callback) {
    let loadedImages = 0;
    const totalImages = images.length;

    images.forEach(src => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            loadedImages++;
            if (loadedImages === totalImages) {
                callback();
            }
        };
        img.onerror = () => {
            console.error(`Failed to load image: ${src}`);
            loadedImages++;
            if (loadedImages === totalImages) {
                callback();
            }
        };
    });
}

function spawnObstacle() {
    const obstacle = obstacles[Math.floor(Math.random() * obstacles.length)];
    let size;
    if (obstacle.src.includes('obstacle1.png')) {
        size = 75; // Slightly bigger size for obstacle1 to avoid stretching
    } else if (obstacle.src.includes('obstacle3.png')) {
        size = 160; // Slightly bigger size for obstacle3
    } else if (obstacle.src.includes('obstacle4.png')) {
        size = 150; // Same size as capybara for obstacle4
    } else {
        size = 150; // Default size for other obstacles
    }
    const yPosition = canvas.height - 200 - size; // Place obstacles on top of the floor background
    obstacleList.push({ img: obstacle, x: canvas.width, y: yPosition, width: size, height: size });
    console.log('Obstacle spawned');
    const nextSpawn = Math.random() * 2000 + 1000; // Randomize spawn interval between 1 and 3 seconds
    obstacleTimeout = setTimeout(spawnObstacle, nextSpawn);
}

function spawnWindow() {
    const yPosition = canvas.height - 680; // Adjusted y position for windows
    windowList.push({ img: windowImage, x: canvas.width, y: yPosition, width: 690, height: 480 }); // Slightly smaller window size
    console.log('Window spawned');
}

function drawGround() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100); // White area below the ground line
    ctx.drawImage(floorBackground, floorX, canvas.height - 200, canvas.width, 100); // Floor background
    ctx.drawImage(floorBackground, floorX + canvas.width, canvas.height - 200, canvas.width, 100); // Looping floor background
    floorX -= obstacleSpeed;
    if (floorX <= -canvas.width) {
        floorX = 0;
    }
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4; // Thicker ground line
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 200);
    ctx.lineTo(canvas.width, canvas.height - 200);
    ctx.stroke();
    console.log('Ground drawn');
}

function drawCapybara() {
    ctx.drawImage(capybara, capybaraX, capybaraY, capybaraWidth, capybaraHeight); // Bigger capybara
    console.log('Capybara drawn');
}

function updateCapybara() {
    capybaraFrame++;
    if (capybaraFrame % 5 === 0) { // Faster animation
        capybaraIndex = (capybaraIndex + 1) % capybaraImages.length;
        capybara.src = capybaraImages[capybaraIndex];
    }

    if (isJumping) {
        capybaraY -= jumpSpeed;
        jumpSpeed -= gravity;
        if (capybaraY >= canvas.height - 200 - capybaraHeight) {
            capybaraY = canvas.height - 200 - capybaraHeight;
            isJumping = false;
            jumpSpeed = 0;
        }
    }

    if (keys.left) {
        capybaraX = Math.max(0, capybaraX - moveSpeed); // Move left but stay in frame
    }
    if (keys.right) {
        capybaraX = Math.min(canvas.width - capybaraWidth, capybaraX + moveSpeed); // Move right but stay in frame
    }
}

function drawObstacles() {
    obstacleList.forEach(obstacle => {
        ctx.drawImage(obstacle.img, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        obstacle.x -= obstacleSpeed; // Move obstacle to the left
    });

    // Remove obstacles that are off-screen
    obstacleList = obstacleList.filter(obstacle => obstacle.x + obstacle.width > -100); // Adjusted to remove far off-screen obstacles
    console.log('Obstacles drawn');
}

function drawWindows() {
    windowList.forEach(window => {
        ctx.drawImage(window.img, window.x, window.y, window.width, window.height);
        window.x -= obstacleSpeed; // Move window to the left
    });

    // Remove windows that are off-screen
    windowList = windowList.filter(window => window.x + window.width > -100); // Adjusted to remove far off-screen windows
    console.log('Windows drawn');
}

function checkCollision() {
    for (let i = 0; i < obstacleList.length; i++) {
        const obstacle = obstacleList[i];
        if (
            capybaraX < obstacle.x + obstacle.width * 0.8 && // Smaller hitbox
            capybaraX + capybaraWidth > obstacle.x + obstacle.width * 0.2 && // Smaller hitbox
            capybaraY < obstacle.y + obstacle.height * 0.8 && // Smaller hitbox
            capybaraY + capybaraHeight > obstacle.y + obstacle.height * 0.2 // Smaller hitbox
        ) {
            console.log('Collision detected!');
            gameOver = true;
            break;
        }
    }
}

function drawScore() {
    ctx.font = 'bold 36px Quicksand'; // Bigger font size
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(`${score}`, canvas.width / 2, 50); // Move score down a bit
}

function drawGameOver() {
    ctx.font = '48px Quicksand';
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    ctx.font = '24px Quicksand';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeText(`Best Score: ${bestScore}`, canvas.width / 2, canvas.height / 2 + 50);
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 3; // Reduced shadow blur
    ctx.shadowOffsetX = 1; // Reduced shadow offset
    ctx.shadowOffsetY = 1; // Reduced shadow offset
    ctx.fillText(`Best Score: ${bestScore}`, canvas.width / 2, canvas.height / 2 + 50);
    ctx.strokeText('Press Space to Restart', canvas.width / 2, canvas.height / 2 + 100);
    ctx.fillText('Press Space to Restart', canvas.width / 2, canvas.height / 2 + 100);
    ctx.shadowColor = 'transparent'; // Reset shadow
}

function resetGame() {
    capybaraX = 50;
    capybaraY = canvas.height - 200 - capybaraHeight;
    capybaraFrame = 0;
    isJumping = false;
    jumpSpeed = 0;
    gameOver = false;
    score = 0;
    obstacleSpeed = 5;
    obstacleList = [];
    windowList = [];
    floorX = 0;
    clearTimeout(obstacleTimeout);
    clearInterval(windowInterval);
    spawnObstacle(); // Start spawning obstacles
    windowInterval = setInterval(spawnWindow, 3000); // Spawn window every 3 seconds
    gameLoop();
}

function gameLoop() {
    if (gameOver) {
        if (score > bestScore) {
            bestScore = score;
        }
        drawGameOver();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawWindows(); // Draw windows in the background
    drawGround();
    drawCapybara();
    drawObstacles();
    updateCapybara();
    checkCollision();
    drawScore();
    score++;
    if (score % 100 === 0) { // Increase speed every 100 points
        obstacleSpeed += 0.5;
    }
    if (score % 200 === 0) { // Increase spawn rate every 200 points
        clearTimeout(obstacleTimeout);
        spawnObstacle();
    }
    if (obstacleList.length > 50) { // Limit the number of obstacles
        obstacleList.shift();
    }
    requestAnimationFrame(gameLoop);
    console.log('Game loop running');
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (gameOver) {
            resetGame();
        } else if (!isJumping) {
            isJumping = true;
            jumpSpeed = 15; // Lower jump
            console.log('Capybara jumped');
        }
    }
    if (e.code === 'KeyA') {
        keys.left = true;
    }
    if (e.code === 'KeyD') {
        keys.right = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyA') {
        keys.left = false;
    }
    if (e.code === 'KeyD') {
        keys.right = false;
    }
});

resizeCanvas(); // Ensure canvas is resized initially

// Preload images and start the game
preloadImages([...capybaraImages, ...obstacleImages, windowImageSrc, floorBackgroundSrc], () => {
    spawnObstacle(); // Start spawning obstacles
    windowInterval = setInterval(spawnWindow, 3000); // Spawn window every 3 seconds
    gameLoop();
});
