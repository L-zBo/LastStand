// 游戏配置
const CONFIG = {
    canvas: {
        width: 1200,
        height: 800
    },
    world: {
        width: 8000,  // 大地图宽度
        height: 6000  // 大地图高度
    },
    player: {
        size: 25
    },
    enemy: {
        size: 18,
        spawnInterval: 2000, // 2秒生成一波
        spawnRate: 3 // 每波生成3个
    },
    obstacles: {
        rockCount: 150,  // 石头数量
        bushCount: 200   // 草丛数量
    }
};

// 职业配置
const CLASSES = {
    warrior: {
        name: '战士',
        health: 150,
        attack: 15,
        speed: 3,
        color: '#ff6b6b',
        sprite: '🛡️',
        attackType: 'melee',  // 近战
        attackRange: 50
    },
    mage: {
        name: '法师',
        health: 80,
        attack: 25,
        speed: 3.5,
        color: '#4ecdc4',
        sprite: '🧙',
        attackType: 'magic',  // 魔法
        attackRange: 150
    },
    assassin: {
        name: '刺客',
        health: 100,
        attack: 20,
        speed: 5,
        color: '#95e1d3',
        sprite: '🥷',
        attackType: 'melee',  // 近战
        attackRange: 45
    },
    ranger: {
        name: '游侠',
        health: 110,
        attack: 18,
        speed: 4,
        color: '#f38181',
        sprite: '🏹',
        attackType: 'ranged',  // 远程弓箭
        attackRange: 200
    }
};

// Buff配置（参考了《吸血鬼幸存者》、《弹壳特攻队》等游戏）
const BUFFS = [
    {
        id: 'attackUp',
        name: '力量提升',
        description: '攻击力 +5',
        icon: '⚔️',
        apply: (player) => player.attack += 5
    },
    {
        id: 'speedUp',
        name: '迅捷之靴',
        description: '移动速度 +0.5',
        icon: '💨',
        apply: (player) => player.speed += 0.5
    },
    {
        id: 'healthUp',
        name: '生命强化',
        description: '最大生命 +30',
        icon: '❤️',
        apply: (player) => {
            player.maxHealth += 30;
            player.health += 30;
        }
    },
    {
        id: 'healUp',
        name: '治疗',
        description: '回复 50% 生命值',
        icon: '💚',
        apply: (player) => {
            player.health = Math.min(player.health + player.maxHealth * 0.5, player.maxHealth);
        }
    },
    {
        id: 'damageBoost',
        name: '狂暴',
        description: '攻击力 +15%',
        icon: '🔥',
        apply: (player) => player.attack = Math.floor(player.attack * 1.15)
    },
    {
        id: 'expBoost',
        name: '经验加成',
        description: '获得经验 +20%',
        icon: '⭐',
        apply: (player) => player.expMultiplier = (player.expMultiplier || 1) * 1.2
    },
    {
        id: 'attackRange',
        name: '攻击范围扩大',
        description: '攻击范围 +20%',
        icon: '📍',
        apply: (player) => player.attackRange = (player.attackRange || 40) * 1.2
    },
    {
        id: 'critChance',
        name: '致命一击',
        description: '暴击率 +10%',
        icon: '💥',
        apply: (player) => player.critChance = (player.critChance || 0) + 0.1
    },
    {
        id: 'vampire',
        name: '吸血',
        description: '击杀恢复 5 生命',
        icon: '🩸',
        apply: (player) => player.vampireHeal = (player.vampireHeal || 0) + 5
    },
    {
        id: 'multiShot',
        name: '多重射击',
        description: '同时攻击多个敌人',
        icon: '🎯',
        apply: (player) => player.multiShot = (player.multiShot || 1) + 1
    }
];

// 游戏状态
let game = {
    state: 'start', // start, playing, levelup, gameover
    canvas: null,
    ctx: null,
    player: null,
    enemies: [],
    particles: [], // 粒子效果
    projectiles: [], // 投射物（箭、魔法弹）
    obstacles: [], // 障碍物
    keys: {},
    lastTime: 0,
    gameTime: 0,
    killCount: 0,
    selectedClass: null,
    lastSpawnTime: 0,
    spawnInterval: CONFIG.enemy.spawnInterval,
    spawnRate: CONFIG.enemy.spawnRate,
    camera: { x: 0, y: 0 } // 摄像机位置
};

