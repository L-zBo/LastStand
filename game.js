// 游戏配置
const CONFIG = {
    canvas: {
        width: 1200,  // 默认值，会在初始化时自适应
        height: 800   // 默认值，会在初始化时自适应
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
        detail: '永久提升基础攻击力，对所有伤害计算生效',
        icon: '⚔️',
        type: '通用',
        apply: (player) => player.attack += 5
    },
    {
        id: 'speedUp',
        name: '迅捷之靴',
        description: '移动速度 +0.5',
        detail: '提升移动速度，更容易躲避敌人攻击',
        icon: '💨',
        type: '通用',
        apply: (player) => player.speed += 0.5
    },
    {
        id: 'healthUp',
        name: '生命强化',
        description: '最大生命 +30',
        detail: '永久提升生命上限，同时恢复等量生命',
        icon: '❤️',
        type: '通用',
        apply: (player) => {
            player.maxHealth += 30;
            player.health += 30;
        }
    },
    {
        id: 'healUp',
        name: '治疗',
        description: '回复 50% 生命值',
        detail: '立即回复当前最大生命值的50%',
        icon: '💚',
        type: '通用',
        apply: (player) => {
            player.health = Math.min(player.health + player.maxHealth * 0.5, player.maxHealth);
        }
    },
    {
        id: 'damageBoost',
        name: '狂暴',
        description: '攻击力 +15%',
        detail: '百分比提升攻击力，与其他加成叠加计算',
        icon: '🔥',
        type: '通用',
        apply: (player) => player.attack = Math.floor(player.attack * 1.15)
    },
    {
        id: 'expBoost',
        name: '经验加成',
        description: '获得经验 +20%',
        detail: '提升击杀敌人获得的经验值，加速升级',
        icon: '⭐',
        type: '通用',
        apply: (player) => player.expMultiplier = (player.expMultiplier || 1) * 1.2
    },
    {
        id: 'attackRange',
        name: '攻击范围扩大',
        description: '攻击范围 +20%',
        detail: '扩大武器攻击范围，更容易击中敌人',
        icon: '📍',
        type: '通用',
        apply: (player) => player.attackRange = (player.attackRange || 40) * 1.2
    },
    {
        id: 'critChance',
        name: '致命一击',
        description: '暴击率 +10%',
        detail: '提升暴击几率，暴击时造成双倍伤害',
        icon: '💥',
        type: '通用',
        apply: (player) => player.critChance = (player.critChance || 0) + 0.1
    },
    {
        id: 'vampire',
        name: '吸血',
        description: '击杀恢复 5 生命',
        detail: '每次击杀敌人恢复生命，提升续航能力',
        icon: '🩸',
        type: '通用',
        apply: (player) => player.vampireHeal = (player.vampireHeal || 0) + 5
    },
    {
        id: 'multiShot',
        name: '多重射击',
        description: '同时攻击多个敌人',
        detail: '自动攻击可同时锁定多个目标',
        icon: '🎯',
        type: '通用',
        apply: (player) => player.multiShot = (player.multiShot || 1) + 1
    },
    {
        id: 'attackSpeedUp',
        name: '疾风',
        description: '攻击速度 +20%',
        detail: '减少攻击冷却时间，提升输出频率',
        icon: '⚡',
        type: '通用',
        apply: (player) => player.attackCooldown = Math.max(100, player.attackCooldown * 0.8)
    },
    {
        id: 'critDamage',
        name: '暴击伤害',
        description: '暴击伤害 +50%',
        detail: '提升暴击时的伤害倍率',
        icon: '💢',
        type: '通用',
        apply: (player) => player.critDamage = (player.critDamage || 2) + 0.5
    },
    {
        id: 'healthRegen',
        name: '生命恢复',
        description: '每秒恢复 2 生命',
        detail: '持续恢复生命值，提升生存能力',
        icon: '💖',
        type: '通用',
        apply: (player) => player.healthRegen = (player.healthRegen || 0) + 2
    }
];

