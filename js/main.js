// ==================== 游戏主逻辑 ====================

// 游戏状态
let game = {
    state: 'start',
    canvas: null,
    ctx: null,
    player: null,
    enemies: [],
    particles: [],
    projectiles: [],
    weaponProjectiles: [],
    summons: [],
    obstacles: [],
    keys: {},
    lastTime: 0,
    gameTime: 0,
    killCount: 0,
    selectedClass: null,
    camera: { x: 0, y: 0 },
    // 存档系统
    currentSaveSlot: null,
    saveSlotMode: null,
    pendingSaveSlot: null,
    pendingSaveData: null,
    // 波数系统
    wave: {
        current: 1,
        enemiesRemaining: 0,
        enemiesSpawned: 0,
        totalEnemies: 0,
        lastSpawnTime: 0,
        isSpawning: false,
        eliteSpawned: false,
        bossSpawned: false,
        waveStartTime: 0,
        inBreak: false
    }
};

// 生成障碍物
function generateObstacles() {
    game.obstacles = [];

    // 生成石头
    for (let i = 0; i < CONFIG.obstacles.rockCount; i++) {
        const x = Math.random() * (CONFIG.world.width - 100) + 50;
        const y = Math.random() * (CONFIG.world.height - 100) + 50;

        const distFromCenter = Math.hypot(x - CONFIG.world.width / 2, y - CONFIG.world.height / 2);
        if (distFromCenter > 200) {
            game.obstacles.push(new Obstacle(x, y, 'rock'));
        }
    }

    // 生成草丛
    for (let i = 0; i < CONFIG.obstacles.bushCount; i++) {
        const x = Math.random() * (CONFIG.world.width - 100) + 50;
        const y = Math.random() * (CONFIG.world.height - 100) + 50;

        game.obstacles.push(new Obstacle(x, y, 'bush'));
    }
}

// 更新摄像机位置
function updateCamera() {
    game.camera.x = game.player.x - CONFIG.canvas.width / 2;
    game.camera.y = game.player.y - CONFIG.canvas.height / 2;

    game.camera.x = Math.max(0, Math.min(CONFIG.world.width - CONFIG.canvas.width, game.camera.x));
    game.camera.y = Math.max(0, Math.min(CONFIG.world.height - CONFIG.canvas.height, game.camera.y));
}

// 武器攻击更新
function updateWeaponAttacks() {
    const now = Date.now();
    const player = game.player;

    player.weapons.forEach(weapon => {
        if (!weapon.lastAttackTime) weapon.lastAttackTime = 0;

        let cooldown = 1000;
        switch(weapon.id) {
            case 'dagger': case 'shadowBlade': cooldown = 400; break;
            case 'sword': case 'holyBlade': cooldown = 800; break;
            case 'axe': case 'bloodAxe': cooldown = 1200; break;
            case 'bow': case 'phoenixBow': cooldown = 600; break;
            case 'staff': case 'arcaneStaff': cooldown = 900; break;
            case 'fireball': case 'inferno': cooldown = 1100; break;
        }
        cooldown *= (player.attackCooldown / 500);

        if (now - weapon.lastAttackTime < cooldown) return;

        const nearestEnemy = game.enemies.reduce((closest, enemy) => {
            const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
            return dist < closest.dist ? { enemy, dist } : closest;
        }, { enemy: null, dist: Infinity });

        let attackRange = weapon.type === 'melee' ? 100 : (weapon.type === 'evolved' ? 350 : 300);

        if (nearestEnemy.enemy && nearestEnemy.dist < attackRange) {
            game.weaponProjectiles.push(new WeaponProjectile(
                player.x, player.y,
                nearestEnemy.enemy.x, nearestEnemy.enemy.y,
                weapon, player
            ));
            weapon.lastAttackTime = now;
        }
    });
}

