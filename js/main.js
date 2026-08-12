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
    enemyProjectiles: [],  // 敌人投射物数组
    damageNumbers: [],  // 伤害飘字数组
    keys: {},
    lastTime: 0,
    gameTime: 0,
    killCount: 0,
    // 成就统计。这三个字段原本只在 gameOver 里被读（game.bossKills || 0），
    // 全项目没有任何地方给它们赋值，导致 firstBoss / boss10 / boss50 /
    // killDragon / noDamage 五个成就永远解不开。现在在击杀与波次结算时真正维护。
    bossKills: 0,
    dragonKills: 0,
    perfectWaves: 0,
    tookDamageThisWave: false,
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
    },
    // 游戏内计时器（暂停时自动停止）
    timers: [],
    // gameLoop是否已启动
    loopRunning: false
};

// 添加游戏内计时器（替代setTimeout，暂停时自动暂停）
function addGameTimer(callback, delayMs) {
    const timer = { remaining: delayMs, callback: callback };
    game.timers.push(timer);
    return timer;
}

// 更新所有游戏内计时器
function updateGameTimers(deltaTime) {
    for (let i = game.timers.length - 1; i >= 0; i--) {
        game.timers[i].remaining -= deltaTime;
        if (game.timers[i].remaining <= 0) {
            game.timers[i].callback();
            game.timers.splice(i, 1);
        }
    }
}

// ==================== 屏幕震动系统 ====================
const ScreenFX = {
    // 屏幕震动
    shakeIntensity: 0,
    shakeDuration: 0,
    shakeTime: 0,
    shakeOffsetX: 0,
    shakeOffsetY: 0,

    // 受击闪烁（屏幕边缘红色叠加）
    hitFlashAlpha: 0,

    // 触发屏幕震动
    shake(intensity, duration) {
        // 取较大的震动值，不会被弱震动覆盖强震动
        if (intensity > this.shakeIntensity) {
            this.shakeIntensity = intensity;
            this.shakeDuration = duration || 200;
            this.shakeTime = 0;
        }
    },

    // 触发受击闪烁
    hitFlash(alpha) {
        this.hitFlashAlpha = Math.max(this.hitFlashAlpha, alpha || 0.3);
    },

    // 每帧更新
    update(deltaTime) {
        // 更新震动
        if (this.shakeIntensity > 0) {
            this.shakeTime += deltaTime;
            if (this.shakeTime >= this.shakeDuration) {
                this.shakeIntensity = 0;
                this.shakeOffsetX = 0;
                this.shakeOffsetY = 0;
            } else {
                const decay = 1 - this.shakeTime / this.shakeDuration;
                this.shakeOffsetX = (Math.random() * 2 - 1) * this.shakeIntensity * decay;
                this.shakeOffsetY = (Math.random() * 2 - 1) * this.shakeIntensity * decay;
            }
        }

        // 衰减闪烁
        if (this.hitFlashAlpha > 0) {
            this.hitFlashAlpha -= deltaTime * 0.003;
            if (this.hitFlashAlpha < 0) this.hitFlashAlpha = 0;
        }
    },

    // 绘制屏幕效果（在所有游戏内容之后绘制）
    draw(ctx) {
        // 受击闪烁：屏幕边缘红色渐变叠加
        if (this.hitFlashAlpha > 0) {
            const w = CONFIG.canvas.width;
            const h = CONFIG.canvas.height;
            const gradient = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7);
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
            gradient.addColorStop(1, `rgba(255, 0, 0, ${this.hitFlashAlpha})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);
        }
    }
};

// ==================== 伤害飘字系统 ====================
class DamageNumber {
    constructor(x, y, text, color, isCrit) {
        this.x = x;
        this.y = y;
        this.text = String(text);
        this.color = color || '#fff';
        this.isCrit = isCrit || false;
        this.life = 1.0;
        this.decay = 0.025; // ~40帧消失
        this.vy = -1.5; // 向上飘动
        this.vx = (Math.random() - 0.5) * 0.8; // 轻微水平偏移
        this.fontSize = isCrit ? 18 : 14;
    }

    update() {
        const dt = game.dtFactor || 1;
        this.y += this.vy * dt;
        this.x += this.vx * dt;
        this.vy *= Math.pow(0.97, dt); // 减速
        this.life -= this.decay * dt;
    }

    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.font = `bold ${this.fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 描边增加可读性
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(this.text, this.x, this.y);

        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1;
    }

    isDead() {
        return this.life <= 0;
    }
}

// 全局飘字函数 —— 被 entities.js 等多处调用
function showDamageNumber(x, y, text, color, isCrit) {
    if (game.damageNumbers.length > 50) return; // 上限防爆
    game.damageNumbers.push(new DamageNumber(x, y, text, color, isCrit));
}

// ==================== 空间网格系统 ====================
const GRID_CELL_SIZE = 200;

// 构建障碍物空间网格（障碍物是静态的，只需建一次）
function buildObstacleGrid() {
    game.obstacleGrid = {};
    game.obstacles.forEach(obstacle => {
        const cellX = Math.floor(obstacle.x / GRID_CELL_SIZE);
        const cellY = Math.floor(obstacle.y / GRID_CELL_SIZE);
        const key = cellX + ',' + cellY;
        if (!game.obstacleGrid[key]) game.obstacleGrid[key] = [];
        game.obstacleGrid[key].push(obstacle);
    });
}

// 查询坐标附近的障碍物（只查9个格子，障碍物最大尺寸 80 < GRID_CELL_SIZE，够用）
function getNearbyObstacles(x, y) {
    // 防御：网格尚未构建时返回空数组，而不是让整个 gameLoop 抛异常中断
    const grid = game.obstacleGrid;
    if (!grid) return [];
    const cellX = Math.floor(x / GRID_CELL_SIZE);
    const cellY = Math.floor(y / GRID_CELL_SIZE);
    const result = [];
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const key = (cellX + dx) + ',' + (cellY + dy);
            const cell = grid[key];
            if (cell) {
                for (let i = 0; i < cell.length; i++) {
                    result.push(cell[i]);
                }
            }
        }
    }
    return result;
}

