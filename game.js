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
        size: 18
    },
    obstacles: {
        rockCount: 80,
        bushCount: 100
    },
    wave: {
        baseEnemyCount: 5,      // 每波基础敌人数
        enemyIncrement: 2,      // 每波增加的敌人
        timeBetweenSpawns: 800, // 每个敌人生成间隔（毫秒）
        timeBetweenWaves: 3000, // 波次间休息时间
        bossWaveInterval: 10    // 每10波出Boss
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
        attackType: 'melee',
        attackRange: 50
    },
    mage: {
        name: '法师',
        health: 80,
        attack: 25,
        speed: 3.5,
        color: '#4ecdc4',
        sprite: '🧙',
        attackType: 'magic',
        attackRange: 150
    },
    assassin: {
        name: '刺客',
        health: 100,
        attack: 20,
        speed: 5,
        color: '#95e1d3',
        sprite: '🥷',
        attackType: 'melee',
        attackRange: 45
    },
    ranger: {
        name: '游侠',
        health: 110,
        attack: 18,
        speed: 4,
        color: '#f38181',
        sprite: '🏹',
        attackType: 'ranged',
        attackRange: 200
    },
    summoner: {
        name: '召唤师',
        health: 90,
        attack: 12,
        speed: 3.2,
        color: '#9b59b6',
        sprite: '🔮',
        attackType: 'summon',
        attackRange: 180,
        maxSummons: 3
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
    },
    {
        id: 'attackSpeedUp',
        name: '疾风',
        description: '攻击速度 +20%',
        icon: '⚡',
        apply: (player) => player.attackCooldown = Math.max(100, player.attackCooldown * 0.8)
    },
    {
        id: 'critDamage',
        name: '暴击伤害',
        description: '暴击伤害 +50%',
        icon: '💢',
        apply: (player) => player.critDamage = (player.critDamage || 2) + 0.5
    },
    {
        id: 'healthRegen',
        name: '生命恢复',
        description: '每秒恢复 2 生命',
        icon: '💖',
        apply: (player) => player.healthRegen = (player.healthRegen || 0) + 2
    }
];

// 武器配置
const WEAPONS = {
    // 基础武器
    sword: {
        id: 'sword',
        name: '短剑',
        description: '基础近战武器',
        icon: '🗡️',
        level: 1,
        maxLevel: 5,
        damage: 5,
        type: 'melee',
        evolvesWith: 'shield',
        evolvesTo: 'holyBlade'
    },
    dagger: {
        id: 'dagger',
        name: '匕首',
        description: '快速攻击',
        icon: '🔪',
        level: 1,
        maxLevel: 5,
        damage: 3,
        attackSpeed: 0.3,
        type: 'melee',
        evolvesWith: 'cloak',
        evolvesTo: 'shadowBlade'
    },
    bow: {
        id: 'bow',
        name: '短弓',
        description: '远程攻击',
        icon: '🏹',
        level: 1,
        maxLevel: 5,
        damage: 4,
        type: 'ranged',
        evolvesWith: 'quiver',
        evolvesTo: 'phoenixBow'
    },
    staff: {
        id: 'staff',
        name: '法杖',
        description: '魔法攻击',
        icon: '🪄',
        level: 1,
        maxLevel: 5,
        damage: 6,
        type: 'magic',
        evolvesWith: 'tome',
        evolvesTo: 'arcaneStaff'
    },
    axe: {
        id: 'axe',
        name: '战斧',
        description: '高伤害近战',
        icon: '🪓',
        level: 1,
        maxLevel: 5,
        damage: 8,
        type: 'melee',
        evolvesWith: 'gauntlet',
        evolvesTo: 'bloodAxe'
    },
    fireball: {
        id: 'fireball',
        name: '火球术',
        description: '发射火球',
        icon: '🔥',
        level: 1,
        maxLevel: 5,
        damage: 7,
        type: 'magic',
        evolvesWith: 'ember',
        evolvesTo: 'inferno'
    },
    // 辅助装备（用于合成）
    shield: {
        id: 'shield',
        name: '盾牌',
        description: '防御 +10',
        icon: '🛡️',
        level: 1,
        maxLevel: 5,
        defense: 10,
        type: 'accessory'
    },
    cloak: {
        id: 'cloak',
        name: '斗篷',
        description: '移动速度 +10%',
        icon: '🧥',
        level: 1,
        maxLevel: 5,
        speedBonus: 0.1,
        type: 'accessory'
    },
    quiver: {
        id: 'quiver',
        name: '箭袋',
        description: '攻击速度 +15%',
        icon: '🎯',
        level: 1,
        maxLevel: 5,
        attackSpeedBonus: 0.15,
        type: 'accessory'
    },
    tome: {
        id: 'tome',
        name: '魔法书',
        description: '魔法伤害 +20%',
        icon: '📖',
        level: 1,
        maxLevel: 5,
        magicBonus: 0.2,
        type: 'accessory'
    },
    gauntlet: {
        id: 'gauntlet',
        name: '拳套',
        description: '攻击力 +5',
        icon: '🥊',
        level: 1,
        maxLevel: 5,
        attackBonus: 5,
        type: 'accessory'
    },
    ember: {
        id: 'ember',
        name: '余烬',
        description: '火焰伤害 +15%',
        icon: '✨',
        level: 1,
        maxLevel: 5,
        fireBonus: 0.15,
        type: 'accessory'
    },
    // 进化武器（满级合成后）
    holyBlade: {
        id: 'holyBlade',
        name: '圣光之剑',
        description: '神圣攻击，对敌人造成额外伤害',
        icon: '⚔️',
        damage: 25,
        type: 'evolved',
        special: '攻击附带圣光爆发'
    },
    shadowBlade: {
        id: 'shadowBlade',
        name: '暗影之刃',
        description: '极速暗影攻击',
        icon: '🌙',
        damage: 15,
        attackSpeed: 0.5,
        type: 'evolved',
        special: '攻击有几率造成双倍伤害'
    },
    phoenixBow: {
        id: 'phoenixBow',
        name: '凤凰弓',
        description: '发射追踪火焰箭',
        icon: '🔥',
        damage: 20,
        type: 'evolved',
        special: '箭矢自动追踪敌人'
    },
    arcaneStaff: {
        id: 'arcaneStaff',
        name: '奥术法杖',
        description: '强力魔法攻击',
        icon: '🔮',
        damage: 30,
        type: 'evolved',
        special: '魔法弹会弹射'
    },
    bloodAxe: {
        id: 'bloodAxe',
        name: '嗜血战斧',
        description: '每次攻击吸取生命',
        icon: '🪓',
        damage: 35,
        type: 'evolved',
        special: '造成伤害的10%转化为生命'
    },
    inferno: {
        id: 'inferno',
        name: '炼狱之火',
        description: '召唤火焰风暴',
        icon: '🌋',
        damage: 40,
        type: 'evolved',
        special: '对范围内所有敌人造成持续伤害'
    }
};

