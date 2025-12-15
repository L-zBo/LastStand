// ==================== 素材管理器 ====================

// 角色精灵图配置
const SPRITESHEET = {
    path: 'PNG/yDDd9O.png',
    spriteWidth: 16,
    spriteHeight: 16,
    cols: 10,
    rows: 6
};

// Boss精灵图配置 (2行5列，每个精灵大约32x32)
const BOSS_SPRITESHEET = {
    path: 'PNG/BOSS.png',
    spriteWidth: 32,
    spriteHeight: 32,
    cols: 5,
    rows: 2
};

// 武器道具精灵图配置 (6行10列，每个精灵16x16)
const WEAPON_SPRITESHEET = {
    path: 'PNG/工具武器.png',
    spriteWidth: 16,
    spriteHeight: 16,
    cols: 10,
    rows: 6
};

// 玩家角色在精灵图中的位置 (row, col)
const PLAYER_SPRITE_MAP = {
    warrior: { row: 0, col: 5, name: '战士' },     // 蓝色骑士
    mage: { row: 2, col: 5, name: '法师' },        // 紫色法师
    assassin: { row: 3, col: 3, name: '刺客' },    // 黑色忍者
    ranger: { row: 1, col: 7, name: '游侠' },      // 绿色弓手
    summoner: { row: 4, col: 2, name: '召唤师' }   // 蓝紫法师
};

// 敌人在精灵图中的位置
const ENEMY_SPRITE_MAP = {
    // 普通敌人
    normal: [
        { row: 0, col: 0 },  // 骷髅
        { row: 0, col: 2 },  // 绿色生物
        { row: 4, col: 0 },  // 蓝史莱姆
        { row: 5, col: 0 },  // 老鼠
        { row: 5, col: 1 },  // 蛇
    ],
    // 快速敌人
    fast: [
        { row: 2, col: 0 },  // 红色小怪
        { row: 3, col: 1 },  // 红色小鬼
        { row: 5, col: 2 },  // 黑猫
    ],
    // 坦克敌人
    tank: [
        { row: 2, col: 7 },  // 石头怪
        { row: 1, col: 3 },  // 绿皮兽人
        { row: 0, col: 4 },  // 绿色兽人
    ],
    // 精英敌人
    elite: [
        { row: 0, col: 3 },  // 红色恶魔
        { row: 2, col: 4 },  // 红角恶魔
        { row: 1, col: 4 },  // 橙色火人
        { row: 3, col: 7 },  // 小龙
    ],
    // 普通Boss（使用原精灵图）
    boss: [
        { row: 5, col: 7 },  // 蝙蝠怪
        { row: 0, col: 7 },  // 机器人
    ]
};

// Boss精灵图映射（使用BOSS.png）
const BOSS_SPRITE_MAP = {
    // 第一行Boss
    bear: { row: 0, col: 0, name: '红熊怪' },
    frog: { row: 0, col: 1, name: '青蛙王' },
    eyeball: { row: 0, col: 2, name: '眼球怪' },
    flame: { row: 0, col: 3, name: '火焰魔' },
    dragon: { row: 0, col: 4, name: '绿龙' },
    // 第二行Boss
    beetle: { row: 1, col: 0, name: '蓝甲虫' },
    spider: { row: 1, col: 1, name: '毒蜘蛛' },
    snake: { row: 1, col: 2, name: '蛇妖' },
    demon: { row: 1, col: 3, name: '独眼魔' },
    dragonHead: { row: 1, col: 4, name: '龙首' }
};

// Boss列表（按波数出现）
const BOSS_LIST = ['bear', 'frog', 'eyeball', 'flame', 'beetle', 'spider', 'snake', 'demon', 'dragonHead', 'dragon'];

