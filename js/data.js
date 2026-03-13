// ==================== 游戏数据配置 ====================

// 职业配置 - 参考土豆兄弟风格，每个职业有独特优劣势
const CLASSES = {
    warrior: {
        name: '战士',
        description: '近战之王，高生命高防御',
        health: 150,
        attack: 15,
        speed: 3,
        color: '#ff6b6b',
        sprite: '🛡️',
        attackType: 'melee',
        attackRange: 50,
        // 被动效果
        passiveDesc: '受到伤害减少10%，近战攻击有击退效果',
        damageReduction: 0.1,
        knockbackPower: 0.3,
        // 主动技能
        activeSkill: {
            name: '战吼',
            icon: '📢',
            description: '发出战吼，120范围内敌人眩晕1.5秒，自身攻击+50%持续4秒',
            cooldown: 12000,
            radius: 120,
            stunDuration: 1500,
            buffDuration: 4000,
            attackBoost: 0.5,
            type: 'warcry'
        }
    },
    mage: {
        name: '法师',
        description: '远程魔法输出，高伤害低生命',
        health: 80,
        attack: 25,
        speed: 3.5,
        color: '#4ecdc4',
        sprite: '🧙',
        attackType: 'magic',
        attackRange: 150,
        passiveDesc: '魔法攻击穿透敌人，攻击范围+30%',
        magicPenetration: true,
        rangeBonus: 0.3,
        activeSkill: {
            name: '暴风雪',
            icon: '❄️',
            description: '召唤暴风雪，150范围内每0.3秒造成攻击力60%伤害，持续3秒',
            cooldown: 15000,
            radius: 150,
            duration: 3000,
            tickInterval: 300,
            damagePercent: 0.6,
            type: 'blizzard'
        }
    },
    assassin: {
        name: '刺客',
        description: '极速暗杀，高暴击高闪避',
        health: 100,
        attack: 20,
        speed: 5,
        color: '#95e1d3',
        sprite: '🥷',
        attackType: 'melee',
        attackRange: 45,
        passiveDesc: '移动速度+30%，首次攻击必定暴击',
        critChance: 0.25,
        firstStrikeCrit: true,
        activeSkill: {
            name: '影步',
            icon: '👤',
            description: '瞬移到最近敌人身后，造成300%暴击伤害',
            cooldown: 8000,
            damageMultiplier: 3.0,
            blinkRange: 300,
            type: 'shadowstep'
        }
    },
    ranger: {
        name: '游侠',
        description: '远程射手，多重箭矢',
        health: 110,
        attack: 18,
        speed: 4,
        color: '#f38181',
        sprite: '🏹',
        attackType: 'ranged',
        attackRange: 200,
        passiveDesc: '攻击发射多支箭矢，攻击速度+20%',
        arrowCount: 2,
        attackSpeedBonus: 0.2,
        activeSkill: {
            name: '箭雨',
            icon: '🌧️',
            description: '向目标区域倾泻箭雨，200范围内造成10次伤害',
            cooldown: 14000,
            radius: 200,
            duration: 2500,
            hitCount: 10,
            damagePercent: 0.8,
            range: 350,
            type: 'arrowrain'
        }
    },
    summoner: {
        name: '召唤师',
        description: '召唤幽灵作战，团队作战',
        health: 90,
        attack: 12,
        speed: 3.2,
        color: '#9b59b6',
        sprite: '🔮',
        attackType: 'summon',
        attackRange: 180,
        maxSummons: 3,
        passiveDesc: '可召唤3个幽灵助战，召唤物击杀恢复生命',
        soulLink: 5,
        activeSkill: {
            name: '灵魂爆破',
            icon: '💥',
            description: '引爆所有召唤物，每个造成150范围内攻击力200%伤害',
            cooldown: 18000,
            radius: 150,
            damageMultiplier: 2.0,
            type: 'soulburst'
        }
    },
    knight: {
        name: '骑士',
        description: '重甲坦克，反伤护盾',
        health: 180,
        attack: 18,
        speed: 2.8,
        color: '#c0c0c0',
        sprite: '⚔️',
        attackType: 'melee',
        attackRange: 55,
        armor: 15,
        passiveDesc: '受到伤害减少15%，受击时反弹20%伤害',
        damageReduction: 0.15,
        counterAttack: 0.2,
        activeSkill: {
            name: '堡垒',
            icon: '🏰',
            description: '进入堡垒状态3秒，完全无敌并吸引周围敌人',
            cooldown: 20000,
            duration: 3000,
            tauntRadius: 200,
            type: 'fortress'
        }
    },
    paladin: {
        name: '圣骑士',
        description: '圣光战士，治愈与惩戒',
        health: 140,
        attack: 16,
        speed: 3.0,
        color: '#ffd700',
        sprite: '✝️',
        attackType: 'holy',
        attackRange: 80,
        healPower: 3,
        passiveDesc: '攻击时恢复生命，对亡灵敌人伤害+50%',
        smite: true,
        activeSkill: {
            name: '圣光审判',
            icon: '✨',
            description: '释放圣光波，180范围内造成攻击力250%伤害并回复30%最大生命',
            cooldown: 16000,
            radius: 180,
            damageMultiplier: 2.5,
            healPercent: 0.3,
            type: 'holywave'
        }
    },
    necromancer: {
        name: '死灵法师',
        description: '黑暗召唤，生命汲取',
        health: 75,
        attack: 22,
        speed: 3.3,
        color: '#4a0080',
        sprite: '💀',
        attackType: 'dark',
        attackRange: 160,
        maxSummons: 5,
        passiveDesc: '召唤亡灵骷髅，攻击吸取5%生命',
        lifeSteal: 0.05,
        activeSkill: {
            name: '亡灵大军',
            icon: '☠️',
            description: '召唤8个临时骷髅战士，持续8秒后消散',
            cooldown: 22000,
            summonCount: 8,
            duration: 8000,
            type: 'undeadarmy'
        }
    }
};

