const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let gameRunning = true;
let gameOver = false;

// Player (Phương Anh - Hồng)
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
            player.shootCooldown = 20;
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
        enemy.shootCooldown = 60;
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
        document.getElementById('status').textContent = '💥 Bạn đã thua! Duy Khánh chiến thắng!';
        document.getElementById('status').className = 'status lose';
    } else if (enemy.hp <= 0) {
        gameRunning = false;
        gameOver = true;
        document.getElementById('status').textContent = '🎉 Bạn đã thắng! Phương Anh chiến thắng!';
        document.getElementById('status').className = 'status win';
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
    ctx.fillText('Phương Anh', 115, 18);
    
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
    drawTank(player);
    drawTank(enemy);
    drawBullets();
    drawHPBars();
    
    requestAnimationFrame(gameLoop);
}

// Mouse tracking for aiming
document.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    window.mouseX = e.clientX - rect.left;
    window.mouseY = e.clientY - rect.top;
});

// Start game
gameLoop();