// 职业专属强化
const CLASS_BUFFS = {
    warrior: [
        {
            id: 'ironSkin',
            name: '铁壁',
            description: '受到伤害减少 15%',
            detail: '战士专属：提升防御，减少所有受到的伤害',
            icon: '🛡️',
            type: '战士专属',
            classOnly: 'warrior',
            apply: (player) => player.damageReduction = (player.damageReduction || 0) + 0.15
        },
        {
            id: 'berserker',
            name: '狂战士',
            description: '生命越低攻击越高(最高+50%)',
            detail: '战士专属：生命值越低，攻击力加成越高',
            icon: '😤',
            type: '战士专属',
            classOnly: 'warrior',
            apply: (player) => player.berserkerMode = true
        },
        {
            id: 'shieldBash',
            name: '盾击',
            description: '攻击有几率击退敌人',
            detail: '战士专属：近战攻击有30%几率将敌人击退',
            icon: '💪',
            type: '战士专属',
            classOnly: 'warrior',
            apply: (player) => player.knockbackChance = (player.knockbackChance || 0) + 0.3
        }
    ],
    mage: [
        {
            id: 'arcaneIntelligence',
            name: '奥术智慧',
            description: '魔法伤害 +25%',
            detail: '法师专属：大幅提升魔法类武器伤害',
            icon: '🔮',
            type: '法师专属',
            classOnly: 'mage',
            apply: (player) => player.magicDamageBonus = (player.magicDamageBonus || 1) * 1.25
        },
        {
            id: 'manaShield',
            name: '法力护盾',
            description: '每10秒获得一个护盾',
            detail: '法师专属：护盾可抵消一次伤害',
            icon: '🛡️',
            type: '法师专属',
            classOnly: 'mage',
            apply: (player) => player.manaShield = true
        },
        {
            id: 'spellEcho',
            name: '法术回响',
            description: '魔法攻击有几率触发两次',
            detail: '法师专属：30%几率额外释放一次魔法攻击',
            icon: '✨',
            type: '法师专属',
            classOnly: 'mage',
            apply: (player) => player.spellEcho = (player.spellEcho || 0) + 0.3
        }
    ],
    assassin: [
        {
            id: 'shadowStep',
            name: '暗影步',
            description: '移动速度 +30%',
            detail: '刺客专属：大幅提升移动速度',
            icon: '👤',
            type: '刺客专属',
            classOnly: 'assassin',
            apply: (player) => player.speed *= 1.3
        },
        {
            id: 'backstab',
            name: '背刺',
            description: '首次攻击伤害 +100%',
            detail: '刺客专属：对满血敌人造成双倍伤害',
            icon: '🗡️',
            type: '刺客专属',
            classOnly: 'assassin',
            apply: (player) => player.backstab = true
        },
        {
            id: 'deadlyPoison',
            name: '致命毒素',
            description: '攻击附带持续伤害',
            detail: '刺客专属：每次攻击使敌人中毒3秒',
            icon: '☠️',
            type: '刺客专属',
            classOnly: 'assassin',
            apply: (player) => player.poisonDamage = (player.poisonDamage || 0) + 3
        }
    ],
    ranger: [
        {
            id: 'eagleEye',
            name: '鹰眼',
            description: '攻击范围 +50%',
            detail: '游侠专属：大幅提升远程攻击距离',
            icon: '🦅',
            type: '游侠专属',
            classOnly: 'ranger',
            apply: (player) => player.attackRange *= 1.5
        },
        {
            id: 'multiArrow',
            name: '多重箭',
            description: '每次攻击发射3支箭',
            detail: '游侠专属：攻击时向扇形方向发射多支箭矢',
            icon: '🏹',
            type: '游侠专属',
            classOnly: 'ranger',
            apply: (player) => player.arrowCount = (player.arrowCount || 1) + 2
        },
        {
            id: 'hunterMark',
            name: '猎人印记',
            description: '标记敌人受到额外伤害',
            detail: '游侠专属：被攻击的敌人受到的伤害+20%',
            icon: '🎯',
            type: '游侠专属',
            classOnly: 'ranger',
            apply: (player) => player.hunterMark = true
        }
    ],
    summoner: [
        {
            id: 'summonMastery',
            name: '召唤精通',
            description: '召唤物上限 +2',
            detail: '召唤师专属：最多可同时召唤5个随从',
            icon: '👻',
            type: '召唤师专属',
            classOnly: 'summoner',
            apply: (player) => player.maxSummons += 2
        },
        {
            id: 'summonStrength',
            name: '召唤强化',
            description: '召唤物攻击力 +50%',
            detail: '召唤师专属：大幅提升召唤物的攻击力',
            icon: '💀',
            type: '召唤师专属',
            classOnly: 'summoner',
            apply: (player) => player.summonDamageBonus = (player.summonDamageBonus || 1) * 1.5
        },
        {
            id: 'soulLink',
            name: '灵魂链接',
            description: '召唤物击杀恢复生命',
            detail: '召唤师专属：召唤物击杀敌人时主人恢复10点生命',
            icon: '💫',
            type: '召唤师专属',
            classOnly: 'summoner',
            apply: (player) => player.soulLink = (player.soulLink || 0) + 10
        },
        {
            id: 'summonDuration',
            name: '永恒召唤',
            description: '召唤物持续时间 +100%',
            detail: '召唤师专属：召唤物存活时间延长一倍',
            icon: '⏰',
            type: '召唤师专属',
            classOnly: 'summoner',
            apply: (player) => player.summonDurationBonus = (player.summonDurationBonus || 1) * 2
        }
    ]
};

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
    state: 'start', // start, playing, levelup, waveComplete, paused, gameover
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
    // 存档系统
    currentSaveSlot: null,      // 当前使用的存档位 (1-6)
    saveSlotMode: null,         // 存档界面模式 ('save', 'load', 'newgame')
    pendingSaveSlot: null,      // 待确认的存档位
    pendingSaveData: null,      // 待加载的存档数据
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

        // 被动技能系统
        this.passives = [];

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
    // 在全局地图范围内随机生成，但避开玩家附近
    const minDistFromPlayer = 400; // 最小距离玩家400像素
    const maxAttempts = 20;

    for (let i = 0; i < maxAttempts; i++) {
        // 在整个地图范围内随机位置
        const x = 100 + Math.random() * (CONFIG.world.width - 200);
        const y = 100 + Math.random() * (CONFIG.world.height - 200);

        // 检查是否离玩家足够远
        const distToPlayer = Math.hypot(x - game.player.x, y - game.player.y);
        if (distToPlayer >= minDistFromPlayer) {
            return { x, y };
        }
    }

    // 如果多次尝试都失败，在地图边缘随机生成
    const side = Math.floor(Math.random() * 4);
    let x, y;
    switch(side) {
        case 0: // 上边缘
            x = 100 + Math.random() * (CONFIG.world.width - 200);
            y = 100;
            break;
        case 1: // 右边缘
            x = CONFIG.world.width - 100;
            y = 100 + Math.random() * (CONFIG.world.height - 200);
            break;
        case 2: // 下边缘
            x = 100 + Math.random() * (CONFIG.world.width - 200);
            y = CONFIG.world.height - 100;
            break;
        case 3: // 左边缘
            x = 100;
            y = 100 + Math.random() * (CONFIG.world.height - 200);
            break;
    }
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

    // 随机5个奖励选项（武器或Buff），确保不重复
    const options = [];
    const usedWeaponIds = new Set();
    const usedBuffIds = new Set();

    // 50%武器，50%Buff，生成5个不重复选项
    for (let i = 0; i < 5; i++) {
        if (Math.random() > 0.5) {
            // 武器选项
            const weapons = Object.values(WEAPONS).filter(w =>
                w.type !== 'evolved' && w.type !== 'accessory' && !usedWeaponIds.has(w.id)
            );
            if (weapons.length > 0) {
                const weapon = weapons[Math.floor(Math.random() * weapons.length)];
                usedWeaponIds.add(weapon.id);
                options.push({ type: 'weapon', data: weapon });
            } else {
                // 武器用完了，选Buff
                const availableBuffs = BUFFS.filter(b => !usedBuffIds.has(b.id));
                if (availableBuffs.length > 0) {
                    const buff = availableBuffs[Math.floor(Math.random() * availableBuffs.length)];
                    usedBuffIds.add(buff.id);
                    options.push({ type: 'buff', data: buff });
                }
            }
        } else {
            // Buff选项
            const availableBuffs = BUFFS.filter(b => !usedBuffIds.has(b.id));
            if (availableBuffs.length > 0) {
                const buff = availableBuffs[Math.floor(Math.random() * availableBuffs.length)];
                usedBuffIds.add(buff.id);
                options.push({ type: 'buff', data: buff });
            } else {
                // Buff用完了，选武器
                const weapons = Object.values(WEAPONS).filter(w =>
                    w.type !== 'evolved' && w.type !== 'accessory' && !usedWeaponIds.has(w.id)
                );
                if (weapons.length > 0) {
                    const weapon = weapons[Math.floor(Math.random() * weapons.length)];
                    usedWeaponIds.add(weapon.id);
                    options.push({ type: 'weapon', data: weapon });
                }
            }
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
                <span class="option-type-tag tag-weapon">武器</span>
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
                <span class="option-type-tag tag-buff">属性强化</span>
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

    // 只在数据变化时更新武器栏和被动栏
    updateWeaponBarIfNeeded();
    updatePassiveBarIfNeeded();
}

// 上次武器栏状态的缓存
let lastWeaponBarState = '';

// 更新武器栏（仅在变化时）
function updateWeaponBarIfNeeded() {
    // 生成当前状态的哈希
    const currentState = game.player.weapons.map(w => `${w.id}:${w.level}`).join(',');

    if (currentState === lastWeaponBarState) {
        return; // 没有变化，不更新
    }

    lastWeaponBarState = currentState;
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
            // 点击显示武器详情
            slot.addEventListener('click', () => showWeaponDetail(weapon));
        } else {
            slot.innerHTML = '<span class="weapon-empty">+</span>';
        }

        weaponBar.appendChild(slot);
    }
}

