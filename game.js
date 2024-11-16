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
let obstacleSpeed = 5; // Adjusted initial speed
const capybaraWidth = 150;
const capybaraHeight = 150;
const moveSpeed = 7; // Adjusted movement speed
let rotationAngle = 0; // Rotation angle for flip animation
let jumpDuration = 0; // Duration of the jump
let jumpStartY = 0; // Starting Y position of the jump

let keys = {
    left: false,
    right: false
};

let obstacleTimeout;
let windowDistance = 1300; // Increased distance between windows
let minSpawnInterval = 2000; // Adjusted minimum spawn interval in milliseconds
let maxSpawnInterval = 3000; // Adjusted maximum spawn interval in milliseconds
const minDistanceBetweenObstacles = 400; // Adjusted minimum distance between consecutive obstacles

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

    // Ensure minimum distance between consecutive obstacles
    if (obstacleList.length > 0) {
        const lastObstacle = obstacleList[obstacleList.length - 1];
        if (canvas.width - lastObstacle.x < minDistanceBetweenObstacles) {
            obstacleTimeout = setTimeout(spawnObstacle, minSpawnInterval);
            return;
        }
    }

    obstacleList.push({ img: obstacle, x: canvas.width, y: yPosition, width: size, height: size });
    console.log('Obstacle spawned');

    // Adjust spawn interval based on the number of obstacles on the screen
    let nextSpawn = Math.random() * (maxSpawnInterval - minSpawnInterval) + minSpawnInterval;

    obstacleTimeout = setTimeout(spawnObstacle, nextSpawn);
}

function spawnWindow() {
    const yPosition = canvas.height - 680; // Adjusted y position for windows

    // Ensure consistent distance between windows
    if (windowList.length > 0) {
        const lastWindow = windowList[windowList.length - 1];
        if (canvas.width - lastWindow.x < windowDistance) {
            return;
        }
    }

    windowList.push({ img: windowImage, x: canvas.width, y: yPosition, width: 690, height: 480 }); // Slightly smaller window size
    console.log('Window spawned');
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
    if (score % 200 === 0) { // Increase speed every 200 points
        obstacleSpeed += 0.25; // More gradual speed increase
    }
    if (score % 400 === 0) { // Decrease spawn interval every 400 points
        minSpawnInterval = Math.max(1000, minSpawnInterval - 200); // Ensure minSpawnInterval doesn't go below 1000ms
        maxSpawnInterval = Math.max(2000, maxSpawnInterval - 200); // Ensure maxSpawnInterval doesn't go below 2000ms
    }
    if (obstacleList.length > 50) { // Limit the number of obstacles
        obstacleList.shift();
    }
    spawnWindow(); // Ensure windows are spawned at a consistent distance
    requestAnimationFrame(gameLoop);
    console.log('Game loop running');
}

function drawGround() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100); // White area below the ground line
    ctx.drawImage(floorBackground, floorX, canvas.height - 200, canvas.width, 100); // Floor background
    ctx.drawImage(floorBackground, floorX + canvas.width, canvas.height - 200, canvas.width, 100); // Looping floor background
    floorX -= obstacleSpeed / 2; // Adjust ground speed to be slower
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
    ctx.save();
    ctx.translate(capybaraX + capybaraWidth / 2, capybaraY + capybaraHeight / 2); // Move to the center of the capybara
    ctx.rotate(rotationAngle * Math.PI / 180); // Rotate the capybara
    ctx.drawImage(capybara, -capybaraWidth / 2, -capybaraHeight / 2, capybaraWidth, capybaraHeight); // Draw the capybara
    ctx.restore();
    console.log('Capybara drawn');
}

function updateCapybara() {
    capybaraFrame++;
    if (capybaraFrame % 10 === 0) { // Adjust animation speed to be consistent and slower
        capybaraIndex = (capybaraIndex + 1) % capybaraImages.length;
        capybara.src = capybaraImages[capybaraIndex];
    }

    if (isJumping) {
        capybaraY -= jumpSpeed;
        jumpSpeed -= gravity;
        rotationAngle += 360 / jumpDuration; // Spread rotation evenly over the entire jump
        if (capybaraY >= canvas.height - 200 - capybaraHeight) {
            capybaraY = canvas.height - 200 - capybaraHeight;
            isJumping = false;
            jumpSpeed = 0;
            rotationAngle = 0; // Reset rotation angle
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
            capybaraX < obstacle.x + obstacle.width * 0.8 &&
            capybaraX + capybaraWidth > obstacle.x + obstacle.width * 0.2 &&
            capybaraY < obstacle.y + obstacle.height * 0.8 &&
            capybaraY + capybaraHeight > obstacle.y + obstacle.height * 0.2
        ) {
            gameOver = true;
            clearTimeout(obstacleTimeout);
            console.log('Collision detected');
            return;
        }
    }
}

function drawScore() {
    ctx.font = 'bold 36px Quicksand'; // Bigger font size
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(score / 10)}`, canvas.width / 2, 50); // Move score down a bit and slow down score increment
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
    jumpSpeed = 18; // Adjusted jump speed for slightly lower jump height
    rotationAngle = 0; // Reset rotation angle
    gameOver = false;
    score = 0;
    obstacleSpeed = 5; // Reset initial speed
    obstacleList = [];
    windowList = [];
    floorX = 0;
    minSpawnInterval = 2000; // Reset spawn intervals
    maxSpawnInterval = 3000;
    clearTimeout(obstacleTimeout);
    spawnObstacle(); // Start spawning obstacles
    gameLoop();
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (gameOver) {
            resetGame();
        } else if (!isJumping) {
            isJumping = true;
            jumpSpeed = 18; // Adjusted jump speed for slightly lower jump height
            rotationAngle = 0; // Reset rotation angle at the start of the jump
            jumpStartY = capybaraY; // Record the starting Y position of the jump
            jumpDuration = 2 * jumpSpeed / gravity; // Calculate the total duration of the jump
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
    loadingScreen.classList.add('fade-out'); // Add fade-out class to loading screen
    setTimeout(() => {
        loadingScreen.style.display = 'none'; // Hide the loading screen after the fade-out transition
        resetGame(); // Start the game by resetting it
    }, 1000); // Match the duration of the CSS transition
});