// Buff配置
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
    },
    {
        id: 'pickupRange',
        name: '拾取范围扩大',
        description: '拾取范围 +50%',
        detail: '扩大金币和道具的拾取范围，更容易收集掉落物',
        icon: '🧲',
        type: '通用',
        apply: (player) => player.pickupRangeBonus = (player.pickupRangeBonus || 1) * 1.5
    },
    {
        id: 'magnetRange',
        name: '磁铁吸引',
        description: '吸引范围 +80%',
        detail: '大幅扩大掉落物的自动吸引范围',
        icon: '🪄',
        type: '通用',
        apply: (player) => player.magnetRangeBonus = (player.magnetRangeBonus || 1) * 1.8
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
    ],
    knight: [
        {
            id: 'heavyArmor',
            name: '重甲精通',
            description: '受到伤害减少 20%',
            detail: '骑士专属：重甲提供更强的防护',
            icon: '🛡️',
            type: '骑士专属',
            classOnly: 'knight',
            apply: (player) => player.damageReduction = (player.damageReduction || 0) + 0.2
        },
        {
            id: 'steadfast',
            name: '坚定不移',
            description: '被击中时不会被击退',
            detail: '骑士专属：站稳脚跟，不受击退效果影响',
            icon: '🏰',
            type: '骑士专属',
            classOnly: 'knight',
            apply: (player) => player.knockbackImmune = true
        },
        {
            id: 'counterAttack',
            name: '反击',
            description: '受到攻击时反弹 30% 伤害',
            detail: '骑士专属：受到攻击时自动对敌人造成反伤',
            icon: '⚔️',
            type: '骑士专属',
            classOnly: 'knight',
            apply: (player) => player.counterAttack = (player.counterAttack || 0) + 0.3
        }
    ],
    paladin: [
        {
            id: 'holyLight',
            name: '圣光',
            description: '每5秒恢复 10% 生命',
            detail: '圣骑士专属：圣光持续治愈',
            icon: '✨',
            type: '圣骑士专属',
            classOnly: 'paladin',
            apply: (player) => player.holyHeal = (player.holyHeal || 0) + 0.1
        },
        {
            id: 'divineShield',
            name: '神圣护盾',
            description: '生命值低于 30% 时获得无敌 3 秒',
            detail: '圣骑士专属：生命垂危时触发神圣庇护',
            icon: '🛡️',
            type: '圣骑士专属',
            classOnly: 'paladin',
            apply: (player) => player.divineShield = true
        },
        {
            id: 'smite',
            name: '惩击',
            description: '对亡灵敌人伤害 +100%',
            detail: '圣骑士专属：圣光对亡灵造成额外伤害',
            icon: '⚡',
            type: '圣骑士专属',
            classOnly: 'paladin',
            apply: (player) => player.smite = true
        }
    ],
    necromancer: [
        {
            id: 'darkPact',
            name: '黑暗契约',
            description: '召唤物数量上限 +3',
            detail: '死灵法师专属：与更多亡灵签订契约',
            icon: '💀',
            type: '死灵法师专属',
            classOnly: 'necromancer',
            apply: (player) => player.maxSummons += 3
        },
        {
            id: 'lifeSteal',
            name: '生命汲取',
            description: '造成伤害的 15% 转化为生命',
            detail: '死灵法师专属：黑暗魔法吸取敌人生命',
            icon: '🩸',
            type: '死灵法师专属',
            classOnly: 'necromancer',
            apply: (player) => player.lifeSteal = (player.lifeSteal || 0) + 0.15
        },
        {
            id: 'corpseExplosion',
            name: '尸爆',
            description: '敌人死亡时爆炸造成范围伤害',
            detail: '死灵法师专属：引爆敌人尸体伤害周围敌人',
            icon: '💥',
            type: '死灵法师专属',
            classOnly: 'necromancer',
            apply: (player) => player.corpseExplosion = true
        },
        {
            id: 'deathCoil',
            name: '死亡缠绕',
            description: '攻击附带死亡诅咒',
            detail: '死灵法师专属：被诅咒的敌人受到的伤害提升 25%',
            icon: '☠️',
            type: '死灵法师专属',
            classOnly: 'necromancer',
            apply: (player) => player.deathCoil = true
        }
    ]
};