// 更新武器投射物
function updateWeaponProjectiles() {
    game.weaponProjectiles.forEach(proj => {
        proj.update();
        game.enemies.forEach(enemy => {
            if (proj.checkHit(enemy)) {
                let damage = proj.damage;
                if (Math.random() < game.player.critChance) {
                    damage *= game.player.critDamage;
                }
                if (proj.weapon.id === 'shadowBlade' && Math.random() < 0.3) {
                    damage *= 2;
                }
                if (proj.weapon.id === 'bloodAxe') {
                    game.player.health = Math.min(game.player.health + damage * 0.1, game.player.maxHealth);
                }
                enemy.health -= damage;
                for (let i = 0; i < 2; i++) {
                    game.particles.push(new Particle(enemy.x, enemy.y, '#fff'));
                }
                if (enemy.health <= 0) {
                    game.player.gainExp(enemy.expValue);
                    game.killCount++;
                    if (game.player.vampireHeal > 0) {
                        game.player.health = Math.min(game.player.health + game.player.vampireHeal, game.player.maxHealth);
                    }
                }
            }
        });
    });
    game.weaponProjectiles = game.weaponProjectiles.filter(p => !p.isDead());
}

// 绘制小地图
function drawMinimap() {
    const minimapSize = 150;
    const minimapX = CONFIG.canvas.width - minimapSize - 20;
    const minimapY = 20;
    const scaleX = minimapSize / CONFIG.world.width;
    const scaleY = minimapSize / CONFIG.world.height;

    game.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    game.ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);

    game.ctx.strokeStyle = '#fff';
    game.ctx.lineWidth = 2;
    game.ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize);

    const playerMinimapX = minimapX + game.player.x * scaleX;
    const playerMinimapY = minimapY + game.player.y * scaleY;

    game.ctx.fillStyle = game.player.color;
    game.ctx.beginPath();
    game.ctx.arc(playerMinimapX, playerMinimapY, 3, 0, Math.PI * 2);
    game.ctx.fill();

    game.enemies.forEach(enemy => {
        const enemyMinimapX = minimapX + enemy.x * scaleX;
        const enemyMinimapY = minimapY + enemy.y * scaleY;

        game.ctx.fillStyle = enemy.color;
        game.ctx.fillRect(enemyMinimapX - 1, enemyMinimapY - 1, 2, 2);
    });

    const viewX = minimapX + game.camera.x * scaleX;
    const viewY = minimapY + game.camera.y * scaleY;
    const viewW = CONFIG.canvas.width * scaleX;
    const viewH = CONFIG.canvas.height * scaleY;

    game.ctx.strokeStyle = '#00ff00';
    game.ctx.lineWidth = 1;
    game.ctx.strokeRect(viewX, viewY, viewW, viewH);
}

// 游戏结束
function gameOver() {
    game.state = 'gameover';
    document.getElementById('finalTime').textContent = Math.floor(game.gameTime);
    document.getElementById('finalKills').textContent = game.killCount;
    document.getElementById('finalLevel').textContent = game.player.level;
    document.getElementById('finalWave').textContent = game.wave.current;
    document.getElementById('gameOverScreen').classList.remove('hidden');
    clearSaveData();
}