// 粒子类（用于视觉效果）
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1;
        this.decay = 0.02;
        this.size = Math.random() * 3 + 2;
        this.color = color;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    isDead() {
        return this.life <= 0;
    }
}

// 障碍物类
class Obstacle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'rock' 或 'bush'

        if (type === 'rock') {
            this.size = 20 + Math.random() * 20;
            this.sprite = '🪨';
            this.blocking = true; // 阻挡移动
        } else if (type === 'bush') {
            this.size = 30 + Math.random() * 20;
            this.sprite = '🌿';
            this.blocking = false; // 不阻挡移动
        }
    }

    draw(ctx) {
        ctx.font = `${this.size * 1.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.sprite, this.x, this.y);
    }

    collidesWith(x, y, size) {
        const dist = Math.hypot(this.x - x, this.y - y);
        return dist < this.size + size;
    }
}

// 投射物类（箭、魔法弹）
class Projectile {
    constructor(x, y, targetX, targetY, damage, type, color) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.type = type; // 'arrow', 'magic'
        this.color = color;
        this.speed = 8;
        this.size = 5;

        // 计算方向
        const angle = Math.atan2(targetY - y, targetX - x);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.rotation = angle;

        this.distance = 0;
        this.maxDistance = 400;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.distance += this.speed;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (this.type === 'arrow') {
            // 绘制箭
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-8, -2, 16, 4);
            ctx.fillStyle = '#C0C0C0';
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(4, -4);
            ctx.lineTo(4, 4);
            ctx.fill();
        } else if (this.type === 'magic') {
            // 绘制魔法弹
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }

    isDead() {
        return this.distance >= this.maxDistance;
    }
}

// 玩家类
class Player {
    constructor(classType) {
        const classConfig = CLASSES[classType];
        this.x = CONFIG.world.width / 2;  // 在世界中心生成
        this.y = CONFIG.world.height / 2;
        this.size = CONFIG.player.size;
        this.health = classConfig.health;
        this.maxHealth = classConfig.health;
        this.attack = classConfig.attack;
        this.speed = classConfig.speed;
        this.color = classConfig.color;
        this.sprite = classConfig.sprite;
        this.classType = classType;
        this.attackType = classConfig.attackType;
        this.attackRange = classConfig.attackRange;
        this.level = 1;
        this.exp = 0;
        this.maxExp = 100;
        this.expMultiplier = 1;
        this.critChance = 0;
        this.vampireHeal = 0;
        this.multiShot = 1;
        this.lastAttackTime = 0;
        this.attackCooldown = 500; // 0.5秒攻击间隔
        this.inBush = false; // 是否在草丛中
        this.hidden = false; // 是否隐身
    }

    update(deltaTime) {
        // 移动
        let dx = 0, dy = 0;
        if (game.keys['ArrowLeft'] || game.keys['a'] || game.keys['A']) dx -= 1;
        if (game.keys['ArrowRight'] || game.keys['d'] || game.keys['D']) dx += 1;
        if (game.keys['ArrowUp'] || game.keys['w'] || game.keys['W']) dy -= 1;
        if (game.keys['ArrowDown'] || game.keys['s'] || game.keys['S']) dy += 1;

        // 归一化对角线移动
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        // 计算新位置
        const newX = this.x + dx * this.speed;
        const newY = this.y + dy * this.speed;

        // 检查与石头的碰撞
        let canMove = true;
        for (const obstacle of game.obstacles) {
            if (obstacle.blocking && obstacle.collidesWith(newX, newY, this.size)) {
                canMove = false;
                break;
            }
        }

        if (canMove) {
            this.x = newX;
            this.y = newY;
        }

        // 边界限制（世界边界）
        this.x = Math.max(this.size, Math.min(CONFIG.world.width - this.size, this.x));
        this.y = Math.max(this.size, Math.min(CONFIG.world.height - this.size, this.y));

        // 检查是否在草丛中
        this.inBush = false;
        for (const obstacle of game.obstacles) {
            if (obstacle.type === 'bush' && obstacle.collidesWith(this.x, this.y, this.size)) {
                this.inBush = true;
                break;
            }
        }

        // 更新隐身状态（在草丛中且没有攻击）
        if (this.inBush && !this.justAttacked) {
            this.hidden = true;
        } else {
            this.hidden = false;
        }

        // 更新摄像机位置（平滑跟随）
        updateCamera();

        // 自动攻击最近的敌人
        this.autoAttack();
    }

    autoAttack() {
        const now = Date.now();
        if (now - this.lastAttackTime < this.attackCooldown) return;

        // 找到范围内最近的敌人
        const enemiesInRange = game.enemies
            .map(enemy => ({
                enemy,
                distance: Math.hypot(enemy.x - this.x, enemy.y - this.y)
            }))
            .filter(e => e.distance <= this.attackRange)
            .sort((a, b) => a.distance - b.distance);

        if (enemiesInRange.length > 0) {
            // 攻击多个敌人（如果有多重射击）
            const targetsToAttack = enemiesInRange.slice(0, this.multiShot);

            targetsToAttack.forEach(({enemy}) => {
                let damage = this.attack;
                let isCrit = false;

                // 暴击判定
                if (Math.random() < this.critChance) {
                    damage *= 2;
                    isCrit = true;
                }

                // 根据攻击类型处理
                if (this.attackType === 'melee') {
                    // 近战：直接造成伤害
                    enemy.health -= damage;

                    // 创建近战特效
                    for (let i = 0; i < 5; i++) {
                        game.particles.push(new Particle(enemy.x, enemy.y, isCrit ? '#ffff00' : this.color));
                    }
                } else if (this.attackType === 'ranged') {
                    // 远程：发射箭
                    game.projectiles.push(new Projectile(
                        this.x, this.y,
                        enemy.x, enemy.y,
                        damage,
                        'arrow',
                        this.color
                    ));
                } else if (this.attackType === 'magic') {
                    // 魔法：发射魔法弹
                    game.projectiles.push(new Projectile(
                        this.x, this.y,
                        enemy.x, enemy.y,
                        damage,
                        'magic',
                        this.color
                    ));
                }

                // 近战直接检查击杀
                if (this.attackType === 'melee' && enemy.health <= 0) {
                    this.gainExp(enemy.expValue);
                    game.killCount++;

                    // 死亡粒子效果
                    for (let i = 0; i < 10; i++) {
                        game.particles.push(new Particle(enemy.x, enemy.y, enemy.color));
                    }

                    // 吸血效果
                    if (this.vampireHeal > 0) {
                        this.health = Math.min(this.health + this.vampireHeal, this.maxHealth);
                    }
                }
            });

            this.lastAttackTime = now;
            this.justAttacked = true; // 攻击后显形
            setTimeout(() => this.justAttacked = false, 1000); // 1秒后可以再次隐身
        }
    }

    gainExp(amount) {
        this.exp += Math.floor(amount * this.expMultiplier);

        if (this.exp >= this.maxExp) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.exp -= this.maxExp;
        this.maxExp = Math.floor(this.maxExp * 1.2);

        // 显示升级选择界面
        game.state = 'levelup';
        showLevelUpScreen();
    }

    draw(ctx) {
        // 如果隐身，设置半透明
        if (this.hidden) {
            ctx.globalAlpha = 0.3;
        }

        // 绘制玩家精灵
        ctx.font = `${this.size * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 添加阴影效果
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillText(this.sprite, this.x, this.y);
        ctx.shadowBlur = 0;

        // 绘制攻击范围（半透明）
        ctx.strokeStyle = this.color + '30';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.attackRange, 0, Math.PI * 2);
        ctx.stroke();

        // 绘制生命条
        const barWidth = 50;
        const barHeight = 6;
        const healthPercent = this.health / this.maxHealth;

        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barWidth/2, this.y - this.size - 15, barWidth, barHeight);

        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - barWidth/2, this.y - this.size - 15, barWidth * healthPercent, barHeight);

        // 恢复透明度
        ctx.globalAlpha = 1;
    }
}