// 金币掉落数量配置 - 每个金币=1金
const GOLD_COUNT = {
    normal: { min: 1, max: 2 },   // 普通怪物掉落1-2个金币
    fast: { min: 1, max: 2 },
    tank: { min: 2, max: 3 },
    ranged: { min: 1, max: 3 },   // 远程敌人掉落1-3个金币
    splitter: { min: 1, max: 2 },
    splitter_child: { min: 0, max: 1 },
    elite: { min: 2, max: 4 },    // 精英掉落2-4个金币
    boss: { min: 5, max: 8 }      // Boss掉落5-8个金币
};

// 掉落物配置
const DROP_CONFIG = {
    pickupRange: 80,           // 拾取范围（增大）
    magnetRange: 150,          // 磁铁吸引范围
    magnetSpeed: 5,            // 磁铁吸引速度
    goldDropChance: 0.85,      // 金币掉落概率 85%
    buffDropChance: 0.08,      // Buff掉落概率 8%
    itemDropChance: 0.05,      // 道具掉落概率 5%
    multiDropChance: 0.15,     // 多重掉落概率 15%
    despawnTime: 30000         // 掉落物消失时间 30秒
};

// 可掉落的Buff列表
const DROPPABLE_BUFFS = [
    {
        id: 'dropAttack',
        name: '力量水晶',
        description: '攻击力+3',
        icon: '💎',
        sprite: 'ruby',
        effect: (player) => { player.attack += 3; }
    },
    {
        id: 'dropSpeed',
        name: '疾风羽毛',
        description: '移动速度+0.3',
        icon: '🪶',
        sprite: 'feather',
        effect: (player) => { player.speed += 0.3; }
    },
    {
        id: 'dropHealth',
        name: '生命宝石',
        description: '最大生命+15',
        icon: '💚',
        sprite: 'emerald',
        effect: (player) => { player.maxHealth += 15; player.health += 15; }
    },
    {
        id: 'dropCrit',
        name: '暴击水晶',
        description: '暴击率+3%',
        icon: '💥',
        sprite: 'amethyst',
        effect: (player) => { player.critChance = (player.critChance || 0) + 0.03; }
    },
    {
        id: 'dropExp',
        name: '智慧宝石',
        description: '经验获取+10%',
        icon: '⭐',
        sprite: 'sapphire',
        effect: (player) => { player.expMultiplier = (player.expMultiplier || 1) * 1.1; }
    },
    {
        id: 'dropGold',
        name: '财富符文',
        description: '金币获取+10%',
        icon: '💰',
        sprite: 'topaz',
        effect: (player) => { player.goldMultiplier = (player.goldMultiplier || 1) * 1.1; }
    }
];