// 上次被动栏状态的缓存
let lastPassiveBarState = '';

// 更新被动栏（仅在变化时）
function updatePassiveBarIfNeeded() {
    const passives = game.player.passives || [];
    const currentState = passives.map(p => p.id).join(',');

    if (currentState === lastPassiveBarState) {
        return; // 没有变化，不更新
    }

    lastPassiveBarState = currentState;
    updatePassiveBar();
}

// 更新被动栏
function updatePassiveBar() {
    const passiveBar = document.getElementById('passiveBar');
    if (!passiveBar) return;
    passiveBar.innerHTML = '';

    // 获取玩家的被动效果
    const passives = game.player.passives || [];

    if (passives.length === 0) {
        passiveBar.innerHTML = '<span style="color: #666; font-size: 0.8em;">暂无被动</span>';
        return;
    }

    passives.forEach(passive => {
        const slot = document.createElement('div');
        slot.className = 'passive-slot' + (passive.classOnly ? ' class-passive' : '');
        slot.innerHTML = `
            <span>${passive.icon}</span>
            <div class="passive-tooltip">
                <h4>${passive.name}</h4>
                <p>${passive.description}</p>
                <p class="passive-type">${passive.type || '通用强化'}</p>
            </div>
        `;
        passiveBar.appendChild(slot);
    });
}

