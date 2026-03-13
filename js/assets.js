// ==================== 素材管理器 ====================

// 素材路径配置
const ASSET_PATHS = {
    players: 'assets/players/',
    enemies: 'assets/enemies/',
    bosses: 'assets/bosses/',
    weapons: 'assets/weapons/',
    items: 'assets/items/'
};

// 玩家角色配置 - 扩充到8个职业
const PLAYER_ASSETS = {
    warrior: { file: 'warrior.png', name: '战士' },
    mage: { file: 'mage.png', name: '法师' },
    assassin: { file: 'assassin.png', name: '刺客' },
    ranger: { file: 'ranger.png', name: '游侠' },
    summoner: { file: 'summoner.png', name: '召唤师' },
    knight: { file: 'knight.png', name: '骑士' },
    paladin: { file: 'paladin.png', name: '圣骑士' },
    necromancer: { file: 'necromancer.png', name: '死灵法师' }
};

// 敌人配置 - 扩充到84种敌人（含56个新怪物）
const ENEMY_ASSETS = {
    normal: [
        { id: 'skeleton', file: 'skeleton.png', name: '骷髅' },
        { id: 'greenBlob', file: 'greenBlob.png', name: '绿色史莱姆' },
        { id: 'blueSlime', file: 'blueSlime.png', name: '蓝色史莱姆' },
        { id: 'rat', file: 'rat.png', name: '老鼠' },
        { id: 'snake', file: 'snake.png', name: '毒蛇' },
        { id: 'bat', file: 'bat.png', name: '蝙蝠' },
        { id: 'spider', file: 'spider.png', name: '蜘蛛' },
        { id: 'zombie', file: 'zombie.png', name: '僵尸' },
        { id: 'monster_03', file: 'monster_03.png', name: '蓝触角怪' },
        { id: 'monster_04', file: 'monster_04.png', name: '绿花怪' },
        { id: 'monster_08', file: 'monster_08.png', name: '绿毛球' },
        { id: 'monster_10', file: 'monster_10.png', name: '蛋壳小鸡' },
        { id: 'monster_16', file: 'monster_16.png', name: '云绵羊' },
        { id: 'monster_17', file: 'monster_17.png', name: '绿水滴' },
        { id: 'monster_19', file: 'monster_19.png', name: '雪猫' },
        { id: 'monster_20', file: 'monster_20.png', name: '蓝毛球' },
        { id: 'monster_21', file: 'monster_21.png', name: '蜗牛' },
        { id: 'monster_22', file: 'monster_22.png', name: '蜡烛鬼' },
        { id: 'monster_32', file: 'monster_32.png', name: '青猫' },
        { id: 'monster_37', file: 'monster_37.png', name: '萌芽怪' },
        { id: 'monster_46', file: 'monster_46.png', name: '蘑菇怪' },
        { id: 'monster_50', file: 'monster_50.png', name: '金虫' },
        { id: 'monster_52', file: 'monster_52.png', name: '绿外星人' },
        { id: 'monster_56', file: 'monster_56.png', name: '毛毛虫' }
    ],
    fast: [
        { id: 'redImp', file: 'redImp.png', name: '红色小鬼' },
        { id: 'redDevil', file: 'redDevil.png', name: '红色恶魔' },
        { id: 'blackCat', file: 'blackCat.png', name: '黑猫' },
        { id: 'wolf', file: 'wolf.png', name: '灰狼' },
        { id: 'ghost', file: 'ghost.png', name: '幽灵' },
        { id: 'shadowFiend', file: 'shadowFiend.png', name: '暗影魔' },
        { id: 'monster_06', file: 'monster_06.png', name: '黑刺客' },
        { id: 'monster_07', file: 'monster_07.png', name: '绿飞龙' },
        { id: 'monster_09', file: 'monster_09.png', name: '飞鸟怪' },
        { id: 'monster_14', file: 'monster_14.png', name: '翼龙' },
        { id: 'monster_18', file: 'monster_18.png', name: '红狐' },
        { id: 'monster_27', file: 'monster_27.png', name: '蓝海豚' },
        { id: 'monster_29', file: 'monster_29.png', name: '拳击袋鼠' },
        { id: 'monster_30', file: 'monster_30.png', name: '蓝鲸' },
        { id: 'monster_34', file: 'monster_34.png', name: '小恐龙' },
        { id: 'monster_38', file: 'monster_38.png', name: '金鱼怪' },
        { id: 'monster_39', file: 'monster_39.png', name: '紫鸟' },
        { id: 'monster_48', file: 'monster_48.png', name: '浣熊' },
        { id: 'monster_55', file: 'monster_55.png', name: '双头怪' }
    ],
    tank: [
        { id: 'stoneGolem', file: 'stoneGolem.png', name: '石头傀儡' },
        { id: 'orc', file: 'orc.png', name: '兽人战士' },
        { id: 'greenOrc', file: 'greenOrc.png', name: '绿皮兽人' },
        { id: 'troll', file: 'troll.png', name: '巨魔' },
        { id: 'ogre', file: 'ogre.png', name: '食人魔' },
        { id: 'ironGolem', file: 'ironGolem.png', name: '铁傀儡' },
        { id: 'monster_01', file: 'monster_01.png', name: '黄色大块头' },
        { id: 'monster_05', file: 'monster_05.png', name: '蓝龙兽' },
        { id: 'monster_12', file: 'monster_12.png', name: '火甲虫' },
        { id: 'monster_13', file: 'monster_13.png', name: '紫犀牛' },
        { id: 'monster_23', file: 'monster_23.png', name: '海狸熊' },
        { id: 'monster_25', file: 'monster_25.png', name: '暗刺球' },
        { id: 'monster_35', file: 'monster_35.png', name: '棕河马' },
        { id: 'monster_36', file: 'monster_36.png', name: '橙恐龙' },
        { id: 'monster_41', file: 'monster_41.png', name: '岩石巨人' },
        { id: 'monster_42', file: 'monster_42.png', name: '泥鳄' },
        { id: 'monster_43', file: 'monster_43.png', name: '黑野牛' },
        { id: 'monster_44', file: 'monster_44.png', name: '青龙' },
        { id: 'monster_51', file: 'monster_51.png', name: '甲壳兽' }
    ],
    elite: [
        { id: 'demon', file: 'demon.png', name: '恶魔' },
        { id: 'hornedDemon', file: 'hornedDemon.png', name: '角魔' },
        { id: 'fireMan', file: 'fireMan.png', name: '火焰元素' },
        { id: 'smallDragon', file: 'smallDragon.png', name: '幼龙' },
        { id: 'darkKnight', file: 'darkKnight.png', name: '黑暗骑士' },
        { id: 'lich', file: 'lich.png', name: '巫妖' },
        { id: 'vampire', file: 'vampire.png', name: '吸血鬼' },
        { id: 'warlock', file: 'warlock.png', name: '术士' },
        { id: 'monster_02', file: 'monster_02.png', name: '机械蜂' },
        { id: 'monster_11', file: 'monster_11.png', name: '海龙' },
        { id: 'monster_15', file: 'monster_15.png', name: '瓢虫骑士' },
        { id: 'monster_24', file: 'monster_24.png', name: '猫头鹰' },
        { id: 'monster_26', file: 'monster_26.png', name: '眼镜蛇' },
        { id: 'monster_28', file: 'monster_28.png', name: '触手九头蛇' },
        { id: 'monster_31', file: 'monster_31.png', name: '钢铁机器人' },
        { id: 'monster_33', file: 'monster_33.png', name: '银甲骑士' },
        { id: 'monster_40', file: 'monster_40.png', name: '幽冥鬼火' },
        { id: 'monster_45', file: 'monster_45.png', name: '蝠翼怪' },
        { id: 'monster_47', file: 'monster_47.png', name: '梦魇马' },
        { id: 'monster_49', file: 'monster_49.png', name: '白龙' },
        { id: 'monster_53', file: 'monster_53.png', name: '灰蜘蛛' },
        { id: 'monster_54', file: 'monster_54.png', name: '赤龙' }
    ]
};

