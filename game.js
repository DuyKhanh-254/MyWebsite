const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let gameRunning = false; // start paused until player clicks "Bắt đầu"
let gameOver = false;
let gameStarted = false;
let isMobile = false; // Flag for mobile mode

// Player name (default)
let playerName = 'Mời các bố nhập tên';

// Player (Hồng)
const player = {
    x: 100,
    y: 500,
    width: 40,
    height: 40,
    speed: 5,
    hp: 100,
    maxHp: 100,
    color: '#ff69b4',
    angle: 0,
    shootCooldown: 0
};

// Enemy (Duy Khánh - Xanh lam)
const enemy = {
    x: 700,
    y: 100,
    width: 40,
    height: 40,
    speed: 3,
    hp: 100,
    maxHp: 100,
    color: '#0099ff',
    angle: Math.PI,
    shootCooldown: 0
};

// Game Configuration
const DIFFICULTY = {
    EASY: { enemySpeed: 2, enemyShootRate: 80, enemyHp: 100 },
    NORMAL: { enemySpeed: 3, enemyShootRate: 60, enemyHp: 150 },
    HARD: { enemySpeed: 4.5, enemyShootRate: 30, enemyHp: 300 }
};

const MAPS = [
    // Map 0: Empty
    [],
    // Map 1: Maze-ish
    [
        { x: 200, y: 150, w: 20, h: 300 },
        { x: 580, y: 150, w: 20, h: 300 },
        { x: 350, y: 0, w: 100, h: 100 },
        { x: 350, y: 500, w: 100, h: 100 }
    ],
    // Map 2: City Streets
    [
        { x: 100, y: 100, w: 100, h: 20 },
        { x: 100, y: 100, w: 20, h: 100 },
        { x: 600, y: 100, w: 100, h: 20 },
        { x: 680, y: 100, w: 20, h: 100 },
        { x: 100, y: 480, w: 100, h: 20 },
        { x: 100, y: 400, w: 20, h: 100 },
        { x: 600, y: 480, w: 100, h: 20 },
        { x: 680, y: 400, w: 20, h: 100 },
        { x: 350, y: 250, w: 100, h: 100 }
    ]
];

// Current Game State
let currentDifficulty = 'NORMAL';
let currentMapId = 0;
let walls = [];

// Arrays for bullets
let playerBullets = [];
let enemyBullets = [];

// Keyboard input
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ') {
        e.preventDefault();
        if (player.shootCooldown <= 0) {
            shootPlayer();
            player.shootCooldown = player.rapidFire ? 5 : 20;
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Shoot function for player
function shootPlayer() {
    const bulletSpeed = 8;
    playerBullets.push({
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        vx: Math.cos(player.angle) * bulletSpeed,
        vy: Math.sin(player.angle) * bulletSpeed,
        radius: 5
    });
}

// Shoot function for enemy AI
function shootEnemy() {
    if (enemy.shootCooldown <= 0) {
        const bulletSpeed = 6;
        enemyBullets.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 2,
            vx: Math.cos(enemy.angle) * bulletSpeed,
            vy: Math.sin(enemy.angle) * bulletSpeed,
            radius: 5
        });
        enemy.shootCooldown = enemy.shootCooldownMax || 60;
    }
}

// Update player position and angle
function updatePlayer() {
    // Xoay tank về phía chuột
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (window.mouseX !== undefined && window.mouseY !== undefined) {
        const dx = window.mouseX - (player.x + player.width / 2);
        const dy = window.mouseY - (player.y + player.height / 2);
        player.angle = Math.atan2(dy, dx);
    }

    // Di chuyển tank
    if (keys['w'] || keys['W']) {
        player.y -= player.speed;
    }
    if (keys['s'] || keys['S']) {
        player.y += player.speed;
    }
    if (keys['a'] || keys['A']) {
        player.x -= player.speed;
    }
    if (keys['d'] || keys['D']) {
        player.x += player.speed;
    }

    // Giới hạn ranh giới
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

    player.shootCooldown--;
}