// 构建敌人空间网格（敌人是动态的，每帧重建）
function buildEnemyGrid() {
    game.enemyGrid = {};
    for (let i = 0; i < game.enemies.length; i++) {
        const enemy = game.enemies[i];
        const cellX = Math.floor(enemy.x / GRID_CELL_SIZE);
        const cellY = Math.floor(enemy.y / GRID_CELL_SIZE);
        const key = cellX + ',' + cellY;
        if (!game.enemyGrid[key]) game.enemyGrid[key] = [];
        game.enemyGrid[key].push(enemy);
    }
}

// 查询坐标附近的敌人
// radius 是调用方真正关心的搜索半径：3x3 格只能保证覆盖 GRID_CELL_SIZE(200)，
// 而远程武器射程 300、进化武器 350，固定 3x3 会漏掉射程内的敌人（表现为「怪在射程里却不打」）。
function getNearbyEnemies(x, y, radius = GRID_CELL_SIZE) {
    // 防御：网格尚未构建时返回空数组，而不是让整个 gameLoop 抛异常中断
    const grid = game.enemyGrid;
    if (!grid) return [];
    const cellX = Math.floor(x / GRID_CELL_SIZE);
    const cellY = Math.floor(y / GRID_CELL_SIZE);
    const span = Math.max(1, Math.ceil(radius / GRID_CELL_SIZE));
    const result = [];
    for (let dx = -span; dx <= span; dx++) {
        for (let dy = -span; dy <= span; dy++) {
            const key = (cellX + dx) + ',' + (cellY + dy);
            const cell = grid[key];
            if (cell) {
                for (let i = 0; i < cell.length; i++) {
                    result.push(cell[i]);
                }
            }
        }
    }
    return result;
}

function isClearOfPlayerSpawn(x, y, type) {
    const spawnPoints = [
        { x: CONFIG.world.width / 2 - 50, y: CONFIG.world.height / 2 },
        { x: CONFIG.world.width / 2 + 50, y: CONFIG.world.height / 2 }
    ];
    const safeRadiusByType = {
        tree: 620,
        rock: 260,
        bush: 180
    };
    const safeRadius = safeRadiusByType[type] || 240;
    return spawnPoints.every(point => Math.hypot(x - point.x, y - point.y) > safeRadius);
}

function syncPressedState(selector) {
    document.querySelectorAll(selector).forEach(element => {
        element.setAttribute('aria-pressed', element.classList.contains('selected') ? 'true' : 'false');
    });
}