// Boss配置
const BOSS_ASSETS = {
    bear: { file: 'bear.png', name: '红熊怪' },
    frog: { file: 'frog.png', name: '青蛙王' },
    eyeball: { file: 'eyeball.png', name: '眼球怪' },
    flame: { file: 'flame.png', name: '火焰魔' },
    dragon: { file: 'dragon.png', name: '巨龙' },
    beetle: { file: 'beetle.png', name: '蓝甲虫' },
    snakeBoss: { file: 'snakeBoss.png', name: '蛇妖' },
    oneEyeDemon: { file: 'oneEyeDemon.png', name: '独眼魔' },
    stoneGiant: { file: 'stoneGiant.png', name: '岩石巨人' },
    hydra: { file: 'hydra.png', name: '九头蛇' },
    rhinoDemon: { file: 'rhinoDemon.png', name: '犀牛魔' },
    nightmareSteed: { file: 'nightmareSteed.png', name: '梦魇兽' }
};

// Boss出场顺序（每10波一个Boss，dragon作为最终Boss）
const BOSS_ORDER = ['bear', 'frog', 'eyeball', 'flame', 'beetle', 'snakeBoss', 'oneEyeDemon', 'stoneGiant', 'hydra', 'rhinoDemon', 'nightmareSteed', 'dragon'];