// 游戏循环
function gameLoop(timestamp) {
    // 暂停时不更新
    if (game.state === 'paused') {
        requestAnimationFrame(gameLoop);
        return;
    }

    if (!game.lastTime) game.lastTime = timestamp;
    const deltaTime = timestamp - game.lastTime;
    game.lastTime = timestamp;

    if (game.state === 'playing') {
        game.gameTime += deltaTime / 1000;

        // 更新
        game.player.update(deltaTime);

        game.enemies.forEach(enemy => enemy.update());
        game.particles.forEach(particle => particle.update());
        game.projectiles.forEach(projectile => projectile.update());
        game.summons.forEach(summon => summon.update());

        // 投射物击中检测
        game.projectiles.forEach(projectile => {
            game.enemies.forEach(enemy => {
                const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
                if (dist < enemy.size && !projectile.hit) {
                    enemy.health -= projectile.damage;
                    projectile.hit = true;

                    for (let i = 0; i < 2; i++) {
                        game.particles.push(new Particle(enemy.x, enemy.y, projectile.color));
                    }

                    if (enemy.health <= 0) {
                        game.player.gainExp(enemy.expValue);
                        game.killCount++;

                        for (let i = 0; i < 6; i++) {
                            game.particles.push(new Particle(enemy.x, enemy.y, enemy.color));
                        }

                        if (game.player.vampireHeal > 0) {
                            game.player.health = Math.min(game.player.health + game.player.vampireHeal, game.player.maxHealth);
                        }
                    }
                }
            });
        });

        // 移除死亡的敌人、粒子和投射物
        game.enemies = game.enemies.filter(enemy => enemy.health > 0);
        game.particles = game.particles.filter(particle => !particle.isDead());
        game.projectiles = game.projectiles.filter(p => !p.isDead() && !p.hit);
        game.summons = game.summons.filter(summon => !summon.isDead());

        // 清理距离玩家太远的敌人
        game.enemies = game.enemies.filter(enemy => {
            const dist = Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y);
            return dist < Math.max(CONFIG.canvas.width, CONFIG.canvas.height) * 2;
        });

        // 波次系统更新
        updateWaveSpawning();
        checkWaveComplete();

        // 武器自动攻击
        updateWeaponAttacks();

        // 更新武器投射物
        updateWeaponProjectiles();

        // 更新UI
        updateUI();
    }

    // 绘制
    if (game.state === 'playing' || game.state === 'levelup' || game.state === 'waveComplete' || game.state === 'paused') {
        game.ctx.fillStyle = '#1a1a2e';
        game.ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

        game.ctx.save();
        game.ctx.translate(-game.camera.x, -game.camera.y);

        // 绘制世界网格背景
        game.ctx.strokeStyle = '#2a2a3e';
        game.ctx.lineWidth = 1;

        const startX = Math.floor(game.camera.x / 50) * 50;
        const startY = Math.floor(game.camera.y / 50) * 50;
        const endX = Math.ceil((game.camera.x + CONFIG.canvas.width) / 50) * 50;
        const endY = Math.ceil((game.camera.y + CONFIG.canvas.height) / 50) * 50;

        for (let x = startX; x <= endX; x += 50) {
            game.ctx.beginPath();
            game.ctx.moveTo(x, startY);
            game.ctx.lineTo(x, endY);
            game.ctx.stroke();
        }
        for (let y = startY; y <= endY; y += 50) {
            game.ctx.beginPath();
            game.ctx.moveTo(startX, y);
            game.ctx.lineTo(endX, y);
            game.ctx.stroke();
        }

        // 绘制世界边界
        game.ctx.strokeStyle = '#ff4757';
        game.ctx.lineWidth = 5;
        game.ctx.strokeRect(0, 0, CONFIG.world.width, CONFIG.world.height);

        // 只绘制可见区域内的障碍物
        const visibleObstacles = game.obstacles.filter(obstacle => {
            return obstacle.x > game.camera.x - 100 &&
                   obstacle.x < game.camera.x + CONFIG.canvas.width + 100 &&
                   obstacle.y > game.camera.y - 100 &&
                   obstacle.y < game.camera.y + CONFIG.canvas.height + 100;
        });

        visibleObstacles.filter(o => o.type === 'bush').forEach(obstacle => obstacle.draw(game.ctx));
        visibleObstacles.filter(o => o.type === 'rock').forEach(obstacle => obstacle.draw(game.ctx));

        game.particles.forEach(particle => particle.draw(game.ctx));
        game.projectiles.forEach(projectile => projectile.draw(game.ctx));
        game.weaponProjectiles.forEach(projectile => projectile.draw(game.ctx));
        game.summons.forEach(summon => summon.draw(game.ctx));
        game.enemies.forEach(enemy => enemy.draw(game.ctx));
        game.player.draw(game.ctx);

        game.ctx.restore();

        drawMinimap();
    }

    requestAnimationFrame(gameLoop);
}