// Update enemy AI
function updateEnemy() {
    // AI logic: chuyển hướng và bắn về phía người chơi
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Xoay về phía player
    enemy.angle = Math.atan2(dy, dx);

    // Di chuyển ngẫu nhiên nhưng gần về phía player
    if (Math.random() < 0.7) {
        enemy.x += Math.cos(enemy.angle) * enemy.speed;
        enemy.y += Math.sin(enemy.angle) * enemy.speed;
    } else {
        // Di chuyển ngẫu nhiên
        const randomAngle = Math.random() * Math.PI * 2;
        enemy.x += Math.cos(randomAngle) * enemy.speed;
        enemy.y += Math.sin(randomAngle) * enemy.speed;
    }

    // Giới hạn ranh giới
    enemy.x = Math.max(0, Math.min(canvas.width - enemy.width, enemy.x));
    enemy.y = Math.max(0, Math.min(canvas.height - enemy.height, enemy.y));

    // Bắn về phía player
    if (distance < 400) {
        shootEnemy();
    }

    enemy.shootCooldown--;
}

// Update bullets
function updateBullets() {
    // Player bullets
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const bullet = playerBullets[i];
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        // Kiểm tra va chạm với địch
        if (bullet.x > enemy.x && bullet.x < enemy.x + enemy.width &&
            bullet.y > enemy.y && bullet.y < enemy.y + enemy.height) {
            enemy.hp -= 10;
            playerBullets.splice(i, 1);
        }
        // Xóa đạn ngoài màn hình
        else if (bullet.x < 0 || bullet.x > canvas.width ||
            bullet.y < 0 || bullet.y > canvas.height) {
            playerBullets.splice(i, 1);
        }
    }

    // Enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        // Kiểm tra va chạm với người chơi
        if (bullet.x > player.x && bullet.x < player.x + player.width &&
            bullet.y > player.y && bullet.y < player.y + player.height) {
            player.hp -= 10;
            enemyBullets.splice(i, 1);
        }
        // Xóa đạn ngoài màn hình
        else if (bullet.x < 0 || bullet.x > canvas.width ||
            bullet.y < 0 || bullet.y > canvas.height) {
            enemyBullets.splice(i, 1);
        }
    }

    // Cập nhật HP
    document.getElementById('playerHp').textContent = Math.max(0, player.hp);
    document.getElementById('enemyHp').textContent = Math.max(0, enemy.hp);

    // Kiểm tra game over
    if (player.hp <= 0) {
        gameRunning = false;
        gameOver = true;
        document.getElementById('status').textContent = `💥 ${playerName} đã bị tiêu diệt! Duy Khánh chiến thắng!`;
        document.getElementById('status').className = 'status lose';
        showRestartButton();
    } else if (enemy.hp <= 0) {
        gameRunning = false;
        gameOver = true;
        document.getElementById('status').textContent = `🎉 ${playerName} chiến thắng!`;
        document.getElementById('status').className = 'status win';
        showRestartButton();
    } else {
        document.getElementById('status').textContent = '🎮 Đang chơi...';
        document.getElementById('status').className = 'status playing';
    }
}

// Draw player
function drawTank(tank) {
    ctx.save();
    ctx.translate(tank.x + tank.width / 2, tank.y + tank.height / 2);
    ctx.rotate(tank.angle);

    // Thân tank
    ctx.fillStyle = tank.color;
    ctx.fillRect(-tank.width / 2, -tank.height / 2, tank.width, tank.height);

    // Nòng súng
    ctx.strokeStyle = tank.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(tank.width / 2 + 10, 0);
    ctx.stroke();

    ctx.restore();
}

// Draw bullets
function drawBullets() {
    ctx.fillStyle = '#ffff00';
    for (let bullet of playerBullets) {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = '#ff0000';
    for (let bullet of enemyBullets) {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw HP bars
function drawHPBars() {
    const barWidth = 100;
    const barHeight = 10;

    // Player HP bar
    ctx.fillStyle = '#444';
    ctx.fillRect(10, 10, barWidth, barHeight);
    ctx.fillStyle = '#ff69b4';
    ctx.fillRect(10, 10, (player.hp / player.maxHp) * barWidth, barHeight);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, barWidth, barHeight);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.fillText(playerName, 115, 18);

    // Enemy HP bar
    ctx.fillStyle = '#444';
    ctx.fillRect(canvas.width - barWidth - 10, 10, barWidth, barHeight);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(canvas.width - barWidth - 10, 10, (enemy.hp / enemy.maxHp) * barWidth, barHeight);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(canvas.width - barWidth - 10, 10, barWidth, barHeight);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText('Duy Khánh', canvas.width - barWidth - 15, 18);
    ctx.textAlign = 'left';
}

// Main game loop
function gameLoop() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameRunning) {
        updatePlayer();
        updateEnemy();
        updateBullets();
    }

    // Draw
    drawMap();
    drawSkills();
    drawTank(player);
    drawTank(enemy);
    drawBullets();
    drawHPBars();

    // Check collisions
    if (gameRunning) {
        checkCollisions();
        updateSkills();
    }

    requestAnimationFrame(gameLoop);
}