// 游戏状态
let game = {
    state: 'start', // start, playing, levelup, waveComplete, gameover
    canvas: null,
    ctx: null,
    player: null,
    enemies: [],
    particles: [],
    projectiles: [],
    weaponProjectiles: [],
    summons: [], // 召唤物
    obstacles: [],
    keys: {},
    lastTime: 0,
    gameTime: 0,
    killCount: 0,
    selectedClass: null,
    camera: { x: 0, y: 0 },
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

// 粒子类（用于视觉效果）
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 0.8; // 减少生命周期（1 -> 0.8）
        this.decay = 0.04; // 加快消失速度（0.02 -> 0.04）
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
            // 绘制魔法弹（移除阴影效果以提升性能）
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    isDead() {
        return this.distance >= this.maxDistance;
    }
}

// 召唤物类
class Summon {
    constructor(x, y, owner) {
        this.x = x;
        this.y = y;
        this.owner = owner;
        this.size = 15;
        this.health = 50 + owner.level * 10;
        this.maxHealth = this.health;
        this.attack = owner.attack * 0.5;
        this.speed = 3;
        this.attackRange = 60;
        this.attackCooldown = 800;
        this.lastAttackTime = 0;
        this.color = '#9b59b6';
        this.sprite = '👻';
        this.lifeTime = 30000; // 30秒存活时间
        this.spawnTime = Date.now();
    }

    update() {
        // 检查存活时间
        if (Date.now() - this.spawnTime > this.lifeTime) {
            this.health = 0;
            return;
        }

        // 找最近的敌人
        let target = null;
        let minDist = Infinity;
        game.enemies.forEach(enemy => {
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist < minDist) {
                minDist = dist;
                target = enemy;
            }
        });

