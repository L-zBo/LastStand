// ==================== 游戏主逻辑 ====================

// 游戏状态
let game = {
    state: 'start',
    canvas: null,
    ctx: null,
    player: null,
    player2: null,  // 第二个玩家
    playerCount: 1, // 玩家数量
    selectedClass: null,
    selectedClass2: null, // P2职业
    selectedDifficulty: 'normal', // 选择的难度
    selectedMap: 'forest',        // 选择的地图
    difficultyMod: null,          // 难度修正
    mapConfig: null,              // 地图配置
    enemies: [],
    particles: [],
    projectiles: [],
    weaponProjectiles: [],
    summons: [],
    obstacles: [],
    droppedItems: [],  // 掉落物数组
    keys: {},
    lastTime: 0,
    gameTime: 0,
    killCount: 0,
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

    // 使用地图配置的障碍物数量
    const mapConfig = game.mapConfig || CONFIG.maps.forest;
    const rockCount = mapConfig.rockCount || CONFIG.obstacles.rockCount;
    const bushCount = mapConfig.bushCount || CONFIG.obstacles.bushCount;
    const treeCount = mapConfig.treeCount || CONFIG.obstacles.treeCount || 30;

    // 生成树木（先生成，作为主要装饰）
    for (let i = 0; i < treeCount; i++) {
        const x = Math.random() * (CONFIG.world.width - 200) + 100;
        const y = Math.random() * (CONFIG.world.height - 200) + 100;

        // 避免在玩家出生点附近生成
        const distFromCenter = Math.hypot(x - CONFIG.world.width / 2, y - CONFIG.world.height / 2);
        if (distFromCenter > 300) {
            game.obstacles.push(new Obstacle(x, y, 'tree'));
        }
    }

    // 生成石头
    for (let i = 0; i < rockCount; i++) {
        const x = Math.random() * (CONFIG.world.width - 100) + 50;
        const y = Math.random() * (CONFIG.world.height - 100) + 50;

        const distFromCenter = Math.hypot(x - CONFIG.world.width / 2, y - CONFIG.world.height / 2);
        if (distFromCenter > 200) {
            game.obstacles.push(new Obstacle(x, y, 'rock'));
        }
    }

    // 生成草丛
    for (let i = 0; i < bushCount; i++) {
        const x = Math.random() * (CONFIG.world.width - 100) + 50;
        const y = Math.random() * (CONFIG.world.height - 100) + 50;

        game.obstacles.push(new Obstacle(x, y, 'bush'));
    }
}

// 更新摄像机位置
function updateCamera() {
    let targetX, targetY;

    if (game.playerCount === 2 && game.player2 && game.player2.health > 0) {
        // 双人模式：追踪两个玩家的中心点
        targetX = (game.player.x + game.player2.x) / 2;
        targetY = (game.player.y + game.player2.y) / 2;
    } else {
        // 单人模式或P2已死亡：追踪P1
        targetX = game.player.x;
        targetY = game.player.y;
    }

    game.camera.x = targetX - CONFIG.canvas.width / 2;
    game.camera.y = targetY - CONFIG.canvas.height / 2;

    game.camera.x = Math.max(0, Math.min(CONFIG.world.width - CONFIG.canvas.width, game.camera.x));
    game.camera.y = Math.max(0, Math.min(CONFIG.world.height - CONFIG.canvas.height, game.camera.y));
}