// --- NEW FEATURES ---

function initGame() {
    // Apply Difficulty
    const diff = DIFFICULTY[currentDifficulty] || DIFFICULTY.NORMAL;
    enemy.speed = diff.enemySpeed;
    enemy.maxHp = diff.enemyHp;
    enemy.hp = diff.enemyHp;
    enemy.shootCooldownMax = diff.enemyShootRate;

    // Player Buff (Máu trâu hơn)
    player.maxHp = 300;
    player.hp = 300;

    // Load Map
    walls = MAPS[currentMapId] || [];

    // Reset Positions
    player.x = 100;
    player.y = 500;
    enemy.x = 700;
    enemy.y = 100;

    // Clear Bullets & Skills
    playerBullets = [];
    enemyBullets = [];
    skills = [];

    gameOver = false;
    document.getElementById('status').textContent = '🎮 Đang chơi...';
    document.getElementById('status').className = 'status playing';
}

function drawMap() {
    ctx.fillStyle = '#666';
    for (let wall of walls) {
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
    }
}

// Collision System
function checkCollisions() {
    // Check bullets hitting walls
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        if (checkWallCollision(playerBullets[i])) {
            playerBullets.splice(i, 1);
        }
    }
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        if (checkWallCollision(enemyBullets[i])) {
            enemyBullets.splice(i, 1);
        }
    }

    // Tank vs Walls
    handleTankWallCollision(player);
    handleTankWallCollision(enemy);

    // Tank vs Tank
    handleTankTankCollision(player, enemy);
}

function checkWallCollision(obj) {
    // For bullets (radius)
    if (obj.radius) {
        for (let wall of walls) {
            if (obj.x > wall.x && obj.x < wall.x + wall.w &&
                obj.y > wall.y && obj.y < wall.y + wall.h) {
                return true;
            }
        }
        return false;
    }
    return false;
}

function handleTankWallCollision(tank) {
    for (let wall of walls) {
        if (tank.x < wall.x + wall.w &&
            tank.x + tank.width > wall.x &&
            tank.y < wall.y + wall.h &&
            tank.y + tank.height > wall.y) {

            // Resolve collision (box vs box)
            const centerX = tank.x + tank.width / 2;
            const centerY = tank.y + tank.height / 2;
            const wallCenterX = wall.x + wall.w / 2;
            const wallCenterY = wall.y + wall.h / 2;

            const dx = centerX - wallCenterX;
            const dy = centerY - wallCenterY;

            const halfW = (tank.width + wall.w) / 2;
            const halfH = (tank.height + wall.h) / 2;

            if (Math.abs(dx) / halfW > Math.abs(dy) / halfH) {
                if (dx > 0) tank.x = wall.x + wall.w;
                else tank.x = wall.x - tank.width;
            } else {
                if (dy > 0) tank.y = wall.y + wall.h;
                else tank.y = wall.y - tank.height;
            }
        }
    }
}

function handleTankTankCollision(t1, t2) {
    const dx = (t1.x + t1.width / 2) - (t2.x + t2.width / 2);
    const dy = (t1.y + t1.height / 2) - (t2.y + t2.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = 45;

    if (dist < minDist) {
        const angle = Math.atan2(dy, dx);
        const push = (minDist - dist) / 2;

        t1.x += Math.cos(angle) * push;
        t1.y += Math.sin(angle) * push;
        t2.x -= Math.cos(angle) * push;
        t2.y -= Math.sin(angle) * push;
    }
}

// Skill System
let skills = [];
const SKILL_TYPES = ['HEAL', 'SPEED', 'RAPID_FIRE'];
let skillSpawnTimer = 0;

function updateSkills() {
    // Spawn skills
    skillSpawnTimer++;
    if (skillSpawnTimer > 600) { // Every ~10 seconds
        spawnSkill();
        skillSpawnTimer = 0;
    }

    // Check pickup
    for (let i = skills.length - 1; i >= 0; i--) {
        const skill = skills[i];

        // Simple distance check with player
        const dx = (player.x + player.width / 2) - skill.x;
        const dy = (player.y + player.height / 2) - skill.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 30) {
            applySkill(skill.type);
            skills.splice(i, 1);
        }
    }
}