// 武器配置 - 扩充到27种武器
const WEAPON_ASSETS = {
    // 近战武器
    dagger: { file: 'dagger.png', name: '匕首' },
    sword: { file: 'sword.png', name: '长剑' },
    holyBlade: { file: 'holyBlade.png', name: '圣剑' },
    axe: { file: 'axe.png', name: '战斧' },
    shadowBlade: { file: 'shadowBlade.png', name: '暗影刃' },
    bloodAxe: { file: 'bloodAxe.png', name: '嗜血斧' },
    hammer: { file: 'hammer.png', name: '战锤' },
    spear: { file: 'spear.png', name: '长矛' },
    scythe: { file: 'scythe.png', name: '死神镰刀' },
    katana: { file: 'katana.png', name: '武士刀' },

    // 法杖
    staff: { file: 'staff.png', name: '法杖' },
    arcaneStaff: { file: 'arcaneStaff.png', name: '奥术法杖' },
    fireball: { file: 'fireball.png', name: '火球杖' },
    inferno: { file: 'inferno.png', name: '炼狱杖' },
    iceStaff: { file: 'iceStaff.png', name: '冰霜法杖' },
    lightningStaff: { file: 'lightningStaff.png', name: '雷电法杖' },
    necroStaff: { file: 'necroStaff.png', name: '死灵法杖' },

    // 远程武器
    bow: { file: 'bow.png', name: '弓' },
    phoenixBow: { file: 'phoenixBow.png', name: '凤凰弓' },
    crossbow: { file: 'crossbow.png', name: '弩' },
    longbow: { file: 'longbow.png', name: '长弓' },

    // 特殊武器
    wand: { file: 'wand.png', name: '魔杖' },
    scepter: { file: 'scepter.png', name: '权杖' },
    orb: { file: 'orb.png', name: '魔法球' },
    tome: { file: 'tome.png', name: '魔法书' },
    whip: { file: 'whip.png', name: '鞭子' }
};

// 道具配置 - 扩充到40种道具
const ITEM_ASSETS = {
    // 药水
    healthPotion: { file: 'healthPotion.png', name: '生命药水' },
    manaPotion: { file: 'manaPotion.png', name: '魔法药水' },
    speedPotion: { file: 'speedPotion.png', name: '速度药水' },
    strengthPotion: { file: 'strengthPotion.png', name: '力量药水' },
    poisonPotion: { file: 'poisonPotion.png', name: '毒药' },

    // 宝石
    ruby: { file: 'ruby.png', name: '红宝石' },
    emerald: { file: 'emerald.png', name: '绿宝石' },
    sapphire: { file: 'sapphire.png', name: '蓝宝石' },
    diamond: { file: 'diamond.png', name: '钻石' },
    amethyst: { file: 'amethyst.png', name: '紫水晶' },
    topaz: { file: 'topaz.png', name: '黄玉' },

    // 货币
    coin: { file: 'coin.png', name: '金币' },
    coinBag: { file: 'coinBag.png', name: '钱袋' },
    goldBar: { file: 'goldBar.png', name: '金条' },

    // 钥匙和卷轴
    key: { file: 'key.png', name: '钥匙' },
    goldenKey: { file: 'goldenKey.png', name: '金钥匙' },
    scroll: { file: 'scroll.png', name: '卷轴' },
    magicScroll: { file: 'magicScroll.png', name: '魔法卷轴' },

    // 装备
    shield: { file: 'shield.png', name: '盾牌' },
    helmet: { file: 'helmet.png', name: '头盔' },
    ring: { file: 'ring.png', name: '戒指' },
    necklace: { file: 'necklace.png', name: '项链' },
    amulet: { file: 'amulet.png', name: '护身符' },
    gloves: { file: 'gloves.png', name: '手套' },
    boots: { file: 'boots.png', name: '靴子' },
    armor: { file: 'armor.png', name: '铠甲' },
    cape: { file: 'cape.png', name: '披风' },

    // 其他道具
    bomb: { file: 'bomb.png', name: '炸弹' },
    torch: { file: 'torch.png', name: '火把' },
    map: { file: 'map.png', name: '地图' },
    compass: { file: 'compass.png', name: '指南针' },
    hourglass: { file: 'hourglass.png', name: '沙漏' },
    crystal: { file: 'crystal.png', name: '水晶' },
    skull: { file: 'skull.png', name: '骷髅头' },
    heart: { file: 'heart.png', name: '心脏' },
    feather: { file: 'feather.png', name: '羽毛' },
    bone: { file: 'bone.png', name: '骨头' }
};

// 已加载的图片缓存
const loadedImages = {
    players: {},
    enemies: {},
    bosses: {},
    weapons: {},
    items: {}
};

// 加载状态
let assetsLoaded = false;
let loadedCount = 0;
let totalAssets = 0;