// 敌人类
class Enemy {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.size = CONFIG.enemy.size;
        this.type = type;
        this.isElite = false;

        // 根据类型设置属性
        if (type === 'normal') {
            this.health = 30;
            this.maxHealth = 30;
            this.speed = 1.5;
            this.damage = 10;
            this.expValue = 20;
            this.color = '#ff4757';
            this.sprite = '👾';
        } else if (type === 'fast') {
            this.health = 20;
            this.maxHealth = 20;
            this.speed = 3;
            this.damage = 8;
            this.expValue = 15;
            this.color = '#ffa502';
            this.sprite = '⚡';
        } else if (type === 'tank') {
            this.health = 60;
            this.maxHealth = 60;
            this.speed = 1;
            this.damage = 15;
            this.expValue = 30;
            this.color = '#2ed573';
            this.sprite = '💀';
        } else if (type === 'elite') {
            this.health = 100;
            this.maxHealth = 100;
            this.speed = 2;
            this.damage = 20;
            this.expValue = 50;
            this.color = '#ff6348';
            this.sprite = '👹';
            this.isElite = true;
            this.size = CONFIG.enemy.size * 1.5; // 精英怪更大
        }
    }

    update() {
        // 追踪玩家
        const dx = game.player.x - this.x;
        const dy = game.player.y - this.y;
        const distance = Math.hypot(dx, dy);

        // 精英怪可以看到草丛中的玩家，普通怪看不到
        const canSeePlayer = this.isElite || !game.player.hidden;

        if (distance > 0 && canSeePlayer) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }

        // 碰撞检测
        if (distance < this.size + game.player.size) {
            game.player.health -= this.damage;
            this.health = 0; // 敌人也会消失

            if (game.player.health <= 0) {
                gameOver();
            }
        }
    }

    draw(ctx) {
        // 绘制敌人精灵
        ctx.font = `${this.size * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 精英怪有特殊光环
        if (this.isElite) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15;

            // 绘制精英光环
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 10, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 8;
        }

        ctx.fillText(this.sprite, this.x, this.y);
        ctx.shadowBlur = 0;

        // 绘制生命条
        if (this.health < this.maxHealth) {
            const barWidth = this.isElite ? 45 : 35;
            const barHeight = 5;
            const healthPercent = this.health / this.maxHealth;

            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - barWidth/2, this.y - this.size - 12, barWidth, barHeight);

            ctx.fillStyle = this.isElite ? '#ff6348' : '#ff4757';
            ctx.fillRect(this.x - barWidth/2, this.y - this.size - 12, barWidth * healthPercent, barHeight);
        }
    }
}

// 生成敌人
function spawnEnemies() {
    const now = Date.now();

    if (now - game.lastSpawnTime >= game.spawnInterval) {
        // 随着时间增加难度
        const timeFactor = Math.floor(game.gameTime / 30); // 每30秒
        const spawnCount = game.spawnRate + Math.floor(timeFactor / 2);

        for (let i = 0; i < spawnCount; i++) {
            let x, y;
            const side = Math.floor(Math.random() * 4);

            // 从摄像机视野外围生成（在玩家周围，但屏幕外）
            const playerX = game.player.x;
            const playerY = game.player.y;
            const spawnDistance = Math.max(CONFIG.canvas.width, CONFIG.canvas.height) / 2 + 100;

            switch(side) {
                case 0: // 上
                    x = playerX + (Math.random() - 0.5) * CONFIG.canvas.width;
                    y = playerY - spawnDistance;
                    break;
                case 1: // 右
                    x = playerX + spawnDistance;
                    y = playerY + (Math.random() - 0.5) * CONFIG.canvas.height;
                    break;
                case 2: // 下
                    x = playerX + (Math.random() - 0.5) * CONFIG.canvas.width;
                    y = playerY + spawnDistance;
                    break;
                case 3: // 左
                    x = playerX - spawnDistance;
                    y = playerY + (Math.random() - 0.5) * CONFIG.canvas.height;
                    break;
            }

            // 确保在世界范围内
            x = Math.max(50, Math.min(CONFIG.world.width - 50, x));
            y = Math.max(50, Math.min(CONFIG.world.height - 50, y));

            // 随机敌人类型（包括精英怪）
            let type = 'normal';
            const rand = Math.random();
            if (rand > 0.95) type = 'elite'; // 5%几率精英怪
            else if (rand > 0.85) type = 'tank';
            else if (rand > 0.7) type = 'fast';

            game.enemies.push(new Enemy(x, y, type));
        }

        game.lastSpawnTime = now;

        // 随时间降低生成间隔（增加难度）
        game.spawnInterval = Math.max(1000, CONFIG.enemy.spawnInterval - timeFactor * 50);
    }
}

// 生成障碍物
function generateObstacles() {
    game.obstacles = [];

    // 生成石头
    for (let i = 0; i < CONFIG.obstacles.rockCount; i++) {
        const x = Math.random() * (CONFIG.world.width - 100) + 50;
        const y = Math.random() * (CONFIG.world.height - 100) + 50;

        // 确保不在出生点附近
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
    // 摄像机跟随玩家，让玩家始终在屏幕中心
    game.camera.x = game.player.x - CONFIG.canvas.width / 2;
    game.camera.y = game.player.y - CONFIG.canvas.height / 2;

    // 限制摄像机在世界边界内
    game.camera.x = Math.max(0, Math.min(CONFIG.world.width - CONFIG.canvas.width, game.camera.x));
    game.camera.y = Math.max(0, Math.min(CONFIG.world.height - CONFIG.canvas.height, game.camera.y));
}

// 更新UI
function updateUI() {
    document.getElementById('playerHealth').textContent = Math.max(0, Math.floor(game.player.health));
    document.getElementById('playerMaxHealth').textContent = game.player.maxHealth;
    document.getElementById('playerLevel').textContent = game.player.level;
    document.getElementById('playerExp').textContent = game.player.exp;
    document.getElementById('playerMaxExp').textContent = game.player.maxExp;
    document.getElementById('playerAttack').textContent = game.player.attack;
    document.getElementById('playerSpeed').textContent = game.player.speed.toFixed(1);
    document.getElementById('killCount').textContent = game.killCount;
    document.getElementById('gameTime').textContent = Math.floor(game.gameTime);
}

// 显示升级选择界面
function showLevelUpScreen() {
    const buffOptions = document.getElementById('buffOptions');
    buffOptions.innerHTML = '';

    // 随机选择3个buff
    const availableBuffs = [...BUFFS];
    const selectedBuffs = [];

    for (let i = 0; i < 3 && availableBuffs.length > 0; i++) {
        const index = Math.floor(Math.random() * availableBuffs.length);
        selectedBuffs.push(availableBuffs[index]);
        availableBuffs.splice(index, 1);
    }

    selectedBuffs.forEach(buff => {
        const buffCard = document.createElement('div');
        buffCard.className = 'buff-card';
        buffCard.innerHTML = `
            <div class="buff-icon">${buff.icon}</div>
            <h3>${buff.name}</h3>
            <p>${buff.description}</p>
        `;
        buffCard.onclick = () => selectBuff(buff);
        buffOptions.appendChild(buffCard);
    });

    document.getElementById('levelUpScreen').classList.remove('hidden');
}

// 选择buff
function selectBuff(buff) {
    buff.apply(game.player);
    document.getElementById('levelUpScreen').classList.add('hidden');
    game.state = 'playing';
}

// 游戏结束
function gameOver() {
    game.state = 'gameover';
    document.getElementById('finalTime').textContent = Math.floor(game.gameTime);
    document.getElementById('finalKills').textContent = game.killCount;
    document.getElementById('finalLevel').textContent = game.player.level;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

// 游戏循环
function gameLoop(timestamp) {
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

        // 投射物击中检测
        game.projectiles.forEach(projectile => {
            game.enemies.forEach(enemy => {
                const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
                if (dist < enemy.size && !projectile.hit) {
                    enemy.health -= projectile.damage;
                    projectile.hit = true; // 标记已击中

                    // 击中特效
                    for (let i = 0; i < 5; i++) {
                        game.particles.push(new Particle(enemy.x, enemy.y, projectile.color));
                    }

                    // 检查击杀
                    if (enemy.health <= 0) {
                        game.player.gainExp(enemy.expValue);
                        game.killCount++;

                        // 死亡粒子效果
                        for (let i = 0; i < 10; i++) {
                            game.particles.push(new Particle(enemy.x, enemy.y, enemy.color));
                        }

                        // 吸血效果
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

        // 清理距离玩家太远的敌人（优化性能）
        game.enemies = game.enemies.filter(enemy => {
            const dist = Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y);
            return dist < Math.max(CONFIG.canvas.width, CONFIG.canvas.height) * 2;
        });

        // 生成敌人
        spawnEnemies();

        // 更新UI
        updateUI();
    }

    // 绘制（即使不在playing状态也绘制，保持画布清晰）
    if (game.state === 'playing' || game.state === 'levelup') {
        // 清空画布
        game.ctx.fillStyle = '#1a1a2e';
        game.ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

        // 保存当前状态
        game.ctx.save();

        // 应用摄像机变换
        game.ctx.translate(-game.camera.x, -game.camera.y);

        // 绘制世界网格背景
        game.ctx.strokeStyle = '#2a2a3e';
        game.ctx.lineWidth = 1;

        // 只绘制可见区域的网格
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

        // 绘制障碍物（先绘制草丛，后绘制石头）
        game.obstacles.filter(o => o.type === 'bush').forEach(obstacle => obstacle.draw(game.ctx));
        game.obstacles.filter(o => o.type === 'rock').forEach(obstacle => obstacle.draw(game.ctx));

        // 绘制粒子
        game.particles.forEach(particle => particle.draw(game.ctx));

        // 绘制投射物
        game.projectiles.forEach(projectile => projectile.draw(game.ctx));

        // 绘制玩家和敌人
        game.enemies.forEach(enemy => enemy.draw(game.ctx));
        game.player.draw(game.ctx);

        // 恢复状态
        game.ctx.restore();

        // 绘制小地图（在屏幕空间，不受摄像机影响）
        drawMinimap();
    }

    requestAnimationFrame(gameLoop);
}

// 绘制小地图
function drawMinimap() {
    const minimapSize = 150;
    const minimapX = CONFIG.canvas.width - minimapSize - 20;
    const minimapY = 20;
    const scaleX = minimapSize / CONFIG.world.width;
    const scaleY = minimapSize / CONFIG.world.height;

    // 半透明背景
    game.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    game.ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);

    // 边框
    game.ctx.strokeStyle = '#fff';
    game.ctx.lineWidth = 2;
    game.ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize);

    // 绘制玩家位置
    const playerMinimapX = minimapX + game.player.x * scaleX;
    const playerMinimapY = minimapY + game.player.y * scaleY;

    game.ctx.fillStyle = game.player.color;
    game.ctx.beginPath();
    game.ctx.arc(playerMinimapX, playerMinimapY, 3, 0, Math.PI * 2);
    game.ctx.fill();

    // 绘制敌人位置
    game.enemies.forEach(enemy => {
        const enemyMinimapX = minimapX + enemy.x * scaleX;
        const enemyMinimapY = minimapY + enemy.y * scaleY;

        game.ctx.fillStyle = enemy.color;
        game.ctx.fillRect(enemyMinimapX - 1, enemyMinimapY - 1, 2, 2);
    });

    // 绘制可视区域
    const viewX = minimapX + game.camera.x * scaleX;
    const viewY = minimapY + game.camera.y * scaleY;
    const viewW = CONFIG.canvas.width * scaleX;
    const viewH = CONFIG.canvas.height * scaleY;

    game.ctx.strokeStyle = '#00ff00';
    game.ctx.lineWidth = 1;
    game.ctx.strokeRect(viewX, viewY, viewW, viewH);
}

// 初始化游戏
function initGame() {
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');
    game.canvas.width = CONFIG.canvas.width;
    game.canvas.height = CONFIG.canvas.height;

    // 键盘事件
    window.addEventListener('keydown', (e) => {
        game.keys[e.key] = true;
    });

    window.addEventListener('keyup', (e) => {
        game.keys[e.key] = false;
    });

    // 职业选择
    document.querySelectorAll('.class-card').forEach(card => {
        card.addEventListener('click', () => {
            game.selectedClass = card.dataset.class;
            startGame();
        });
    });

    // 重新开始按钮
    document.getElementById('restartBtn').addEventListener('click', () => {
        location.reload();
    });
}

// 开始游戏
function startGame() {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');

    // 生成障碍物
    generateObstacles();

    game.player = new Player(game.selectedClass);
    game.enemies = [];
    game.particles = [];
    game.projectiles = [];
    game.killCount = 0;
    game.gameTime = 0;
    game.lastTime = 0; // 重置时间戳
    game.lastSpawnTime = Date.now();
    game.spawnInterval = CONFIG.enemy.spawnInterval;
    game.state = 'playing';

    // 启动游戏循环
    requestAnimationFrame(gameLoop);
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', initGame);