// 显示武器详情弹窗
function showWeaponDetail(weapon) {
    const modal = document.getElementById('weaponDetailModal');
    document.getElementById('weaponDetailIcon').textContent = weapon.icon;
    document.getElementById('weaponDetailName').textContent = weapon.name;
    document.getElementById('weaponDetailLevel').textContent = `Lv.${weapon.level || 1}/${weapon.maxLevel || 5}`;
    document.getElementById('weaponDetailDesc').textContent = weapon.description;

    // 计算实际伤害
    const actualDamage = weapon.damage * (weapon.level || 1);
    document.getElementById('weaponDetailDamage').textContent = actualDamage;

    const typeNames = { melee: '近战', ranged: '远程', magic: '魔法', accessory: '配件', evolved: '进化' };
    document.getElementById('weaponDetailType').textContent = typeNames[weapon.type] || weapon.type;

    // 显示进化信息
    const evolveInfo = document.getElementById('weaponEvolveInfo');
    if (weapon.evolvesWith && weapon.evolvesTo) {
        const partner = WEAPONS[weapon.evolvesWith];
        const evolved = WEAPONS[weapon.evolvesTo];
        document.getElementById('evolvePartner').textContent = `${partner.icon} ${partner.name}`;
        document.getElementById('evolveResult').textContent = `${evolved.icon} ${evolved.name}`;
        evolveInfo.style.display = 'block';
    } else if (weapon.type === 'evolved') {
        evolveInfo.innerHTML = `<h4>✨ 已进化武器</h4><p>这是一把进化后的强力武器！</p>`;
        evolveInfo.style.display = 'block';
    } else {
        evolveInfo.style.display = 'none';
    }

    modal.classList.remove('hidden');
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
    document.querySelector('#levelUpScreen h2').textContent = '🎉 升级!';

    // 40%武器，30%通用Buff，30%职业专属
    const rand = Math.random();

    if (rand < 0.4) {
        showWeaponOptions(buffOptions);
    } else if (rand < 0.7) {
        showBuffOptionsDetailed(buffOptions);
    } else {
        showClassBuffOptions(buffOptions);
    }

    document.getElementById('levelUpScreen').classList.remove('hidden');
}

// 显示武器选项（详细版）
function showWeaponOptions(container) {
    const availableWeapons = Object.values(WEAPONS).filter(w =>
        w.type !== 'evolved' && w.type !== 'accessory'
    );
    const playerWeaponIds = game.player.weapons.map(w => w.id);
    const upgradeableWeapons = game.player.weapons.filter(w => w.level < w.maxLevel);
    const accessories = Object.values(WEAPONS).filter(w => w.type === 'accessory');

    let allOptions = [];

    // 添加可升级的武器
    upgradeableWeapons.forEach(w => {
        allOptions.push({ type: 'upgrade', weapon: w });
    });

    // 添加新武器
    availableWeapons.filter(w => !playerWeaponIds.includes(w.id)).forEach(w => {
        allOptions.push({ type: 'new', weapon: w });
    });

    // 添加配件
    accessories.filter(w => !playerWeaponIds.includes(w.id)).forEach(w => {
        allOptions.push({ type: 'new', weapon: w, isAccessory: true });
    });

    // 随机选择5个不重复的选项
    const selectedOptions = [];
    for (let i = 0; i < 5 && allOptions.length > 0; i++) {
        const index = Math.floor(Math.random() * allOptions.length);
        selectedOptions.push(allOptions[index]);
        allOptions.splice(index, 1);
    }

    if (selectedOptions.length === 0) {
        showBuffOptionsDetailed(container);
        return;
    }

    selectedOptions.forEach(option => {
        const w = option.weapon;
        const card = document.createElement('div');
        card.className = 'buff-card weapon-card';

        // 进化信息
        let evolveInfo = '';
        if (w.evolvesWith && w.evolvesTo) {
            const partner = WEAPONS[w.evolvesWith];
            const evolved = WEAPONS[w.evolvesTo];
            evolveInfo = `<div class="evolve-hint">🔄 满级 + ${partner.icon}${partner.name} → ${evolved.icon}${evolved.name}</div>`;
        }

        const typeNames = { melee: '近战', ranged: '远程', magic: '魔法', accessory: '配件' };
        const levelInfo = option.type === 'upgrade'
            ? `Lv.${w.level} → Lv.${w.level + 1}`
            : 'Lv.1';

        // 确定类型标签
        const tagClass = option.isAccessory ? 'tag-accessory' : 'tag-weapon';
        const tagText = option.isAccessory ? '配件装备' : '武器';

        // 构建详细属性显示
        let statsHtml = '<div class="weapon-stats-detail">';
        if (option.isAccessory) {
            // 配件属性
            if (w.effect) statsHtml += `<span class="stat-item">✨ ${w.effect}</span>`;
        } else {
            // 武器属性
            const currentDamage = w.damage * (option.type === 'upgrade' ? w.level : 1);
            const nextDamage = w.damage * (option.type === 'upgrade' ? w.level + 1 : 1);

            if (option.type === 'upgrade') {
                statsHtml += `<span class="stat-item">⚔️ 伤害: ${currentDamage} → <span class="stat-up">${nextDamage}</span></span>`;
            } else {
                statsHtml += `<span class="stat-item">⚔️ 伤害: ${w.damage}</span>`;
            }
            if (w.attackSpeed) statsHtml += `<span class="stat-item">⚡ 攻速: ${w.attackSpeed}s</span>`;
            if (w.range) statsHtml += `<span class="stat-item">📏 范围: ${w.range}</span>`;
            if (w.projectileCount) statsHtml += `<span class="stat-item">🎯 投射物: ${w.projectileCount}</span>`;
            if (w.piercing) statsHtml += `<span class="stat-item">💫 穿透</span>`;
        }
        statsHtml += `<span class="stat-item">📊 最高Lv: ${w.maxLevel || 5}</span>`;
        statsHtml += '</div>';

        card.innerHTML = `
            <span class="option-type-tag ${tagClass}">${tagText}</span>
            <div class="buff-card-header">
                <span class="buff-icon">${w.icon}</span>
                <div>
                    <h3>${w.name}${option.type === 'upgrade' ? ' 升级' : ''}</h3>
                    <span class="buff-type">${typeNames[w.type] || w.type} | ${levelInfo}</span>
                </div>
            </div>
            <p class="buff-desc">${w.description}</p>
            ${statsHtml}
            ${evolveInfo}
        `;
        card.onclick = () => selectWeapon(option);
        container.appendChild(card);
    });
}

