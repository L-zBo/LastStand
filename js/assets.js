// ==================== 素材管理器 ====================

// 精灵图配置
const SPRITESHEET = {
    path: 'PNG/yDDd9O.png',
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
    // Boss
    boss: [
        { row: 5, col: 7 },  // 蝙蝠怪
        { row: 0, col: 7 },  // 机器人
    ]
};

// 精灵图加载状态
let spritesheetImage = null;
let spritesheetLoaded = false;

// 预加载精灵图
function preloadSpritesheet(callback) {
    spritesheetImage = new Image();

    spritesheetImage.onload = () => {
        spritesheetLoaded = true;
        console.log('精灵图加载成功');
        if (callback) callback(true);
    };

    spritesheetImage.onerror = () => {
        console.warn('精灵图加载失败，将使用默认渲染');
        spritesheetLoaded = false;
        if (callback) callback(false);
    };

    spritesheetImage.src = SPRITESHEET.path;
}

// 从精灵图绘制单个精灵
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

// ==================== 旧的素材系统（兼容）====================

// 素材配置（保留用于未来扩展）
const ASSETS = {
    players: {},
    enemies: {},
    effects: {},
    weapons: {}
};

// 已加载的素材缓存
const loadedAssets = {
    players: {},
    enemies: {},
    effects: {},
    weapons: {}
};

// 素材是否可用的标志
let assetsEnabled = false;

// 预加载所有素材（包括精灵图）
function preloadAssets(callback) {
    // 首先加载精灵图
    preloadSpritesheet((success) => {
        assetsEnabled = success;
        if (callback) callback();
    });
}

// 获取素材
function getAsset(category, name) {
    if (loadedAssets[category] && loadedAssets[category][name]) {
        return loadedAssets[category][name];
    }
    return null;
}

// 绘制精灵（带回退到形状渲染）
function drawSprite(ctx, category, name, x, y, width, height, options = {}) {
    // 优先使用精灵图
    if (category === 'players' && isSpritesheetReady()) {
        return drawPlayerSprite(ctx, name, x, y, width, height);
    }

    // 回退到单独的素材文件
    const sprite = getAsset(category, name);
    if (sprite && assetsEnabled) {
        ctx.save();
        if (options.rotation) {
            ctx.translate(x + width/2, y + height/2);
            ctx.rotate(options.rotation);
            ctx.drawImage(sprite, -width/2, -height/2, width, height);
        } else {
            ctx.drawImage(sprite, x, y, width, height);
        }
        ctx.restore();
        return true;
    }

    return false;
}

// 检查素材是否已加载
function isAssetLoaded(category, name) {
    return !!(loadedAssets[category] && loadedAssets[category][name]);
}