// 武器精灵图映射（使用工具武器.png）
const WEAPON_SPRITE_MAP = {
    // 近战武器
    dagger: { row: 0, col: 0, name: '匕首' },
    sword: { row: 0, col: 1, name: '长剑' },
    axe: { row: 0, col: 5, name: '战斧' },
    holyBlade: { row: 0, col: 2, name: '圣剑' },
    shadowBlade: { row: 1, col: 1, name: '暗影刃' },
    bloodAxe: { row: 1, col: 5, name: '嗜血斧' },

    // 远程武器
    bow: { row: 1, col: 8, name: '弓' },
    phoenixBow: { row: 0, col: 8, name: '凤凰弓' },

    // 法杖
    staff: { row: 0, col: 4, name: '法杖' },
    arcaneStaff: { row: 1, col: 4, name: '奥术法杖' },
    fireball: { row: 2, col: 3, name: '火球杖' },
    inferno: { row: 2, col: 4, name: '炼狱杖' }
};

// 道具精灵图映射
const ITEM_SPRITE_MAP = {
    // 药水
    healthPotion: { row: 4, col: 0, name: '生命药水' },
    manaPotion: { row: 4, col: 1, name: '魔法药水' },

    // 宝石
    ruby: { row: 3, col: 6, name: '红宝石' },
    emerald: { row: 3, col: 7, name: '绿宝石' },
    sapphire: { row: 3, col: 8, name: '蓝宝石' },
    diamond: { row: 3, col: 9, name: '钻石' },

    // 钥匙和金币
    key: { row: 5, col: 0, name: '钥匙' },
    coin: { row: 5, col: 9, name: '金币' },
    coinBag: { row: 4, col: 9, name: '钱袋' },

    // 其他道具
    scroll: { row: 2, col: 9, name: '卷轴' },
    bomb: { row: 0, col: 6, name: '炸弹' },
    shield: { row: 2, col: 7, name: '盾牌' },
    helmet: { row: 2, col: 8, name: '头盔' },
    ring: { row: 4, col: 6, name: '戒指' },
    necklace: { row: 4, col: 7, name: '项链' }
};

// 精灵图加载状态
let spritesheetImage = null;
let spritesheetLoaded = false;
let bossSpritesheetImage = null;
let bossSpritesheetLoaded = false;
let weaponSpritesheetImage = null;
let weaponSpritesheetLoaded = false;