// 加载单个图片
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null); // 加载失败返回null而非reject
        img.src = src;
    });
}

// 预加载所有素材
async function preloadAssets(callback) {

    // 计算总数
    totalAssets = Object.keys(PLAYER_ASSETS).length +
        Object.values(ENEMY_ASSETS).flat().length +
        Object.keys(BOSS_ASSETS).length +
        Object.keys(WEAPON_ASSETS).length +
        Object.keys(ITEM_ASSETS).length;

    const promises = [];

    // 加载玩家素材
    for (const [id, config] of Object.entries(PLAYER_ASSETS)) {
        promises.push(
            loadImage(ASSET_PATHS.players + config.file).then(img => {
                if (img) loadedImages.players[id] = img;
                loadedCount++;
            })
        );
    }

    // 加载敌人素材
    for (const type of Object.keys(ENEMY_ASSETS)) {
        for (const enemy of ENEMY_ASSETS[type]) {
            promises.push(
                loadImage(ASSET_PATHS.enemies + enemy.file).then(img => {
                    if (img) loadedImages.enemies[enemy.id] = img;
                    loadedCount++;
                })
            );
        }
    }

    // 加载Boss素材
    for (const [id, config] of Object.entries(BOSS_ASSETS)) {
        promises.push(
            loadImage(ASSET_PATHS.bosses + config.file).then(img => {
                if (img) loadedImages.bosses[id] = img;
                loadedCount++;
            })
        );
    }

    // 加载武器素材
    for (const [id, config] of Object.entries(WEAPON_ASSETS)) {
        promises.push(
            loadImage(ASSET_PATHS.weapons + config.file).then(img => {
                if (img) loadedImages.weapons[id] = img;
                loadedCount++;
            })
        );
    }

    // 加载道具素材
    for (const [id, config] of Object.entries(ITEM_ASSETS)) {
        promises.push(
            loadImage(ASSET_PATHS.items + config.file).then(img => {
                if (img) loadedImages.items[id] = img;
                loadedCount++;
            })
        );
    }

    await Promise.all(promises);

    assetsLoaded = true;

    if (callback) callback();
}

// ==================== 绘制函数 ====================

// 绘制玩家精灵
function drawPlayerSprite(ctx, classType, x, y, width, height) {
    const img = loadedImages.players[classType];
    if (img) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, x, y, width, height);
        return true;
    }
    return false;
}

// 敌人类型素材映射（没有专属素材的类型复用已有类型）
const ENEMY_TYPE_FALLBACK = {
    ranged: 'normal',
    splitter: 'tank',
    splitter_child: 'fast'
};

// 绘制敌人精灵
function drawEnemySprite(ctx, enemyType, enemyId, x, y, width, height) {
    const resolvedType = ENEMY_TYPE_FALLBACK[enemyType] || enemyType;
    const enemies = ENEMY_ASSETS[resolvedType];
    if (!enemies || enemies.length === 0) return false;

    // 根据ID选择一个固定的敌人图片
    const index = enemyId % enemies.length;
    const enemyConfig = enemies[index];
    const img = loadedImages.enemies[enemyConfig.id];

    if (img) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, x, y, width, height);
        return true;
    }
    return false;
}

// 绘制Boss精灵
function drawBossSprite(ctx, bossType, x, y, width, height) {
    const img = loadedImages.bosses[bossType];
    if (img) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, x, y, width, height);
        return true;
    }
    return false;
}

// 根据波数获取Boss类型（每10波出一个Boss，按顺序轮换）
function getBossTypeByWave(waveNumber) {
    const bossIndex = Math.floor(waveNumber / 10) - 1;
    const index = ((bossIndex % BOSS_ORDER.length) + BOSS_ORDER.length) % BOSS_ORDER.length;
    return BOSS_ORDER[index];
}

// 绘制武器精灵
function drawWeaponSprite(ctx, weaponId, x, y, width, height) {
    const img = loadedImages.weapons[weaponId];
    if (img) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, x, y, width, height);
        return true;
    }
    return false;
}

// 绘制道具精灵
function drawItemSprite(ctx, itemId, x, y, width, height) {
    const img = loadedImages.items[itemId];
    if (img) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, x, y, width, height);
        return true;
    }
    return false;
}

// ==================== 辅助函数 ====================

// 检查素材是否已加载
function isAssetLoaded(category, id) {
    return !!(loadedImages[category] && loadedImages[category][id]);
}

// 获取加载进度
function getLoadProgress() {
    return {
        loaded: loadedCount,
        total: totalAssets,
        percentage: totalAssets > 0 ? Math.floor((loadedCount / totalAssets) * 100) : 0
    };
}

// 检查是否所有素材都已加载
function areAssetsReady() {
    return assetsLoaded;
}