// 显示Buff选项（详细版）
function showBuffOptionsDetailed(container) {
    const availableBuffs = [...BUFFS];
    const selectedBuffs = [];

    // 选择5个不重复的buff
    for (let i = 0; i < 5 && availableBuffs.length > 0; i++) {
        const index = Math.floor(Math.random() * availableBuffs.length);
        selectedBuffs.push(availableBuffs[index]);
        availableBuffs.splice(index, 1); // 移除已选择的，防止重复
    }

    selectedBuffs.forEach(buff => {
        const card = document.createElement('div');
        card.className = 'buff-card';
        card.innerHTML = `
            <span class="option-type-tag tag-buff">属性强化</span>
            <div class="buff-card-header">
                <span class="buff-icon">${buff.icon}</span>
                <div>
                    <h3>${buff.name}</h3>
                    <span class="buff-type">${buff.type || '通用'}</span>
                </div>
            </div>
            <p class="buff-desc">${buff.description}</p>
            <div class="buff-effect">${buff.detail || buff.description}</div>
        `;
        card.onclick = () => selectBuff(buff);
        container.appendChild(card);
    });
}

// 显示职业专属强化选项
function showClassBuffOptions(container) {
    const playerClass = game.selectedClass;
    const classBuffs = CLASS_BUFFS[playerClass] || [];

    if (classBuffs.length === 0) {
        showBuffOptionsDetailed(container);
        return;
    }

    // 随机选择3个职业专属 + 2个通用，确保不重复
    const availableClassBuffs = [...classBuffs];
    const availableGeneralBuffs = [...BUFFS];
    const selectedOptions = [];

    // 选择职业专属buff（最多3个）
    for (let i = 0; i < 3 && availableClassBuffs.length > 0; i++) {
        const index = Math.floor(Math.random() * availableClassBuffs.length);
        selectedOptions.push(availableClassBuffs[index]);
        availableClassBuffs.splice(index, 1);
    }

    // 添加2个通用Buff
    for (let i = 0; i < 2 && availableGeneralBuffs.length > 0; i++) {
        const index = Math.floor(Math.random() * availableGeneralBuffs.length);
        selectedOptions.push(availableGeneralBuffs[index]);
        availableGeneralBuffs.splice(index, 1);
    }

    selectedOptions.forEach(buff => {
        const card = document.createElement('div');
        const isClassBuff = buff.classOnly;
        card.className = 'buff-card' + (isClassBuff ? ' class-buff' : '');
        card.innerHTML = `
            <span class="option-type-tag ${isClassBuff ? 'tag-class' : 'tag-buff'}">${isClassBuff ? '职业专属' : '属性强化'}</span>
            <div class="buff-card-header">
                <span class="buff-icon">${buff.icon}</span>
                <div>
                    <h3>${buff.name}</h3>
                    <span class="buff-type">${buff.type || '通用'}</span>
                </div>
            </div>
            <p class="buff-desc">${buff.description}</p>
            <div class="buff-effect">${buff.detail || buff.description}</div>
            ${isClassBuff ? '<p class="class-exclusive">★ 职业专属</p>' : ''}
        `;
        card.onclick = () => selectBuff(buff);
        container.appendChild(card);
    });
}

// 显示Buff选项（旧版兼容）
function showBuffOptions(container) {
    showBuffOptionsDetailed(container);
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
    // 添加到被动栏显示
    if (!game.player.passives.find(p => p.id === buff.id)) {
        game.player.passives.push({
            id: buff.id,
            name: buff.name,
            icon: buff.icon,
            description: buff.description,
            type: buff.type || '通用强化',
            classOnly: buff.classOnly
        });
    }
    document.getElementById('levelUpScreen').classList.add('hidden');
    game.state = 'playing';
}