// 预加载单个精灵图
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load: ${src}`));
        img.src = src;
    });
}

// 预加载所有精灵图
function preloadAllSpritesheets(callback) {
    let loadedCount = 0;
    const totalCount = 3;

    function checkComplete() {
        loadedCount++;
        if (loadedCount >= totalCount) {
            console.log('所有精灵图加载完成');
            if (callback) callback(true);
        }
    }

    // 加载角色精灵图
    loadImage(SPRITESHEET.path)
        .then(img => {
            spritesheetImage = img;
            spritesheetLoaded = true;
            console.log('角色精灵图加载成功');
            checkComplete();
        })
        .catch(() => {
            console.warn('角色精灵图加载失败');
            checkComplete();
        });

    // 加载Boss精灵图
    loadImage(BOSS_SPRITESHEET.path)
        .then(img => {
            bossSpritesheetImage = img;
            bossSpritesheetLoaded = true;
            console.log('Boss精灵图加载成功');
            checkComplete();
        })
        .catch(() => {
            console.warn('Boss精灵图加载失败');
            checkComplete();
        });

    // 加载武器精灵图
    loadImage(WEAPON_SPRITESHEET.path)
        .then(img => {
            weaponSpritesheetImage = img;
            weaponSpritesheetLoaded = true;
            console.log('武器精灵图加载成功');
            checkComplete();
        })
        .catch(() => {
            console.warn('武器精灵图加载失败');
            checkComplete();
        });
}

// 从角色精灵图绘制
function drawSpriteFromSheet(ctx, row, col, x, y, width, height) {
    if (!spritesheetLoaded || !spritesheetImage) {
        return false;
    }

    const srcX = col * SPRITESHEET.spriteWidth;
    const srcY = row * SPRITESHEET.spriteHeight;

    ctx.drawImage(
        spritesheetImage,
        srcX, srcY,
        SPRITESHEET.spriteWidth, SPRITESHEET.spriteHeight,
        x, y,
        width, height
    );

    return true;
}

// 从Boss精灵图绘制
function drawBossSpriteFromSheet(ctx, row, col, x, y, width, height) {
    if (!bossSpritesheetLoaded || !bossSpritesheetImage) {
        return false;
    }

    const srcX = col * BOSS_SPRITESHEET.spriteWidth;
    const srcY = row * BOSS_SPRITESHEET.spriteHeight;

    ctx.drawImage(
        bossSpritesheetImage,
        srcX, srcY,
        BOSS_SPRITESHEET.spriteWidth, BOSS_SPRITESHEET.spriteHeight,
        x, y,
        width, height
    );

    return true;
}

// 从武器精灵图绘制
function drawWeaponSpriteFromSheet(ctx, row, col, x, y, width, height) {
    if (!weaponSpritesheetLoaded || !weaponSpritesheetImage) {
        return false;
    }

    const srcX = col * WEAPON_SPRITESHEET.spriteWidth;
    const srcY = row * WEAPON_SPRITESHEET.spriteHeight;

    ctx.drawImage(
        weaponSpritesheetImage,
        srcX, srcY,
        WEAPON_SPRITESHEET.spriteWidth, WEAPON_SPRITESHEET.spriteHeight,
        x, y,
        width, height
    );

    return true;
}

// 绘制玩家精灵
function drawPlayerSprite(ctx, className, x, y, width, height) {
    const spriteInfo = PLAYER_SPRITE_MAP[className];
    if (!spriteInfo) {
        return false;
    }

    return drawSpriteFromSheet(ctx, spriteInfo.row, spriteInfo.col, x, y, width, height);
}

// 绘制敌人精灵
function drawEnemySprite(ctx, enemyType, enemyId, x, y, width, height) {
    const sprites = ENEMY_SPRITE_MAP[enemyType];
    if (!sprites || sprites.length === 0) {
        return false;
    }

    // 根据敌人ID选择一个固定的精灵（保持一致性）
    const index = enemyId % sprites.length;
    const spriteInfo = sprites[index];

    return drawSpriteFromSheet(ctx, spriteInfo.row, spriteInfo.col, x, y, width, height);
}

// 绘制Boss精灵（使用BOSS.png）
function drawBossSprite(ctx, bossType, x, y, width, height) {
    const spriteInfo = BOSS_SPRITE_MAP[bossType];
    if (!spriteInfo) {
        return false;
    }

    return drawBossSpriteFromSheet(ctx, spriteInfo.row, spriteInfo.col, x, y, width, height);
}

// 根据波数获取Boss类型
function getBossTypeByWave(waveNumber) {
    const index = (waveNumber - 1) % BOSS_LIST.length;
    return BOSS_LIST[index];
}

// 绘制武器精灵
function drawWeaponSprite(ctx, weaponId, x, y, width, height) {
    const spriteInfo = WEAPON_SPRITE_MAP[weaponId];
    if (!spriteInfo) {
        return false;
    }

    return drawWeaponSpriteFromSheet(ctx, spriteInfo.row, spriteInfo.col, x, y, width, height);
}

// 绘制道具精灵
function drawItemSprite(ctx, itemId, x, y, width, height) {
    const spriteInfo = ITEM_SPRITE_MAP[itemId];
    if (!spriteInfo) {
        return false;
    }

    return drawWeaponSpriteFromSheet(ctx, spriteInfo.row, spriteInfo.col, x, y, width, height);
}

// 获取随机敌人精灵位置
function getRandomEnemySprite(enemyType) {
    const sprites = ENEMY_SPRITE_MAP[enemyType];
    if (!sprites || sprites.length === 0) {
        return null;
    }
    return sprites[Math.floor(Math.random() * sprites.length)];
}

// 检查精灵图是否可用
function isSpritesheetReady() {
    return spritesheetLoaded && spritesheetImage;
}

function isBossSpritesheetReady() {
    return bossSpritesheetLoaded && bossSpritesheetImage;
}

function isWeaponSpritesheetReady() {
    return weaponSpritesheetLoaded && weaponSpritesheetImage;
}

// ==================== 素材预加载入口 ====================

// 素材是否可用的标志
let assetsEnabled = false;

// 预加载所有素材
function preloadAssets(callback) {
    preloadAllSpritesheets((success) => {
        assetsEnabled = success;
        if (callback) callback();
    });
}