// 自适应屏幕大小
function resizeCanvas() {
    const container = document.getElementById('gameScreen');
    const ui = document.getElementById('ui');

    const padding = 40;
    const uiHeight = ui ? ui.offsetHeight + 30 : 100;

    let availableWidth = window.innerWidth - padding * 2;
    let availableHeight = window.innerHeight - uiHeight - padding * 2;

    const minWidth = 800;
    const minHeight = 500;
    const maxWidth = 1920;
    const maxHeight = 1080;
    const aspectRatio = 16 / 10;

    let canvasWidth = Math.max(minWidth, Math.min(maxWidth, availableWidth));
    let canvasHeight = canvasWidth / aspectRatio;

    if (canvasHeight > availableHeight) {
        canvasHeight = Math.max(minHeight, Math.min(maxHeight, availableHeight));
        canvasWidth = canvasHeight * aspectRatio;
    }

    if (canvasWidth > availableWidth) {
        canvasWidth = availableWidth;
        canvasHeight = canvasWidth / aspectRatio;
    }

    canvasWidth = Math.floor(canvasWidth);
    canvasHeight = Math.floor(canvasHeight);

    CONFIG.canvas.width = canvasWidth;
    CONFIG.canvas.height = canvasHeight;

    if (game.canvas) {
        game.canvas.width = canvasWidth;
        game.canvas.height = canvasHeight;
    }

    if (ui) {
        ui.style.minWidth = canvasWidth + 'px';
        ui.style.maxWidth = canvasWidth + 'px';
    }

    console.log(`Canvas resized to: ${canvasWidth}x${canvasHeight}`);
}

// 暂停游戏
function pauseGame() {
    if (game.state !== 'playing') return;
    game.state = 'paused';
    document.getElementById('pauseScreen').classList.remove('hidden');
}

// 继续游戏
function resumeGame() {
    game.state = 'playing';
    document.getElementById('pauseScreen').classList.add('hidden');
    game.lastTime = 0;
    requestAnimationFrame(gameLoop);
}

// 重新开始当前波
function restartCurrentWave() {
    document.getElementById('pauseScreen').classList.add('hidden');

    game.enemies = [];
    game.particles = [];
    game.projectiles = [];
    game.weaponProjectiles = [];
    game.summons = [];

    game.wave.enemiesSpawned = 0;
    game.wave.totalEnemies = 0;
    game.wave.lastSpawnTime = 0;
    game.wave.isSpawning = false;
    game.wave.eliteSpawned = false;
    game.wave.bossSpawned = false;
    game.wave.inBreak = false;

    game.player.x = CONFIG.world.width / 2;
    game.player.y = CONFIG.world.height / 2;

    game.player.health = Math.min(game.player.health + game.player.maxHealth * 0.3, game.player.maxHealth);

    game.state = 'playing';
    game.lastTime = 0;

    startNewWave();
    // 注意：不需要再调用requestAnimationFrame，游戏循环已经在运行中
}

// 返回主菜单
function returnToMenu() {
    location.reload();
}

// 开始游戏
function startGame() {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');

    // 重置UI缓存
    resetUICache();

    // 生成障碍物
    generateObstacles();

    game.player = new Player(game.selectedClass);
    game.enemies = [];
    game.particles = [];
    game.projectiles = [];
    game.weaponProjectiles = [];
    game.summons = [];
    game.killCount = 0;
    game.gameTime = 0;
    game.lastTime = 0;
    game.state = 'playing';

    // 初始化波次系统
    game.wave = {
        current: 1,
        enemiesRemaining: 0,
        enemiesSpawned: 0,
        totalEnemies: 0,
        lastSpawnTime: 0,
        isSpawning: false,
        eliteSpawned: false,
        bossSpawned: false,
        waveStartTime: 0,
        inBreak: false
    };

    // 开始第一波
    startNewWave();

    // 启动游戏循环
    requestAnimationFrame(gameLoop);
}