// 游戏结束
function gameOver() {
    game.state = 'gameover';
    document.getElementById('finalTime').textContent = Math.floor(game.gameTime);
    document.getElementById('finalKills').textContent = game.killCount;
    document.getElementById('finalLevel').textContent = game.player.level;
    document.getElementById('finalWave').textContent = game.wave.current;
    document.getElementById('gameOverScreen').classList.remove('hidden');
    // 清除存档
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
    if (game.state === 'playing' || game.state === 'levelup' || game.state === 'waveComplete' || game.state === 'paused') {
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

// 自适应屏幕大小
function resizeCanvas() {
    const container = document.getElementById('gameScreen');
    const ui = document.getElementById('ui');

    // 获取可用空间（窗口大小减去边距和UI）
    const padding = 40; // 上下边距
    const uiHeight = ui ? ui.offsetHeight + 30 : 100; // UI高度 + 间距

    // 计算可用宽度和高度
    let availableWidth = window.innerWidth - padding * 2;
    let availableHeight = window.innerHeight - uiHeight - padding * 2;

    // 最小尺寸限制
    const minWidth = 800;
    const minHeight = 500;

    // 最大尺寸限制
    const maxWidth = 1920;
    const maxHeight = 1080;

    // 保持16:10的宽高比
    const aspectRatio = 16 / 10;

    let canvasWidth = Math.max(minWidth, Math.min(maxWidth, availableWidth));
    let canvasHeight = canvasWidth / aspectRatio;

    // 如果高度超出可用空间，则按高度计算
    if (canvasHeight > availableHeight) {
        canvasHeight = Math.max(minHeight, Math.min(maxHeight, availableHeight));
        canvasWidth = canvasHeight * aspectRatio;
    }

    // 确保宽度不超过可用空间
    if (canvasWidth > availableWidth) {
        canvasWidth = availableWidth;
        canvasHeight = canvasWidth / aspectRatio;
    }

    // 取整
    canvasWidth = Math.floor(canvasWidth);
    canvasHeight = Math.floor(canvasHeight);

    // 更新配置
    CONFIG.canvas.width = canvasWidth;
    CONFIG.canvas.height = canvasHeight;

    // 更新canvas
    if (game.canvas) {
        game.canvas.width = canvasWidth;
        game.canvas.height = canvasHeight;
    }

    // 更新UI宽度以匹配画布
    if (ui) {
        ui.style.minWidth = canvasWidth + 'px';
        ui.style.maxWidth = canvasWidth + 'px';
    }

    console.log(`Canvas resized to: ${canvasWidth}x${canvasHeight}`);
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
        // ESC键暂停
        if (e.key === 'Escape' && game.state === 'playing') {
            pauseGame();
        }
    });

    window.addEventListener('keyup', (e) => {
        game.keys[e.key] = false;
    });

    // 新游戏按钮 - 打开存档位选择界面
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
            // 返回游戏
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
            // 暂停游戏，打开存档选择
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
            // 打开存档选择界面
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

    // 游戏内重新开始按钮（重新开始本波）
    document.getElementById('inGameRestartBtn').addEventListener('click', () => {
        restartCurrentWave();
    });

    // 武器详情弹窗关闭
    document.querySelector('#weaponDetailModal .modal-close').addEventListener('click', () => {
        document.getElementById('weaponDetailModal').classList.add('hidden');
    });
}

// 检查存档
function checkSaveData() {
    const loadBtn = document.getElementById('loadGameBtn');
    if (hasAnySaveData()) {
        loadBtn.disabled = false;
    } else {
        loadBtn.disabled = true;
    }
}

// 检查是否有任何存档
function hasAnySaveData() {
    for (let i = 1; i <= 6; i++) {
        if (localStorage.getItem(`roguelikeSave_${i}`) !== null) {
            return true;
        }
    }
    return false;
}

// 获取存档数据
function getSaveData(slotIndex) {
    const data = localStorage.getItem(`roguelikeSave_${slotIndex}`);
    return data ? JSON.parse(data) : null;
}

// 获取职业中文名
function getClassName(classId) {
    const names = {
        warrior: '🛡️ 战士',
        mage: '🧙 法师',
        assassin: '🥷 刺客',
        ranger: '🏹 游侠',
        summoner: '🔮 召唤师'
    };
    return names[classId] || classId;
}

// 格式化时间
function formatSaveTime(timestamp) {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// 显示存档位选择界面
function showSaveSlotScreen(mode) {
    game.saveSlotMode = mode; // 'save' 或 'load' 或 'newgame'
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('saveSlotScreen').classList.remove('hidden');

    const title = document.getElementById('saveSlotTitle');
    if (mode === 'save') {
        title.textContent = '💾 选择存档位保存';
    } else if (mode === 'load') {
        title.textContent = '📂 选择存档读取';
    } else {
        title.textContent = '🎮 选择存档位';
    }

    renderSaveSlots();
}

// 渲染存档位
function renderSaveSlots() {
    const container = document.getElementById('saveSlots');
    container.innerHTML = '';

    for (let i = 1; i <= 6; i++) {
        const saveData = getSaveData(i);
        const slot = document.createElement('div');
        slot.className = 'save-slot' + (saveData ? '' : ' empty');
        slot.dataset.slot = i;

        if (saveData) {
            slot.innerHTML = `
                <button class="save-slot-delete" data-slot="${i}" title="删除存档">×</button>
                <div class="save-slot-header">
                    <span class="slot-icon">📁</span>
                    <span>存档 ${i}</span>
                </div>
                <div class="save-slot-info">
                    <p class="class-name">${getClassName(saveData.selectedClass)}</p>
                    <p>⭐ 等级 ${saveData.player.level} | 🌊 波次 ${saveData.wave}</p>
                    <p>💀 击杀 ${saveData.killCount} | ⏱️ ${Math.floor(saveData.gameTime)}秒</p>
                    <p class="save-time">保存于: ${formatSaveTime(saveData.saveTime)}</p>
                </div>
            `;
        } else {
            slot.innerHTML = `
                <div class="save-slot-header">
                    <span class="slot-icon">📄</span>
                    <span>存档 ${i}</span>
                </div>
                <p class="save-slot-empty-text">- 空存档位 -</p>
            `;
        }

        slot.addEventListener('click', (e) => {
            if (e.target.classList.contains('save-slot-delete')) return;
            handleSlotClick(i);
        });

        container.appendChild(slot);
    }

    // 绑定删除按钮事件
    document.querySelectorAll('.save-slot-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const slotIndex = parseInt(btn.dataset.slot);
            deleteSaveSlot(slotIndex);
        });
    });
}