        // 移动向敌人
        if (target) {
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.hypot(dx, dy);

            if (dist > this.attackRange) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            } else {
                // 攻击
                const now = Date.now();
                if (now - this.lastAttackTime >= this.attackCooldown) {
                    target.health -= this.attack;
                    this.lastAttackTime = now;

                    // 粒子效果
                    for (let i = 0; i < 2; i++) {
                        game.particles.push(new Particle(target.x, target.y, this.color));
                    }

                    // 检查击杀
                    if (target.health <= 0) {
                        game.player.gainExp(target.expValue);
                        game.killCount++;
                    }
                }
            }
        } else {
            // 没有敌人时跟随玩家
            const dx = this.owner.x - this.x;
            const dy = this.owner.y - this.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 100) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
        }

        // 边界限制
        this.x = Math.max(this.size, Math.min(CONFIG.world.width - this.size, this.x));
        this.y = Math.max(this.size, Math.min(CONFIG.world.height - this.size, this.y));
    }

    draw(ctx) {
        // 绘制召唤物
        ctx.font = `${this.size * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.sprite, this.x, this.y);

        // 绘制生命条
        const barWidth = 25;
        const barHeight = 4;
        const healthPercent = this.health / this.maxHealth;

        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barWidth/2, this.y - this.size - 10, barWidth, barHeight);

        ctx.fillStyle = '#9b59b6';
        ctx.fillRect(this.x - barWidth/2, this.y - this.size - 10, barWidth * healthPercent, barHeight);
    }

    isDead() {
        return this.health <= 0;
    }
}

// 武器投射物类
class WeaponProjectile {
    constructor(x, y, targetX, targetY, weapon, player) {
        this.x = x;
        this.y = y;
        this.weapon = weapon;
        this.player = player;
        this.damage = weapon.damage * (weapon.level || 1) + player.attack * 0.2;
        this.hit = false;
        this.hitEnemies = [];

        switch(weapon.id) {
            case 'sword':
            case 'holyBlade':
                this.type = 'slash';
                this.size = 60;
                this.duration = 200;
                this.startTime = Date.now();
                this.angle = Math.atan2(targetY - y, targetX - x);
                break;
            case 'dagger':
            case 'shadowBlade':
                this.type = 'stab';
                this.size = 40;
                this.duration = 150;
                this.startTime = Date.now();
                this.angle = Math.atan2(targetY - y, targetX - x);
                break;
            case 'axe':
            case 'bloodAxe':
                this.type = 'spin';
                this.size = 80;
                this.duration = 300;
                this.startTime = Date.now();
                this.rotation = 0;
                break;
            case 'bow':
            case 'phoenixBow':
                this.type = 'arrow';
                this.speed = 10;
                this.size = 8;
                const angle1 = Math.atan2(targetY - y, targetX - x);
                this.vx = Math.cos(angle1) * this.speed;
                this.vy = Math.sin(angle1) * this.speed;
                this.rotation = angle1;
                this.distance = 0;
                this.maxDistance = 500;
                this.tracking = weapon.id === 'phoenixBow';
                break;
            case 'staff':
            case 'arcaneStaff':
                this.type = 'magic';
                this.speed = 7;
                this.size = 12;
                const angle2 = Math.atan2(targetY - y, targetX - x);
                this.vx = Math.cos(angle2) * this.speed;
                this.vy = Math.sin(angle2) * this.speed;
                this.distance = 0;
                this.maxDistance = 400;
                this.bounce = weapon.id === 'arcaneStaff' ? 3 : 0;
                break;
            case 'fireball':
            case 'inferno':
                this.type = 'fireball';
                this.speed = 6;
                this.size = weapon.id === 'inferno' ? 25 : 15;
                const angle3 = Math.atan2(targetY - y, targetX - x);
                this.vx = Math.cos(angle3) * this.speed;
                this.vy = Math.sin(angle3) * this.speed;
                this.distance = 0;
                this.maxDistance = 350;
                this.aoe = weapon.id === 'inferno';
                break;
            default:
                this.type = 'slash';
                this.size = 50;
                this.duration = 200;
                this.startTime = Date.now();
                this.angle = Math.atan2(targetY - y, targetX - x);
        }
    }

    update() {
        switch(this.type) {
            case 'spin':
                this.rotation += 0.3;
                break;
            case 'arrow':
                if (this.tracking && game.enemies.length > 0) {
                    const nearest = game.enemies.reduce((closest, enemy) => {
                        const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                        return dist < closest.dist ? { enemy, dist } : closest;
                    }, { enemy: null, dist: Infinity });
                    if (nearest.enemy && nearest.dist < 300) {
                        const targetAngle = Math.atan2(nearest.enemy.y - this.y, nearest.enemy.x - this.x);
                        const angleDiff = targetAngle - this.rotation;
                        this.rotation += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 0.1);
                        this.vx = Math.cos(this.rotation) * this.speed;
                        this.vy = Math.sin(this.rotation) * this.speed;
                    }
                }
                this.x += this.vx;
                this.y += this.vy;
                this.distance += this.speed;
                break;
            case 'magic':
            case 'fireball':
                this.x += this.vx;
                this.y += this.vy;
                this.distance += this.speed;
                break;
        }
    }

    draw(ctx) {
        ctx.save();
        switch(this.type) {
            case 'slash':
                ctx.translate(this.player.x, this.player.y);
                ctx.rotate(this.angle);
                ctx.strokeStyle = this.weapon.id === 'holyBlade' ? '#ffd700' : '#fff';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(0, 0, this.size, -0.8, 0.8);
                ctx.stroke();
                break;
            case 'stab':
                ctx.translate(this.player.x, this.player.y);
                ctx.rotate(this.angle);
                ctx.fillStyle = this.weapon.id === 'shadowBlade' ? '#9b59b6' : '#c0c0c0';
                ctx.fillRect(10, -3, this.size, 6);
                break;
            case 'spin':
                ctx.translate(this.player.x, this.player.y);
                ctx.rotate(this.rotation);
                ctx.strokeStyle = this.weapon.id === 'bloodAxe' ? '#e74c3c' : '#c0c0c0';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(-this.size/2, 0);
                ctx.lineTo(this.size/2, 0);
                ctx.stroke();
                break;
            case 'arrow':
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.fillStyle = this.weapon.id === 'phoenixBow' ? '#ff6b35' : '#8B4513';
                ctx.beginPath();
                ctx.moveTo(12, 0);
                ctx.lineTo(-8, -5);
                ctx.lineTo(-8, 5);
                ctx.fill();
                break;
            case 'magic':
                ctx.fillStyle = this.weapon.id === 'arcaneStaff' ? '#9b59b6' : '#4ecdc4';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'fireball':
                ctx.fillStyle = this.weapon.id === 'inferno' ? '#ff4500' : '#ff6b35';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        ctx.restore();
    }

    isDead() {
        const now = Date.now();
        switch(this.type) {
            case 'slash':
            case 'stab':
            case 'spin':
                return now - this.startTime >= this.duration;
            case 'arrow':
            case 'magic':
            case 'fireball':
                return this.distance >= this.maxDistance || this.hit;
            default:
                return true;
        }
    }

    checkHit(enemy) {
        if (this.hitEnemies.includes(enemy)) return false;
        switch(this.type) {
            case 'slash':
            case 'spin':
                const distToPlayer = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
                if (distToPlayer < this.size + enemy.size) {
                    this.hitEnemies.push(enemy);
                    return true;
                }
                break;
            case 'stab':
                const dx = enemy.x - this.player.x;
                const dy = enemy.y - this.player.y;
                const dist = Math.hypot(dx, dy);
                const enemyAngle = Math.atan2(dy, dx);
                const angleDiff = Math.abs(enemyAngle - this.angle);
                if (dist < this.size + 20 && angleDiff < 0.5) {
                    this.hitEnemies.push(enemy);
                    return true;
                }
                break;
            case 'arrow':
            case 'magic':
            case 'fireball':
                const projDist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (projDist < this.size + enemy.size) {
                    if (this.aoe) {
                        this.hitEnemies.push(enemy);
                        return true;
                    }
                    if (this.bounce > 0) {
                        this.bounce--;
                        this.hitEnemies.push(enemy);
                        const nextTarget = game.enemies.find(e => !this.hitEnemies.includes(e));
                        if (nextTarget) {
                            const newAngle = Math.atan2(nextTarget.y - this.y, nextTarget.x - this.x);
                            this.vx = Math.cos(newAngle) * this.speed;
                            this.vy = Math.sin(newAngle) * this.speed;
                            this.distance = 0;
                        }
                        return true;
                    }
                    this.hit = true;
                    return true;
                }
                break;
        }
        return false;
    }
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
        this.critDamage = 2; // 默认暴击伤害2倍
        this.vampireHeal = 0;
        this.multiShot = 1;
        this.lastAttackTime = 0;
        this.attackCooldown = 500; // 0.5秒攻击间隔
        this.inBush = false; // 是否在草丛中
        this.hidden = false; // 是否隐身
        this.healthRegen = 0; // 每秒生命恢复
        this.lastRegenTime = Date.now();

        // 武器系统
        this.weapons = [];
        this.maxWeapons = 6;

        // 召唤师系统
        this.maxSummons = classConfig.maxSummons || 0;
        this.lastSummonTime = 0;
        this.summonCooldown = 5000; // 5秒召唤间隔
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

        // 只检查附近的障碍物（性能优化）
        const nearbyObstacles = game.obstacles.filter(obstacle => {
            const dist = Math.hypot(obstacle.x - this.x, obstacle.y - this.y);
            return dist < 200; // 只检查200像素内的障碍物
        });

        // 检查与石头的碰撞
        let canMove = true;
        for (const obstacle of nearbyObstacles) {
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

        // 检查是否在草丛中（只检查附近的障碍物）
        this.inBush = false;
        for (const obstacle of nearbyObstacles) {
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

        // 生命恢复
        const now = Date.now();
        if (this.healthRegen > 0 && now - this.lastRegenTime >= 1000) {
            this.health = Math.min(this.health + this.healthRegen, this.maxHealth);
            this.lastRegenTime = now;
        }

        // 更新摄像机位置（平滑跟随）
        updateCamera();

        // 自动攻击最近的敌人
        this.autoAttack();
    }

    autoAttack() {
        const now = Date.now();

        // 召唤师召唤逻辑
        if (this.attackType === 'summon') {
            // 自动召唤
            if (game.summons.length < this.maxSummons && now - this.lastSummonTime >= this.summonCooldown) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 50 + Math.random() * 30;
                const summonX = this.x + Math.cos(angle) * dist;
                const summonY = this.y + Math.sin(angle) * dist;
                game.summons.push(new Summon(summonX, summonY, this));
                this.lastSummonTime = now;

                // 召唤特效
                for (let i = 0; i < 5; i++) {
                    game.particles.push(new Particle(summonX, summonY, this.color));
                }
            }

            // 召唤师也可以发射魔法弹攻击
            if (now - this.lastAttackTime < this.attackCooldown) return;

            const enemiesInRange = game.enemies
                .map(enemy => ({
                    enemy,
                    distance: Math.hypot(enemy.x - this.x, enemy.y - this.y)
                }))
                .filter(e => e.distance <= this.attackRange)
                .sort((a, b) => a.distance - b.distance);

            if (enemiesInRange.length > 0) {
                const { enemy } = enemiesInRange[0];
                const damage = this.attack;

                game.projectiles.push(new Projectile(
                    this.x, this.y,
                    enemy.x, enemy.y,
                    damage,
                    'magic',
                    this.color
                ));

                this.lastAttackTime = now;
            }
            return;
        }

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

                // 计算武器加成伤害
                this.weapons.forEach(weapon => {
                    damage += weapon.damage * weapon.level;
                });

                // 暴击判定（使用critDamage属性）
                if (Math.random() < this.critChance) {
                    damage *= this.critDamage;
                    isCrit = true;
                }

                // 根据攻击类型处理
                if (this.attackType === 'melee') {
                    // 近战：直接造成伤害
                    enemy.health -= damage;

                    // 减少近战特效粒子（5 -> 3）
                    for (let i = 0; i < 3; i++) {
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

                    // 减少死亡粒子效果（10 -> 6）
                    for (let i = 0; i < 6; i++) {
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

    // 添加武器
    addWeapon(weaponId) {
        const existingWeapon = this.weapons.find(w => w.id === weaponId);
        if (existingWeapon) {
            // 已有该武器，升级
            if (existingWeapon.level < existingWeapon.maxLevel) {
                existingWeapon.level++;
                // 检查是否可以进化
                this.checkWeaponEvolution(existingWeapon);
            }
        } else if (this.weapons.length < this.maxWeapons) {
            // 新武器
            const weaponData = WEAPONS[weaponId];
            this.weapons.push({
                ...weaponData,
                level: 1
            });
        }
    }

    // 检查武器进化
    checkWeaponEvolution(weapon) {
        if (weapon.level >= weapon.maxLevel && weapon.evolvesWith) {
            const partnerWeapon = this.weapons.find(w => w.id === weapon.evolvesWith && w.level >= w.maxLevel);
            if (partnerWeapon) {
                // 可以进化！
                this.evolveWeapon(weapon, partnerWeapon);
            }
        }
    }

    // 武器进化
    evolveWeapon(weapon1, weapon2) {
        const evolvedWeaponId = weapon1.evolvesTo;
        const evolvedWeaponData = WEAPONS[evolvedWeaponId];

        // 移除原来的两个武器
        this.weapons = this.weapons.filter(w => w.id !== weapon1.id && w.id !== weapon2.id);

        // 添加进化后的武器
        this.weapons.push({
            ...evolvedWeaponData,
            level: 1
        });

        // 显示进化提示
        showEvolutionNotification(weapon1.name, weapon2.name, evolvedWeaponData.name, evolvedWeaponData.icon);
    }

    draw(ctx) {
        // 如果隐身，设置半透明
        if (this.hidden) {
            ctx.globalAlpha = 0.3;
        }

        // 绘制玩家精灵（移除阴影效果以提升性能）
        ctx.font = `${this.size * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.sprite, this.x, this.y);

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
        this.isBoss = false;

        // 波数增强系数（每波增加5%属性）
        const waveMultiplier = 1 + (game.wave.current - 1) * 0.05;

        // 根据类型设置属性
        if (type === 'normal') {
            this.health = Math.floor(30 * waveMultiplier);
            this.maxHealth = this.health;
            this.speed = Math.min(1.5 + (game.wave.current - 1) * 0.02, 3);
            this.damage = Math.floor(10 * waveMultiplier);
            this.expValue = Math.floor(20 * waveMultiplier);
            this.color = '#ff4757';
            this.sprite = '👾';
        } else if (type === 'fast') {
            this.health = Math.floor(20 * waveMultiplier);
            this.maxHealth = this.health;
            this.speed = Math.min(3 + (game.wave.current - 1) * 0.03, 5);
            this.damage = Math.floor(8 * waveMultiplier);
            this.expValue = Math.floor(15 * waveMultiplier);
            this.color = '#ffa502';
            this.sprite = '⚡';
        } else if (type === 'tank') {
            this.health = Math.floor(60 * waveMultiplier);
            this.maxHealth = this.health;
            this.speed = Math.min(1 + (game.wave.current - 1) * 0.01, 2);
            this.damage = Math.floor(15 * waveMultiplier);
            this.expValue = Math.floor(30 * waveMultiplier);
            this.color = '#2ed573';
            this.sprite = '💀';
        } else if (type === 'elite') {
            this.health = Math.floor(100 * waveMultiplier);
            this.maxHealth = this.health;
            this.speed = Math.min(2 + (game.wave.current - 1) * 0.02, 3.5);
            this.damage = Math.floor(20 * waveMultiplier);
            this.expValue = Math.floor(50 * waveMultiplier);
            this.color = '#ff6348';
            this.sprite = '👹';
            this.isElite = true;
            this.size = CONFIG.enemy.size * 1.5;
        } else if (type === 'boss') {
            // Boss属性根据波数增强
            const bossLevel = Math.floor(game.wave.current / 10);
            this.health = Math.floor((500 + bossLevel * 200) * waveMultiplier);
            this.maxHealth = this.health;
            this.speed = 1.2;
            this.damage = 30 + bossLevel * 10;
            this.expValue = 200 + bossLevel * 50;
            this.color = '#9b59b6';
            this.sprite = '👿';
            this.isBoss = true;
            this.isElite = true;
            this.size = CONFIG.enemy.size * 2.5;
        }
    }

    update() {
        // 追踪玩家
        const dx = game.player.x - this.x;
        const dy = game.player.y - this.y;
        const distance = Math.hypot(dx, dy);

        // 精英怪和Boss可以看到草丛中的玩家，普通怪看不到
        const canSeePlayer = this.isElite || this.isBoss || !game.player.hidden;

        if (distance > 0 && canSeePlayer) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }

        // 碰撞检测（Boss不会碰撞消失）
        if (distance < this.size + game.player.size) {
            game.player.health -= this.damage;
            if (!this.isBoss) {
                this.health = 0; // 普通敌人碰撞后消失
            }

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

        // Boss特殊光环
        if (this.isBoss) {
            ctx.strokeStyle = '#9b59b6';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 15, 0, Math.PI * 2);
            ctx.stroke();
            // 内圈
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 8, 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.isElite) {
            // 精英怪光环
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 8, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.fillText(this.sprite, this.x, this.y);

        // 绘制生命条
        if (this.health < this.maxHealth) {
            const barWidth = this.isBoss ? 80 : (this.isElite ? 45 : 35);
            const barHeight = this.isBoss ? 8 : 5;
            const healthPercent = this.health / this.maxHealth;

            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - barWidth/2, this.y - this.size - 12, barWidth, barHeight);

            ctx.fillStyle = this.isElite ? '#ff6348' : '#ff4757';
            ctx.fillRect(this.x - barWidth/2, this.y - this.size - 12, barWidth * healthPercent, barHeight);
        }
    }
}