// 初始化游戏
function initGame() {
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');

    // 自适应屏幕大小
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 检查是否有存档
    checkSaveData();

    // 键盘事件
    window.addEventListener('keydown', (e) => {
        game.keys[e.key] = true;
        if (e.key === 'Escape' && game.state === 'playing') {
            pauseGame();
        }
    });

    window.addEventListener('keyup', (e) => {
        game.keys[e.key] = false;
    });

    // 新游戏按钮
    document.getElementById('newGameBtn').addEventListener('click', () => {
        showSaveSlotScreen('newgame');
    });

    // 读取存档按钮
    document.getElementById('loadGameBtn').addEventListener('click', () => {
        loadGame();
    });

    // 存档覆盖确认
    document.getElementById('overwriteYes').addEventListener('click', () => {
        document.getElementById('overwriteModal').classList.add('hidden');
        const mode = game.saveSlotMode;
        const slotIndex = game.pendingSaveSlot;

        if (mode === 'newgame') {
            clearSaveData(slotIndex);
            game.currentSaveSlot = slotIndex;
            hideSaveSlotScreen();
            showClassSelection();
        } else if (mode === 'save') {
            saveGameToSlot(slotIndex);
            showSaveNotification();
            hideSaveSlotScreen();
            document.getElementById('gameScreen').classList.remove('hidden');
            resumeGame();
        }
    });

    document.getElementById('overwriteNo').addEventListener('click', () => {
        document.getElementById('overwriteModal').classList.add('hidden');
    });

    // 存档位界面返回按钮
    document.getElementById('saveSlotBackBtn').addEventListener('click', backToStartScreen);

    // 职业选择
    document.querySelectorAll('.class-card').forEach(card => {
        card.addEventListener('click', () => {
            game.selectedClass = card.dataset.class;
            startGame();
        });
    });

    // 暂停按钮
    document.getElementById('pauseBtn').addEventListener('click', pauseGame);

    // 继续游戏按钮
    document.getElementById('resumeBtn').addEventListener('click', resumeGame);

    // 保存按钮
    document.getElementById('saveBtn').addEventListener('click', () => {
        if (game.currentSaveSlot) {
            saveGame();
            showSaveNotification();
        } else {
            pauseGame();
            document.getElementById('pauseScreen').classList.add('hidden');
            showSaveSlotScreen('save');
        }
    });

    // 暂停界面-保存并退出
    document.getElementById('pauseSaveBtn').addEventListener('click', () => {
        if (game.currentSaveSlot) {
            saveGame();
            returnToMenu();
        } else {
            document.getElementById('pauseScreen').classList.add('hidden');
            showSaveSlotScreen('save');
        }
    });

    // 暂停界面-重新开始本波
    document.getElementById('pauseRestartWaveBtn').addEventListener('click', restartCurrentWave);

    // 暂停界面-返回主菜单
    document.getElementById('pauseReturnMenuBtn').addEventListener('click', returnToMenu);

    // 重新开始按钮
    document.getElementById('restartBtn').addEventListener('click', () => {
        location.reload();
    });

    // 返回主菜单
    document.getElementById('returnMenuBtn').addEventListener('click', returnToMenu);

    // 游戏内重新开始按钮
    document.getElementById('inGameRestartBtn').addEventListener('click', () => {
        restartCurrentWave();
    });

    // 武器详情弹窗关闭
    document.querySelector('#weaponDetailModal .modal-close').addEventListener('click', () => {
        document.getElementById('weaponDetailModal').classList.add('hidden');
    });
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', initGame);