// 处理存档位点击
function handleSlotClick(slotIndex) {
    const saveData = getSaveData(slotIndex);
    const mode = game.saveSlotMode;

    if (mode === 'load') {
        // 读取存档
        if (saveData) {
            loadGameFromSlot(slotIndex);
        }
    } else if (mode === 'save') {
        // 保存游戏
        if (saveData) {
            // 已有存档，确认覆盖
            game.pendingSaveSlot = slotIndex;
            showOverwriteModal();
        } else {
            saveGameToSlot(slotIndex);
            showSaveNotification();
            hideSaveSlotScreen();
            // 返回游戏
            document.getElementById('gameScreen').classList.remove('hidden');
            resumeGame();
        }
    } else if (mode === 'newgame') {
        // 新游戏
        if (saveData) {
            // 已有存档，确认覆盖
            game.pendingSaveSlot = slotIndex;
            showOverwriteModal();
        } else {
            game.currentSaveSlot = slotIndex;
            hideSaveSlotScreen();
            showClassSelection();
        }
    }
}

// 删除存档
function deleteSaveSlot(slotIndex) {
    if (confirm(`确定要删除存档 ${slotIndex} 吗？`)) {
        localStorage.removeItem(`roguelikeSave_${slotIndex}`);
        renderSaveSlots();
        checkSaveData();
    }
}

// 隐藏存档位选择界面
function hideSaveSlotScreen() {
    document.getElementById('saveSlotScreen').classList.add('hidden');
}

// 返回开始界面
function backToStartScreen() {
    hideSaveSlotScreen();
    document.getElementById('startScreen').classList.remove('hidden');
}

function hasSaveData() {
    return hasAnySaveData();
}

function showOverwriteModal() {
    document.getElementById('overwriteModal').classList.remove('hidden');
}

function showClassSelection() {
    document.getElementById('startScreen').classList.remove('hidden');
    document.getElementById('classSelection').classList.remove('hidden');
}

// 保存游戏到指定存档位
function saveGameToSlot(slotIndex) {
    const saveData = {
        selectedClass: game.selectedClass,
        player: {
            x: game.player.x,
            y: game.player.y,
            health: game.player.health,
            maxHealth: game.player.maxHealth,
            attack: game.player.attack,
            speed: game.player.speed,
            level: game.player.level,
            exp: game.player.exp,
            maxExp: game.player.maxExp,
            weapons: game.player.weapons.map(w => ({ id: w.id, level: w.level })),
            // 保存被动技能
            passives: game.player.passives,
            // 保存额外属性
            critChance: game.player.critChance,
            critDamage: game.player.critDamage,
            vampireHeal: game.player.vampireHeal,
            expMultiplier: game.player.expMultiplier,
            healthRegen: game.player.healthRegen,
            multiShot: game.player.multiShot,
            maxSummons: game.player.maxSummons
        },
        wave: game.wave.current,
        killCount: game.killCount,
        gameTime: game.gameTime,
        saveTime: Date.now()
    };
    localStorage.setItem(`roguelikeSave_${slotIndex}`, JSON.stringify(saveData));
    game.currentSaveSlot = slotIndex;
}

// 保存游戏（使用当前存档位）
function saveGame() {
    if (game.currentSaveSlot) {
        saveGameToSlot(game.currentSaveSlot);
    } else {
        // 如果没有当前存档位，显示存档选择界面
        showSaveSlotScreen('save');
    }
}

// 从指定存档位读取游戏
function loadGameFromSlot(slotIndex) {
    const saveData = getSaveData(slotIndex);
    if (!saveData) return;

    game.currentSaveSlot = slotIndex;
    game.pendingSaveData = saveData;

    hideSaveSlotScreen();
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');

    // 显示倒计时
    showCountdown(() => {
        applyLoadedSaveData(game.pendingSaveData);
    });
}

// 读取游戏（显示存档选择界面）
function loadGame() {
    showSaveSlotScreen('load');
}