// 可掉落的消耗品
const DROPPABLE_ITEMS = [
    {
        id: 'dropHealSmall',
        name: '小治疗药水',
        description: '恢复25点生命',
        icon: '🧪',
        sprite: 'healthPotion',
        effect: (player) => { player.health = Math.min(player.health + 25, player.maxHealth); }
    },
    {
        id: 'dropHealMedium',
        name: '中治疗药水',
        description: '恢复50点生命',
        icon: '🧴',
        sprite: 'manaPotion',
        effect: (player) => { player.health = Math.min(player.health + 50, player.maxHealth); }
    },
    {
        id: 'dropSpeedBoost',
        name: '速度药水',
        description: '临时加速',
        icon: '💨',
        sprite: 'speedPotion',
        effect: (player) => { player.speed += 0.5; addGameTimer(() => player.speed -= 0.5, 10000); }
    }
];

// 商店物品配置
const SHOP_ITEMS = [
    {
        id: 'healSmall',
        name: '小型治疗药水',
        description: '恢复30点生命',
        icon: '🧪',
        price: 20,
        effect: (player) => {
            player.health = Math.min(player.health + 30, player.maxHealth);
        }
    },
    {
        id: 'healLarge',
        name: '大型治疗药水',
        description: '恢复70点生命',
        icon: '🧴',
        price: 45,
        effect: (player) => {
            player.health = Math.min(player.health + 70, player.maxHealth);
        }
    },
    {
        id: 'healFull',
        name: '完全恢复药水',
        description: '完全恢复生命',
        icon: '💊',
        price: 80,
        effect: (player) => {
            player.health = player.maxHealth;
        }
    },
    {
        id: 'attackBoost',
        name: '力量药剂',
        description: '攻击力+3（永久）',
        icon: '⚔️',
        price: 60,
        effect: (player) => {
            player.attack += 3;
        }
    },
    {
        id: 'speedBoost',
        name: '敏捷药剂',
        description: '移动速度+0.3（永久）',
        icon: '💨',
        price: 50,
        effect: (player) => {
            player.speed += 0.3;
        }
    },
    {
        id: 'healthBoost',
        name: '生命药剂',
        description: '最大生命+20（永久）',
        icon: '❤️',
        price: 55,
        effect: (player) => {
            player.maxHealth += 20;
            player.health += 20;
        }
    },
    {
        id: 'critBoost',
        name: '致命药剂',
        description: '暴击率+5%（永久）',
        icon: '💥',
        price: 70,
        effect: (player) => {
            player.critChance = (player.critChance || 0) + 0.05;
        }
    },
    {
        id: 'vampireBoost',
        name: '吸血药剂',
        description: '击杀回血+2（永久）',
        icon: '🩸',
        price: 65,
        effect: (player) => {
            player.vampireHeal = (player.vampireHeal || 0) + 2;
        }
    },
    {
        id: 'rangeBoost',
        name: '鹰眼药剂',
        description: '攻击范围+15%（永久）',
        icon: '🎯',
        price: 55,
        effect: (player) => {
            player.attackRange = Math.floor(player.attackRange * 1.15);
        }
    },
    {
        id: 'attackSpeedBoost',
        name: '疾风药剂',
        description: '攻击速度+10%（永久）',
        icon: '⚡',
        price: 60,
        effect: (player) => {
            player.attackCooldown = Math.max(100, Math.floor(player.attackCooldown * 0.9));
        }
    },
    {
        id: 'regenBoost',
        name: '再生药剂',
        description: '生命恢复+1/秒（永久）',
        icon: '💖',
        price: 75,
        effect: (player) => {
            player.healthRegen = (player.healthRegen || 0) + 1;
        }
    },
    {
        id: 'goldBoost',
        name: '财富护符',
        description: '金币获取+20%（永久）',
        icon: '💰',
        price: 100,
        effect: (player) => {
            player.goldMultiplier = (player.goldMultiplier || 1) * 1.2;
        }
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
        type: 'accessory',
        effect: '减少受到的伤害'
    },
    cloak: {
        id: 'cloak',
        name: '斗篷',
        description: '移动速度 +10%',
        icon: '🧥',
        level: 1,
        maxLevel: 5,
        speedBonus: 0.1,
        type: 'accessory',
        effect: '提升移动速度'
    },
    quiver: {
        id: 'quiver',
        name: '箭袋',
        description: '攻击速度 +15%',
        icon: '🎯',
        level: 1,
        maxLevel: 5,
        attackSpeedBonus: 0.15,
        type: 'accessory',
        effect: '提升攻击速度'
    },
    tome: {
        id: 'tome',
        name: '魔法书',
        description: '魔法伤害 +20%',
        icon: '📖',
        level: 1,
        maxLevel: 5,
        magicBonus: 0.2,
        type: 'accessory',
        effect: '提升魔法伤害'
    },
    gauntlet: {
        id: 'gauntlet',
        name: '拳套',
        description: '攻击力 +5',
        icon: '🥊',
        level: 1,
        maxLevel: 5,
        attackBonus: 5,
        type: 'accessory',
        effect: '提升攻击力'
    },
    ember: {
        id: 'ember',
        name: '余烬',
        description: '火焰伤害 +15%',
        icon: '✨',
        level: 1,
        maxLevel: 5,
        fireBonus: 0.15,
        type: 'accessory',
        effect: '提升火焰伤害'
    },
    // 进化武器（满级合成后）
    holyBlade: {
        id: 'holyBlade',
        name: '圣光之剑',
        description: '神圣攻击，对敌人造成额外伤害',
        icon: '⚔️',
        damage: 25,
        maxLevel: 1,
        type: 'evolved',
        special: '攻击附带圣光爆发'
    },
    shadowBlade: {
        id: 'shadowBlade',
        name: '暗影之刃',
        description: '极速暗影攻击',
        icon: '🌙',
        damage: 15,
        maxLevel: 1,
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
        maxLevel: 1,
        type: 'evolved',
        special: '箭矢自动追踪敌人'
    },
    arcaneStaff: {
        id: 'arcaneStaff',
        name: '奥术法杖',
        description: '强力魔法攻击',
        icon: '🔮',
        damage: 30,
        maxLevel: 1,
        type: 'evolved',
        special: '魔法弹会弹射'
    },
    bloodAxe: {
        id: 'bloodAxe',
        name: '嗜血战斧',
        description: '每次攻击吸取生命',
        icon: '🪓',
        damage: 35,
        maxLevel: 1,
        type: 'evolved',
        special: '造成伤害的10%转化为生命'
    },
    inferno: {
        id: 'inferno',
        name: '炼狱之火',
        description: '召唤火焰风暴',
        icon: '🌋',
        damage: 40,
        maxLevel: 1,
        type: 'evolved',
        special: '对范围内所有敌人造成持续伤害'
    }
};