function spawnSkill() {
    let x, y, valid;
    // Try to find a valid spot not in wall
    for (let i = 0; i < 5; i++) {
        x = Math.random() * (canvas.width - 40) + 20;
        y = Math.random() * (canvas.height - 40) + 20;
        valid = true;
        for (let wall of walls) {
            if (x > wall.x && x < wall.x + wall.w && y > wall.y && y < wall.y + wall.h) {
                valid = false;
                break;
            }
        }
        if (valid) break;
    }

    if (valid) {
        const type = SKILL_TYPES[Math.floor(Math.random() * SKILL_TYPES.length)];
        skills.push({ x, y, type, radius: 15 });
    }
}

function applySkill(type) {
    if (type === 'HEAL') {
        player.hp = Math.min(player.maxHp, player.hp + 50);
        showStatus('💚 Đã hồi máu!');
    } else if (type === 'SPEED') {
        player.speed += 3;
        setTimeout(() => player.speed -= 3, 5000);
        showStatus('⚡ Tăng tốc độ!');
    } else if (type === 'RAPID_FIRE') {
        const originalCD = 20;
        player.shootCooldown = 5; // Initial burst
        // We need a way to override cooldown logic temporarily
        // For simplicity, let's just cheat and say we reduce cooldown logic in updatePlayer loop?
        // Or cleaner: set a flag.
        player.rapidFire = true;
        setTimeout(() => player.rapidFire = false, 5000);
        showStatus('🔫 Bắn liên thanh!');
    }
}

function showStatus(msg) {
    const el = document.getElementById('status');
    const originalText = el.textContent;
    const originalClass = el.className;

    el.textContent = msg;
    el.className = 'status win'; // Use win color for positive effect

    setTimeout(() => {
        if (!gameOver) {
            el.textContent = originalText;
            el.className = originalClass;
        }
    }, 1500);
}

function drawSkills() {
    for (let skill of skills) {
        ctx.beginPath();
        ctx.arc(skill.x, skill.y, skill.radius, 0, Math.PI * 2);

        if (skill.type === 'HEAL') ctx.fillStyle = '#00ff00';
        else if (skill.type === 'SPEED') ctx.fillStyle = '#00ffff';
        else if (skill.type === 'RAPID_FIRE') ctx.fillStyle = '#ffff00';

        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();

        // Icon/Text
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let icon = '?';
        if (skill.type === 'HEAL') icon = '+';
        else if (skill.type === 'SPEED') icon = '⚡';
        else if (skill.type === 'RAPID_FIRE') icon = '🔫';
        ctx.fillText(icon, skill.x, skill.y);
    }
}

// Mouse tracking for aiming
document.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    window.mouseX = e.clientX - rect.left;
    window.mouseY = e.clientY - rect.top;
});

// Start game
gameLoop();

// Start screen logic: read name and start when button clicked
const startButton = document.getElementById('startButton');
const startScreen = document.getElementById('startScreen');
const nameInput = document.getElementById('playerNameInput');
const nameDisplay = document.getElementById('playerNameDisplay');

function startGame() {
    const v = (nameInput && nameInput.value && nameInput.value.trim()) ? nameInput.value.trim() : 'Mời các bố nhập tên';
    playerName = v;

    // Read Difficulty
    const diffSelect = document.getElementById('difficultySelect');
    if (diffSelect) {
        currentDifficulty = diffSelect.value;
        console.log('Selected Difficulty:', currentDifficulty);
    }

    // Read Map
    const mapSelect = document.getElementById('mapSelect');
    if (mapSelect) {
        currentMapId = parseInt(mapSelect.value);
        console.log('Selected Map:', currentMapId);
    }

    // Read Device
    const deviceSelect = document.getElementById('deviceSelect');
    if (deviceSelect) {
        isMobile = (deviceSelect.value === 'MOBILE');
        console.log('Is Mobile:', isMobile);
    }
    
    if (nameDisplay) nameDisplay.textContent = playerName;
    if (startScreen) startScreen.style.display = 'none';
    
    // Reset game state based on new settings
    initGame();
    
    // Setup Controls based on device
    setupControls();
    
    gameRunning = true;
    gameStarted = true;
}

function setupControls() {
    const mobileDiv = document.getElementById('mobileControls');
    if (isMobile) {
        if (mobileDiv) mobileDiv.style.display = 'block';
        // Add a small delay to ensure display:block applies before attaching events?
        // Not usually needed but safety check.
        setTimeout(setupMobileEvents, 100);
    } else {
        if (mobileDiv) mobileDiv.style.display = 'none';
        removeMobileEvents(); // Cleanup if switch device
    }
}

let activeTouchHandlers = {};