// 获取敌人生成位置
function getSpawnPosition() {
    const side = Math.floor(Math.random() * 4);
    const playerX = game.player.x;
    const playerY = game.player.y;
    const spawnDistance = Math.max(CONFIG.canvas.width, CONFIG.canvas.height) / 2 + 100;
    let x, y;

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

    return { x, y };
}

// 开始新波次
function startNewWave() {
    const wave = game.wave;
    wave.isSpawning = true;
    wave.inBreak = false;
    wave.eliteSpawned = false;
    wave.bossSpawned = false;
    wave.enemiesSpawned = 0;
    wave.waveStartTime = Date.now();

    // 计算本波敌人数量
    wave.totalEnemies = CONFIG.wave.baseEnemyCount + (wave.current - 1) * CONFIG.wave.enemyIncrement;
    wave.enemiesRemaining = wave.totalEnemies;

    // Boss波次额外加敌人
    if (wave.current % CONFIG.wave.bossWaveInterval === 0) {
        wave.totalEnemies += 5;
        wave.enemiesRemaining = wave.totalEnemies;
    }

    // 显示波次提示
    showWaveNotification(wave.current);
}

// 波次敌人生成逻辑
function updateWaveSpawning() {
    const now = Date.now();
    const wave = game.wave;

    // 如果在休息时间
    if (wave.inBreak) {
        if (now - wave.waveStartTime >= CONFIG.wave.timeBetweenWaves) {
            wave.current++;
            startNewWave();
        }
        return;
    }

    // 如果不在生成状态，跳过
    if (!wave.isSpawning) return;

    // 检查是否本波已生成完毕
    if (wave.enemiesSpawned >= wave.totalEnemies) {
        wave.isSpawning = false;
        return;
    }

    // 检查生成间隔
    if (now - wave.lastSpawnTime < CONFIG.wave.timeBetweenSpawns) return;

    // 计算还需要生成多少普通敌人
    const normalEnemiesNeeded = wave.totalEnemies - (wave.current % CONFIG.wave.bossWaveInterval === 0 ? 1 : 0) - 1; // 减去精英和可能的Boss

    // 生成敌人
    const pos = getSpawnPosition();
    let type = 'normal';

    // 最后生成精英怪
    if (wave.enemiesSpawned >= normalEnemiesNeeded && !wave.eliteSpawned) {
        type = 'elite';
        wave.eliteSpawned = true;
    }
    // Boss波次最后生成Boss
    else if (wave.current % CONFIG.wave.bossWaveInterval === 0 &&
             wave.enemiesSpawned >= wave.totalEnemies - 1 && !wave.bossSpawned) {
        type = 'boss';
        wave.bossSpawned = true;
    }
    // 普通敌人随机类型
    else {
        const rand = Math.random();
        if (rand > 0.85) type = 'tank';
        else if (rand > 0.7) type = 'fast';
    }

    game.enemies.push(new Enemy(pos.x, pos.y, type));
    wave.enemiesSpawned++;
    wave.lastSpawnTime = now;
}