// 生成障碍物
function generateObstacles() {
    game.obstacles = [];

    // 使用地图配置的障碍物数量
    const mapConfig = game.mapConfig || CONFIG.maps.forest;
    const rockCount = mapConfig.rockCount || CONFIG.obstacles.rockCount;
    const bushCount = mapConfig.bushCount || CONFIG.obstacles.bushCount;
    const treeCount = mapConfig.treeCount || CONFIG.obstacles.treeCount || 30;

    // 边界缓冲区，确保障碍物完全在地图内显示
    const treeBorder = 150;  // 树木需要更大的边界（图片较大）
    const rockBorder = 80;
    const bushBorder = 60;

    // 生成树木（先生成，作为主要装饰）
    for (let i = 0; i < treeCount; i++) {
        const x = Math.random() * (CONFIG.world.width - treeBorder * 2) + treeBorder;
        const y = Math.random() * (CONFIG.world.height - treeBorder * 2) + treeBorder;

        if (isClearOfPlayerSpawn(x, y, 'tree')) {
            game.obstacles.push(new Obstacle(x, y, 'tree'));
        }
    }

    // 生成石头
    for (let i = 0; i < rockCount; i++) {
        const x = Math.random() * (CONFIG.world.width - rockBorder * 2) + rockBorder;
        const y = Math.random() * (CONFIG.world.height - rockBorder * 2) + rockBorder;

        if (isClearOfPlayerSpawn(x, y, 'rock')) {
            game.obstacles.push(new Obstacle(x, y, 'rock'));
        }
    }

    // 生成草丛
    for (let i = 0; i < bushCount; i++) {
        const x = Math.random() * (CONFIG.world.width - bushBorder * 2) + bushBorder;
        const y = Math.random() * (CONFIG.world.height - bushBorder * 2) + bushBorder;

        if (isClearOfPlayerSpawn(x, y, 'bush')) {
            game.obstacles.push(new Obstacle(x, y, 'bush'));
        }
    }

    // 构建空间网格索引
    buildObstacleGrid();
}