// ==================== 遗物系统 ====================
// 遗物在每局中通过Boss掉落或特定波数奖励获取，每个遗物只能持有一次
const RELICS = {
    bloodPendant: {
        name: '血色吊坠',
        icon: '💎',
        desc: '击杀敌人时恢复2%最大生命',
        rarity: 'common',
        onKill: (player, enemy) => {
            player.health = Math.min(player.health + player.maxHealth * 0.02, player.maxHealth);
        }
    },
    soulCatcher: {
        name: '灵魂捕手',
        icon: '👻',
        desc: '获得的经验增加25%',
        rarity: 'common',
        onEquip: (player) => {
            player.expBonus = (player.expBonus || 1) + 0.25;
        }
    },
    thornArmor: {
        name: '荆棘铠甲',
        icon: '🌿',
        desc: '受到伤害时反弹30%',
        rarity: 'common',
        onEquip: (player) => {
            player.counterAttack = (player.counterAttack || 0) + 0.3;
        }
    },
    swiftBoots: {
        name: '迅捷之靴',
        icon: '👢',
        desc: '移动速度+15%，冲刺冷却-1秒',
        rarity: 'common',
        onEquip: (player) => {
            player.speed *= 1.15;
            player.dashMaxCooldown = Math.max(500, player.dashMaxCooldown - 1000);
        }
    },
    berserkerHeart: {
        name: '狂战之心',
        icon: '🫀',
        desc: '攻击力+20%，但最大生命-15%',
        rarity: 'rare',
        onEquip: (player) => {
            player.attack *= 1.2;
            player.maxHealth = Math.floor(player.maxHealth * 0.85);
            player.health = Math.min(player.health, player.maxHealth);
        }
    },
    frozenOrb: {
        name: '冰封宝珠',
        icon: '🔮',
        desc: '攻击有20%概率冻结敌人1秒',
        rarity: 'rare',
        onHit: (player, enemy) => {
            if (Math.random() < 0.2 && !enemy.frozen) {
                enemy.frozen = true;
                enemy.originalSpeed = enemy.speed;
                enemy.speed = 0;
                addGameTimer(() => {
                    if (enemy.health > 0) {
                        enemy.frozen = false;
                        enemy.speed = enemy.originalSpeed || 1;
                    }
                }, 1000);
            }
        }
    },
    gamblersDice: {
        name: '赌徒骰子',
        icon: '🎲',
        desc: '暴击率+15%，暴击伤害+50%',
        rarity: 'rare',
        onEquip: (player) => {
            player.critChance = (player.critChance || 0) + 0.15;
            player.critDamage = (player.critDamage || 2) + 0.5;
        }
    },
    vampireFang: {
        name: '吸血鬼之牙',
        icon: '🦷',
        desc: '攻击吸取5%伤害为生命',
        rarity: 'rare',
        onEquip: (player) => {
            player.lifeSteal = (player.lifeSteal || 0) + 0.05;
        }
    },
    phoenixFeather: {
        name: '凤凰之羽',
        icon: '🪶',
        desc: '死亡时复活一次（50%生命）',
        rarity: 'legendary',
        onDeath: (player) => {
            if (!player.phoenixUsed) {
                player.phoenixUsed = true;
                player.health = Math.floor(player.maxHealth * 0.5);
                for (let i = 0; i < 20; i++) {
                    game.particles.push(new Particle(player.x, player.y, '#ff6b35'));
                }
                showDamageNumber(player.x, player.y - 30, '浴火重生!', '#ff6b35', true);
                return true;
            }
            return false;
        }
    },
    chronoShift: {
        name: '时间裂隙',
        icon: '⏳',
        desc: '攻击速度+30%，冲刺冷却-50%',
        rarity: 'legendary',
        onEquip: (player) => {
            player.attackCooldown = Math.floor((player.attackCooldown || 500) * 0.7);
            player.dashMaxCooldown = Math.floor(player.dashMaxCooldown * 0.5);
        }
    },
    dragonScale: {
        name: '龙鳞护甲',
        icon: '🐉',
        desc: '减伤+20%，每波开始恢复20%生命',
        rarity: 'legendary',
        onEquip: (player) => {
            player.damageReduction = (player.damageReduction || 0) + 0.2;
        },
        onWaveStart: (player) => {
            player.health = Math.min(player.health + player.maxHealth * 0.2, player.maxHealth);
        }
    },
    infinityGem: {
        name: '无尽宝石',
        icon: '💠',
        desc: '每击杀10个敌人，攻击力永久+1',
        rarity: 'legendary',
        onKill: (player, enemy) => {
            const relic = player.relics.find(r => r.id === 'infinityGem');
            if (relic) {
                relic._killCount = (relic._killCount || 0) + 1;
                if (relic._killCount >= 10) {
                    relic._killCount = 0;
                    player.attack += 1;
                    showDamageNumber(player.x, player.y - 20, 'ATK+1', '#ffd700', true);
                }
            }
        }
    }
};