// 武器攻击更新（支持指定玩家）
function updateWeaponAttacksForPlayer(player) {
    const now = Date.now();

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

// 武器攻击更新（所有玩家）
function updateWeaponAttacks() {
    updateWeaponAttacksForPlayer(game.player);
    if (game.playerCount === 2 && game.player2 && game.player2.health > 0) {
        updateWeaponAttacksForPlayer(game.player2);
    }
}

// 更新武器投射物
function updateWeaponProjectiles() {
    game.weaponProjectiles.forEach(proj => {
        proj.update();
        game.enemies.forEach(enemy => {
            if (proj.checkHit(enemy)) {
                const owner = proj.player;
                let damage = proj.damage;

                // 暴击判定
                if (Math.random() < owner.critChance) {
                    damage *= owner.critDamage;
                }

                // 暗影刀片特效
                if (proj.weapon.id === 'shadowBlade' && Math.random() < 0.3) {
                    damage *= 2;
                }

                // 嗜血斧头吸血
                if (proj.weapon.id === 'bloodAxe') {
                    owner.health = Math.min(owner.health + damage * 0.1, owner.maxHealth);
                }

                // 死亡诅咒效果（增伤）
                if (enemy.cursed && enemy.curseMultiplier) {
                    damage *= enemy.curseMultiplier;
                }

                enemy.health -= damage;

                for (let i = 0; i < 2; i++) {
                    game.particles.push(new Particle(enemy.x, enemy.y, '#fff'));
                }

                if (enemy.health <= 0) {
                    owner.gainExp(enemy.expValue);
                    game.killCount++;

                    // 生成掉落物
                    const drops = spawnDrops(enemy.x, enemy.y, enemy.type);
                    console.log('[主循环] 武器投射物击杀 - 添加掉落物:', drops.length, '当前总数:', game.droppedItems.length);
                    game.droppedItems.push(...drops);

                    // 吸血效果
                    if (owner.vampireHeal > 0) {
                        owner.health = Math.min(owner.health + owner.vampireHeal, owner.maxHealth);
                    }

                    // 死灵法师尸爆效果
                    if (owner.corpseExplosion) {
                        const explosionRadius = 80;
                        const explosionDamage = owner.attack * 0.5;
                        game.enemies.forEach(nearbyEnemy => {
                            if (nearbyEnemy !== enemy && nearbyEnemy.health > 0) {
                                const dist = Math.hypot(nearbyEnemy.x - enemy.x, nearbyEnemy.y - enemy.y);
                                if (dist < explosionRadius) {
                                    nearbyEnemy.health -= explosionDamage;
                                    game.particles.push(new Particle(nearbyEnemy.x, nearbyEnemy.y, '#4a0080'));
                                }
                            }
                        });
                        // 尸爆特效
                        for (let i = 0; i < 8; i++) {
                            game.particles.push(new Particle(enemy.x, enemy.y, '#9b59b6'));
                        }
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

    // P1在小地图上
    const playerMinimapX = minimapX + game.player.x * scaleX;
    const playerMinimapY = minimapY + game.player.y * scaleY;
    game.ctx.fillStyle = game.player.color;
    game.ctx.beginPath();
    game.ctx.arc(playerMinimapX, playerMinimapY, 3, 0, Math.PI * 2);
    game.ctx.fill();

    // P2在小地图上
    if (game.playerCount === 2 && game.player2 && game.player2.health > 0) {
        const p2MinimapX = minimapX + game.player2.x * scaleX;
        const p2MinimapY = minimapY + game.player2.y * scaleY;
        game.ctx.fillStyle = game.player2.color;
        game.ctx.beginPath();
        game.ctx.arc(p2MinimapX, p2MinimapY, 3, 0, Math.PI * 2);
        game.ctx.fill();
    }

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
    // 显示最高等级的玩家
    let finalLevel = game.player.level;
    let finalGold = game.player.gold;
    if (game.playerCount === 2 && game.player2) {
        finalLevel = Math.max(game.player.level, game.player2.level);
        finalGold = Math.max(game.player.gold, game.player2.gold);
    }
    document.getElementById('finalLevel').textContent = finalLevel;
    document.getElementById('finalWave').textContent = game.wave.current;
    document.getElementById('finalGold').textContent = finalGold;
    document.getElementById('gameOverScreen').classList.remove('hidden');
    clearSaveData();
}

// 检查游戏是否结束
function checkGameOver() {
    if (game.playerCount === 1) {
        if (game.player.health <= 0) {
            gameOver();
            return true;
        }
    } else {
        // 双人模式：两个玩家都死亡才结束
        if (game.player.health <= 0 && (!game.player2 || game.player2.health <= 0)) {
            gameOver();
            return true;
        }
    }
    return false;
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

        // 更新P1
        game.player.update(deltaTime);

        // 更新P2
        if (game.playerCount === 2 && game.player2 && game.player2.health > 0) {
            game.player2.update(deltaTime);
        }

        game.enemies.forEach(enemy => enemy.update());
        game.particles.forEach(particle => particle.update());
        game.projectiles.forEach(projectile => projectile.update());
        game.summons.forEach(summon => summon.update());
        game.droppedItems.forEach(item => item.update());

        // 每秒输出一次掉落物状态（调试用）
        if (Math.floor(game.gameTime) !== Math.floor(game.gameTime - deltaTime / 1000)) {
            if (game.droppedItems.length > 0) {
                console.log('[游戏状态] 当前掉落物数量:', game.droppedItems.length);
            }
        }

        // 投射物击中检测
        game.projectiles.forEach(projectile => {
            game.enemies.forEach(enemy => {
                const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
                if (dist < enemy.size && !projectile.hit) {
                    let damage = projectile.damage;

                    // 应用诅咒效果
                    if (enemy.cursed && enemy.curseMultiplier) {
                        damage *= enemy.curseMultiplier;
                    }

                    enemy.health -= damage;
                    projectile.hit = true;

                    // 生命汲取效果（死灵法师）
                    const owner = projectile.owner || game.player;
                    if (owner.lifeSteal) {
                        const healAmount = damage * owner.lifeSteal;
                        owner.health = Math.min(owner.health + healAmount, owner.maxHealth);
                    }

                    for (let i = 0; i < 2; i++) {
                        game.particles.push(new Particle(enemy.x, enemy.y, projectile.color));
                    }

                    if (enemy.health <= 0) {
                        // 经验给投射物的所有者
                        owner.gainExp(enemy.expValue);
                        game.killCount++;

                        // 生成掉落物
                        const drops = spawnDrops(enemy.x, enemy.y, enemy.type);
                        console.log('[主循环] 投射物击杀 - 添加掉落物:', drops.length, '当前总数:', game.droppedItems.length);
                        game.droppedItems.push(...drops);

                        for (let i = 0; i < 6; i++) {
                            game.particles.push(new Particle(enemy.x, enemy.y, enemy.color));
                        }

                        if (owner.vampireHeal > 0) {
                            owner.health = Math.min(owner.health + owner.vampireHeal, owner.maxHealth);
                        }

                        // 死灵法师尸爆效果
                        if (owner.corpseExplosion) {
                            const explosionRadius = 80;
                            const explosionDamage = owner.attack * 0.5;
                            game.enemies.forEach(nearbyEnemy => {
                                if (nearbyEnemy !== enemy && nearbyEnemy.health > 0) {
                                    const d = Math.hypot(nearbyEnemy.x - enemy.x, nearbyEnemy.y - enemy.y);
                                    if (d < explosionRadius) {
                                        nearbyEnemy.health -= explosionDamage;
                                        game.particles.push(new Particle(nearbyEnemy.x, nearbyEnemy.y, '#4a0080'));
                                    }
                                }
                            });
                            for (let i = 0; i < 8; i++) {
                                game.particles.push(new Particle(enemy.x, enemy.y, '#9b59b6'));
                            }
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
        game.droppedItems = game.droppedItems.filter(item => !item.isDead());

        // 清理距离玩家太远的敌人（考虑双人模式）
        game.enemies = game.enemies.filter(enemy => {
            const distP1 = Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y);
            let minDist = distP1;
            if (game.playerCount === 2 && game.player2 && game.player2.health > 0) {
                const distP2 = Math.hypot(enemy.x - game.player2.x, enemy.y - game.player2.y);
                minDist = Math.min(distP1, distP2);
            }
            return minDist < Math.max(CONFIG.canvas.width, CONFIG.canvas.height) * 2;
        });

        // 检查游戏结束
        if (checkGameOver()) {
            requestAnimationFrame(gameLoop);
            return;
        }

        // 波次系统更新
        updateWaveSpawning();
        checkWaveComplete();

        // 武器自动攻击
        updateWeaponAttacks();

        // 更新武器投射物
        updateWeaponProjectiles();

        // 更新摄像机
        updateCamera();

        // 更新UI
        updateUI();
    }

    // 绘制
    if (game.state === 'playing' || game.state === 'levelup' || game.state === 'waveComplete' || game.state === 'paused') {
        game.ctx.fillStyle = '#1a1a2e';
        game.ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

        game.ctx.save();
        game.ctx.translate(-game.camera.x, -game.camera.y);

        // 绘制地图背景（使用瓦片图片）
        const mapConfig = game.mapConfig || CONFIG.maps.forest;
        const tileImage = mapTileImages[game.selectedMap || 'forest'];

        if (tileImage) {
            // 使用瓦片图片平铺背景
            game.ctx.imageSmoothingEnabled = false;
            const tileSize = 64;
            const startTileX = Math.floor(game.camera.x / tileSize);
            const startTileY = Math.floor(game.camera.y / tileSize);
            const endTileX = Math.ceil((game.camera.x + CONFIG.canvas.width) / tileSize) + 1;
            const endTileY = Math.ceil((game.camera.y + CONFIG.canvas.height) / tileSize) + 1;

            for (let ty = startTileY; ty <= endTileY; ty++) {
                for (let tx = startTileX; tx <= endTileX; tx++) {
                    const drawX = tx * tileSize;
                    const drawY = ty * tileSize;
                    if (drawX >= 0 && drawX < CONFIG.world.width && drawY >= 0 && drawY < CONFIG.world.height) {
                        game.ctx.drawImage(tileImage, drawX, drawY, tileSize, tileSize);
                    }
                }
            }
        } else {
            // 回退到渐变背景
            const bgGradient = game.ctx.createLinearGradient(0, 0, 0, CONFIG.world.height);
            bgGradient.addColorStop(0, mapConfig.backgroundColor);
            bgGradient.addColorStop(1, mapConfig.groundColor);
            game.ctx.fillStyle = bgGradient;
            game.ctx.fillRect(0, 0, CONFIG.world.width, CONFIG.world.height);
        }

        // 绘制世界边界
        game.ctx.strokeStyle = mapConfig.borderColor;
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

        // 绘制掉落物
        game.droppedItems.forEach(item => item.draw(game.ctx));

        game.particles.forEach(particle => particle.draw(game.ctx));
        game.projectiles.forEach(projectile => projectile.draw(game.ctx));
        game.weaponProjectiles.forEach(projectile => projectile.draw(game.ctx));
        game.summons.forEach(summon => summon.draw(game.ctx));
        game.enemies.forEach(enemy => enemy.draw(game.ctx));

        // 绘制P1
        game.player.draw(game.ctx);

        // 绘制P2
        if (game.playerCount === 2 && game.player2 && game.player2.health > 0) {
            game.player2.draw(game.ctx);
        }

        game.ctx.restore();

        drawMinimap();
    }

    requestAnimationFrame(gameLoop);
}

// 自适应屏幕大小
function resizeCanvas() {
    const gameScreen = document.getElementById('gameScreen');
    const topBar = document.querySelector('.top-bar');
    const p1Panel = document.getElementById('p1Panel');
    const p2Panel = document.getElementById('p2Panel');

    const padding = 20;
    const topBarHeight = topBar ? topBar.offsetHeight + 10 : 50;
    const panelWidth = p1Panel ? p1Panel.offsetWidth : 220;
    const p2Visible = p2Panel && !p2Panel.classList.contains('hidden');

    // 计算可用空间
    let availableWidth = window.innerWidth - padding * 2 - panelWidth - (p2Visible ? panelWidth : 0) - 30;
    let availableHeight = window.innerHeight - topBarHeight - padding * 2;

    const minWidth = 600;
    const minHeight = 400;
    const maxWidth = 1600;
    const maxHeight = 900;
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
    if (game.state !== 'paused') return;
    game.state = 'playing';
    document.getElementById('pauseScreen').classList.add('hidden');
    // 重置lastTime以避免大的deltaTime跳跃
    game.lastTime = 0;
    // 注意：不需要调用requestAnimationFrame，游戏循环一直在运行
}

// 重新开始当前波
function restartCurrentWave() {
    document.getElementById('pauseScreen').classList.add('hidden');

    game.enemies = [];
    game.particles = [];
    game.projectiles = [];
    game.weaponProjectiles = [];
    game.summons = [];
    game.droppedItems = [];

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
    document.getElementById('mapSelection').classList.add('hidden');
    document.getElementById('difficultySelection').classList.add('hidden');
    document.getElementById('classSelection').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');

    // 应用默认配置（如果没有选择）
    if (!game.difficultyMod) {
        game.difficultyMod = CONFIG.difficulty.normal;
    }
    if (!game.mapConfig) {
        game.mapConfig = CONFIG.maps.forest;
    }

    // 重置UI缓存
    resetUICache();

    // 生成障碍物
    generateObstacles();

    // 创建P1
    game.player = new Player(game.selectedClass, 1);

    // 设置P1职业名称显示
    const classNames = {
        warrior: '战士', mage: '法师', assassin: '刺客',
        ranger: '游侠', summoner: '召唤师',
        knight: '骑士', paladin: '圣骑士', necromancer: '死灵法师'
    };
    document.getElementById('p1ClassName').textContent = classNames[game.selectedClass] || game.selectedClass;

    // 双人模式创建P2
    if (game.playerCount === 2 && game.selectedClass2) {
        game.player2 = new Player(game.selectedClass2, 2);
        document.getElementById('p2Panel').classList.remove('hidden');
        document.getElementById('p2ClassName').textContent = classNames[game.selectedClass2] || game.selectedClass2;
    } else {
        game.player2 = null;
        document.getElementById('p2Panel').classList.add('hidden');
    }

    game.enemies = [];
    game.particles = [];
    game.projectiles = [];
    game.weaponProjectiles = [];
    game.summons = [];
    game.droppedItems = [];
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
        // ESC键：暂停/继续游戏
        if (e.key === 'Escape') {
            if (game.state === 'playing') {
                pauseGame();
            } else if (game.state === 'paused') {
                resumeGame();
            }
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

    // 人数选择按钮
    document.querySelectorAll('.player-count-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            game.playerCount = parseInt(btn.dataset.count);
            document.getElementById('playerCountSelection').classList.add('hidden');

            if (game.playerCount === 1) {
                // 单人模式：直接显示职业选择
                document.getElementById('classSelectionTitle').textContent = '选择你的职业';
                document.getElementById('classSelection').classList.remove('hidden');
            } else {
                // 双人模式：先选P1职业
                document.getElementById('classSelectionTitle').textContent = 'P1 选择职业 (WASD控制)';
                document.getElementById('classSelection').classList.remove('hidden');
            }
        });
    });

    // 职业选择
    document.querySelectorAll('.class-card').forEach(card => {
        card.addEventListener('click', () => {
            if (game.playerCount === 1) {
                // 单人模式
                game.selectedClass = card.dataset.class;
                document.getElementById('classSelection').classList.add('hidden');
                // 显示难度选择
                document.getElementById('difficultySelection').classList.remove('hidden');
            } else {
                // 双人模式
                if (!game.selectedClass) {
                    // P1选择职业
                    game.selectedClass = card.dataset.class;
                    document.getElementById('classSelectionTitle').textContent = 'P2 选择职业 (方向键控制)';
                    // 添加已选中效果
                    document.querySelectorAll('.class-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                } else {
                    // P2选择职业
                    game.selectedClass2 = card.dataset.class;
                    document.getElementById('classSelection').classList.add('hidden');
                    // 显示难度选择
                    document.getElementById('difficultySelection').classList.remove('hidden');
                }
            }
        });
    });

    // 难度选择
    document.querySelectorAll('.difficulty-card').forEach(card => {
        card.addEventListener('click', () => {
            // 移除其他选中状态
            document.querySelectorAll('.difficulty-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            game.selectedDifficulty = card.dataset.difficulty;

            // 延迟后显示地图选择
            setTimeout(() => {
                document.getElementById('difficultySelection').classList.add('hidden');
                document.getElementById('mapSelection').classList.remove('hidden');
            }, 200);
        });
    });

    // 地图选择
    document.querySelectorAll('.map-card').forEach(card => {
        card.addEventListener('click', () => {
            // 移除其他选中状态
            document.querySelectorAll('.map-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            game.selectedMap = card.dataset.map;
        });
    });

    // 开始游戏按钮
    document.getElementById('startGameBtn').addEventListener('click', () => {
        // 应用难度和地图配置
        game.difficultyMod = CONFIG.difficulty[game.selectedDifficulty];
        game.mapConfig = CONFIG.maps[game.selectedMap];
        startGame();
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

    // 暂停按钮（顶部栏）
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            if (game.state === 'playing') {
                pauseGame();
            } else if (game.state === 'paused') {
                resumeGame();
            }
        });
    }

    // 武器详情弹窗关闭
    document.querySelector('#weaponDetailModal .modal-close').addEventListener('click', () => {
        document.getElementById('weaponDetailModal').classList.add('hidden');
    });
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    // 预加载精灵图资源
    preloadAssets(() => {
        // 预加载环境素材（草丛和石头）
        preloadEnvironmentAssets(() => {
            console.log('Assets loaded, initializing game...');
            initGame();
        });
    });
});