function setupMobileEvents() {
    const stickZone = document.getElementById('joystickZone');
    const stickKnob = document.getElementById('joystickKnob');
    const aimZone = document.getElementById('aimZone');
    const aimKnob = document.getElementById('aimKnob');
    
    // Joystick
    let stickId = null;
    let aimId = null;
    
    // Joystick Logic
    const updateJoystick = (clientX, clientY, rect) => {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        let dx = clientX - centerX;
        let dy = clientY - centerY;
        
        const dist = Math.sqrt(dx*dx + dy*dy);
        const maxDist = 40; 
        
        if (dist > maxDist) {
            const ratio = maxDist / dist;
            dx *= ratio;
            dy *= ratio;
        }
        
        stickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        
        const threshold = 10;
        keys['w'] = dy < -threshold;
        keys['s'] = dy > threshold;
        keys['a'] = dx < -threshold;
        keys['d'] = dx > threshold;
    };
    
    // Aim Logic
    const updateAim = (clientX, clientY, rect) => {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        let dx = clientX - centerX;
        let dy = clientY - centerY;
        
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 30; // Aim joystick range
        
        if (dist > maxDist) {
            const ratio = maxDist / dist;
            dx *= ratio;
            dy *= ratio;
        }
        
        aimKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        
        // Aim and Shoot
        if (dist > 5) {
            player.angle = Math.atan2(dy, dx);
            if (player.shootCooldown <= 0) {
                 shootPlayer();
                 player.shootCooldown = player.rapidFire ? 5 : 20;
            }
        }
    };
    
    if (stickZone) {
        stickZone.ontouchstart = (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            stickId = touch.identifier;
            const rect = stickZone.getBoundingClientRect();
            updateJoystick(touch.clientX, touch.clientY, rect);
        };
        
        stickZone.ontouchmove = (e) => {
            e.preventDefault();
            for (let i=0; i<e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === stickId) {
                    const rect = stickZone.getBoundingClientRect();
                    updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY, rect);
                    break;
                }
            }
        };
        
        stickZone.ontouchend = (e) => {
             e.preventDefault();
             // Only reset if this touch ended
             for(let i=0; i<e.changedTouches.length; i++) {
                 if (e.changedTouches[i].identifier === stickId) {
                     stickId = null;
                     stickKnob.style.transform = `translate(-50%, -50%)`;
                     keys['w'] = false; keys['s'] = false;
                     keys['a'] = false; keys['d'] = false;
                     break;
                 }
             }
        };
    }
    
    if (aimZone) {
        aimZone.ontouchstart = (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            aimId = touch.identifier;
            const rect = aimZone.getBoundingClientRect();
            updateAim(touch.clientX, touch.clientY, rect);
        };
        
        aimZone.ontouchmove = (e) => {
            e.preventDefault();
            for (let i=0; i<e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === aimId) {
                    const rect = aimZone.getBoundingClientRect();
                    updateAim(e.changedTouches[i].clientX, e.changedTouches[i].clientY, rect);
                    break;
                }
            }
        };
        
         aimZone.ontouchend = (e) => {
             e.preventDefault();
             for(let i=0; i<e.changedTouches.length; i++) {
                 if (e.changedTouches[i].identifier === aimId) {
                     aimId = null;
                     aimKnob.style.transform = `translate(-50%, -50%)`;
                     break;
                 }
             }
        };
    }
}

function removeMobileEvents() {
    // Optional cleanup
    const stickZone = document.getElementById('joystickZone');
    const aimZone = document.getElementById('aimZone');
    if(stickZone) {
        stickZone.ontouchstart = null;
        stickZone.ontouchmove = null;
        stickZone.ontouchend = null;
    }
    if(aimZone) {
        aimZone.ontouchstart = null;
        aimZone.ontouchmove = null;
        aimZone.ontouchend = null;
    }
}

if (startButton) {
    startButton.addEventListener('click', startGame);
}

// allow Enter to start
if (nameInput) {
    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') startGame();
    });
}

const restartBtn = document.getElementById('restartButton');
if (restartBtn) {
    restartBtn.addEventListener('click', () => {
        // Return to start screen
        const startScreen = document.getElementById('startScreen');
        if (startScreen) startScreen.style.display = 'flex';
        
        // Hide restart button
        restartBtn.style.display = 'none';
        
        // Reset status for cleanliness
        document.getElementById('status').textContent = '';
        document.getElementById('status').className = 'status';
        
        gameRunning = false;
    });
}

function showRestartButton() {
    const btn = document.getElementById('restartButton');
    if (btn) btn.style.display = 'block';
}