// 遗物稀有度权重
const RELIC_RARITY_WEIGHTS = {
    common: 50,
    rare: 30,
    legendary: 15
};

// 获取随机遗物选项（排除已拥有的）
function getRandomRelicOptions(player, count = 3) {
    const ownedIds = (player.relics || []).map(r => r.id);
    const available = Object.entries(RELICS)
        .filter(([id]) => !ownedIds.includes(id))
        .map(([id, relic]) => ({ id, ...relic }));

    if (available.length === 0) return [];

    const weighted = [];
    available.forEach(relic => {
        const weight = RELIC_RARITY_WEIGHTS[relic.rarity] || 30;
        for (let i = 0; i < weight; i++) weighted.push(relic);
    });

    const selected = [];
    const usedIds = new Set();
    while (selected.length < count && selected.length < available.length) {
        const pick = weighted[Math.floor(Math.random() * weighted.length)];
        if (!usedIds.has(pick.id)) {
            usedIds.add(pick.id);
            selected.push(pick);
        }
    }
    return selected;
}

// 给玩家装备遗物
function equipRelic(player, relicId) {
    if (!player.relics) player.relics = [];
    const relicDef = RELICS[relicId];
    if (!relicDef) return false;
    if (player.relics.some(r => r.id === relicId)) return false;

    const relic = { id: relicId, ...relicDef };
    player.relics.push(relic);
    if (relic.onEquip) relic.onEquip(player);
    return true;
}