// 应用读取的存档数据
function applyLoadedSaveData(saveData) {
    game.selectedClass = saveData.selectedClass;

    // 重置UI缓存
    lastWeaponBarState = '';
    lastPassiveBarState = '';

    generateObstacles();

    game.player = new Player(game.selectedClass);
    // 恢复玩家属性
    game.player.x = saveData.player.x;
    game.player.y = saveData.player.y;
    game.player.health = saveData.player.health;
    game.player.maxHealth = saveData.player.maxHealth;
    game.player.attack = saveData.player.attack;
    game.player.speed = saveData.player.speed;
    game.player.level = saveData.player.level;
    game.player.exp = saveData.player.exp;
    game.player.maxExp = saveData.player.maxExp;
    game.player.critChance = saveData.player.critChance || 0;
    game.player.critDamage = saveData.player.critDamage || 2;
    game.player.vampireHeal = saveData.player.vampireHeal || 0;
    game.player.expMultiplier = saveData.player.expMultiplier || 1;
    game.player.healthRegen = saveData.player.healthRegen || 0;
    game.player.multiShot = saveData.player.multiShot || 1;
    game.player.maxSummons = saveData.player.maxSummons || CLASSES[game.selectedClass].maxSummons || 0;

    // 恢复被动技能
    game.player.passives = saveData.player.passives || [];

    // 恢复武器
    game.player.weapons = [];
    saveData.player.weapons.forEach(w => {
        const weaponData = WEAPONS[w.id];
        if (weaponData) {
            game.player.weapons.push({ ...weaponData, level: w.level });
        }
    });

    game.enemies = [];
    game.particles = [];
    game.projectiles = [];
    game.weaponProjectiles = [];
    game.summons = [];
    game.killCount = saveData.killCount;
    game.gameTime = saveData.gameTime;
    game.lastTime = 0;
    game.state = 'playing';

    game.wave = {
        current: saveData.wave,
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

    startNewWave();
    requestAnimationFrame(gameLoop);
}

// 显示倒计时
function showCountdown(callback) {
    const countdownScreen = document.getElementById('countdownScreen');
    const countdownNumber = document.getElementById('countdownNumber');
    countdownScreen.classList.remove('hidden');

    let count = 3;
    countdownNumber.textContent = count;

    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownNumber.textContent = count;
            // 重新触发动画
            countdownNumber.style.animation = 'none';
            countdownNumber.offsetHeight; // 触发重排
            countdownNumber.style.animation = 'countdownPulse 1s ease-in-out';
        } else {
            clearInterval(countdownInterval);
            countdownScreen.classList.add('hidden');
            if (callback) callback();
        }
    }, 1000);
}

function clearSaveData(slotIndex) {
    if (slotIndex) {
        localStorage.removeItem(`roguelikeSave_${slotIndex}`);
    }
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
    game.lastTime = 0; // 重置时间以避免大的deltaTime
    requestAnimationFrame(gameLoop);
}

// 重新开始当前波
function restartCurrentWave() {
    document.getElementById('pauseScreen').classList.add('hidden');

    // 清空敌人和投射物
    game.enemies = [];
    game.particles = [];
    game.projectiles = [];
    game.weaponProjectiles = [];
    game.summons = [];

    // 重置波次状态但保持当前波数
    game.wave.enemiesSpawned = 0;
    game.wave.totalEnemies = 0;
    game.wave.lastSpawnTime = 0;
    game.wave.isSpawning = false;
    game.wave.eliteSpawned = false;
    game.wave.bossSpawned = false;
    game.wave.inBreak = false;

    // 恢复玩家位置到地图中心
    game.player.x = CONFIG.world.width / 2;
    game.player.y = CONFIG.world.height / 2;

    // 恢复一定生命值
    game.player.health = Math.min(game.player.health + game.player.maxHealth * 0.3, game.player.maxHealth);

    game.state = 'playing';
    game.lastTime = 0; // 重置时间以避免大的deltaTime

    // 重新开始本波
    startNewWave();
    // 注意：不需要再调用requestAnimationFrame，游戏循环已经在运行中
}

// 返回主菜单
function returnToMenu() {
    location.reload();
}

// 显示保存成功提示
function showSaveNotification() {
    const notification = document.createElement('div');
    notification.className = 'save-notification';
    notification.textContent = '💾 游戏已保存';
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// 显示武器详情
function showWeaponDetail(weapon) {
    const typeNames = { melee: '近战', ranged: '远程', magic: '魔法', accessory: '配件', evolved: '进化' };

    document.getElementById('weaponDetailIcon').textContent = weapon.icon;
    document.getElementById('weaponDetailName').textContent = weapon.name;
    document.getElementById('weaponDetailLevel').textContent = weapon.type === 'evolved' ? '进化' : `Lv.${weapon.level}`;
    document.getElementById('weaponDetailDesc').textContent = weapon.description;
    document.getElementById('weaponDetailDamage').textContent = weapon.damage || 0;
    document.getElementById('weaponDetailType').textContent = typeNames[weapon.type] || weapon.type;

    const evolveInfo = document.getElementById('weaponEvolveInfo');
    if (weapon.evolvesWith && weapon.evolvesTo) {
        const partner = WEAPONS[weapon.evolvesWith];
        const evolved = WEAPONS[weapon.evolvesTo];
        document.getElementById('evolvePartner').textContent = `${partner.icon} ${partner.name}`;
        document.getElementById('evolveResult').textContent = `${evolved.icon} ${evolved.name}`;
        evolveInfo.classList.remove('hidden');
    } else {
        evolveInfo.classList.add('hidden');
    }

    document.getElementById('weaponDetailModal').classList.remove('hidden');
}

// 开始游戏
function startGame() {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');

    // 重置UI缓存
    lastWeaponBarState = '';
    lastPassiveBarState = '';

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
