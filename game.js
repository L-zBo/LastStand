// 游戏配置
const CONFIG = {
    canvas: {
        width: 800,
        height: 600
    },
    player: {
        size: 20
    },
    enemy: {
        size: 15,
        spawnInterval: 2000, // 2秒生成一波
        spawnRate: 3 // 每波生成3个
    }
};

// 职业配置
const CLASSES = {
    warrior: {
        name: '战士',
        health: 150,
        attack: 15,
        speed: 3,
        color: '#ff6b6b'
    },
    mage: {
        name: '法师',
        health: 80,
        attack: 25,
        speed: 3.5,
        color: '#4ecdc4'
    },
    assassin: {
        name: '刺客',
        health: 100,
        attack: 20,
        speed: 5,
        color: '#95e1d3'
    },
    ranger: {
        name: '游侠',
        health: 110,
        attack: 18,
        speed: 4,
        color: '#f38181'
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
    keys: {},
    lastTime: 0,
    gameTime: 0,
    killCount: 0,
    selectedClass: null,
    lastSpawnTime: 0,
    spawnInterval: CONFIG.enemy.spawnInterval,
    spawnRate: CONFIG.enemy.spawnRate
};

// 玩家类
class Player {
    constructor(classType) {
        const classConfig = CLASSES[classType];
        this.x = CONFIG.canvas.width / 2;
        this.y = CONFIG.canvas.height / 2;
        this.size = CONFIG.player.size;
        this.health = classConfig.health;
        this.maxHealth = classConfig.health;
        this.attack = classConfig.attack;
        this.speed = classConfig.speed;
        this.color = classConfig.color;
        this.classType = classType;
        this.level = 1;
        this.exp = 0;
        this.maxExp = 100;
        this.expMultiplier = 1;
        this.attackRange = 40;
        this.critChance = 0;
        this.vampireHeal = 0;
        this.multiShot = 1;
        this.lastAttackTime = 0;
        this.attackCooldown = 500; // 0.5秒攻击间隔
    }

    update(deltaTime) {
        // 移动
        let dx = 0, dy = 0;
        if (game.keys['ArrowLeft'] || game.keys['a']) dx -= 1;
        if (game.keys['ArrowRight'] || game.keys['d']) dx += 1;
        if (game.keys['ArrowUp'] || game.keys['w']) dy -= 1;
        if (game.keys['ArrowDown'] || game.keys['s']) dy += 1;

        // 归一化对角线移动
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        this.x += dx * this.speed;
        this.y += dy * this.speed;

        // 边界限制
        this.x = Math.max(this.size, Math.min(CONFIG.canvas.width - this.size, this.x));
        this.y = Math.max(this.size, Math.min(CONFIG.canvas.height - this.size, this.y));

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

                // 暴击判定
                if (Math.random() < this.critChance) {
                    damage *= 2;
                }

                enemy.health -= damage;

                // 如果敌人死亡
                if (enemy.health <= 0) {
                    this.gainExp(enemy.expValue);
                    game.killCount++;

                    // 吸血效果
                    if (this.vampireHeal > 0) {
                        this.health = Math.min(this.health + this.vampireHeal, this.maxHealth);
                    }
                }
            });

            this.lastAttackTime = now;
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
        // 绘制玩家
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // 绘制攻击范围（半透明）
        ctx.strokeStyle = this.color + '30';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.attackRange, 0, Math.PI * 2);
        ctx.stroke();

        // 绘制生命条
        const barWidth = 40;
        const barHeight = 5;
        const healthPercent = this.health / this.maxHealth;

        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barWidth/2, this.y - this.size - 10, barWidth, barHeight);

        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - barWidth/2, this.y - this.size - 10, barWidth * healthPercent, barHeight);
    }
}

// 敌人类
class Enemy {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.size = CONFIG.enemy.size;
        this.type = type;

        // 根据类型设置属性
        if (type === 'normal') {
            this.health = 30;
            this.maxHealth = 30;
            this.speed = 1.5;
            this.damage = 10;
            this.expValue = 20;
            this.color = '#ff4757';
        } else if (type === 'fast') {
            this.health = 20;
            this.maxHealth = 20;
            this.speed = 3;
            this.damage = 8;
            this.expValue = 15;
            this.color = '#ffa502';
        } else if (type === 'tank') {
            this.health = 60;
            this.maxHealth = 60;
            this.speed = 1;
            this.damage = 15;
            this.expValue = 30;
            this.color = '#2ed573';
        }
    }

    update() {
        // 追踪玩家
        const dx = game.player.x - this.x;
        const dy = game.player.y - this.y;
        const distance = Math.hypot(dx, dy);

        if (distance > 0) {
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
        // 绘制敌人
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // 绘制生命条
        if (this.health < this.maxHealth) {
            const barWidth = 30;
            const barHeight = 4;
            const healthPercent = this.health / this.maxHealth;

            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - barWidth/2, this.y - this.size - 8, barWidth, barHeight);

            ctx.fillStyle = '#ff4757';
            ctx.fillRect(this.x - barWidth/2, this.y - this.size - 8, barWidth * healthPercent, barHeight);
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

            // 从屏幕边缘随机位置生成
            switch(side) {
                case 0: // 上
                    x = Math.random() * CONFIG.canvas.width;
                    y = -20;
                    break;
                case 1: // 右
                    x = CONFIG.canvas.width + 20;
                    y = Math.random() * CONFIG.canvas.height;
                    break;
                case 2: // 下
                    x = Math.random() * CONFIG.canvas.width;
                    y = CONFIG.canvas.height + 20;
                    break;
                case 3: // 左
                    x = -20;
                    y = Math.random() * CONFIG.canvas.height;
                    break;
            }

            // 随机敌人类型
            let type = 'normal';
            const rand = Math.random();
            if (rand > 0.7) type = 'fast';
            else if (rand > 0.85) type = 'tank';

            game.enemies.push(new Enemy(x, y, type));
        }

        game.lastSpawnTime = now;

        // 随时间降低生成间隔（增加难度）
        game.spawnInterval = Math.max(1000, CONFIG.enemy.spawnInterval - timeFactor * 50);
    }
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

        // 移除死亡的敌人
        game.enemies = game.enemies.filter(enemy => enemy.health > 0);

        // 生成敌人
        spawnEnemies();

        // 绘制
        game.ctx.fillStyle = '#1a1a2e';
        game.ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

        game.player.draw(game.ctx);
        game.enemies.forEach(enemy => enemy.draw(game.ctx));

        // 更新UI
        updateUI();
    }

    requestAnimationFrame(gameLoop);
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

    game.player = new Player(game.selectedClass);
    game.enemies = [];
    game.killCount = 0;
    game.gameTime = 0;
    game.lastSpawnTime = Date.now();
    game.state = 'playing';

    gameLoop();
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', initGame);