// 检查波次完成
function checkWaveComplete() {
    const wave = game.wave;

    // 如果还在生成或休息中，不检查
    if (wave.isSpawning || wave.inBreak) return;

    // 检查是否所有敌人都被消灭
    if (game.enemies.length === 0 && wave.enemiesSpawned >= wave.totalEnemies) {
        // 波次完成！
        wave.inBreak = true;
        wave.waveStartTime = Date.now();

        // 显示波次完成奖励选择
        game.state = 'waveComplete';
        showWaveCompleteScreen();
    }
}

// 显示波次提示
function showWaveNotification(waveNum) {
    const isBossWave = waveNum % CONFIG.wave.bossWaveInterval === 0;
    const notification = document.createElement('div');
    notification.className = 'wave-notification' + (isBossWave ? ' boss-wave' : '');
    notification.innerHTML = `
        <h2>${isBossWave ? 'BOSS 波次!' : '第 ' + waveNum + ' 波'}</h2>
        <p>${isBossWave ? '击败Boss!' : '消灭所有敌人!'}</p>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 2000);
}

// 显示波次完成奖励界面
function showWaveCompleteScreen() {
    const screen = document.getElementById('levelUpScreen');
    const title = document.querySelector('#levelUpScreen h2');
    title.textContent = `第 ${game.wave.current} 波完成!`;

    const buffOptions = document.getElementById('buffOptions');
    buffOptions.innerHTML = '';

    // 随机3个奖励选项（武器或Buff）
    const options = [];

    // 50%武器，50%Buff
    for (let i = 0; i < 3; i++) {
        if (Math.random() > 0.5) {
            // 武器选项
            const weapons = Object.values(WEAPONS).filter(w =>
                w.type !== 'evolved' && w.type !== 'accessory'
            );
            const weapon = weapons[Math.floor(Math.random() * weapons.length)];
            options.push({ type: 'weapon', data: weapon });
        } else {
            // Buff选项
            const buff = BUFFS[Math.floor(Math.random() * BUFFS.length)];
            options.push({ type: 'buff', data: buff });
        }
    }

    options.forEach(option => {
        const card = document.createElement('div');
        card.className = 'buff-card';

        if (option.type === 'weapon') {
            const weapon = option.data;
            const existingWeapon = game.player.weapons.find(w => w.id === weapon.id);
            const level = existingWeapon ? existingWeapon.level : 0;

            card.innerHTML = `
                <span class="buff-icon">${weapon.icon}</span>
                <h3>${weapon.name} ${level > 0 ? 'Lv.' + (level + 1) : ''}</h3>
                <p>${weapon.description}</p>
            `;
            card.onclick = () => {
                game.player.addWeapon(weapon.id);
                document.querySelector('#levelUpScreen h2').textContent = '🎉 升级!';
                screen.classList.add('hidden');
                game.state = 'playing';
                // 波次递增并开始下一波
                game.wave.current++;
                startNewWave();
            };
        } else {
            const buff = option.data;
            card.innerHTML = `
                <span class="buff-icon">${buff.icon}</span>
                <h3>${buff.name}</h3>
                <p>${buff.description}</p>
            `;
            card.onclick = () => {
                buff.apply(game.player);
                document.querySelector('#levelUpScreen h2').textContent = '🎉 升级!';
                screen.classList.add('hidden');
                game.state = 'playing';
                // 波次递增并开始下一波
                game.wave.current++;
                startNewWave();
            };
        }

        buffOptions.appendChild(card);
    });

    screen.classList.remove('hidden');
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
    document.getElementById('waveCount').textContent = game.wave.current;
    document.getElementById('killCount').textContent = game.killCount;
    document.getElementById('gameTime').textContent = Math.floor(game.gameTime);

    // 更新武器栏显示
    updateWeaponBar();
}

// 更新武器栏
function updateWeaponBar() {
    const weaponBar = document.getElementById('weaponBar');
    weaponBar.innerHTML = '';

    // 显示所有武器槽位（最多6个）
    for (let i = 0; i < game.player.maxWeapons; i++) {
        const slot = document.createElement('div');
        slot.className = 'weapon-slot';

        if (game.player.weapons[i]) {
            const weapon = game.player.weapons[i];
            // 进化武器特殊样式
            if (weapon.type === 'evolved') {
                slot.classList.add('evolved');
            }
            slot.innerHTML = `
                <span class="weapon-icon">${weapon.icon}</span>
                ${weapon.level ? `<span class="weapon-level">${weapon.level}</span>` : ''}
            `;
            slot.title = `${weapon.name}\n${weapon.description || weapon.special || ''}`;
        } else {
            slot.innerHTML = '<span class="weapon-empty">+</span>';
        }

        weaponBar.appendChild(slot);
    }
}

// 显示武器进化提示
function showEvolutionNotification(weapon1Name, weapon2Name, evolvedName, evolvedIcon) {
    // 创建提示元素
    const notification = document.createElement('div');
    notification.className = 'evolution-notification';
    notification.innerHTML = `
        <div class="evolution-icon">${evolvedIcon}</div>
        <div class="evolution-text">
            <h3>武器进化!</h3>
            <p>${weapon1Name} + ${weapon2Name}</p>
            <p class="evolved-name">= ${evolvedName}</p>
        </div>
    `;
    document.body.appendChild(notification);

    // 3秒后移除
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 2500);
}

// 显示升级选择界面
function showLevelUpScreen() {
    const buffOptions = document.getElementById('buffOptions');
    buffOptions.innerHTML = '';

    // 50%几率显示武器，50%几率显示Buff
    const showWeapons = Math.random() > 0.5;

    if (showWeapons) {
        // 显示武器选项
        const availableWeapons = Object.values(WEAPONS).filter(w =>
            w.type !== 'evolved' && w.type !== 'accessory'
        );

        // 添加已有武器的升级选项
        const playerWeaponIds = game.player.weapons.map(w => w.id);
        const upgradeableWeapons = game.player.weapons.filter(w => w.level < w.maxLevel);

        // 也显示配件（用于合成）
        const accessories = Object.values(WEAPONS).filter(w => w.type === 'accessory');

        // 合并选项
        let allOptions = [];

        // 添加可升级的武器
        upgradeableWeapons.forEach(w => {
            allOptions.push({
                type: 'upgrade',
                weapon: w,
                name: `${w.name} 升级`,
                description: `Lv.${w.level} → Lv.${w.level + 1}`,
                icon: w.icon
            });
        });

        // 添加新武器
        availableWeapons.filter(w => !playerWeaponIds.includes(w.id)).forEach(w => {
            allOptions.push({
                type: 'new',
                weapon: w,
                name: w.name,
                description: w.description,
                icon: w.icon
            });
        });

        // 添加配件
        accessories.filter(w => !playerWeaponIds.includes(w.id)).forEach(w => {
            allOptions.push({
                type: 'new',
                weapon: w,
                name: w.name,
                description: w.description,
                icon: w.icon
            });
        });

        // 随机选择3个
        const selectedOptions = [];
        for (let i = 0; i < 3 && allOptions.length > 0; i++) {
            const index = Math.floor(Math.random() * allOptions.length);
            selectedOptions.push(allOptions[index]);
            allOptions.splice(index, 1);
        }

        // 如果没有武器选项，显示Buff
        if (selectedOptions.length === 0) {
            showBuffOptions(buffOptions);
            return;
        }

        selectedOptions.forEach(option => {
            const card = document.createElement('div');
            card.className = 'buff-card weapon-card';
            card.innerHTML = `
                <div class="buff-icon">${option.icon}</div>
                <h3>${option.name}</h3>
                <p>${option.description}</p>
            `;
            card.onclick = () => selectWeapon(option);
            buffOptions.appendChild(card);
        });
    } else {
        // 显示Buff选项
        showBuffOptions(buffOptions);
    }

    document.getElementById('levelUpScreen').classList.remove('hidden');
}

// 显示Buff选项
function showBuffOptions(container) {
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
        container.appendChild(buffCard);
    });
}

// 选择武器
function selectWeapon(option) {
    if (option.type === 'upgrade') {
        option.weapon.level++;
        game.player.checkWeaponEvolution(option.weapon);
    } else {
        game.player.addWeapon(option.weapon.id);
    }
    document.getElementById('levelUpScreen').classList.add('hidden');
    game.state = 'playing';
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
        game.summons.forEach(summon => summon.update());

        // 投射物击中检测
        game.projectiles.forEach(projectile => {
            game.enemies.forEach(enemy => {
                const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
                if (dist < enemy.size && !projectile.hit) {
                    enemy.health -= projectile.damage;
                    projectile.hit = true; // 标记已击中

                    // 减少击中特效粒子（5 -> 2）
                    for (let i = 0; i < 2; i++) {
                        game.particles.push(new Particle(enemy.x, enemy.y, projectile.color));
                    }

                    // 检查击杀
                    if (enemy.health <= 0) {
                        game.player.gainExp(enemy.expValue);
                        game.killCount++;

                        // 减少死亡粒子效果（10 -> 6）
                        for (let i = 0; i < 6; i++) {
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
        game.summons = game.summons.filter(summon => !summon.isDead());

        // 清理距离玩家太远的敌人（优化性能）
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

    // 绘制（即使不在playing状态也绘制，保持画布清晰）
    if (game.state === 'playing' || game.state === 'levelup' || game.state === 'waveComplete') {
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

        // 只绘制可见区域内的障碍物（性能优化）
        const visibleObstacles = game.obstacles.filter(obstacle => {
            return obstacle.x > game.camera.x - 100 &&
                   obstacle.x < game.camera.x + CONFIG.canvas.width + 100 &&
                   obstacle.y > game.camera.y - 100 &&
                   obstacle.y < game.camera.y + CONFIG.canvas.height + 100;
        });

        // 绘制障碍物（先绘制草丛，后绘制石头）
        visibleObstacles.filter(o => o.type === 'bush').forEach(obstacle => obstacle.draw(game.ctx));
        visibleObstacles.filter(o => o.type === 'rock').forEach(obstacle => obstacle.draw(game.ctx));

        // 绘制粒子
        game.particles.forEach(particle => particle.draw(game.ctx));

        // 绘制投射物
        game.projectiles.forEach(projectile => projectile.draw(game.ctx));

        // 绘制武器投射物
        game.weaponProjectiles.forEach(projectile => projectile.draw(game.ctx));

        // 绘制召唤物
        game.summons.forEach(summon => summon.draw(game.ctx));

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

    // 游戏内重新开始按钮
    document.getElementById('inGameRestartBtn').addEventListener('click', () => {
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

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', initGame);