// 生成地图事件
function generateMapEvents() {
    game.mapEvents = [];

    const eventBorder = 200;
    const centerX = CONFIG.world.width / 2;
    const centerY = CONFIG.world.height / 2;

    // 宝箱：3-5个
    const chestCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < chestCount; i++) {
        const x = eventBorder + Math.random() * (CONFIG.world.width - eventBorder * 2);
        const y = eventBorder + Math.random() * (CONFIG.world.height - eventBorder * 2);
        if (Math.hypot(x - centerX, y - centerY) > 250) {
            game.mapEvents.push(new MapEvent(x, y, 'chest'));
        }
    }

    // 祭坛：2-3个
    const altarCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < altarCount; i++) {
        const x = eventBorder + Math.random() * (CONFIG.world.width - eventBorder * 2);
        const y = eventBorder + Math.random() * (CONFIG.world.height - eventBorder * 2);
        if (Math.hypot(x - centerX, y - centerY) > 300) {
            game.mapEvents.push(new MapEvent(x, y, 'altar'));
        }
    }

    // 陷阱：4-6个
    const trapCount = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < trapCount; i++) {
        const x = eventBorder + Math.random() * (CONFIG.world.width - eventBorder * 2);
        const y = eventBorder + Math.random() * (CONFIG.world.height - eventBorder * 2);
        if (Math.hypot(x - centerX, y - centerY) > 200) {
            game.mapEvents.push(new MapEvent(x, y, 'trap'));
        }
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
        // 配件（盾牌/斗篷/箭袋/魔法书/拳套/余烬）只是被动加成与进化素材，
        // 它们没有 damage 字段。原来这里不加过滤，配件会照样发射投射物，
        // 伤害算出来是 NaN，敌人血量被打成 NaN 后 filter(e => e.health > 0)
        // 判定为假，敌人静默消失——不计击杀、不掉落、不给经验。
        if (weapon.type === 'accessory') return;

        if (!weapon.lastAttackTime) weapon.lastAttackTime = 0;

        // 射程与冷却已移入 js/data.js 的 WEAPONS 定义，这里只做兜底
        const baseCooldown = weapon.cooldown || 1000;
        const cooldown = baseCooldown * (player.attackCooldown / 500);

        if (now - weapon.lastAttackTime < cooldown) return;

        // 武器射程同样吃玩家的射程加成，这样「攻击范围扩大」这类强化对武器有效，
        // 面板上显示的射程也才和实际打得到的距离对得上
        const baseRange = weapon.range ||
            (weapon.type === 'melee' ? 100 : (weapon.type === 'evolved' ? 350 : 300));
        const attackRange = baseRange * (player.rangeMultiplier || 1);

        // 按武器射程扩大网格查询范围，否则 300/350 射程的武器会漏掉 200 格外的敌人
        const nearestEnemy = getNearbyEnemies(player.x, player.y, attackRange).reduce((closest, enemy) => {
            const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
            return dist < closest.dist ? { enemy, dist } : closest;
        }, { enemy: null, dist: Infinity });

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

// 更新武器投射物（使用空间网格加速碰撞检测）
function updateWeaponProjectiles() {
    game.weaponProjectiles.forEach(proj => {
        proj.update();
        const nearbyEnemies = getNearbyEnemies(proj.x, proj.y);
        for (let i = 0; i < nearbyEnemies.length; i++) {
            const enemy = nearbyEnemies[i];
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
                SFX.play('hit');

                // 武器伤害飘字
                showDamageNumber(enemy.x, enemy.y - 10, Math.floor(damage), '#ffaa00');

                for (let j = 0; j < 2; j++) {
                    game.particles.push(new Particle(enemy.x, enemy.y, '#fff'));
                }

                if (enemy.health <= 0) {
                    handleEnemyKill(enemy, owner);
                }
            }
        }
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
    // 局内可能还挂着波次提示、伤害飘字之类的定时器，结算画面不需要它们
    clearAllUiTimers();
    document.getElementById('finalTime').textContent = Math.floor(game.gameTime);
    document.getElementById('finalKills').textContent = game.killCount;
    let finalLevel = game.player.level;
    let finalGold = game.player.gold;
    if (game.playerCount === 2 && game.player2) {
        finalLevel = Math.max(game.player.level, game.player2.level);
        finalGold = Math.max(game.player.gold, game.player2.gold);
    }
    document.getElementById('finalLevel').textContent = finalLevel;
    document.getElementById('finalWave').textContent = game.wave.current;
    document.getElementById('finalGold').textContent = finalGold;

    // 发放灵魂石奖励
    const soulReward = grantSoulStoneReward(
        game.wave.current,
        game.killCount,
        Math.floor(game.gameTime),
        game.selectedDifficulty
    );
    // 显示灵魂石奖励
    const statsEl = document.getElementById('gameStats');
    let rewardEl = document.getElementById('soulReward');
    if (!rewardEl) {
        rewardEl = document.createElement('p');
        rewardEl.id = 'soulReward';
        rewardEl.style.color = '#a855f7';
        rewardEl.style.fontWeight = 'bold';
        statsEl.appendChild(rewardEl);
    }
    rewardEl.textContent = `💎 获得灵魂石: +${soulReward}`;

    // 更新成就系统
    const gameData = {
        killCount: game.killCount,
        bossKills: game.bossKills || 0,
        dragonKills: game.dragonKills || 0,
        survivalTime: Math.floor(game.gameTime),
        wave: game.wave.current,
        level: finalLevel,
        gold: finalGold,
        victory: game.wave.current >= 30, // 30波视为通关
        className: game.selectedClass,
        difficulty: game.selectedDifficulty,
        perfectWaves: game.perfectWaves || 0,
        maxWeaponsBuild: game.player.weapons && game.player.weapons.length === 6 && game.player.weapons.every(w => w.level === w.maxLevel)
    };

    const newAchievements = updateAchievementStats(gameData);

    // 显示新解锁的成就（这里是结算画面，updateGameTimers 已不再推进，用 UI 定时器）
    if (newAchievements && newAchievements.length > 0) {
        let delay = 0;
        newAchievements.forEach(achievement => {
            registerUiTimeout(() => {
                showAchievementUnlocked(achievement);
            }, delay);
            delay += 3500; // 每个成就间隔3.5秒
        });
    }

    document.getElementById('gameOverScreen').classList.remove('hidden');
    clearSaveData();
}

// 检查游戏是否结束
function checkGameOver() {
    // 遗物 onDeath 钩子 —— 尝试复活
    [game.player, game.player2].forEach(p => {
        if (p && p.health <= 0 && p.relics && p.relics.length > 0) {
            for (const relic of p.relics) {
                if (relic.onDeath) {
                    const revived = relic.onDeath(p);
                    if (revived) break; // 复活成功就别再触发其他了
                }
            }
        }
    });

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

// 幂等排帧：gameLoopInner 内部有多个 return 分支各自排下一帧，外层 catch 也会补一次。
// 用标记保证同一帧只排一次，否则 rAF 会成倍叠加、帧率失控。
function scheduleNextFrame() {
    if (game._rafScheduled) return;
    game._rafScheduled = true;
    requestAnimationFrame(gameLoop);
}

// 游戏主循环
// 外层包一层异常护栏：requestAnimationFrame 的回调一旦抛异常，链条就断了，
// 表现是「画面还留在那里但一切都不动」，而且没有任何红字提示，极难定位。
// 这里捕获后照常排下一帧，把错误打到 console，单个逻辑 bug 不至于让整局假死。
function gameLoop(timestamp) {
    game._rafScheduled = false;
    try {
        gameLoopInner(timestamp);
    } catch (err) {
        game._loopErrorCount = (game._loopErrorCount || 0) + 1;
        // 同一个 bug 每帧都会触发，只在前几次和每 600 帧打印一次，避免刷爆控制台
        if (game._loopErrorCount <= 3 || game._loopErrorCount % 600 === 0) {
            console.error(`[gameLoop] 第 ${game._loopErrorCount} 次异常，已跳过本帧：`, err);
        }
        scheduleNextFrame();
    }
}

function gameLoopInner(timestamp) {
    // 暂停时不更新
    if (game.state === 'paused') {
        scheduleNextFrame();
        return;
    }

    if (!game.lastTime) game.lastTime = timestamp;
    const deltaTime = timestamp - game.lastTime;
    game.lastTime = timestamp;

    // 帧率无关化系数：以60fps为基准
    // deltaTime=16.67时 dtFactor=1，帧率低时>1，高时<1
    game.dtFactor = Math.min(deltaTime / 16.67, 3); // 上限3防跳帧

    if (game.state === 'playing') {
        game.gameTime += deltaTime / 1000;

        // 更新游戏内计时器
        updateGameTimers(deltaTime);

        // 完美波次检测：玩家伤害来源有 5 处（敌人碰撞/敌人投射物/陷阱/闪电/毒），
        // 与其逐个埋点，不如在这里统一看血量有没有掉过。
        const hpSum = game.player.health + (game.player2 ? game.player2.health : 0);
        if (game._lastHpSum !== undefined && hpSum < game._lastHpSum - 0.01) {
            game.tookDamageThisWave = true;
        }
        game._lastHpSum = hpSum;

        // 存活时长成就每秒上报一次即可，不必每帧
        if (typeof trackAchievement === 'function') {
            const sec = Math.floor(game.gameTime);
            if (sec > 0 && sec !== game._lastSurvivalSec) {
                game._lastSurvivalSec = sec;
                trackAchievement({ 'max:longestSurvivalTime': sec });
            }
        }

        // 构建敌人空间网格（每帧重建）
        // 必须放在所有实体 update 之前：Player.update（主动技能）和 Summon.update（索敌）
        // 都会调 getNearbyEnemies()。原来这行在 update 之后，导致进入战斗的第一帧
        // game.enemyGrid 还是 undefined —— 召唤师（开局 3 幽灵）和死灵法师（开局 5 骷髅）
        // 一进游戏就抛 "Cannot read properties of undefined"，gameLoop 当帧中断、游戏卡死。
        buildEnemyGrid();

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
        game.enemyProjectiles.forEach(ep => ep.update());

        // 更新地图事件
        if (game.mapEvents) {
            game.mapEvents.forEach(event => event.update());
            game.mapEvents = game.mapEvents.filter(event => !event.dead);
        }

        // 更新伤害飘字
        game.damageNumbers.forEach(dn => dn.update());
        game.damageNumbers = game.damageNumbers.filter(dn => !dn.isDead());
        // 投射物击中检测（使用空间网格加速）
        game.projectiles.forEach(projectile => {
            if (projectile.hit) return;
            const nearbyEnemies = getNearbyEnemies(projectile.x, projectile.y);
            for (let i = 0; i < nearbyEnemies.length; i++) {
                const enemy = nearbyEnemies[i];
                const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
                if (dist < enemy.size && !projectile.hit) {
                    let damage = projectile.damage;

                    // 应用诅咒效果
                    if (enemy.cursed && enemy.curseMultiplier) {
                        damage *= enemy.curseMultiplier;
                    }

                    enemy.health -= damage;
                    projectile.hit = true;

                    // 遗物 onHit 钩子
                    const hitOwner = projectile.owner || game.player;
                    if (hitOwner.relics && hitOwner.relics.length > 0) {
                        hitOwner.relics.forEach(relic => {
                            if (relic.onHit) relic.onHit(hitOwner, enemy);
                        });
                    }

                    // 伤害飘字
                    showDamageNumber(enemy.x, enemy.y - 10, Math.floor(damage), projectile.color || '#ff6');

                    // 生命汲取效果（死灵法师）
                    const owner = projectile.owner || game.player;
                    if (owner.lifeSteal) {
                        const healAmount = damage * owner.lifeSteal;
                        owner.health = Math.min(owner.health + healAmount, owner.maxHealth);
                    }

                    for (let j = 0; j < 2; j++) {
                        game.particles.push(new Particle(enemy.x, enemy.y, projectile.color));
                    }

                    if (enemy.health <= 0) {
                        handleEnemyKill(enemy, owner);
                    }
                    break; // 一颗弹只命中一个敌人
                }
            }
        });

        // 分裂怪死亡生成子体
        game.enemies.forEach(enemy => {
            if (enemy.health <= 0 && enemy.type === 'splitter' && enemy.splitCount) {
                for (let i = 0; i < enemy.splitCount; i++) {
                    const offsetX = (Math.random() - 0.5) * 30;
                    const offsetY = (Math.random() - 0.5) * 30;
                    game.enemies.push(new Enemy(enemy.x + offsetX, enemy.y + offsetY, 'splitter_child'));
                    game.wave.totalEnemies++;
                    game.wave.enemiesSpawned++;
                    game.wave.enemiesRemaining++;
                }
                for (let i = 0; i < 6; i++) {
                    game.particles.push(new Particle(enemy.x, enemy.y, '#7bed9f'));
                }
            }
        });

        // 移除死亡的敌人、粒子和投射物
        game.enemies = game.enemies.filter(enemy => enemy.health > 0);
        game.particles = game.particles.filter(particle => !particle.isDead());
        game.projectiles = game.projectiles.filter(p => !p.isDead() && !p.hit);
        game.enemyProjectiles = game.enemyProjectiles.filter(ep => !ep.isDead());
        game.summons = game.summons.filter(summon => !summon.isDead());
        game.droppedItems = game.droppedItems.filter(item => !item.isDead());

        // 跑得太远的敌人重新投放到玩家附近（考虑双人模式）
        // 旧实现是直接 filter 删除：敌人既不计击杀也不补生成，而 enemiesSpawned 已经加过，
        // 于是 checkWaveComplete 的「enemies.length === 0」提前成立，波次白送。
        // 现在改为重投，敌人总数守恒。
        const cullRadius = getEnemyCullRadius();
        for (let i = 0; i < game.enemies.length; i++) {
            const enemy = game.enemies[i];
            let minDist = Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y);
            if (game.playerCount === 2 && game.player2 && game.player2.health > 0) {
                minDist = Math.min(minDist,
                    Math.hypot(enemy.x - game.player2.x, enemy.y - game.player2.y));
            }
            // 坐标一旦变成 NaN，敌人就画不出来也打不到，但仍占着 game.enemies，
            // 而 minDist 是 NaN 时所有比较都为 false，连重投都轮不到它 ——
            // checkWaveComplete 永远等不到 enemies.length === 0，整局卡在这一波。
            // 这里统一捞回来：NaN 一律当作超距处理。
            if (!Number.isFinite(minDist) || minDist > cullRadius) {
                const pos = getSpawnPosition();
                enemy.x = pos.x;
                enemy.y = pos.y;
            }
        }

        // 检查游戏结束
        if (checkGameOver()) {
            scheduleNextFrame();
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

        // 更新屏幕特效
        ScreenFX.update(deltaTime);

        // 更新UI（每200ms更新一次，降低DOM操作频率）
        if (!game._lastUIUpdate || timestamp - game._lastUIUpdate > 200) {
            game._lastUIUpdate = timestamp;
            updateUI();
        }
    }

    // 绘制
    if (game.state === 'playing' || game.state === 'levelup' || game.state === 'waveComplete' || game.state === 'paused') {
        game.ctx.fillStyle = '#1a1a2e';
        game.ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

        game.ctx.save();
        game.ctx.translate(-game.camera.x + ScreenFX.shakeOffsetX, -game.camera.y + ScreenFX.shakeOffsetY);

        // 绘制地图背景（使用瓦片图片）
        const mapConfig = game.mapConfig || CONFIG.maps.forest;
        const tileImage = mapTileImages[game.selectedMap || 'forest'];

        if (tileImage) {
            // 使用512x512大尺寸瓦片平铺背景（减少重复感）
            game.ctx.imageSmoothingEnabled = false;
            const tileSize = 512;
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

        // 只绘制可见区域内的障碍物（使用空间网格加速）
        const camBuffer = 200;
        const minCellX = Math.floor((game.camera.x - camBuffer) / GRID_CELL_SIZE);
        const maxCellX = Math.floor((game.camera.x + CONFIG.canvas.width + camBuffer) / GRID_CELL_SIZE);
        const minCellY = Math.floor((game.camera.y - camBuffer) / GRID_CELL_SIZE);
        const maxCellY = Math.floor((game.camera.y + CONFIG.canvas.height + camBuffer) / GRID_CELL_SIZE);

        const visibleBushes = [];
        const visibleRocks = [];
        const visibleTrees = [];
        for (let cx = minCellX; cx <= maxCellX; cx++) {
            for (let cy = minCellY; cy <= maxCellY; cy++) {
                const cell = game.obstacleGrid[cx + ',' + cy];
                if (!cell) continue;
                for (let i = 0; i < cell.length; i++) {
                    const o = cell[i];
                    if (o.type === 'bush') visibleBushes.push(o);
                    else if (o.type === 'rock') visibleRocks.push(o);
                    else if (o.type === 'tree') visibleTrees.push(o);
                }
            }
        }

        visibleBushes.forEach(obstacle => obstacle.draw(game.ctx));
        visibleRocks.forEach(obstacle => obstacle.draw(game.ctx));
        visibleTrees.forEach(obstacle => obstacle.draw(game.ctx));

        // 绘制地图事件
        if (game.mapEvents) {
            game.mapEvents.forEach(event => {
                if (event.x > game.camera.x - 50 &&
                    event.x < game.camera.x + CONFIG.canvas.width + 50 &&
                    event.y > game.camera.y - 50 &&
                    event.y < game.camera.y + CONFIG.canvas.height + 50) {
                    event.draw(game.ctx);
                }
            });
        }

        // 绘制掉落物
        game.droppedItems.forEach(item => item.draw(game.ctx));

        game.particles.forEach(particle => particle.draw(game.ctx));
        game.projectiles.forEach(projectile => projectile.draw(game.ctx));
        game.weaponProjectiles.forEach(projectile => projectile.draw(game.ctx));
        game.enemyProjectiles.forEach(ep => ep.draw(game.ctx));
        game.summons.forEach(summon => summon.draw(game.ctx));
        game.enemies.forEach(enemy => enemy.draw(game.ctx));

        // 绘制P1
        game.player.draw(game.ctx);

        // 绘制P2
        if (game.playerCount === 2 && game.player2 && game.player2.health > 0) {
            game.player2.draw(game.ctx);
        }

        // 绘制伤害飘字（世界坐标系内）
        game.damageNumbers.forEach(dn => dn.draw(game.ctx));

        game.ctx.restore();

        // 绘制屏幕特效（受击闪烁等，在UI层之上）
        ScreenFX.draw(game.ctx);

        drawMinimap();
    }

    scheduleNextFrame();
}

// 自适应屏幕大小
function resizeCanvas() {
    const gameScreen = document.getElementById('gameScreen');
    const topBar = document.querySelector('.top-bar');
    const p1Panel = document.getElementById('p1Panel');
    const p2Panel = document.getElementById('p2Panel');
    const gameMainArea = document.querySelector('.game-main-area');

    const padding = 20;
    const topBarHeight = topBar ? topBar.offsetHeight + 15 : 55;
    const p2Visible = p2Panel && !p2Panel.classList.contains('hidden');

    // 检测是否为小屏幕（垂直布局）
    const isSmallScreen = window.innerWidth <= 900;

    let panelWidth = 0;
    if (!isSmallScreen) {
        // 大屏幕：面板在两侧
        panelWidth = p1Panel ? Math.min(p1Panel.offsetWidth, 280) : 220;
    }

    // 计算可用空间
    let availableWidth, availableHeight;

    if (isSmallScreen) {
        // 小屏幕：画布占满宽度，面板在下方
        availableWidth = window.innerWidth - padding * 2;
        availableHeight = window.innerHeight - topBarHeight - padding * 2 - 150; // 预留面板空间
    } else {
        // 大屏幕：画布在中间，面板在两侧
        availableWidth = window.innerWidth - padding * 2 - panelWidth - (p2Visible ? panelWidth : 0) - 40;
        availableHeight = window.innerHeight - topBarHeight - padding * 2;
    }

    const minWidth = 400;
    const minHeight = 300;
    const maxWidth = 1600;
    const maxHeight = 1000;
    const aspectRatio = 16 / 10;

    let canvasWidth = Math.max(minWidth, Math.min(maxWidth, availableWidth));
    let canvasHeight = canvasWidth / aspectRatio;

    if (canvasHeight > availableHeight) {
        canvasHeight = Math.max(minHeight, Math.min(maxHeight, availableHeight));
        canvasWidth = canvasHeight * aspectRatio;
    }

    if (canvasWidth > availableWidth) {
        canvasWidth = Math.max(minWidth, availableWidth);
        canvasHeight = canvasWidth / aspectRatio;
    }

    canvasWidth = Math.floor(canvasWidth);
    canvasHeight = Math.floor(canvasHeight);

    CONFIG.canvas.width = canvasWidth;
    CONFIG.canvas.height = canvasHeight;

    if (game.canvas) {
        game.canvas.width = canvasWidth;
        game.canvas.height = canvasHeight;
        // 设置 CSS 尺寸确保显示正确
        game.canvas.style.width = canvasWidth + 'px';
        game.canvas.style.height = canvasHeight + 'px';
    }

    // Canvas大小已更新
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
    game.enemyProjectiles = [];
    // 上一波挂起的延时回调（Boss 召唤、技能结束等）不该漏进重开后的这一波
    game.damageNumbers = [];
    game.timers = [];
    clearAllUiTimers();

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

// 把音效按钮的文案和 aria 状态同步到 SFX.enabled
function syncSfxButton() {
    const btn = document.getElementById('pauseSfxBtn');
    if (!btn) return;
    btn.textContent = SFX.enabled ? '🔊 音效: 开' : '🔇 音效: 关';
    btn.setAttribute('aria-pressed', SFX.enabled ? 'true' : 'false');
}

// 开始游戏
function startGame() {
    // 初始化音效系统（需要在用户交互后）
    SFX.init();

    // 清掉上一局残留的 UI 定时器（通知、倒计时），否则会插进新的一局
    clearAllUiTimers();
    // 开启成就实时会话，本局的击杀/波次/等级会即时判定并弹提示
    beginAchievementSession();
    game.bossKills = 0;
    game.dragonKills = 0;
    game.perfectWaves = 0;
    game.tookDamageThisWave = false;
    game._lastHpSum = undefined;
    game._lastSurvivalSec = 0;

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

    // 生成地图事件
    generateMapEvents();

    // 创建P1
    game.player = new Player(game.selectedClass, 1);
    applyMetaBonuses(game.player); // 应用Meta永久加成

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
        applyMetaBonuses(game.player2); // 应用Meta永久加成
        document.getElementById('p2Panel').classList.remove('hidden');
        document.getElementById('p2ClassName').textContent = classNames[game.selectedClass2] || game.selectedClass2;
    } else {
        game.player2 = null;
        document.getElementById('p2Panel').classList.add('hidden');
    }

    // 重新计算画布大小（双人模式下需要考虑P2面板）
    resizeCanvas();

    game.enemies = [];
    game.particles = [];
    game.projectiles = [];
    game.weaponProjectiles = [];
    game.summons = [];
    game.droppedItems = [];
    game.enemyProjectiles = [];
    game.timers = [];
    game.damageNumbers = [];
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

    // 启动游戏循环（防止重复启动）
    if (!game.loopRunning) {
        game.loopRunning = true;
        scheduleNextFrame();
    }
}

// 初始化游戏
function initGame() {
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');

    // 自适应屏幕大小
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 音效开关：先读回上次的选择。AudioContext 必须等用户交互过才能建，
    // 之前只在 startGame 里 init，主菜单那一路的点击音效全是静默失败。
    SFX.loadPref();
    document.addEventListener('pointerdown', () => {
        if (SFX.enabled) {
            SFX.init();
            SFX.resume();
        }
    }, { once: true });

    // 检查是否有存档
    checkSaveData();
    syncPressedState('.class-card');
    syncPressedState('.difficulty-card');
    syncPressedState('.map-card');

    // 键盘事件
    window.addEventListener('keydown', (e) => {
        game.keys[e.key] = true;
        // ESC键：暂停/继续游戏
        if (e.key === 'Escape') {
            const weaponDetailModal = document.getElementById('weaponDetailModal');
            if (weaponDetailModal && !weaponDetailModal.classList.contains('hidden')) {
                closeWeaponDetail();
                return;
            }

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

    // 中途关页/刷新时把成就的实时增量落盘。
    // checkAchievements 只在真解锁时写 localStorage，纯统计增量（打了几十个怪
    // 但没触发新成就）没有这道兜底就会丢。
    window.addEventListener('beforeunload', () => {
        if (typeof flushAchievementSession === 'function') flushAchievementSession();
    });

    // 新游戏按钮
    document.getElementById('newGameBtn').addEventListener('click', () => {
        showSaveSlotScreen('newgame');
    });

    // Meta 永久强化按钮
    document.getElementById('metaBtn').addEventListener('click', () => {
        openMetaPanel();
    });

    // 成就系统按钮
    document.getElementById('achievementBtn').addEventListener('click', () => {
        openAchievementPanel();
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
            if (saveGameToSlot(slotIndex)) {
                showSaveNotification();
                hideSaveSlotScreen();
                document.getElementById('gameScreen').classList.remove('hidden');
                resumeGame();
            }
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
                    syncPressedState('.class-card');
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
            syncPressedState('.difficulty-card');
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
            syncPressedState('.map-card');
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

    // 继续游戏按钮
    document.getElementById('resumeBtn').addEventListener('click', resumeGame);

    // 音效开关：SFX.toggle 早就写好了，之前全项目没有任何地方调用
    const sfxBtn = document.getElementById('pauseSfxBtn');
    if (sfxBtn) {
        syncSfxButton();
        sfxBtn.addEventListener('click', () => {
            SFX.toggle();
            syncSfxButton();
            SFX.play('menuClick');
        });
    }

    // 保存按钮
    document.getElementById('saveBtn').addEventListener('click', () => {
        if (game.currentSaveSlot) {
            if (saveGame()) {
                showSaveNotification();
            }
        } else {
            pauseGame();
            document.getElementById('pauseScreen').classList.add('hidden');
            showSaveSlotScreen('save');
        }
    });

    // 暂停界面-保存并退出
    document.getElementById('pauseSaveBtn').addEventListener('click', () => {
        if (game.currentSaveSlot) {
            if (saveGame()) {
                returnToMenu();
            }
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
    document.querySelector('#weaponDetailModal .modal-close').addEventListener('click', closeWeaponDetail);
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    // 预加载精灵图资源
    preloadAssets(() => {
        // 预加载环境素材（草丛和石头）
        preloadEnvironmentAssets(() => {
            // 预加载地图瓦片
            preloadMapTiles(() => {
                initGame();
            });
        });
    });
});
